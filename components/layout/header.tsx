import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface HeaderProps {
  userName: string
  avatarUrl: string | null
}

export function Header({ userName, avatarUrl }: HeaderProps) {
  const initials = userName
    .split(' ')
    .map((namePart) => namePart[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
      <span className="text-base font-semibold text-foreground">Open Ledger</span>

      <Link
        href="/profile"
        className="ml-auto rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={userName}
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatarUrl ?? undefined} alt={userName} />
          <AvatarFallback className="bg-muted text-xs text-muted-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
      </Link>
    </header>
  )
}
