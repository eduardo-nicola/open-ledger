"use client";

import { Button } from "@heroui/react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <span
        className="inline-flex h-10 w-10 shrink-0 rounded-full bg-default-100"
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      isIconOnly
      variant="flat"
      radius="full"
      className="min-h-10 w-10 text-default-600"
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      onPress={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <Sun className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
      ) : (
        <Moon className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
      )}
    </Button>
  );
}
