"use client";

import {
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from "firebase/firestore";

import type { CreditCard } from "@/lib/types";

import { cardsCollection } from "@/services/finance/shared/paths";

function subscribeCards(
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

async function addCreditCardDocument(
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

async function getCardUsedCents(
  uid: string,
  cardId: string
): Promise<number | null> {
  const ref = doc(cardsCollection(uid), cardId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return Number(snap.data().usedCents) || 0;
}

async function getCardSnapshot(
  uid: string,
  cardId: string
): Promise<{ usedCents: number; limitCents: number } | null> {
  const ref = doc(cardsCollection(uid), cardId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    usedCents: Number(d.usedCents) || 0,
    limitCents: Number(d.limitCents) || 0,
  };
}

async function removeCreditCardDocument(
  uid: string,
  cardId: string
): Promise<void> {
  await deleteDoc(doc(cardsCollection(uid), cardId));
}

export const cardsRepository = {
  subscribeCards,
  addCreditCardDocument,
  getCardUsedCents,
  getCardSnapshot,
  removeCreditCardDocument,
};