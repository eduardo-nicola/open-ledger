"use client";

import { doc, runTransaction, serverTimestamp } from "firebase/firestore";

import { getFirebaseDb } from "@/services/firebase/client";

import { cardsCollection, transactionsCollection, walletRef } from "./paths";

async function executeAddExpenseOnCard(
  uid: string,
  cardId: string,
  amountCents: number,
  date: string,
  description: string
): Promise<void> {
  const cardRef = doc(cardsCollection(uid), cardId);
  const txCol = transactionsCollection(uid);

  await runTransaction(getFirebaseDb(), async (trx) => {
    const cardSnap = await trx.get(cardRef);
    if (!cardSnap.exists()) throw new Error("Cartão não encontrado.");
    const used = Number(cardSnap.data().usedCents) || 0;
    const lim = Number(cardSnap.data().limitCents) || 0;
    if (used + amountCents > lim) {
      throw new Error("Despesa ultrapassa o limite disponível no cartão.");
    }
    trx.update(cardRef, { usedCents: used + amountCents });
    const txRef = doc(txCol);
    trx.set(txRef, {
      type: "expense_card",
      amountCents,
      date,
      description: description.trim(),
      creditCardId: cardId,
      createdAt: Date.now(),
      userId: uid,
      createdAtServer: serverTimestamp(),
    });
  });
}

async function executeAddAccountMovement(
  uid: string,
  kind: "account_credit" | "account_debit",
  amountCents: number,
  date: string,
  description: string
): Promise<void> {
  const wRef = walletRef(uid);
  const txCol = transactionsCollection(uid);

  await runTransaction(getFirebaseDb(), async (trx) => {
    const wSnap = await trx.get(wRef);
    if (!wSnap.exists()) {
      throw new Error("Carteira não inicializada.");
    }
    const bal = Number(wSnap.data().balanceCents) || 0;
    const next =
      kind === "account_credit" ? bal + amountCents : bal - amountCents;
    if (next < 0) throw new Error("Saldo em conta insuficiente.");
    trx.update(wRef, { balanceCents: next, updatedAt: Date.now() });
    const txRef = doc(txCol);
    trx.set(txRef, {
      type: kind,
      amountCents,
      date,
      description: description.trim(),
      creditCardId: null,
      createdAt: Date.now(),
      userId: uid,
      createdAtServer: serverTimestamp(),
    });
  });
}

async function executePayCardFromAccount(
  uid: string,
  cardId: string,
  amountCents: number,
  date: string,
  description: string
): Promise<void> {
  const wRef = walletRef(uid);
  const cardRef = doc(cardsCollection(uid), cardId);
  const txCol = transactionsCollection(uid);

  await runTransaction(getFirebaseDb(), async (trx) => {
    const wSnap = await trx.get(wRef);
    const cSnap = await trx.get(cardRef);
    if (!wSnap.exists()) throw new Error("Carteira não encontrada.");
    if (!cSnap.exists()) throw new Error("Cartão não encontrado.");
    const bal = Number(wSnap.data().balanceCents) || 0;
    const used = Number(cSnap.data().usedCents) || 0;
    if (amountCents > bal) throw new Error("Saldo em conta insuficiente.");
    if (amountCents > used) throw new Error("Valor maior que a fatura do cartão.");
    trx.update(wRef, {
      balanceCents: bal - amountCents,
      updatedAt: Date.now(),
    });
    trx.update(cardRef, { usedCents: used - amountCents });
    const txRef = doc(txCol);
    trx.set(txRef, {
      type: "card_payment_from_account",
      amountCents,
      date,
      description: description.trim(),
      creditCardId: cardId,
      createdAt: Date.now(),
      userId: uid,
      createdAtServer: serverTimestamp(),
    });
  });
}

export const ledgerRepository = {
  executeAddExpenseOnCard,
  executeAddAccountMovement,
  executePayCardFromAccount,
};
