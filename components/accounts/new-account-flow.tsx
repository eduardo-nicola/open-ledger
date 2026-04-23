'use client'

import { useState } from 'react'
import { Landmark, Smartphone, CreditCard } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AccountForm } from '@/components/accounts/account-form'
import type { AccountUiType } from '@/lib/accounts/schema'

const types: { type: AccountUiType; title: string; description: string; icon: typeof Landmark }[] = [
  {
    type: 'checking',
    title: 'Conta bancária',
    description: 'Centralizador de entradas, saídas e saldo em conta.',
    icon: Landmark,
  },
  {
    type: 'digital_wallet',
    title: 'Carteira digital',
    description: 'Pix e saldo em carteiras digitais.',
    icon: Smartphone,
  },
  {
    type: 'credit_card',
    title: 'Cartão de crédito',
    description: 'Fatura e dias de fechamento e vencimento.',
    icon: CreditCard,
  },
]

export function NewAccountFlow() {
  const [selected, setSelected] = useState<AccountUiType | null>(null)

  if (selected) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => setSelected(null)}
        >
          Voltar à escolha do tipo
        </button>
        <AccountForm mode="create" defaultType={selected} />
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
      {types.map(({ type, title, description, icon: Icon }) => (
        <button
          key={type}
          type="button"
          className="text-left"
          onClick={() => setSelected(type)}
        >
          <Card className="h-full transition-colors hover:border-primary/50">
            <CardHeader>
              <Icon className="mb-2 h-8 w-8 text-primary" aria-hidden />
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        </button>
      ))}
    </div>
  )
}
