---
phase: 2
reviewers:
  - gemini (CLI — executado)
  - claude (CLI — falha: não autenticado)
  - codex (ausente no PATH)
  - coderabbit (ausente no PATH)
  - opencode (ausente no PATH)
reviewed_at: 2026-04-23T00:59:04.736Z
plans_reviewed:
  - 02-01-PLAN.md
  - 02-02-PLAN.md
  - 02-03-PLAN.md
  - 02-04-PLAN.md
---

# Cross-AI Plan Review — Phase 2

Execução de `/gsd-review --phase 2 --all`: **Gemini CLI** concluiu revisão headless (`gemini -p … --approval-mode plan`). **Claude Code CLI** segue sem sessão (`Not logged in · Please run /login`). **Codex**, **CodeRabbit** e **OpenCode** não estão no PATH. O consenso abaixo reflete principalmente o Gemini; não há segunda opinião CLI independente nesta rodada.

---

## Gemini Review

Este é o review técnico dos planos de implementação para a **Fase 2: Account Management** do projeto OPEN-LEDGER.

### 1. Summary

Os planos para a Fase 2 estão excepcionalmente bem estruturados e demonstram uma compreensão profunda dos requisitos (ACC-01 a ACC-05) e das decisões de design (D-01 a D-14). A estratégia de dividir a implementação em quatro ondas (Wave 1: Schema, Wave 2: Domínio/Actions, Wave 3: UI/Gráficos, Wave 4: E2E) é correta e minimiza riscos de integração. O uso de `revalidatePath` para simular o "tempo real" atende à restrição de evitar WebSockets na v1, e a decisão de usar uma série constante para o gráfico de evolução até a implementação das transações (Fase 3) é uma solução pragmática e limpa para entregar valor imediato sem violar os limites da fase.

### 2. Strengths

- **Rastreabilidade:** O mapeamento direto entre as tags dos testes E2E (`@acc-01` a `@acc-05`) e os requisitos de negócio garante uma cobertura verificável.
- **Segurança (RLS):** O plano reforça o uso das policies de Row Level Security existentes, garantindo que o `user_id` nunca seja injetado pelo cliente, mas derivado da sessão no servidor.
- **Arquitetura pragmática:** A decisão de implementar o gráfico de evolução (ACC-05) como uma série constante baseada no saldo atual evita a complexidade de calcular acumulados de transações que ainda não existem formalmente no fluxo.
- **Qualidade da UI:** A inclusão de `data-testid` específicos (ex.: `consolidated-balance-cents`) nos planos de UI facilita a automação de testes robustos.
- **Conformidade visual:** A paleta de cores fixa e os estados visuais para contas arquivadas (opacidade 60%) seguem rigorosamente as diretrizes mobile-first e a inspiração no Mobills.

### 3. Concerns

- **Edge case de calendário (LOW):** O uso de `BETWEEN 1 AND 31` para `closing_day` no SQL é funcional, mas meses como fevereiro exigirão lógica de "clamp" (limitar ao último dia do mês) na Fase 5. O plano menciona isso em comentários, o que mitiga o risco imediato.
- **Tailwind v4 vs shadcn (LOW):** O projeto utiliza Tailwind v4 (`tailwindcss: 4.1.14`). A execução de `npx shadcn@latest add chart` pode exigir ajustes manuais no `globals.css` se o CLI do shadcn tentar injetar tokens no formato v3.
- **Sincronia de tipos (MEDIUM):** O plano 02-01 sugere atualização manual de `types/database.ts`. Embora seguro, há risco de erro humano. Recomenda-se priorizar `supabase gen types` se o ambiente local permitir.

### 4. Suggestions

- **Validação do tipo de conta:** No Zod schema (`lib/accounts/schema.ts`), certifique-se de que a validação de `closing_day`/`due_day` seja condicionada via `.refine()` ou `z.discriminatedUnion()` para garantir que esses campos sejam `null` em contas que não são `credit_card`.
- **Empty state do gráfico:** Na Wave 3, ao implementar o `BalanceChart`, considere exibir um "Skeleton" ou estado de carregamento explícito enquanto a query server-side é resolvida para evitar saltos de layout (CLS) no mobile.
- **Formatação de moeda:** Centralize a lógica de formatação de centavos para BRL em `lib/utils.ts` (ex.: `formatCentsToBRL`) para garantir consistência entre o saldo da lista e o eixo Y do gráfico.

### 5. Risk Assessment

**Overall risk: LOW**

A justificativa para o risco baixo é a clareza dos contratos entre as fases e a dependência mínima de novas tecnologias (apenas `recharts`). O isolamento entre a lógica de persistência e a UI, aliado a uma suíte de testes E2E que já nasce integrada à config do Playwright, torna a execução segura e fácil de validar.

---

## Claude Review

*Tentativa: `claude -p "$(cat /tmp/gsd-review-prompt-02-full.md)"`.*

**Resultado:** falha de autenticação.

```text
Not logged in · Please run /login
```

**Próximo passo:** autenticar o Claude Code neste ambiente e repetir `/gsd-review --phase 2 --all` para obter segunda opinião.

---

## Codex Review

*Não executado — CLI `codex` não instalada no PATH.*

---

## CodeRabbit Review

*Não executado — CLI `coderabbit` não instalada no PATH.*

---

## OpenCode Review

*Não executado — CLI `opencode` não instalada no PATH.*

---

## Consensus Summary

Há **apenas uma** revisão CLI bem-sucedida (Gemini); consenso multi-modelo é **parcial**.

### Agreed strengths

- Ondas 02-01 → 02-04 bem ordenadas; contratos claros entre schema, domínio, UI e E2E.
- RLS + `user_id` a partir da sessão, não do cliente.
- ACC-05 como série constante até a Fase 3 é pragmático e alinhado ao escopo.
- `data-testid` / tags `@acc-*` favorecem rastreio e smoke estável.

### Agreed concerns (prioridade)

1. **MEDIUM — Tipos TS vs schema:** preferir `supabase gen types` quando possível para reduzir drift em `types/database.ts`.
2. **LOW — shadcn chart + Tailwind v4:** validar tokens/`globals.css` após `npx shadcn add chart`.
3. **LOW — Dias 1–31 vs calendário real:** aceitável na Fase 2; clamp explícito na Fase 5 (já antecipado nos planos).

### Divergent views

*Não aplicável nesta rodada — Claude/Codex/OpenCode/CodeRabbit não produziram revisão.*

---

*Incorporar no planejamento:* `/gsd-plan-phase 2 --reviews`

*Melhorar cobertura de peer review:* instalar/autenticar **Claude** ou **Codex** e rodar `/gsd-review --phase 2 --all` de novo.
