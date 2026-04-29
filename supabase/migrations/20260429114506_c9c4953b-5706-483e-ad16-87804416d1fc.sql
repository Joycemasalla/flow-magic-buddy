-- =====================================================
-- COUPLE MODE: Shared Wallets with Full Scoping
-- =====================================================

-- 1. Wallets table
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Nossa Carteira',
  type TEXT NOT NULL DEFAULT 'couple' CHECK (type IN ('couple')),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Wallet members (who has access)
CREATE TABLE public.wallet_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (wallet_id, user_id)
);

-- 3. Invite tokens (shareable links)
CREATE TABLE public.wallet_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMPTZ,
  used_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Goals (shared or personal)
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC NOT NULL DEFAULT 0,
  deadline DATE,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Add wallet_id to existing tables (NULL = personal scope)
ALTER TABLE public.transactions ADD COLUMN wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL;
ALTER TABLE public.investments ADD COLUMN wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL;
ALTER TABLE public.reminders ADD COLUMN wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL;

CREATE INDEX idx_transactions_wallet ON public.transactions(wallet_id);
CREATE INDEX idx_investments_wallet ON public.investments(wallet_id);
CREATE INDEX idx_reminders_wallet ON public.reminders(wallet_id);
CREATE INDEX idx_goals_wallet ON public.goals(wallet_id);
CREATE INDEX idx_wallet_members_user ON public.wallet_members(user_id);

-- =====================================================
-- SECURITY DEFINER FUNCTION (avoid RLS recursion)
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_wallet_member(_wallet_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.wallet_members
    WHERE wallet_id = _wallet_id AND user_id = _user_id
  );
$$;

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- WALLETS POLICIES
-- =====================================================
CREATE POLICY "Members can view their wallets"
ON public.wallets FOR SELECT
USING (public.is_wallet_member(id, auth.uid()));

CREATE POLICY "Users can create wallets"
ON public.wallets FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Members can update their wallets"
ON public.wallets FOR UPDATE
USING (public.is_wallet_member(id, auth.uid()));

CREATE POLICY "Owner can delete their wallet"
ON public.wallets FOR DELETE
USING (auth.uid() = created_by);

-- =====================================================
-- WALLET_MEMBERS POLICIES
-- =====================================================
CREATE POLICY "Members can view membership of their wallets"
ON public.wallet_members FOR SELECT
USING (public.is_wallet_member(wallet_id, auth.uid()));

CREATE POLICY "Users can insert themselves into wallets"
ON public.wallet_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave wallets (delete own membership)"
ON public.wallet_members FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- WALLET_INVITES POLICIES
-- =====================================================
CREATE POLICY "Members can view invites for their wallets"
ON public.wallet_invites FOR SELECT
USING (public.is_wallet_member(wallet_id, auth.uid()) OR auth.uid() IS NOT NULL);

