-- Remove goals feature
DROP TABLE IF EXISTS public.goals CASCADE;

-- Add optional bank logo URL to accounts
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS logo_url text;