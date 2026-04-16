# Architecture Research — OPEN-LEDGER

**Researched:** 2026-04-15
**Confidence overall:** HIGH (stack decisions already fixed; patterns well-established)

---

## System Components

### Component Map

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│  React Client Components (interatividade, formulários)   │
└──────────────────┬──────────────────────────────────────┘
                   │  HTTP / Server Actions / fetch
┌──────────────────▼──────────────────────────────────────┐
│               Next.js App Router (Server)                │
│                                                          │
│  ┌─────────────────┐    ┌──────────────────────────┐    │
│  │  React Server   │    │     Server Actions        │    │
│  │  Components     │    │  (mutations: CRUD,        │    │
│  │  (leitura RSC)  │    │   import, fatura, pag.)   │    │
│  └────────┬────────┘    └──────────┬───────────────┘    │
│           │                        │                     │
│  ┌────────▼────────────────────────▼──────────────┐     │
│  │           Supabase JS Client (server-side)      │     │
│  │  createServerClient() com session cookie        │     │
│  └────────────────────────┬───────────────────────┘     │
└───────────────────────────│─────────────────────────────┘
                            │  Supabase API (HTTPS)
┌───────────────────────────▼─────────────────────────────┐
│                  Supabase (Backend)                      │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Auth       │  │  PostgREST   │  │  Postgres      │  │
│  │  (Google    │  │  (API auto)  │  │  + RLS         │  │
│  │   OAuth)    │  │              │  │  Policies      │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Responsabilidades por Componente

| Componente | Responsabilidade | Não faz |
|---|---|---|
| RSC (React Server Components) | Leitura de dados, renderização inicial, dashboards | Mutações, estado interativo |
| Server Actions | Todas as mutações (criar conta, lançar transação, fechar fatura) | Expor endpoints externos |
| Route Handlers (API routes) | Somente webhooks externos, se houver | Mutações internas do app |
| Supabase Auth | Login Google OAuth, JWT, session management | Lógica de negócio |
| Postgres + RLS | Persistência, isolamento por `user_id`, queries de agregação | Lógica de apresentação |

---

## Data Model Outline

### Entidades Principais

```
users (gerenciado pelo Supabase Auth — tabela auth.users)
  └── profiles (user_id FK → 1:1, configurações do usuário)

accounts (contas bancárias, carteiras, cartões de crédito)
  ├── user_id FK
  ├── type: ENUM('bank', 'wallet', 'credit_card')
  ├── name, balance (atual), currency ('BRL')
  └── credit_card_settings (closing_day, due_day) — nullable, só para cartão

transactions (lançamentos financeiros)
  ├── user_id FK
  ├── account_id FK
  ├── amount (integer, centavos — evita ponto flutuante)
  ├── type: ENUM('income', 'expense')
  ├── description, date, paid (boolean)
  ├── installment_group_id FK nullable (agrupa parcelas)
  └── installment_number, installment_total nullable

installment_groups (compras parceladas)
  ├── user_id FK
  ├── description, total_amount, num_installments
  └── account_id FK (cartão que fez a compra)

invoices (faturas do cartão de crédito)
  ├── user_id FK
  ├── account_id FK (deve ser credit_card)
  ├── period_start, period_end (datas da fatura)
  ├── due_date, total_amount
  ├── status: ENUM('open', 'closed', 'paid')
  └── payment_transaction_id FK nullable (transação de pagamento)

tags
  ├── user_id FK
  └── name, color

transaction_tags (N:N)
  ├── transaction_id FK
  └── tag_id FK
```

### Decisões de Schema

- **Valores monetários como INTEGER (centavos):** Evita erros de ponto flutuante. R$ 1.234,56 → 123456. Consenso da indústria financeira (HIGH confidence).
- **`user_id` em todas as tabelas:** Permite RLS simples e direto; sem tabela intermediária de tenant.
- **`paid` boolean na transação:** Despesas de cartão nascem com `paid = false`; marcadas `paid = true` quando a fatura é paga.
- **`installment_group_id` na transação:** Cada parcela é uma transação independente (simplifica filtros por período), mas ligadas ao grupo para edição/exclusão em lote.

---

## Credit Card & Installment Model

### O Problema Brasileiro de Parcelamento

