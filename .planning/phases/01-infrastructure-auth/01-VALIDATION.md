---
phase: 1
slug: infrastructure-auth
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-15
updated: 2026-04-17
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (`@playwright/test` ^1.59) |
| **Config file** | `playwright.config.ts` |
| **Quick run command** | `npx playwright test --grep @smoke` (ou `npm run test:e2e -- --grep @smoke`) |
| **Full suite command** | `npm run test:e2e` / `npx playwright test` |
| **Estimated runtime** | ~10–30 s (smoke local, 1 worker) |

**Projetos:** `setup` → `auth.setup.ts`; `chromium` (com `storageState`) → `auth.spec.ts`, `rls.spec.ts`; `chromium-unauth` (sem storage) → `auth-unauthenticated.spec.ts`.

**Ambiente:** `.env.local` com Supabase local; seed em `supabase/seed.sql`. Testes RLS usam `SUPABASE_SERVICE_ROLE_KEY` (via `tests/e2e/helpers/env.ts`). Em CI, definir `env -u CI` se for necessário reutilizar servidor já em `:3000` (Playwright `reuseExistingServer`).

---

## Sampling Rate

- **After every task commit:** `npx playwright test --grep @smoke` quando o commit tocar auth/RLS/E2E
- **After every plan wave:** `npx playwright test --grep @smoke`
- **Before `/gsd-verify-work`:** suite smoke (mínimo) verde
- **Max feedback latency:** ~30 segundos (smoke)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-06-a1 | 06 | 1 | AUTH-01 | — | Rotas protegidas exigem sessão; login oferece Google; fluxo autenticado redireciona | E2E smoke | `npx playwright test --grep @auth-01` | `auth-unauthenticated.spec.ts`, `auth.spec.ts` | ✅ green |
| 1-06-a2 | 06 | 1 | AUTH-02 | — | Sessão persiste após reload (cookies / storage) | E2E smoke | `npx playwright test --grep @auth-02` | `auth.spec.ts` | ✅ green |
| 1-06-a3 | 06 | 1 | AUTH-03 | — | RLS impede leitura de dados de outro usuário | Integration (API) | `npx playwright test --grep @auth-03` | `rls.spec.ts` | ✅ green |
| 1-06-a4 | 06 | 1 | AUTH-04 | — | Perfil exibe dados do usuário; logout e UI read-only | E2E smoke | `npx playwright test --grep @auth-04` | `auth.spec.ts` | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/e2e/auth.spec.ts` — AUTH-01 (autenticado), AUTH-02, AUTH-04
- [x] `tests/e2e/auth-unauthenticated.spec.ts` — AUTH-01 (não autenticado + authorize)
- [x] `tests/e2e/rls.spec.ts` — AUTH-03
- [x] `playwright.config.ts` — baseURL, projetos setup / chromium / chromium-unauth
- [x] Dependências Playwright no `package.json` + `npx playwright install chromium`
- [x] `supabase/seed.sql` — usuário(s) de teste para E2E

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Login via Google OAuth (fluxo completo em navegador real) | AUTH-01 | Conta Google real, 2FA, políticas Google — fora do escopo da suite CI | Conforme checkpoint em `01-06-PLAN.md`: login Google → perfil → logout → F5; marcar **aprovado** na revisão da fase ou descrever falhas |
| (Opcional) `E2E_AUTH_MODE=google` | AUTH-01 | Setup headed / interação humana | Ver `01-06-SUMMARY.md` e `auth.setup.ts` |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: smoke cobre requisitos após mudanças em auth
- [x] Wave 0 references implementados
- [x] No watch-mode flags nos comandos documentados
- [x] Feedback latency < 30s (smoke)
- [x] `nyquist_compliant: true` set in frontmatter (automated + manual-only explícito)

**Approval:** automated Nyquist audit passed 2026-04-17; **checkpoint humano Google** ainda conforme `01-06-SUMMARY.md` até aprovação explícita.

---

## Validation Audit 2026-04-17

| Metric | Count |
|--------|-------|
| Gaps found | 5 |
| Resolved | 5 |
| Escalated | 0 |

**Gaps (documentation / map drift):** mapa ainda em “Wave 0 / pending”; comando AUTH-03 incorreto (`supabase test db` vs testes `rls.spec.ts`); infra “Playwright não instalado”; checklist Wave 0 desatualizado; `chromium-unauth` / `auth-unauthenticated.spec.ts` omitidos do mapa.

**Resolução:** mapa e infra alinhados ao código e ao `01-06-SUMMARY.md`; execução verificada: `npx playwright test --grep @smoke` — 13 passed (incl. setup + unauth + auth + RLS).
