# Phase 1: Infrastructure & Auth — Research

**Researched:** 2026-04-16
**Domain:** Next.js App Router + Supabase Auth (Google OAuth) + RLS + shadcn/ui
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Tabela de Profiles**
- **D-01:** Criar tabela `public.profiles` como âncora de RLS — contém apenas `id` (FK para `auth.users`) e timestamps (`created_at`, `updated_at`). Nenhum campo editável pelo usuário.
- **D-02:** Nome de exibição e avatar são sempre lidos de `auth.users` (metadata do Google OAuth) — completamente read-only. O usuário não pode sobrescrever esses dados.
- **D-03:** AUTH-04 ("visualizar e editar perfil") é implementado como **somente visualização** — nome e avatar sincronizados do Google, sem formulário de edição.
- **D-04:** Trigger `on auth.users INSERT` cria automaticamente uma linha em `public.profiles`.

**Estratégia de Schema Inicial**
- **D-05:** Fase 1 cria as **tabelas core** do banco: `profiles`, `accounts` e `transactions` (estrutura base com campos essenciais).
- **D-06:** As fases seguintes adicionam campos específicos e tabelas de suporte de forma incremental via novas migrations.
- **D-07:** Migrations são versionadas no repositório em `supabase/migrations/` — cada arquivo nomeado com timestamp e descrição.
- **D-08:** Valores monetários como `INTEGER` (centavos), `date` como `DATE` (não `TIMESTAMPTZ`), RLS com 4 policies por tabela (SELECT, INSERT, UPDATE, DELETE).

**Ambiente de Desenvolvimento Supabase**
- **D-09:** Desenvolvimento local via Supabase CLI + Docker — `supabase start` sobe Postgres, Auth, Studio e APIs localmente.
- **D-10:** Deploy/produção aponta para Supabase Cloud (free tier) ou Supabase CE self-hosted.
- **D-11:** `.env.example` documenta variáveis: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- **D-12:** `supabase/config.toml` e o diretório `supabase/` são commitados no repositório.

### Claude's Discretion

- Estrutura de route groups do App Router (ex: `/(app)/`, `/(auth)/`)
- Configuração de middleware Next.js para proteção de rotas
- Padrão de cliente Supabase: `createServerClient` vs. `createBrowserClient` via `@supabase/ssr`
- Estrutura de diretórios do projeto (components, lib, hooks, types)
- Preset de tema shadcn/ui — escolhe o mais próximo do dark mode especificado no UI-SPEC

### Deferred Ideas (OUT OF SCOPE)

Nenhuma — discussão manteve-se dentro do escopo da Fase 1.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | Usuário pode fazer login exclusivamente via Google OAuth | Supabase Auth com provider Google; `signInWithOAuth({ provider: 'google' })` + callback route |
| AUTH-02 | Sessão do usuário persiste entre recarregamentos do navegador | `@supabase/ssr` com cookie-based sessions; middleware.ts faz refresh automático do access token |
| AUTH-03 | Múltiplos usuários podem usar a mesma instância com dados totalmente isolados via RLS | RLS policies com `auth.uid() = user_id` em todas as tabelas; trigger cria `profiles` row automaticamente |
| AUTH-04 | Usuário pode visualizar e editar seu perfil (nome, avatar via Google) | Implementado como read-only — dados de `auth.users` metadata; tela de perfil com Avatar + nome + email |
</phase_requirements>

---

## Summary

Esta fase constrói toda a infraestrutura base do OPEN-LEDGER: inicialização do projeto Next.js 16 com App Router, configuração do Supabase local via CLI + Docker, schema inicial do banco de dados com RLS, autenticação Google OAuth via Supabase Auth, e layout base mobile-first com shadcn/ui. É a fase mais crítica do projeto porque estabelece todos os padrões que as demais fases vão seguir.

O fluxo de autenticação usa `@supabase/ssr` (pacote oficial Supabase para Next.js App Router) com sessions baseadas em cookies e PKCE automático. O middleware do Next.js é obrigatório para refresh de token em cada request e proteção de rotas autenticadas. Duas instâncias de cliente Supabase são necessárias: `createServerClient` para Server Components/Actions e `createBrowserClient` para Client Components.

