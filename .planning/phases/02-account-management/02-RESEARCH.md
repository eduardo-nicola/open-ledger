# Phase 2: Account Management — Research

**Researched:** 2026-04-22  
**Domain:** Next.js App Router 16 + Supabase (Postgres RLS) + shadcn/ui + gráficos de saldo  
**Confidence:** HIGH (schema/policies e stack do repo verificados no código); MEDIUM (algoritmo de histórico de saldo antes da Fase 3 — depende de decisão de produto sobre fonte da verdade)

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Tipos de conta na UI (ACC-01)**

- **D-01:** Na Fase 2, a UI expõe **três categorias de criação** alinhadas ao uso: **Conta bancária** (centralizador de entradas/saídas, pagamentos de fatura e saldo em conta), **Carteira digital**, **Cartão de crédito** — mapeamento técnico: `checking`, `digital_wallet`, `credit_card`.
- **D-02:** O tipo **`savings` não aparece em nenhum lugar da UI nesta fase** (sem criação, sem filtros, sem rótulos). Permanece apenas no schema/check do Postgres para compatibilidade futura; nenhum fluxo da Fase 2 grava ou promove poupança.
- **D-03:** **Corrente vs poupança** como decisão de produto **não** é exigida: o usuário usa **nome** e **quantas contas** quiser para organizar mentalmente (ex.: segunda conta “Poupança” como **nome**, ainda `checking`).
- **D-04:** **Rótulos** de carteira e cartão na UI: **critério do implementador**, mantendo **PT-BR**, **mobile-first** e consistência com o **app shell** e a referência visual **Mobills** (`PROJECT.md`).

**Saldo consolidado “em tempo real” (ACC-04)**

- **D-05:** Critério de “tempo real” deixado em **Claude's Discretion** com restrição explícita: **priorizar simplicidade** e **evitar dependência de WebSocket** na v1 salvo ganho claro. Padrão recomendado para pesquisa/plano: **atualizar após mutações** do próprio usuário (Server Actions + revalidação de cache / refetch de dados de contas), sem exigir **Supabase Realtime** na Fase 2.

**Arquivar e reativar (ACC-02)**

- **D-06:** Conta **arquivada** permanece **na mesma lista** que as ativas, com **tratamento visual “arquivada”** (ex.: opacidade reduzida, badge ou ícone).
- **D-07:** Contas arquivadas **não entram** no **saldo consolidado** (ACC-04).
- **D-08:** Enquanto arquivada, o usuário **pode editar** nome, cor e, para cartão, **dias de fechamento e vencimento** (sem bloquear edição até “desarquivar”).

**Cartão — fechamento e vencimento (ACC-03)**

- **D-09:** Dias de **fechamento** e **vencimento** são coletados **no mesmo fluxo de criação** do cartão (campos contextuais quando o tipo é cartão de crédito).
- **D-10:** Regras numéricas (ex.: 1–28 vs 1–31 vs último dia do mês) ficam em **Claude's Discretion**, **alinhadas aos requisitos da Fase 5** (fatura) e ao aviso de edge cases em `STATE.md` para `closing_day`.

**Cor da conta (ACC-01)**

- **D-11:** Seleção de cor por **paleta fixa** (~8–12 opções). **Sem** seletor livre/hex obrigatório na Fase 2 (rápido no mobile, visual consistente).

**Gráfico de evolução de saldo (ACC-05)**

