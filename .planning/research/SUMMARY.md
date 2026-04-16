# Research Summary — OPEN-LEDGER

**Project:** OPEN-LEDGER — Personal Finance Manager (self-hosted, open-source)
**Domain:** Gerenciamento de finanças pessoais — mercado brasileiro
**Researched:** 2026-04-15
**Confidence:** HIGH

---

## Executive Summary

OPEN-LEDGER é um gerenciador de finanças pessoais self-hosted, construído sobre Next.js App Router + Supabase, destinado a desenvolvedores e usuários técnicos brasileiros que recusam depender de SaaS como Mobills ou Organizze. O produto resolve a dor central do consumidor brasileiro: visibilidade consolidada de contas bancárias, carteiras digitais e cartões de crédito — incluindo o fluxo peculiar do parcelamento automático e do ciclo de fatura, que não tem equivalente nos apps internacionais como YNAB ou Copilot Money.

A abordagem recomendada é construir em ordem de dependência: infraestrutura e auth primeiro, contas e transações em seguida, depois o modelo de cartão + parcelamento + fatura (que é o coração do produto para o mercado brasileiro), e finalmente dashboard e importação CSV/OFX. O stack está bem definido: shadcn/ui v4 + Tailwind para UI, TanStack Query + Zustand para estado, React Hook Form + Zod para formulários, Recharts para gráficos, e PapaParse + ofx-data-extractor para importação.

Os principais riscos são de natureza financeira e de segurança: aritmética de ponto flutuante com valores monetários, arredondamento incorreto em parcelamentos, double-counting no pagamento de fatura, falha silenciosa de RLS sem policies, e dados financeiros servidos por cache estático do Next.js. Todos os riscos têm mitigações claras e bem documentadas — desde que sejam tratados nas fases corretas e não retrofit.

---

## Recommended Stack

Stack totalmente validado com high confidence para o ecossistema Next.js App Router 2025/2026:

| Camada | Tecnologia | Versão | Justificativa |
|--------|-----------|--------|---------------|
| Framework | Next.js App Router | 15.x | Full-stack, Server Actions, SSR — já decidido |
| Backend/Auth/DB | Supabase | CE / Cloud | Postgres + Auth + RLS + Storage self-hostável |
| UI Components | shadcn/ui | 4.0.0 (Mar 2026) | Copy-paste model, Tailwind-native, zero bundle de terceiros |
| Estilização | Tailwind CSS | 3.x | Mobile-first, padrão do ecossistema |
| Ícones | lucide-react | latest | Biblioteca oficial shadcn/ui |
| Estado servidor | TanStack Query | 5.x | Cache inteligente, deduplicação, background refetch |
| Estado UI | Zustand | 5.x | ~1KB, SSR-safe, API mínima |
| Formulários | React Hook Form | 7.x | Mínimo re-renders, integração shadcn/ui nativa |
| Validação | Zod | 3.x | TypeScript-first, reutilizado no client e Server Action |
| Gráficos | Recharts | 3.8.1 (Mar 2026) | 37M downloads/semana, TypeScript generics, integra com shadcn/ui |
| Import CSV | PapaParse | 5.5.3 | 9M downloads/semana, zero deps, web workers |
| Import OFX | ofx-data-extractor | 1.5.0 | TypeScript nativo, browser-compatible, FITID nativo |
| Supabase SSR | @supabase/ssr | latest | Mandatório para App Router — sessions via cookie, PKCE |

**O que NÃO usar:** next-auth (conflito com Supabase Auth), Prisma/Drizzle (quebra RLS), Redux (overkill), MUI/Chakra (não Tailwind-native), Chart.js (canvas, não React-native), react-papaparse (incompatibilidades SSR), `getSession()` no servidor (usa `getUser()` sempre), service role key no frontend.

---

## Table Stakes Features (v1 Must-Haves)

Funcionalidades que qualquer usuário espera. Ausência = produto incompleto, abandono imediato.

