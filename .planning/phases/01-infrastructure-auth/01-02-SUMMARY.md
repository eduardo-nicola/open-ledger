---
phase: 01-infrastructure-auth
plan: 02
subsystem: infra
tags: [supabase, postgres, rls, oauth, env]
requires:
  - phase: 01-01
    provides: setup base do projeto
provides:
  - schema inicial com profiles, accounts e transactions
  - isolamento por usuario via RLS em todas as tabelas core
  - trigger de criacao automatica de profile no auth.users
affects: [auth, database, migrations]
tech-stack:
  added: [supabase-cli]
  patterns: [migration-first, rls-per-table, trigger-security-definer]
key-files:
  created: [supabase/migrations/20260416000000_initial_schema.sql]
  modified: [.env.example]
key-decisions:
  - "Manter migration inicial com 3 tabelas core e 12 policies no mesmo arquivo"
  - "Usar trigger SECURITY DEFINER com SET search_path = public para seguranca e idempotencia"
patterns-established:
  - "Toda tabela de dominio com user_id usa policy auth.uid() = user_id"
  - "Variaveis sensiveis permanecem sem valor em .env.example"
requirements-completed: [AUTH-03]
duration: 19 min
completed: 2026-04-16
---

# Phase 01 Plan 02: Supabase Local + Schema Inicial Summary

**Schema inicial do Open Ledger com tres tabelas core, RLS completo por usuario e trigger seguro para sincronizacao de profiles via auth.users.**

## Performance

- **Duration:** 19 min
- **Started:** 2026-04-16T19:44:46Z
- **Completed:** 2026-04-16T20:04:06Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Migration inicial criada com `profiles`, `accounts` e `transactions`.
- RLS habilitado nas 3 tabelas com 12 policies (SELECT/INSERT/UPDATE/DELETE).
- Trigger `on_auth_user_created` implementado com `SECURITY DEFINER` e `SET search_path = public`.
- Template de ambiente reforcado para manter variaveis sem valores reais em `.env.example`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Instalar Supabase CLI + configurar config.toml + criar .env.example/.env.local** - `3634871` (chore)
2. **Task 2: Criar migration SQL completa** - `90b8412` (feat)

## Files Created/Modified
- `supabase/migrations/20260416000000_initial_schema.sql` - schema base, RLS, trigger e indices iniciais.
- `.env.example` - documentacao de variaveis sem segredos reais.

## Decisions Made
- Consolidar as regras de isolamento na migration inicial para evitar tabelas com RLS habilitado sem policies.
- Manter o trigger de profile idempotente com `ON CONFLICT (id) DO NOTHING`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

**External services require manual configuration.**

- Configurar credenciais OAuth no Google Cloud Console (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
- Rodar `supabase start` e preencher `.env.local` com `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.
- Rodar `supabase db push` para aplicar a migration localmente.

## Next Phase Readiness
- Base de autenticacao e isolamento de dados pronta para os proximos planos da fase 01.
- Sem bloqueios tecnicos para continuar no plano `01-03`.
