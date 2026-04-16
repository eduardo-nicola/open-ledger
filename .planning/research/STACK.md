# Stack Research — OPEN-LEDGER

**Project:** OPEN-LEDGER — Personal Finance Manager  
**Researched:** 2026-04-15  
**Overall Confidence:** HIGH

---

## Recommended Stack

### Core (Already Decided)

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js App Router | 15.x | Full-stack framework (SSR + Server Actions) |
| Supabase | Latest CE | Postgres + Auth (Google OAuth) + RLS + Storage |

---

### UI & Styling

**Use: shadcn/ui v4 + Tailwind CSS v3**

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| tailwindcss | 3.x | Utility-first CSS | Padrão do ecossistema Next.js; zero runtime; mobile-first com breakpoints declarativos |
| shadcn/ui | 4.0.0 (Mar 2026) | Componentes UI | Copy-paste model — código vive no projeto, sem bundle de terceiros. 65k+ GitHub stars, usado pela própria Vercel e Supabase. Tailwind-native por design |
| lucide-react | latest | Ícones | Biblioteca oficial de ícones do shadcn/ui; tree-shakeable; consistente com o design system |
| class-variance-authority | latest | Variantes de componentes | Padrão para variantes tipadas em projetos shadcn/ui |
| clsx / tailwind-merge | latest | Merge de classes CSS | Evita conflitos de classes Tailwind em componentes dinâmicos |

**Por que shadcn/ui em vez de outras opções:**
- **vs. PrimeVue/PrimReact:** Vue-based; fora do ecossistema React/Next.js
- **vs. Material UI (MUI):** Runtime CSS-in-JS; bundle pesado (~300kB+); design language não alinha com mobile-first BRL finance apps
- **vs. Ant Design:** Chinês enterprise look; pesado; não Tailwind-native
- **vs. Chakra UI:** Menos adotado em 2025/2026; team moveu para Panda CSS; ecossistema fragmentado

**Mobile-first pattern com shadcn/ui:**
- `SidebarProvider` com drawer Sheet em mobile, sidebar persistente em desktop — um único layout
- Breakpoints Tailwind: `sm:`, `md:`, `lg:` para adaptar densidade de informação financeira
- Dark mode automático via CSS variables do shadcn/ui

---

### State & Data Fetching

**Use: TanStack Query v5 (server state) + Zustand v5 (client/UI state)**

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| @tanstack/react-query | 5.x | Server state, cache, sincronização | Padrão da indústria para estado servidor em React. Deduplicação de requests, cache inteligente, background refetch. Evita `useEffect` para fetch |
| zustand | 5.x | UI state (modal aberto, filtros, sidebar) | ~1KB, API mínima, SSR-safe com padrão `useRef`. Para estado de UI que não vem do servidor |
| @tanstack/react-query-devtools | 5.x | Dev experience | Devtools para inspecionar cache em desenvolvimento |

**Não usar:**
- **Context API para dados:** Causa re-render wholesale em todos os consumidores; inadequado para dados financeiros que mudam frequentemente
- **Redux Toolkit:** Overkill para app pessoal; boilerplate excessivo sem benefício real
- **Jotai:** Bom, mas Zustand é mais simples para o modelo mental de "store central"; adequado para o tamanho do OPEN-LEDGER
- **SWR:** Menos poderoso que TanStack Query; sem mutations integradas; comunidade menor

**Padrão de uso:**
```
Server State (contas, transações, faturas) → TanStack Query
UI State (modal de nova transação aberto, mês selecionado, filtros) → Zustand
Form State → React Hook Form (isolado por formulário)
URL State (página, período selecionado) → useSearchParams (Next.js nativo)
```

---

### Forms & Validation

