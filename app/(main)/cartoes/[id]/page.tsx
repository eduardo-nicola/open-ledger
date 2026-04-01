"use client";

import { Button, Card, CardBody, CardHeader, Progress, Spinner } from "@heroui/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";

import {
  RECENT_TX_SYNC_LIMIT,
  useCards,
  useSyncedTransactions,
} from "@/components/finance-data-provider";
import { formatBRLFromCents } from "@/lib/money";
import type { Transaction } from "@/lib/types";

function txTitle(t: Transaction): string {
  switch (t.type) {
    case "expense_card":
      return "Despesa";
    case "card_payment_from_account":
      return "Pagamento (conta)";
    default:
      return t.type;
  }
}

export default function CartaoDetalhePage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const cards = useCards();
  const syncedTx = useSyncedTransactions();

  const card = cards.find((c) => c.id === id);

  /** Só movimentos deste cartão presentes no buffer global (últimos N por createdAt). */
  const txs = useMemo(
    () =>
      syncedTx.filter(
        (t) =>
          t.creditCardId === id &&
          (t.type === "expense_card" || t.type === "card_payment_from_account")
      ),
    [syncedTx, id]
  );

  if (!card && cards.length > 0) {
    return (
      <div className="space-y-4">
        <p className="text-default-500">Cartão não encontrado.</p>
        <Button as={Link} href="/cartoes" color="primary" variant="flat">
          Voltar
        </Button>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex justify-center py-12">
        <Spinner label="Carregando..." />
      </div>
    );
  }

  const pct =
    card.limitCents > 0
      ? Math.min(100, (card.usedCents / card.limitCents) * 100)
      : 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Button as={Link} href="/cartoes" size="sm" variant="light" className="h-9 min-h-9">
          ← Cartões
        </Button>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Cartão</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{card.name}</h1>
      </div>

      <Card shadow="none" radius="lg" className="ol-card">
        <CardHeader className="flex flex-col items-start gap-2">
          <span className="text-small text-default-500">Fatura atual</span>
          <span className="text-2xl font-semibold tabular-nums">
            {formatBRLFromCents(card.usedCents)}
          </span>
          <span className="text-small text-default-600">
            Limite {formatBRLFromCents(card.limitCents)} · Disponível{" "}
            {formatBRLFromCents(Math.max(0, card.limitCents - card.usedCents))}
          </span>
          <Progress
            aria-label="Uso do limite"
            value={pct}
            color={pct > 90 ? "danger" : "primary"}
          />
        </CardHeader>
        <CardBody className="flex flex-row flex-wrap gap-2">
          <Button
            as={Link}
            href={`/lancamento?cartao=${card.id}`}
            color="primary"
            size="md"
            className="h-9 min-h-9"
          >
            Nova despesa
          </Button>
          <Button
            as={Link}
            href={`/pagar-cartao?cartao=${card.id}`}
            color="secondary"
            variant="flat"
            size="md"
            className="h-9 min-h-9"
          >
            Pagar com saldo em conta
          </Button>
        </CardBody>
      </Card>

      <section>
        <h2 className="text-lg font-medium mb-1">Lançamentos do cartão</h2>
        <p className="text-xs text-default-500 mb-2">
          Lista limitada aos últimos {RECENT_TX_SYNC_LIMIT} lançamentos globais; entradas mais
          antigas deste cartão podem não aparecer aqui.
        </p>
        {txs.length === 0 ? (
          <p className="text-small text-default-500">Sem lançamentos nesta janela.</p>
        ) : (
          <ul className="space-y-2">
            {txs.map((t) => (
              <li
                key={t.id}
                className="flex justify-between gap-2 text-small border-b border-divider pb-2"
              >
                <div>
                  <p className="font-medium">{txTitle(t)}</p>
                  {t.description ? (
                    <p className="text-default-500">{t.description}</p>
                  ) : null}
                  <p className="text-xs text-default-400">{t.date}</p>
                </div>
                <span className="tabular-nums shrink-0">
                  {t.type === "card_payment_from_account" ? "−" : "−"}
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
