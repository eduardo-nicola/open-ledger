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
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { useCards } from "@/components/finance-data-provider";
import { compactInput, compactSelect } from "@/lib/heroui-density";
import { formatBRLFromCents, parseBRLToCents } from "@/lib/money";
import {
  addAccountMovement,
  addExpenseOnCard,
} from "@/services/finance";

type LancamentoTipo = "expense_card" | "account_credit" | "account_debit";

export default function LancamentoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Spinner label="Carregando..." />
        </div>
      }
    >
      <LancamentoContent />
    </Suspense>
  );
}

function LancamentoContent() {
  const { user } = useAuth();
  const uid = user?.uid;
  const router = useRouter();
  const searchParams = useSearchParams();
  const preCartao = searchParams.get("cartao");

  const cards = useCards();
  const [tipo, setTipo] = useState<LancamentoTipo>("expense_card");
  const [cardId, setCardId] = useState<string>("");
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
      setTipo("expense_card");
    }
  }, [preCartao, cards]);

  async function handleSubmit() {
    setError(null);
    const cents = parseBRLToCents(amountStr);
    if (cents == null || cents <= 0) {
      setError("Informe um valor válido.");
      return;
    }
    if (!uid) return;

    setSaving(true);
    try {
      if (tipo === "expense_card") {
        if (!cardId) {
          setError("Selecione um cartão.");
          setSaving(false);
          return;
        }
        await addExpenseOnCard(uid, cardId, cents, date, desc);
        router.push(`/cartoes/${cardId}`);
        return;
      }
      await addAccountMovement(
        uid,
        tipo === "account_credit" ? "account_credit" : "account_debit",
        cents,
        date,
        desc || "—"
      );
      router.push("/conta");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Movimentação</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Novo lançamento</h1>
      </div>

      <Card shadow="none" radius="lg" className="ol-card">
        <CardHeader>
          <span className="text-small text-default-500 font-medium">
            Tipo de lançamento
          </span>
        </CardHeader>
        <CardBody className="gap-4">
          <Select
            label="Tipo"
            size="sm"
            selectedKeys={new Set([tipo])}
            onSelectionChange={(keys) => {
              const v = Array.from(keys)[0];
              if (v === "expense_card" || v === "account_credit" || v === "account_debit") {
                setTipo(v);
              }
            }}
            classNames={compactSelect}
          >
            <SelectItem key="expense_card">Despesa no cartão</SelectItem>
            <SelectItem key="account_credit">Entrada na conta</SelectItem>
            <SelectItem key="account_debit">Saída da conta</SelectItem>
          </Select>

          {tipo === "expense_card" ? (
            cards.length === 0 ? (
              <p className="text-small text-warning">
                Cadastre um cartão antes de lançar despesas.
              </p>
            ) : (
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
                  <SelectItem
                    key={c.id}
                    textValue={c.name}
                  >
                    {c.name} · disp.{" "}
                    {formatBRLFromCents(Math.max(0, c.limitCents - c.usedCents))}
                  </SelectItem>
                ))}
              </Select>
            )
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
            isDisabled={tipo === "expense_card" && cards.length === 0}
            onPress={() => void handleSubmit()}
          >
            Salvar
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
