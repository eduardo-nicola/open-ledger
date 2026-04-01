"use client";

import { collection, doc } from "firebase/firestore";

import { getFirebaseDb } from "@/services/firebase/client";

export function walletRef(uid: string) {
  return doc(getFirebaseDb(), "users", uid, "wallet", "main");
}

export function cardsCollection(uid: string) {
  return collection(getFirebaseDb(), "users", uid, "cards");
}

export function transactionsCollection(uid: string) {
  return collection(getFirebaseDb(), "users", uid, "transactions");
}
