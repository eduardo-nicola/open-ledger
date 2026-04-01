"use client";

import { HeroUIProvider } from "@heroui/react";
import { useRouter } from "next/navigation";

import { AuthProvider } from "@/components/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <ThemeProvider>
      <HeroUIProvider navigate={router.push}>
        <AuthProvider>{children}</AuthProvider>
      </HeroUIProvider>
    </ThemeProvider>
  );
}
