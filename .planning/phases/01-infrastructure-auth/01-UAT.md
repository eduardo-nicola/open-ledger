---
status: complete
phase: 01-infrastructure-auth
source:
  - 01-01-SUMMARY.md
  - 01-02-SUMMARY.md
  - 01-03-SUMMARY.md
  - 01-04-SUMMARY.md
  - 01-05-SUMMARY.md
  - 01-06-SUMMARY.md
started: 2026-04-17T17:14:28Z
updated: 2026-04-17T17:38:42Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Encerrar o servidor Next e o stack Supabase local se estiverem rodando. Subir de novo do zero (`supabase start` com seed/migrations aplicáveis, depois `npm run dev` ou o comando que você usa no dia a dia). Não deve haver erro fatal no boot; a home ou health básica responde; seed/migration conclui sem falha silenciosa.
result: pass

### 2. Proteção de rota privada (visitante)
expected: Com o navegador em sessão anônima (ou após logout), ao abrir `/profile` você é redirecionado para `/login` (ou fluxo de auth equivalente), sem vazar conteúdo privado antes do redirect.
result: pass

### 3. Tela de login
expected: Em `/login` aparecem o layout do grupo de auth, o CTA de login com Google e, ao iniciar o login, há feedback claro de carregamento/desabilitado até o redirect OAuth (ou mensagem de erro coerente se OAuth não estiver configurado).
result: pass

### 4. Fluxo Google OAuth até área autenticada
expected: Com Google OAuth configurado no projeto, concluir o login Google, passar por `/auth/callback` sem erro, chegar ao shell autenticado e ver `/profile` com nome/email (ou avatar) coerentes com a conta Google.
result: pass

### 5. App shell e navegação responsiva
expected: Logado, no mobile há header (~56px) e bottom nav fixa (~64px) com alvos tocáveis confortáveis; no desktop há sidebar (~240px). Itens Dashboard/Contas/Transações aparecem desabilitados com indicação do tipo “Em breve”; o item ativo (ex.: Perfil) fica destacado.
result: pass

### 6. Perfil read-only e logout com confirmação
expected: Em `/profile` os dados são somente leitura (sem formulário de edição). “Sair” abre diálogo de confirmação; ao confirmar, a sessão encerra e você volta ao fluxo público (ex.: `/login`); tentar `/profile` de novo exige login.
result: pass

### 7. Sessão persiste após recarregar (F5)
expected: Com sessão válida dentro do app autenticado, ao recarregar a página (F5) você permanece logado e o shell/perfil continuam acessíveis sem novo login.
result: pass

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
