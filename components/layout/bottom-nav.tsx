'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeftRight, Landmark, LayoutDashboard, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, activeInPhase1: false },
  { href: '/accounts', label: 'Contas', icon: Landmark, activeInPhase1: true },
  { href: '/transactions', label: 'Transações', icon: ArrowLeftRight, activeInPhase1: false },
  { href: '/profile', label: 'Perfil', icon: User, activeInPhase1: true },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-border bg-card md:hidden"
      aria-label="Navegação principal"
    >
      <TooltipProvider>
        <ul className="flex h-full items-center justify-around px-2">
          {navItems.map(({ href, label, icon: Icon, activeInPhase1 }) => {
            const isActive = pathname.startsWith(href)

            if (!activeInPhase1) {
              return (
                <li key={href}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="flex min-h-[44px] min-w-[44px] cursor-not-allowed flex-col items-center justify-center gap-1 opacity-50"
                        aria-disabled="true"
                      >
                        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                        <span className="text-[10px] text-muted-foreground">{label}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Em breve — disponível nas próximas fases</p>
                    </TooltipContent>
                  </Tooltip>
                </li>
              )
            }

            return (
              <li key={href}>
                <Link
                  href={href}
                  className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1"
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground')}
                    aria-hidden="true"
                  />
                  <span
                    className={cn(
                      'text-[10px]',
                      isActive ? 'font-medium text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {label}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </TooltipProvider>
    </nav>
  )
}
