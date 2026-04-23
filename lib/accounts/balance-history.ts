import { createClient } from '@/lib/supabase/server'

/*
ACC-05 pré-Fase 3: série constante = accounts.balance em cada dia; Fase 3 substituirá por acumulado de transações pagas.
*/

/**
 * Histórico de saldo para o gráfico ACC-05.
 *
 * ACC-05 pré-Fase 3: série constante = accounts.balance em cada dia; Fase 3 substituirá por acumulado de transações pagas.
 * Datas em UTC (componente `date` como `YYYY-MM-DD`), série com exatamente `days` pontos terminando no dia UTC atual do servidor.
 */
export async function getBalanceHistoryForAccount(
  accountId: string,
  days = 30
): Promise<{ date: string; balanceCents: number }[]> {
  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', accountId)
    .maybeSingle()

  if (error || !row) {
    return []
  }

  const balanceCents = row.balance
  const now = new Date()
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )

  const points: { date: string; balanceCents: number }[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(end)
    d.setUTCDate(d.getUTCDate() - (days - 1 - i))
    const date = d.toISOString().slice(0, 10)
    points.push({ date, balanceCents })
  }

  return points
}
