-- Performance: índices para acelerar as consultas por carteira/data/usuário.
-- Seguro rodar mais de uma vez (IF NOT EXISTS).
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_date ON public.transactions (wallet_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_reminders_wallet_due ON public.reminders (wallet_id, due_date);
CREATE INDEX IF NOT EXISTS idx_investments_wallet_created ON public.investments (wallet_id, created_at DESC);