**Use: React Hook Form v7 + Zod v3 + Server Actions**

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| react-hook-form | 7.x | Form state client-side | Mínimo de re-renders; integração nativa com shadcn/ui via `FormField`; resolver para Zod |
| zod | 3.x | Schema de validação | TypeScript-first; mesmo schema reutilizado no client e Server Action; inferência automática de tipos |
| @hookform/resolvers | 3.x | Bridge RHF ↔ Zod | Conecta o schema Zod ao React Hook Form |

**Padrão recomendado para OPEN-LEDGER:**
1. Definir schema Zod uma vez (`schemas/transaction.ts`)
2. Client-side: React Hook Form + `zodResolver` para UX responsiva (erros inline imediatos)
3. Server-side: Server Action valida com `schema.safeParse(formData)` antes de inserir no Supabase
4. Resultado: validação dupla, sem API routes separadas, type-safety end-to-end

**Por que não usar apenas Server Actions sem RHF:**
- UX degradada: feedback de erro só após round-trip ao servidor
- Sem validação inline enquanto o usuário digita
- Para formulários complexos como "nova transação parcelada" (10+ campos), RHF é essencial

---

### Charts & Visualization

**Use: Recharts v3**

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| recharts | 3.8.1 (Mar 2026) | Gráficos financeiros | 37M downloads/semana; TypeScript generics desde v3; composable (AreaChart, BarChart, LineChart); integra bem com shadcn/ui via CSS variables |

**Por que Recharts em vez de Tremor:**
- **Tremor** é ótimo para SaaS dashboard genérico, mas adiciona ~200kB e opina muito no design
- OPEN-LEDGER tem design próprio inspirado no Mobills; Recharts dá controle total sobre cores, tooltips e formatação de BRL
- shadcn/ui já expõe um wrapper `Chart` baseado em Recharts — usar Recharts diretamente é consistente

**Por que não Chart.js:**
- Canvas-based, não React-native; requer cleanup imperativo
- Menos ergonômico em React; não tem TypeScript generics adequados para dados financeiros

**Gráficos necessários no OPEN-LEDGER:**
```
AreaChart → Fluxo de caixa mensal (entradas vs saídas ao longo do tempo)
BarChart  → Gastos por tag/categoria
PieChart  → Distribuição de despesas por categoria
LineChart → Saldo consolidado ao longo do tempo
```

---

### File Processing (CSV/OFX)

**Use: PapaParse v5 (CSV) + ofx-data-extractor v1.5 (OFX)**

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| papaparse | 5.5.3 (Mai 2025) | Parse de arquivos CSV | 9M downloads/semana; zero deps; suporte a web workers para arquivos grandes; streaming; browser-native |
| @types/papaparse | latest | TypeScript types | Types para papaparse |
| ofx-data-extractor | 1.5.0 (Mar 2025) | Parse de arquivos OFX/QFX | Zero deps; TypeScript nativo; suporta `Ofx.fromBlob()` para uso no browser; extrai `getBankTransferList()` e `getCreditCardTransferList()` — exatamente o que precisamos |

**Modo lenient para OFX bancário brasileiro:**
```typescript
const ofx = await Ofx.fromBlob(file, { mode: 'lenient' });
// OFX gerado por bancos brasileiros frequentemente tem encoding inválido
// lenient mode coleta warnings em vez de lançar erro
```

**Arquitetura de importação recomendada:**
```
Upload de arquivo (browser) → Client Component
→ PapaParse/ofx-data-extractor (browser, no 'use client')
→ Preview + mapeamento de colunas (UI)
→ Server Action: valida schema Zod + insere batch no Supabase
```
Processar no browser evita upload de arquivo grande ao servidor; Server Action recebe apenas o JSON já parseado.

---

### Supabase Integration Patterns

**Pacotes obrigatórios:**

| Package | Version | Purpose | Why |
|---------|---------|---------|-----|
| @supabase/ssr | latest | Cliente SSR para Next.js App Router | Pacote oficial para cookie-based sessions; PKCE flow automático; mandatório para SSR correto |
| @supabase/supabase-js | 2.x | Cliente base | Peer dependency do @supabase/ssr |

