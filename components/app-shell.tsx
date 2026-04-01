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
      className="min-h-12 min-w-[4.5rem] flex-col gap-1 px-2 py-2 h-auto font-normal"
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
    <div className="min-h-dvh flex justify-center bg-gradient-to-b from-default-100 via-default-200 to-default-100 dark:from-default-50 dark:via-default-100 dark:to-default-50">
      <div className="w-full max-w-[430px] min-h-dvh flex flex-col bg-background shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-2 px-3 py-2 border-b border-divider/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
          <ShellUserMenu />
          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 pt-3 pb-28">
          {children}
        </main>
        <nav
          className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-divider/80 bg-content1/95 backdrop-blur-md px-1 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex justify-around items-stretch shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.25)]"
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
  );
}