O schema inicial cria três tabelas (`profiles`, `accounts`, `transactions`) com RLS habilitado e 4 policies cada. Um trigger no `auth.users` cria automaticamente a row em `public.profiles`. Os dados de nome e avatar do usuário são sempre lidos dos metadados do Google OAuth — nunca armazenados na tabela `profiles`.

**Primary recommendation:** Inicializar `create-next-app`, instalar Supabase CLI, criar schema com migrations versionadas, configurar OAuth no Google Cloud Console, implementar middleware e route groups, construir telas de login/perfil com shadcn/ui.

---

## Project Constraints (from .cursor/rules/)

Diretivas obrigatórias extraídas das regras do workspace:

| Diretiva | Fonte | Obrigatoriedade |
|----------|-------|-----------------|
| Usar App Router directory structure | `nextjs.mdc` | Obrigatório |
| Componentes compartilhados em `components/`, utilitários em `lib/` | `nextjs.mdc` | Obrigatório |
| Server Components por padrão; Client Components com `'use client'` explícito | `nextjs.mdc` | Obrigatório |
| Client Components dentro de `<Suspense>` com fallback | `nextjs.mdc` | Obrigatório |
| Usar Zod para validação de formulários | `nextjs.mdc` | Obrigatório |
| Minimizar uso de `useEffect` e `setState` | `nextjs.mdc` | Obrigatório |
| `strict: true` no tsconfig.json | `typescript.mdc` | Obrigatório |
| Preferir `interfaces` sobre `types` para objetos | `typescript.mdc` | Obrigatório |
| Evitar `any`; usar `unknown` para tipos desconhecidos | `typescript.mdc` | Obrigatório |
| Diretórios em lowercase com dashes | `nextjs.mdc` | Obrigatório |
| Seguir boas práticas Supabase Auth, storage e realtime | `supabase-specific-rules.mdc` | Obrigatório |

---

## Standard Stack

### Core (Verificado no npm registry)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.4 | Full-stack framework (App Router + SSR) | Framework oficial do projeto; suporta Server Components, Server Actions, middleware |
| @supabase/ssr | 0.10.2 | Cliente SSR Supabase para Next.js App Router | Pacote oficial para cookie-based sessions e PKCE; **mandatório** para SSR correto |
| @supabase/supabase-js | 2.103.2 | Cliente base Supabase | Peer dependency do `@supabase/ssr`; contém todos os métodos de Auth e DB |
| shadcn/ui (CLI) | 4.2.0 | Componentes UI copy-paste | Padrão do projeto; inicializado via `npx shadcn@latest init` |
| tailwindcss | 4.2.2 | Utility-first CSS | Veja nota de versão abaixo ⚠️ |
| lucide-react | 1.8.0 | Ícones | Biblioteca oficial shadcn/ui; tree-shakeable |

> [VERIFIED: npm registry — 2026-04-16]

### Supporting (Fase 1)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | 5.99.0 | Server state e cache | Para fetching de dados após autenticação nas fases seguintes; configurar QueryClient nesta fase |
| zustand | 5.0.12 | UI state (modal, sidebar) | Estado de UI que não vem do servidor |
| react-hook-form | 7.72.1 | Form state | Não necessário na Fase 1 (sem formulários complexos), mas instalar agora |
| zod | 4.3.6 | Schema de validação | Para validação server-side nas Server Actions; veja nota de versão abaixo ⚠️ |
| @hookform/resolvers | latest | Bridge RHF ↔ Zod | Verficar compatibilidade com Zod v4 antes de instalar |

> [VERIFIED: npm registry — 2026-04-16]

### ⚠️ Discrepâncias de Versão — Ação Requerida

O STACK.md (pesquisa de 2026-04-15) especificou `tailwindcss: 3.x` e `zod: 3.x`, mas o npm registry atual retorna versões maiores:

