'use client'

import Link from 'next/link'
import { Landmark, Smartphone, CreditCard } from 'lucide-react'
import type { Database } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrencyBRLFromCents } from '@/lib/format-currency'
import { cn } from '@/lib/utils'
import { ArchiveAccountMenuItem } from '@/components/accounts/archive-account-button'

type AccountRow = Database['public']['Tables']['accounts']['Row']

type AccountListProps = {
  accounts: AccountRow[]
  consolidatedCents: number
}

function TypeIcon({ type }: { type: AccountRow['type'] }) {
  if (type === 'digital_wallet') return <Smartphone className="h-5 w-5 shrink-0 text-muted-foreground" />
  if (type === 'credit_card') return <CreditCard className="h-5 w-5 shrink-0 text-muted-foreground" />
  return <Landmark className="h-5 w-5 shrink-0 text-muted-foreground" />
}

export function AccountList({ accounts, consolidatedCents }: AccountListProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Saldo total</p>
          <p
            className="mt-1 text-3xl font-semibold tracking-tight text-foreground"
            data-testid="consolidated-balance-cents"
            data-value={String(consolidatedCents)}
          >
            {formatCurrencyBRLFromCents(consolidatedCents)}
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-medium text-foreground">Suas contas</h2>
        <Button asChild size="sm">
          <Link href="/accounts/new">Nova conta</Link>
        </Button>
      </div>

      {accounts.length === 0 ?
        <p className="text-sm text-muted-foreground">Nenhuma conta ainda.</p>
      : <ul className="space-y-3">
          {accounts.map((account) => {
            const archived = Boolean(account.archived_at)
            const showDash = account.type === 'credit_card'
            return (
              <li key={account.id}>
                <Card className={cn(archived && 'opacity-60')}>
                  <CardContent className="flex items-center gap-3 py-4">
                    <TypeIcon type={account.type} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/accounts/${account.id}`}
                          className="truncate font-medium text-foreground hover:underline"
                        >
                          {account.name}
                        </Link>
                        {archived ?
                          <Badge variant="secondary">Arquivada</Badge>
                        : null}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-sm font-medium tabular-nums text-foreground">
                      {showDash ? '—' : formatCurrencyBRLFromCents(account.balance)}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="shrink-0">
                          Ações
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/accounts/${account.id}/edit`}>Editar</Link>
                        </DropdownMenuItem>
                        <ArchiveAccountMenuItem accountId={account.id} archived={archived} />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>
      }
    </div>
  )
}
