import { expect, test } from '@playwright/test'

test('@smoke @auth-01 - usuario autenticado em /login e redirecionado para /profile', async ({
  page,
}) => {
  await page.goto('/login')
  await expect(page).toHaveURL(/.*\/profile/)
})

test('@smoke @auth-02 - sessao persiste apos reload do navegador', async ({ page }) => {
  await page.goto('/profile')
  await expect(page).toHaveURL(/.*\/profile/)
  await page.reload()
  await page.waitForURL(/.*\/profile/)
  await expect(page.getByRole('heading', { name: 'Meu Perfil' }).first()).toBeVisible()
})

test('@smoke @auth-04a - tela de perfil exibe nome e email do usuario', async ({ page }) => {
  await page.goto('/profile')
  await expect(page).toHaveURL(/.*\/profile/)
  await expect(page.getByText('Test User')).toBeVisible()
  await expect(page.getByText('test@open-ledger.local')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sair da conta' })).toBeVisible()
})

test('@smoke @auth-04b - tela de perfil nao contem inputs de edicao (read-only)', async ({
  page,
}) => {
  await page.goto('/profile')
  await expect(page).toHaveURL(/.*\/profile/)
  await expect(page.locator('input')).toHaveCount(0)
})

test('@smoke @auth-04c - botao logout abre AlertDialog de confirmacao', async ({ page }) => {
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Sair da conta' }).click()
  await expect(page.getByText('Sair da conta?')).toBeVisible()
  await expect(
    page.getByText(
      'Você precisará entrar com Google novamente para acessar suas finanças.',
    ),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancelar' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
})

test('@smoke @auth-04d - logout redireciona para /login', async ({ page }) => {
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Sair da conta' }).click()
  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL(/.*\/login/)
})
