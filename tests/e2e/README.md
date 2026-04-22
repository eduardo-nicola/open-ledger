# E2E Tests — Contrato de Execução

Guia único de referência para rodar os testes Playwright do OPEN-LEDGER. Cobre pré-requisitos, variáveis de ambiente, duas variações de autenticação Google e a matriz completa de comandos.

---

## Pré-requisitos

- **Node.js ≥ 20** e **npm** instalados
- **Supabase CLI** disponível no PATH (`supabase --version`)
- Instância local do Supabase rodando e populada:

  ```bash
  supabase start          # inicia containers (Postgres, Auth, Storage…)
  supabase db reset       # aplica migrations + seed (cria test@open-ledger.local)
  ```

- Arquivo `.env.local` criado a partir de `.env.example` com as variáveis obrigatórias:

  ```bash
  cp .env.example .env.local
  # editar .env.local e preencher:
  #   NEXT_PUBLIC_SUPABASE_URL   — saída de `supabase start` (linha "API URL")
  #   NEXT_PUBLIC_SUPABASE_ANON_KEY — saída de `supabase start` (linha "anon key")
  ```

- Para o modo `password` (debug/smoke rápido), apenas as duas variáveis acima são suficientes.
- Para o modo `google` (OAuth real), configure também no provedor Google do Supabase local:
  - `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` (Google Cloud Console)
  - Redirect URI autorizado: `http://127.0.0.1:54321/auth/v1/callback`
  - Opcionalmente, adicione ao `.env.local` para automação de preenchimento:
    ```
    E2E_GOOGLE_TEST_EMAIL=sua-conta-de-teste@gmail.com
    E2E_GOOGLE_TEST_PASSWORD=senha-da-conta-de-teste
    ```
  - A conta Google de teste **não deve ter 2FA ativo** (reduziria atrito no setup automatizado).

---

## Base URL

Todos os testes usam **`http://127.0.0.1:3000`** — mesma valor definido em `playwright.config.ts`:

```
baseURL: 'http://127.0.0.1:3000'
```

> **Atenção:** não substitua por `localhost:3000`. Os dois endereços são tratados como origens distintas pelo browser; cookies criados em `127.0.0.1` não são enviados para `localhost` e vice-versa. Manter o mesmo host evita falhas silenciosas de autenticação.

O servidor Next.js é iniciado automaticamente pelo `webServer` do Playwright se não estiver rodando, ou reutilizado se já estiver (`reuseExistingServer: true` fora de CI).

---

## Caminho de confiança (Google OAuth real)

> Alinhado à decisão **D-01** da fase 01.1.

O caminho **definitivo e oficial** de teste autenticado é o **fluxo Google OAuth na UI**:

1. Usuário acessa `/login`
2. Clica no botão **"Entrar com Google"**
3. Autenticado pelo IdP Google
4. Redirecionado para `/profile`

Esse é o único fluxo que valida a integração real entre o frontend, o Supabase Auth e o provedor Google. As mensagens de erro e o comportamento de redirect são parte do contrato testado.