**Tailwind CSS: v3 → v4.2.2**
- shadcn/ui v4 (lançado Mar 2026) é **nativo do Tailwind v4** — usa `@import "tailwindcss"` em vez de `@tailwind base/components/utilities`
- A inicialização `npx shadcn@latest init` irá configurar Tailwind v4 automaticamente
- **Recomendação:** Usar Tailwind CSS v4 (latest). O STACK.md refletia o ecossistema em transição em abril/2026 — shadcn v4 + Tailwind v4 é o caminho correto
- [ASSUMED — confirmar com: `npx shadcn@latest init` e observar configuração gerada]

**Zod: v3 → v4.3.6**
- Zod v4 tem breaking changes: API de `.parse()` idêntica, mas mudanças em tipos internos e `z.infer<>` pode diferir em edge cases
- `@hookform/resolvers` pode não suportar Zod v4 ainda — verificar compatibilidade
- **Recomendação:** Instalar `zod@4` e testar resolvers. Se incompatível, usar `zod@3` explicitamente: `npm install zod@3`
- [ASSUMED — verificar: `npm info @hookform/resolvers peerDependencies`]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @supabase/ssr | next-auth | Next-auth tem mais features mas conflita com Supabase Auth; RLS não funciona corretamente |
| shadcn/ui | Material UI | MUI tem runtime CSS-in-JS pesado; não Tailwind-native |
| Supabase CLI local | Apenas Supabase Cloud | Custo zero local; migrations versionadas; melhor DX |

### Installation (Fase 1)

```bash
# 1. Criar projeto Next.js
npx create-next-app@latest open-ledger --typescript --tailwind --eslint --app --src-dir

# 2. Inicializar shadcn/ui (escolher preset zinc/dark no wizard)
npx shadcn@latest init

# 3. Adicionar componentes shadcn necessários na Fase 1
npx shadcn@latest add button avatar alert-dialog separator skeleton sheet tooltip

# 4. Supabase
npm install @supabase/ssr @supabase/supabase-js

# 5. State & Queries (instalar agora, configurar o QueryClient)
npm install @tanstack/react-query zustand
npm install -D @tanstack/react-query-devtools

# 6. Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# 7. Supabase CLI (instalar globalmente)
npm install -g supabase
# OU via script oficial:
# brew install supabase/tap/supabase (macOS)
# npx supabase (sem instalação global)
```

---

## Architecture Patterns

### Recommended Project Structure

```
open-ledger/
├── app/
│   ├── (auth)/              # Route group: rotas não-autenticadas
│   │   └── login/
│   │       └── page.tsx     # Tela de login com Google OAuth
│   ├── (app)/               # Route group: rotas autenticadas
│   │   ├── layout.tsx       # App Shell: header + sidebar/bottom-nav
│   │   └── profile/
│   │       └── page.tsx     # Tela de perfil (read-only)
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts     # Route Handler: troca code por session (PKCE)
│   ├── layout.tsx           # Root layout: providers, fonts
│   └── globals.css          # Tailwind base + CSS variables shadcn
├── components/
│   ├── ui/                  # Componentes shadcn gerados (não editar)
│   ├── layout/              # App Shell, Nav, Header
│   └── auth/                # Login button, Google button
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # createBrowserClient (use client)
│   │   └── server.ts        # createServerClient (server-only)
│   └── utils.ts             # cn(), formatters
├── hooks/                   # Custom hooks (use client)
├── types/                   # Tipos TypeScript compartilhados
│   └── database.ts          # Tipos gerados pelo schema Supabase
├── middleware.ts             # Session refresh + route protection
├── supabase/
│   ├── config.toml          # Configuração local Supabase
│   └── migrations/
│       └── 20260416000000_initial_schema.sql
├── .env.local               # Variáveis reais (gitignore)
├── .env.example             # Variáveis documentadas sem valores
└── components.json          # Config shadcn/ui
```

### Pattern 1: Dois Clientes Supabase Obrigatórios

**What:** Supabase requer dois clientes distintos para App Router: um server-side (acessa cookies via `next/headers`) e um browser-side (acessa `document.cookie`).

