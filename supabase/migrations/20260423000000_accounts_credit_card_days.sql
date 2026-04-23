-- =============================================================================
-- Open Ledger - ACC-03: dias de fechamento e vencimento do cartão de crédito
-- =============================================================================
-- Colunas nullable para não quebrar contas existentes. CHECK aplica 1–31 apenas
-- quando type = 'credit_card'. Edge cases de calendário (ex.: vencimento em
-- meses com menos dias) ficam para a Fase 5 (fatura/closing_day).
-- =============================================================================

ALTER TABLE public.accounts
  ADD COLUMN closing_day smallint,
  ADD COLUMN due_day smallint;

ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_credit_card_days_chk
  CHECK (
    type != 'credit_card'
    OR (
      closing_day BETWEEN 1 AND 31
      AND due_day BETWEEN 1 AND 31
    )
  );

COMMENT ON COLUMN public.accounts.closing_day IS 'Dia de fechamento da fatura (1–31) quando type = credit_card; ver edge cases Fase 5.';
COMMENT ON COLUMN public.accounts.due_day IS 'Dia de vencimento da fatura (1–31) quando type = credit_card; ver edge cases Fase 5.';
