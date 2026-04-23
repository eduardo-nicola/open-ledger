import { getAccountsForUser, getConsolidatedBalanceCents } from '@/lib/accounts/queries'
import { AccountList } from '@/components/accounts/account-list'

export const dynamic = 'force-dynamic'

export default async function AccountsPage() {
  const [accounts, consolidatedCents] = await Promise.all([
    getAccountsForUser(),
    getConsolidatedBalanceCents(),
  ])

  return (
    <div className="mx-auto max-w-lg space-y-6 md:max-w-2xl">
      <h1 className="text-xl font-semibold text-foreground">Contas</h1>
      <AccountList accounts={accounts} consolidatedCents={consolidatedCents} />
    </div>
  )
}
