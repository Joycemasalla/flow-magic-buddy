-- Create accounts table
CREATE TABLE public.accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  wallet_id uuid NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'corrente',
  icon text NOT NULL DEFAULT 'Wallet',
  color text NOT NULL DEFAULT '#8B5CF6',
  initial_balance numeric NOT NULL DEFAULT 0,
  owner_scope text NOT NULL DEFAULT 'mine',
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own or wallet accounts"
  ON public.accounts FOR SELECT
  USING ((auth.uid() = user_id) OR ((wallet_id IS NOT NULL) AND is_wallet_member(wallet_id, auth.uid())));

CREATE POLICY "Users can create own or wallet accounts"
  ON public.accounts FOR INSERT
  WITH CHECK ((auth.uid() = user_id) AND ((wallet_id IS NULL) OR is_wallet_member(wallet_id, auth.uid())));

CREATE POLICY "Users can update own or wallet accounts"
  ON public.accounts FOR UPDATE
  USING ((auth.uid() = user_id) OR ((wallet_id IS NOT NULL) AND is_wallet_member(wallet_id, auth.uid())));

CREATE POLICY "Users can delete own or wallet accounts"
  ON public.accounts FOR DELETE
  USING ((auth.uid() = user_id) OR ((wallet_id IS NOT NULL) AND is_wallet_member(wallet_id, auth.uid())));

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add account_id to transactions
ALTER TABLE public.transactions
  ADD COLUMN account_id uuid NULL REFERENCES public.accounts(id) ON DELETE SET NULL;

CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_accounts_wallet_id ON public.accounts(wallet_id);
CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);

-- Realtime
ALTER TABLE public.accounts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;