O modo `password` (via `signInWithPassword` + injeção de cookies) **não é equivalente** para fins de confiança: ele bypassa o OAuth e deve ser usado apenas para smoke rápido e CI sem segredos Google (ver [Modo password](#modo-password-apenas-debug--velocidade)).

---

## Variação A — Google já logado

Use quando o browser/perfil que o Playwright usará **já possui uma sessão Google ativa**.

**Passos:**

1. Antes de rodar o setup, abra o Chrome com o perfil de teste e faça login na conta Google de teste manualmente (ou use um `storageState` previamente gerado com sessão Google válida).
2. Exporte `E2E_AUTH_MODE=google` no ambiente (ou use o script `test:e2e:google`).
3. Rode o setup:

   ```bash
   E2E_AUTH_MODE=google npx playwright test --project=setup
   ```

4. O setup navega para `/login`, clica em **"Entrar com Google"** e, como o IdP já reconhece a sessão, o redirecionamento ocorre direto para `/profile` — sem digitar email/senha novamente.
5. O `storageState` é gravado em `tests/.auth/user.json` para uso pelos projetos `chromium` dependentes.

**Resultado esperado:** chegada em `/profile` sem interação manual de credenciais.

---

## Variação B — Google não logado

Use quando o browser **não possui sessão Google ativa** — fluxo completo de autenticação.

**Passos:**

1. Certifique-se de que não há sessão Google no contexto Playwright (ou use um contexto limpo).
2. Exporte `E2E_AUTH_MODE=google`.
3. Rode o setup:

   ```bash
   E2E_AUTH_MODE=google npx playwright test --project=setup
   ```

4. O setup navega para `/login` e clica em **"Entrar com Google"**.
5. **Automação com credenciais** (opcional): se `E2E_GOOGLE_TEST_EMAIL` e `E2E_GOOGLE_TEST_PASSWORD` estiverem definidos, `tryGoogleCredentialLogin` tenta preencher email e senha automaticamente nas páginas `accounts.google.com`.
6. **Intervenção manual** (fallback): se as variáveis não estiverem definidas, o setup aguarda `E2E_MANUAL_AUTH_TIMEOUT_MS` (default: 15 minutos) para que o humano conclua o login no browser headed aberto pelo Playwright.
7. Após chegada em `/profile`, o `storageState` é gravado em `tests/.auth/user.json`.

**Resultado esperado:** chegada em `/profile` com sessão válida gravada, independente do caminho (automático ou manual).

> **Nota CI:** Login Google em CI pode ser bloqueado por anti-bot ou CAPTCHA. A recomendação é rodar a Variação B localmente antes do merge, ou configurar um job de CI opcional com segredos GitHub dedicados. Não é um gate obrigatório para PRs sem credenciais Google.

---

## Modo password (apenas debug / velocidade)

`E2E_AUTH_MODE=password` (ou ausência da variável — o default em código é `password`) usa `signInWithPassword` da SDK Supabase + injeção de cookies via `@supabase/ssr`.

**Quando usar:**

- Smoke rápido local sem configurar OAuth
- CI sem segredos Google disponíveis
- Desenvolvimento de novos testes onde a autenticação não é o objeto do teste

**Limitações — leia antes de usar:**

- **Não** valida o fluxo Google OAuth (botão, redirect, callback do Supabase)
- **Não** substitui a Variação A ou B quando o objetivo é "teste de confiança" do login
- Depende do usuário `test@open-ledger.local` criado pelo seed (`supabase db reset`)
- Se `supabase db reset` não foi rodado ou o seed não existe, o setup falha com mensagem:
  > `auth.setup (email/senha) falhou: … Rode supabase db reset e confirme o seed.`

---

## Matriz de execução

| Cenário | Comando | `E2E_AUTH_MODE` | Headless/Headed | Notas |
|---------|---------|-----------------|-----------------|-------|
| Smoke local (padrão) | `npm run test:e2e:smoke` | `password` ou vazio | Headless | CI/local padrão; requer apenas seed e `.env.local` |
| Smoke com Google OAuth | `npm run test:e2e:google` | `google` (exportado pelo script) | Headed Chrome | Requer segredos / sessão Google; job opcional em CI |
| Todos os cenários @auth | `npm run test:e2e:auth` | Conforme env (`password` ou `google`) | Headless (password) / Headed (google) | Superconjunto de smoke; grep `@auth` pega `@auth-01`, `@auth-04a`… |
| Suite completa | `npx playwright test` | Conforme env | Headless (password) / Headed (google) | Todos os projetos: setup + chromium + chromium-unauth |

**Semântica dos scripts:**

- `test:e2e:smoke` → `playwright test --grep @smoke` — cenários marcados com `@smoke` (subconjunto rápido)
- `test:e2e:auth` → `playwright test --grep @auth` — todos os cenários com `@auth` em qualquer sufixo (`@auth-01`, `@auth-04a`…); **superconjunto** do smoke
- `test:e2e:google` → `env E2E_AUTH_MODE=google playwright test --grep @smoke` — mesmos cenários do smoke mas com setup Google OAuth

---

## headed vs headless

O projeto `setup` (`auth.setup.ts`) é forçado para **headed + Chrome real** quando `E2E_AUTH_MODE=google`:

```ts
// playwright.config.ts
...(process.env.E2E_AUTH_MODE === 'google'
  ? { channel: 'chrome', headless: false, launchOptions: { … } }
  : {})
```

Isso é necessário porque:
- O OAuth Google detecta automação em browsers headless e pode bloquear o login
- Flags `--disable-blink-features=AutomationControlled` e `ignoreDefaultArgs` reduzem detecção de bot
- O `channel: 'chrome'` usa Chrome instalado no sistema (não Chromium bundled do Playwright)

Os projetos `chromium` e `chromium-unauth` (que rodam os testes em si) são sempre **headless** e não dependem do modo de auth do setup.

---

## Definição de pronto para PR (TST-07)

Antes de mergear um PR que toca `tests/e2e/` ou `playwright.config.ts`:

- [ ] `npm run test:e2e:smoke` verde localmente (modo `password`, sem segredos Google)
- [ ] Nenhum teste com `test.only` commitado (bloqueado por `forbidOnly: !!process.env.CI`)
- [ ] Se o PR altera o fluxo de autenticação Google: Variação A ou B executada manualmente e confirmada
- [ ] Tags `@auth-XX` novas documentadas na tabela do README (plano 02 — higiene de tags)

---

## Tags e rastreio (AUTH)

Mapeamento 1:1 entre tags Playwright e sub-capacidades dos requisitos. Use para localizar qual cenário cobre qual requisito sem ler o corpo do teste.

| Tag | Requisito | Arquivo | O que verifica |
|-----|-----------|---------|----------------|
| @auth-01 | AUTH-01 | tests/e2e/auth.spec.ts | Usuário autenticado em /login é redirecionado para /profile |
| @auth-02 | AUTH-02 | tests/e2e/auth.spec.ts | Sessão persiste após reload do navegador |
| @auth-03 | AUTH-03 | tests/e2e/rls.spec.ts | Isolamento de dados entre usuários (RLS) |
| @auth-04a | AUTH-04 | tests/e2e/auth.spec.ts | Nome e email do usuário visíveis na tela de perfil |
| @auth-04b | AUTH-04 | tests/e2e/auth.spec.ts | Tela de perfil em modo read-only (sem inputs de edição) |
| @auth-04c | AUTH-04 | tests/e2e/auth.spec.ts | Botão de logout abre AlertDialog de confirmação |
| @auth-04d | AUTH-04 | tests/e2e/auth.spec.ts | Confirmação de logout redireciona para /login |

> `@auth-03` vive em `tests/e2e/rls.spec.ts` — não está coberto por `auth.spec.ts`.

Para inspecionar todas as tags auth no repositório:

```bash
rg '@auth-' tests/e2e
```

---

## Scripts npm e grep

Os scripts E2E usam `--grep` para filtrar testes pelo título:

- `npm run test:e2e:smoke` executa `playwright test --grep @smoke` — subconjunto rápido marcado com `@smoke`; inclui `@auth-01`, `@auth-02`, `@auth-04a`…`@auth-04d`.
- `npm run test:e2e:auth` executa `playwright test --grep @auth` — todos os cenários cujo título contenha `@auth` (grep por substring); captura `@auth-01`, `@auth-02`, `@auth-04a`, `@auth-04b`, `@auth-04c`, `@auth-04d`. É um **superconjunto** do smoke: adiciona qualquer cenário `@auth` futuro não marcado `@smoke`.
- `npm run test:e2e:google` executa `env E2E_AUTH_MODE=google playwright test --grep @smoke` — mesmos cenários do smoke mas com setup Google OAuth real.
- Ambos `test:e2e:smoke` e `test:e2e:auth` respeitam o mesmo `storageState` / modo de auth definido por `E2E_AUTH_MODE` no momento da execução.

---

*Referência da iniciativa: `.planning/TESTING-INITIATIVE.md`*
