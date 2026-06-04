
-- 1. Tighten wallet_invites SELECT
DROP POLICY IF EXISTS "Members can view invites for their wallets" ON public.wallet_invites;
CREATE POLICY "View invites: members or valid token lookup"
ON public.wallet_invites
FOR SELECT
TO authenticated
USING (
  is_wallet_member(wallet_id, auth.uid())
  OR (used_at IS NULL AND expires_at > now())
);

-- 2. Tighten wallet_invites UPDATE: only allow marking your own usage on a valid invite
DROP POLICY IF EXISTS "Authenticated users can mark invites used" ON public.wallet_invites;
CREATE POLICY "Recipients can mark invite as used"
ON public.wallet_invites
FOR UPDATE
TO authenticated
USING (
  used_at IS NULL
  AND expires_at > now()
)
WITH CHECK (
  used_by = auth.uid()
  AND used_at IS NOT NULL
);

-- 3. Lock down realtime.messages (broadcast/presence). App uses only postgres_changes
--    which is gated by the underlying table RLS, so denying direct messages access is safe.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Deny all broadcast and presence" ON realtime.messages;
CREATE POLICY "Deny all broadcast and presence"
ON realtime.messages
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- 4. Revoke EXECUTE on SECURITY DEFINER helpers from anon. Triggers run as owner so
--    revoking from PUBLIC/anon does not affect them.
REVOKE EXECUTE ON FUNCTION public.is_wallet_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.add_wallet_creator_as_owner() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_wallet_member(uuid, uuid) TO authenticated;
