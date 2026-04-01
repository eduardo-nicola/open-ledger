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
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no login.");
    } finally {
      setBusy(false);
    }
  }

  if (!isFirebaseConfigured()) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6 bg-gradient-to-b from-default-100 to-default-200 dark:from-default-50 dark:to-default-100">
        <Card className="w-full max-w-md border border-divider shadow-lg" radius="lg">
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
    <div className="min-h-dvh flex justify-center bg-gradient-to-b from-default-100 via-default-200 to-default-100 dark:from-default-50 dark:via-default-100 dark:to-default-50">
      <div className="w-full max-w-[430px] min-h-dvh flex flex-col bg-background shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
        <header className="flex justify-end px-3 py-2 border-b border-divider/60">
          <ThemeToggle />
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
          <Card
            className="w-full max-w-sm border border-divider/80 shadow-lg"
            radius="lg"
          >
            <CardHeader className="flex flex-col gap-2 items-start pb-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Finanças pessoais
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
