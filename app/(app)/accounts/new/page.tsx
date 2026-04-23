import { NewAccountFlow } from '@/components/accounts/new-account-flow'

export const dynamic = 'force-dynamic'

export default function NewAccountPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-xl font-semibold text-foreground">Nova conta</h1>
      <NewAccountFlow />
    </div>
  )
}