CREATE POLICY "Members can create invites"
ON public.wallet_invites FOR INSERT
WITH CHECK (public.is_wallet_member(wallet_id, auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Authenticated users can mark invites used"
ON public.wallet_invites FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Members can delete invites"
ON public.wallet_invites FOR DELETE
USING (public.is_wallet_member(wallet_id, auth.uid()));

-- =====================================================
-- GOALS POLICIES
-- =====================================================
CREATE POLICY "Users can view their goals or wallet goals"
ON public.goals FOR SELECT
USING (auth.uid() = user_id OR (wallet_id IS NOT NULL AND public.is_wallet_member(wallet_id, auth.uid())));

CREATE POLICY "Users can create their own goals"
ON public.goals FOR INSERT
WITH CHECK (auth.uid() = user_id AND (wallet_id IS NULL OR public.is_wallet_member(wallet_id, auth.uid())));

CREATE POLICY "Users can update their goals or wallet goals"
ON public.goals FOR UPDATE
USING (auth.uid() = user_id OR (wallet_id IS NOT NULL AND public.is_wallet_member(wallet_id, auth.uid())));

CREATE POLICY "Users can delete their goals or wallet goals"
ON public.goals FOR DELETE
USING (auth.uid() = user_id OR (wallet_id IS NOT NULL AND public.is_wallet_member(wallet_id, auth.uid())));

-- =====================================================
-- UPDATE EXISTING TABLE POLICIES TO INCLUDE WALLET ACCESS
-- =====================================================

-- TRANSACTIONS
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

CREATE POLICY "Users can view own or wallet transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = user_id OR (wallet_id IS NOT NULL AND public.is_wallet_member(wallet_id, auth.uid())));

CREATE POLICY "Users can create own or wallet transactions"
ON public.transactions FOR INSERT
WITH CHECK (auth.uid() = user_id AND (wallet_id IS NULL OR public.is_wallet_member(wallet_id, auth.uid())));

CREATE POLICY "Users can update own or wallet transactions"
ON public.transactions FOR UPDATE
USING (auth.uid() = user_id OR (wallet_id IS NOT NULL AND public.is_wallet_member(wallet_id, auth.uid())));

CREATE POLICY "Users can delete own or wallet transactions"
ON public.transactions FOR DELETE
USING (auth.uid() = user_id OR (wallet_id IS NOT NULL AND public.is_wallet_member(wallet_id, auth.uid())));

-- INVESTMENTS
DROP POLICY IF EXISTS "Users can view their own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can create their own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can update their own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can delete their own investments" ON public.investments;

CREATE POLICY "Users can view own or wallet investments"
ON public.investments FOR SELECT
USING (auth.uid() = user_id OR (wallet_id IS NOT NULL AND public.is_wallet_member(wallet_id, auth.uid())));

CREATE POLICY "Users can create own or wallet investments"
ON public.investments FOR INSERT
WITH CHECK (auth.uid() = user_id AND (wallet_id IS NULL OR public.is_wallet_member(wallet_id, auth.uid())));

CREATE POLICY "Users can update own or wallet investments"
ON public.investments FOR UPDATE
USING (auth.uid() = user_id OR (wallet_id IS NOT NULL AND public.is_wallet_member(wallet_id, auth.uid())));

CREATE POLICY "Users can delete own or wallet investments"
ON public.investments FOR DELETE
USING (auth.uid() = user_id OR (wallet_id IS NOT NULL AND public.is_wallet_member(wallet_id, auth.uid())));

-- REMINDERS
DROP POLICY IF EXISTS "Users can view their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can create their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can update their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can delete their own reminders" ON public.reminders;

CREATE POLICY "Users can view own or wallet reminders"
ON public.reminders FOR SELECT
USING (auth.uid() = user_id OR (wallet_id IS NOT NULL AND public.is_wallet_member(wallet_id, auth.uid())));

CREATE POLICY "Users can create own or wallet reminders"
ON public.reminders FOR INSERT
WITH CHECK (auth.uid() = user_id AND (wallet_id IS NULL OR public.is_wallet_member(wallet_id, auth.uid())));

CREATE POLICY "Users can update own or wallet reminders"
ON public.reminders FOR UPDATE
USING (auth.uid() = user_id OR (wallet_id IS NOT NULL AND public.is_wallet_member(wallet_id, auth.uid())));

CREATE POLICY "Users can delete own or wallet reminders"
ON public.reminders FOR DELETE
USING (auth.uid() = user_id OR (wallet_id IS NOT NULL AND public.is_wallet_member(wallet_id, auth.uid())));

-- =====================================================
-- TIMESTAMP TRIGGERS
-- =====================================================
CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
BEFORE UPDATE ON public.goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- AUTO-ADD CREATOR AS OWNER MEMBER
-- =====================================================
CREATE OR REPLACE FUNCTION public.add_wallet_creator_as_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wallet_members (wallet_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_wallet_created
AFTER INSERT ON public.wallets
FOR EACH ROW EXECUTE FUNCTION public.add_wallet_creator_as_owner();