| Feature | Complexidade | Notas |
|---------|-------------|-------|
| Múltiplas contas (banco, carteira, cartão) | Média | Tipo da conta determina comportamento |
| Saldo consolidado em tempo real | Baixa | Calculado sobre as transações com `paid = true` |
| Lançamento manual de receita/despesa | Baixa | Fluxo < 10s, formulário único sem wizard |
| Status pago / a pagar | Baixa | Boolean; afeta saldo realizado vs previsto |
| Tags / categorias | Baixa-Média | N:N por transação; CRUD próprio |
| Gestão de cartão (closing_day + due_day) | Alta | Lógica de fatura não-trivial |
| **Parcelamento automático** (N lançamentos) | **Alta** | Core do mercado brasileiro — crítico |
| **Pagamento de fatura** (débita conta bancária) | Média | Fecha o ciclo do cartão |
| Dashboard mensal (entradas/saídas/saldo) | Média | Pergunta #1 do usuário |
| Relatório por tag | Média | Gráfico pizza/barras — padrão Mobills |
| Fluxo de caixa (previsto vs realizado) | Média | Lançamentos "a pagar" projetam futuro |
| Importação CSV/OFX | Média | OFX é padrão dos bancos brasileiros |
| Multi-usuário com isolamento (RLS) | Média | Infraestrutura, não feature de produto |

**Caminho crítico para MVP:** Auth + Contas → Transações + Tags → Cartão + Parcelamento + Fatura → Dashboard → Importação

**Diferir para v2:** Orçamento/limites por categoria, notificações push/email, PWA, metas de longo prazo, exportação PDF/Excel, transferências entre contas.

**Anti-features a evitar:** auto-categorização por IA, sync automático com bancos, budget envelopes, scan de comprovante, múltiplas moedas, app nativo iOS/Android.

---

## Key Architecture Decisions

O app segue uma arquitetura monolítica Next.js com backend Supabase, onde **RSC faz leituras** e **Server Actions fazem mutações**. Não há API routes separadas para uso interno.

### Componentes Principais

| Componente | Responsabilidade |
|-----------|-----------------|
| React Server Components | Leitura de dados, render inicial, dashboards |
| Server Actions | Todas as mutações (CRUD, parcelamento, fatura, import) |
| Route Handlers | Apenas webhooks externos e upload de arquivo |
| Supabase Auth | Google OAuth, JWT, session management |
| Postgres + RLS | Persistência, isolamento por `user_id`, aggregations |

### Modelo de Dados

```
users (auth.users)
  └── profiles (1:1, configurações)

accounts (banco, carteira, credit_card)
  ├── user_id FK
  ├── type: ENUM('bank', 'wallet', 'credit_card')
  └── credit_card_settings (closing_day, due_day) — nullable

transactions (lançamentos financeiros)
  ├── user_id FK, account_id FK
  ├── amount: INTEGER (centavos — nunca float)
  ├── type: ENUM('income', 'expense', 'invoice_payment')
  ├── date: DATE (não TIMESTAMPTZ — independente de timezone)
  ├── paid: BOOLEAN
  └── installment_group_id FK nullable

installment_groups (compras parceladas — 1 por compra)
  └── description, total_amount, num_installments

invoices (faturas do cartão)
  ├── period_start, period_end, due_date
  ├── status: ENUM('open', 'closed', 'paid')
  └── payment_transaction_id FK nullable

tags + transaction_tags (N:N)
```

### Padrões Chave

- **Valores monetários como INTEGER (centavos):** R$ 1.234,56 → `123456`. Nunca float.
- **`transaction.date` como DATE:** Evita timezone corruption (Brasil tem UTC-3 a UTC-5).
- **Parcelas como transações independentes:** Filtros por período funcionam naturalmente; cada parcela cai na fatura correta via `date`.
- **RLS em todas as tabelas:** Template obrigatório (SELECT + INSERT + UPDATE + DELETE) incluindo `transaction_tags` via JOIN.
- **`export const dynamic = 'force-dynamic'`** em todas as páginas financeiras — nunca cache estático.
- **Queries paralelas com `Promise.all`** em RSC — sem N+1.
- **Funções SQL via `supabase.rpc()`** para aggregations do dashboard.

