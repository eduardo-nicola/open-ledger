# Pitfalls Research — OPEN-LEDGER

**Domain:** Personal Finance Manager (self-hosted, Brazilian users)
**Researched:** 2026-04-15
**Confidence:** HIGH (multiple verified sources, corroborated by real-world incidents)

---

## Financial Calculation Pitfalls

### Pitfall 1: Floating-Point Arithmetic with Monetary Values

**What goes wrong:**
JavaScript's IEEE 754 double-precision floats cannot represent most decimal fractions exactly. `0.1 + 0.2 === 0.30000000000000004` — not `0.3`. This cascades silently across thousands of transactions, producing balances that are off by fractions of centavos. The SunTrust bank incident (2009) cost $12 million; Knight Capital Group lost $500 million from currency mishandling bugs.

**Why it happens:**
Developers store monetary values as `DECIMAL` or `FLOAT` in Postgres and pass them through JavaScript as `number`. Both layers introduce rounding error independently.

**Consequences:**
- Consolidated balance shows R$1.999,99 instead of R$2.000,00
- Recurring calculation drift: small errors accumulate over months
- Import reconciliation mismatches

**Prevention:**
- Store all monetary values as integers (centavos) in Postgres: `INTEGER` or `BIGINT`, never `NUMERIC/DECIMAL` passed directly to JS math
- All arithmetic on the application layer must use integer math or a library like `dinero.js` or `decimal.js`
- Convert to display format (`R$ X.XXX,XX`) only at rendering time
- If using `NUMERIC` in Postgres (preferred for readability), always aggregate/sum inside SQL; never fetch raw rows and sum in JS

**Warning signs:**
- Any `.toFixed()` call doing financial arithmetic (not just display)
- Storing `amount: 10.50` in JS and doing `amount * 12`
- Balance that ends in `.99` when it "should" be round

**Detection:** Write a unit test: `assert(sumTransactions([10.01, 10.01, 10.01]) === 30.03)`

---

### Pitfall 2: Installment Split Rounding (Parcela com centavo perdido)

**What goes wrong:**
R$100 / 3 parcelas = R$33.33 + R$33.33 + R$33.33 = R$99.99. The R$0.01 disappears. This silently makes the sum of installments differ from the original purchase value, causing reconciliation errors.

**Why it happens:**
Naive `Math.round(total / n)` on every installment. Brazilian banking practice is to put the remainder on the **first** installment (not the last, contrary to some international norms).

**Consequences:**
- Sum of all parcelas ≠ original transaction amount
- Fatura total doesn't match purchase total
- User confusion when reviewing statements

**Prevention:**
```
installments[0].amount = total - (Math.round(total / n) * (n - 1))
installments[1..n].amount = Math.round(total / n)
```
Always validate: `assert(sum(installments) === originalAmount)`

**Warning signs:**
- `installments.reduce((acc, i) => acc + i.amount, 0) !== original.amount`

---

### Pitfall 3: Running Balance — Compute vs Store

**What goes wrong:**
Two common failure modes:
1. **Store running balance eagerly**: Any mid-sequence edit (delete, backdate) requires recalculating all subsequent rows — O(n) updates on every mutation.
2. **Compute on every render**: Window function `SUM() OVER (ORDER BY date)` across 5.000+ transactions causes extreme slowness (documented production incident in Actual Budget, July 2025).

**Prevention:**
- **Do NOT store running balance as a column** on the transactions table in v1
- **Do NOT compute per-row running balance on transaction list renders**
- **DO compute account balance as a single aggregate**: `SELECT SUM(amount) FROM transactions WHERE account_id = $1 AND paid = true`
- Display running balance only on detail/export views, computed lazily with a window function scoped to a date range
- Add a `balance_cache` on the `accounts` table, updated via trigger or Server Action — source of truth is always the aggregate

---

## Credit Card & Installment Pitfalls

### Pitfall 4: Invoice Period Boundary — Closing Date Ambiguity

**What goes wrong:**
If the closing date (fechamento) is day 5, does a transaction on June 5th belong to the June or July invoice? Different Brazilian banks handle this differently (some include the closing day in the current invoice, others in the next). A wrong assumption means transactions appear in the wrong fatura.

**Why it happens:**
Developers pick one rule without documenting it and the edge case only surfaces on the exact closing day.

**Consequences:**
- Transaction appears in wrong fatura
- Fatura balance is wrong; user disputes it
- Double-counting when two faturas overlap

