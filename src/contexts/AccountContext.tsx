import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useTransactions } from '@/contexts/TransactionContext';
import { Account } from '@/types/account';
import { toast } from '@/hooks/use-toast';
import { toLocalDateString } from '@/lib/utils';
import { calculateAccountBalance } from '@/lib/finance/rules';

interface AccountContextType {
  accounts: Account[];
  loading: boolean;
  /** map id -> computed current balance */
  balances: Record<string, number>;
  totalBalance: number;
  addAccount: (data: Omit<Account, 'id' | 'createdAt' | 'userId' | 'walletId'>) => Promise<Account | null>;
  updateAccount: (id: string, data: Partial<Omit<Account, 'id' | 'createdAt' | 'userId' | 'walletId'>>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  /** Creates an adjustment transaction so that balance becomes newBalance. */
  adjustBalance: (accountId: string, newBalance: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { activeWalletId } = useWallet();
  const { transactions, addTransaction } = useTransactions();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    if (!user) {
      setAccounts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let q = supabase.from('accounts').select('*').order('created_at', { ascending: true });
    if (activeWalletId) q = q.eq('wallet_id', activeWalletId);
    else q = q.is('wallet_id', null);
    const { data, error } = await q;
    if (!error && data) {
      setAccounts(
        data.map((a: any) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          icon: a.icon,
          color: a.color,
          logoUrl: a.logo_url ?? null,
          initialBalance: Number(a.initial_balance),
          ownerScope: a.owner_scope,
          archived: a.archived,
          userId: a.user_id,
          walletId: a.wallet_id,
          createdAt: a.created_at,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeWalletId]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`accounts-${activeWalletId || 'personal'}-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, () => {
        fetchAccounts();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeWalletId]);

  // Compute balances from transactions
  const balances = useMemo(() => {
    const map: Record<string, number> = {};
    accounts.forEach((a) => {
      map[a.id] = a.initialBalance + calculateAccountBalance(transactions, a.id, false);
    });
    return map;
  }, [accounts, transactions]);

  const totalBalance = useMemo(
    () => accounts.filter((a) => !a.archived).reduce((s, a) => s + (balances[a.id] || 0), 0),
    [accounts, balances]
  );

  const addAccount: AccountContextType['addAccount'] = async (data) => {
    if (!user) return null;
    const payload = {
      user_id: user.id,
      wallet_id: activeWalletId || null,
      name: data.name,
      type: data.type,
      icon: data.icon,
      color: data.color,
      logo_url: data.logoUrl ?? null,
      initial_balance: data.initialBalance,
      owner_scope: data.ownerScope,
      archived: data.archived,
    };
    const { data: row, error } = await supabase.from('accounts').insert(payload).select().single();
    if (error || !row) {
      toast({ title: 'Erro', description: error?.message || 'Falha ao criar conta', variant: 'destructive' });
      return null;
    }
    await fetchAccounts();
    toast({ title: 'Conta criada!', description: data.name });
    return {
      id: row.id, name: row.name, type: row.type as any, icon: row.icon, color: row.color,
      logoUrl: (row as any).logo_url ?? null,
      initialBalance: Number(row.initial_balance), ownerScope: row.owner_scope as any,
      archived: row.archived, userId: row.user_id, walletId: row.wallet_id, createdAt: row.created_at,
    };
  };

  const updateAccount: AccountContextType['updateAccount'] = async (id, data) => {
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.type !== undefined) payload.type = data.type;
    if (data.icon !== undefined) payload.icon = data.icon;
    if (data.color !== undefined) payload.color = data.color;
    if (data.logoUrl !== undefined) payload.logo_url = data.logoUrl;
    if (data.initialBalance !== undefined) payload.initial_balance = data.initialBalance;
    if (data.ownerScope !== undefined) payload.owner_scope = data.ownerScope;
    if (data.archived !== undefined) payload.archived = data.archived;
    const { error } = await supabase.from('accounts').update(payload).eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    await fetchAccounts();
  };

  const deleteAccount: AccountContextType['deleteAccount'] = async (id) => {
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    await fetchAccounts();
    toast({ title: 'Conta excluída' });
  };

  const adjustBalance: AccountContextType['adjustBalance'] = async (accountId, newBalance) => {
    const current = balances[accountId] ?? 0;
    const diff = Number((newBalance - current).toFixed(2));
    if (diff === 0) {
      toast({ title: 'Sem alteração', description: 'O saldo informado já corresponde ao atual.' });
      return;
    }
    const acc = accounts.find((a) => a.id === accountId);
    await addTransaction({
      type: diff > 0 ? 'income' : 'expense',
      category: 'adjustment',
      amount: Math.abs(diff),
      description: `Ajuste de saldo${acc ? ' - ' + acc.name : ''}`,
      date: toLocalDateString(),
      accountId,
    });
    toast({ title: 'Saldo ajustado!', description: `Novo saldo: R$ ${newBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` });
  };

  return (
    <AccountContext.Provider
      value={{ accounts, loading, balances, totalBalance, addAccount, updateAccount, deleteAccount, adjustBalance, refresh: fetchAccounts }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccounts() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccounts must be used within AccountProvider');
  return ctx;
}
