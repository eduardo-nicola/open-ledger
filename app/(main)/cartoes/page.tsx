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
        <Button color="primary" size="md" radius="lg" onPress={onOpen} className="h-9 min-h-9 shrink-0 px-3 text-small font-semibold">
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
                <Card shadow="none" radius="lg" className="ol-card w-full">
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
                        className="h-8 min-h-8 shrink-0 px-2"
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
                      size="md"
                      variant="flat"
                      className="h-9 min-h-9"
                    >
                      Despesa
                    </Button>
                    <Button
                      as={Link}
                      href={`/pagar-cartao?cartao=${c.id}`}
                      size="md"
                      variant="flat"
                      color="secondary"
                      className="h-9 min-h-9"
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

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="bottom-center"
        backdrop="blur"
        scrollBehavior="inside"
        /* `full` força !rounded-none no tema — quebra o sheet */
        size="5xl"
        classNames={{
          /* Tema padrão usa items-end sm:items-center — isso sobe o sheet no desktop */
          wrapper: "!items-end justify-center px-0 sm:!items-end",
          base:
            "ol-card ol-modal-sheet !mx-0 !mb-0 !mt-0 !max-h-[min(88dvh,100%)] !min-h-0 !h-auto w-full !max-w-[min(100%,430px)] !rounded-b-none !rounded-t-[1.75rem] border-x-0 border-b-0 !p-0 overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/10 sm:!mx-0 sm:!my-0",
          header: "flex flex-col gap-0 border-b-0 p-0",
          body: "gap-5 px-5 pb-4 pt-6",
          footer:
            "flex flex-row gap-2 border-t border-divider/50 px-5 py-4 justify-stretch pb-[max(1rem,env(safe-area-inset-bottom))]",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col p-0">
                <div className="flex justify-center pt-3 pb-2" aria-hidden>
                  <span className="h-1.5 w-11 rounded-full bg-default-400/80 dark:bg-default-500" />
                </div>
                <h2 className="px-5 pb-3 text-base font-semibold leading-snug text-foreground">
                  Novo cartão
                </h2>
                <div
                  className="mx-5 shrink-0 border-b border-divider/60"
                  role="separator"
                  aria-hidden
                />
              </ModalHeader>
              <ModalBody>
                {error ? (
                  <p className="text-danger text-small" role="alert">
                    {error}
                  </p>
                ) : null}
                <Input
                  label="Nome"
                  placeholder="Ex.: Nubank"
                  labelPlacement="outside"
                  size="md"
                  variant="bordered"
                  value={name}
                  onValueChange={setName}
                  autoFocus
                  classNames={{
                    base: "gap-2",
                    label: "text-small font-medium text-foreground-600",
                    mainWrapper: "gap-2",
                    inputWrapper: "min-h-10",
                  }}
                />
                <Input
                  label="Limite (R$)"
                  placeholder="0,00"
                  labelPlacement="outside"
                  size="md"
                  variant="bordered"
                  inputMode="decimal"
                  value={limitStr}
                  onValueChange={setLimitStr}
                  classNames={{
                    base: "gap-2",
                    label: "text-small font-medium text-foreground-600",
                    mainWrapper: "gap-2",
                    inputWrapper: "min-h-10",
                  }}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" size="md" className="flex-1" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  size="md"
                  className="flex-1 font-semibold"
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
