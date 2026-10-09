-- Remove a política vulnerável de inserção direta
DROP POLICY IF EXISTS "Users can insert themselves into wallets" ON public.wallet_members;

-- Cria a RPC segura para aceitar convites
CREATE OR REPLACE FUNCTION public.accept_wallet_invite(invite_token TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Busca o convite e trava a linha para evitar race conditions
  SELECT * INTO v_invite
  FROM public.wallet_invites
  WHERE token = invite_token
  FOR UPDATE;

  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'Convite inválido';
  END IF;

  IF v_invite.used_at IS NOT NULL THEN
    RAISE EXCEPTION 'Convite já utilizado';
  END IF;

  IF v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'Convite expirado';
  END IF;

  -- Adiciona o usuário como membro (ignora se já for membro)
  INSERT INTO public.wallet_members (wallet_id, user_id, role)
  VALUES (v_invite.wallet_id, v_user_id, 'member')
  ON CONFLICT (wallet_id, user_id) DO NOTHING;

  -- Marca o convite como utilizado
  UPDATE public.wallet_invites
  SET used_at = now(), used_by = v_user_id
  WHERE id = v_invite.id;

  RETURN json_build_object('success', true, 'wallet_id', v_invite.wallet_id);
END;
$$;
