---
status: passed
phase: 02-account-management
verified: 2026-04-23
---

# Phase 02 — Goal Verification

## Goal (ROADMAP)

Gestão de contas (criar/editar/arquivar), saldo consolidado, cartão com dias de fechamento/vencimento, gráfico ACC-05 stub, E2E rastreável.

## Must-haves (sampling)

| ID | Evidence |
|----|----------|
| ACC-01 | `tests/e2e/accounts.spec.ts` `@acc-01`; UI três tipos sem `savings` |
| ACC-02 | `@acc-02` cobre editar + arquivar + badge |
| ACC-03 | Migration + `@acc-03` |
| ACC-04 | `getConsolidatedBalanceCents` + `data-testid="consolidated-balance-cents"` + `@acc-04` |
| ACC-05 | `getBalanceHistoryForAccount` + `BalanceChart` + `@acc-05` |

## Automated

- `npm run lint`
- `npm run build`
- `E2E_AUTH_MODE=password npm run test:e2e:smoke`

## Human verification

Nenhum item obrigatório pendente para marcar a fase; smoke cobre fluxos principais em ambiente local com seed.

## Gaps

Nenhum gap bloqueante identificado nesta verificação.
