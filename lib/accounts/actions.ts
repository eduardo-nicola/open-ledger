'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  accountColorTokenToHex,
  createAccountSchema,
  updateAccountSchema,
} from '@/lib/accounts/schema'

export async function createAccount(input: unknown) {
  const parsed = createAccountSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(' ') || 'Dados inválidos' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Não autenticado' }
  }

  const { name, type, color, closing_day, due_day } = parsed.data
  const colorHex = accountColorTokenToHex(color)

  const insert = {
    user_id: user.id,
    name,
    type,
    color: colorHex,
    closing_day: type === 'credit_card' ? closing_day! : null,
    due_day: type === 'credit_card' ? due_day! : null,
  }

  const { error } = await supabase.from('accounts').insert(insert)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/accounts')
  return { ok: true as const }
}

export async function updateAccount(input: unknown) {
  const parsed = updateAccountSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(' ') || 'Dados inválidos' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Não autenticado' }
  }

  const { id, name, type, color, closing_day, due_day, archived_at } = parsed.data

  const patch: Record<string, unknown> = {}
  if (name !== undefined) patch.name = name
  if (type !== undefined) {
    patch.type = type
    if (type !== 'credit_card') {
      patch.closing_day = null
      patch.due_day = null
    }
  }
  if (color !== undefined) patch.color = accountColorTokenToHex(color)
  if (closing_day !== undefined) patch.closing_day = closing_day
  if (due_day !== undefined) patch.due_day = due_day
  if (archived_at !== undefined) patch.archived_at = archived_at

  const { error } = await supabase.from('accounts').update(patch).eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/accounts')
  revalidatePath(`/accounts/${id}`)
  return { ok: true as const }
}

export async function archiveAccount(formData: FormData) {
  const id = formData.get('id')
  if (typeof id !== 'string' || !id) {
    return { error: 'ID inválido' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Não autenticado' }
  }

  const { error } = await supabase
    .from('accounts')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/accounts')
  revalidatePath(`/accounts/${id}`)
  return { ok: true as const }
}

export async function unarchiveAccount(formData: FormData) {
  const id = formData.get('id')
  if (typeof id !== 'string' || !id) {
    return { error: 'ID inválido' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Não autenticado' }
  }

  const { error } = await supabase.from('accounts').update({ archived_at: null }).eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/accounts')
  revalidatePath(`/accounts/${id}`)
  return { ok: true as const }
}
