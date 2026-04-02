/**
 * Entidades de domínio do Open Ledger (BRL único).
 * Mapeamento: colunas SQL snake_case ↔ propriedades camelCase.
 * Valores `numeric(12,2)` representados como string no cliente (evita float).
 */

export const APP_CURRENCY = 'BRL' as const;

export type MoneyAmount = string;

export type AccountType = 'checking' | 'savings' | 'cash' | 'investment';

export type TransactionType = 'income' | 'expense' | 'transfer';

export type ConnectionStatus = 'pending' | 'active' | 'error' | 'revoked';

export type ImportBatchStatus = 'running' | 'completed' | 'failed';

export type ExternalTransactionStatus = 'pending' | 'merged' | 'ignored' | 'duplicate';

export interface Profile {
  readonly id: string;
  displayName: string | null;
  readonly createdAt: string;
  updatedAt: string;
}

export interface Account {
  readonly id: string;
  readonly userId: string;
  name: string;
  type: AccountType;
  institution: string | null;
  /** Saldo inicial em BRL (numeric como string). */
  openingBalance: MoneyAmount;
  notes: string | null;
  archivedAt: string | null;
  readonly createdAt: string;
  updatedAt: string;
}

export interface CreditCard {
  readonly id: string;
  readonly userId: string;
  name: string;
  creditLimit: MoneyAmount;
  closingDay: number;
  dueDay: number;
  brand: string | null;
  institution: string | null;
  archivedAt: string | null;
  readonly createdAt: string;
  updatedAt: string;
}

export interface CreditCardCycle {
  readonly id: string;
  creditCardId: string;
  periodStart: string;
  periodEnd: string;
  readonly createdAt: string;
}

export interface Category {
  readonly id: string;
  readonly userId: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
  archivedAt: string | null;
  readonly createdAt: string;
  updatedAt: string;
}

export interface Tag {
  readonly id: string;
  readonly userId: string;
  name: string;
  readonly createdAt: string;
}

export interface TransactionTag {
  readonly transactionId: string;
  readonly tagId: string;
}

export interface Transaction {
  readonly id: string;
  readonly userId: string;
  type: TransactionType;
  amount: MoneyAmount;
  /** Data de competência (ISO date YYYY-MM-DD). */
  occurredAt: string;
  description: string | null;
  memo: string | null;
  categoryId: string | null;
  accountId: string | null;
  creditCardId: string | null;
  fromAccountId: string | null;
  toAccountId: string | null;
  parentTransactionId: string | null;
  installmentIndex: number | null;
  installmentTotal: number | null;
  isRecurring: boolean;
  recurrenceRule: string | null;
  readonly createdAt: string;
  updatedAt: string;
}

export interface TransactionInstallment {
  readonly id: string;
  rootTransactionId: string;
  sequence: number;
  dueDate: string;
  amount: MoneyAmount;
  readonly createdAt: string;
}

export interface Attachment {
  readonly id: string;
  readonly userId: string;
  transactionId: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  readonly createdAt: string;
}

export interface BankConnection {
  readonly id: string;
  readonly userId: string;
  provider: string;
  status: ConnectionStatus;
  externalConnectionId: string;
  metadata: Record<string, unknown>;
  lastSyncAt: string | null;
  readonly createdAt: string;
  updatedAt: string;
}

export interface ImportBatch {
  readonly id: string;
  readonly userId: string;
  bankConnectionId: string;
  status: ImportBatchStatus;
  startedAt: string;
  finishedAt: string | null;
  errorMessage: string | null;
}

export interface ExternalTransaction {
  readonly id: string;
  importBatchId: string;
  dedupeKey: string;
  rawPayload: Record<string, unknown>;
  matchedTransactionId: string | null;
  status: ExternalTransactionStatus;
  readonly createdAt: string;
}
