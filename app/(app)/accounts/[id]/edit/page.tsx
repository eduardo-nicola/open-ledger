import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AccountForm } from '@/components/accounts/account-form'
import { Button } from '@/components/ui/button'
import type { Database } from '@/types/database'

type AccountRow = Database['public']['Tables']['accounts']['Row']

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ id: string }> }

export default async function AccountEditPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase.from('accounts').select('*').eq('id', id).maybeSingle()

  if (error || data === null) {
    notFound()
  }

  const account = data as AccountRow

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-foreground">Editar conta</h1>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/accounts/${account.id}`}>Cancelar</Link>
        </Button>
      </div>
      <AccountForm mode="edit" account={account} />
    </div>
  )
}
