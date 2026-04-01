"use client";

import { Button } from "@heroui/react";
import {
  CreditCard,
  Home,
  PlusCircle,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ShellUserMenu } from "@/components/shell-user-menu";
import { ThemeToggle } from "@/components/theme-toggle";

const nav = [
  { href: "/", label: "Início", Icon: Home },
  { href: "/cartoes", label: "Cartões", Icon: CreditCard },
  { href: "/conta", label: "Conta", Icon: Wallet },
  { href: "/lancamento", label: "Novo", Icon: PlusCircle },
] as const;

function NavLink({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: typeof Home;
  active: boolean;
}) {
  return (
    <Button
      as={Link}
      href={href}
      variant={active ? "flat" : "light"}
      color={active ? "primary" : "default"}
      className="min-h-11 min-w-13 flex-col gap-0.5 px-1.5 py-1.5 h-auto font-normal"
      radius="lg"
    >
      <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.25 : 2} aria-hidden />
      <span className="text-[10px] leading-tight font-medium">{label}</span>
    </Button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="page-app-gradient flex justify-center">
      <div className="flex min-h-dvh w-full max-w-[430px] flex-col bg-transparent">
        <header className="glass-header sticky top-0 z-40 flex items-center justify-between gap-2 px-3 py-2">
          <ShellUserMenu />
          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 pt-3 pb-32">
          {children}
        </main>
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          <nav
            className="glass-dock pointer-events-auto flex max-w-full items-stretch justify-center gap-2 rounded-4xl px-4 py-1.5"
            aria-label="Navegação principal"
          >
            {nav.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                Icon={item.Icon}
                active={
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href)
                }
              />
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
