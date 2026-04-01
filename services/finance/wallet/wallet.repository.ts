"use client";

import { getDoc, onSnapshot, setDoc, type Unsubscribe } from "firebase/firestore";

import type { WalletDoc } from "@/lib/types";

import { walletRef } from "@/services/finance/shared/paths";

async function ensureWalletDocument(uid: string): Promise<void> {
  const ref = walletRef(uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      balanceCents: 0,
      updatedAt: Date.now(),
    });
  }
}

function subscribeWallet(
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

async function getWalletSnapshot(uid: string): Promise<WalletDoc | null> {
  const snap = await getDoc(walletRef(uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    balanceCents: Number(d.balanceCents) || 0,
    updatedAt: Number(d.updatedAt) || 0,
  };
}

export const walletRepository = {
  ensureWalletDocument,
  subscribeWallet,
  getWalletSnapshot,
};
