---
phase: 2
reviewers:
  - gemini (executado)
  - claude (falha — não autenticado)
  - codex (executado)
  - coderabbit (executado — modo prompt-only / diff do repositório)
  - opencode (ausente no PATH)
reviewed_at: 2026-04-23T01:22:48.874Z
plans_reviewed:
  - 02-01-PLAN.md
  - 02-02-PLAN.md
  - 02-03-PLAN.md
  - 02-04-PLAN.md
---

# Cross-AI Plan Review — Phase 2

Execução de `/gsd-review --phase 2 --all`: **Gemini**, **Codex** e **CodeRabbit** concluíram; **Claude Code** retornou erro de login; **OpenCode** não instalado. O prompt completo (~72 KB) foi montado a partir de `PROJECT.md` (80 linhas), trecho do roadmap da Fase 2, `REQUIREMENTS.md` (ACC), `02-CONTEXT.md`, `02-RESEARCH.md` completo e os quatro `02-*-PLAN.md`.

**Codex:** o prompt foi passado por **stdin** (`cat … | codex exec --skip-git-repo-check -`); passar o texto inteiro só como argumento deixou o processo aguardando stdin.

---

## Gemini Review

The following is a structured review of the implementation plans for **Phase 2: Account Management**.

### Summary

The implementation plans for Phase 2 are exceptionally well-structured, adhering strictly to the technical constraints and domain decisions established in the research and context documents. The phased approach (Database → Domain → UI → E2E) ensures a logical flow of dependencies, while the inclusion of explicit "Claude's Discretion" points and "Must Haves" provides clear guidance for implementation. The strategy for handling the balance history (ACC-05) as a placeholder constant until transactions are implemented in Phase 3 is a pragmatic decision that avoids premature complexity while fulfilling the requirement for a visual chart.

### Strengths

- **Strict Adherence to Decisions:** The plans explicitly handle the exclusion of the `savings` type from the UI (D-02) and the exclusion of archived/credit accounts from the consolidated balance (ACC-04, D-07), ensuring no requirement drift.
- **Robust Domain Layer:** Use of Zod for server-side validation and Server Actions with `revalidatePath` ensures data integrity and UI consistency without the overhead of WebSockets, following the "simplicity first" mandate (D-05).
- **Clear Testing Strategy:** The E2E plan (02-04) maps 1:1 to the requirements (ACC-01..05) and utilizes specific `data-testid` and `data-value` attributes for reliable, centavo-precise assertions.
- **Database Integrity:** The migration design in 02-01 uses `smallint` and a targeted `CHECK` constraint for credit card days, preventing invalid data at the storage level.
- **UI Consistency:** The plans correctly incorporate the `force-dynamic` requirement for financial routes and leverage shadcn's `chart` component for a seamless zinc/dark aesthetic.

### Concerns

- **Environment Dependency (MEDIUM):** `02-01-PLAN.md` marks the `supabase db push` task as `autonomous: false`. In a non-interactive or headless environment, this will require manual intervention or a pre-linked project. If the agent cannot perform the push, subsequent waves depending on the new schema will fail.
- **Type Regeneration (LOW):** Task 3 in `02-01-PLAN` suggests a manual update to `types/database.ts`. While efficient, it is prone to human error. If `supabase gen types` is used instead, care must be taken to ensure no manual extensions from Phase 1 are lost.
- **Date/Timezone Edge Cases (LOW):** `getBalanceHistoryForAccount` uses the UTC date of the server. While standard, this may cause minor visual discrepancies for users in different timezones (e.g., Brazil/BRT) where "today" might start/end at different times relative to the server.

### Suggestions

