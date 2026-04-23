import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBalanceHistoryForAccount } from '@/lib/accounts/balance-history'
import { BalanceChart } from '@/components/accounts/balance-chart'
import { Button } from '@/components/ui/button'
import { formatCurrencyBRLFromCents } from '@/lib/format-currency'
import type { Database } from '@/types/database'

type AccountRow = Database['public']['Tables']['accounts']['Row']

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ id: string }> }

export default async function AccountDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase.from('accounts').select('*').eq('id', id).maybeSingle()

  if (error || data === null) {
    notFound()
  }

  const account = data as AccountRow
  const history = await getBalanceHistoryForAccount(id, 30)
  const showDash = account.type === 'credit_card'

  return (
    <div className="mx-auto max-w-lg space-y-6 md:max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-foreground">{account.name}</h1>
        <Button asChild variant="outline" size="sm">
          <Link href={`/accounts/${account.id}/edit`}>Editar</Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Tipo:{' '}
        <span className="text-foreground">
          {account.type === 'checking' ?
            'Conta bancária'
          : account.type === 'digital_wallet' ?
            'Carteira digital'
          : account.type === 'credit_card' ?
            'Cartão de crédito'
          : account.type}
        </span>
      </p>
      <p className="text-2xl font-semibold tabular-nums">
        {showDash ? '—' : formatCurrencyBRLFromCents(account.balance)}
      </p>

      <section className="space-y-2" aria-labelledby="chart-heading">
        <h2 id="chart-heading" className="text-sm font-medium text-muted-foreground">
          Últimos 30 dias
        </h2>
        <BalanceChart series={history} />
      </section>

      <Button asChild variant="link" className="px-0">
        <Link href="/accounts">← Voltar para contas</Link>
      </Button>
    </div>
  )
}