**Prevention:**
- Document and expose the rule per card: "closing date transactions go to NEXT invoice" (most common in Brazil)
- Invoice period rule: `transaction_date < closing_date` → current invoice; `transaction_date >= closing_date` → next invoice
- Write a dedicated test for transaction on exactly `closing_date`, `closing_date - 1`, and `closing_date + 1`

**Warning signs:**
- No test for the exact closing date boundary

---

### Pitfall 5: Closing Date on Day 29, 30, 31 (Month Boundary)

**What goes wrong:**
A card configured with closing_day = 31. February has 28/29 days. What is the closing date of February? Naive `new Date(year, month, 31)` wraps to March 2nd or 3rd, silently including March transactions in the February invoice.

**Prevention:**
```typescript
function getClosingDate(year: number, month: number, closingDay: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate()
  return new Date(year, month, Math.min(closingDay, lastDay))
}
```
- Store `closing_day` as an integer (1–31), never a date
- Compute actual closing date dynamically, clamped to month length

**Warning signs:**
- Storing the closing date as a `DATE` column that gets updated monthly

---

### Pitfall 6: Installment Cascade — Delete/Edit Semantics

**What goes wrong:**
User buys something in 6 parcelas. 3 months later they realize the amount was wrong and try to edit it. Or they want to delete one installment (returned item). Without clear cascade rules, the system is inconsistent: one installment is deleted but the others remain, or the amount is updated on one but not propagated.

**Why it happens:**
Cascade rules are not decided at modeling time. The UI exposes "edit this installment" and "edit all installments" without clear data model support.

**Consequences:**
- Orphaned `installment_group` with inconsistent amounts
- Sum of remaining installments no longer matches purchase value
- User cannot tell what the original purchase was

**Prevention:**
- Model installments as a group with a parent entity: `installment_groups` (stores original total, n, remaining) and `transactions` (each installment row)
- Define 3 explicit operations and expose them in UI:
  1. **Delete this installment only** — marks one as deleted (e.g., partial return)
  2. **Delete all remaining installments** — cancel the purchase going forward
  3. **Delete entire purchase** — removes all installments (soft delete, keep audit trail)
- Editing value: only allowed on individual installment, with a warning if it breaks the group total invariant

**Warning signs:**
- No `installment_group_id` foreign key on transactions
- "Delete" button with no cascade options

---

### Pitfall 7: Credit Card Payment Double-Counting

**What goes wrong:**
User pays the fatura using their bank account balance. The app records:
1. A debit on the bank account (outflow) ✓
2. The fatura is marked as paid ✓

But the app also shows the original credit card transactions as expenses. The card payment itself must NOT be counted as an additional expense — it's a transfer, not spending. Counting it as an expense means all credit card spending is double-counted: once when the purchases happen, once when the fatura is paid.

**Prevention:**
- Credit card transactions are expenses at the time of purchase (deducted from "expenses this month")
- The fatura payment is a **transfer** between accounts (bank → card), not an expense
- Mark fatura payment transactions with `type: 'invoice_payment'` and exclude them from expense totals
- Dashboard must sum expenses by transaction type, never by account movement blindly

**Warning signs:**
- "Expenses this month" includes the fatura payment amount

---

## Data Import Pitfalls

### Pitfall 8: Brazilian Bank CSV/OFX Encoding (Windows-1252)

**What goes wrong:**
Virtually all Brazilian bank exports (Bradesco, Itaú, Santander, Nubank legacy, Sicoob) use Windows-1252 or ISO-8859-1 encoding. Reading these files as UTF-8 corrupts Portuguese characters: "Cartão" becomes "Cart\xE3o", "Pagamento" may render fine, but "Transferência" becomes garbage. Worse, the OFX standard header declares `CHARSET:1252` but parsers silently ignore it and decode as UTF-8.

**Prevention:**
- Always auto-detect encoding using `chardet` or `iconv-lite` before parsing
- Default fallback: `windows-1252` (not UTF-8) for undetected Brazilian bank files
- Use `parseBuffer()` (binary input) instead of `parseString()` for OFX — per `@f-o-t/ofx` library docs
- Test fixtures: include actual exported files from Bradesco, Itaú, and Nubank in the test suite

**Warning signs:**
- `fs.readFileSync(path, 'utf8')` without encoding detection
- Garbled `ã`, `ç`, `é` characters in imported descriptions

