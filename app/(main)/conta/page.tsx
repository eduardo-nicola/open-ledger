"use client";

import { Button, Card, CardBody, CardHeader, Input, Spinner } from "@heroui/react";
import { useState } from "react";

import { useAuth } from "@/components/auth-provider";
import {
  useRecentTransactions,
  useWallet,
} from "@/components/finance-data-provider";
import { formatBRLFromCents, parseBRLToCents } from "@/lib/money";
import { addAccountMovement } from "@/services/finance/finance-service";
import type { Transaction } from "@/lib/types";

function txLabel(t: Transaction): string {
  switch (t.type) {
    case "account_credit":
      return "Entrada";
    case "account_debit":
      return "Saída";
    case "card_payment_from_account":
      return "Pagamento de cartão";
    case "expense_card":
      return "Despesa no cartão (referência)";
    default:
      return t.type;
  }
}

export default function ContaPage() {
  const { user } = useAuth();
  const uid = user?.uid;
  const wallet = useWallet();
  const recent = useRecentTransactions(30);
  const [amountStr, setAmountStr] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState<"in" | "out" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  async function submit(kind: "account_credit" | "account_debit") {
    setError(null);
    const cents = parseBRLToCents(amountStr);
    if (cents == null || cents <= 0) {
      setError("Informe um valor válido.");
      return;
    }
    if (!uid) return;
    setBusy(kind === "account_credit" ? "in" : "out");
    try {
      await addAccountMovement(uid, kind, cents, today, desc || "—");
      setAmountStr("");
      setDesc("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao lançar.");
    } finally {
      setBusy(null);
    }
  }

  const contaTx = recent.filter(
    (t) =>
      t.type === "account_credit" ||
      t.type === "account_debit" ||
      t.type === "card_payment_from_account"
  );

  return (
    <div className="space-y-7">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Conta corrente
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Conta</h1>
      </header>

      <Card shadow="md" radius="lg" className="border border-divider/60">
        <CardHeader className="flex flex-col items-start gap-1 pb-0">
          <span className="text-small text-default-500 font-medium">Saldo em conta</span>
          {wallet ? (
            <span className="text-3xl font-semibold tabular-nums">
              {formatBRLFromCents(wallet.balanceCents)}
            </span>
          ) : (
            <Spinner size="sm" />
          )}
        </CardHeader>
        <CardBody className="text-small text-default-500">
          Separado dos cartões. Use &quot;Pagar com conta&quot; no cartão para abater a fatura.
        </CardBody>
      </Card>

      <Card shadow="md" radius="lg" className="border border-divider/60">
        <CardHeader>
          <span className="font-semibold text-foreground">Lançar na conta</span>
        </CardHeader>
        <CardBody className="gap-3">
          {error ? (
            <p className="text-danger text-small" role="alert">
              {error}
            </p>
          ) : null}
          <Input
            label="Valor (R$)"
            placeholder="0,00"
            inputMode="decimal"
            value={amountStr}
            onValueChange={setAmountStr}
          />
          <Input
            label="Descrição (opcional)"
            value={desc}
            onValueChange={setDesc}
          />
          <div className="flex flex-col gap-2">
            <Button
              color="success"
              className="min-h-12"
              isLoading={busy === "in"}
              onPress={() => void submit("account_credit")}
            >
              Entrada (crédito)
            </Button>
            <Button
              color="warning"
              variant="flat"
              className="min-h-12"
              isLoading={busy === "out"}
              onPress={() => void submit("account_debit")}
            >
              Saída (débito)
            </Button>
          </div>
        </CardBody>
      </Card>

      <section className="rounded-large border border-divider/50 bg-content1/30 p-4 dark:bg-content1/20">
        <h2 className="text-base font-semibold mb-3 text-foreground">Histórico (conta)</h2>
        {contaTx.length === 0 ? (
          <p className="text-small text-default-500">Nenhum lançamento na conta ainda.</p>
        ) : (
          <ul className="space-y-2">
            {contaTx.map((t) => (
              <li
                key={t.id}
                className="flex justify-between gap-2 text-small border-b border-divider pb-2"
              >
                <div>
                  <p className="font-medium">{txLabel(t)}</p>
                  {t.description && t.description !== "—" ? (
                    <p className="text-default-500">{t.description}</p>
                  ) : null}
                  <p className="text-xs text-default-400">{t.date}</p>
                </div>
                <span
                  className={
                    t.type === "account_credit"
                      ? "text-success tabular-nums shrink-0"
                      : "tabular-nums shrink-0"
                  }
                >
                  {t.type === "account_credit" ? "+" : "−"}
                  {formatBRLFromCents(t.amountCents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
