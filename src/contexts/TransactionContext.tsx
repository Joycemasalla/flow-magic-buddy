import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'; // v2
import { Transaction, Reminder, TransactionCategory } from '@/types/transaction';
import { Investment, InvestmentType } from '@/types/investment';
import { validateInvestmentDetails } from '@/lib/investmentValidation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useOnlineStatus, setOfflineCache, getOfflineCache } from '@/hooks/useOffline';
import { useOfflineQueue, generateTempId, OfflineOperation } from '@/hooks/useOfflineQueue';
import { toast } from '@/hooks/use-toast';
import { toLocalDateString } from '@/lib/utils';
import { parseLocalDate } from '@/lib/finance/dates';

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
  markReminderAsPaid: (id: string) => Promise<void>;
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
  const { activeWalletId } = useWallet();
  const isOnline = useOnlineStatus();
  const { queue, pendingCount, enqueue, clearQueue, removeFromQueue, isSyncing, setIsSyncing, syncingRef } = useOfflineQueue();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isOnline, activeWalletId]);

  useEffect(() => {
    if (isOnline && user && pendingCount > 0 && !syncingRef.current) {
      syncQueue();
    }
  }, [isOnline, user, pendingCount]);

  // Realtime sync — re-fetch on any change for collaborative wallets and own data
  useEffect(() => {
    if (!user || !isOnline) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetchData(), 400);
    };

    const channel = supabase
      .channel(`scope-${activeWalletId || 'personal'}-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, scheduleRefetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders' }, scheduleRefetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investments' }, scheduleRefetch)
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isOnline, activeWalletId]);

  const cacheKey = (base: string) => `${base}__${activeWalletId || 'personal'}`;

  const loadFromCache = () => {
    const cachedTransactions = getOfflineCache<Transaction[]>(cacheKey('transactions'));
    const cachedReminders = getOfflineCache<Reminder[]>(cacheKey('reminders'));
    const cachedInvestments = getOfflineCache<Investment[]>(cacheKey('investments'));
    setTransactions(cachedTransactions || []);
    setReminders(cachedReminders || []);
    setInvestments(cachedInvestments || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) setOfflineCache(cacheKey('transactions'), transactions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, user, activeWalletId]);

  useEffect(() => {
    if (user) setOfflineCache(cacheKey('reminders'), reminders);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders, user, activeWalletId]);

  useEffect(() => {
    if (user) setOfflineCache(cacheKey('investments'), investments);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investments, user, activeWalletId]);

  const syncQueue = async () => {
    if (!user || syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);

    const currentQueue = [...queue];
    let successCount = 0;

    for (const op of currentQueue) {
      try {
        await processOperation(op);
        removeFromQueue(op.id);
        successCount++;
      } catch (err) {
        if (import.meta.env.DEV) console.error('Sync error for op:', op.id, err);
        break;
      }
    }

    if (successCount > 0) {
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

  // CORREÇÃO PRINCIPAL:
  // As novas políticas RLS usam auth.uid() internamente via SECURITY DEFINER.
  // NÃO devemos passar user_id como filtro explícito na query — isso conflita
  // com o RLS e causa 403. Deixar o RLS filtrar automaticamente.
  // Para modo pessoal: filtrar apenas wallet_id IS NULL.
  // Para modo carteira: filtrar apenas wallet_id = activeWalletId.
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // ---- TRANSACTIONS ----
      let transactionsQuery = supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (activeWalletId) {
        transactionsQuery = transactionsQuery.eq('wallet_id', activeWalletId);
      } else {
        // Modo pessoal: apenas registros sem wallet
        // O RLS garante que só retorna registros do usuário autenticado
        transactionsQuery = transactionsQuery.is('wallet_id', null);
      }

      const { data: transactionsData, error: transactionsError } = await transactionsQuery;

      if (transactionsError) {
        if (import.meta.env.DEV) console.error('Error fetching transactions:', transactionsError);
      }

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
              loanPaidAmount: t.loan_paid_amount != null ? Number(t.loan_paid_amount) : 0,
              accountId: t.account_id || null,
              isTransfer: t.is_transfer || false,
              linkedTransactionId: t.linked_transaction_id || undefined,
            };
          })
        );
      }

      // ---- REMINDERS ----
      let remindersQuery = supabase
        .from('reminders')
        .select('*')
        .order('due_date', { ascending: true });

      if (activeWalletId) {
        remindersQuery = remindersQuery.eq('wallet_id', activeWalletId);
      } else {
        remindersQuery = remindersQuery.is('wallet_id', null);
      }

      const { data: remindersData, error: remindersError } = await remindersQuery;

      if (remindersError) {
        if (import.meta.env.DEV) console.error('Error fetching reminders:', remindersError);
      }

      if (remindersData) {
        setReminders(
          remindersData.map((r: any) => {
            const category = validCategories.includes(r.category as TransactionCategory) 
              ? (r.category as TransactionCategory) 
              : 'other';
            return {
              id: r.id,
              title: r.title,
              description: r.title,
              amount: Number(r.amount),
              type: r.is_recurring ? 'monthly' as const : 'single' as const,
              dueDay: parseLocalDate(r.due_date).getDate(),
              category,
              isActive: !r.is_paid,
              alertDaysBefore: r.alert_days_before ?? 3,
              lastPaidMonth: r.last_paid_month ?? null,
              createdAt: r.created_at,
            };
          })
        );
      }

      // ---- INVESTMENTS ----
      let investmentsQuery = supabase
        .from('investments')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeWalletId) {
        investmentsQuery = investmentsQuery.eq('wallet_id', activeWalletId);
      } else {
        investmentsQuery = investmentsQuery.is('wallet_id', null);
      }

      const { data: investmentsData, error: investmentsError } = await investmentsQuery;

      if (investmentsError) {
        if (import.meta.env.DEV) console.error('Error fetching investments:', investmentsError);
      }

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
      loan_paid_amount: transaction.loanPaidAmount ?? 0,
      account_id: transaction.accountId || null,
      is_transfer: transaction.isTransfer || false,
      linked_transaction_id: transaction.linkedTransactionId || null,
      wallet_id: activeWalletId || null,
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
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
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
        loanPaidAmount: d.loan_paid_amount != null ? Number(d.loan_paid_amount) : 0,
        accountId: d.account_id || null,
        isTransfer: d.is_transfer || false,
        linkedTransactionId: d.linked_transaction_id || undefined,
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
    if (updates.loanPaidAmount !== undefined) updateData.loan_paid_amount = updates.loanPaidAmount;
    if (updates.accountId !== undefined) updateData.account_id = updates.accountId;
    if (updates.isTransfer !== undefined) updateData.is_transfer = updates.isTransfer;
    if (updates.linkedTransactionId !== undefined) updateData.linked_transaction_id = updates.linkedTransactionId;

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

    const tToDelete = transactions.find((t) => t.id === id);
    const linkedId = tToDelete?.linkedTransactionId;
    const isParent = transactions.some((t) => t.linkedTransactionId === id);

    setTransactions((prev) => prev.filter((t) => t.id !== id && t.linkedTransactionId !== id && t.id !== linkedId));

    if (!isOnline) {
      if (!id.startsWith('temp_')) {
        enqueue({ table: 'transactions', action: 'delete', entityId: id });
        if (linkedId && !linkedId.startsWith('temp_')) {
           enqueue({ table: 'transactions', action: 'delete', entityId: linkedId });
        }
      }
      return;
    }

    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error && import.meta.env.DEV) console.error('Error deleting transaction:', error);
    
    if (linkedId) {
      const { error: err2 } = await supabase.from('transactions').delete().eq('id', linkedId);
      if (err2 && import.meta.env.DEV) console.error('Error deleting linked transaction:', err2);
    }
  };

  const addReminder = async (reminder: Omit<Reminder, 'id' | 'createdAt'>) => {
    if (!user) return;

    const dueDate = new Date();
    dueDate.setDate(reminder.dueDay || 1);

    const dbPayload = {
      title: reminder.title,
      amount: reminder.amount,
      due_date: toLocalDateString(dueDate),
      category: reminder.category,
      is_recurring: reminder.type === 'monthly',
      is_paid: !reminder.isActive,
      alert_days_before: reminder.alertDaysBefore ?? 3,
      last_paid_month: reminder.lastPaidMonth ?? null,
      wallet_id: activeWalletId || null,
    };

    if (!isOnline) {
      const tempId = generateTempId();
      const newReminder: Reminder = {
        id: tempId, ...reminder, description: reminder.title,
        alertDaysBefore: reminder.alertDaysBefore ?? 3,
        lastPaidMonth: reminder.lastPaidMonth ?? null,
        createdAt: new Date().toISOString(),
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
      const d = data as any;
      const category = validCategories.includes(d.category as TransactionCategory) 
        ? (d.category as TransactionCategory) : 'other';
      const newReminder: Reminder = {
        id: d.id, title: d.title, description: d.title,
        amount: Number(d.amount), type: d.is_recurring ? 'monthly' : 'single',
        dueDay: parseLocalDate(d.due_date).getDate(), category,
        isActive: !d.is_paid,
        alertDaysBefore: d.alert_days_before ?? 3,
        lastPaidMonth: d.last_paid_month ?? null,
        lastTransactionId: d.last_transaction_id ?? null,
        createdAt: d.created_at,
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
    if (updates.alertDaysBefore !== undefined) updateData.alert_days_before = updates.alertDaysBefore;
    if (updates.lastPaidMonth !== undefined) updateData.last_paid_month = updates.lastPaidMonth;
    if (updates.lastTransactionId !== undefined) updateData.last_transaction_id = updates.lastTransactionId;
    if (updates.dueDay) {
      const dueDate = new Date();
      dueDate.setDate(updates.dueDay);
      updateData.due_date = toLocalDateString(dueDate);
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

  const markReminderAsPaid = async (id: string) => {
    const reminder = reminders.find((r) => r.id === id);
    if (!reminder || !user) return;

    const transactionId = await addTransaction({
      type: 'expense',
      category: reminder.category,
      amount: reminder.amount,
      description: reminder.title,
      date: toLocalDateString(),
      isLoan: false,
      accountId: activeWalletId || undefined, // vincula a carteira se estiver em uma
    });

    // Marca o mês atual como pago. No próximo mês o gasto reaparece automaticamente
    // (porque last_paid_month != mês corrente).
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await updateReminder(id, { lastPaidMonth: currentMonth, lastTransactionId: transactionId });

    toast({
      title: 'Gasto pago!',
      description: `Despesa de R$ ${reminder.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} registrada. Volta a lembrar mês que vem.`,
    });
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
      wallet_id: activeWalletId || null,
      transaction_id: investment.transactionId || null,
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
        transactionId: d.transaction_id || undefined,
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
    if (updates.transactionId !== undefined) {
      updateData.transaction_id = updates.transactionId;
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

    const investment = investments.find((i) => i.id === id);
    setInvestments((prev) => prev.filter((i) => i.id !== id));

    if (investment?.transactionId) {
      await deleteTransaction(investment.transactionId);
    }

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
      date: toLocalDateString(),
    });

    if (transactionId) {
      await updateInvestment(id, {
        jaInvestido: true,
        dataInvestimento: toLocalDateString(),
        transactionId,
      });
    }
  };

  const pendingTransactionIds = React.useMemo(() => {
    const ids = new Set<string>();
    transactions.forEach(t => {
      if (t.id.startsWith('temp_')) ids.add(t.id);
    });
    queue.forEach(op => {
      if (op.table === 'transactions' && op.entityId) ids.add(op.entityId);
      if (op.table === 'transactions' && op.tempId) ids.add(op.tempId);
    });
    return ids;
  }, [transactions, queue]);

  const contextValue = React.useMemo(
    () => ({
      transactions, reminders, investments, loading,
      pendingOpsCount: pendingCount, isSyncing,
      pendingTransactionIds,
      addTransaction, updateTransaction, deleteTransaction,
      addReminder, updateReminder, deleteReminder, markReminderAsPaid,
      addInvestment, updateInvestment, deleteInvestment,
      markInvestmentAsDone,
    }),
    [transactions, reminders, investments, loading, pendingCount, isSyncing, pendingTransactionIds,
     addTransaction, updateTransaction, deleteTransaction,
     addReminder, updateReminder, deleteReminder, markReminderAsPaid,
     addInvestment, updateInvestment, deleteInvestment, markInvestmentAsDone]
  );

  return (
    <TransactionContext.Provider value={contextValue}>
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