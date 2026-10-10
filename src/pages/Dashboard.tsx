import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ChevronLeft, ChevronRight, AlertTriangle, Flame, Clock, Landmark, Wallet, Plus } from 'lucide-react';
import { useTransactions } from '@/contexts/TransactionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useAccounts } from '@/contexts/AccountContext';
import { useBudgets } from '@/contexts/BudgetContext';
import { useNavigate } from 'react-router-dom';
import { isWithinInterval, startOfMonth, endOfMonth, subMonths, addMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseLocalDate } from '@/lib/finance/dates';
import { calculatePeriodSummary } from '@/lib/finance/rules';
import TransactionList from '@/components/dashboard/TransactionList';
import ProfileSwitcher from '@/components/ProfileSwitcher';
import ReportModal from '@/components/modals/ReportModal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { categoryLabels, categoryColors, categoryIcons, Transaction } from '@/types/transaction';
import * as Icons from 'lucide-react';

function MonthSelector({ currentMonth, onChange }: { currentMonth: Date, onChange: (d: Date) => void }) {
  return (
    <div className="flex items-center justify-between w-full max-w-[260px] mx-auto bg-muted/40 p-1 rounded-2xl border border-border/50">
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl shrink-0" onClick={() => onChange(subMonths(currentMonth, 1))}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex flex-col items-center justify-center -space-y-0.5">
        <span className="text-sm font-semibold capitalize tracking-tight">{format(currentMonth, 'MMMM', { locale: ptBR })}</span>
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{format(currentMonth, 'yyyy')}</span>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl shrink-0" onClick={() => onChange(addMonths(currentMonth, 1))}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function SpendingHero({ spent, expected, income }: { spent: number, expected: number, income: number }) {
  const totalExpense = spent + expected;
  const progress = income > 0 ? Math.min((spent / income) * 100, 100) : 0;
  
  return (
    <div className="glass-card rounded-3xl p-6 text-center space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">Gastos do Mês</p>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-3xl sm:text-4xl font-display font-bold text-expense">
            R$ {spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        {expected > 0 && (
          <p className="text-sm text-muted-foreground">
            + R$ {expected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} previstos
          </p>
        )}
      </div>

      <div className="h-3 w-full bg-secondary rounded-full overflow-hidden relative">
        <div 
          className={cn("h-full transition-all duration-700", progress > 90 ? 'bg-red-500' : 'bg-expense')}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Receitas: R$ {income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        <span>Restante: R$ {Math.max(income - totalExpense, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
      </div>
    </div>
  );
}

function CategoryBarList({ transactions }: { transactions: Transaction[] }) {
  const expenses = transactions.filter(t => t.type === 'expense' && !t.isTransfer);
  const byCategory = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = sorted[0]?.[1] || 1;

  if (sorted.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
        <Icons.PieChart className="w-4 h-4 text-muted-foreground" />
        Maiores Despesas
      </h3>
      <div className="space-y-3">
        {sorted.map(([cat, amount]) => {
          const label = categoryLabels[cat] || cat;
          const color = categoryColors[cat] || '#666';
          const IconName = categoryIcons[cat] || 'MoreHorizontal';
          const Icon = (Icons as any)[IconName] || Icons.MoreHorizontal;
          const percent = (amount / max) * 100;

          return (
            <div key={cat} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                  {label}
                </span>
                <span className="font-semibold">R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AttentionList({ transactions }: { transactions: Transaction[] }) {
  const { reminders } = useTransactions();
  const { budgets } = useBudgets();
  
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

  // Orçamentos estourados (no mês atual)
  const currentMonthExpenses = transactions.filter(t => t.type === 'expense' && !t.isTransfer);
  const spentByCategory = currentMonthExpenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const overBudgets = budgets.filter(b => (spentByCategory[b.category] || 0) > b.amount);

  if (urgentReminders.length === 0 && overBudgets.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-warning" />
        Fique de Olho
      </h3>
      <div className="space-y-3">
        {urgentReminders.map(r => {
          const currentDay = now.getDate();
          const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          const diff = Math.min(r.dueDay, daysInMonth) - currentDay;
          const isLate = diff < 0;

          return (
            <div key={r.id} className="flex justify-between items-center p-2.5 rounded-xl bg-muted/40 border border-border/50">
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
        {overBudgets.map(b => {
          const spent = spentByCategory[b.category] || 0;
          return (
             <div key={`budget-${b.id}`} className="flex justify-between items-center p-2.5 rounded-xl bg-expense/10 border border-expense/20">
               <div className="flex flex-col min-w-0">
                 <span className="text-sm font-medium text-expense truncate">Orçamento excedido</span>
                 <span className="text-[11px] text-expense/80">{categoryLabels[b.category] || b.category}</span>
               </div>
               <span className="font-semibold text-sm text-expense shrink-0">
                 R$ {(spent - b.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} acima
               </span>
             </div>
          );
        })}
      </div>
    </div>
  );
}

function NetWorthStrip() {
  const { accounts } = useAccounts();
  const { investments } = useTransactions();

  const totalAccounts = accounts.reduce((s, a) => s + a.balance, 0);
  const totalInvested = investments.filter(i => i.jaInvestido).reduce((s, i) => s + i.valorInvestido, 0);
  const netWorth = totalAccounts + totalInvested;

  return (
    <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-income/10 rounded-xl">
          <Landmark className="w-5 h-5 text-income" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Patrimônio Total</span>
          <span className="text-lg font-bold font-display text-foreground">
            R$ {netWorth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
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
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Filtrar transações APENAS pelo mês atual selecionado
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const tDate = parseLocalDate(t.date);
      return isWithinInterval(tDate, {
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
      });
    });
  }, [transactions, currentMonth]);

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
    <div className="space-y-6 max-w-full overflow-hidden pb-28 lg:pb-4">
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
          <Button variant="outline" size="sm" onClick={() => setIsReportOpen(true)} className="min-h-[40px] px-3 rounded-2xl">
            <Download className="w-4 h-4 sm:mr-2 stroke-[1.5]" />
            <span className="hidden sm:inline text-xs">Exportar</span>
          </Button>
        </div>
      </div>

      {/* Navegação de Mês */}
      <MonthSelector currentMonth={currentMonth} onChange={setCurrentMonth} />

      {/* Hero: Visão Geral do Mês */}
      <SpendingHero 
        spent={summary.realizedExpense} 
        expected={summary.expectedExpense} 
        income={summary.realizedIncome + summary.expectedIncome} 
      />

      {/* Seções Adicionais */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <AttentionList transactions={monthTransactions} />
          <CategoryBarList transactions={monthTransactions} />
        </div>
        
        <div className="space-y-6">
          {/* NetWorth Strip pode ir aqui em cima no desktop ou no final */}
          <NetWorthStrip />
          
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Icons.ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                Transações do Mês
              </h3>
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => navigate('/transacoes/nova')}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
              </Button>
            </div>
            {/* Reuso do TransactionList focado apenas no mês atual */}
            <div className="-mx-5">
              <TransactionList
                transactions={monthTransactions}
                onEdit={handleEdit}
                onDelete={handleDelete}
                pendingIds={pendingTransactionIds}
              />
            </div>
          </div>
        </div>
      </div>

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
