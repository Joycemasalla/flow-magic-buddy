import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, Reminder, TransactionCategory } from '@/types/transaction';
import { Investment, InvestmentType } from '@/types/investment';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TransactionContextType {
  transactions: Transaction[];
  reminders: Reminder[];
  investments: Investment[];
  loading: boolean;
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data when user changes
  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setTransactions([]);
      setReminders([]);
      setInvestments([]);
      setLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch transactions
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
            };
          })
        );
      }

      // Fetch reminders
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

      // Fetch investments
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
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        date: transaction.date,
        is_loan: transaction.isLoan || false,
        loan_person: transaction.loanPerson || null,
        loan_status: transaction.loanStatus || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding transaction:', error);
      return;
    }

    if (data) {
      const d = data as any;
      const category = validCategories.includes(d.category as TransactionCategory) 
        ? (d.category as TransactionCategory) 
        : 'other';
      const newTransaction: Transaction = {
        id: d.id,
        type: d.type as 'income' | 'expense',
        category,
        amount: Number(d.amount),
        description: d.description,
        date: d.date,
        createdAt: d.created_at,
        isLoan: d.is_loan || false,
        loanPerson: d.loan_person || undefined,
        loanStatus: d.loan_status || undefined,
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

    const { error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating transaction:', error);
      return;
    }

    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting transaction:', error);
      return;
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const addReminder = async (reminder: Omit<Reminder, 'id' | 'createdAt'>) => {
    if (!user) return;

    const dueDate = new Date();
    dueDate.setDate(reminder.dueDay || 1);

    const { data, error } = await supabase
      .from('reminders')
      .insert({
        user_id: user.id,
        title: reminder.title,
        amount: reminder.amount,
        due_date: dueDate.toISOString().split('T')[0],
        category: reminder.category,
        is_recurring: reminder.type === 'monthly',
        is_paid: !reminder.isActive,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding reminder:', error);
      return;
    }

    if (data) {
      const category = validCategories.includes(data.category as TransactionCategory) 
        ? (data.category as TransactionCategory) 
        : 'other';
      const newReminder: Reminder = {
        id: data.id,
        title: data.title,
        description: data.title,
        amount: Number(data.amount),
        type: data.is_recurring ? 'monthly' : 'single',
        dueDay: new Date(data.due_date).getDate(),
        category,
        isActive: !data.is_paid,
        createdAt: data.created_at,
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

    const { error } = await supabase
      .from('reminders')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating reminder:', error);
      return;
    }

    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const deleteReminder = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting reminder:', error);
      return;
    }

    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const addInvestment = async (investment: Omit<Investment, 'id' | 'createdAt'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('investments')
      .insert({
        user_id: user.id,
        name: investment.nome,
        type: investment.tipo,
        initial_value: investment.valorInvestido,
        current_value: investment.valorInvestido,
        start_date: investment.dataInvestimento,
        status: investment.jaInvestido ? 'completed' : 'active',
        description: investment.descricao || null,
        specific_details: investment.detalhesEspecificos as unknown || null,
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error adding investment:', error);
      return;
    }

    if (data) {
      const d = data as any;
      const tipo = validInvestmentTypes.includes(d.type as InvestmentType) 
        ? (d.type as InvestmentType) 
        : 'outros';
      const newInvestment: Investment = {
        id: d.id,
        nome: d.name,
        tipo,
        valorInvestido: Number(d.initial_value),
        dataInvestimento: d.start_date,
        jaInvestido: d.status === 'completed',
        descricao: d.description || undefined,
        detalhesEspecificos: d.specific_details || undefined,
        createdAt: d.created_at,
      };
      setInvestments((prev) => [newInvestment, ...prev]);
    }
  };

  const updateInvestment = async (id: string, updates: Partial<Investment>) => {
    if (!user) return;

    const updateData: Record<string, unknown> = {};
    if (updates.nome) updateData.name = updates.nome;
    if (updates.tipo) updateData.type = updates.tipo;
    if (updates.valorInvestido) {
      updateData.initial_value = updates.valorInvestido;
      updateData.current_value = updates.valorInvestido;
    }
    if (updates.dataInvestimento) updateData.start_date = updates.dataInvestimento;
    if (updates.jaInvestido !== undefined) updateData.status = updates.jaInvestido ? 'completed' : 'active';
    if (updates.descricao !== undefined) updateData.description = updates.descricao || null;

    const { error } = await supabase
      .from('investments')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating investment:', error);
      return;
    }

    setInvestments((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
  };

  const deleteInvestment = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('investments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting investment:', error);
      return;
    }

    setInvestments((prev) => prev.filter((i) => i.id !== id));
  };

  const markInvestmentAsDone = async (id: string) => {
    if (!user) return;

    const investment = investments.find((i) => i.id === id);
    if (!investment || investment.jaInvestido) return;

    // Create expense transaction
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

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        reminders,
        investments,
        loading,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addReminder,
        updateReminder,
        deleteReminder,
        addInvestment,
        updateInvestment,
        deleteInvestment,
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
