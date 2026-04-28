import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PrivacyValue } from '@/components/ui/PrivacyValue';

interface SummaryCardsProps {
  income: number;
  expense: number;
  balance: number;
  transactionCount: number;
  onTransactionsClick?: () => void;
  onIncomeClick?: () => void;
  onExpenseClick?: () => void;
  /** Previous-period expense for delta comparison (optional) */
  previousExpense?: number;
  /** Previous-period income for delta comparison (optional) */
  previousIncome?: number;
  /** Label describing the comparison period (e.g. "vs mês passado") */
  comparisonLabel?: string;
}

function Delta({ current, previous }: { current: number; previous?: number }) {
  if (previous === undefined || previous === 0) return null;
  const diff = current - previous;
  const pct = (diff / previous) * 100;
  if (!isFinite(pct)) return null;
  const isUp = diff > 0;
  const isFlat = Math.abs(pct) < 0.5;
  const Icon = isFlat ? Minus : isUp ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
        isFlat && 'bg-muted text-muted-foreground',
        !isFlat && isUp && 'bg-expense/15 text-expense',
        !isFlat && !isUp && 'bg-income/15 text-income'
      )}
    >
      <Icon className="w-2.5 h-2.5" />
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

export default function SummaryCards({
  income,
  expense,
  balance,
  onIncomeClick,
  onExpenseClick,
  previousExpense,
  previousIncome,
  comparisonLabel,
}: SummaryCardsProps) {
  return (
    <div className="space-y-3">
      {/* Main Balance Card — Premium hero */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden glass-elevated rounded-3xl p-6 sm:p-7"
      >
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-accent/15 blur-3xl" />

        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Saldo atual
              </p>
            </div>
            {comparisonLabel && (
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                {comparisonLabel}
              </span>
            )}
          </div>
          <p
            className={cn(
              'text-4xl sm:text-5xl lg:text-6xl font-bold font-display tracking-tight truncate',
              balance >= 0 ? 'text-foreground' : 'text-expense'
            )}
          >
            <PrivacyValue value={Math.abs(balance)} />
          </p>
          {balance < 0 && (
            <p className="text-xs text-expense mt-2 font-medium">Saldo negativo</p>
          )}
        </div>
      </motion.div>

      {/* Income/Expense Row */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onIncomeClick}
          className="glass-card rounded-2xl p-4 text-left cursor-pointer hover-lift"
          style={{ background: 'var(--gradient-income)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-income/15 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-income" />
              </div>
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                Receitas
              </span>
            </div>
            <Delta current={income} previous={previousIncome} />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-income truncate font-display">
            <PrivacyValue value={income} />
          </p>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          whileTap={{ scale: 0.97 }}
          onClick={onExpenseClick}
          className="glass-card rounded-2xl p-4 text-left cursor-pointer hover-lift"
          style={{ background: 'var(--gradient-expense)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-expense/15 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-expense" />
              </div>
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                Despesas
              </span>
            </div>
            <Delta current={expense} previous={previousExpense} />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-expense truncate font-display">
            <PrivacyValue value={expense} />
          </p>
        </motion.button>
      </div>
    </div>
  );
}
