-- Adiciona a coluna transaction_id na tabela investments para vincular a transação gerada
ALTER TABLE public.investments
ADD COLUMN transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL;

-- Atualiza a foreign key para evitar que a deleção de uma transação falhe (opcional, já fizemos ON DELETE SET NULL)
-- Isso permite que se a transação for apagada, o investimento perde o vínculo, ou vice versa.