**Dois clientes obrigatórios:**

```typescript
// lib/supabase/server.ts — Server Components, Server Actions, Route Handlers
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// lib/supabase/client.ts — Client Components apenas
import { createBrowserClient } from '@supabase/ssr'
```

**Middleware obrigatório (`middleware.ts`):**
- Refresh do access token em cada request — sem isso, 40% de perda de sessão em 24h (documentado)
- Protege rotas autenticadas antes de chegar nos Server Components

**Regras RLS padrão por tabela:**
```sql
-- Cada tabela de dados do usuário precisa de 4 policies
SELECT: auth.uid() = user_id
INSERT: auth.uid() = user_id (WITH CHECK)
UPDATE: auth.uid() = user_id (USING + WITH CHECK)
DELETE: auth.uid() = user_id
```

**Nunca usar `getSession()` no servidor** — use `getUser()` (valida token no servidor, não lê cookie não verificado).

---

### Deployment (Self-hosting)

**Estratégia recomendada para OPEN-LEDGER:**

#### Opção A: VPS + Coolify (Recomendado para self-hosters técnicos)

| Componente | Solução | Custo estimado |
|------------|---------|---------------|
| VPS | Hetzner CX32 (4vCPU/8GB) | ~€12/mês |
| Supabase CE | Docker Compose (oficial) | Incluso no VPS |
| Next.js | Coolify no mesmo VPS | Incluso |
| SSL/Proxy | Caddy (via Coolify) | Incluso |
| **Total** | — | **~€12/mês** |

Coolify é um PaaS open-source que abstrai Docker Compose; Git push → deploy automático; SSL automático via Let's Encrypt.

#### Opção B: Railway (Developer Experience máxima)

| Componente | Solução | Custo estimado |
|------------|---------|---------------|
| Next.js | Railway | ~$5/mês base + uso |
| Supabase | Supabase Cloud Free/Pro | $0-25/mês |
| **Total** | — | **$5-30/mês** |

Mais simples de operar, menos controle. Adequado para instâncias pessoais sem tráfego intenso.

#### Opção C: Vercel + Supabase Cloud (Fastest time-to-market)

| Componente | Solução | Custo estimado |
|------------|---------|---------------|
| Next.js | Vercel Hobby/Pro | $0-20/mês |
| Supabase | Supabase Cloud | $0-25/mês |
| **Total** | — | **$0-45/mês** |

Não é "true self-hosted" — dados em infraestrutura de terceiros. Adequado para demo/validação, não para usuários que querem controle total.

**Recomendação para README do projeto:**
- Documentar Opção A (VPS + Coolify + Supabase CE Docker) como path principal self-hosted
- Documentar Opção C (Vercel + Supabase Cloud) como "quick start" para testar antes de self-hospedar
- Supabase CE requer mínimo 4GB RAM; VPS adequado cobre isso com folga

---

## What NOT to Use

| Biblioteca/Padrão | Por que evitar |
|-------------------|---------------|
| **next-auth / Auth.js** | Supabase Auth já faz Google OAuth com RLS integrado. Dois sistemas de auth criariam conflito de sessions e tokens duplicados |
| **Prisma / Drizzle ORM** | Supabase JS client já é o ORM; adicionar Prisma cria duas camadas de acesso ao banco, duplica type generation, e quebra RLS (Prisma usa service role key) |
| **Redux / Redux Toolkit** | 40x mais boilerplate que Zustand para o mesmo resultado; nenhum benefício justificado para app pessoal single-tenant |
| **Context API como store global** | Re-renders em cascata; não escala com a quantidade de dados financeiros em memória |
| **Material UI / Chakra UI** | Não Tailwind-native; bundle pesado; design language conflita com mobile-first inspirado no Mobills |
| **Chart.js** | Canvas-based; não React-native; cleanup imperativo; menos ergonômico que Recharts |
| **Tremor** | Boa para SaaS genérico, mas opina demais no design. OPEN-LEDGER tem identidade visual própria; Recharts diretamente é melhor |
| **react-papaparse** | Wrapper desnecessário; papaparse core funciona melhor no App Router; react-papaparse tem incompatibilidades com SSR |
| **`getSession()` no servidor** | Lê cookies não verificados; vulnerabilidade de segurança documentada; usar `getUser()` sempre |
| **Supabase `supabase-js` sem `@supabase/ssr`** | Sessão não persiste em SSR; quebra autenticação em Server Components; `@supabase/ssr` é mandatório |
| **Service role key no frontend** | Bypassa todas as políticas RLS; vaza dados de todos os usuários; usar apenas em scripts admin server-side |

