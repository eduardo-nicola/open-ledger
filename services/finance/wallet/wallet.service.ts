"use client";

import type { Unsubscribe } from "firebase/firestore";

import type { WalletDoc } from "@/lib/types";

import { cardsRepository } from "../cards/cards.repository";
import { ledgerRepository } from "../shared/ledger.repository";
import { walletRepository } from "./wallet.repository";

export async function ensureWallet(uid: string): Promise<void> {
  await walletRepository.ensureWalletDocument(uid);
}

export function subscribeWallet(
  uid: string,
  cb: (w: WalletDoc | null) => void
): Unsubscribe {
  return walletRepository.subscribeWallet(uid, cb);
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

export async function addAccountMovement(
  uid: string,
  kind: "account_credit" | "account_debit",
  amountCents: number,
  date: string,
  description: string
): Promise<void> {
  assertPositiveAmountCents(amountCents);
  assertNonEmptyDate(date);
  assertDescription(description);

  const wallet = await walletRepository.getWalletSnapshot(uid);
  if (!wallet) {
    throw new Error("Carteira não inicializada.");
  }
  if (kind === "account_debit") {
    if (wallet.balanceCents < amountCents) {
      throw new Error("Saldo em conta insuficiente.");
    }
  }

  await ledgerRepository.executeAddAccountMovement(
    uid,
    kind,
    amountCents,
    date.trim(),
    description.trim()
  );
}

export async function payCardFromAccount(
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

  const wallet = await walletRepository.getWalletSnapshot(uid);
  if (!wallet) {
    throw new Error("Carteira não encontrada.");
  }
  const card = await cardsRepository.getCardSnapshot(uid, cardId);
  if (!card) {
    throw new Error("Cartão não encontrado.");
  }
  if (amountCents > wallet.balanceCents) {
    throw new Error("Saldo em conta insuficiente.");
  }
  if (amountCents > card.usedCents) {
    throw new Error("Valor maior que a fatura do cartão.");
  }

  await ledgerRepository.executePayCardFromAccount(
    uid,
    cardId,
    amountCents,
    date.trim(),
    description.trim()
  );
}
