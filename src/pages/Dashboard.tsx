import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ChevronLeft, ChevronRight, AlertTriangle, Flame, Clock, Landmark, Wallet, Plus } from 'lucide-react';
import { useTransactions } from '@/contexts/TransactionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useAccounts } from '@/contexts/AccountContext';
import { PrivacyValue } from '@/components/ui/PrivacyValue';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { isWithinInterval, startOfMonth, endOfMonth, subMonths, addMonths, format, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseLocalDate } from '@/lib/finance/dates';
import CategoryExpensesSheet from '@/components/dashboard/CategoryExpensesSheet';
import { calculatePeriodSummary } from '@/lib/finance/rules';
import TransactionList from '@/components/dashboard/TransactionList';
import ProfileSwitcher from '@/components/ProfileSwitcher';
import ReportModal from '@/components/modals/ReportModal';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { categoryLabels, getCategoryColor, withCategoryAlpha, categoryIcons, Transaction } from '@/types/transaction';
import * as Icons from 'lucide-react';

function PeriodSelector({
  currentMonth,
  onChangeMonth,
  dateRange,
  onChangeDateRange
}: {
  currentMonth: Date;
  onChangeMonth: (d: Date) => void;
  dateRange: DateRange | undefined;
  onChangeDateRange: (r: DateRange | undefined) => void;
}) {
  const label = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, 'dd/MM/yy')} – ${format(dateRange.to, 'dd/MM/yy')}`
      : format(dateRange.from, 'dd/MM/yy')
    : format(currentMonth, "MMMM yyyy", { locale: ptBR });
  return (
    <div className="flex items-center justify-center gap-2 w-full">
      <div className="flex items-center bg-surface border border-border rounded-xl h-11">
        <Button variant="ghost" size="icon" aria-label="Mês anterior" className="h-11 w-11 rounded-xl" onClick={() => { onChangeMonth(subMonths(currentMonth, 1)); onChangeDateRange(undefined); }}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-bold capitalize min-w-[132px] text-center tabular-nums">{label}</span>
        <Button variant="ghost" size="icon" aria-label="Próximo mês" className="h-11 w-11 rounded-xl" onClick={() => { onChangeMonth(addMonths(currentMonth, 1)); onChangeDateRange(undefined); }}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label="Filtrar por período"
            className={cn('h-11 w-11 rounded-xl relative', dateRange && 'border-primary text-primary bg-primary-soft')}
          >
            <Icons.SlidersHorizontal className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-[70]" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from || currentMonth}
            selected={dateRange}
            onSelect={onChangeDateRange}
            numberOfMonths={1}
            locale={ptBR}
          />
          {dateRange?.from && (
            <div className="p-2 border-t border-border">
              <Button variant="ghost" className="w-full h-10" onClick={() => onChangeDateRange(undefined)}>Limpar período</Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

function SpendingHero({ spent, expected, income }: { spent: number, expected: number, income: number }) {
  const totalExpense = spent + expected;
  const progress = income > 0 ? Math.min((spent / income) * 100, 100) : 0;
  const pct = income > 0 ? Math.round((spent / income) * 100) : 0;

  return (
    <section className="bg-card border border-border rounded-[20px] p-6 space-y-5">
      <div>
        <p className="text-[13px] font-semibold text-muted-foreground">Gastos do mês</p>
        <p className="text-[40px] leading-none font-extrabold tracking-[-0.03em] mt-2 tabular-nums break-all">
          <PrivacyValue value={spent} className="block text-[40px] leading-none font-extrabold tracking-[-0.03em] mt-2 tabular-nums break-all" />
        </p>
        {expected > 0 && (
          <p className="text-[13px] text-muted-foreground mt-2">
            <PrivacyValue value={expected} showSign /> previstos
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-foreground-secondary">{income > 0 ? `${pct}% da receita usado` : 'Sem receitas no período'}</span>
          <span className="text-muted-foreground tabular-nums">Restante <PrivacyValue value={Math.max(income - totalExpense, 0)} /></span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Percentual da receita usado">
          <div className={cn('h-full rounded-full transition-all', progress > 90 ? 'bg-expense' : 'bg-primary')} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border">
        <div className="pt-4">
          <p className="text-xs font-semibold text-muted-foreground">Receitas</p>
          <p className="text-lg font-bold text-income tabular-nums truncate"><PrivacyValue value={income} /></p>
        </div>
        <div className="pt-4">
          <p className="text-xs font-semibold text-muted-foreground">Despesas</p>
          <p className="text-lg font-bold text-expense tabular-nums truncate"><PrivacyValue value={totalExpense} /></p>
        </div>
      </div>
    </section>
  );
}

function CategoryBarList({ transactions, onSelectCategory }: { transactions: Transaction[], onSelectCategory: (cat: string) => void }) {
  const expenses = transactions.filter(t => t.type === 'expense' && !t.isTransfer);
  const byCategory = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = sorted[0]?.[1] || 1;

  if (sorted.length < 2) return null;
  const total = sorted.reduce((a, [, v]) => a + v, 0);

  return (
    <section className="bg-card border border-border rounded-[20px] p-5 space-y-4">
      <h3 className="text-base font-bold">Maiores despesas</h3>
      <div className="space-y-3">
        {sorted.map(([cat, amount]) => {
          const label = categoryLabels[cat] || cat;
          const color = getCategoryColor(cat);
          const IconName = categoryIcons[cat] || 'MoreHorizontal';
          const Icon = (Icons as any)[IconName] || Icons.MoreHorizontal;
          const percent = (amount / max) * 100;

          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className="w-full space-y-1 text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: withCategoryAlpha(color, 0.14) }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </span>
                  <span className="truncate text-sm font-semibold">{label}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-bold tabular-nums"><PrivacyValue value={amount} /></span>
                  <span className="block text-[11px] text-muted-foreground font-semibold">{Math.round((amount / total) * 100)}%</span>
                </span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: color }} />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AttentionList() {
  const { reminders } = useTransactions();
  
  
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // Atrasadas ou próximos 5 dias
  const urgentReminders = reminders.filter(r => {
    if (!r.isActive || r.lastPaidMonth === currentMonthKey) return false;
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const clampedDue = Math.min(r.dueDay, daysInMonth);
    const diff = clampedDue - currentDay;
    return diff <= 5; // Atrasadas (diff < 0) ou até 5 dias
  }).sort((a, b) => a.dueDay - b.dueDay);

  if (urgentReminders.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 space-y-4">
      <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
        Fique de Olho
      </h3>
      <div className="space-y-3">
        {urgentReminders.map(r => {
          const currentDay = now.getDate();
          const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          const diff = Math.min(r.dueDay, daysInMonth) - currentDay;
          const isLate = diff < 0;

          return (
            <div key={r.id} className="flex justify-between items-center p-2.5 rounded-xl bg-muted/40 border border-border/50 gap-2">
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">{r.title}</span>
                <span className={cn("text-[11px] font-semibold", isLate ? 'text-expense' : 'text-warning')}>
                  {isLate ? `Atrasada (${Math.abs(diff)}d)` : diff === 0 ? 'Vence Hoje' : `Vence em ${diff}d`}
                </span>
              </div>
              <span className="font-semibold text-sm text-expense shrink-0">
                R$ {r.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NetWorthStrip() {
  const { accounts, balances } = useAccounts();
  const { investments } = useTransactions();

  const totalAccounts = accounts.reduce((s, a) => s + (balances[a.id] || 0), 0);
  const totalInvested = investments.filter(i => i.jaInvestido).reduce((s, i) => s + i.valorInvestido, 0);
  const netWorth = totalAccounts + totalInvested;
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/contas')}
      className="w-full bg-card border border-border rounded-2xl px-4 min-h-[60px] flex items-center gap-3 text-left hover:bg-muted"
    >
      <span className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
        <Landmark className="w-5 h-5 text-primary" />
      </span>
      <span className="flex-1 text-sm font-semibold">Patrimônio total</span>
      <span className="text-[15px] font-bold tabular-nums">R$ {netWorth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
    </button>
  );
}

export default function Dashboard() {
  const { transactions, deleteTransaction, pendingTransactionIds } = useTransactions();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeWalletId, wallets } = useWallet();
  const activeWallet = wallets.find((w) => w.id === activeWalletId);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filtrar transações pelo mês atual ou pelo período personalizado
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const tDate = parseLocalDate(t.date);

      if (dateRange?.from) {
        if (dateRange.to) {
          return isWithinInterval(tDate, { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) });
        }
        return isWithinInterval(tDate, { start: startOfDay(dateRange.from), end: endOfDay(dateRange.from) });
      }

      return isWithinInterval(tDate, {
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
      });
    });
  }, [transactions, currentMonth, dateRange]);

  // Resumo usando nossa rule engine (agora separamos realized vs expected)
  const summary = useMemo(() => {
    return calculatePeriodSummary(monthTransactions, [], { includeFuture: true, includeInvestments: true, includeLoans: true });
  }, [monthTransactions]);

  const handleEdit = (id: string) => navigate(`/transacoes/editar/${id}`);
  
  const handleDelete = (id: string) => {
    deleteTransaction(id);
    toast({ title: 'Transação excluída' });
  };

  return (
    <div className="space-y-5 w-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] font-extrabold tracking-tight truncate">
            Olá{(() => {
              const name = user?.user_metadata?.full_name || user?.user_metadata?.name || '';
              return name ? `, ${name.split(' ')[0]}` : '';
            })()}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {activeWallet ? activeWallet.name : 'Minha carteira'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ProfileSwitcher />
          <Button variant="outline" size="icon" aria-label="Exportar relatório" onClick={() => setIsReportOpen(true)} className="h-11 w-11 rounded-xl">
            <Download className="w-4 h-4 sm:mr-2 stroke-[1.5]" />
            <span className="hidden sm:inline text-xs">Exportar</span>
          </Button>
        </div>
      </div>

      {/* Navegação de Mês / Período */}
      <PeriodSelector 
        currentMonth={currentMonth} 
        onChangeMonth={setCurrentMonth}
        dateRange={dateRange}
        onChangeDateRange={setDateRange}
      />

      {/* Hero: Visão Geral do Mês */}
      <SpendingHero 
        spent={summary.realizedExpense} 
        expected={summary.expectedExpense} 
        income={summary.realizedIncome + summary.expectedIncome} 
      />

      {/* Seções Adicionais */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6 min-w-0">
          <AttentionList />
          <CategoryBarList transactions={monthTransactions} onSelectCategory={setSelectedCategory} />
        </div>
        
        <div className="space-y-6 min-w-0">
          {/* NetWorth Strip */}
          <NetWorthStrip />
          
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold">Transações do mês</h3>
              <Button variant="link" className="h-11 px-1 text-sm font-semibold" onClick={() => navigate('/transacoes')}>
                Ver todas
              </Button>
            </div>
            {/* Reuso do TransactionList focado apenas no mês atual */}
            <TransactionList
              transactions={monthTransactions}
              onEdit={handleEdit}
              onDelete={handleDelete}
              pendingIds={pendingTransactionIds}
              hideTitle
            />
          </section>
        </div>
      </div>

      {/* Modal de gastos por categoria */}
      <CategoryExpensesSheet
        category={selectedCategory}
        transactions={monthTransactions}
        periodLabel={dateRange?.from
          ? dateRange.to
            ? `${format(dateRange.from, 'dd/MM/yy')} – ${format(dateRange.to, 'dd/MM/yy')}`
            : format(dateRange.from, 'dd/MM/yy')
          : format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
        onClose={() => setSelectedCategory(null)}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        transactions={monthTransactions}
        stats={{
          income: summary.income,
          expense: summary.expense,
          saved: summary.invested,
          balance: summary.balance,
          count: monthTransactions.length,
          excludedInvestments: 0,
          excludedLoans: 0
        }}
        period={format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
      />
    </div>
  );
}
