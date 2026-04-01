"use client";

import { Card, CardBody, CardHeader, Progress } from "@heroui/react";
import Link from "next/link";

import {
  useCards,
  useRecentTransactions,
  useWallet,
} from "@/components/finance-data-provider";
import { formatBRLFromCents } from "@/lib/money";
import type { Transaction } from "@/lib/types";

function txLabel(t: Transaction): string {
  switch (t.type) {
    case "expense_card":
      return "Despesa no cartão";
    case "account_credit":
      return "Entrada na conta";
    case "account_debit":
      return "Saída da conta";
    case "card_payment_from_account":
      return "Pagamento de cartão (conta)";
    default:
      return t.type;
  }
}

export default function HomePage() {
  const wallet = useWallet();
  const cards = useCards();
  const recent = useRecentTransactions(8);

  const totalUsed = cards.reduce((s, c) => s + c.usedCents, 0);
  const totalLimit = cards.reduce((s, c) => s + c.limitCents, 0);

  return (
    <div className="space-y-7">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          OpenLedger
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Resumo
        </h1>
        <p className="text-small text-default-500">Visão geral das suas finanças</p>
      </header>

      <Card shadow="md" radius="lg" className="border border-divider/60">
        <CardHeader className="flex flex-col items-start gap-1 pb-0">
          <span className="text-small text-default-500 font-medium">Saldo em conta</span>
          <span className="text-2xl font-semibold tabular-nums">
            {wallet
              ? formatBRLFromCents(wallet.balanceCents)
              : "—"}
          </span>
        </CardHeader>
        <CardBody className="pt-2">
          <Link
            href="/conta"
            className="text-primary text-small font-medium"
          >
            Ver conta e lançamentos
          </Link>
        </CardBody>
      </Card>

      <Card shadow="md" radius="lg" className="border border-divider/60">
        <CardHeader className="flex flex-col items-start gap-1 pb-0">
          <span className="text-small text-default-500 font-medium">Cartões (total utilizado)</span>
          <span className="text-xl font-semibold tabular-nums">
            {formatBRLFromCents(totalUsed)}
            {totalLimit > 0 ? (
              <span className="text-default-500 text-base font-normal">
                {" "}
                / {formatBRLFromCents(totalLimit)}
              </span>
            ) : null}
          </span>
        </CardHeader>
        <CardBody className="gap-3 pt-2">
          {totalLimit > 0 ? (
            <Progress
              aria-label="Uso total dos cartões"
              size="md"
              value={Math.min(100, (totalUsed / totalLimit) * 100)}
              color={totalUsed > totalLimit * 0.9 ? "danger" : "primary"}
            />
          ) : (
            <p className="text-small text-default-500">
              Cadastre um cartão em Cartões.
            </p>
          )}
          <Link href="/cartoes" className="text-primary text-small font-medium">
            Gerenciar cartões
          </Link>
        </CardBody>
      </Card>

      <section className="rounded-large border border-divider/50 bg-content1/30 p-4 dark:bg-content1/20">
        <h2 className="text-base font-semibold mb-3 text-foreground">Últimos lançamentos</h2>
        {recent.length === 0 ? (
          <p className="text-default-500 text-small">Nenhum lançamento ainda.</p>
        ) : (
          <ul className="space-y-3">
            {recent.map((t) => (
              <li
                key={t.id}
                className="flex justify-between gap-3 text-small border-b border-divider/60 last:border-0 pb-3 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{txLabel(t)}</p>
                  {t.description ? (
                    <p className="text-default-500 truncate">{t.description}</p>
                  ) : null}
                  <p className="text-default-400 text-xs">{t.date}</p>
                </div>
                <span
                  className={
                    t.type === "account_credit"
                      ? "text-success shrink-0 tabular-nums"
                      : "text-default-700 shrink-0 tabular-nums"
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
