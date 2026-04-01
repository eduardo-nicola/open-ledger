"use client";

import {
  addCreditCardDocument,
  addAccountMovement as repoAddAccountMovement,
  addExpenseOnCard as repoAddExpenseOnCard,
  getCardUsedCents,
  payCardFromAccount as repoPayCardFromAccount,
  removeCreditCardDocument,
} from "@/services/finance/finance-repository";

export { ensureWallet } from "@/services/finance/finance-repository";
export {
  subscribeCards,
  subscribeRecentTransactions,
  subscribeWallet,
} from "@/services/finance/finance-repository";

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
  await addCreditCardDocument(uid, trimmed, limitCents);
}

export async function deleteCreditCard(uid: string, cardId: string): Promise<void> {
  const used = await getCardUsedCents(uid, cardId);
  if (used === null) return;
  if (used > 0) {
    throw new Error("Não é possível excluir cartão com fatura em aberto.");
  }
  await removeCreditCardDocument(uid, cardId);
}

export async function addExpenseOnCard(
  uid: string,
  cardId: string,
  amountCents: number,
  date: string,
  description: string
): Promise<void> {
  await repoAddExpenseOnCard(uid, cardId, amountCents, date, description);
}

export async function addAccountMovement(
  uid: string,
  kind: "account_credit" | "account_debit",
  amountCents: number,
  date: string,
  description: string
): Promise<void> {
  await repoAddAccountMovement(uid, kind, amountCents, date, description);
}

export async function payCardFromAccount(
  uid: string,
  cardId: string,
  amountCents: number,
  date: string,
  description: string
): Promise<void> {
  await repoPayCardFromAccount(uid, cardId, amountCents, date, description);
}