---

### Pitfall 9: CSV Format Fragmentation Per Bank

**What goes wrong:**
Every Brazilian bank has a different CSV layout. Nubank uses `date,title,amount`. Itaú uses `Data,Histórico,Docto.,Crédito (R$),Débito (R$),Saldo (R$)` with two amount columns. Bradesco has 5 header rows before data starts. Caixa uses semicolons as delimiters. An importer that handles one breaks on all others.

**Consequences:**
- Dates in wrong column → all transactions get wrong date
- Amount sign inverted → all expenses show as income
- Extra header rows → first rows parsed as transactions with garbage data

**Prevention:**
- Design a **bank profile** system: each bank has a parser config (delimiter, column map, skip-rows, encoding, date format, amount-sign-convention)
- Do not attempt a universal auto-detect parser — it will fail on edge cases
- Ship with profiles for: Nubank, Itaú, Bradesco, Santander, Inter, C6, XP
- Validate after parse: reject imports where >10% of rows have invalid dates or amounts

---

### Pitfall 10: Duplicate Transaction Import

**What goes wrong:**
User imports January statement, then imports it again (or imports an overlapping period). Without deduplication, all transactions are doubled.

**Why it happens:**
OFX has `FITID` (Financial Institution Transaction ID) — unique per bank. But Brazilian bank OFX files often generate `FITID` as a sequential counter that resets monthly, making it only unique within a single export file, not globally.

CSV files have no identifier at all.

**Prevention:**
- Compute a deterministic fingerprint per transaction: `SHA256(account_id + date + amount + description)` — use as a deduplication key
- On import: `INSERT ... ON CONFLICT (fingerprint) DO NOTHING`
- Do NOT use `FITID` alone as the unique key
- Show import result: "X imported, Y skipped (duplicates)"
- Allow user to review and confirm imports before committing

**Warning signs:**
- `INSERT INTO transactions VALUES (...)` without conflict handling

---

## Database & RLS Pitfalls

### Pitfall 11: RLS Table Without Policy — Silent Full Access

**What goes wrong:**
A new table is created (e.g., `tags`, `installment_groups`) with RLS enabled but no policies defined. In Supabase, enabling RLS with zero policies means **no rows are returned** for any query (default-deny). However, it's easy to add `SELECT: USING (true)` as a "fix" for the empty result — which then makes ALL rows readable by ALL users.

**Prevention:**
- Enable RLS immediately on every table creation
- Template for every table:
  ```sql
  ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users see own rows" ON my_table FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users insert own rows" ON my_table FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users update own rows" ON my_table FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "Users delete own rows" ON my_table FOR DELETE USING (auth.uid() = user_id);
  ```
- Code review checklist item: "Does this migration enable RLS AND add policies?"

**Warning signs:**
- Migration file with `ENABLE ROW LEVEL SECURITY` but no `CREATE POLICY` in the same file

---

### Pitfall 12: RLS Silent Failure — Wrong Results, Not Errors

**What goes wrong:**
A misconfigured RLS policy silently returns 0 rows instead of an error. Developer queries a table, gets an empty array, assumes "no data yet", and ships it. Actually, the policy is wrong and no user can ever read their own data — or worse, everyone reads everyone else's data (policy `USING (true)`).

**Prevention:**
- **Test RLS explicitly**: create two test users (user A and user B), insert data as user A, verify user B gets 0 rows and user A gets their own rows
- Use Supabase's built-in RLS testing: `SET LOCAL ROLE authenticated; SET LOCAL "request.jwt.claims" TO '{"sub": "user-a-uuid"}';`
- Never trust "it returns empty" as proof the policy is correct

**Warning signs:**
- No integration test that creates two users and verifies data isolation

---

### Pitfall 13: Service Role Key in Client-Accessible Code

**What goes wrong:**
The `service_role` key bypasses ALL RLS policies. If placed in a Next.js environment variable accessible on the client (`NEXT_PUBLIC_*`), or in a Server Action that doesn't properly scope it, an attacker can extract it and read/write every user's financial data.

**Prevention:**
- Service role key ONLY in `SUPABASE_SERVICE_ROLE_KEY` (never `NEXT_PUBLIC_*`)
- Use service role only in: server-side migration scripts, admin-only internal APIs
- All user-facing Server Actions use the user's session client (from `createServerComponentClient`)
- Audit: `grep -r "service_role" --include="*.ts"` — every match must be in a server-only file