No Brasil, parcelamento no cartão é um fluxo core: uma compra de R$ 1.200 vira 12 × R$ 100, cada parcela caindo em uma fatura diferente.

### Modelo Recomendado: Parcelas como Transações Independentes

```sql
-- 1. Grupo de parcelamento (compra original)
CREATE TABLE installment_groups (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id),
  account_id      uuid NOT NULL REFERENCES accounts(id),
  description     text NOT NULL,
  total_amount    integer NOT NULL,   -- centavos
  num_installments integer NOT NULL,
  created_at      timestamptz DEFAULT now()
);

-- 2. Cada parcela = uma transação com referência ao grupo
-- As transações são inseridas com date = data de cada vencimento
-- Ex: compra em jan/2026 com 3x → transações em jan, fev, mar/2026
```

**Fluxo de criação:**
1. Usuário lança compra parcelada: descrição "iPhone 15", R$ 3.600, 12×, cartão Nubank.
2. Server Action cria 1 registro em `installment_groups`.
3. Server Action insere 12 transações em `transactions`, cada uma com:
   - `amount = 30000` (R$ 300 em centavos)
   - `date = closing_date + N meses` (data da fatura onde cai)
   - `paid = false`
   - `installment_group_id = grupo.id`
   - `installment_number = N` (1 a 12)

**Por que parcelas como transações independentes (não em tabela separada):**
- Filtros por período (`WHERE date BETWEEN ...`) funcionam naturalmente
- Cada parcela aparece na fatura correta sem joins complexos
- Edição de uma parcela isolada é simples
- Relatórios mensais não precisam de lógica especial

### Fatura (Invoice) Model

```sql
CREATE TABLE invoices (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES auth.users(id),
  account_id            uuid NOT NULL REFERENCES accounts(id),
  period_start          date NOT NULL,
  period_end            date NOT NULL,
  due_date              date NOT NULL,
  total_amount          integer NOT NULL DEFAULT 0,
  status                text NOT NULL DEFAULT 'open'
                          CHECK (status IN ('open', 'closed', 'paid')),
  payment_transaction_id uuid REFERENCES transactions(id),
  created_at            timestamptz DEFAULT now()
);
```

**Fluxo de fatura:**
1. Fatura `open`: agrupa transações do cartão no período (calculado dinamicamente via query, não desnormalizado).
2. Usuário fecha fatura manualmente → `status = 'closed'`.
3. Usuário paga fatura → Server Action:
   a. Cria transação de débito na conta bancária (ex: Nubank Fev/2026 — R$ 1.200)
   b. Cria transação de crédito/quitação no cartão
   c. Marca todas as transações da fatura como `paid = true`
   d. Atualiza `invoices.status = 'paid'` e `payment_transaction_id`

**Cálculo do total da fatura (query dinâmica):**
```sql
SELECT SUM(amount) FROM transactions
WHERE account_id = $card_id
  AND date BETWEEN $period_start AND $period_end
  AND type = 'expense';
```

---

## RLS Multi-user Pattern

### Padrão Recomendado: User-Owned Rows (Padrão 1)

Para OPEN-LEDGER, o isolamento é individual (cada usuário vê só seus dados). O padrão mais simples e seguro:

```sql
-- Habilitar RLS em todas as tabelas de dados
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_tags ENABLE ROW LEVEL SECURITY;

-- Template de política para cada tabela (repete o padrão)
CREATE POLICY "users_select_own"   ON accounts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users_insert_own"   ON accounts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "users_update_own"   ON accounts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "users_delete_own"   ON accounts FOR DELETE USING (user_id = auth.uid());
```

### Otimização de Performance

```sql
-- Usar subquery escalar para evitar reavaliação por linha
USING ((SELECT auth.uid()) = user_id)

-- Indexar user_id em todas as tabelas
CREATE INDEX ON accounts(user_id);
CREATE INDEX ON transactions(user_id);
CREATE INDEX ON transactions(account_id, date);  -- para filtros de fatura
```

### `transaction_tags` — Tabela de Junção

A tabela `transaction_tags` não tem `user_id` diretamente. Duas opções:

**Opção A (recomendada):** Política via JOIN:
```sql
CREATE POLICY "users_manage_own_tags"
ON transaction_tags FOR ALL
USING (
  transaction_id IN (
    SELECT id FROM transactions WHERE user_id = (SELECT auth.uid())
  )
);
```