### Pipeline de Importação CSV/OFX

```
Upload (browser) → parse no browser (PapaParse/ofx-data-extractor)
→ Preview + dedup → Server Action → insert em batch (chunks de 500)
```

Deduplicação: `SHA256(account_id + date + amount + description)` com `INSERT ... ON CONFLICT DO NOTHING`.

---

## Critical Pitfalls to Avoid

### Pitfall 1 — Aritmética de ponto flutuante com dinheiro (CRÍTICO)
**Sintoma:** `0.1 + 0.2 === 0.30000000000000004`; saldos errados acumulam silenciosamente.
**Prevenção:** Armazenar como INTEGER (centavos). Toda aritmética em SQL ou com `dinero.js`. Converter para display apenas na renderização. Nunca `.toFixed()` para cálculo, só para exibição.

### Pitfall 2 — Arredondamento de parcelas (centavo perdido) (CRÍTICO)
**Sintoma:** R$100 / 3 = R$33,33 × 3 = R$99,99 — R$0,01 some.
**Prevenção:** Primeira parcela recebe o resto. `installments[0] = total - round(total/n) * (n-1)`. Validar: `sum(parcelas) === total`.

### Pitfall 3 — Double-counting no pagamento de fatura (CRÍTICO)
**Sintoma:** Despesas contadas no cartão (quando feitas) + contadas de novo no pagamento da fatura = gastos duplicados.
**Prevenção:** Pagamento de fatura usa `type: 'invoice_payment'`, excluído de totais de despesa. Dashboard soma apenas `type = 'expense'`.

### Pitfall 4 — Data de fechamento em dia 29/30/31 (CRÍTICO)
**Sintoma:** `new Date(2026, 1, 31)` → 3 de março, incluindo transações de março na fatura de fevereiro.
**Prevenção:** `Math.min(closing_day, lastDayOfMonth)`. Armazenar `closing_day` como INTEGER, nunca como DATE.

### Pitfall 5 — RLS habilitado sem policies (CRÍTICO de segurança)
**Sintoma:** Tabela com RLS sem policy retorna 0 rows (default-deny). Dev adiciona `USING (true)` como fix → vaza dados de todos os usuários.
**Prevenção:** Cada migration que cria tabela inclui as 4 policies (SELECT, INSERT, UPDATE, DELETE). `transaction_tags` precisa de policy via JOIN em `transactions`.

### Pitfall 6 — Cache estático servindo dados financeiros desatualizados (CRÍTICO)
**Sintoma:** Dashboard mostra saldo de ontem após adicionar transação.
**Prevenção:** `export const dynamic = 'force-dynamic'` em todas as páginas financeiras. `revalidatePath` síncrono no Server Action (nunca em `setTimeout`). `router.refresh()` no cliente após mutação crítica.

### Pitfall 7 — Timezone: transação de 23h30 aparece no dia seguinte (CRÍTICO)
**Sintoma:** Transação criada às 23h30 BRT → UTC 02h30 do próximo dia → aparece na data errada.
**Prevenção:** `transaction_date` como `DATE` (não `TIMESTAMPTZ`). Client envia `YYYY-MM-DD` string. Server Action nunca faz `new Date().toISOString()` para data de transação.

### Pitfall 8 — Encoding Windows-1252 em arquivos OFX/CSV de bancos brasileiros (Alto)
**Sintoma:** "Transferência" vira lixo binário ao ler como UTF-8.
**Prevenção:** Auto-detectar encoding com `chardet` ou `iconv-lite`. Default fallback: `windows-1252`. Usar `parseBuffer()` (binary input) no parser OFX. Testar com arquivos reais de Bradesco, Itaú, Nubank.

---

## Brazil-Specific Considerations

### Parcelamento — Diferencial Central do Mercado Brasileiro

O parcelamento automático no cartão de crédito é o comportamento financeiro mais diferente do mercado internacional. Compras em 2x, 6x, 12x são a norma no Brasil. O OPEN-LEDGER deve:

