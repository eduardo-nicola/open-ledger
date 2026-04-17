---
phase: 01-infrastructure-auth
plan: 04
subsystem: ui
tags: [nextjs, supabase, shadcn-ui, oauth, app-router]
requires:
  - phase: 01-02
    provides: base setup de auth e componentes
  - phase: 01-03
    provides: proteção de rotas via middleware
provides:
  - tela de login com Google OAuth e estados de loading
  - app shell responsivo com navegação mobile e desktop
  - tela de perfil read-only com logout confirmado por dialog
affects: [auth, navegacao, profile, ux-mobile]
tech-stack:
  added: []
  patterns:
    - server-side auth guard com getUser() e redirect em layouts/páginas protegidas
    - navegação mobile-first com bottom nav fixa e sidebar desktop
key-files:
  created:
    - app/(auth)/layout.tsx
    - app/(auth)/login/page.tsx
    - app/(app)/layout.tsx
    - app/(app)/profile/page.tsx
    - components/layout/header.tsx
    - components/layout/sidebar.tsx
    - components/layout/bottom-nav.tsx
    - components/auth/logout-button.tsx
  modified:
    - next.config.ts
key-decisions:
  - "Aplicar export const dynamic = 'force-dynamic' na página de perfil para evitar cache de dados de usuário."
  - "Manter Dashboard/Contas/Transações visíveis porém inativos com tooltip 'Em breve' na Fase 1."
patterns-established:
  - "Auth UI Pattern: login client-side com signInWithOAuth e redirectTo /auth/callback"
  - "Protected Shell Pattern: layout server-side com getUser() e redirect('/login')"
requirements-completed: [AUTH-04]
duration: 3 min
completed: 2026-04-17
---

# Phase 01 Plan 04: Telas de Auth e App Shell Summary

**Fluxo visual completo de autenticação entregue com login Google, shell responsivo mobile-first e perfil read-only integrado ao Supabase Auth.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-17T11:34:00Z
- **Completed:** 2026-04-17T11:36:49Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Tela `/login` construída com copywriting exato do UI-SPEC, estado loading e CTA Google OAuth.
- App Shell implementado com `Header` mobile (56px), `Sidebar` desktop (240px) e `BottomNav` mobile (64px).
- Página `/profile` entregue como leitura de dados do Google metadata, com `LogoutButton` e confirmação via `AlertDialog`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Tela de Login — layout do grupo auth + página de login com Google OAuth** - `56ba17a` (feat)
2. **Task 2: App Shell — layout do grupo app com header mobile, sidebar desktop e bottom nav** - `b61a679` (feat)
3. **Task 3: Tela de Perfil read-only + componente LogoutButton com AlertDialog** - `2fcdffb` (feat)

**Plan metadata:** `pending` (docs: complete plan)

## Files Created/Modified
- `app/(auth)/layout.tsx` - wrapper do route group público com fundo padrão.
- `app/(auth)/login/page.tsx` - tela de login com botão Google OAuth e estados de loading/acessibilidade.
- `app/(app)/layout.tsx` - shell autenticado com guarda server-side e composição responsiva.
- `app/(app)/profile/page.tsx` - perfil read-only com avatar 80x80, nome, email e `force-dynamic`.
- `components/layout/header.tsx` - header mobile com avatar e fallback por iniciais.
- `components/layout/sidebar.tsx` - navegação desktop com item ativo e itens futuros desabilitados.
- `components/layout/bottom-nav.tsx` - navegação fixa mobile com touch targets 44px.
- `components/auth/logout-button.tsx` - logout client-side com confirmação via `AlertDialog`.
- `next.config.ts` - `remotePatterns` para hosts de avatar externos.

## Decisions Made
- Implementar a rota de perfil como read-only estrito, sem formulário de edição, seguindo D-03.
- Garantir acessibilidade mínima com `aria-label` no login e `aria-current` na navegação ativa.
- Ajustar `next/image` para hosts de avatar (`lh3.googleusercontent.com`) para evitar falha de imagem em produção.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Configuração de imagem externa para avatar OAuth**
- **Found during:** Task 3 (Tela de Perfil read-only + componente LogoutButton com AlertDialog)
- **Issue:** O uso de `next/image` com `avatar_url` externo falha sem `images.remotePatterns` configurado.
- **Fix:** Atualização de `next.config.ts` com host oficial de avatar do Google e host auxiliar de avatar externo.
- **Files modified:** `next.config.ts`
- **Verification:** `npm run build` concluído com sucesso após ajuste.
- **Committed in:** `2fcdffb` (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Ajuste necessário para operação correta da tela de perfil sem alterar escopo funcional.

## Known Stubs

None.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Base visual e estrutural de auth concluída e pronta para expansão de páginas funcionais do app.
- Navegação já expõe placeholders de Dashboard/Contas/Transações para ativação nas próximas fases.

## Build Status
- `npx tsc --noEmit`: PASS
- `npm run build`: PASS
- Aviso observado do Next.js sobre depreciação da convenção `middleware` para `proxy` (não bloqueante neste plano).

## Self-Check: PASSED

- FOUND: `.planning/phases/01-infrastructure-auth/01-04-SUMMARY.md`
- FOUND: `56ba17a`
- FOUND: `b61a679`
- FOUND: `2fcdffb`

---
*Phase: 01-infrastructure-auth*
*Completed: 2026-04-17*