**Opção B:** Desnormalizar `user_id` em `transaction_tags` (mais performático, mais redundante).

→ Preferir Opção A para manter schema limpo; Opção B se performance se mostrar crítica.

### Regra de Ouro

Nunca confiar em filtros da aplicação para isolamento. RLS é a última linha de defesa. Se um bug no código passar `user_id` errado, o banco rejeita silenciosamente.

---

## Next.js App Router Patterns

### Decisão por Operação

| Operação | Padrão | Justificativa |
|---|---|---|
| Listar contas, transações, dashboard | **RSC** (async component) | Renderiza no servidor, sem JS extra, SEO |
| Criar/editar/excluir conta | **Server Action** | Mutação interna, type-safe, CSRF automático |
| Lançar transação | **Server Action** | Idem; validação no servidor antes de insert |
| Criar parcelamento (N transações) | **Server Action** | Transação Postgres (atomic) — critical |
| Fechar/pagar fatura | **Server Action** | Multi-step com transação Postgres |
| Upload de arquivo CSV/OFX | **Route Handler (POST)** | Streaming de arquivo requer multipart/form-data; Server Actions não streamam bem arquivos grandes |
| Webhooks (futuro) | **Route Handler** | Chamadores externos |

### Padrão de Data Fetching (RSC)

```typescript
// app/dashboard/page.tsx (Server Component — default)
export default async function DashboardPage() {
  const supabase = await createServerClient()

  // Queries paralelas — não sequenciais
  const [accounts, monthlySummary] = await Promise.all([
    supabase.from('accounts').select('*').order('name'),
    supabase.rpc('get_monthly_summary', { month: currentMonth })
  ])

  return <Dashboard accounts={accounts.data} summary={monthlySummary.data} />
}
```

### Padrão de Mutação (Server Action)

```typescript
// actions/transactions.ts
'use server'

export async function createTransaction(data: TransactionInput) {
  const supabase = await createServerClient()
  const { error } = await supabase.from('transactions').insert({
    ...data,
    user_id: (await supabase.auth.getUser()).data.user?.id
  })
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}
```

### Streaming com Suspense (Para Dashboard Pesado)

```tsx
// Componentes lentos (relatórios) envolvidos em Suspense
<Suspense fallback={<SkeletonChart />}>
  <MonthlyReport month={month} />  {/* async RSC */}
</Suspense>
```

---

## Import Pipeline (CSV/OFX)

### Fluxo Arquitetural

```
Cliente
  │
  ▼ multipart/form-data (POST)
Route Handler /api/import
  │
  ├─ 1. Detecção de formato (CSV vs OFX por extensão/MIME)
  │
  ├─ 2. Parse
  │   ├─ OFX: ofx-data-extractor (npm) → FITID, date, amount, description
  │   └─ CSV: papaparse (npm) → mapeamento de colunas configurável
  │
  ├─ 3. Normalização
  │   └─ Padronizar: date (ISO), amount (centavos, inteiro), type (income/expense)
  │
  ├─ 4. Validação
  │   └─ Verificar campos obrigatórios, datas válidas, valores numéricos
  │
  ├─ 5. Deduplicação
  │   ├─ OFX: usar FITID como chave única por conta
  │   └─ CSV: hash de (account_id + date + amount + description) como fallback
  │   └─ SELECT existing WHERE external_id IN (...) → filtrar duplicatas
  │
  ├─ 6. Preview (retornar ao cliente antes de inserir)
  │   └─ { toImport: N, duplicates: M, errors: [...] }
  │
  └─ 7. Inserção em lote (após confirmação do usuário)
      └─ supabase.from('transactions').insert(batch) — chunks de 500
```

### Schema: Campo para Deduplicação

```sql
ALTER TABLE transactions ADD COLUMN external_id text;
-- Ex OFX: external_id = account_id + ':' + FITID
-- Ex CSV: external_id = SHA256(account_id + date + amount + description)
CREATE UNIQUE INDEX ON transactions(account_id, external_id)
  WHERE external_id IS NOT NULL;
```

### Biblioteca Recomendada