- **Supabase Link Check:** Add a pre-check task in `02-01-PLAN` to verify if the project is linked (`supabase link`), which can help diagnose why a `db push` might fail before it blocks the wave.
- **User Feedback (Toast):** While `revalidatePath` handles data refresh, the plans should explicitly include the use of toasts (e.g., shadcn's `toast`) in the UI components (`02-03`) to confirm successful creation, editing, or archiving of accounts.
- **Archived Toggle:** In `app/(app)/accounts/page.tsx`, consider implementing a simple "Show/Hide Archived" toggle. Although the requirement says "same list," a growing number of archived accounts could eventually clutter the mobile view.
- **Zod Error Handling:** Ensure the Server Actions in `02-02-PLAN` return structured error objects that the UI can easily map to `react-hook-form` field errors, specifically for the `closing_day` and `due_day` fields.

### Risk Assessment

**Overall Risk Level: LOW**

The architectural integrity of the plans is high. The use of established patterns (Supabase RLS, Next.js Server Actions) and the comprehensive validation plan (E2E with Playwright) mitigate most technical risks. The dependencies are correctly sequenced, and the scope is well-defined. The primary risk remains operational (CLI execution in the environment), which is addressed by the `autonomous: false` flag.

---

*Review based on Phase 2 Plans (02-01 through 02-04) and Project Context.*

---

## Claude Review

*Tentativa: `claude -p "$(cat /tmp/gsd-review-prompt-02.md)"`.*

**Resultado:** falha de autenticação.

```text
Not logged in · Please run /login
```

---

## Codex Review

(Revisão por plano; linha corrompida no final do stdout original foi omitida.)

## 02-01-PLAN.md

### 1. Summary

Plano bem focado em desbloquear ACC-03 no nível de schema e tipagem, com ordem correta (migration → push → tipos). O escopo está controlado, mas há risco de regra de integridade ficar permissiva demais para cartões.

### 2. Strengths

- Sequenciamento correto para evitar drift entre banco e TypeScript.
- Mantém RLS intacto (boa decisão para reduzir risco nesta wave).
- Critérios de aceite e comandos de verificação objetivos.
- Reconhece bloqueios operacionais de `supabase db push` sem forçar workaround inseguro.

### 3. Concerns

- **MEDIUM:** `CHECK (type != 'credit_card' OR (closing_day BETWEEN... AND due_day BETWEEN...))` permite `NULL` para cartão (em PostgreSQL, `CHECK` com `NULL` não falha), podendo violar ACC-03 na prática.
- **LOW:** Atualização manual de `types/database.ts` pode divergir do schema real.
- **LOW:** Não explicita estratégia de rollback da migration (aceitável, mas aumenta custo de correção).

### 4. Suggestions

- Fortalecer constraint para cartão: exigir `closing_day IS NOT NULL` e `due_day IS NOT NULL`.
- Preferir geração automática de tipos (`supabase gen types`) e só editar manualmente se necessário.
- Registrar no summary da wave a semântica escolhida para dias 29–31 (ponte para Fase 5).

### 5. Risk Assessment

**MEDIUM** — risco principal é integridade parcial de ACC-03 se `NULL` escapar para `credit_card`.

---

## 02-02-PLAN.md

### 1. Summary

Plano sólido de domínio (schemas, actions, queries, histórico) e cobre quase todos os requisitos funcionais antes da UI. O maior ponto é ambiguidade de regra de consolidado e alguns detalhes de segurança/contrato de API.

### 2. Strengths

- Boa centralização de regras em `lib/accounts/*`.
- Uso de Server Actions com `revalidatePath` alinhado a D-05.
- Bloqueia `savings` na camada de entrada UI (D-02).
- Define explicitamente a regra transitória de ACC-05 (“pré-Fase 3”).

### 3. Concerns

- **HIGH:** `updateAccountSchema` permitindo `archived_at` vindo do cliente abre caminho para manipulação de estado de arquivo fora dos fluxos dedicados.
- **MEDIUM:** `getConsolidatedBalanceCents()` exclui `savings`; isso conflita com possível expectativa de legado (decisão não totalmente travada).
- **MEDIUM:** Falta `server-only` em módulos de query/histórico; risco de import acidental em client component.
- **LOW:** Série ACC-05 usa “hoje UTC”; pode gerar percepção incorreta em fuso BR.
- **LOW:** Erros serializados como string genérica podem reduzir debuggabilidade/UX de formulário.

### 4. Suggestions

- Remover `archived_at` do schema público de update e manter arquivo/desarquivo só em actions dedicadas.
- Travar decisão de produto sobre `savings` no consolidado e documentar explicitamente.
- Adicionar `import 'server-only'` em `queries.ts` e `balance-history.ts`.
- Validar `id` como UUID nas actions.
- Retornar erro estruturado (`code`, `message`, `field`) em vez de string única.

### 5. Risk Assessment

**MEDIUM-HIGH** — boa base, mas há risco funcional e de contrato se `archived_at` e regra de consolidado não forem ajustados.

---

## 02-03-PLAN.md

### 1. Summary

Plano entrega valor visível e cobre ACC-01…05 na interface, mas está muito denso para uma wave única (rotas + componentes + dependências + nav). Há também pequenos desalinhamentos de critérios com arquitetura esperada de App Router.

### 2. Strengths

- Mapeia claramente as rotas necessárias e integra com layout existente.
- Inclui `force-dynamic` e contrato E2E (`data-testid`/`data-value`) para ACC-04.
- Trata arquivadas na mesma lista (D-06) e prevê empty state (D-14).
- Habilita navegação de Contas sem abrir escopo indevido em Dashboard/Transactions.

### 3. Concerns

- **HIGH:** Escopo grande demais em uma única wave aumenta risco de regressão e retrabalho.
- **MEDIUM:** Critério que busca `getBalanceHistoryForAccount` em `balance-chart.tsx` sugere acoplamento errado (fetch deveria ficar em page server).
- **MEDIUM:** Regra de empty state baseada em “soma zero” não representa “sem movimentação”; pode violar D-14 semanticamente.
- **LOW:** `href="#"` para CTA gera UX/acessibilidade ruim.
- **LOW:** Falta menção explícita a `loading.tsx`/`error.tsx` para novas rotas.

### 4. Suggestions

- Dividir execução em duas etapas: (1) rotas/forms/lista; (2) gráfico + polimento + nav.
- Manter `getBalanceHistoryForAccount` apenas em server page e passar dados prontos ao chart.
- Definir empty state por ausência de eventos/série útil, não por saldo zero.
- Trocar `href="#"` por rota real stub (`/transactions`) ou botão desabilitado com texto claro.
- Adicionar `loading`/`error` boundaries nas páginas de contas.

### 5. Risk Assessment

**MEDIUM-HIGH** — entrega completa, mas com risco de integração e de interpretação incorreta de ACC-05.

---

## 02-04-PLAN.md

### 1. Summary

Plano de testes é rastreável e forte em cobertura por requisito, mas tem risco alto ao introduzir `service_role` em E2E e ao colocar todos os cenários no smoke path.

### 2. Strengths

- Excelente rastreabilidade (`@acc-01`…`@acc-05` + README).
- Contrato explícito para ACC-04 via `data-testid`.
- Integração clara com projeto Playwright e setup de autenticação.

### 3. Concerns

- **HIGH:** Uso de `SUPABASE_SERVICE_ROLE_KEY` em testes E2E pode mascarar problemas reais de autorização e ampliar superfície de risco operacional.
- **MEDIUM:** Todos os 5 testes como `@smoke` tende a deixar pipeline mais lento e instável.
- **MEDIUM:** ACC-03 aceita assert opcional; risco de “passar” sem provar persistência real de `closing_day/due_day`.
- **LOW:** Falta estratégia explícita de limpeza/isolamento de dados por teste.

### 4. Suggestions

- Evitar service role no fluxo principal; preferir criação via UI/actions autenticadas do usuário de teste.
- Deixar smoke mínimo (1–2 cenários críticos) e mover o restante para suite de regressão.
- Tornar ACC-03 obrigatório com assert de persistência (ex.: reabrir edição e validar campos).
- Garantir isolamento com prefixos únicos + cleanup no fim da suite.

### 5. Risk Assessment

**MEDIUM-HIGH** — cobertura é boa, mas estratégia de dados/teste pode comprometer confiabilidade e segurança.

---

## Overall Risk Assessment (Codex)

**MEDIUM-HIGH**. A arquitetura geral está bem pensada e a ordem entre waves é boa, mas há quatro riscos centrais: integridade incompleta de ACC-03 no banco, contrato de atualização excessivamente permissivo (`archived_at`), ambiguidade funcional no consolidado (`savings`) e estratégia de E2E com `service_role`. Ajustando esses pontos, o pacote cai para **MEDIUM/LOW**.

---

## Cross-Plan Risk Snapshot (Codex)

- **Most likely delivery blocker:** 02-03 server/client boundary mismatch for history fetch.
- **Most likely correctness dispute:** consolidated balance treatment of legacy `savings`.
- **Most likely CI pain:** 02-04 data setup strategy and flaky selectors/state leakage.

Overall, the phase plan set is **well-structured and near-complete**, with primary risk concentrated in **implementation detail correctness (Wave 3)** and **test strategy robustness (Wave 4)**.

---

## CodeRabbit Review

O CodeRabbit em `--prompt-only` analisou o estado do repositório (incluindo o arquivo de revisão anterior), não o prompt consolidado da fase. Saída relevante:

```text
Starting CodeRabbit review in plain text mode...
Review directory: /home/eduardo.possani/devs/fronts/open-ledger
...
File: .planning/phases/02-account-management/02-REVIEWS.md
Line: 9
Type: potential_issue

Prompt for AI Agent:
Verify each finding against the current code and only fix it if needed.

In @.planning/phases/02-account-management/02-REVIEWS.md at line 9, The document uses two different labels for the fallback reviewer—frontmatter "fallback-cursor (revisão estruturada interna)" and the section header "Fallback: revisão estrutururada (orquestrador)"; pick the correct source ...
```

**Nota:** esta rodada substitui o documento; a inconsistência e o typo apontados referem-se à revisão anterior. Não há mais seção “Fallback” obrigatória aqui — as revisões principais vêm de **Gemini** e **Codex**.

---

## OpenCode Review

*Não executado — CLI `opencode` não instalada no PATH.*

---

## Consensus Summary

### Agreed strengths (Gemini + Codex)

- Onda **schema → domínio → UI → E2E** está na ordem certa e com `depends_on` coerente.
- **RLS** preservado na migration; regras de produto (sem `savings` na UI, consolidado sem cartão/arquivada) estão refletidas nos planos.
- **Zod + Server Actions + `revalidatePath`** é um núcleo sólido para ACC-01..04 sem Realtime.
- **E2E** com tags `@acc-*`, `data-testid`/`data-value` e README é rastreável e alinhado à iniciativa TST.

### Agreed concerns (prioridade)

1. **Operacional / CI:** `supabase db push` com `autonomous: false` e ambientes headless (Gemini **MEDIUM**; Codex reforça bloqueio de waves).
2. **Integridade ACC-03 no Postgres:** `CHECK` que não força `NOT NULL` em `credit_card` permite `NULL` em dias — Codex **MEDIUM**; Gemini assume integridade pelo `CHECK` “targeted” (ângulos diferentes — ver divergências).
3. **Superfície de contrato / segurança:** `archived_at` editável via `updateAccountSchema` (Codex **HIGH**); ausência de `server-only` em módulos servidor (Codex **MEDIUM**).
4. **Wave 3:** escopo denso + fetch de histórico no client vs server + critério de empty state vs saldo zero (Codex **MEDIUM/HIGH**).
5. **Wave 4:** `service_role` nos E2E e tudo em `@smoke` (Codex **HIGH/MEDIUM**); Gemini enfatiza a estratégia de testes como **força**, não como risco — tratar como **divergência** abaixo.

### Divergent views

- **Nível de risco global:** Gemini classifica **LOW** (ênfase em padrões maduros e plano bem fechado); Codex classifica **MEDIUM-HIGH** (ênfase em detalhes de implementação e estratégia de teste). Recomendação: tratar o pacote como **MEDIUM** até endereçar CHECK de cartão, contrato de `archived_at` e decisão explícita sobre `savings` no consolidado e sobre **service role** nos E2E.

---

*Para incorporar no planejamento:* `/gsd-plan-phase 2 --reviews`
