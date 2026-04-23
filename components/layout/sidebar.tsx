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

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden min-h-screen w-60 flex-col border-r border-border bg-card py-4 md:flex">
      <div className="mb-6 px-4">
        <span className="text-base font-semibold text-foreground">Open Ledger</span>
      </div>

      <TooltipProvider>
        <nav className="flex flex-1 flex-col gap-1 px-2" aria-label="Navegação principal">
          {navItems.map(({ href, label, icon: Icon, activeInPhase1 }) => {
            const isActive = pathname.startsWith(href)

            if (!activeInPhase1) {
              return (
                <Tooltip key={href}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                        'text-muted-foreground opacity-50'
                      )}
                      aria-disabled="true"
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{label}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Em breve — disponível nas próximas fases</p>
                  </TooltipContent>
                </Tooltip>
              )
            }

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>
      </TooltipProvider>
    </aside>
  )
}
