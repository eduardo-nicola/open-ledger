import fs from 'fs'
import path from 'path'

import { Buffer } from 'node:buffer'

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { expect, test as setup, type Page } from '@playwright/test'

import { loadEnvFromDotEnvLocal } from './helpers/env'

const AUTH_FILE = path.join(__dirname, '../.auth/user.json')
const DEFAULT_MANUAL_AUTH_TIMEOUT_MS = 15 * 60 * 1000

const TEST_EMAIL = 'test@open-ledger.local'
const TEST_PASSWORD = 'test-password-open-ledger-123'

const getManualAuthTimeoutMs = (): number => {
  const rawTimeout = process.env.E2E_MANUAL_AUTH_TIMEOUT_MS
  const parsedTimeout = Number(rawTimeout)
  if (Number.isFinite(parsedTimeout) && parsedTimeout > 0) {
    return parsedTimeout
  }
  return DEFAULT_MANUAL_AUTH_TIMEOUT_MS
}

const waitForProfileRoute = async (page: Page): Promise<void> => {
  const timeoutMs = getManualAuthTimeoutMs()
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    try {
      if (page.isClosed()) {
        throw new Error('Navegador fechado durante o login. Rode o setup de novo com --headed.')
      }
      if (page.url().includes('/profile')) {
        return
      }
    } catch (error) {
      if (page.isClosed()) {
        throw new Error('Navegador fechado durante o login. Rode o setup de novo com --headed.')
      }
      throw error
    }
    await page.waitForTimeout(1000)
  }

  throw new Error(
    `Nao foi possivel concluir o login dentro de ${timeoutMs}ms. Se precisar de mais tempo para 2FA, defina E2E_MANUAL_AUTH_TIMEOUT_MS no ambiente.`,
  )
}

const tryGoogleCredentialLogin = async (page: Page): Promise<void> => {
  const googleTestEmail = process.env.E2E_GOOGLE_TEST_EMAIL
  const googleTestPassword = process.env.E2E_GOOGLE_TEST_PASSWORD
  if (!googleTestEmail || !googleTestPassword) {
    return
  }

  const timeoutMs = getManualAuthTimeoutMs()
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline && !page.url().includes('/profile')) {
    if (page.isClosed()) {
      return
    }
    const currentUrl = page.url()
    const isGoogleAuthPage =
      currentUrl.includes('accounts.google.com') || currentUrl.includes('google.com')

    if (!isGoogleAuthPage) {
      await page.waitForTimeout(1000)
      continue
    }

    try {
      const emailInput = page.locator('input[type="email"]')
      if (await emailInput.isVisible().catch(() => false)) {
        await emailInput.fill(googleTestEmail)
        await page.getByRole('button', { name: /Next|Próxima|Proximo/i }).click()
        await page.waitForTimeout(1000)
        continue
      }

      const passwordInput = page.locator('input[type="password"]')
      if (await passwordInput.isVisible().catch(() => false)) {
        await passwordInput.fill(googleTestPassword)
        await page.getByRole('button', { name: /Next|Próxima|Proximo/i }).click()
        const continueButton = page
          .getByRole('button', { name: /Continue|Continuar/i })
          .first()
        if (await continueButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await continueButton.click()
        }
        await page.waitForTimeout(1000)
        continue
      }
    } catch {
      if (page.isClosed()) {
        return
      }
    }

    await page.waitForTimeout(1000)
  }
}

