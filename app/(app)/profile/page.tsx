import Image from 'next/image'
import { redirect } from 'next/navigation'
import { LogoutButton } from '@/components/auth/logout-button'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const name = (user.user_metadata?.full_name as string) ?? 'Usuário'
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined
  const email = user.email ?? ''

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-xl font-semibold text-foreground">Meu Perfil</h1>

      <div className="mb-6 flex flex-col items-center gap-3">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            width={80}
            height={80}
            className="rounded-full"
            priority
          />
        ) : (
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-xl font-semibold text-muted-foreground"
            aria-label={name}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="text-center">
          <p className="text-xl font-semibold text-foreground">{name}</p>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
      </div>

      <Separator className="mb-6" />

      <LogoutButton />
    </div>
  )
}
