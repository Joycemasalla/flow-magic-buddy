import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Transaction, Reminder, TransactionCategory } from '@/types/transaction';
import { Investment, InvestmentType } from '@/types/investment';
import { validateInvestmentDetails } from '@/lib/investmentValidation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOnlineStatus, setOfflineCache, getOfflineCache } from '@/hooks/useOffline';
import { useOfflineQueue, generateTempId, OfflineOperation } from '@/hooks/useOfflineQueue';
import { toast } from '@/hooks/use-toast';

interface TransactionContextType {
  transactions: Transaction[];
  reminders: Reminder[];
  investments: Investment[];
  loading: boolean;
  pendingOpsCount: number;
  isSyncing: boolean;
  pendingTransactionIds: Set<string>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<string | undefined>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => Promise<void>;
  updateReminder: (id: string, reminder: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  addInvestment: (investment: Omit<Investment, 'id' | 'createdAt'>) => Promise<void>;
  updateInvestment: (id: string, investment: Partial<Investment>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  markInvestmentAsDone: (id: string) => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

const validCategories: TransactionCategory[] = [
  'salary', 'food', 'transport', 'shopping', 'health', 
  'entertainment', 'bills', 'education', 'investment', 'loan', 'other'
];

const validInvestmentTypes: InvestmentType[] = [
  'tesouro_direto', 'renda_fixa', 'acoes', 'cripto', 'fundos', 'poupanca', 'outros'
];

export function TransactionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const { queue, pendingCount, enqueue, clearQueue, isSyncing, setIsSyncing, syncingRef } = useOfflineQueue();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data when user changes or comes back online
  useEffect(() => {
    if (user) {
      if (isOnline) {
        fetchData();
      } else {
        loadFromCache();
      }
    } else {
      setTransactions([]);
      setReminders([]);
      setInvestments([]);
      setLoading(false);
    }
  }, [user, isOnline]);

  // Sync queue when coming back online
  useEffect(() => {
    if (isOnline && user && pendingCount > 0 && !syncingRef.current) {
      syncQueue();
    }
  }, [isOnline, user, pendingCount]);

  const loadFromCache = () => {
    const cachedTransactions = getOfflineCache<Transaction[]>('transactions');
    const cachedReminders = getOfflineCache<Reminder[]>('reminders');
    const cachedInvestments = getOfflineCache<Investment[]>('investments');
    if (cachedTransactions) setTransactions(cachedTransactions);
    if (cachedReminders) setReminders(cachedReminders);
    if (cachedInvestments) setInvestments(cachedInvestments);
    setLoading(false);
  };

  // Cache data for offline use whenever it changes
  useEffect(() => {
    if (user && transactions.length > 0) setOfflineCache('transactions', transactions);
  }, [transactions, user]);

  useEffect(() => {
    if (user && reminders.length > 0) setOfflineCache('reminders', reminders);
  }, [reminders, user]);

  useEffect(() => {
    if (user && investments.length > 0) setOfflineCache('investments', investments);
  }, [investments, user]);

  // --- Sync queue ---
  const syncQueue = async () => {
    if (!user || syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);

    const currentQueue = [...queue];
    let successCount = 0;

    for (const op of currentQueue) {
      try {
        await processOperation(op);
        successCount++;
      } catch (err) {
        if (import.meta.env.DEV) console.error('Sync error for op:', op.id, err);
        // Stop on first error to maintain order
        break;
      }
    }

    if (successCount > 0) {
      clearQueue();
      // Refresh data from server after sync
      await fetchData();
      toast({
        title: 'Sincronizado!',
        description: `${successCount} operação(ões) sincronizada(s) com sucesso.`,
      });
    }

    syncingRef.current = false;
    setIsSyncing(false);
  };

  const processOperation = async (op: OfflineOperation) => {
    if (!user) return;

    if (op.table === 'transactions') {
      if (op.action === 'insert') {
        const { error } = await supabase.from('transactions').insert({
          user_id: user.id,
          ...op.payload,
        } as any);
        if (error) throw error;
      } else if (op.action === 'update' && op.entityId) {
        const { error } = await supabase.from('transactions').update(op.payload as any).eq('id', op.entityId);
        if (error) throw error;
      } else if (op.action === 'delete' && op.entityId) {
        const { error } = await supabase.from('transactions').delete().eq('id', op.entityId);
        if (error) throw error;
      }
    } else if (op.table === 'reminders') {
      if (op.action === 'insert') {
        const { error } = await supabase.from('reminders').insert({
          user_id: user.id,
          ...op.payload,
        } as any);
        if (error) throw error;
      } else if (op.action === 'update' && op.entityId) {
        const { error } = await supabase.from('reminders').update(op.payload as any).eq('id', op.entityId);
        if (error) throw error;
      } else if (op.action === 'delete' && op.entityId) {
        const { error } = await supabase.from('reminders').delete().eq('id', op.entityId);
        if (error) throw error;
      }
    } else if (op.table === 'investments') {
      if (op.action === 'insert') {
        const { error } = await supabase.from('investments').insert({
          user_id: user.id,
          ...op.payload,
        } as any);
        if (error) throw error;
      } else if (op.action === 'update' && op.entityId) {
        const { error } = await supabase.from('investments').update(op.payload as any).eq('id', op.entityId);
        if (error) throw error;
      } else if (op.action === 'delete' && op.entityId) {
        const { error } = await supabase.from('investments').delete().eq('id', op.entityId);
        if (error) throw error;
      }
    }
  };

  // --- Fetch data ---
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (transactionsData) {
        setTransactions(
          transactionsData.map((t: any) => {
            const category = validCategories.includes(t.category as TransactionCategory) 
              ? (t.category as TransactionCategory) 
              : 'other';
            return {
              id: t.id,
              type: t.type as 'income' | 'expense',
              category,
              amount: Number(t.amount),
              description: t.description,
              date: t.date,
              createdAt: t.created_at,
              isLoan: t.is_loan || false,
              loanPerson: t.loan_person || undefined,
              loanStatus: t.loan_status || undefined,
              loanSettledDate: t.loan_settled_date || undefined,
            };
          })
        );
      }

      const { data: remindersData } = await supabase
        .from('reminders')
        .select('*')
        .order('due_date', { ascending: true });

      if (remindersData) {
        setReminders(
          remindersData.map((r) => {
            const category = validCategories.includes(r.category as TransactionCategory) 
              ? (r.category as TransactionCategory) 
              : 'other';
            return {
              id: r.id,
              title: r.title,
              description: r.title,
              amount: Number(r.amount),
              type: r.is_recurring ? 'monthly' : 'single',
              dueDay: new Date(r.due_date).getDate(),
              category,
              isActive: !r.is_paid,
              createdAt: r.created_at,
            };
          })
        );
      }

      const { data: investmentsData } = await supabase
        .from('investments')
        .select('*')
        .order('created_at', { ascending: false });

      if (investmentsData) {
        setInvestments(
          investmentsData.map((i: any) => {
            const tipo = validInvestmentTypes.includes(i.type as InvestmentType) 
              ? (i.type as InvestmentType) 
              : 'outros';
            return {
              id: i.id,
              nome: i.name,
              tipo,
              valorInvestido: Number(i.initial_value),
              dataInvestimento: i.start_date,
              jaInvestido: i.status === 'completed',
              descricao: i.description || undefined,
              detalhesEspecificos: i.specific_details || undefined,
              createdAt: i.created_at,
            };
          })
        );
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching data:', error);
      loadFromCache();
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD with offline support ---

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!user) return;

    const dbPayload = {
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      date: transaction.date,
      is_loan: transaction.isLoan || false,
      loan_person: transaction.loanPerson || null,
      loan_status: transaction.loanStatus || null,
      loan_settled_date: transaction.loanSettledDate || null,
    };

    if (!isOnline) {
      const tempId = generateTempId();
      const newTransaction: Transaction = {
        id: tempId,
        ...transaction,
        createdAt: new Date().toISOString(),
      };
      setTransactions((prev) => [newTransaction, ...prev]);
      enqueue({ table: 'transactions', action: 'insert', payload: dbPayload, tempId });
      toast({ title: 'Salvo offline', description: 'Será sincronizado quando voltar online.' });
      return tempId;
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert({ user_id: user.id, ...dbPayload })
      .select()
      .single();

    if (error) {
      if (import.meta.env.DEV) console.error('Error adding transaction:', error);
      return;
    }

    if (data) {
      const d = data as any;
      const category = validCategories.includes(d.category as TransactionCategory) 
        ? (d.category as TransactionCategory) : 'other';
      const newTransaction: Transaction = {
        id: d.id, type: d.type as 'income' | 'expense', category,
        amount: Number(d.amount), description: d.description, date: d.date,
        createdAt: d.created_at, isLoan: d.is_loan || false,
        loanPerson: d.loan_person || undefined, loanStatus: d.loan_status || undefined,
        loanSettledDate: d.loan_settled_date || undefined,
      };
      setTransactions((prev) => [newTransaction, ...prev]);
      return d.id;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!user) return;

    const updateData: Record<string, unknown> = {};
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.isLoan !== undefined) updateData.is_loan = updates.isLoan;
    if (updates.loanPerson !== undefined) updateData.loan_person = updates.loanPerson;
    if (updates.loanStatus !== undefined) updateData.loan_status = updates.loanStatus;
    if (updates.loanSettledDate !== undefined) updateData.loan_settled_date = updates.loanSettledDate;

    // Optimistic update
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));

