-- 1. Tabela de Categorias Customizadas
CREATE TABLE public.custom_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    color TEXT,
    icon TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own custom categories"
    ON public.custom_categories FOR SELECT
    USING (auth.uid() = user_id OR wallet_id IN (SELECT wallet_id FROM public.wallet_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own custom categories"
    ON public.custom_categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom categories"
    ON public.custom_categories FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom categories"
    ON public.custom_categories FOR DELETE
    USING (auth.uid() = user_id);


-- 2. Tabela de Orçamentos (Budgets)
CREATE TABLE public.budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL, -- Pode ser uma categoria padrão ou o ID/Nome de uma customizada
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, wallet_id, category)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own budgets"
    ON public.budgets FOR SELECT
    USING (auth.uid() = user_id OR wallet_id IN (SELECT wallet_id FROM public.wallet_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own budgets"
    ON public.budgets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
    ON public.budgets FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
    ON public.budgets FOR DELETE
    USING (auth.uid() = user_id);

-- E vamos garantir que o realtime esteja ativado para essas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.budgets;