---

## Installation Reference

```bash
# UI
npm install tailwindcss @tailwindcss/typography
npx shadcn@latest init
npm install lucide-react class-variance-authority clsx tailwind-merge

# State & Data Fetching
npm install @tanstack/react-query zustand
npm install -D @tanstack/react-query-devtools

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# Charts
npm install recharts

# File Processing
npm install papaparse ofx-data-extractor
npm install -D @types/papaparse

# Supabase
npm install @supabase/ssr @supabase/supabase-js
```

---

## Confidence Levels

| Área | Confiança | Justificativa |
|------|-----------|---------------|
| shadcn/ui + Tailwind CSS | **HIGH** | Verificado via releases GitHub (v4.0.0 Mar 2026); padrão dominante no ecossistema Next.js 2025/2026 |
| TanStack Query + Zustand | **HIGH** | Padrão "federated state" documentado em múltiplas fontes; versões verificadas no npm |
| React Hook Form + Zod | **HIGH** | Combinação canônica; documentada em tutoriais oficiais Next.js e Supabase; versões estáveis |
| Recharts v3 | **HIGH** | Versão v3.8.1 verificada no GitHub releases (Mar 2026); 37M downloads/semana; TypeScript generics confirmados |
| PapaParse | **HIGH** | v5.5.3 verificado no npm (Mai 2025); 9M downloads/semana; zero deps |
| ofx-data-extractor | **MEDIUM** | v1.5.0 verificado no npm/GitHub (Mar 2025); funcionalidade adequada confirmada; biblioteca com baixo volume de uso (~2.1K/semana) — testar compatibilidade com OFX de bancos brasileiros (Itaú, Bradesco) |
| @supabase/ssr | **HIGH** | Documentado como oficial na docs Supabase; padrão mandatório para App Router confirmado |
| Supabase CE Docker | **HIGH** | Documentado no repositório oficial supabase/supabase; requisitos de hardware verificados |
| Coolify + Hetzner (self-hosting) | **MEDIUM** | Amplamente referenciado na comunidade; Coolify open-source verificado; custos estimados de fontes de 2026 |

---

## Open Questions / Flags para Fase de Implementação

1. **OFX de bancos brasileiros:** Testar `ofx-data-extractor` com extratos reais de Itaú, Bradesco, Nubank antes de commitar. Se encoding SGML/OFX antigo causar problemas, fallback para parse manual via regex ou `node-ofx`.
2. **Supabase Realtime:** Para atualização de saldo em tempo real após importação de CSV, avaliar se Supabase Realtime (websockets) vale o overhead vs. simples invalidação de cache TanStack Query.
3. **shadcn/ui Charts component:** shadcn/ui tem um componente `Chart` wrapper sobre Recharts — avaliar se usar o wrapper ou Recharts diretamente. O wrapper facilita theming via CSS variables.

---

*Sources: GitHub releases (shadcn-ui/ui, recharts, ofx-data-extractor), npm registry (papaparse, @supabase/ssr), Supabase official docs, Next.js App Router community patterns 2025/2026*
