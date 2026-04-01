"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ensureWallet,
  subscribeCards,
  subscribeRecentTransactions,
  subscribeWallet,
} from "@/services/finance/finance-repository";
import type { CreditCard, Transaction, WalletDoc } from "@/lib/types";

/** Single Firestore listener limit for recent transactions (shared across routes). */
export const RECENT_TX_SYNC_LIMIT = 80;

type FinanceDataContextValue = {
  wallet: WalletDoc | null;
  cards: CreditCard[];
  transactions: Transaction[];
};

const FinanceDataContext = createContext<FinanceDataContextValue | null>(null);

export function FinanceDataProvider({
  uid,
  children,
}: {
  uid: string;
  children: React.ReactNode;
}) {
  const [wallet, setWallet] = useState<WalletDoc | null>(null);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const lastWalletKey = useRef("");
  const lastCardsKey = useRef("");
  const lastTxKey = useRef("");

  useEffect(() => {
    void ensureWallet(uid);
  }, [uid]);

  useEffect(() => {
    lastWalletKey.current = "";
    setWallet(null);
    return subscribeWallet(uid, (w) => {
      const key = w === null ? "null" : `${w.balanceCents}:${w.updatedAt}`;
      if (lastWalletKey.current === key) return;
      lastWalletKey.current = key;
      setWallet(w);
    });
  }, [uid]);

  useEffect(() => {
    lastCardsKey.current = "";
    setCards([]);
    return subscribeCards(uid, (list) => {
      const key = JSON.stringify(
        list.map((c) => [c.id, c.name, c.limitCents, c.usedCents, c.createdAt])
      );
      if (lastCardsKey.current === key) return;
      lastCardsKey.current = key;
      setCards(list);
    });
  }, [uid]);

  useEffect(() => {
    lastTxKey.current = "";
    setTransactions([]);
    return subscribeRecentTransactions(uid, RECENT_TX_SYNC_LIMIT, (list) => {
      const key = JSON.stringify(
        list.map((t) => [
          t.id,
          t.type,
          t.amountCents,
          t.date,
          t.description,
          t.creditCardId,
          t.createdAt,
        ])
      );
      if (lastTxKey.current === key) return;
      lastTxKey.current = key;
      setTransactions(list);
    });
  }, [uid]);

  const value = useMemo(
    () => ({ wallet, cards, transactions }),
    [wallet, cards, transactions]
  );

  return (
    <FinanceDataContext.Provider value={value}>
      {children}
    </FinanceDataContext.Provider>
  );
}

function useFinanceDataContext(): FinanceDataContextValue {
  const ctx = useContext(FinanceDataContext);
  if (!ctx) {
    throw new Error("Hooks de finanças devem ser usados dentro de FinanceDataProvider");
  }
  return ctx;
}

export function useWallet(): WalletDoc | null {
  return useFinanceDataContext().wallet;
}

export function useCards(): CreditCard[] {
  return useFinanceDataContext().cards;
}

export function useRecentTransactions(max: number): Transaction[] {
  const { transactions } = useFinanceDataContext();
  return useMemo(() => transactions.slice(0, max), [transactions, max]);
}

/**
 * Buffer partilhado de transações (até RECENT_TX_SYNC_LIMIT). Na página de detalhe do
 * cartão, só aparecem movimentos que caem nesta janela — não é histórico completo do cartão.
 */
export function useSyncedTransactions(): Transaction[] {
  return useFinanceDataContext().transactions;
}
