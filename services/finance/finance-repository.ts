"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { getFirebaseDb } from "@/services/firebase/client";
import type { CreditCard, Transaction, TransactionType, WalletDoc } from "@/lib/types";

function walletRef(uid: string) {
  return doc(getFirebaseDb(), "users", uid, "wallet", "main");
}

function cardsCollection(uid: string) {
  return collection(getFirebaseDb(), "users", uid, "cards");
}

function transactionsCollection(uid: string) {
  return collection(getFirebaseDb(), "users", uid, "transactions");
}

export async function ensureWallet(uid: string): Promise<void> {
  const ref = walletRef(uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      balanceCents: 0,
      updatedAt: Date.now(),
    });
  }
}

export function subscribeWallet(
  uid: string,
  cb: (w: WalletDoc | null) => void
): Unsubscribe {
  const ref = walletRef(uid);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      cb(null);
      return;
    }
    const d = snap.data();
    cb({
      balanceCents: Number(d.balanceCents) || 0,
      updatedAt: Number(d.updatedAt) || 0,
    });
  });
}

export function subscribeCards(
  uid: string,
  cb: (cards: CreditCard[]) => void
): Unsubscribe {
  const q = query(cardsCollection(uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const list: CreditCard[] = [];
    snap.forEach((s) => {
      const d = s.data();
      list.push({
        id: s.id,
        name: String(d.name ?? ""),
        limitCents: Number(d.limitCents) || 0,
        usedCents: Number(d.usedCents) || 0,
        createdAt: Number(d.createdAt) || 0,
      });
    });
    cb(list);
  });
}

export function subscribeRecentTransactions(
  uid: string,
  max: number,
  cb: (tx: Transaction[]) => void
): Unsubscribe {
  const q = query(
    transactionsCollection(uid),
    orderBy("createdAt", "desc"),
    limit(max)
  );
  return onSnapshot(q, (snap) => {
    const list: Transaction[] = [];
    snap.forEach((s) => {
      const d = s.data();
      list.push({
        id: s.id,
        type: d.type as TransactionType,
        amountCents: Number(d.amountCents) || 0,
        date: String(d.date ?? ""),
        description: String(d.description ?? ""),
        creditCardId: d.creditCardId != null ? String(d.creditCardId) : null,
        createdAt: Number(d.createdAt) || 0,
      });
    });
    cb(list);
  });
}

export async function addCreditCardDocument(
  uid: string,
  name: string,
  limitCents: number
): Promise<void> {
  await addDoc(cardsCollection(uid), {
    name,
    limitCents,
    usedCents: 0,
    createdAt: Date.now(),
  });
}

export async function getCardUsedCents(
  uid: string,
  cardId: string
): Promise<number | null> {
  const ref = doc(cardsCollection(uid), cardId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return Number(snap.data().usedCents) || 0;
}

export async function removeCreditCardDocument(
  uid: string,
  cardId: string
): Promise<void> {
  await deleteDoc(doc(cardsCollection(uid), cardId));
}

export async function addExpenseOnCard(
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

export async function addAccountMovement(
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

export async function payCardFromAccount(
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
