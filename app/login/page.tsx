"use client";

import { Button, Card, CardBody, CardHeader } from "@heroui/react";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { isFirebaseConfigured } from "@/services/firebase/config";

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no login.");
    } finally {
      setBusy(false);
    }
  }

  if (!isFirebaseConfigured()) {
    return (
      <div className="page-app-gradient flex items-center justify-center p-6">
        <Card className="glass-card w-full max-w-md" shadow="none" radius="lg">
          <CardHeader className="text-lg font-semibold">Configuração necessária</CardHeader>
          <CardBody className="text-default-600 text-small leading-relaxed">
            Defina as variáveis <code className="text-primary">NEXT_PUBLIC_FIREBASE_*</code> em{" "}
            <code className="text-primary">.env.local</code>. Consulte{" "}
            <code className="text-primary">.env.example</code> e o{" "}
            <code className="text-primary">README.md</code> do repositório.
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-app-gradient flex justify-center">
      <div className="flex min-h-dvh w-full max-w-[430px] flex-col bg-transparent">
        <header className="glass-header flex justify-end px-3 py-2">
          <ThemeToggle />
        </header>
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-12">
          <Card className="glass-card w-full max-w-sm" shadow="none" radius="lg">
            <CardHeader className="flex flex-col gap-2 items-start pb-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                OpenLedger
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Bem-vindo
              </h1>
              <p className="text-small text-default-500 leading-relaxed">
                Entre com sua conta Google para sincronizar cartões e saldo em conta.
              </p>
            </CardHeader>
            <CardBody className="gap-4 pt-2">
              {error ? (
                <p className="text-danger text-small rounded-medium bg-danger/10 px-3 py-2" role="alert">
                  {error}
                </p>
              ) : null}
              <Button
                color="primary"
                size="lg"
                className="w-full min-h-12 font-semibold"
                radius="lg"
                startContent={<LogIn className="h-5 w-5" strokeWidth={2} />}
                isLoading={busy || loading}
                onPress={() => void handleGoogle()}
              >
                Continuar com Google
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
