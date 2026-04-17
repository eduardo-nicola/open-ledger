import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const userName = (user.user_metadata?.full_name as string) ?? user.email ?? 'Usuário'
  const avatarUrl = (user.user_metadata?.avatar_url as string) ?? null

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header userName={userName} avatarUrl={avatarUrl} />
        <main className="flex-1 p-6 pb-20 md:p-8 md:pb-8">{children}</main>
      </div>

      <BottomNav />
    </div>
  )
}
