"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Progress,
  useDisclosure,
} from "@heroui/react";
import Link from "next/link";
import { useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { useCards } from "@/components/finance-data-provider";
import { formatBRLFromCents, parseBRLToCents } from "@/lib/money";
import { createCreditCard, deleteCreditCard } from "@/services/finance/finance-service";

export default function CartoesPage() {
  const { user } = useAuth();
  const uid = user?.uid;
  const cards = useCards();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [name, setName] = useState("");
  const [limitStr, setLimitStr] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleCreate(onClose: () => void) {
    setError(null);
    const limitCents = parseBRLToCents(limitStr);
    if (!name.trim()) {
      setError("Informe o nome do cartão.");
      return;
    }
    if (limitCents == null || limitCents <= 0) {
      setError("Informe um limite válido.");
      return;
    }
    if (!uid) return;
    setSaving(true);
    try {
      await createCreditCard(uid, name.trim(), limitCents);
      setName("");
      setLimitStr("");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar cartão.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!uid) return;
    if (!confirm("Excluir este cartão?")) return;
    try {
      await deleteCreditCard(uid, id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao excluir.");
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-start gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Crédito
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Cartões</h1>
        </div>
        <Button color="primary" size="sm" radius="lg" onPress={onOpen} className="min-h-11 shrink-0 font-semibold">
          Novo cartão
        </Button>
      </header>

      {cards.length === 0 ? (
        <p className="text-default-500 text-small">
          Nenhum cartão cadastrado. Toque em &quot;Novo cartão&quot; para começar.
        </p>
      ) : (
        <ul className="space-y-3">
          {cards.map((c) => {
            const pct =
              c.limitCents > 0
                ? Math.min(100, (c.usedCents / c.limitCents) * 100)
                : 0;
            return (
              <li key={c.id}>
                <Card shadow="none" radius="lg" className="glass-card w-full">
                  <CardHeader className="flex flex-col items-stretch gap-2 pb-0">
                    <div className="flex justify-between gap-2 items-start">
                      <Link
                        href={`/cartoes/${c.id}`}
                        className="font-semibold text-primary flex-1 min-w-0"
                      >
                        {c.name}
                      </Link>
                      <Button
                        size="sm"
                        variant="light"
                        color="danger"
                        className="min-h-9 shrink-0"
                        onPress={() => void handleDelete(c.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                    <div className="text-small text-default-600 tabular-nums">
                      Fatura: {formatBRLFromCents(c.usedCents)} / limite{" "}
                      {formatBRLFromCents(c.limitCents)}
                    </div>
                    <Progress
                      aria-label={`Uso do cartão ${c.name}`}
                      size="sm"
                      value={pct}
                      color={pct > 90 ? "danger" : "primary"}
                    />
                  </CardHeader>
                  <CardBody className="flex flex-row flex-wrap gap-2 pt-2">
                    <Button
                      as={Link}
                      href={`/lancamento?cartao=${c.id}`}
                      size="sm"
                      variant="flat"
                      className="min-h-10"
                    >
                      Despesa
                    </Button>
                    <Button
                      as={Link}
                      href={`/pagar-cartao?cartao=${c.id}`}
                      size="sm"
                      variant="flat"
                      color="secondary"
                      className="min-h-10"
                    >
                      Pagar com conta
                    </Button>
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" backdrop="blur">
        <ModalContent className="border border-divider/60">
          {(onClose) => (
            <>
              <ModalHeader className="text-lg font-semibold">Novo cartão</ModalHeader>
              <ModalBody className="gap-3">
                {error ? (
                  <p className="text-danger text-small" role="alert">
                    {error}
                  </p>
                ) : null}
                <Input
                  label="Nome"
                  placeholder="Ex.: Nubank"
                  value={name}
                  onValueChange={setName}
                  autoFocus
                />
                <Input
                  label="Limite (R$)"
                  placeholder="0,00"
                  inputMode="decimal"
                  value={limitStr}
                  onValueChange={setLimitStr}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  isLoading={saving}
                  onPress={() => void handleCreate(onClose)}
                >
                  Salvar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
