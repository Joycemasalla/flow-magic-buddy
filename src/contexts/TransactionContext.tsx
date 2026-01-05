import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, Reminder } from '@/types/transaction';
import { Investment } from '@/types/investment';

interface TransactionContextType {
  transactions: Transaction[];
  reminders: Reminder[];
  investments: Investment[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => void;
  updateReminder: (id: string, reminder: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  addInvestment: (investment: Omit<Investment, 'id' | 'createdAt'>) => void;
  updateInvestment: (id: string, investment: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;
  markInvestmentAsDone: (id: string) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

const TRANSACTIONS_KEY = 'moneyflow_transactions';
const REMINDERS_KEY = 'moneyflow_reminders';
const INVESTMENTS_KEY = 'moneyflow_investments';

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

const sampleInvestments: Investment[] = [
  {
    id: '1',
    nome: 'Tesouro IPCA+ 2035',
    tipo: 'tesouro_direto',
    valorInvestido: 1000,
    dataInvestimento: new Date().toISOString().split('T')[0],
    jaInvestido: false,
    descricao: 'Aposentadoria',
    detalhesEspecificos: {
      titulo: 'IPCA+ 2035',
      taxa: 6.5,
      precoUnitario: 2850.45,
      vencimento: '2035-05-15',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    nome: 'PETR4',
    tipo: 'acoes',
    valorInvestido: 3550,
    dataInvestimento: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    jaInvestido: true,
    descricao: 'Ações Petrobras',
    detalhesEspecificos: {
      ticker: 'PETR4',
      quantidade: 100,
      precoMedio: 35.50,
    },
    createdAt: new Date().toISOString(),
  },
];

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);

  useEffect(() => {
    const storedTransactions = localStorage.getItem(TRANSACTIONS_KEY);
    const storedReminders = localStorage.getItem(REMINDERS_KEY);
    const storedInvestments = localStorage.getItem(INVESTMENTS_KEY);
    
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

    if (storedInvestments) {
      setInvestments(JSON.parse(storedInvestments));
    } else {
      setInvestments(sampleInvestments);
      localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(sampleInvestments));
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

  const saveInvestments = (newInvestments: Investment[]) => {
    setInvestments(newInvestments);
    localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(newInvestments));
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    saveTransactions([newTransaction, ...transactions]);
    return newTransaction.id;
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

  const addInvestment = (investment: Omit<Investment, 'id' | 'createdAt'>) => {
    const newInvestment: Investment = {
      ...investment,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    saveInvestments([newInvestment, ...investments]);
  };

  const updateInvestment = (id: string, updates: Partial<Investment>) => {
    const updated = investments.map((i) =>
      i.id === id ? { ...i, ...updates } : i
    );
    saveInvestments(updated);
  };

  const deleteInvestment = (id: string) => {
    const investment = investments.find((i) => i.id === id);
    if (investment?.transactionId) {
      deleteTransaction(investment.transactionId);
    }
    saveInvestments(investments.filter((i) => i.id !== id));
  };

  const markInvestmentAsDone = (id: string) => {
    const investment = investments.find((i) => i.id === id);
    if (!investment || investment.jaInvestido) return;

    // Create expense transaction
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      type: 'expense',
      category: 'investment',
      amount: investment.valorInvestido,
      description: investment.nome,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    saveTransactions([newTransaction, ...transactions]);

    // Update investment
    const updated = investments.map((i) =>
      i.id === id
        ? {
            ...i,
            jaInvestido: true,
            dataInvestimento: new Date().toISOString().split('T')[0],
            transactionId: newTransaction.id,
          }
        : i
    );
    saveInvestments(updated);
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        reminders,
        investments,
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

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within TransactionProvider');
  }
  return context;
}