- **OFX:** `ofx-data-extractor` (TypeScript, browser + Node, FITID nativo) — MEDIUM confidence (verificado no npm)
- **CSV:** `papaparse` (padrão de facto para CSV em JS) — HIGH confidence

### Chunk Size para Inserção

- Inserir em lotes de 100–500 registros para evitar timeouts no Supabase (limite de payload)
- Para arquivos grandes (>5k transações), processar em background via streaming progressivo

---

## Dashboard Aggregation

### Queries Necessárias

| Query | Frequência | Complexidade |
|---|---|---|
| Saldo total de todas as contas | Alta (toda page load) | Baixa |
| Resumo mensal (entradas/saídas/saldo) | Alta | Média |
| Gastos por tag no período | Média | Média |
| Fluxo de caixa (últimos 6 meses) | Baixa | Alta |
| Fatura atual do cartão | Alta | Média |

### Estratégia de Performance

#### Nível 1: Funções SQL via `supabase.rpc()`

Para queries de agregação chamadas frequentemente, encapsular em funções Postgres:

```sql
CREATE OR REPLACE FUNCTION get_monthly_summary(
  p_user_id uuid,
  p_year    int,
  p_month   int
)
RETURNS TABLE (
  total_income  bigint,
  total_expense bigint,
  net           bigint
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    COALESCE(SUM(amount) FILTER (WHERE type = 'income'),  0) AS total_income,
    COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS total_expense,
    COALESCE(SUM(amount) FILTER (WHERE type = 'income'),  0)
    - COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS net
  FROM transactions
  WHERE user_id = p_user_id
    AND EXTRACT(year  FROM date) = p_year
    AND EXTRACT(month FROM date) = p_month
    AND paid = true;
$$;
```

**`SECURITY DEFINER`** com `p_user_id` explícito (ou `auth.uid()` internamente) mantém RLS sem overhead de políticas em cada linha.

#### Nível 2: Índices Estratégicos

```sql
-- Cobrindo query de resumo mensal
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date, type, paid);

-- Para gastos por tag
CREATE INDEX idx_transaction_tags_tag ON transaction_tags(tag_id);
CREATE INDEX idx_transactions_account_date ON transactions(account_id, date);
```

#### Nível 3: Materialized Views (Somente se Necessário)

Para OPEN-LEDGER, com dados pessoais de um único usuário, **materialized views raramente serão necessárias no v1** — o volume de transações de uma pessoa (tipicamente < 10.000/ano) torna queries simples suficientemente rápidas.

Introduzir apenas se:
- Fluxo de caixa histórico (múltiplos anos) ficar acima de 500ms
- Relatórios com muitos usuários simultâneos (cenário de self-hosted compartilhado)

```sql
-- Exemplo: se necessário no futuro
CREATE MATERIALIZED VIEW mv_monthly_totals AS
SELECT
  user_id,
  DATE_TRUNC('month', date) AS month,
  type,
  SUM(amount) AS total
FROM transactions
WHERE paid = true
GROUP BY user_id, DATE_TRUNC('month', date), type;

CREATE UNIQUE INDEX ON mv_monthly_totals(user_id, month, type);
-- Habilita: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_totals;
```

---

## Suggested Build Order

A ordem respeita dependências técnicas e de dados:

```
Fase 1: Infraestrutura (Foundation)
  ├─ Supabase: projeto, Auth Google OAuth, variáveis de ambiente
  ├─ Next.js: App Router setup, Supabase client server/client
  ├─ Schema Postgres: tabelas + RLS policies + índices
  └─ Layout base: autenticação, header, navegação mobile-first

Fase 2: Contas (Core Entity)
  ├─ CRUD de contas (bank, wallet, credit_card)
  ├─ Exibição de saldo por conta + saldo consolidado
  └─ Configuração de cartão (closing_day, due_day)

Fase 3: Transações Básicas
  ├─ Lançamento manual (income/expense, conta, data, descrição)
  ├─ Status paid/unpaid
  └─ Tags (CRUD) + associação a transações

Fase 4: Parcelamento
  ├─ Criação de compra parcelada (gera N transações)
  └─ Exibição agrupada por installment_group

Fase 5: Faturas de Cartão de Crédito
  ├─ Cálculo automático do total da fatura por período
  ├─ Fechar fatura manualmente
  └─ Pagar fatura (debita conta bancária, marca transações como pagas)

Fase 6: Dashboard & Relatórios
  ├─ Resumo mensal (entradas, saídas, saldo)
  ├─ Gastos por tag
  └─ Fluxo de caixa histórico

Fase 7: Importação CSV/OFX
  ├─ Upload + parse + deduplicação
  ├─ Preview antes de confirmar
  └─ Inserção em lote

Fase 8: Polimento & UX
  ├─ Mobile-first refinements
  ├─ Empty states, loading skeletons
  └─ Filtros avançados de transações
```

