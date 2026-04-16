---
phase: 1
slug: infrastructure-auth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-15
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (nenhum instalado — Wave 0 instala) |
| **Config file** | `playwright.config.ts` — Wave 0 cria |
| **Quick run command** | `npx playwright test --grep @smoke` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Sem testes ainda; Wave 0 cria a infraestrutura
- **After every plan wave:** `npx playwright test --grep @smoke`
- **Before `/gsd-verify-work`:** Full suite deve estar verde
- **Max feedback latency:** ~30 segundos

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-xx-01 | 01 | 0 | AUTH-01 | — | Apenas usuários autenticados acessam rotas protegidas | E2E smoke | `npx playwright test --grep @auth-01` | ❌ W0 | ⬜ pending |
| 1-xx-02 | 01 | 0 | AUTH-02 | — | Session persiste em cookies HTTP-only | E2E smoke | `npx playwright test --grep @auth-02` | ❌ W0 | ⬜ pending |
| 1-xx-03 | 01 | 0 | AUTH-03 | — | RLS impede acesso a dados de outro usuário | Integration | `supabase test db` | ❌ W0 | ⬜ pending |
| 1-xx-04 | 01 | 0 | AUTH-04 | — | Perfil exibe nome/avatar do Google | E2E smoke | `npx playwright test --grep @auth-04` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/e2e/auth.spec.ts` — stubs para AUTH-01, AUTH-02, AUTH-04
- [ ] `tests/e2e/rls.spec.ts` — stubs para AUTH-03 (isolamento de dados RLS)
- [ ] `playwright.config.ts` — configuração base com baseURL local
- [ ] `npm install -D @playwright/test && npx playwright install chromium` — framework install
- [ ] `supabase/seed.sql` — usuário de teste para E2E

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Login via Google OAuth (fluxo completo) | AUTH-01 | Google OAuth redireciona para accounts.google.com — não automatizável sem credenciais reais | 1. Iniciar app local; 2. Clicar "Login com Google"; 3. Autenticar com conta de teste; 4. Verificar redirecionamento para app |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
