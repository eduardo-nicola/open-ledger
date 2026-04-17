import { expect, test } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

import { loadEnvFromDotEnvLocal } from './helpers/env'

loadEnvFromDotEnvLocal()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

const TEST_USER_1_EMAIL = 'test@open-ledger.local'
const TEST_USER_1_PASSWORD = 'test-password-open-ledger-123'
const TEST_USER_2_ID = 'bbbbbbbb-0000-0000-0000-000000000002'

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

test('@smoke @auth-03 - RLS: usuario 1 nao consegue ler dados do usuario 2', async () => {
  const { data: account, error: insertError } = await supabaseAdmin
    .from('accounts')
    .insert({
      user_id: TEST_USER_2_ID,
      name: 'Conta Secreta User 2',
      type: 'checking',
      color: '#ff0000',
    })
    .select('id')
    .single()

  if (insertError || !account) {
    throw new Error(`Falha ao criar account de teste: ${insertError?.message ?? 'sem conta'}`)
  }

  const accountId = account.id

  try {
    const user1Client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    })
    const { data: sessionData, error: signInError } =
      await user1Client.auth.signInWithPassword({
        email: TEST_USER_1_EMAIL,
        password: TEST_USER_1_PASSWORD,
      })

    if (signInError || !sessionData.session) {
      throw new Error(`Falha ao autenticar usuario 1: ${signInError?.message ?? 'sem sessao'}`)
    }

    const supabaseUser1 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
      },
      auth: { persistSession: false },
    })

    const { data: result, error: queryError } = await supabaseUser1
      .from('accounts')
      .select('*')
      .eq('id', accountId)

    expect(queryError).toBeNull()
    expect(result).toHaveLength(0)
  } finally {
    await supabaseAdmin.from('accounts').delete().eq('id', accountId)
  }
})

test('@smoke @auth-03 - RLS: usuario consegue ler seus proprios dados', async () => {
  const user1Client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  })

  const { data: sessionData, error: signInError } = await user1Client.auth.signInWithPassword({
    email: TEST_USER_1_EMAIL,
    password: TEST_USER_1_PASSWORD,
  })

  if (signInError || !sessionData.session) {
    throw new Error(`Falha ao autenticar usuario 1: ${signInError?.message ?? 'sem sessao'}`)
  }

  const supabaseUser1 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${sessionData.session.access_token}` } },
    auth: { persistSession: false },
  })

  const { data: profiles, error } = await supabaseUser1.from('profiles').select('id')

  expect(error).toBeNull()
  expect(profiles).toHaveLength(1)
  expect(profiles?.[0]?.id).toBe(sessionData.session.user.id)
})
