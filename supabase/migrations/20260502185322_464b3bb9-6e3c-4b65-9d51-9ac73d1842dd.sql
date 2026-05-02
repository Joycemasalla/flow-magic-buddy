-- Fix: permitir que o criador da carteira leia a própria linha imediatamente após o INSERT
-- (necessário para o RETURNING * funcionar antes do trigger materializar wallet_members)
-- Não destrutivo: apenas amplia a policy de SELECT.

DROP POLICY IF EXISTS "Members can view their wallets" ON public.wallets;

CREATE POLICY "Members or creator can view wallets"
ON public.wallets
FOR SELECT
USING (
  auth.uid() = created_by
  OR public.is_wallet_member(id, auth.uid())
);

-- Idem em wallet_members: permitir o próprio usuário ler sua linha
-- (necessário para refresh logo após o trigger inserir owner)
DROP POLICY IF EXISTS "Members can view membership of their wallets" ON public.wallet_members;

CREATE POLICY "Members can view membership"
ON public.wallet_members
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.is_wallet_member(wallet_id, auth.uid())
);