- **D-12:** **Onde:** prioridade **tela de detalhe da conta**; **sparkline** ou mini-gráfico na **lista** só se **não poluir** o layout **mobile** (critério em Claude's Discretion).
- **D-13:** **Período padrão** ao abrir o gráfico: **últimos 30 dias**, com seletor de outros intervalos a cargo do plano.
- **D-14:** **Sem dados / sem movimentação no período:** **empty state** com ilustração ou bloco amigável + **CTA** “Lançar primeira transação”; o link/rota concreta pode ser **stub** até existir a Fase 3.

### Claude's Discretion

- Rótulos exatos PT-BR (carteira/cartão/banco) e microcopy.
- Estratégia técnica exata de refresh (revalidatePath, TanStack Query, etc.) e eventual Realtime se for incremental.
- Posicionamento do gráfico e componente de chart (biblioteca, eixos, granularidade temporal) respeitando ACC-05.
- Validação fina dos dias do cartão coerente com a Fase 5.
- Comportamento dos **pickers de conta** na Fase 3 para contas arquivadas (não decidido aqui).

### Deferred Ideas (OUT OF SCOPE)

- **Tipo `savings` na UI** — reavaliar em milestone futuro se houver demanda explícita.
- **Supabase Realtime** para saldo multi-dispositivo — fase própria ou melhoria se a abordagem por refetch for insuficiente na prática.

### Reviewed Todos (not folded)

- Nenhum item retornado por `todo match-phase` para a fase 02.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ACC-01 | Criar conta bancária, carteira ou cartão com nome, tipo e cor | Migration + RLS existentes; mapeamento UI→`checking`/`digital_wallet`/`credit_card`; paleta fixa (D-11); `types/database.ts` + Zod |
| ACC-02 | Editar e arquivar contas | `UPDATE` em `accounts` + RLS; `archived_at`; lista unificada com estado visual (D-06) |
| ACC-03 | Configurar cartão com dia de fechamento e vencimento | Nova migration `closing_day`/`due_day`; validação alinhada Fase 5; fluxo único na criação (D-09) |
| ACC-04 | Saldo consolidado (banco + carteira, sem cartões, sem arquivadas) | Query agregada `SUM(balance)` com filtros `type NOT IN ('credit_card')` e `archived_at IS NULL`; refresh pós-mutação (D-05) |
| ACC-05 | Histórico de evolução de saldo por conta (linha) | Biblioteca Recharts + bloco `chart` shadcn; série temporal no detalhe; período 30d (D-13); empty state (D-14) |

</phase_requirements>

## Summary

A Fase 2 encaixa-se no stack já fixado na Fase 1: Postgres com RLS nas quatro operações em `public.accounts`, clientes Supabase SSR (`@supabase/ssr` + `createServerClient` no servidor) e UI shadcn/zinc dark mobile-first. Não há Server Actions no repositório ainda; o padrão recomendado é introduzir funções assíncronas com `'use server'` para INSERT/UPDATE de contas, validar com Zod 4 no servidor e chamar `revalidatePath` (ou tags) após sucesso para cumprir ACC-04 sem WebSocket, conforme decisão D-05.

A migration incremental deve acrescentar colunas nullable ou com default apenas para `credit_card`, alinhadas à Fase 5: dias de calendário (1–31) em `SMALLINT` ou `INTEGER` com `CHECK`, documentando o trade-off “último dia do mês” vs valor fixo 31 — `STATE.md` já alerta edge cases em `closing_day` para fases 4/5.

Para ACC-05 antes da Fase 3, o gráfico pode combinar: (1) série derivada de transações `paid` acumuladas por `date` quando houver dados; (2) reconciliação com `accounts.balance` como fonte exibida hoje; (3) empty state / linha constante quando não houver movimentação — o plano deve travar qual das três é fonte da verdade no MVP.

**Primary recommendation:** Migration para `closing_day`/`due_day` + manter RLS atual (sem políticas novas se `user_id` continuar sendo o pivô) + Server Actions + `revalidatePath('/accounts')` + Recharts v3 via componente `chart` do shadcn + testes E2E `@acc-*` espelhando os cinco ACC.

## Project Constraints (from .cursor/rules/)

| Source | Directive |
|--------|-----------|
| `nextjs.mdc` | App Router; Server Components por padrão; `'use client'` explícito; dados no servidor quando possível; Zod em formulários; loading/error |
| `typescript.mdc` | Strict; evitar `any`; tipos explícitos em APIs públicas |
| `supabase-specific-rules.mdc` | Boas práticas Auth, armazenamento e (se usado) Realtime — Fase 2 não exige Realtime por decisão |
| `accessibility-guidelines.mdc` | Hierarquia de headings, contraste, labels, foco em diálogos |
| `codequality.mdc` | Verificar informações; mudanças focadas; não inventar escopo |
| `STATE.md` / Fase 1 | `INTEGER` centavos; `DATE` em transações; 4 policies RLS por tabela; `export const dynamic = 'force-dynamic'` em páginas financeiras |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.4 [VERIFIED: npm registry] | App Router, Server Functions (`'use server'`) | Versão instalada no repo; docs oficiais citam `revalidatePath` em Server Functions |
| @supabase/supabase-js | 2.103.2 no lockfile-alvo; registry 2.104.0 [VERIFIED: npm registry] | CRUD `accounts` via anon autenticado | Já integrado |
| @supabase/ssr | 0.10.2 [VERIFIED: npm registry] | Cookie session no servidor | `lib/supabase/server.ts` existente |
| zod | 4.3.6 [VERIFIED: npm registry] | Validação server + RHF | Decisão Fase 1 |
| react-hook-form + @hookform/resolvers | lockfile [VERIFIED: package.json] | Formulários mobile | Já no projeto |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| recharts | 3.8.1 [VERIFIED: npm registry] | `LineChart` ACC-05 | shadcn `chart` documenta Recharts v3 [CITED: ui.shadcn.com/docs/components/chart.md] |
| shadcn `chart` | via CLI | `ChartContainer`, tokens `--chart-*` compatíveis com dark/zinc | ACC-05 com mesma linguagem visual do app |
| @tanstack/react-query | 5.99.0 [VERIFIED: package.json] | Opcional para refetch client-side | Discretion D-05; hoje o app não expõe padrão obrigatório |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts + shadcn chart | Chart.js + react-chartjs-2 | Mais config manual de tema dark; menos alinhamento ao ecossistema shadcn |
| Server Actions | Route Handlers + fetch | Mais boilerplate; Actions co-localizam mutação + revalidação |

**Installation (incremental):**

```bash
npm install recharts@^3.8.1
npx shadcn@latest add chart
```

**Version verification:** comandos executados: `npm view next version` → 16.2.4; `npm view recharts version` → 3.8.1; `@supabase/supabase-js` registry 2.104.0 (projeto em 2.103.2).

## Architecture Patterns

### Recommended Project Structure

```
app/(app)/
├── accounts/
│   ├── page.tsx              # lista + saldo consolidado ACC-04
│   ├── new/page.tsx          # criação ACC-01/03
│   └── [id]/
│       ├── page.tsx          # detalhe + gráfico ACC-05
│       └── edit/page.tsx     # edição ACC-02
lib/
├── accounts/
│   ├── schema.ts             # zod: tipos UI, dias cartão, paleta
│   └── actions.ts            # 'use server' create/update/archive
```

### Pattern 1: RLS + `user_id` = `profiles.id` = `auth.uid()`

**What:** As policies atuais em `accounts` já restringem linhas a `auth.uid() = user_id` para SELECT/INSERT/UPDATE/DELETE [VERIFIED: `supabase/migrations/20260416000000_initial_schema.sql`].  
**When to use:** Todo CRUD via Supabase com JWT do usuário (browser ou server com cookies).  
**Example (documentação Supabase — INSERT):**

```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security
create policy "Users can create a profile."
on profiles for insert
to authenticated
with check ( (select auth.uid()) = user_id );
```

**Aplicação open-ledger:** INSERT em `accounts` deve enviar `user_id` igual ao `user.id` da sessão (mesmo padrão das policies existentes). Nenhuma mudança obrigatória de RLS só por adicionar colunas de cartão, desde que não exista vetor de escalação de `user_id` (o `WITH CHECK` atual já exige igualdade).

### Pattern 2: Server Function + `revalidatePath`

**What:** Após mutação bem-sucedida, invalidar cache da rota de contas.  
**When to use:** ACC-04 sem Realtime (D-05).  
**Example:**

```ts
// Source: https://nextjs.org/docs/app/api-reference/functions/revalidatePath.md
'use server'

import { revalidatePath } from 'next/cache'

export async function createAccount(/* … */) {
  // … persist …
  revalidatePath('/accounts')
}
```

### Pattern 3: Saldo consolidado (SQL mental / Supabase query)

**What:** Soma `balance` apenas onde faz sentido para ACC-04 e decisões D-02/D-07.

```sql
-- Pseudocódigo verificado contra schema atual (accounts)
SELECT coalesce(sum(balance), 0) AS consolidated_cents
FROM public.accounts
WHERE user_id = auth.uid()
  AND archived_at IS NULL
  AND type IN ('checking', 'savings', 'digital_wallet');
```

- Exclui `credit_card` (requisito ACC-04).  
- Inclui `savings` se existir linha legada — a UI da Fase 2 não cria `savings` (D-02). Ajuste fino (excluir `savings` da soma) é **discretion** se quiser paridade exata com copy “bancárias e carteiras”.

### Anti-Patterns to Avoid

- **`NUMERIC`/`FLOAT` para dinheiro:** contradiz decisão global; manter `INTEGER` centavos.
- **Atualizar `user_id` em UPDATE:** bloqueado pelo `WITH CHECK` atual — não expor na UI; validar no Zod que `user_id` não entra no payload do cliente.
- **Confiar só no cache estático:** páginas financeiras devem usar `force-dynamic` (decisão STATE) nas novas rotas de contas.
- **Realtime na v1:** explicitamente fora por deferimento salvo mudança de escopo.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tema dark / tooltips / eixos de chart | CSS ad hoc para gráfico | shadcn `chart` + tokens `--chart-*` | Consistência com zinc e menos bugs visuais [CITED: ui.shadcn.com/docs/components/chart.md] |
| Validação só no cliente | Trust browser | Zod no Server Action | ASVS V5; banco ainda exige RLS |
| Autorização só no middleware | Esquecer RLS | Manter policies Postgres | Defense in depth [CITED: supabase.com/docs/guides/database/postgres/row-level-security] |

**Key insight:** RLS já implementa o modelo de segurança; a Fase 2 adiciona UX e colunas — não reimplementar authz em código app.

## Common Pitfalls

### Pitfall 1: UPDATE sem SELECT policy

**What goes wrong:** `UPDATE` aparenta falhar ou não retornar linhas.  
**Why it happens:** Postgres/Supabase exige policy de SELECT coerente com o fluxo de retorno [CITED: supabase.com/docs/guides/database/postgres/row-level-security — “UPDATE policies”].  
**How to avoid:** Manter as quatro policies; testar `.update().select()` com usuário autenticado.  
**Warning signs:** `PGRST116` ou zero rows afetadas com sessão válida.

### Pitfall 2: `auth.uid()` nulo em políticas

**What goes wrong:** Nenhuma linha visível após expiração de sessão.  
**Why it happens:** `null = user_id` é falso [CITED: mesma doc RLS].  
**How to avoid:** Middleware já renova cookies; tratar redirect login nas páginas `(app)`.

### Pitfall 3: Histórico de saldo incoherente com `accounts.balance`

**What goes wrong:** Gráfico mostra série que não fecha com saldo exibido.  
**Why it happens:** Fase 3 passará a mover saldo via transações; até lá pode haver só `balance` manual/default.  
**How to avoid:** Definir no plano: ou só exibir saldo atual como série constante pré-TXN-01, ou pré-calcular série a partir de `transactions` `paid` e reconciliar com `balance`.  
**Warning signs:** QA nota saldo topo ≠ último ponto do gráfico.

### Pitfall 4: Dias 29–31 em fechamento/vencimento

**What goes wrong:** Fatura Fase 5 com janelas ambíguas em fevereiro.  
**Why it happens:** Bancos BR usam convenções distintas (“útil”, “mesmo dia”, etc.) [ASSUMED: domínio BR; alinhado a STATE.md].  
**How to avoid:** Documentar semântica escolhida (ex.: clamp para último dia do mês) no PLAN e testes de calendário.

## Code Examples

### Server Action skeleton

```ts
// Pattern from Next.js docs: revalidatePath + 'use server'
// https://nextjs.org/docs/app/api-reference/functions/revalidatePath.md
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function archiveAccount(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id') ?? '')
  const { error } = await supabase
    .from('accounts')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
  revalidatePath('/accounts')
}
```

### Migration sketch (ACC-03)

```sql
-- Novo arquivo em supabase/migrations/ — alinhar nome ao padrão timestamp
ALTER TABLE public.accounts
  ADD COLUMN closing_day smallint,
  ADD COLUMN due_day smallint;

-- Exemplo de guarda (ajustar após decisão D-10 / Fase 5)
ALTER TABLE public.accounts ADD CONSTRAINT accounts_credit_card_days_chk
  CHECK (
    type <> 'credit_card'
    OR (closing_day BETWEEN 1 AND 31 AND due_day BETWEEN 1 AND 31)
  );
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router API routes only | Server Functions + `revalidatePath` | Next 15+ docs atuais usam “Server Functions” | Mutations co-localizadas |
| Charts totalmente custom | shadcn chart + Recharts 3 | shadcn doc 2025+ | Menos CSS manual |

**Deprecated/outdated:** evitar docs antigas que falem só em “Server Actions” sem mencionar revalidação de cache — preferir URLs `nextjs.org/docs` com sufixo `.md` conforme sitemap.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Fase 3 manterá `accounts.balance` sincronizado com transações pagas | Summary / Pitfall 3 | Gráfico e saldo divergem permanentemente |
| A2 | Semântica de dia 31 = “último dia do mês” será definida na Fase 5 | Pitfall 4 | Migration precisa revisão |

## Open Questions (RESOLVED)

1. **Fonte do histórico ACC-05 antes de TXN-01** — **RESOLVED (2026-04-22)**  
   - **Decisão:** série diária **constante** = `accounts.balance` em cada dia do intervalo; comentário grepável obrigatório em `lib/accounts/balance-history.ts` conforme `02-02-PLAN.md`. Fase 3 substituirá por acumulado de transações pagas quando TXN existir.

2. **Onde exibir o consolidado ACC-04** — **RESOLVED (2026-04-22)**  
   - **Decisão:** topo da rota `/accounts` (lista de contas), com `data-testid="consolidated-balance-cents"` conforme `02-03-PLAN.md` / `02-04-PLAN.md`, até dashboard na Fase 6.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next 16 | ✓ | v22.14.0 (ambiente pesquisado) | — |
| Docker | `supabase start` | ✓ | 29.2.1 | Supabase Cloud remoto |
| Supabase CLI | migrations + local DB | ✓ | 2.90.0 | — |
| Playwright | E2E | ✓ | 1.59.1 | — |

**Missing dependencies with no fallback:**

- Nenhum identificado para a Fase 2 — não há biblioteca de chart ainda, mas instalação via npm resolve.

**Missing dependencies with fallback:**

- Vitest não está no `package.json`; testes unitários podem ser adiados em favor de E2E + SQL — fallback aceitável se o plano documentar.

## Validation Architecture

> Nyquist Dimension 8 — como o executor verifica a fase antes de `/gsd-verify-work`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright 1.59.1 [VERIFIED: package.json] |
| Config file | `playwright.config.ts` |
| Quick run command | `npm run test:e2e:smoke` |
| Full suite command | `npm run test:e2e:smoke` + `npm run test:e2e:auth` (hoje o projeto não define suíte “full” separada além desses greps) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| ACC-01 | Criar banco/carteira/cartão com nome, tipo, cor paleta | E2E | `npm run test:e2e:smoke` com `@acc-01` | ❌ Wave 0 — criar `tests/e2e/accounts.spec.ts` |
| ACC-02 | Editar nome/cor; arquivar; item arquivado visível estilizado | E2E | idem `@acc-02` | ❌ |
| ACC-03 | Cartão exige fechamento/vencimento válidos; persistem no DB | E2E + assert SQL opcional | idem `@acc-03` | ❌ |
| ACC-04 | Consolidado = soma checking/wallet (+savings se existir), exclui `credit_card` e `archived_at` | E2E ou integração Supabase | idem `@acc-04` | ❌ |
| ACC-05 | Detalhe mostra gráfico 30d; empty state quando sem série | E2E | idem `@acc-05` | ❌ |
| AUTH-03 (regressão) | RLS continua isolando usuários | E2E | já em `tests/e2e/rls.spec.ts` | ✅ |

**Data checks (executor manual ou script):**

1. `supabase db reset` (ou migration aplicada) e inspeção em Studio: colunas `closing_day`/`due_day` presentes só com sentido para `credit_card`.
2. Query ad hoc: soma consolidada batendo com UI para um usuário seed com 2 contas checking + 1 cartão + 1 arquivada.

### Sampling Rate

- **Per task commit:** `npm run lint` + smoke direcionado (`playwright test tests/e2e/accounts.spec.ts` quando existir).
- **Per wave merge:** `npm run test:e2e:smoke`.
- **Phase gate:** todos os E2E mapeados a ACC verdes + `npm run build` sem erro.

### E2E scenarios (concrete)

| Cenário | Steps | Expected | Maps to |
|---------|-------|----------|---------|
| Criar conta bancária | Login → `/accounts/new` → tipo banco → nome + cor → salvar | Redireciona lista; linha aparece; tipo `checking` no DB | ACC-01 |
| Criar cartão | Mesmo fluxo com tipo cartão + dias 10/17 | Row com `closing_day`/`due_day` | ACC-01 + ACC-03 |
| Arquivar | Menu → Arquivar | `archived_at` not null; estilo visual; sumiu do consolidado | ACC-02 + ACC-04 |
| Consolidado | Criar checking 10000 + wallet 5000 + card 9999 | UI mostra 15000 centavos formatados BRL | ACC-04 |
| Gráfico | Abrir `/accounts/[id]` | Linha ou empty + CTA conforme dados | ACC-05 |

### Wave 0 Gaps

- [ ] `tests/e2e/accounts.spec.ts` — cobre ACC-01…ACC-05 com tags `@acc-01` … `@acc-05` (alinhado a TST-04).
- [ ] Atualizar `tests/e2e/README.md` com pré-requisito de seed de contas (se necessário) e variáveis `.env.test`.
- [ ] `components/layout/bottom-nav.tsx` + `sidebar.tsx` — habilitar link `/accounts` (hoje placeholder Fase 1) para E2E navegável.
- [ ] Regenerar `types/database.ts` após migration (script manual ou `supabase gen types`).

*(RLS base para `accounts` já coberto indiretamente por `rls.spec.ts` + políticas existentes.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | yes | Sessão Supabase existente; páginas `(app)` já exigem usuário |
| V3 Session Management | yes | Cookies SSR `@supabase/ssr` |
| V4 Access Control | yes | RLS `auth.uid() = user_id` em `accounts` [VERIFIED: migration inicial] |
| V5 Input Validation | yes | Zod nos Server Actions + constraints SQL (`CHECK` tipo/dias) |
| V6 Cryptography | no | Fora do escopo desta fase |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Escrita cross-tenant | Spoofing | RLS INSERT/UPDATE `WITH CHECK` [CITED: Supabase RLS doc] |
| Payload gigante / nome SQLi | Tampering | Zod max length; Postgres `TEXT` com RLS |
| Cliente forjando `type` | Tampering | `CHECK (type IN (...))` no banco [VERIFIED: migration] |

## Sources

### Primary (HIGH confidence)

- `supabase/migrations/20260416000000_initial_schema.sql` — schema `accounts`, policies.
- https://supabase.com/docs/guides/database/postgres/row-level-security — políticas SELECT/INSERT/UPDATE, `WITH CHECK`, `auth.uid()` nulo.
- https://nextjs.org/docs/app/api-reference/functions/revalidatePath.md — `revalidatePath` em Server Functions.
- https://ui.shadcn.com/docs/components/chart.md — Recharts v3 + `ChartContainer`.

### Secondary (MEDIUM confidence)

- `package.json` / `playwright.config.ts` — comandos e versões reais do repo.
- `.planning/STATE.md` — decisões globais de schema e alertas de fases futuras.

### Tertiary (LOW confidence)

- Convenções bancárias BR para dias de fechamento — requer validação com usuário/dados reais (já sinalizado no STATE).

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — versões verificadas com `npm view` e arquivos do repo.
- Architecture: HIGH — padrões Supabase/Next já presentes; Server Actions são adição natural.
- Pitfalls: MEDIUM — histórico de saldo pré-Fase 3 depende de decisão de produto.

**Research date:** 2026-04-22  
**Valid until:** ~2026-05-22 (revalidar após upgrade Next/Supabase major)
