import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, Reminder } from '@/types/transaction';

interface TransactionContextType {
  transactions: Transaction[];
  reminders: Reminder[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => void;
  updateReminder: (id: string, reminder: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

const TRANSACTIONS_KEY = 'moneyflow_transactions';
const REMINDERS_KEY = 'moneyflow_reminders';

// Sample data for demo
const sampleTransactions: Transaction[] = [
  {
    id: '1',
    type: 'income',
    category: 'salary',
    amount: 5000,
    description: 'Salário mensal',
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'expense',
    category: 'food',
    amount: 250,
    description: 'Supermercado',
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    type: 'expense',
    category: 'transport',
    amount: 150,
    description: 'Combustível',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    type: 'expense',
    category: 'bills',
    amount: 180,
    description: 'Conta de luz',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    type: 'income',
    category: 'other',
    amount: 500,
    description: 'Freelance',
    date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  },
  {
    id: '6',
    type: 'expense',
    category: 'entertainment',
    amount: 80,
    description: 'Cinema e jantar',
    date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  },
  {
    id: '7',
    type: 'expense',
    category: 'health',
    amount: 200,
    description: 'Farmácia',
    date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  },
];

const sampleReminders: Reminder[] = [
  {
    id: '1',
    title: 'Internet',
    description: 'Conta mensal de internet',
    amount: 120,
    type: 'monthly',
    dueDay: 10,
    category: 'bills',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Academia',
    description: 'Mensalidade da academia',
    amount: 90,
    type: 'monthly',
    dueDay: 5,
    category: 'health',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    const storedTransactions = localStorage.getItem(TRANSACTIONS_KEY);
    const storedReminders = localStorage.getItem(REMINDERS_KEY);
    
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    } else {
      setTransactions(sampleTransactions);
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(sampleTransactions));
    }
    
    if (storedReminders) {
      setReminders(JSON.parse(storedReminders));
    } else {
      setReminders(sampleReminders);
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(sampleReminders));
    }
  }, []);

  const saveTransactions = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(newTransactions));
  };

  const saveReminders = (newReminders: Reminder[]) => {
    setReminders(newReminders);
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(newReminders));
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    saveTransactions([newTransaction, ...transactions]);
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    const updated = transactions.map((t) =>
      t.id === id ? { ...t, ...updates } : t
    );
    saveTransactions(updated);
  };

  const deleteTransaction = (id: string) => {
    saveTransactions(transactions.filter((t) => t.id !== id));
  };

  const addReminder = (reminder: Omit<Reminder, 'id' | 'createdAt'>) => {
    const newReminder: Reminder = {
      ...reminder,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    saveReminders([newReminder, ...reminders]);
  };

  const updateReminder = (id: string, updates: Partial<Reminder>) => {
    const updated = reminders.map((r) =>
      r.id === id ? { ...r, ...updates } : r
    );
    saveReminders(updated);
  };

  const deleteReminder = (id: string) => {
    saveReminders(reminders.filter((r) => r.id !== id));
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        reminders,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addReminder,
        updateReminder,
        deleteReminder,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within TransactionProvider');
  }
  return context;
}