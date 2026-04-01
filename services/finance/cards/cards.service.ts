"use client";

import type { Unsubscribe } from "firebase/firestore";

import type { CreditCard } from "@/lib/types";

import { ledgerRepository } from "../shared/ledger.repository";
import { cardsRepository } from "./cards.repository";

export function subscribeCards(
  uid: string,
  cb: (cards: CreditCard[]) => void
): Unsubscribe {
  return cardsRepository.subscribeCards(uid, cb);
}

export async function createCreditCard(
  uid: string,
  name: string,
  limitCents: number
): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Informe o nome do cartão.");
  }
  if (limitCents <= 0) {
    throw new Error("Informe um limite válido.");
  }
  await cardsRepository.addCreditCardDocument(uid, trimmed, limitCents);
}

export async function deleteCreditCard(
  uid: string,
  cardId: string
): Promise<void> {
  const used = await cardsRepository.getCardUsedCents(uid, cardId);
  if (used === null) return;
  if (used > 0) {
    throw new Error("Não é possível excluir cartão com fatura em aberto.");
  }
  await cardsRepository.removeCreditCardDocument(uid, cardId);
}

function assertPositiveAmountCents(amountCents: number): void {
  if (amountCents <= 0) {
    throw new Error("Informe um valor maior que zero.");
  }
}

function assertNonEmptyDate(date: string): void {
  if (!date.trim()) {
    throw new Error("Informe a data.");
  }
}

function assertDescription(description: string): void {
  if (!description.trim()) {
    throw new Error("Informe a descrição.");
  }
}

export async function addExpenseOnCard(
  uid: string,
  cardId: string,
  amountCents: number,
  date: string,
  description: string
): Promise<void> {
  assertPositiveAmountCents(amountCents);
  assertNonEmptyDate(date);
  assertDescription(description);
  if (!cardId.trim()) {
    throw new Error("Selecione um cartão.");
  }

  const card = await cardsRepository.getCardSnapshot(uid, cardId);
  if (!card) {
    throw new Error("Cartão não encontrado.");
  }
  if (card.usedCents + amountCents > card.limitCents) {
    throw new Error("Despesa ultrapassa o limite disponível no cartão.");
  }

  await ledgerRepository.executeAddExpenseOnCard(
    uid,
    cardId,
    amountCents,
    date.trim(),
    description.trim()
  );
}
