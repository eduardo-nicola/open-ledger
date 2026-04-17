---
phase: 01-infrastructure-auth
plan: 06
status: completed
---

## Resultado

- `npx playwright test --grep @smoke`: **13 passed** (duas execuções seguidas verificadas).
- Setup E2E padrão: **email/senha** do seed (`test@open-ledger.local`) via `signInWithPassword` + `createServerClient` + cookies no domínio do app (compatível com `@supabase/ssr` / middleware).
- Modo opcional: `E2E_AUTH_MODE=google` — setup manual/OAuth; `playwright.config` usa Chrome headed só nesse modo.
- **Logout nos testes revoga a sessão no Supabase**: com modo `password`, o setup **sempre** renova `tests/.auth/user.json` para não reutilizar tokens revogados.
- Testes sem auth: `auth-unauthenticated.spec.ts` (projeto `chromium-unauth`); com `storageState`: `auth.spec.ts` + `rls.spec.ts` (projeto `chromium`).
- Cobertura extra Google (sem conta real): requisição a `/auth/v1/authorize` com `provider=google` e `redirect_to` apontando para `/auth/callback`.

## Verificação manual (AUTH-01 Google)

Pendente confirmação humana conforme `01-06-PLAN.md` (checkpoint): fluxo completo Google → perfil → logout → persistência após F5. Responder **aprovado** na revisão da fase ou descrever falhas.

## Arquivos principais

- `tests/e2e/auth.setup.ts`
- `tests/e2e/auth.spec.ts`
- `tests/e2e/auth-unauthenticated.spec.ts`
- `tests/e2e/helpers/env.ts`
- `tests/e2e/rls.spec.ts`
- `playwright.config.ts`
- `.env.example`
