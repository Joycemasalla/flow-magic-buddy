import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/hooks/use-toast';

export interface Budget {
  id: string;
  category: string;
  amount: number;
  userId: string;
  walletId: string | null;
  createdAt: string;
}

interface BudgetContextType {
  budgets: Budget[];
  loading: boolean;
  addBudget: (budget: { category: string; amount: number }) => Promise<void>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { activeWalletId } = useWallet();

  const fetchBudgets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    let query = supabase.from('budgets').select('*');
    if (activeWalletId) {
      query = query.eq('wallet_id', activeWalletId);
    } else {
      query = query.is('wallet_id', null);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching budgets:', error);
    } else if (data) {
      setBudgets(data.map(b => ({
        id: b.id,
        category: b.category,
        amount: Number(b.amount),
        userId: b.user_id,
        walletId: b.wallet_id,
        createdAt: b.created_at,
      })));
    }
    setLoading(false);
  }, [user, activeWalletId]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const addBudget = async (budget: { category: string; amount: number }) => {
    if (!user) return;
    const { data, error } = await supabase.from('budgets').insert([{
      category: budget.category,
      amount: budget.amount,
      user_id: user.id,
      wallet_id: activeWalletId || null,
    }]).select().single();

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível salvar o orçamento.', variant: 'destructive' });
      throw error;
    }

    if (data) {
      setBudgets(prev => [...prev, {
        id: data.id,
        category: data.category,
        amount: Number(data.amount),
        userId: data.user_id,
        walletId: data.wallet_id,
        createdAt: data.created_at,
      }]);
      toast({ title: 'Sucesso', description: 'Orçamento salvo!' });
    }
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    const { error } = await supabase.from('budgets').update({
      amount: updates.amount,
      category: updates.category,
    }).eq('id', id);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar.', variant: 'destructive' });
      throw error;
    }

    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBudget = async (id: string) => {
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível excluir.', variant: 'destructive' });
      throw error;
    }
    setBudgets(prev => prev.filter(b => b.id !== id));
  };

  return (
    <BudgetContext.Provider value={{ budgets, loading, addBudget, updateBudget, deleteBudget }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudgets() {
  const context = useContext(BudgetContext);
  if (!context) throw new Error('useBudgets must be used within a BudgetProvider');
  return context;
}
