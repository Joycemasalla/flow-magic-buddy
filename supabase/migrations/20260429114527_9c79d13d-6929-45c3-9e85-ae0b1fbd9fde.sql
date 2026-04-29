-- Revoke direct EXECUTE from anon/authenticated; functions still work inside RLS evaluation
REVOKE EXECUTE ON FUNCTION public.is_wallet_member(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.add_wallet_creator_as_owner() FROM PUBLIC, anon, authenticated;