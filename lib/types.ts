export type TransactionType =
  | "expense_card"
  | "account_credit"
  | "account_debit"
  | "card_payment_from_account";

export interface CreditCard {
  id: string;
  name: string;
  limitCents: number;
  usedCents: number;
  createdAt: number;
}

export interface WalletDoc {
  balanceCents: number;
  updatedAt: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amountCents: number;
  date: string;
  description: string;
  creditCardId: string | null;
  createdAt: number;
}
