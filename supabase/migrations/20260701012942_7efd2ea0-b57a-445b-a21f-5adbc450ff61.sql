
ALTER TABLE public.reminders
  ADD COLUMN IF NOT EXISTS alert_days_before integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS last_paid_month text;

-- last_paid_month formato 'YYYY-MM'. Quando muda o mês, o gasto reaparece como pendente.
COMMENT ON COLUMN public.reminders.alert_days_before IS 'Quantos dias antes do vencimento o gasto deve ser destacado.';
COMMENT ON COLUMN public.reminders.last_paid_month IS 'Último mês (YYYY-MM) em que o gasto mensal foi marcado como pago.';
