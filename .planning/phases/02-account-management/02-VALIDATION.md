---
phase: 02
slug: account-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-22
---

# Phase 02 — Validation Strategy

> Contrato de validação por amostragem (Nyquist) durante a execução da Fase 2 — Account Management.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.x + ESLint (`npm run lint`) |
| **Config file** | `playwright.config.ts` |
| **Quick run command** | `npm run lint` && `npm run test:e2e:smoke` |
| **Full suite command** | `npm run test:e2e:smoke` (expandir com `npm run test:e2e:auth` quando aplicável ao fluxo de contas) |
| **Estimated runtime** | ~120 seconds (smoke; varia com máquina) |

---

## Sampling Rate

- **After every task commit:** `npm run lint` + smoke direcionado (`npx playwright test tests/e2e/accounts.spec.ts` quando o arquivo existir)
- **After every plan wave:** `npm run test:e2e:smoke`
- **Before `/gsd-verify-work`:** smoke + `npm run build` sem erro
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | ACC-03 | T-02-01 / V5 | CHECK + Zod nos dias do cartão | migration grep | `rg closing_day supabase/migrations/` | ⬜ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | ACC-01 | T-02-02 / V4 | RLS `user_id` | E2E | `npx playwright test tests/e2e/accounts.spec.ts -g @acc-01` | ⬜ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | ACC-02 | — | UPDATE só próprio user | E2E | `npx playwright test tests/e2e/accounts.spec.ts -g @acc-02` | ⬜ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | ACC-04 | — | Soma exclui cartão e arquivadas | E2E | `npx playwright test tests/e2e/accounts.spec.ts -g @acc-04` | ⬜ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | ACC-05 | — | Empty state + série 30d | E2E | `npx playwright test tests/e2e/accounts.spec.ts -g @acc-05` | ⬜ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/e2e/accounts.spec.ts` — cenários com tags `@acc-01` … `@acc-05` (TST-04)
- [ ] `tests/e2e/README.md` — pré-requisitos de seed / `.env.test` para contas
- [ ] Nav: `components/layout/sidebar.tsx` e `bottom-nav.tsx` — link ativo para `/accounts`
- [ ] Regenerar `types/database.ts` após migration de `closing_day` / `due_day`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dias de fechamento reais (bancos BR) | ACC-03 | Edge cases de calendário | Validar com dados reais antes da Fase 5; registrar em SUMMARY se deferido |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 180s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
