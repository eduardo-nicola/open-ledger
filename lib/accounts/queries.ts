import { createClient } from '@/lib/supabase/server'

export async function getAccountsForUser() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

/** ACC-04 / D-07: soma checking + digital_wallet ativas (exclui cartão, poupança e arquivadas). */
export async function getConsolidatedBalanceCents(): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('accounts')
    .select('balance')
    .is('archived_at', null)
    .in('type', ['checking', 'digital_wallet'])

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).reduce((sum, row) => sum + row.balance, 0)
}