**Justificativa da ordem:**
- Fase 1 antes de tudo: sem infra e auth, nada funciona
- Fase 2 antes de 3: transações dependem de contas existentes
- Fase 3 antes de 4: parcelamento é extensão de transação
- Fase 3 antes de 5: faturas agregam transações
- Fase 6 depois de 3-5: dashboard precisa de dados reais para desenvolver com qualidade
- Fase 7 pode ser paralela a 6: independe de fatura/dashboard, só depende de transações

---

## Self-hosting Options

### Opção A: Vercel + Supabase Cloud (Recomendada para MVP)

```
┌────────────────┐     ┌──────────────────────┐
│  Vercel        │────▶│  Supabase Cloud       │
│  (Next.js)     │     │  (Free / Pro tier)    │
│  Free tier OK  │     │  Postgres + Auth      │
└────────────────┘     └──────────────────────┘
```

**Pros:** Zero ops, HTTPS automático, deploy em minutos, CI/CD nativo
**Cons:** Dados em cloud (pode não atender quem quer 100% on-premise)
**Custo:** Free tiers cobrem uso pessoal tranquilamente

### Opção B: VPS/Railway + Supabase Cloud

```
┌────────────────┐     ┌──────────────────────┐
│  Railway/Render│────▶│  Supabase Cloud       │
│  (Next.js      │     │  (Free tier)          │
│   Docker)      │     └──────────────────────┘
└────────────────┘
```

**Pros:** Next.js em infra própria, DB ainda gerenciado
**Cons:** Ops mínimo de servidor

### Opção C: Fully Self-Hosted (Docker Compose)

```yaml
# docker-compose.yml (para VPS)
services:
  nextjs:
    build: .
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=http://supabase-kong:8000
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}

  # Supabase Community Edition (self-hosted)
  # Via: github.com/supabase/supabase (docker-compose oficial)
  supabase-db:       # Postgres
  supabase-auth:     # GoTrue
  supabase-rest:     # PostgREST
  supabase-kong:     # API Gateway
```

**Pros:** 100% on-premise, dados nunca saem do servidor próprio
**Cons:** Supabase CE tem boa documentação mas requer ~4GB RAM, ops mais complexo
**Ref:** https://supabase.com/docs/guides/self-hosting/docker

### Recomendação para OPEN-LEDGER

**Desenvolver com Opção A (Vercel + Supabase Cloud).**
Documentar Opção C para usuários que querem self-host total.

O projeto deve funcionar identicamente nas duas opções — apenas as variáveis de ambiente mudam (`NEXT_PUBLIC_SUPABASE_URL` aponta para cloud ou localhost).

**Nunca hardcode de URLs ou chaves** — tudo via `.env.local` e variáveis de ambiente de deploy.

---

## Sources & Confidence

| Área | Confidence | Fonte |
|---|---|---|
| RLS patterns (user-owned) | HIGH | Supabase docs + supaexplorer.com (verificado) |
| Server Actions vs API Routes | HIGH | makerkit.dev + usesaaskit.com (múltiplas fontes concordam) |
| Valores monetários em centavos | HIGH | Padrão da indústria financeira (pgbudget, pg-ledger) |
| Modelo de parcelamento (transações independentes) | MEDIUM | Derivado de Stone docs + princípios de schema, sem referência direta a apps brasileiros open-source |
| Materialized views para dashboard | HIGH | Múltiplas fontes 2025/2026, case studies |
| ofx-data-extractor para OFX | MEDIUM | npm verificado, mas projetos de importação OFX em Next.js são poucos documentados |
| Supabase self-hosting Docker | HIGH | Documentação oficial do Supabase |
