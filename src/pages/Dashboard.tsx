import { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Filter, ChevronDown } from 'lucide-react';
import { useTransactions } from '@/contexts/TransactionContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { isToday, isYesterday, subDays, startOfMonth, startOfYear, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import SummaryCards from '@/components/dashboard/SummaryCards';
import CategoryChart from '@/components/dashboard/CategoryChart';
import EvolutionChart from '@/components/dashboard/EvolutionChart';
import TransactionList from '@/components/dashboard/TransactionList';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

type PeriodFilter = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'all';
type TypeFilter = 'all' | 'income' | 'expense';

export default function Dashboard() {
  const { transactions, deleteTransaction } = useTransactions();
  const navigate = useNavigate();
  const { toast } = useToast();
  const transactionListRef = useRef<HTMLDivElement>(null);
  
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Type filter
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;

      // Period filter
      const tDate = new Date(t.date);
      const now = new Date();

      switch (periodFilter) {
        case 'today':
          return isToday(tDate);
        case 'yesterday':
          return isYesterday(tDate);
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
      description: 'A transação foi removida com sucesso.',
    });
  };

  const scrollToTransactions = () => {
    transactionListRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Acompanhe suas finanças em tempo real
          </p>
        </motion.div>

        {/* Desktop Filters */}
        <div className="hidden lg:flex items-center gap-3">
          <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="yesterday">Ontem</SelectItem>
              <SelectItem value="week">Últimos 7 dias</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="income">Receitas</SelectItem>
              <SelectItem value="expense">Despesas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mobile Filters */}
        <Collapsible
          open={isFiltersOpen}
          onOpenChange={setIsFiltersOpen}
          className="lg:hidden"
        >
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtros
              </span>
              <ChevronDown
                className={cn(
                  'w-4 h-4 transition-transform',
                  isFiltersOpen && 'rotate-180'
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-3">
            <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="yesterday">Ontem</SelectItem>
                <SelectItem value="week">Últimos 7 dias</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
              </SelectContent>
            </Select>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Summary Cards */}
      <SummaryCards
        income={stats.income}
        expense={stats.expense}
        balance={stats.balance}
        transactionCount={stats.count}
        onTransactionsClick={scrollToTransactions}
      />

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <CategoryChart transactions={filteredTransactions} />
        <EvolutionChart transactions={transactions} />
      </div>

      {/* Transaction List */}
      <div ref={transactionListRef}>
        <TransactionList
          transactions={filteredTransactions}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}