- Criar N transações independentes ao lançar uma compra parcelada, cada uma com `date` calculado para a fatura correta
- Aplicar a regra de atribuição de fatura: se `data_compra < closing_day` → fatura atual; se `data_compra >= closing_day` → próxima fatura
- Armazenar o `installment_group` como entidade separada (compra original) ligada às N transações
- Expor 3 operações de edição/exclusão: cancelar 1 parcela, cancelar parcelas restantes, cancelar compra inteira
- Usar a fórmula de arredondamento brasileira: remainder na **primeira** parcela

### Ciclo de Fatura do Cartão

- Dois parâmetros obrigatórios por cartão: `closing_day` (fechamento) e `due_day` (vencimento)
- Fatura é um objeto real com `status: open | closed | paid`
- Fechar fatura é ação manual do usuário (evita edge cases de cálculo automático)
- Pagar fatura = débito na conta bancária + marcar todas as transações da fatura como `paid = true`
- Nunca usar "Saldo" para cartão de crédito — usar "Fatura: R$X | Limite: R$Y"

### Meios de Pagamento Locais

| Meio | Tratamento no OPEN-LEDGER |
|------|--------------------------|
| **PIX** | Tag/campo de forma de pagamento — sem integração |
| **Boleto** | Despesa "a pagar" com data de vencimento — sem integração |
| **Vale Alimentação/VR** | Conta do tipo "carteira" |
| **Poupança** | Conta do tipo "banco" — out-of-scope v1 se distinto |

### Encoding e Dados

- Arquivos de extrato de bancos brasileiros: Windows-1252 ou ISO-8859-1 (não UTF-8)
- Datas em formatos variados por banco: `DD/MM/YYYY`, `YYYY-MM-DD`, `MM/DD/YYYY` (Nubank legacy)
- Valores com vírgula decimal: `1.234,56` — normalizar para centavos antes de persistir
- Brasil tem 4 fusos horários (BRT UTC-3, AMT UTC-4, ACT UTC-5, FNT UTC-2) — usar `DATE` para datas de transação

### Open Finance

Decisão já tomada no PROJECT.md: fora do escopo v1. Importação CSV/OFX cobre o caso de uso de forma mais segura e compatível com self-hosted, sem exigir CPF+senha do usuário.

---

## Suggested Phase Order

A ordem respeita dependências técnicas, de dados e de domínio:

```
Fase 1: Infraestrutura e Auth
  Supabase setup, Google OAuth, middleware, schema completo com RLS,
  layout base Next.js com navegação mobile-first
  → Pré-requisito absoluto para tudo

Fase 2: Gestão de Contas
  CRUD de contas (bank, wallet, credit_card), saldo por conta,
  saldo consolidado, configuração de cartão (closing_day, due_day)
  → Transações dependem de contas existentes

Fase 3: Transações Básicas + Tags
  Lançamento manual (income/expense), status paid/unpaid,
  CRUD de tags, associação N:N transação ↔ tag
  → Parcelamento é extensão de transação; fatura agrega transações

Fase 4: Parcelamento (Cartão)
  Compra parcelada → N lançamentos, installment_groups,
  atribuição à fatura correta por closing_day, arredondamento correto
  → Depende de contas do tipo credit_card e modelo de transação

Fase 5: Faturas do Cartão
  Cálculo dinâmico do total da fatura, fechar fatura manualmente,
  pagar fatura (débito na conta bancária, type: invoice_payment),
  marcar parcelas como pagas em lote
  → Depende de parcelamento e contas

Fase 6: Dashboard e Relatórios
  Resumo mensal (entradas/saídas/saldo), gastos por tag,
  fluxo de caixa histórico, gráficos Recharts
  → Precisa de dados reais para desenvolver com qualidade

Fase 7: Importação CSV/OFX
  Upload, parse (PapaParse + ofx-data-extractor), deduplicação,
  preview, bank profiles (Nubank, Itaú, Bradesco, Santander),
  inserção em batch
  → Depende de transações; paralela a Fase 6

Fase 8: Polimento e UX
  Empty states, loading skeletons, filtros avançados,
  responsividade mobile refinada, acessibilidade
  → Após funcionalidade core completa
```

