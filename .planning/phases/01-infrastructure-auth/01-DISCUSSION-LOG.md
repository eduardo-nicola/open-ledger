# Phase 1: Infrastructure & Auth — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-15
**Phase:** 01-infrastructure-auth
**Areas discussed:** Tabela profiles, Estratégia de schema inicial, Ambiente de desenvolvimento Supabase

---

## Tabela `profiles`

| Option | Description | Selected |
|--------|-------------|----------|
| Opção A — Apenas `auth.users` | Sem tabela profiles; dados do Google read-only; mais simples | |
| Opção B — `profiles` com campos editáveis | Usuário pode sobrescrever nome de exibição; trigger no INSERT | |
| Opção C — `profiles` como âncora de RLS | Tabela só com `id` + timestamps; nome/avatar sempre do Google; garante padrão de RLS | ✓ |

**User's choice:** Opção C — tabela `public.profiles` como âncora de RLS, sem campos editáveis
**Notes:** AUTH-04 implementado como somente visualização. Nome e avatar sempre sincronizados do Google.

---

## Estratégia de schema inicial

| Option | Description | Selected |
|--------|-------------|----------|
| Opção A — Schema mínimo | Só `profiles` na Fase 1; cada fase cria suas tabelas | |
| Opção B — Schema completo upfront | Todas as tabelas de todas as 7 fases criadas na Fase 1 | |
| Opção C — Schema base + incrementos | `profiles` + tabelas core (`accounts`, `transactions`) na Fase 1; fases seguintes adicionam incrementalmente | ✓ |

**User's choice:** Opção C — schema base com profiles, accounts e transactions criadas na Fase 1
**Notes:** Migrations versionadas em `supabase/migrations/`. Fases seguintes adicionam campos e tabelas de suporte de forma incremental.

---

## Ambiente de desenvolvimento Supabase

| Option | Description | Selected |
|--------|-------------|----------|
| Opção A — Supabase CLI local | Docker + migrations no repo; 100% offline; requer Docker | |
| Opção B — Supabase Cloud | Instância cloud gratuita; sem Docker; free tier com limitações | |
| Opção C — Híbrido local + cloud | CLI local no dev; cloud/CE no deploy; melhor separação dev/prod | ✓ |

**User's choice:** Opção C — Supabase CLI local no desenvolvimento, Supabase Cloud ou CE self-hosted no deploy
**Notes:** `supabase/` directory commitado no repo. `.env.example` documenta variáveis sem valores reais.

---

## Claude's Discretion

- Estrutura de route groups do App Router
- Configuração de middleware Next.js para proteção de rotas
- Padrão de cliente Supabase (`@supabase/ssr`)
- Estrutura de diretórios do projeto
- Preset de tema shadcn/ui

## Deferred Ideas

Nenhuma — discussão manteve-se dentro do escopo da Fase 1.