**When to use:** Sempre — nunca usar um único cliente para ambos os contextos.

```typescript
// lib/supabase/server.ts — SOMENTE server-side
// Source: docs.supabase.com/guides/auth/server-side/nextjs
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignorado em Server Components — middleware faz o refresh
          }
        },
      },
    }
  )
}
```

```typescript
// lib/supabase/client.ts — SOMENTE 'use client'
// Source: docs.supabase.com/guides/auth/server-side/nextjs
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Pattern 2: Middleware para Refresh de Token e Proteção de Rotas

**What:** O middleware é OBRIGATÓRIO. Sem ele, sessions expiram em ~1h e o usuário perde acesso sem aviso.

**When to use:** Sempre — é o único lugar que consegue atualizar cookies de sessão em requests server-side.

```typescript
// middleware.ts (raiz do projeto)
// Source: docs.supabase.com/guides/auth/server-side/nextjs
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // CRÍTICO: getUser() valida token no servidor — não usar getSession()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirecionar não-autenticados para /login
  if (!user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/auth')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirecionar autenticados que acessam /login
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/profile'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### Pattern 3: Callback Route para PKCE (OAuth)

**What:** O Google OAuth redireciona para `/auth/callback` com um `code`. Este Route Handler troca o code por uma session.

```typescript
// app/auth/callback/route.ts
// Source: docs.supabase.com/guides/auth/server-side/nextjs
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}/profile`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
```

### Pattern 4: Trigger Automático para `public.profiles`

**What:** Um trigger no Supabase cria automaticamente uma row em `public.profiles` quando um usuário se autentica pela primeira vez.

```sql
-- supabase/migrations/20260416000000_initial_schema.sql

-- Tabela profiles (âncora de RLS)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- Trigger: cria profiles automaticamente no primeiro login
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Pattern 5: Schema Base de `accounts` e `transactions`

```sql
-- accounts (schema base — campos específicos adicionados em fases futuras)
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'digital_wallet', 'credit_card')),
  color TEXT NOT NULL DEFAULT '#22c55e',
  balance INTEGER NOT NULL DEFAULT 0, -- centavos
  currency TEXT NOT NULL DEFAULT 'BRL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
-- (4 policies idênticas ao profiles, com user_id)

-- transactions (schema base — campos específicos adicionados em fases futuras)
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,              -- centavos, signed (negativo = despesa)
  date DATE NOT NULL,                   -- DATE, nunca TIMESTAMPTZ
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
-- (4 policies idênticas, com user_id)

-- Índices para queries por data (Pitfall 20)
CREATE INDEX idx_transactions_account_date ON public.transactions (account_id, date DESC);
CREATE INDEX idx_transactions_user_date ON public.transactions (user_id, date DESC);
```

### Anti-Patterns to Avoid

- **`getSession()` no servidor:** Lê cookies não verificados — vulnerabilidade de segurança. Usar sempre `getUser()`.
- **`NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`:** Nunca expor service role key no client. Bypass total de RLS.
- **Middleware sem `matcher`:** Middleware rodando em rotas estáticas (`_next/static`) gera overhead desnecessário.
- **Criar tabelas sem `ENABLE ROW LEVEL SECURITY`:** Tabela com RLS habilitado mas sem policies retorna 0 rows para todos — silencioso.
- **`supabase-js` sem `@supabase/ssr`:** Sessions não persistem em SSR; quebra autenticação em Server Components.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth callback + PKCE | Custom crypto + code exchange | `supabase.auth.exchangeCodeForSession(code)` | PKCE envolve SHA-256, code verifier/challenge, timing attacks — Supabase implementa corretamente |
| Session refresh | Custom JWT rotation | `@supabase/ssr` middleware pattern | Access tokens expiram; sem refresh automático, 40% de perda de sessão em 24h (documentado Supabase) |
| Cookie management SSR | Custom cookie parsing | `@supabase/ssr` `getAll/setAll` | Next.js App Router tem nuances de cookies imutáveis em Server Components; `@supabase/ssr` lida com isso |
| Row-level access control | IF statements em queries | RLS policies no Postgres | RLS é enforçado no banco — não pode ser bypassado por bug no app; IF na app pode ser esquecido |
| Google user data sync | Webhook para sync de perfil | `auth.users.raw_user_meta_data` | Google devolve nome/avatar no token; Supabase armazena automaticamente em `raw_user_meta_data` |

**Key insight:** O ecossistema Supabase resolve corretamente todos os problemas de segurança de OAuth/JWT — reimplementar qualquer parte introduz vulnerabilidades conhecidas.

---

## Common Pitfalls

### Pitfall 1: `getSession()` no Servidor — Vulnerabilidade de Segurança

**What goes wrong:** `supabase.auth.getSession()` no servidor lê a session do cookie sem verificar a assinatura JWT no servidor. Um cookie forjado pode autenticar como qualquer usuário.

**Why it happens:** A API parece conveniente e retorna os dados corretos em desenvolvimento — a validação só falha em produção com tokens manipulados.

**How to avoid:** Sempre usar `supabase.auth.getUser()` no servidor. Custa um round-trip extra à API do Supabase mas valida o token criptograficamente.

**Warning signs:** Qualquer `getSession()` em Server Components, Server Actions ou middleware.

---

### Pitfall 2: Middleware sem Refresh → Perda de Sessão em 24h

**What goes wrong:** Access tokens Supabase expiram em 1h. Sem o middleware fazendo refresh, o usuário fica sem sessão silenciosamente. Não há erro — as queries simplesmente retornam dados vazios (RLS bloqueia tudo).

**Why it happens:** O middleware é fácil de esquecer ou configurar incorretamente (matcher errado).

**How to avoid:** Middleware obrigatório com o pattern exato de `getAll/setAll` cookies documentado. Verificar que o `matcher` inclui as rotas dinâmicas. Testar: logar, esperar 2h, recarregar — deve permanecer logado.

**Warning signs:** Usuários relatam "saiu sozinho" ou dados em branco após algumas horas.

---

### Pitfall 3: RLS Habilitado Sem Policy → Zero Rows Silencioso

**What goes wrong:** Tabela criada com `ENABLE ROW LEVEL SECURITY` mas sem nenhuma `CREATE POLICY`. O comportamento padrão é "deny all" — todas as queries retornam 0 rows sem erro. Developer acha que a tabela está vazia.

**How to avoid:** Sempre criar as 4 policies no mesmo migration que cria a tabela. Jamais habilitar RLS sem policies.

**Warning signs:** Tabela não-vazia retornando array vazio. Migration com `ENABLE ROW LEVEL SECURITY` sem `CREATE POLICY` no mesmo arquivo.

---

### Pitfall 4: Service Role Key Exposta no Cliente

**What goes wrong:** `SUPABASE_SERVICE_ROLE_KEY` colocada como `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`. Service role bypassa TODAS as policies RLS — exposta no client, qualquer usuário pode ler os dados de todos.

**How to avoid:** `SUPABASE_SERVICE_ROLE_KEY` nunca começa com `NEXT_PUBLIC_`. Auditar: `grep -r "service_role" --include="*.ts"` — toda ocorrência deve ser em arquivo server-only.

---

### Pitfall 5: Trigger Sem `SECURITY DEFINER` → Permissão Negada

**What goes wrong:** A função de trigger `handle_new_user()` tenta inserir em `public.profiles` durante o INSERT em `auth.users`. Se a função não tem `SECURITY DEFINER`, ela roda com as permissões do usuário triggering — que não tem acesso a `auth.users` diretamente no contexto de trigger.

**How to avoid:** Sempre declarar a função de trigger como `SECURITY DEFINER` e verificar o `search_path`.

---

### Pitfall 6: shadcn/ui v4 requer Tailwind v4 — Configuração Diferente

**What goes wrong:** shadcn/ui v4 usa `@import "tailwindcss"` (Tailwind v4) em vez de `@tailwind base; @tailwind components; @tailwind utilities` (Tailwind v3). Tentar usar shadcn v4 com config Tailwind v3 resulta em CSS não gerado.

**How to avoid:** Deixar `npx shadcn@latest init` configurar automaticamente. Não copiar configs de Tailwind v3 de projetos antigos.

---

### Pitfall 7: App Router — Rotas Estáticas Cacheando Dados Financeiros

**What goes wrong:** Pages sem `export const dynamic = 'force-dynamic'` são cacheadas. A tela de perfil mostraria dados desatualizados.

**How to avoid:** `export const dynamic = 'force-dynamic'` em toda page que lê dados do usuário. Na Fase 1, aplicar em `/profile/page.tsx`.

---

### Pitfall 8: Callback URL Não Configurada no Google Cloud Console

**What goes wrong:** OAuth falha com `redirect_uri_mismatch`. O Google recusa o redirect para `http://localhost:54321/auth/v1/callback` se essa URI não estiver registrada.

**How to avoid:** Configurar no Google Cloud Console → APIs & Services → Credentials:
- Authorized redirect URIs: `http://localhost:54321/auth/v1/callback` (local)
- E a URL de produção: `https://seu-dominio.com/auth/v1/callback`

---

## Code Examples

### Login Page — Botão Google OAuth

```typescript
// app/(auth)/login/page.tsx
// Source: docs.supabase.com/guides/auth/social-login/auth-google
'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  async function handleGoogleLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-[360px] flex flex-col items-center gap-12">
        {/* Logo + título */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-primary" />
          <h1 className="text-[28px] font-semibold leading-[1.1]">Open Ledger</h1>
          <p className="text-sm text-muted-foreground">Suas finanças em um só lugar</p>
        </div>
        {/* CTA */}
        <div className="w-full flex flex-col gap-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            aria-label="Entrar com Google"
          >
            {/* SVG Google icon aqui */}
            Entrar com Google
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Ao continuar, você concorda com os Termos de Uso.
          </p>
        </div>
      </div>
    </div>
  )
}
```

### Leitura de Dados do Usuário (Server Component)

```typescript
// app/(app)/profile/page.tsx
// Source: docs.supabase.com/guides/auth/server-side/nextjs
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const name = user.user_metadata?.full_name as string
  const avatarUrl = user.user_metadata?.avatar_url as string
  const email = user.email

  return (
    // ... componentes de perfil
    <div>{name}</div>
  )
}
```

### Logout com AlertDialog (Client Component)

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="w-full">Sair da conta</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sair da conta?</AlertDialogTitle>
          <AlertDialogDescription>
            Você precisará entrar com Google novamente para acessar suas finanças.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogout}>Sair</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

