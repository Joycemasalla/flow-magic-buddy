ALTER TABLE public.transactions
ADD COLUMN is_transfer BOOLEAN DEFAULT false,
ADD COLUMN linked_transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE;
