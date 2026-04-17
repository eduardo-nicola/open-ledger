import { expect, test } from '@playwright/test'

test('@smoke @auth-01 - rota protegida redireciona para /login quando nao autenticado', async ({
  browser,
}) => {
  const context = await browser.newContext({ storageState: undefined })
  const page = await context.newPage()
  await page.goto('/profile')
  await expect(page).toHaveURL(/.*\/login/)
  await expect(page.getByRole('button', { name: 'Entrar com Google' })).toBeVisible()
  await context.close()
})

test('@smoke @auth-01 - tela de login exibe botao Google com aria-label correto', async ({
  browser,
}) => {
  const context = await browser.newContext({ storageState: undefined })
  const page = await context.newPage()
  await page.goto('/login')
  await expect(page).toHaveURL(/.*\/login/)
  await expect(page.getByRole('button', { name: 'Entrar com Google' })).toBeVisible()
  await expect(page.getByText('Suas finanças em um só lugar')).toBeVisible()
  await context.close()
})

test('@smoke @auth-01 - texto legal dos termos aparece na tela de login', async ({ browser }) => {
  const context = await browser.newContext({ storageState: undefined })
  const page = await context.newPage()
  await page.goto('/login')
  await expect(
    page.getByText('Ao continuar, você concorda com os Termos de Uso.'),
  ).toBeVisible()
  await context.close()
})

test('@smoke @auth-01 - botao Google dispara authorize com provider google e redirect local', async ({
  browser,
}) => {
  const context = await browser.newContext({ storageState: undefined })
  const page = await context.newPage()

  const authorizePromise = page.waitForRequest(
    (request) =>
      request.url().includes('/auth/v1/authorize') &&
      request.url().includes('provider=google') &&
      request.url().includes('redirect_to='),
  )

  await page.goto('/login')
  await page.getByRole('button', { name: 'Entrar com Google' }).click()
  const request = await authorizePromise
  expect(request.url()).toMatch(/redirect_to=.*auth%2Fcallback/)
  await context.close()
})
