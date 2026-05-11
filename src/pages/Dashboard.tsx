import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useTransactions } from '@/contexts/TransactionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { isToday, subDays, startOfMonth, startOfYear, isWithinInterval, startOfDay, endOfDay, subMonths, subYears, endOfMonth, endOfYear } from 'date-fns';
import SummaryCards from '@/components/dashboard/SummaryCards';
import CategoryChart from '@/components/dashboard/CategoryChart';
import EvolutionChart from '@/components/dashboard/EvolutionChart';
import TransactionList from '@/components/dashboard/TransactionList';
import InvestmentSummary from '@/components/dashboard/InvestmentSummary';
import AccountsSummary from '@/components/dashboard/AccountsSummary';
import ProfileSwitcher from '@/components/ProfileSwitcher';
import ReportModal from '@/components/modals/ReportModal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Landmark, Handshake } from 'lucide-react';

type PeriodFilter = 'today' | 'week' | 'month' | 'year' | 'all';
type TypeFilter = 'all' | 'income' | 'expense';
type ProfileMode = 'personal' | 'couple';

const periodLabels: Record<PeriodFilter, string> = {
  today: 'Hoje',
  week: '7 dias',
  month: 'Mês',
  year: 'Ano',
  all: 'Tudo',
};

const typeLabels: Record<TypeFilter, string> = {
  all: 'Todos',
  income: 'Receitas',
  expense: 'Despesas',
};

