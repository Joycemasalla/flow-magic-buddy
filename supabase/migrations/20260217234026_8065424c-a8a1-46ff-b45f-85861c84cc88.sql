
-- Add settlement date column to transactions table for loans
ALTER TABLE public.transactions
ADD COLUMN loan_settled_date date DEFAULT NULL;
