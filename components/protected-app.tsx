"use client";

import { Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";
import { FinanceDataProvider } from "@/components/finance-data-provider";
import { isFirebaseConfigured } from "@/services/firebase/config";

export function ProtectedApp({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (!isFirebaseConfigured()) {
    return (
      <div className="page-app-gradient flex items-center justify-center p-6 text-center text-default-600">
        <p>
          Configure o Firebase em <code className="text-primary">.env.local</code> (veja{" "}
          <code className="text-primary">.env.example</code>).
        </p>
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="page-app-gradient flex items-center justify-center">
        <Spinner size="lg" color="primary" label="Carregando..." />
      </div>
    );
  }

  return (
    <FinanceDataProvider uid={user.uid}>
      <AppShell>{children}</AppShell>
    </FinanceDataProvider>
  );
}
