import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { useTransactions } from '@/contexts/TransactionContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { isToday, isYesterday, subDays, startOfMonth, startOfYear, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import SummaryCards from '@/components/dashboard/SummaryCards';
import CategoryChart from '@/components/dashboard/CategoryChart';
import EvolutionChart from '@/components/dashboard/EvolutionChart';
import TransactionList from '@/components/dashboard/TransactionList';
import { cn } from '@/lib/utils';

type PeriodFilter = 'today' | 'week' | 'month' | 'year' | 'all';

const periodLabels: Record<PeriodFilter, string> = {
  today: 'Hoje',
  week: '7 dias',
  month: 'Mês',
  year: 'Ano',
  all: 'Tudo',
};

export default function Dashboard() {
  const { transactions, deleteTransaction } = useTransactions();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const tDate = new Date(t.date);
      const now = new Date();

      switch (periodFilter) {
        case 'today':
          return isToday(tDate);
        case 'week':
          return isWithinInterval(tDate, {
            start: startOfDay(subDays(now, 7)),
            end: endOfDay(now),
          });
        case 'month':
          return isWithinInterval(tDate, {
            start: startOfMonth(now),
            end: endOfDay(now),
          });
        case 'year':
          return isWithinInterval(tDate, {
            start: startOfYear(now),
            end: endOfDay(now),
          });
        default:
          return true;
      }
    });
  }, [transactions, periodFilter]);

  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expense,
      balance: income - expense,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  const handleEdit = (id: string) => {
    navigate(`/transacoes/editar/${id}`);
  };

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    toast({
      title: 'Transação excluída',
      description: 'A transação foi removida.',
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl lg:text-2xl font-display font-bold">Olá! 👋</h1>
          <p className="text-sm text-muted-foreground">
            Suas finanças em dia
          </p>
        </div>
      </motion.div>

      {/* Period Filter Pills - Horizontal Scroll */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide"
      >
        {(Object.keys(periodLabels) as PeriodFilter[]).map((period) => (
          <button
            key={period}
            onClick={() => setPeriodFilter(period)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
              periodFilter === period
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {periodLabels[period]}
          </button>
        ))}
      </motion.div>

      {/* Summary Cards */}
      <SummaryCards
        income={stats.income}
        expense={stats.expense}
        balance={stats.balance}
        transactionCount={stats.count}
      />

      {/* Charts - Collapsed by default on mobile */}
      <div className="hidden lg:grid lg:grid-cols-2 gap-6">
        <CategoryChart transactions={filteredTransactions} />
        <EvolutionChart transactions={transactions} />
      </div>

      {/* Transaction List */}
      <TransactionList
        transactions={filteredTransactions}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