---

### Pitfall 14: RLS on Junction Tables (Transactions ↔ Tags)

**What goes wrong:**
`transaction_tags` junction table has no RLS. An authenticated user can:
- Associate tags with transactions that belong to other users
- Read tag associations of all users
- If tags are shared, they can enumerate what categories other users use

**Prevention:**
- Add RLS to `transaction_tags` that checks ownership via the parent transaction:
  ```sql
  CREATE POLICY "Users manage own transaction tags" ON transaction_tags
  USING (
    EXISTS (SELECT 1 FROM transactions t WHERE t.id = transaction_id AND t.user_id = auth.uid())
  );
  ```
- Add indexes to support the policy check join (it runs on EVERY query)

---

## Next.js App Router Pitfalls

### Pitfall 15: Static Rendering Caches Stale Financial Data

**What goes wrong:**
Dashboard page loads and shows yesterday's balance. Financial pages rendered without explicit `cache: 'no-store'` or `export const dynamic = 'force-dynamic'` are statically cached at build time (or for 5 minutes on production). Users add a transaction, go to dashboard — balance unchanged.

**Prevention:**
- Every page that shows financial data: `export const dynamic = 'force-dynamic'`
- Every Supabase fetch in Server Components: `{ cache: 'no-store' }`
- **Never** allow dashboard/account/transaction pages to be statically generated

**Warning signs:**
- Balance unchanged after adding a transaction
- No `dynamic` export on finance pages

---

### Pitfall 16: Incomplete Cache Invalidation After Server Actions

**What goes wrong:**
Server Action adds a transaction, calls `revalidatePath('/dashboard')`. The Full Route Cache and Data Cache clear. But the **client-side Router Cache** (held in memory for 30s dev / 5min prod) still serves stale data. User sees old balance despite the Server Action completing successfully.

**Prevention:**
- After mutations in Server Actions, call both `revalidatePath` AND use `router.refresh()` on the client
- For critical financial mutations (add/delete/edit transaction), use `redirect()` after the action — this forces a fresh RSC payload fetch, bypassing Router Cache
- Use `revalidateTag` with explicit tags for granular cache control: `next: { tags: ['transactions', accountId] }`

**Warning signs:**
- Balance updates only after a manual page refresh, not immediately after adding transaction

---

### Pitfall 17: `revalidatePath` Inside `setTimeout` Silently Fails

**What goes wrong:**
Some async patterns delay revalidation: `setTimeout(() => revalidatePath('/'), 0)`. This silently does nothing — no error, no warning. The request-scoped context required by `revalidatePath` is gone by the time the callback runs. The cache is never invalidated.

**Prevention:**
- Always call `revalidatePath` / `revalidateTag` **synchronously** within the Server Action body, before returning
- Never wrap revalidation in `setTimeout`, `setImmediate`, or detached async functions

---

### Pitfall 18: Server Action Authentication Bypass

**What goes wrong:**
Developer assumes Server Actions are "safe because they run on the server." Does not validate the user session inside each action. An authenticated user crafts a direct POST to the Server Action endpoint and manipulates another user's transactions by passing their `transaction_id`.

**Prevention:**
- Every Server Action must:
  1. Get session: `const { data: { user } } = await supabase.auth.getUser()`
  2. Reject if no session: `if (!user) throw new Error('Unauthorized')`
  3. Scope all queries to `user.id` — never trust client-passed `user_id`
- RLS provides defense-in-depth, but Server Actions must also enforce auth at the application layer

---

## Performance Pitfalls

### Pitfall 19: N+1 Queries in Dashboard

**What goes wrong:**
Dashboard loops over each account and issues a separate query to sum transactions:
```typescript
const accounts = await getAccounts() // 1 query
for (const account of accounts) {
  account.balance = await getBalance(account.id) // N queries
}
```
With 5 accounts, this is 6 queries. With Supabase over HTTPS, each query adds ~50–200ms latency. Dashboard takes 1–3 seconds to load.

**Prevention:**
- Use a single SQL query with `GROUP BY account_id` to fetch all balances at once
- Or use Postgres views/RPC functions to compute dashboard aggregates server-side
- Supabase RPC: `supabase.rpc('get_dashboard_summary', { user_id })` — single round trip

**Warning signs:**
- Any `for...of` loop with `await` inside on a list of accounts/transactions

---