const persistSessionWithPassword = async (
  page: Page,
  supabaseUrl: string,
  anonKey: string,
): Promise<void> => {
  const signInClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await signInClient.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })

  if (error || !data.session) {
    throw new Error(
      `auth.setup (email/senha) falhou: ${error?.message ?? 'sem sessao'}. Rode supabase db reset e confirme o seed.`,
    )
  }

  await page.goto('/login')
  const origin = new URL(page.url()).origin

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: async () => {
        const cookies = await page.context().cookies(origin)
        return cookies.map((cookie) => ({ name: cookie.name, value: cookie.value }))
      },
      setAll: async (cookiesToSet) => {
        const normalizeSameSite = (
          raw: unknown,
        ): 'Lax' | 'Strict' | 'None' => {
          if (raw === 'Strict' || raw === 'strict') {
            return 'Strict'
          }
          if (raw === 'None' || raw === 'none') {
            return 'None'
          }
          return 'Lax'
        }

        const cookieUrl = `${origin}/`
        const host = new URL(origin).hostname

        for (const { name, value } of cookiesToSet) {
          if (!value) {
            await page.context().clearCookies({ name, domain: host })
          }
        }

        const toAdd = cookiesToSet.filter(
          (cookie) => typeof cookie.value === 'string' && cookie.value.length > 0,
        )

        if (toAdd.length === 0) {
          return
        }

        await page.context().addCookies(
          toAdd.map(({ name, value, options }) => ({
            name,
            value,
            url: cookieUrl,
            httpOnly: Boolean(options?.httpOnly),
            secure: Boolean(options?.secure),
            sameSite: normalizeSameSite(options?.sameSite),
            expires:
              typeof options?.maxAge === 'number'
                ? Math.floor(Date.now() / 1000) + options.maxAge
                : undefined,
          })),
        )
      },
    },
  })

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  })

  if (sessionError) {
    throw new Error(`auth.setup nao conseguiu gravar sessao nos cookies: ${sessionError.message}`)
  }

  await page.goto('/profile')
  await page.waitForURL(/.*\/profile/, { timeout: 15_000 })
}

const runGoogleManualSetup = async (page: Page): Promise<void> => {
  await page.goto('/login')
  await expect(page.getByRole('button', { name: 'Entrar com Google' })).toBeVisible()
  await page.getByRole('button', { name: 'Entrar com Google' }).click()
  await tryGoogleCredentialLogin(page)
  await waitForProfileRoute(page)
}

type StorageStateCookie = { name: string; domain: string; value: string; expires: number }

const readSupabaseSessionExpiresAt = (cookies: StorageStateCookie[] | undefined): number | null => {
  const chunk0 =
    cookies?.find((cookie) => /^sb-.+-auth-token\.0$/.test(cookie.name)) ??
    cookies?.find((cookie) => /^sb-.+-auth-token$/.test(cookie.name))
  if (!chunk0?.value?.startsWith('base64-')) {
    return null
  }

  try {
    const payload = Buffer.from(chunk0.value.slice('base64-'.length), 'base64url').toString('utf8')
    const parsedPayload = JSON.parse(payload) as { expires_at?: number }
    return typeof parsedPayload.expires_at === 'number' ? parsedPayload.expires_at : null
  } catch {
    return null
  }
}

const hasValidStorageState = (): boolean => {
  if (!fs.existsSync(AUTH_FILE)) {
    return false
  }

  try {
    const rawState = fs.readFileSync(AUTH_FILE, 'utf-8')
    const parsedState = JSON.parse(rawState) as {
      cookies?: StorageStateCookie[]
    }

    const expiresAt = readSupabaseSessionExpiresAt(parsedState.cookies)
    if (!expiresAt) {
      return false
    }

    const nowInSeconds = Math.floor(Date.now() / 1000)
    return expiresAt > nowInSeconds + 60
  } catch {
    return false
  }
}

setup('autenticar e salvar storageState', async ({ page }, testInfo) => {
  loadEnvFromDotEnvLocal()
  testInfo.setTimeout(getManualAuthTimeoutMs() + 120_000)

  const authMode = (process.env.E2E_AUTH_MODE ?? 'password').toLowerCase()

  if (authMode === 'google' && hasValidStorageState()) {
    return
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    throw new Error(
      'Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (.env.local) para o setup E2E.',
    )
  }

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true })

  if (authMode === 'google') {
    await runGoogleManualSetup(page)
  } else {
    await persistSessionWithPassword(page, supabaseUrl, anonKey)
  }

  await page.context().storageState({ path: AUTH_FILE })
})
