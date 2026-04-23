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
| **Suite completa (local)** | `npm run test:e2e` — todos os projetos e todos os testes (modo auth = `E2E_AUTH_MODE` no `.env`, padrao **password**) |
| **Smoke (feedback rapido)** | `npm run test:e2e:smoke` — equivalente a `playwright test --grep @smoke` |
| **Estimated runtime** | ~10–30 s (smoke, 1 worker); suite completa similar se todos os testes forem `@smoke` |

**Projetos:** `setup` → `auth.setup.ts`; `chromium` (com `storageState`) → `auth.spec.ts`, `rls.spec.ts`; `chromium-unauth` (sem storage) → `auth-unauthenticated.spec.ts`.

**Ambiente:** `.env.local` com Supabase local; seed em `supabase/seed.sql`. Testes RLS usam `SUPABASE_SERVICE_ROLE_KEY` (via `tests/e2e/helpers/env.ts`).

**CI (`reuseExistingServer`):** com **`CI=true`** (GitHub Actions, GitLab CI, etc.), o Playwright **sempre** sobe o `webServer` (`npm run dev`) em porta livre — confiavel na pipeline. Localmente, sem `CI`, pode reutilizar servidor ja em `:3000`.

---

## Pipeline — comandos por nivel

| Objetivo | Comando npm | Quando usar |
|----------|-------------|-------------|
| **Validar tudo (automacao padrao seed)** | `npm run test:e2e` | PR/local com Supabase + `.env.local`; em CI o provedor ja exporta `CI=true` |
| **So regressao rapida @smoke** | `npm run test:e2e:smoke` | Pre-commit, matrix rapida; na CI use com `CI=true` no ambiente do job |
| **Um requisito (granular)** | `npm run test:e2e:auth-01` … `test:e2e:auth-04` | Jobs paralelos por requisito ou depuracao; o Playwright ainda executa o **setup** quando o projeto `chromium` participa do grep |
| **OAuth Google real (opcional)** | `npm run test:e2e:google` | Job separado com secrets `E2E_GOOGLE_*` + `GOOGLE_*` validos; Chrome **headed** no `playwright.config` — em Linux headless CI use **xvfb-run** ou runner com display |

**Confiabilidade 100% na pipeline (recomendado):** um job obrigatorio com **`CI=true`** + `npm run test:e2e:smoke` (ou `test:e2e`) com **`E2E_AUTH_MODE`** omitido ou `password`, Supabase aplicado (seed) e variaveis anon/service no secret store. O fluxo **Google completo** nao e deterministico (Google pode bloquear automacao); trate `npm run test:e2e:google` como **job opcional** ou apenas local, nao como unico gate de merge.

**Windows:** prefixos `env VAR=...` nos scripts podem falhar no `cmd.exe`; use `set E2E_AUTH_MODE=google&& npx playwright test --grep @smoke` ou rode os mesmos argumentos via Git Bash / WSL.

---

## Sampling Rate

- **After every task commit:** `npm run test:e2e:smoke` quando o commit tocar auth/RLS/E2E
- **After every plan wave:** `npm run test:e2e:smoke`
- **Before `/gsd-verify-work`:** suite smoke (mínimo) verde (`npm run test:e2e:smoke` ou `npm run test:e2e`)
- **Max feedback latency:** ~30 segundos (smoke)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-06-a1 | 06 | 1 | AUTH-01 | — | Rotas protegidas exigem sessão; login oferece Google; fluxo autenticado redireciona | E2E smoke | `npm run test:e2e:auth-01` | `auth-unauthenticated.spec.ts`, `auth.spec.ts` | ✅ green |
| 1-06-a2 | 06 | 1 | AUTH-02 | — | Sessão persiste após reload (cookies / storage) | E2E smoke | `npm run test:e2e:auth-02` | `auth.spec.ts` | ✅ green |
| 1-06-a3 | 06 | 1 | AUTH-03 | — | RLS impede leitura de dados de outro usuário | Integration (API) | `npm run test:e2e:auth-03` | `rls.spec.ts` | ✅ green |
| 1-06-a4 | 06 | 1 | AUTH-04 | — | Perfil exibe dados do usuário; logout e UI read-only | E2E smoke | `npm run test:e2e:auth-04` | `auth.spec.ts` | ✅ green |

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
