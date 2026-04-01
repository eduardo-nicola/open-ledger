"use client";

import {
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import type { User } from "firebase/auth";
import { LogOut } from "lucide-react";

import { useAuth } from "@/components/auth-provider";

function displayLabel(user: User) {
  return (
    user.displayName?.trim() ||
    user.email?.split("@")[0]?.trim() ||
    "Conta"
  );
}

export function ShellUserMenu() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const name = displayLabel(user);
  const email = user.email ?? undefined;

  return (
    <Dropdown placement="bottom-start" offset={8}>
      <DropdownTrigger>
        <Button
          variant="light"
          className="min-h-10 h-auto max-w-[min(100%,14rem)] gap-2.5 px-1.5 py-1 rounded-xl data-[hover=true]:bg-default-100"
          aria-label="Menu da conta"
        >
          <Avatar
            size="sm"
            radius="full"
            src={user.photoURL ?? undefined}
            name={name}
            showFallback
            className="shrink-0 ring-2 ring-primary/20"
          />
          <span className="min-w-0 flex-1 text-left">
            <span className="block text-sm font-semibold text-foreground truncate">
              {name}
            </span>
            {email ? (
              <span className="block text-xs text-default-500 truncate">
                {email}
              </span>
            ) : null}
          </span>
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Ações da conta" variant="flat">
        <DropdownItem
          key="logout"
          className="text-danger"
          color="danger"
          startContent={<LogOut className="h-4 w-4" aria-hidden />}
          onPress={() => void logout()}
        >
          Sair
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
