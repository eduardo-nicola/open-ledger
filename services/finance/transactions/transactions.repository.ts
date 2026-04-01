"use client";

import { limit, onSnapshot, orderBy, query, type Unsubscribe } from "firebase/firestore";

import type { Transaction, TransactionType } from "@/lib/types";

import { transactionsCollection } from "@/services/finance/shared/paths";

function subscribeRecentTransactions(
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

export const transactionsRepository = {
  subscribeRecentTransactions,
};
