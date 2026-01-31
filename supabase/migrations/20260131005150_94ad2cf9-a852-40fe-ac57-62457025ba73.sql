-- Add column for specific investment details (stored as JSONB)
ALTER TABLE public.investments 
ADD COLUMN IF NOT EXISTS specific_details jsonb DEFAULT NULL;