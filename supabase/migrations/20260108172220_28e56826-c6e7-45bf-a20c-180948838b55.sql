-- Add loan-specific columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS is_loan boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS loan_person text,
ADD COLUMN IF NOT EXISTS loan_status text DEFAULT 'pending';

-- Create an index for faster loan queries
CREATE INDEX IF NOT EXISTS idx_transactions_is_loan ON public.transactions(is_loan) WHERE is_loan = true;