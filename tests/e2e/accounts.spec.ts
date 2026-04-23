import { createClient } from '@supabase/supabase-js'
import { expect, test } from '@playwright/test'

import { loadEnvFromDotEnvTest } from './helpers/env'

const E2E_USER_ID = 'aaaaaaaa-0000-0000-0000-000000000001'

test.describe('Accounts', () => {
  test.beforeAll(() => {
    loadEnvFromDotEnvTest()
  })

  test('@smoke @acc-01 — criar conta bancária e carteira digital', async ({ page }) => {
    const t = Date.now()
    const checkingName = `acc01-${t}`
    const walletName = `wallet-${t}`

    await page.goto('/accounts/new')
    await page.getByRole('button', { name: 'Conta bancária' }).click()
    await page.getByLabel('Nome').fill(checkingName)
    await page.getByRole('radio').first().click()
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page).toHaveURL(/\/accounts$/)

    await expect(page.getByText(checkingName)).toBeVisible()

    await page.goto('/accounts/new')
    await page.getByRole('button', { name: 'Carteira digital' }).click()
    await page.getByLabel('Nome').fill(walletName)
    await page.getByRole('radio').nth(1).click()
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page).toHaveURL(/\/accounts$/)

    await expect(page.getByText(checkingName)).toBeVisible()
    await expect(page.getByText(walletName)).toBeVisible()
  })

  test('@smoke @acc-02 — editar nome e arquivar conta', async ({ page }) => {
    const t = Date.now()
    const original = `acc02-${t}`
    const edited = `${original}-edited`

    await page.goto('/accounts/new')
    await page.getByRole('button', { name: 'Conta bancária' }).click()
    await page.getByLabel('Nome').fill(original)
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page).toHaveURL(/\/accounts$/)

    const createdRow = page.locator('li').filter({ hasText: original })
    await createdRow.getByRole('button', { name: 'Ações' }).click()
    await page.getByRole('menuitem', { name: 'Editar' }).click()
    await expect(page).toHaveURL(/\/accounts\/.+\/edit/)

    await page.getByLabel('Nome').fill(edited)
    await page.getByRole('button', { name: 'Salvar alterações' }).click()
    await expect(page).toHaveURL(/\/accounts\/.+$/)

    await expect(page.getByText(edited)).toBeVisible()

    await page.goto('/accounts')
    const row = page.locator('li').filter({ hasText: edited })
    await row.getByRole('button', { name: 'Ações' }).click()
    await page.getByRole('menuitem', { name: 'Arquivar' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Arquivar' }).click()

    await expect(page.getByText('Arquivada').first()).toBeVisible()
  })

  test('@smoke @acc-03 — cartão com fechamento e vencimento', async ({ page }) => {
    const t = Date.now()
    const name = `card-${t}`

    await page.goto('/accounts/new')
    await page.getByRole('button', { name: 'Cartão de crédito' }).click()
    await page.getByLabel('Nome').fill(name)
    await page.getByLabel('Dia de fechamento').fill('10')
    await page.getByLabel('Dia de vencimento').fill('17')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page).toHaveURL(/\/accounts$/)
    await expect(page.getByText(name)).toBeVisible()
  })

  test('@smoke @acc-04 — saldo consolidado com service role', async ({ page }) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    test.skip(!url || !serviceKey, 'SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL ausentes')

    const admin = createClient(url!, serviceKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    await admin.from('accounts').delete().eq('user_id', E2E_USER_ID)

    const t = Date.now()
    const aName = `chk-bal-${t}`
    const bName = `wlt-bal-${t}`
    const balanceA = 10_000
    const balanceB = 25_000

    await page.goto('/accounts/new', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: 'Conta bancária' })).toBeVisible()
    await page.getByRole('button', { name: 'Conta bancária' }).click()
    await expect(page.getByLabel('Nome')).toBeVisible()
    await page.getByLabel('Nome').fill(aName)
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page).toHaveURL(/\/accounts$/)

    await page.goto('/accounts/new', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: 'Carteira digital' })).toBeVisible()
    await page.getByRole('button', { name: 'Carteira digital' }).click()
    await expect(page.getByLabel('Nome')).toBeVisible()
    await page.getByLabel('Nome').fill(bName)
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page).toHaveURL(/\/accounts$/)

    const { data: rows, error: selErr } = await admin
      .from('accounts')
      .select('id, name')
      .eq('user_id', E2E_USER_ID)
      .in('name', [aName, bName])

    expect(selErr).toBeNull()
    const idA = rows?.find((r) => r.name === aName)?.id
    const idB = rows?.find((r) => r.name === bName)?.id
    expect(idA).toBeTruthy()
    expect(idB).toBeTruthy()

    const { error: u1 } = await admin.from('accounts').update({ balance: balanceA }).eq('id', idA!)
    const { error: u2 } = await admin.from('accounts').update({ balance: balanceB }).eq('id', idB!)
    expect(u1).toBeNull()
    expect(u2).toBeNull()

    await page.goto('/accounts')
    await expect(page.getByTestId('consolidated-balance-cents').first()).toHaveAttribute(
      'data-value',
      String(balanceA + balanceB),
    )
  })

  test('@smoke @acc-05 — gráfico ou empty state no detalhe', async ({ page }) => {
    const t = Date.now()
    const name = `chk-chart-${t}`

    await page.goto('/accounts/new')
    await page.getByRole('button', { name: 'Conta bancária' }).click()
    await page.getByLabel('Nome').fill(name)
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page).toHaveURL(/\/accounts$/)

    await page.getByRole('link', { name }).click()
    await expect(page).toHaveURL(/\/accounts\/[^/]+$/)

    const chartOrEmpty = page.locator('.recharts-wrapper, a:has-text("Lançar primeira transação")')
    await expect(chartOrEmpty.first()).toBeVisible()
  })
})