### Pitfall 20: Missing Indexes on Date Range Queries

**What goes wrong:**
Every transaction list and dashboard query filters by date range:
```sql
SELECT * FROM transactions WHERE account_id = $1 AND date >= $2 AND date <= $3
```
Without a composite index `(account_id, date)`, Postgres scans all user transactions for every query. At 1.000+ transactions this becomes slow.

**Prevention:**
Add in migrations:
```sql
CREATE INDEX idx_transactions_account_date ON transactions (account_id, date DESC);
CREATE INDEX idx_transactions_user_date ON transactions (user_id, date DESC);
```
- Run `EXPLAIN ANALYZE` on the most common dashboard queries before shipping

---

### Pitfall 21: Aggregating All-Time Transactions for Monthly Dashboard

**What goes wrong:**
Dashboard computes consolidated balance by summing ALL transactions ever, not just "paid" ones up to today. As transaction history grows, this query gets slower without bound.

**Prevention:**
- Design `accounts.balance_cache` column: increment/decrement atomically with each paid transaction
- Or: compute balance as `SUM(amount) WHERE paid = true AND date <= NOW()` with the date index
- Do NOT recalculate full transaction history on every page load

---

## UX Pitfalls

### Pitfall 22: Credit/Debit Sign Convention Confusion

**What goes wrong:**
The word "débito" means two different things in the Brazilian financial context:
- **Conta bancária**: débito = money leaves your account (expense)
- **Cartão de crédito**: "lançamento no cartão" = the bank owes you less credit, but **from the user's perspective it's spending money**

Apps that show credit card transactions as "positive" (because the card balance went up) confuse users who expect expenses to always be negative/red.

**Prevention:**
- From the **user's perspective**: all spending (regardless of payment method) is always negative/red
- Internal model: `amount` is always signed from the user's perspective:
  - `amount < 0` = money out (expense, credit card purchase)
  - `amount > 0` = money in (income, refund)
- Never display the same amount with different signs based on account type
- Credit card "balance" displayed as "fatura: R$X" (how much you owe), NOT as a positive account balance

---

### Pitfall 23: Invoice Period vs Calendar Month Confusion

**What goes wrong:**
User makes a purchase on June 28 with a card that closes on day 5. The purchase goes into the July invoice (paid in August). User opens "June spending" dashboard and expects to see that purchase — it's not there. They open July dashboard — it appears as a July transaction. But they bought it in June.

This is an inherent domain complexity, not a bug, but it causes support confusion if the app doesn't make it explicit.

**Prevention:**
- Dashboard **monthly view** shows transactions by `transaction_date` (when the purchase was made), not by invoice period
- **Card fatura view** shows transactions by the invoice period they belong to
- Make the distinction visible in UI: "Junho / Transações" vs "Fatura Julho (fecha 05/07)"
- Add a tooltip/help text explaining "compras no cartão aparecem na fatura seguinte ao fechamento"

---

### Pitfall 24: "Saldo" Doesn't Mean What Users Expect for Credit Cards

**What goes wrong:**
App shows "Saldo: R$500,00" for a credit card. User interprets it as "available limit" (like a real bank account balance). Actually it's the invoice total (fatura aberta). Or vice versa — it's the remaining limit, but user thinks it's the invoice.

**Prevention:**
- Credit card accounts show two distinct values:
  1. **Fatura aberta**: how much has been spent in the current period (not yet billed)
  2. **Limite disponível**: `credit_limit - open_invoice_total`
- Label them explicitly: never use generic "Saldo" for credit cards
- In the account list, show: "💳 Visa — Fatura: R$1.200 | Limite: R$3.800"

---

### Pitfall 25: Brazil Timezone Fragmentation (UTC-3 to UTC-5)

**What goes wrong:**
Server stores all timestamps in UTC. A user in Manaus (UTC-4) creates a transaction at 23:30 local time. UTC stores it as 03:30 the next day. The transaction appears in the next day's list. The user's January 31 purchase appears in February.

Brazil has 4 timezone offsets: BRT (UTC-3), AMT (UTC-4, Amazon/Manaus), ACT (UTC-5, Acre), FNT (UTC-2, Fernando de Noronha). DST adds further complexity.

**Prevention:**
- Store `transaction_date` as a `DATE` type (calendar date, timezone-free), not `TIMESTAMPTZ`
  - A purchase has a calendar date (2026-01-31), not an instant in time
  - The **date** is the user's local date, not UTC