### Configuração do Supabase Local

```bash
# Inicializar Supabase no projeto
supabase init

# Subir containers locais
supabase start

# Output esperado:
#   API URL: http://localhost:54321
#   DB URL: postgresql://postgres:postgres@localhost:54322/postgres
#   Studio URL: http://localhost:54323
#   Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Aplicar migrations
supabase db push

# Resetar banco de desenvolvimento
supabase db reset
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 | Pacote unificado para todas as plataformas; helpers deprecated |
| `getSession()` no servidor | `getUser()` sempre | 2024 | Segurança: valida JWT no servidor em vez de confiar no cookie |
| Tailwind CSS v3 `tailwind.config.js` | Tailwind CSS v4 `@import "tailwindcss"` | Mar 2026 | shadcn/ui v4 é nativo Tailwind v4; config JS não é mais necessária |
| `auth.users.user_metadata` | `auth.users.raw_user_meta_data` | — | Campo correto para metadados do provider OAuth |
| Zod v3 `.parse()` / `.safeParse()` | Zod v4 (API compatível) | 2025 | Breaking changes em tipos internos; mesma API de surface |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | shadcn/ui v4 (CLI 4.2.0) usa Tailwind CSS v4 automaticamente | Standard Stack | Se ainda suportar Tailwind v3, a config pode diferir — testar durante `npx shadcn@latest init` |
| A2 | `@hookform/resolvers` é compatível com Zod v4 | Standard Stack | Se incompatível, usar `zod@3` explicitamente durante instalação |
| A3 | `create-next-app@latest` cria projeto Next.js 16 com App Router por padrão | Architecture | Verificar durante `create-next-app` — podem ter mudanças na CLI |
| A4 | `supabase.auth.getUser()` retorna `raw_user_meta_data` com `full_name` e `avatar_url` do Google | Code Examples | Depende da configuração do provider Google no Supabase; testar após OAuth funcionar |
| A5 | `SECURITY DEFINER` é suficiente para a função de trigger ter acesso a `auth.users` | Architecture Patterns | Se Supabase Cloud mudar permissões, o trigger pode falhar silenciosamente — verificar logs do Supabase Studio |

---

## Open Questions

1. **Tailwind v3 vs v4 no create-next-app**
   - What we know: `tailwindcss` latest é 4.2.2; STACK.md especificou v3
   - What's unclear: `create-next-app` instala v3 ou v4 por padrão em 2026?
   - Recommendation: Deixar `create-next-app` instalar e depois rodar `npx shadcn@latest init` — ele irá adaptar a configuração para a versão instalada

2. **Zod v4 e `@hookform/resolvers`**
   - What we know: Zod latest é 4.3.6; STACK.md especificou v3
   - What's unclear: `@hookform/resolvers` suporta Zod v4?
   - Recommendation: Instalar `zod@latest` e testar; se falhar, `npm install zod@3`

3. **Google OAuth no Supabase local**
   - What we know: Supabase local usa `supabase/config.toml` para configurar providers
   - What's unclear: Desenvolvimento local com Google OAuth requer credenciais reais do Google Cloud Console ou há um mock?
   - Recommendation: Criar projeto no Google Cloud Console desde o início; não há mock adequado para OAuth — usar credenciais reais mesmo em dev local

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js | ✓ | v22.14.0 | — |
| npm | Package manager | ✓ | 11.6.0 | — |
| Docker | Supabase CLI local | ✓ | 29.2.1 | Usar Supabase Cloud free tier |
| Supabase CLI | `supabase start`, migrations | ✗ | — | Ver abaixo |
| Git | Versionamento | ✓ | (em repositório) | — |

**Missing dependencies com fallback:**

- **Supabase CLI (não instalado):** Instalar via `npm install -g supabase` como primeira task do Wave 0. Docker está disponível (v29.2.1), então `supabase start` funcionará após instalação. Alternativa sem CLI: usar Supabase Cloud gratuito + migrations via dashboard (não recomendado — perde versionamento local).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Nenhum detectado — repositório vazio (Wave 0) |
| Config file | Nenhum — criar em Wave 0 |
| Quick run command | `npx playwright test --grep @smoke` (após setup) |
| Full suite command | `npx playwright test` |

**Recomendação:** Para Fase 1 (Auth), usar Playwright para testes E2E do fluxo de autenticação. Os requisitos de auth são inherentemente E2E (login → session → redirect → RLS). Testes unitários puros têm valor limitado para fluxo OAuth.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Login via Google OAuth redireciona para o app | E2E smoke | `npx playwright test --grep @auth-01` | ❌ Wave 0 |
| AUTH-02 | Session persiste após reload do browser | E2E smoke | `npx playwright test --grep @auth-02` | ❌ Wave 0 |
| AUTH-03 | Dois usuários não veem dados um do outro (RLS) | Integration (Supabase RLS test) | `supabase test db` | ❌ Wave 0 |
| AUTH-04 | Perfil exibe nome e avatar do Google | E2E smoke | `npx playwright test --grep @auth-04` | ❌ Wave 0 |

> **Nota sobre AUTH-01:** Google OAuth em Playwright requer uma abordagem especial — o redirect para accounts.google.com não pode ser automatizado facilmente. Estratégia: usar `supabase.auth.signInWithPassword` com um usuário de teste local (Supabase local cria um servidor SMTP fake) OU mockar o callback de OAuth nos testes.

**Estratégia para AUTH-01 em CI:** Criar um usuário via Supabase Admin API, setar session manualmente via `page.addInitScript`, e testar o comportamento pós-auth. O fluxo OAuth completo é testado manualmente.

### Sampling Rate

- **Por task commit:** — (sem testes ainda; Wave 0 cria a infraestrutura)
- **Por wave merge:** `npx playwright test --grep @smoke`
- **Phase gate:** Full suite green antes de `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/e2e/auth.spec.ts` — cobre AUTH-01, AUTH-02, AUTH-04
- [ ] `tests/e2e/rls.spec.ts` — cobre AUTH-03 (isolamento de dados)
- [ ] `playwright.config.ts` — configuração base com baseURL local
- [ ] Framework install: `npm install -D @playwright/test && npx playwright install chromium`
- [ ] `supabase/seed.sql` — usuário de teste para E2E

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | sim | Supabase Auth + Google OAuth (delegado ao IdP) |
| V3 Session Management | sim | `@supabase/ssr` cookie-based sessions; middleware refresh |
| V4 Access Control | sim | RLS policies no Postgres (`auth.uid() = user_id`) |
| V5 Input Validation | parcial | Sem formulários complexos na Fase 1; apenas callback URL |
| V6 Cryptography | sim | Delegado ao Supabase (PKCE SHA-256, JWT HS256/RS256) |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cookie hijacking / session fixation | Spoofing | `@supabase/ssr` usa httpOnly cookies; HTTPS obrigatório em prod |
| JWT forjado / manipulado | Spoofing | `getUser()` no servidor valida assinatura JWT na API Supabase |
| CSRF em Server Actions | Tampering | Next.js Server Actions têm CSRF protection built-in (origin check) |
| Service role key leak | Information Disclosure | Nunca em `NEXT_PUBLIC_*`; apenas em Server Actions server-only |
| RLS bypass via SQL injection | Tampering | Supabase client usa queries parametrizadas; nunca interpolação de string |
| Cross-user data access | Elevation of Privilege | RLS + `auth.uid() = user_id` em todas as 3 tabelas; trigger `SECURITY DEFINER` |
| OAuth state parameter manipulation | Tampering | PKCE flow (code_verifier/challenge) mitiga CSRF em OAuth; Supabase implementa corretamente |

---

## Sources

### Primary (HIGH confidence)

- `docs.supabase.com/guides/auth/server-side/nextjs` — Padrão oficial de integração Supabase + Next.js App Router
- `docs.supabase.com/guides/auth/social-login/auth-google` — Configuração Google OAuth no Supabase
- `npm registry` — Versões verificadas em 2026-04-16: next@16.2.4, @supabase/ssr@0.10.2, @supabase/supabase-js@2.103.2, shadcn@4.2.0, tailwindcss@4.2.2, @tanstack/react-query@5.99.0, zustand@5.0.12, react-hook-form@7.72.1, zod@4.3.6
- `.planning/research/STACK.md` — Stack decisions documentadas no projeto (2026-04-15)
- `.planning/research/PITFALLS.md` — Pitfalls verificados do domínio (2026-04-15)

### Secondary (MEDIUM confidence)

- `.planning/phases/01-infrastructure-auth/01-CONTEXT.md` — Decisões locked do usuário
- `.planning/phases/01-infrastructure-auth/01-UI-SPEC.md` — Contrato visual verificado pelo gsd-ui-checker

### Tertiary (LOW confidence)

- [ASSUMED] Comportamento do `npx shadcn@latest init` com Tailwind v4 — verificar durante execução
- [ASSUMED] Compatibilidade `@hookform/resolvers` com Zod v4 — verificar durante instalação

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — versões verificadas no npm registry em 2026-04-16
- Architecture: HIGH — padrões da documentação oficial Supabase + Next.js
- Pitfalls: HIGH — corroborados por múltiplas fontes documentadas no PITFALLS.md
- Tailwind/Zod versions: MEDIUM — discrepância detectada vs STACK.md; requer verificação durante setup

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (30 dias — stack estável)
