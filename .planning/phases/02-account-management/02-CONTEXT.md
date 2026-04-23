# Phase 2: Account Management — Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

O usuário pode **criar e gerenciar** contas bancárias (centralizador de fluxo), carteiras digitais e cartões de crédito; **editar** nome/cor; **arquivar** contas; **configurar** cartão com dia de fechamento e vencimento; ver **saldo consolidado** (bancos + carteiras, excluindo cartões) com política de atualização definida em discrição técnica; e ver **histórico de evolução de saldo** por conta em gráfico de linha (ACC-05).

**Fora do escopo:** lançamentos manuais, tags, parcelas, fatura, dashboard agregado — fases posteriores.

</domain>

<decisions>
## Implementation Decisions

### Tipos de conta na UI (ACC-01)

- **D-01:** Na Fase 2, a UI expõe **três categorias de criação** alinhadas ao uso: **Conta bancária** (centralizador de entradas/saídas, pagamentos de fatura e saldo em conta), **Carteira digital**, **Cartão de crédito** — mapeamento técnico: `checking`, `digital_wallet`, `credit_card`.
- **D-02:** O tipo **`savings` não aparece em nenhum lugar da UI nesta fase** (sem criação, sem filtros, sem rótulos). Permanece apenas no schema/check do Postgres para compatibilidade futura; nenhum fluxo da Fase 2 grava ou promove poupança.
- **D-03:** **Corrente vs poupança** como decisão de produto **não** é exigida: o usuário usa **nome** e **quantas contas** quiser para organizar mentalmente (ex.: segunda conta “Poupança” como **nome**, ainda `checking`).
- **D-04:** **Rótulos** de carteira e cartão na UI: **critério do implementador**, mantendo **PT-BR**, **mobile-first** e consistência com o **app shell** e a referência visual **Mobills** (`PROJECT.md`).

### Saldo consolidado “em tempo real” (ACC-04)

- **D-05:** Critério de “tempo real” deixado em **Claude's Discretion** com restrição explícita: **priorizar simplicidade** e **evitar dependência de WebSocket** na v1 salvo ganho claro. Padrão recomendado para pesquisa/plano: **atualizar após mutações** do próprio usuário (Server Actions + revalidação de cache / refetch de dados de contas), sem exigir **Supabase Realtime** na Fase 2.

### Arquivar e reativar (ACC-02)

- **D-06:** Conta **arquivada** permanece **na mesma lista** que as ativas, com **tratamento visual “arquivada”** (ex.: opacidade reduzida, badge ou ícone).
- **D-07:** Contas arquivadas **não entram** no **saldo consolidado** (ACC-04).
- **D-08:** Enquanto arquivada, o usuário **pode editar** nome, cor e, para cartão, **dias de fechamento e vencimento** (sem bloquear edição até “desarquivar”).

### Cartão — fechamento e vencimento (ACC-03)

- **D-09:** Dias de **fechamento** e **vencimento** são coletados **no mesmo fluxo de criação** do cartão (campos contextuais quando o tipo é cartão de crédito).
- **D-10:** Regras numéricas (ex.: 1–28 vs 1–31 vs último dia do mês) ficam em **Claude's Discretion**, **alinhadas aos requisitos da Fase 5** (fatura) e ao aviso de edge cases em `STATE.md` para `closing_day`.

### Cor da conta (ACC-01)

- **D-11:** Seleção de cor por **paleta fixa** (~8–12 opções). **Sem** seletor livre/hex obrigatório na Fase 2 (rápido no mobile, visual consistente).

### Gráfico de evolução de saldo (ACC-05)

- **D-12:** **Onde:** prioridade **tela de detalhe da conta**; **sparkline** ou mini-gráfico na **lista** só se **não poluir** o layout **mobile** (critério em Claude's Discretion).
- **D-13:** **Período padrão** ao abrir o gráfico: **últimos 30 dias**, com seletor de outros intervalos a cargo do plano.
- **D-14:** **Sem dados / sem movimentação no período:** **empty state** com ilustração ou bloco amigável + **CTA** “Lançar primeira transação”; o link/rota concreta pode ser **stub** até existir a Fase 3.

### Claude's Discretion

- Rótulos exatos PT-BR (carteira/cartão/banco) e microcopy.
- Estratégia técnica exata de refresh (revalidatePath, TanStack Query, etc.) e eventual Realtime se for incremental.
- Posicionamento do gráfico e componente de chart (biblioteca, eixos, granularidade temporal) respeitando ACC-05.
- Validação fina dos dias do cartão coerente com a Fase 5.
- Comportamento dos **pickers de conta** na Fase 3 para contas arquivadas (não decidido aqui).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap e requisitos

- `.planning/ROADMAP.md` — Seção **Phase 2: Account Management** (goal, success criteria, dependência da 01.1)
- `.planning/REQUIREMENTS.md` — **ACC-01** a **ACC-05** (contas, arquivar, cartão, consolidado, gráfico)
- `.planning/PROJECT.md` — Visão, **Constraints** (BRL, stack, self-hosted), inspiração Mobills

### Decisões anteriores e schema

- `.planning/phases/01-infrastructure-auth/01-CONTEXT.md` — Schema base `accounts`/`transactions`, RLS, INTEGER centavos, incremental migrations
- `supabase/migrations/20260416000000_initial_schema.sql` — Definição atual de `public.accounts` (campos de cartão para ACC-03 **não** existem ainda — nova migration nesta fase)
- `.planning/STATE.md` — Decisões globais de schema e nota sobre edge cases de **closing_day** (Fase 4/5)

### UI existente

- `.planning/phases/01-infrastructure-auth/01-UI-SPEC.md` — Tokens de design (spacing, tipografia, dark/zinc) para novas telas em `/(app)`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `types/database.ts` — Tipos gerados/alinhados às tabelas `accounts`, `transactions`
- `components/layout/sidebar.tsx`, `components/layout/bottom-nav.tsx` — Item **Contas** → `/accounts` (rota ainda a implementar)
- Padrões shadcn/ui + Tailwind já usados no app shell da Fase 1

### Established Patterns

- Saldo e valores monetários em **centavos** (`INTEGER`); datas de transação **DATE**
- **RLS** em `accounts` com quatro policies; `user_id` referencia `profiles`
- Contas com `archived_at` opcional (soft archive)

### Integration Points

- Novas páginas em `app/(app)/` (ou grupo equivalente) dentro do layout autenticado
- Mutações via Server Actions ou padrão já adotado no projeto + invalidação de dados de contas
- `supabase/migrations/` — nova migration para campos de cartão (fechamento/vencimento) exigidos por ACC-03

</code_context>

<specifics>
## Specific Ideas

- Referência de UX: **Mobills** (`PROJECT.md`) para densidade e linguagem financeira BR.
- Conta bancária como **“centralizador”** operacional, não como produto bancário rígido corrente/poupança.

</specifics>

<deferred>
## Deferred Ideas

- **Tipo `savings` na UI** — reavaliar em milestone futuro se houver demanda explícita.
- **Supabase Realtime** para saldo multi-dispositivo — fase própria ou melhoria se a abordagem por refetch for insuficiente na prática.

### Reviewed Todos (not folded)

- Nenhum item retornado por `todo match-phase` para a fase 02.

</deferred>

---

*Phase: 02-account-management*
*Context gathered: 2026-04-22*