**Research Flags por Fase:**

| Fase | Research Necessário? | Motivo |
|------|---------------------|--------|
| Fase 1 | Não — padrões documentados | Supabase SSR + Next.js App Router bem documentados |
| Fase 2 | Não — CRUD padrão | Padrão estabelecido |
| Fase 3 | Não — CRUD padrão | Tags e transações seguem padrões estabelecidos |
| Fase 4 | **Sim** | Lógica de parcelamento brasileira tem edge cases complexos; testar com bancos reais |
| Fase 5 | **Sim** | Fluxo de pagamento de fatura com transação atômica multi-step |
| Fase 6 | Não — Recharts bem documentado | Gráficos e aggregations têm padrões estabelecidos |
| Fase 7 | **Sim** | OFX de bancos brasileiros: encoding, FITID não-único, layouts variados |
| Fase 8 | Não | UX refinement sem novos domínios |

---

## Confidence Assessment

| Área | Confiança | Notas |
|------|-----------|-------|
| Stack | **HIGH** | shadcn/ui v4, Recharts v3.8.1, @supabase/ssr verificados no npm/GitHub |
| Features | **HIGH** | Análise direta de Mobills, Organizze, Firefly III, Actual Budget |
| Architecture | **HIGH** | RSC + Server Actions padrão estabelecido; modelo de dados derivado de princípios sólidos |
| Pitfalls | **HIGH** | Múltiplas fontes verificadas; alguns com referências a incidentes reais documentados |
| ofx-data-extractor | **MEDIUM** | Funcionalidade adequada confirmada, mas baixo volume de uso (~2.1K/semana) — testar com OFX real |
| Parcelamento model | **MEDIUM** | Derivado de princípios; sem referência direta a implementações open-source brasileiras |

**Confiança geral: HIGH**

### Gaps a Resolver Durante Implementação

1. **ofx-data-extractor com bancos reais:** Testar com extratos reais de Itaú, Bradesco, Nubank, Caixa antes de commitar a biblioteca. Fallback: `node-ofx` ou parse manual via regex para SGML antigo.
2. **Lógica de closing_day:** Implementar e testar a edge case de transação exatamente no dia de fechamento (`closing_date - 1`, `closing_date`, `closing_date + 1`).
3. **Supabase Realtime vs cache invalidation:** Avaliar se usar Supabase Realtime para atualização de saldo após importação em batch, ou se `revalidatePath` + `router.refresh()` é suficiente.
4. **shadcn/ui Chart wrapper vs Recharts direto:** O wrapper facilita theming via CSS variables; Recharts direto dá mais controle. Decidir na Fase 6.

---

## Sources

### Primary (HIGH confidence)
- GitHub releases shadcn-ui/ui (v4.0.0, Mar 2026) — versão e features confirmadas
- npm registry: papaparse@5.5.3, recharts@3.8.1, @supabase/ssr@latest — versões verificadas
- Supabase official docs (supabase.com/docs) — RLS patterns, @supabase/ssr, self-hosting Docker
- Next.js App Router docs — Server Actions, RSC, caching
- Mobills (análise direta) — features table stakes brasileiras

### Secondary (MEDIUM confidence)
- selfhostwise.com/posts/firefly-iii-vs-actual-budget-2026 — comparativo self-hosted finance apps
- makerkit.dev, usesaaskit.com — Server Actions vs API Routes patterns
- prebreach.dev/blog/supabase-rls-mistakes — RLS pitfalls documentados
- pockit.tools/blog/nextjs-app-router-caching-deep-dive — Next.js cache behavior

### Tertiary (MEDIUM-LOW confidence)
- npm: ofx-data-extractor@1.5.0 (~2.1K downloads/semana) — MEDIUM; testar com bancos brasileiros reais
- Coolify + Hetzner self-hosting estimates — referenciado na comunidade; custos estimados de 2026

---

*Research completed: 2026-04-15*
*Ready for roadmap: yes*
