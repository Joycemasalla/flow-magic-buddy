import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useTransactions } from '@/contexts/TransactionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { isToday, isYesterday, subDays, startOfMonth, startOfYear, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import SummaryCards from '@/components/dashboard/SummaryCards';
import CategoryChart from '@/components/dashboard/CategoryChart';
import EvolutionChart from '@/components/dashboard/EvolutionChart';
import TransactionList from '@/components/dashboard/TransactionList';
import ReportModal from '@/components/modals/ReportModal';
import { Button } from '@/components/ui/button';
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [showCharts, setShowCharts] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

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
    <div className="space-y-4 sm:space-y-5 max-w-full overflow-hidden pb-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl lg:text-2xl font-display font-bold">
            Olá{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''}! 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Suas finanças em dia
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsReportOpen(true)}
          className="min-h-[44px] px-4"
        >
          <Download className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </motion.div>

      {/* Period Filter Pills - Horizontal Scroll */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
      >
        {(Object.keys(periodLabels) as PeriodFilter[]).map((period) => (
          <button
            key={period}
            onClick={() => setPeriodFilter(period)}
            className={cn(
              'px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all min-h-[40px] sm:min-h-[44px] active:scale-95',
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

      {/* Charts - Collapsible on mobile */}
      <div className="space-y-4">
        {/* Mobile Toggle */}
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="lg:hidden w-full flex items-center justify-between px-4 py-3 bg-muted/50 rounded-xl text-sm font-medium min-h-[44px] active:scale-[0.98] transition-transform"
        >
          <span>Ver Gráficos</span>
          {showCharts ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {/* Mobile Charts (Collapsible) */}
        <AnimatePresence>
          {showCharts && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden space-y-4"
            >
              <CategoryChart transactions={filteredTransactions} compact />
              <EvolutionChart transactions={transactions} compact />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Charts */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-6">
          <CategoryChart transactions={filteredTransactions} />
          <EvolutionChart transactions={transactions} />
        </div>
      </div>

      {/* Transaction List */}
      <TransactionList
        transactions={filteredTransactions}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        transactions={filteredTransactions}
        stats={stats}
        period={periodLabels[periodFilter]}
      />
    </div>
  );
}
