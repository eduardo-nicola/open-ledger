---
phase: 01
slug: infrastructure-auth
status: verified
threats_open: 0
asvs_level: 1
created: 2026-04-17
---

# Fase 01 — Segurança

> Contrato de segurança da fase: registro de ameaças, riscos aceitos e trilha de auditoria.

---

## Limites de confiança

| Limite | Descrição | Dados que cruzam |
|--------|-------------|------------------|
| Máquina do dev → git | Segredos não versionados | `.env.local`, chaves Supabase/Google |
| auth.users → public.profiles | Trigger com privilégios elevados | Metadados de novo usuário |
| Cliente → Postgres (Supabase) | RLS por JWT | Linhas filtradas por `auth.uid()` |
| Browser → middleware Next | Enforcement de sessão | Cookies de sessão Supabase |
| Google OAuth → `/auth/callback` | Troca de código PKCE | `code`, redirect interno |
| Componentes cliente/servidor → Supabase Auth | Operações de sessão | Tokens, metadados de usuário |
| Testes → API Supabase | Apenas ambiente local | Chaves de dev, usuários seed |

---

## Registro de ameaças

| Threat ID | Categoria | Componente | Disposição | Mitigação / evidência | Status |
|-----------|-----------|--------------|------------|------------------------|--------|
| T-01-01 | Information Disclosure | `.env.local` / git | mitigate | `.gitignore` inclui `.env.local`; `package.json` sem segredos | closed |
| T-01-02 | Information Disclosure | `NEXT_PUBLIC_*` | accept | Ver log de riscos aceitos | closed |
| T-02-01 | Elevation of Privilege | RLS nas tabelas | mitigate | 12 `CREATE POLICY`; RLS habilitado em `profiles`, `accounts`, `transactions` | closed |
| T-02-02 | Elevation of Privilege | `handle_new_user` | mitigate | `SECURITY DEFINER SET search_path = public` na migration | closed |
| T-02-03 | Information Disclosure | `SUPABASE_SERVICE_ROLE_KEY` | mitigate | `.env.example` sem valores; variável sem prefixo `NEXT_PUBLIC_` | closed |
| T-02-04 | Tampering | SQL via cliente Supabase | accept | Ver log de riscos aceitos | closed |
| T-02-05 | Elevation of Privilege | Acesso cross-user | mitigate | Políticas com `auth.uid() = id` ou `auth.uid() = user_id` | closed |
| T-03-01 | Spoofing | `getSession()` no servidor | mitigate | `middleware.ts` usa apenas `getUser()` | closed |
| T-03-02 | Spoofing | JWT forjado | mitigate | `getUser()` valida com API Supabase | closed |
| T-03-03 | Tampering | Renovação de cookies | mitigate | Middleware retorna `supabaseResponse` com `setAll` em cookies | closed |
| T-03-04 | Tampering | CSRF OAuth state | accept | Ver log de riscos aceitos | closed |
| T-03-05 | Tampering | Open redirect em `/auth/callback` | mitigate | `safeRelativeNextPath()` em `app/auth/callback/route.ts` — só paths que começam com `/` e não com `//` | closed |
| T-04-01 | Spoofing | Rota autenticada sem auth | mitigate | Middleware + `getUser()` em `app/(app)/layout.tsx` e `profile/page.tsx` | closed |
| T-04-02 | Information Disclosure | Cache de dados do usuário | mitigate | `export const dynamic = 'force-dynamic'` em `profile/page.tsx` | closed |
| T-04-03 | Tampering | `redirectTo` em OAuth | accept | Ver log de riscos aceitos | closed |
| T-04-04 | Information Disclosure | `avatar_url` | accept | Ver log de riscos aceitos | closed |
| T-05-01 | Information Disclosure | Service role nos testes | mitigate | Nenhuma chave hardcoded em `tests/`; credenciais via ambiente / anon conforme implementação atual | closed |
| T-05-02 | Information Disclosure | `seed.sql` | mitigate | Apenas emails locais fictícios (`test@open-ledger.local`, etc.) | closed |
| T-05-03 | Elevation of Privilege | Service role em fixtures | accept | Ver log de riscos aceitos | closed |
| T-01-21 | Information Disclosure | Credenciais de teste no código | mitigate | Constantes apenas para usuário/senha de dev local em `tests/e2e/auth.setup.ts` | closed |
| T-01-22 | Information Disclosure | `tests/.auth/user.json` | mitigate | `tests/.auth/` no `.gitignore` | closed |
| T-01-23 | Tampering | Service role no setup de teste | accept | Ver log de riscos aceitos | closed |

*Status: open · closed*

---

## Log de riscos aceitos

| Risk ID | Threat ref | Racional | Aceito por | Data |
|---------|--------------|----------|------------|------|
| AR-01 | T-01-02 | Variáveis `NEXT_PUBLIC_*` são expostas ao browser por design; apenas anon key como `NEXT_PUBLIC_`, nunca service role. | Auditoria fase 01 | 2026-04-17 |
| AR-02 | T-02-04 | Cliente Supabase usa queries parametrizadas; SQL raw fora do escopo desta fase. | Auditoria fase 01 | 2026-04-17 |
| AR-03 | T-03-04 | PKCE e fluxo gerenciado pelo Supabase mitigam CSRF em OAuth. | Auditoria fase 01 | 2026-04-17 |
| AR-04 | T-04-03 | `redirectTo` usa `window.location.origin` + callback interno; superfície limitada ao fluxo OAuth. | Auditoria fase 01 | 2026-04-17 |
| AR-05 | T-04-04 | `avatar_url` vem de JWT validado pelo Supabase; `next.config.ts` restringe hosts de imagem remotos. | Auditoria fase 01 | 2026-04-17 |
| AR-06 | T-05-03 | Service role, se usado em evoluções futuras para fixtures, fica restrito a testes locais; RLS validado com chave anon onde aplicável. | Auditoria fase 01 | 2026-04-17 |
| AR-07 | T-01-23 | Uso controlado de APIs admin apenas contra Supabase local para preparar dados de teste. | Auditoria fase 01 | 2026-04-17 |

---

## Trilha de auditoria de segurança

| Data auditoria | Ameaças totais | Fechadas | Abertas | Executado por |
|------------------|----------------|----------|---------|----------------|
| 2026-04-17 | 23 | 23 | 0 | /gsd-secure-phase (revisão código + `01-SECURITY.md`) |

### Flags de ameaça nos SUMMARYs

Nenhuma seção `## Threat Flags` encontrada nos `*-SUMMARY.md` desta fase — sem `unregistered_flag`.

---

## Aprovação

- [x] Todas as ameaças têm disposição (mitigate / accept / transfer)
- [x] Riscos aceitos documentados no log acima
- [x] `threats_open: 0` confirmado
- [x] `status: verified` no frontmatter

**Aprovação:** verificado em 2026-04-17 (mitigação T-03-05 reforçada no callback após verificação do plano).
