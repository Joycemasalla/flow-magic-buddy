CREATE TABLE public.whatsapp_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  link_code text NOT NULL UNIQUE,
  phone text UNIQUE,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX whatsapp_links_user_id_key ON public.whatsapp_links(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_links TO authenticated;
GRANT ALL ON public.whatsapp_links TO service_role;

ALTER TABLE public.whatsapp_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own whatsapp link" ON public.whatsapp_links
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_whatsapp_links_updated_at
  BEFORE UPDATE ON public.whatsapp_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();