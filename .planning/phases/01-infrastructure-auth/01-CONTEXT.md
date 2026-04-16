# Phase 1: Infrastructure & Auth — Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Configuração completa da infraestrutura do projeto: Next.js App Router, Supabase (Auth + Postgres + RLS), Google OAuth, schema base do banco, layout base mobile-first e tela de perfil. Ao final da fase, o usuário pode fazer login com Google, visualizar seu perfil e ter seus dados isolados de outros usuários via RLS.

**Não está em escopo:** Qualquer funcionalidade de contas, transações, tags, faturas ou dashboard — essas capacidades pertencem às fases seguintes.

</domain>

<decisions>
## Implementation Decisions

### Tabela de Profiles

- **D-01:** Criar tabela `public.profiles` como âncora de RLS — contém apenas `id` (FK para `auth.users`) e timestamps (`created_at`, `updated_at`). Nenhum campo editável pelo usuário.
- **D-02:** Nome de exibição e avatar são sempre lidos de `auth.users` (metadata do Google OAuth) — completamente read-only. O usuário não pode sobrescrever esses dados.
- **D-03:** AUTH-04 ("visualizar e editar perfil") é implementado como **somente visualização** — nome e avatar sincronizados do Google, sem formulário de edição.
- **D-04:** Trigger `on auth.users INSERT` cria automaticamente uma linha em `public.profiles`.

### Estratégia de Schema Inicial

- **D-05:** Fase 1 cria as **tabelas core** do banco além de `profiles`: `accounts` e `transactions` (estrutura base com campos essenciais).
- **D-06:** As fases seguintes adicionam campos específicos e tabelas de suporte de forma incremental via novas migrations. Exemplo: Fase 4 adiciona `installment_group_id` em `transactions`; Fase 5 adiciona tabela `invoices`.
- **D-07:** Migrations são versionadas no repositório em `supabase/migrations/` — cada arquivo nomeado com timestamp e descrição.
- **D-08:** Decisões de schema já definidas no STATE.md se aplicam: valores monetários como `INTEGER` (centavos), `date` como `DATE` (não `TIMESTAMPTZ`), RLS com 4 policies por tabela (SELECT, INSERT, UPDATE, DELETE).

### Ambiente de Desenvolvimento Supabase

- **D-09:** **Desenvolvimento local** via Supabase CLI + Docker — `supabase start` sobe Postgres, Auth, Studio e APIs localmente. Zero custo, 100% offline.
- **D-10:** **Deploy/produção** aponta para Supabase Cloud (free tier para desenvolvimento/staging) ou Supabase CE self-hosted para produção real.
- **D-11:** `.env.example` no repositório documenta as variáveis necessárias sem valores reais: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- **D-12:** `supabase/config.toml` e o diretório `supabase/` completo são commitados no repositório.

### Claude's Discretion

- Estrutura de route groups do App Router (ex: `/(app)/`, `/(auth)/`) — decisão de arquitetura interna
- Configuração de middleware Next.js para proteção de rotas (onde exatamente roda o redirect para `/login`)
- Padrão de cliente Supabase: server-side (`createServerClient`) vs. client-side (`createBrowserClient`) — usa os helpers `@supabase/ssr`
- Estrutura de diretórios do projeto (onde ficam components, lib, hooks, types)
- Preset de tema shadcn/ui — escolhe o mais próximo do dark mode especificado no UI-SPEC

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design e UI
- `.planning/phases/01-infrastructure-auth/01-UI-SPEC.md` — Contrato visual completo: telas de login, perfil e app shell. Cores, tipografia, spacing, copywriting, componentes shadcn necessários, estados de interação. **Leitura obrigatória antes de implementar qualquer tela.**

### Requisitos
- `.planning/REQUIREMENTS.md` — AUTH-01 a AUTH-04 definem o escopo completo de autenticação desta fase
- `.planning/ROADMAP.md` §Phase 1 — Success criteria verificáveis para a fase

### Stack e Tecnologia
- `.planning/research/STACK.md` — Decisões de stack: Next.js 15, Supabase, shadcn/ui v4, TanStack Query v5, Zustand v5, React Hook Form v7 + Zod v3
- `.planning/research/PITFALLS.md` — Armadilhas conhecidas do stack (RLS, Supabase SSR, App Router) — leitura crítica antes de implementar

### Decisões de Projeto
- `.planning/PROJECT.md` §Constraints — Restrições não negociáveis (Tech Stack, Auth, Plataforma)
- `.planning/STATE.md` §Decisions — Decisões de schema já validadas (INTEGER para valores, DATE para datas, RLS obrigatório)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

Nenhum — repositório completamente vazio. Fase 1 cria toda a infraestrutura base do zero.

### Established Patterns

Nenhum padrão estabelecido ainda. Esta fase define os padrões que todas as fases seguintes vão seguir:
- Estrutura de diretórios do projeto
- Padrão de cliente Supabase (SSR vs. browser)
- Convenção de migrations (`supabase/migrations/`)
- Padrão de componentes shadcn/ui
- Route groups do App Router

### Integration Points

- `supabase/migrations/` → todas as fases futuras adicionam arquivos aqui
- `public.profiles` → todas as tabelas futuras terão `user_id UUID REFERENCES profiles(id)`
- `public.accounts` e `public.transactions` (schema base) → Fases 2 e 3 expandem esses schemas
- App Shell layout (`/(app)/layout.tsx`) → todas as páginas futuras ficam dentro deste layout

</code_context>

<specifics>
## Specific Ideas

- **Tabela `profiles` minimalista:** Apenas `id` + `created_at` + `updated_at`. Sem campos de nome/email/avatar — esses dados sempre vêm do `auth.users` via join ou metadata.
- **Tabelas core criadas na Fase 1:** `profiles`, `accounts` (schema base com id, user_id, name, type, color, balance, currency, created_at, updated_at, archived_at), `transactions` (schema base com id, user_id, account_id, amount, date, description, type, status, created_at, updated_at). Campos específicos de fases futuras (parcelas, faturas) são adicionados depois.
- **Ambiente híbrido:** Developer roda `supabase start` localmente; CI/CD faz push de migrations para Supabase Cloud/CE.

</specifics>

<deferred>
## Deferred Ideas

Nenhuma ideia de escopo adicional surgiu durante a discussão — discussão manteve-se dentro do escopo da Fase 1.

</deferred>

---

*Phase: 01-infrastructure-auth*
*Context gathered: 2026-04-15*
