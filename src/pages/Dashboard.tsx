import { useState, useMemo } from 'react';
import { calculatePeriodSummary } from '@/lib/finance/rules';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useTransactions } from '@/contexts/TransactionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { isToday, subDays, startOfMonth, startOfYear, isWithinInterval, startOfDay, endOfDay, subMonths, subYears, endOfMonth, endOfYear, format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { CalendarDays } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import SummaryCards from '@/components/dashboard/SummaryCards';
import CategoryChart from '@/components/dashboard/CategoryChart';
import EvolutionChart from '@/components/dashboard/EvolutionChart';
import TransactionList from '@/components/dashboard/TransactionList';
import InvestmentSummary from '@/components/dashboard/InvestmentSummary';

import ProfileSwitcher from '@/components/ProfileSwitcher';
import ReportModal from '@/components/modals/ReportModal';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FilterPill, FilterPillRow } from '@/components/ui/FilterPill';
import { cn } from '@/lib/utils';
import { SlidersHorizontal, Landmark, Handshake } from 'lucide-react';

type PeriodFilter = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';
type TypeFilter = 'all' | 'income' | 'expense';
type ProfileMode = 'personal' | 'couple';

const periodLabels: Record<Exclude<PeriodFilter, 'custom'>, string> = {
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
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [isRangeOpen, setIsRangeOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [showCharts, setShowCharts] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [includeInvestments, setIncludeInvestments] = useState(true);
  const [includeLoans, setIncludeLoans] = useState(true);
  const { activeWalletId, wallets } = useWallet();
  const activeWallet = wallets.find((w) => w.id === activeWalletId);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const tDate = parseLocalDate(t.date);
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
        case 'custom': {
          if (!customRange?.from) return true;
          return isWithinInterval(tDate, {
            start: startOfDay(customRange.from),
            end: endOfDay(customRange.to ?? customRange.from),
          });
        }
        default:
          return true;
      }
    });
  }, [transactions, periodFilter, typeFilter, customRange]);

  const stats = useMemo(() => {
    // includeFuture = true para manter o comportamento atual do dashboard de mostrar o que vai acontecer no período selecionado,
    // mas a regra isRealized no `rules.ts` pode cortar os previstos se for false. Como o usuário disse que "Disponível é o que sobrou",
    // ele deve somar os realizados. Vamos usar includeFuture = false para 'saldo atual' ou ver o período todo.
    // Vamos passar includeFuture: true porque o Dashboard já filtrou o período e queremos somar tudo que está na tela (ex: mês todo).
    const periodSummary = calculatePeriodSummary(filteredTransactions, [], {
      includeFuture: true, // we already filtered by date
      includeInvestments,
      includeLoans,
    });

    const excludedInvestments = 0; // investments already integrated
    const excludedLoans = 0; // loans already integrated

    return {
      income: periodSummary.income,
      expense: periodSummary.expense,
      saved: periodSummary.invested,
      balance: periodSummary.balance,
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
      const tDate = parseLocalDate(t.date);
      return isWithinInterval(tDate, { start: prevStart, end: prevEnd });
    });

    const summary = calculatePeriodSummary(prev, [], {
      includeFuture: true,
      includeInvestments,
      includeLoans,
    });

    return { income: summary.income, expense: summary.expense };
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
    <div className="space-y-4 max-w-full overflow-hidden pb-28 lg:pb-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl lg:text-2xl font-display font-bold truncate">
            Olá{(() => {
              const name = user?.user_metadata?.full_name || user?.user_metadata?.name || '';
              return name ? `, ${name.split(' ')[0]}` : '';
            })()}! 👋
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {activeWallet ? activeWallet.name : 'Minha carteira'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ProfileSwitcher />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReportOpen(true)}
            className="min-h-[40px] px-3 rounded-2xl"
          >
            <Download className="w-4 h-4 sm:mr-2 stroke-[1.5]" />
            <span className="hidden sm:inline text-xs">Exportar</span>
          </Button>
        </div>
      </div>

      {/* Período — pills compactas + calendário personalizado */}
      <FilterPillRow>
        {(Object.keys(periodLabels) as (keyof typeof periodLabels)[]).map((period) => (
          <FilterPill
            key={period}
            active={periodFilter === period}
            onClick={() => setPeriodFilter(period)}
          >
            {periodLabels[period]}
          </FilterPill>
        ))}
        <Popover open={isRangeOpen} onOpenChange={setIsRangeOpen}>
          <PopoverTrigger asChild>
            <span>
              <FilterPill
                className="flex items-center gap-1.5"
                active={periodFilter === 'custom'}
                onClick={() => {
                  setPeriodFilter('custom');
                  setIsRangeOpen(true);
                }}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                {periodFilter === 'custom' && customRange?.from
                  ? `${format(customRange.from, 'dd/MM')} – ${format(customRange.to ?? customRange.from, 'dd/MM')}`
                  : 'Período'}
              </FilterPill>
            </span>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0 rounded-2xl z-[70]">
            <CalendarComponent
              mode="range"
              selected={customRange}
              onSelect={(range) => {
                setCustomRange(range);
                setPeriodFilter('custom');
                if (range?.from && range?.to) setIsRangeOpen(false);
              }}
              numberOfMonths={1}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </FilterPillRow>

      {/* Summary Cards */}
      <SummaryCards
        income={stats.income}
        expense={stats.expense}
        balance={stats.balance}
        savedInPeriod={stats.saved}
        totalSaved={investments.filter((i) => i.jaInvestido).reduce((s, i) => s + i.valorInvestido, 0)}
        onSavedClick={() => navigate('/investimentos')}
        transactionCount={stats.count}
        onIncomeClick={() => setTypeFilter('income')}
        onExpenseClick={() => setTypeFilter('expense')}
        previousIncome={previousStats?.income}
        previousExpense={previousStats?.expense}
        comparisonLabel={comparisonLabel}
      />

      {/* Tabs segmentadas de tipo — padrão do app */}
      <div className="flex gap-2 p-1 rounded-2xl bg-muted/40 w-full">
        {(Object.keys(typeLabels) as TypeFilter[]).map((type) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={cn(
              'flex-1 h-9 rounded-xl text-sm font-medium transition-colors',
              typeFilter === type ? 'bg-background shadow-sm' : 'text-muted-foreground'
            )}
          >
            {typeLabels[type]}
          </button>
        ))}
      </div>

      {/* Ajustes (extras) — dentro de Popover discreto */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          {!includeInvestments || !includeLoans ? (
            <span className="text-warning">Alguns valores estão ocultos</span>
          ) : (
            <>Incluindo investimentos e empréstimos</>
          )}
        </p>
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs text-muted-foreground border border-border/40 hover:text-foreground transition-colors">
              <SlidersHorizontal className="w-3 h-3" />
              Ajustes
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="inc-inv" className="flex items-center gap-2 text-sm cursor-pointer">
                <Landmark className="w-3.5 h-3.5 text-muted-foreground" />
                Investimentos
              </Label>
              <Switch id="inc-inv" checked={includeInvestments} onCheckedChange={setIncludeInvestments} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="inc-loans" className="flex items-center gap-2 text-sm cursor-pointer">
                <Handshake className="w-3.5 h-3.5 text-muted-foreground" />
                Empréstimos
              </Label>
              <Switch id="inc-loans" checked={includeLoans} onCheckedChange={setIncludeLoans} />
            </div>
          </PopoverContent>
        </Popover>
      </div>


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
              <CategoryChart transactions={filteredTransactions} compact includeLoans={includeLoans} />
              <EvolutionChart transactions={transactions} compact />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Charts */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-6">
          <CategoryChart transactions={filteredTransactions} includeLoans={includeLoans} />
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
        period={periodFilter === 'custom'
          ? customRange?.from
            ? `${format(customRange.from, 'dd/MM/yyyy')} – ${format(customRange.to ?? customRange.from, 'dd/MM/yyyy')}`
            : 'Personalizado'
          : periodLabels[periodFilter]}
      />
    </div>
  );
}
