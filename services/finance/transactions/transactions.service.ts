"use client";

import type { Unsubscribe } from "firebase/firestore";

import type { Transaction } from "@/lib/types";

import { transactionsRepository } from "./transactions.repository";

export function subscribeRecentTransactions(
  uid: string,
  max: number,
  cb: (tx: Transaction[]) => void
): Unsubscribe {
  return transactionsRepository.subscribeRecentTransactions(uid, max, cb);
}