    if (!isOnline) {
      if (!id.startsWith('temp_')) {
        enqueue({ table: 'transactions', action: 'update', payload: updateData, entityId: id });
      }
      return;
    }

    const { error } = await supabase.from('transactions').update(updateData).eq('id', id);
    if (error && import.meta.env.DEV) console.error('Error updating transaction:', error);
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;

    // Optimistic delete
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    if (!isOnline) {
      if (!id.startsWith('temp_')) {
        enqueue({ table: 'transactions', action: 'delete', entityId: id });
      }
      return;
    }

    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error && import.meta.env.DEV) console.error('Error deleting transaction:', error);
  };

  const addReminder = async (reminder: Omit<Reminder, 'id' | 'createdAt'>) => {
    if (!user) return;

    const dueDate = new Date();
    dueDate.setDate(reminder.dueDay || 1);

    const dbPayload = {
      title: reminder.title,
      amount: reminder.amount,
      due_date: dueDate.toISOString().split('T')[0],
      category: reminder.category,
      is_recurring: reminder.type === 'monthly',
      is_paid: !reminder.isActive,
    };

    if (!isOnline) {
      const tempId = generateTempId();
      const newReminder: Reminder = {
        id: tempId, ...reminder, description: reminder.title, createdAt: new Date().toISOString(),
      };
      setReminders((prev) => [newReminder, ...prev]);
      enqueue({ table: 'reminders', action: 'insert', payload: dbPayload, tempId });
      toast({ title: 'Salvo offline', description: 'Será sincronizado quando voltar online.' });
      return;
    }

    const { data, error } = await supabase
      .from('reminders')
      .insert({ user_id: user.id, ...dbPayload })
      .select()
      .single();

    if (error) {
      if (import.meta.env.DEV) console.error('Error adding reminder:', error);
      return;
    }

    if (data) {
      const category = validCategories.includes(data.category as TransactionCategory) 
        ? (data.category as TransactionCategory) : 'other';
      const newReminder: Reminder = {
        id: data.id, title: data.title, description: data.title,
        amount: Number(data.amount), type: data.is_recurring ? 'monthly' : 'single',
        dueDay: new Date(data.due_date).getDate(), category,
        isActive: !data.is_paid, createdAt: data.created_at,
      };
      setReminders((prev) => [newReminder, ...prev]);
    }
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    if (!user) return;

    const updateData: Record<string, unknown> = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.amount) updateData.amount = updates.amount;
    if (updates.category) updateData.category = updates.category;
    if (updates.type) updateData.is_recurring = updates.type === 'monthly';
    if (updates.isActive !== undefined) updateData.is_paid = !updates.isActive;
    if (updates.dueDay) {
      const dueDate = new Date();
      dueDate.setDate(updates.dueDay);
      updateData.due_date = dueDate.toISOString().split('T')[0];
    }

    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));

    if (!isOnline) {
      if (!id.startsWith('temp_')) {
        enqueue({ table: 'reminders', action: 'update', payload: updateData, entityId: id });
      }
      return;
    }

    const { error } = await supabase.from('reminders').update(updateData).eq('id', id);
    if (error && import.meta.env.DEV) console.error('Error updating reminder:', error);
  };

  const deleteReminder = async (id: string) => {
    if (!user) return;

    setReminders((prev) => prev.filter((r) => r.id !== id));

    if (!isOnline) {
      if (!id.startsWith('temp_')) {
        enqueue({ table: 'reminders', action: 'delete', entityId: id });
      }
      return;
    }

    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (error && import.meta.env.DEV) console.error('Error deleting reminder:', error);
  };

  const addInvestment = async (investment: Omit<Investment, 'id' | 'createdAt'>) => {
    if (!user) return;

    const dbPayload = {
      name: investment.nome,
      type: investment.tipo,
      initial_value: investment.valorInvestido,
      current_value: investment.valorInvestido,
      start_date: investment.dataInvestimento,
      status: investment.jaInvestido ? 'completed' : 'active',
      description: investment.descricao || null,
      specific_details: validateInvestmentDetails(investment.tipo, investment.detalhesEspecificos) || null,
    };

    if (!isOnline) {
      const tempId = generateTempId();
      const newInvestment: Investment = {
        id: tempId, ...investment, createdAt: new Date().toISOString(),
      };
      setInvestments((prev) => [newInvestment, ...prev]);
      enqueue({ table: 'investments', action: 'insert', payload: dbPayload, tempId });
      toast({ title: 'Salvo offline', description: 'Será sincronizado quando voltar online.' });
      return;
    }

    const { data, error } = await supabase
      .from('investments')
      .insert({ user_id: user.id, ...dbPayload } as any)
      .select()
      .single();

    if (error) {
      if (import.meta.env.DEV) console.error('Error adding investment:', error);
      return;
    }

    if (data) {
      const d = data as any;
      const tipo = validInvestmentTypes.includes(d.type as InvestmentType) 
        ? (d.type as InvestmentType) : 'outros';
      const newInvestment: Investment = {
        id: d.id, nome: d.name, tipo,
        valorInvestido: Number(d.initial_value), dataInvestimento: d.start_date,
        jaInvestido: d.status === 'completed', descricao: d.description || undefined,
        detalhesEspecificos: d.specific_details || undefined, createdAt: d.created_at,
      };
      setInvestments((prev) => [newInvestment, ...prev]);
    }
  };

  const updateInvestment = async (id: string, updates: Partial<Investment>) => {
    if (!user) return;

    const updateData: Record<string, unknown> = {};
    if (updates.nome !== undefined) updateData.name = updates.nome;
    if (updates.tipo !== undefined) updateData.type = updates.tipo;
    if (updates.valorInvestido !== undefined) {
      updateData.initial_value = updates.valorInvestido;
      updateData.current_value = updates.valorInvestido;
    }
    if (updates.dataInvestimento !== undefined) updateData.start_date = updates.dataInvestimento;
    if (updates.jaInvestido !== undefined) updateData.status = updates.jaInvestido ? 'completed' : 'active';
    if (updates.descricao !== undefined) updateData.description = updates.descricao || null;
    if (updates.detalhesEspecificos !== undefined) {
      const tipo = updates.tipo || investments.find(i => i.id === id)?.tipo || 'outros';
      updateData.specific_details = validateInvestmentDetails(tipo, updates.detalhesEspecificos) || null;
    }

    setInvestments((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));

    if (!isOnline) {
      if (!id.startsWith('temp_')) {
        enqueue({ table: 'investments', action: 'update', payload: updateData, entityId: id });
      }
      return;
    }

    const { error } = await supabase.from('investments').update(updateData).eq('id', id);
    if (error && import.meta.env.DEV) console.error('Error updating investment:', error);
  };

  const deleteInvestment = async (id: string) => {
    if (!user) return;

    setInvestments((prev) => prev.filter((i) => i.id !== id));

    if (!isOnline) {
      if (!id.startsWith('temp_')) {
        enqueue({ table: 'investments', action: 'delete', entityId: id });
      }
      return;
    }

    const { error } = await supabase.from('investments').delete().eq('id', id);
    if (error && import.meta.env.DEV) console.error('Error deleting investment:', error);
  };

  const markInvestmentAsDone = async (id: string) => {
    if (!user) return;

    const investment = investments.find((i) => i.id === id);
    if (!investment || investment.jaInvestido) return;

    const transactionId = await addTransaction({
      type: 'expense',
      category: 'investment',
      amount: investment.valorInvestido,
      description: investment.nome,
      date: new Date().toISOString().split('T')[0],
    });

    if (transactionId) {
      await updateInvestment(id, {
        jaInvestido: true,
        dataInvestimento: new Date().toISOString().split('T')[0],
        transactionId,
      });
    }
  };

  // Derive pending transaction IDs from queue + temp IDs
  const pendingTransactionIds = React.useMemo(() => {
    const ids = new Set<string>();
    // Temp IDs are always pending (offline inserts)
    transactions.forEach(t => {
      if (t.id.startsWith('temp_')) ids.add(t.id);
    });
    // Queue operations on existing entities
    queue.forEach(op => {
      if (op.table === 'transactions' && op.entityId) ids.add(op.entityId);
      if (op.table === 'transactions' && op.tempId) ids.add(op.tempId);
    });
    return ids;
  }, [transactions, queue]);

  return (
    <TransactionContext.Provider
      value={{
        transactions, reminders, investments, loading,
        pendingOpsCount: pendingCount, isSyncing,
        pendingTransactionIds,
        addTransaction, updateTransaction, deleteTransaction,
        addReminder, updateReminder, deleteReminder,
        addInvestment, updateInvestment, deleteInvestment,
        markInvestmentAsDone,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions(): TransactionContextType {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within TransactionProvider');
  }
  return context;
}