- Store metadata timestamps (`created_at`, `updated_at`) as `TIMESTAMPTZ` (UTC)
- On the client: all date pickers send `YYYY-MM-DD` strings; never send UTC timestamps for business dates
- Do NOT derive the transaction `date` from `new Date().toISOString()` on the server (it will be UTC)

**Warning signs:**
- `transaction_date TIMESTAMPTZ` in the schema
- Server Action doing `date: new Date().toISOString()` to set transaction date

---

## Phase Mapping

| Pitfall | Phase | Priority |
|---------|-------|----------|
| Floating-point precision (P1) | Foundation / Data Model | **Critical** — must decide before first migration |
| Installment rounding (P2) | Transactions — Installments | **Critical** — test before shipping parcelas |
| Running balance strategy (P3) | Foundation / Dashboard | **Critical** — impacts entire data model |
| Invoice period boundary (P4) | Credit Card Modeling | **Critical** — test closing day edge case |
| Closing date on day 31 (P5) | Credit Card Modeling | **Critical** — pure date math bug |
| Installment delete/edit (P6) | Transactions — Installments | High — define cascade rules before UI |
| Credit card payment double-count (P7) | Credit Card — Invoice Payment | **Critical** — corrupts expense totals |
| CSV encoding Windows-1252 (P8) | Import | High — all Brazilian banks affected |
| CSV format per bank (P9) | Import | High — ship bank profiles upfront |
| Duplicate import (P10) | Import | High — without dedup, import is dangerous |
| RLS table without policy (P11) | Foundation / Auth | **Critical** — every migration |
| RLS silent failure (P12) | Foundation / Auth | **Critical** — write isolation tests |
| Service role key (P13) | Foundation / Auth | **Critical** — before first deploy |
| Junction table RLS (P14) | Tags / Transactions | High — when implementing tags |
| Static rendering stale data (P15) | Dashboard / All Pages | **Critical** — day 1 of any page |
| Router Cache incomplete (P16) | All Server Actions | High — after first mutation |
| revalidatePath in setTimeout (P17) | All Server Actions | Medium — code review catch |
| Server Action auth bypass (P18) | All Server Actions | **Critical** — every action |
| N+1 dashboard queries (P19) | Dashboard | High — detectable in dev |
| Missing date indexes (P20) | Foundation / Data Model | High — add in initial migration |
| Aggregating all-time data (P21) | Dashboard | Medium — becomes problem at scale |
| Credit/debit sign confusion (P22) | Foundation / Data Model | **Critical** — drives entire amount convention |
| Invoice period vs calendar month (P23) | Credit Card / Dashboard | Medium — UX copy + tooltip |
| Credit card "saldo" label (P24) | Accounts UI | Medium — label naming decision |
| Timezone fragmentation (P25) | Foundation / Data Model | **Critical** — must decide DATE vs TIMESTAMPTZ before first migration |

---

## Sources

- IEEE 754 financial pitfalls: [DEV.to — Financial Precision in JS](https://dev.to/benjamin_renoux/financial-precision-in-javascript-handle-money-without-losing-a-cent-1chc)
- Supabase RLS mistakes: [PreBreach — 7 RLS Mistakes](https://www.prebreach.dev/blog/supabase-rls-mistakes-database-security)
- Next.js caching: [Pockit Blog — Cache Deep Dive](https://pockit.tools/blog/nextjs-app-router-caching-deep-dive/)
- revalidatePath bug: [HeyDev — revalidatePath setTimeout](https://heydev.us/blog/nextjs-revalidatepath-settimeout-bug-2026)
- OFX encoding: [libofx GitHub Issue #20](https://github.com/libofx/libofx/issues/20)
- Running balance performance: [Actual Budget PR #5405](https://github.com/actualbudget/actual/pull/5405)
- PostgreSQL running balance: [pgrs.net — Ledger in PostgreSQL](https://pgrs.net/2025/03/24/pgledger-ledger-implementation-in-postgresql/)
- Timezone financial corruption: [Stackademic — The Time Zone Bug](https://blog.stackademic.com/the-time-zone-bug-that-corrupted-a-years-worth-of-financial-reports-867c30b76469)
- PostgreSQL timezone types: [AppMaster — TIMESTAMPTZ vs TIMESTAMP](https://www.appmaster.io/blog/timestamptz-vs-timestamp-postgresql-reporting-apis)
