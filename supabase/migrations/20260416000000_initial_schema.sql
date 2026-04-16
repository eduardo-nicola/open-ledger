-- =============================================================================
-- Open Ledger - Schema Inicial (Fase 1)
-- Migration: 20260416000000_initial_schema.sql
--
-- Cria as tabelas core do banco. Fases futuras adicionam campos e tabelas
-- incrementalmente via novas migrations.
--
-- Decisoes de schema (STATE.md):
--   - Valores monetarios: INTEGER (centavos) - nunca FLOAT/NUMERIC
--   - Datas de transacao: DATE - nunca TIMESTAMPTZ (evita timezone corruption)
--   - RLS: 4 policies por tabela (SELECT, INSERT, UPDATE, DELETE)
--   - FK chain: auth.users -> profiles -> accounts/transactions
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Tabela: public.profiles
-- Ancora de RLS. Contem apenas id (FK para auth.users) + timestamps.
-- Nome, email e avatar sao sempre lidos de auth.users (metadata Google OAuth).
-- Decisao D-01: sem campos editaveis pelo usuario.
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: users can select own row"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: users can insert own row"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: users can update own row"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: users can delete own row"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Trigger: criacao automatica de profiles no primeiro login
-- Decisao D-04: trigger on auth.users INSERT com SECURITY DEFINER.
-- SECURITY DEFINER e obrigatorio para a funcao ter permissao de inserir em
-- public.profiles durante o INSERT em auth.users (Pitfall 5 do RESEARCH.md).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Tabela: public.accounts
-- Schema base - campos especificos de parcelamento/fatura sao adicionados
-- em fases futuras via migrations separadas (decisao D-06).
-- ---------------------------------------------------------------------------
CREATE TABLE public.accounts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  type        TEXT        NOT NULL CHECK (type IN ('checking', 'savings', 'digital_wallet', 'credit_card')),
  color       TEXT        NOT NULL DEFAULT '#22c55e',
  balance     INTEGER     NOT NULL DEFAULT 0,       -- centavos (decisao D-08)
  currency    TEXT        NOT NULL DEFAULT 'BRL',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounts: users can select own rows"
  ON public.accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "accounts: users can insert own rows"
  ON public.accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "accounts: users can update own rows"
  ON public.accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "accounts: users can delete own rows"
  ON public.accounts FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Tabela: public.transactions
-- Schema base - campos de parcelamento (installment_group_id) e de fatura
-- (invoice_id) sao adicionados nas Fases 4 e 5 via migrations separadas.
-- ---------------------------------------------------------------------------
CREATE TABLE public.transactions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id  UUID        NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  amount      INTEGER     NOT NULL,                 -- centavos, signed (negativo=despesa)
  date        DATE        NOT NULL,                 -- DATE, nao TIMESTAMPTZ (decisao D-08)
  description TEXT        NOT NULL DEFAULT '',
  type        TEXT        NOT NULL CHECK (type IN ('expense', 'income')),
  status      TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions: users can select own rows"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "transactions: users can insert own rows"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions: users can update own rows"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions: users can delete own rows"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Indices de performance para queries por data (Pitfall 20 do RESEARCH.md)
-- ---------------------------------------------------------------------------
CREATE INDEX idx_transactions_account_date
  ON public.transactions (account_id, date DESC);

CREATE INDEX idx_transactions_user_date
  ON public.transactions (user_id, date DESC);
