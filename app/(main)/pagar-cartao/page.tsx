"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Spinner,
} from "@heroui/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { useCards, useWallet } from "@/components/finance-data-provider";
import { compactInput, compactSelect } from "@/lib/heroui-density";
import { formatBRLFromCents, parseBRLToCents } from "@/lib/money";
import { payCardFromAccount } from "@/services/finance/finance-service";

export default function PagarCartaoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Spinner label="Carregando..." />
        </div>
      }
    >
      <PagarCartaoContent />
    </Suspense>
  );
}

function PagarCartaoContent() {
  const { user } = useAuth();
  const uid = user?.uid;
  const router = useRouter();
  const searchParams = useSearchParams();
  const preCartao = searchParams.get("cartao");

  const cards = useCards();
  const wallet = useWallet();
  const [cardId, setCardId] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (preCartao && cards.some((c) => c.id === preCartao)) {
      setCardId(preCartao);
    }
  }, [preCartao, cards]);

  const card = cards.find((c) => c.id === cardId);
  const maxPay =
    card && wallet
      ? Math.min(wallet.balanceCents, card.usedCents)
      : null;

  async function handlePay() {
    setError(null);
    const cents = parseBRLToCents(amountStr);
    if (cents == null || cents <= 0) {
      setError("Informe um valor válido.");
      return;
    }
    if (!cardId || !uid) {
      setError("Selecione um cartão.");
      return;
    }
    setSaving(true);
    try {
      await payCardFromAccount(
        uid,
        cardId,
        cents,
        date,
        desc || "Pagamento fatura"
      );
      router.push(`/cartoes/${cardId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível concluir o pagamento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Button as={Link} href="/cartoes" size="sm" variant="light" radius="lg" className="h-9 min-h-9 px-0">
        ← Cartões
      </Button>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Pagamento</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Pagar cartão com a conta</h1>
        <p className="text-small text-default-500 leading-relaxed">
          O valor sai do saldo em conta e reduz a fatura do cartão escolhido.
        </p>
      </div>

      <Card shadow="none" radius="lg" className="ol-card">
        <CardHeader>
          <span className="font-semibold text-foreground">Dados do pagamento</span>
        </CardHeader>
        <CardBody className="gap-4">
          {cards.length === 0 ? (
            <p className="text-small text-warning">
              Cadastre um cartão com fatura em aberto.
            </p>
          ) : (
            <>
              <Select
                label="Cartão"
                placeholder="Selecione"
                size="sm"
                selectedKeys={cardId ? new Set([cardId]) : new Set()}
                onSelectionChange={(keys) => {
                  const v = Array.from(keys)[0];
                  setCardId(v ? String(v) : "");
                }}
                classNames={compactSelect}
              >
                {cards.map((c) => (
                  <SelectItem key={c.id} textValue={c.name}>
                    {c.name} · fatura {formatBRLFromCents(c.usedCents)}
                  </SelectItem>
                ))}
              </Select>

              {wallet && card ? (
                <p className="text-small text-default-600">
                  Saldo em conta: {formatBRLFromCents(wallet.balanceCents)} · Máx. para
                  este pagamento: {formatBRLFromCents(maxPay ?? 0)}
                </p>
              ) : null}

              <Input
                type="date"
                label="Data"
                size="sm"
                value={date}
                onValueChange={setDate}
                classNames={compactInput}
              />
              <Input
                label="Valor (R$)"
                placeholder="0,00"
                size="sm"
                inputMode="decimal"
                value={amountStr}
                onValueChange={setAmountStr}
                classNames={compactInput}
              />
              <Input
                label="Descrição (opcional)"
                size="sm"
                value={desc}
                onValueChange={setDesc}
                classNames={compactInput}
              />
            </>
          )}

          {error ? (
            <p className="text-danger text-small" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            color="primary"
            size="md"
            radius="lg"
            className="h-10 min-h-10 w-full text-small font-semibold"
            isLoading={saving}
            isDisabled={cards.length === 0 || !cardId}
            onPress={() => void handlePay()}
          >
            Confirmar pagamento
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
