---
phase: 1
slug: infrastructure-auth
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-15
---

# Phase 1 — UI Design Contract: Infrastructure & Auth

> Visual and interaction contract para autenticação e layout base do OPEN-LEDGER.
> Gerado por gsd-ui-researcher. Verificado por gsd-ui-checker.

---

## Design System

| Property          | Value                                                            | Source             |
|-------------------|------------------------------------------------------------------|--------------------|
| Tool              | shadcn/ui v4                                                     | STACK.md (decisão) |
| Preset            | A inicializar na fase 1 via `npx shadcn@latest init`             | STACK.md           |
| Component library | Radix UI (via shadcn/ui)                                         | STACK.md           |
| Icon library      | lucide-react (latest)                                            | STACK.md           |
| Font              | Inter (shadcn default via `next/font/google`)                    | default shadcn     |
| CSS approach      | Tailwind CSS v3 + CSS variables (shadcn tokens)                  | STACK.md           |
| Dark mode         | Suportado via `class` strategy no `<html>` — padrão escuro first | STACK.md           |

> ⚠️ **shadcn Gate:** `components.json` não encontrado no repositório. shadcn/ui deve ser inicializado como **primeira tarefa da fase 1** via `npx shadcn@latest init`. Ir em [ui.shadcn.com/themes](https://ui.shadcn.com/themes) para gerar o preset antes de inicializar.

---

## Screens em Escopo — Fase 1

| Screen       | Rota         | Requisito       | Descrição                                                      |
|--------------|--------------|-----------------|----------------------------------------------------------------|
| Login        | `/login`     | AUTH-01         | Única tela pré-autenticação. Botão "Entrar com Google"         |
| App Shell    | `/(app)/*`   | AUTH-02, AUTH-03 | Layout base: header mobile + sidebar desktop + área de conteúdo |
| Perfil       | `/profile`   | AUTH-04         | Nome, avatar Google, opção de logout                           |

---

## Spacing Scale

Declarado — escala de 8 pontos (múltiplos de 4):

| Token | Value | Usage                                                   |
|-------|-------|---------------------------------------------------------|
| xs    | 4px   | Gaps entre ícone e label, padding de badges             |
| sm    | 8px   | Padding interno de botões compactos, gaps de inputs     |
| md    | 16px  | Padding padrão de cards e seções                        |
| lg    | 24px  | Padding lateral de página (mobile)                      |
| xl    | 32px  | Gaps entre blocos de conteúdo                           |
| 2xl   | 48px  | Espaço entre seções principais                          |
| 3xl   | 64px  | Espaçamento de página full (desktop)                    |

**Exceções:**
- Touch targets mínimos: **44px** de área clicável em mobile (botões de nav, avatar) — usar padding extra sem alterar o visual
- Logo na login page: altura fixa **40px**, sem restrição de escala

---

## Typography

| Role    | Size  | Weight          | Line Height | Usage                                        |
|---------|-------|-----------------|-------------|----------------------------------------------|
| Body    | 14px  | 400 (regular)   | 1.5         | Texto geral, labels de formulário, listas    |
| Label   | 12px  | 500 (medium)    | 1.4         | Labels de nav, badges, metadados             |
| Heading | 20px  | 600 (semibold)  | 1.2         | Título de página (ex: "Meu perfil")          |
| Display | 28px  | 700 (bold)      | 1.1         | Nome do app na tela de login                 |

**Regras:**
- Nunca usar tamanhos fora destes 4 nesta fase
- Font stack: `Inter, system-ui, -apple-system, sans-serif`
- Antialiasing: `antialiased` (classe Tailwind no `<body>`)

---

## Color

Sistema de cores baseado em CSS variables do shadcn/ui — dark mode como padrão.

| Role             | Token shadcn          | Hex aproximado (dark) | Usage                                                          |
|------------------|-----------------------|-----------------------|----------------------------------------------------------------|
| Dominant (60%)   | `background`          | `#09090b`             | Background global de páginas                                   |
| Secondary (30%)  | `card`                | `#18181b`             | Cards, sidebar, nav mobile, inputs                             |
| Accent (10%)     | `primary`             | `#22c55e` (green-500) | CTA primário, indicador de nav ativo, ícone de app             |
| Muted            | `muted`               | `#27272a`             | Divisores, bordas sutis, placeholder                           |
| Foreground       | `foreground`          | `#fafafa`             | Texto principal                                                |
| Muted foreground | `muted-foreground`    | `#a1a1aa`             | Texto secundário, labels, metadados                            |
| Destructive      | `destructive`         | `#ef4444` (red-500)   | Somente: botão "Sair" (logout) com confirmação                 |

**Accent reservado exclusivamente para:**
1. Botão primário "Entrar com Google" (ícone Google + label)
2. Indicador de item ativo na navegação (sidebar desktop + bottom nav mobile)
3. Ícone/logo do app na tela de login

**Regra:** Nenhum outro elemento usa a cor accent nesta fase sem aprovação explícita.

---

## Layout — App Shell (Mobile-first)

### Mobile (< 768px)
```
┌─────────────────────────────┐
│  Header: Logo + Avatar      │  h=56px, bg=card
├─────────────────────────────┤
│                             │
│     Área de conteúdo        │  flex-grow, padding: lg (24px)
│                             │
├─────────────────────────────┤
│  Bottom Nav: 4 ícones       │  h=64px, bg=card, border-top
│  [Dashboard][Contas][Trans][Perfil] │
└─────────────────────────────┘
```

### Desktop (≥ 768px)
```
┌────────────┬────────────────────────────────┐
│            │  Header: título da página      │  h=56px
│  Sidebar   ├────────────────────────────────┤
│  (240px)   │                                │
│  Logo      │     Área de conteúdo           │
│  Nav items │     padding: xl (32px)         │
│  [Avatar]  │                                │
└────────────┴────────────────────────────────┘
```

**Nav items (Fase 1 — placeholder para fases futuras):**
- Dashboard (ícone: `LayoutDashboard`) — inativo em Fase 1
- Contas (ícone: `Landmark`) — inativo em Fase 1
- Transações (ícone: `ArrowLeftRight`) — inativo em Fase 1
- Perfil (ícone: `User`) — ativo em Fase 1

---

## Tela de Login — Especificação Visual

```
┌─────────────────────────────────────┐
│                                     │
│         (espaço: 2xl = 48px)        │
│                                     │
│   [ícone app 40px]                  │
│   Open Ledger          ← Display    │
│   Suas finanças em um só lugar      │
│                                     │
│         (espaço: 2xl = 48px)        │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  [G] Entrar com Google      │   │  ← botão primário, w=100%
│   └─────────────────────────────┘   │
│                                     │
│   Ao continuar você concorda com    │
│   os Termos de Uso.          ← Body │
│                                     │
└─────────────────────────────────────┘
```

- Fundo: `background` (dominant)
- Card central: **não usar card** — layout full-screen centrado verticalmente
- Largura máxima do conteúdo: 360px no desktop, padding lateral lg (24px) no mobile
- Google button: usar `Button` shadcn com `variant="outline"`, ícone SVG do Google (não lucide), label "Entrar com Google"

---

## Tela de Perfil — Especificação Visual

```
┌─────────────────────────────────────┐
│  [←] Meu Perfil         ← Heading  │
├─────────────────────────────────────┤
│                                     │
│   [Avatar 80px] circular            │
│   Nome completo         ← Heading   │
│   email@gmail.com       ← Body/muted│
│                                     │
│   ─────────────────────────────     │
│                                     │
│   [Sair da conta]       ← destruct  │
│                                     │
└─────────────────────────────────────┘
```

- Avatar: `<Image>` Next.js com `src` do Google, `className="rounded-full"`, 80×80px
- Email: cor `muted-foreground`
- Botão "Sair da conta": `variant="destructive"`, `size="sm"`, w=100%

---

## Copywriting Contract

| Element                     | Copy                                                                  |
|-----------------------------|-----------------------------------------------------------------------|
| Primary CTA (login)         | **Entrar com Google**                                                 |
| App tagline (login)         | Suas finanças em um só lugar                                          |
| App name                    | Open Ledger                                                           |
| Nav: Dashboard              | Dashboard                                                             |
| Nav: Contas                 | Contas                                                                |
| Nav: Transações             | Transações                                                            |
| Nav: Perfil                 | Perfil                                                                |
| Profile page title          | Meu Perfil                                                            |
| Logout button               | Sair da conta                                                         |
| Logout confirmation heading | Sair da conta?                                                        |
| Logout confirmation body    | Você precisará entrar com Google novamente para acessar suas finanças.|
| Logout confirm action       | Sair                                                                  |
| Logout cancel action        | Cancelar                                                              |
| Error: auth falhou          | Não foi possível entrar com Google. Tente novamente.                  |
| Error: sessão expirou       | Sua sessão expirou. Por favor, entre novamente.                       |
| Empty nav (fase 1)          | Em breve — disponível nas próximas fases                              |
| Loading state               | Carregando…                                                           |
| Legal footer (login)        | Ao continuar, você concorda com os Termos de Uso.                     |

---

## Interações & Estados

| Componente           | Estados                                                              |
|----------------------|----------------------------------------------------------------------|
| Botão Google (login) | idle → loading (spinner) → redirect (desabilitado)                  |
| Avatar menu          | idle → dropdown com "Meu Perfil" + "Sair da conta"                  |
| Logout               | click → Alert Dialog de confirmação → loading → redirect para /login |
| Nav items inativos   | Visualmente presentes, mas desabilitados (`opacity-50`, sem cursor) |
| Rota protegida       | Redirect imediato para `/login` via middleware (sem flash de conteúdo)|

---

## Componentes shadcn Necessários — Fase 1

| Componente     | Uso                                                  |
|----------------|------------------------------------------------------|
| `Button`       | Google sign-in, Logout, ações gerais                 |
| `Avatar`       | Foto do usuário no header e perfil                   |
| `AlertDialog`  | Confirmação de logout                                |
| `Separator`    | Divisores na tela de perfil                          |
| `Skeleton`     | Loading states enquanto sessão é verificada          |
| `Sheet`        | Drawer de navegação mobile (se necessário)           |
| `Tooltip`      | Labels de nav no sidebar colapsado (desktop)         |

> Todos os componentes são do **registry oficial shadcn** (`ui.shadcn.com/r`). Nenhum registry de terceiros nesta fase.

---

## Registry Safety

| Registry         | Blocks Used                                           | Safety Gate                        |
|------------------|-------------------------------------------------------|------------------------------------|
| shadcn official  | Button, Avatar, AlertDialog, Separator, Skeleton, Sheet, Tooltip | not required — official only |

---

## Acessibilidade — Requisitos Mínimos

- Botão Google: `aria-label="Entrar com Google"`
- Avatar no header: `alt="{nome do usuário}"`
- Nav items: `aria-current="page"` no item ativo
- AlertDialog de logout: foco preso no diálogo até resolução
- Contraste mínimo: 4.5:1 para texto body em todas as superfícies

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
