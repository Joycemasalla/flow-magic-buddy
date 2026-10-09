ALTER TABLE public.reminders
ADD COLUMN last_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL;