export default function Dashboard() {
  const { transactions, investments, deleteTransaction, pendingTransactionIds } = useTransactions();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [showCharts, setShowCharts] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [includeInvestments, setIncludeInvestments] = useState(true);
  const [includeLoans, setIncludeLoans] = useState(true);
  const { activeWalletId, wallets } = useWallet();
  const activeWallet = wallets.find((w) => w.id === activeWalletId);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const tDate = new Date(t.date + 'T12:00:00');
      const now = new Date();

      // Filtro por tipo
      if (typeFilter !== 'all' && t.type !== typeFilter) {
        return false;
      }

      // Filtro por período
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
  }, [transactions, periodFilter, typeFilter]);

  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => {
        if (t.type !== 'income') return false;
        if (t.isLoan && t.loanStatus === 'paid') return false;
        if (!includeLoans && t.isLoan) return false;
        return true;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = filteredTransactions
      .filter((t) => {
        if (t.type !== 'expense') return false;
        if (t.isLoan && t.loanStatus === 'received') return false;
        if (!includeInvestments && t.category === 'investment') return false;
        if (!includeLoans && t.isLoan) return false;
        return true;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    // Calcula valores excluídos para exibir info
    const excludedInvestments = !includeInvestments
      ? filteredTransactions
          .filter((t) => t.type === 'expense' && t.category === 'investment' && !(t.isLoan && t.loanStatus === 'received'))
          .reduce((sum, t) => sum + t.amount, 0)
      : 0;

    const excludedLoans = !includeLoans
      ? filteredTransactions
          .filter((t) => t.isLoan && !(t.type === 'expense' && t.loanStatus === 'received') && !(t.type === 'income' && t.loanStatus === 'paid'))
          .reduce((sum, t) => sum + t.amount, 0)
      : 0;

    return {
      income,
      expense,
      balance: income - expense,
      count: filteredTransactions.length,
      excludedInvestments,
      excludedLoans,
    };
  }, [filteredTransactions, includeInvestments, includeLoans]);

  // Previous-period comparison (only meaningful for month/year)
  const previousStats = useMemo(() => {
    if (periodFilter !== 'month' && periodFilter !== 'year') return null;
    const now = new Date();
    const prevStart = periodFilter === 'month' ? startOfMonth(subMonths(now, 1)) : startOfYear(subYears(now, 1));
    const prevEnd = periodFilter === 'month' ? endOfMonth(subMonths(now, 1)) : endOfYear(subYears(now, 1));

    const prev = transactions.filter((t) => {
      const tDate = new Date(t.date + 'T12:00:00');
      return isWithinInterval(tDate, { start: prevStart, end: prevEnd });
    });

    const income = prev
      .filter((t) => t.type === 'income' && !(t.isLoan && t.loanStatus === 'paid') && (includeLoans || !t.isLoan))
      .reduce((s, t) => s + t.amount, 0);
    const expense = prev
      .filter(
        (t) =>
          t.type === 'expense' &&
          !(t.isLoan && t.loanStatus === 'received') &&
          (includeInvestments || t.category !== 'investment') &&
          (includeLoans || !t.isLoan)
      )
      .reduce((s, t) => s + t.amount, 0);
    return { income, expense };
  }, [transactions, periodFilter, includeInvestments, includeLoans]);

  const comparisonLabel =
    periodFilter === 'month' ? 'vs mês passado' : periodFilter === 'year' ? 'vs ano passado' : undefined;

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
    <div className="space-y-4 sm:space-y-5 max-w-full overflow-hidden pb-28 lg:pb-4">
      {/* Header with Profile Switcher */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4 flex-wrap"
      >
        <div className="flex-1">
          <h1 className="text-xl lg:text-2xl font-display font-bold">
            Olá{(() => {
              const name = user?.user_metadata?.full_name || user?.user_metadata?.name || '';
              return name ? `, ${name.split(' ')[0]}` : '';
            })()}! 👋
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {activeWallet ? activeWallet.name : 'Minha carteira'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ProfileSwitcher />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReportOpen(true)}
            className="min-h-[44px] px-4 rounded-2xl"
          >
            <Download className="w-4 h-4 mr-2 stroke-[1.5]" />
            <span className="hidden sm:inline text-xs">Exportar</span>
          </Button>
        </div>
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
              'px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all min-h-[40px] active:scale-95 border',
              periodFilter === period
                ? 'bg-gradient-primary text-primary-foreground border-transparent shadow-glow'
                : 'glass-card text-muted-foreground border-border/40 hover:text-foreground'
            )}
          >
            {periodLabels[period]}
          </button>
        ))}
      </motion.div>

      {/* Type Filter Pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
      >
        {(Object.keys(typeLabels) as TypeFilter[]).map((type) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={cn(
              'px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all min-h-[40px] active:scale-95 border',
              typeFilter === type
                ? type === 'income'
                  ? 'bg-income text-income-foreground border-transparent'
                  : type === 'expense'
                    ? 'bg-expense text-expense-foreground border-transparent'
                    : 'bg-gradient-primary text-primary-foreground border-transparent shadow-glow'
                : 'glass-card text-muted-foreground border-border/40 hover:text-foreground'
            )}
          >
            {typeLabels[type]}
          </button>
        ))}
      </motion.div>

      {/* Summary Cards */}
      <SummaryCards
        income={stats.income}
        expense={stats.expense}
        balance={stats.balance}
        transactionCount={stats.count}
        onIncomeClick={() => setTypeFilter('income')}
        onExpenseClick={() => setTypeFilter('expense')}
        previousIncome={previousStats?.income}
        previousExpense={previousStats?.expense}
        comparisonLabel={comparisonLabel}
      />

      {/* Filtros de visualização */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 flex-wrap"
      >
        <button
          onClick={() => setIncludeInvestments(!includeInvestments)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all min-h-[36px] active:scale-95 border',
            includeInvestments
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'bg-muted text-muted-foreground border-transparent'
          )}
        >
          {includeInvestments ? <Check className="w-3 h-3" /> : <Landmark className="w-3 h-3" />}
          Investimentos
        </button>
        <button
          onClick={() => setIncludeLoans(!includeLoans)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all min-h-[36px] active:scale-95 border',
            includeLoans
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'bg-muted text-muted-foreground border-transparent'
          )}
        >
          {includeLoans ? <Check className="w-3 h-3" /> : <Handshake className="w-3 h-3" />}
          Empréstimos
        </button>
        {(!includeInvestments || !includeLoans) && (
          <span className="text-[10px] text-muted-foreground self-center ml-1">
            {!includeInvestments && stats.excludedInvestments > 0 && `-R$ ${stats.excludedInvestments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} invest.`}
            {!includeInvestments && !includeLoans && stats.excludedInvestments > 0 && stats.excludedLoans > 0 && ' | '}
            {!includeLoans && stats.excludedLoans > 0 && `-R$ ${stats.excludedLoans.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} emprést.`}
          </span>
        )}
      </motion.div>

      {/* Investment Summary - Compact */}
      <InvestmentSummary investments={investments} />

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
        pendingIds={pendingTransactionIds}
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
