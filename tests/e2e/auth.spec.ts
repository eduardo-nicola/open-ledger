import { test } from '@playwright/test'

// Stubs do plano 01-05; implementacao completa no plano 01-06.
test.todo('@smoke @auth-01 - rota protegida redireciona para /login quando nao autenticado')
test.todo('@smoke @auth-01 - tela de login exibe botao Google com aria-label correto')
test.todo('@smoke @auth-01 - usuario autenticado em /login e redirecionado para /profile')
test.todo('@smoke @auth-02 - sessao persiste apos reload do navegador')
test.todo('@smoke @auth-04 - tela de perfil exibe nome e email do usuario')
test.todo('@smoke @auth-04 - tela de perfil nao contem inputs de edicao (read-only)')
test.todo('@smoke @auth-04 - botao logout abre AlertDialog de confirmacao')
test.todo('@smoke @auth-04 - logout redireciona para /login')
