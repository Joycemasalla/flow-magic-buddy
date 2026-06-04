import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PrivacyValue } from '@/components/ui/PrivacyValue';
import { AutoFitText } from '@/components/ui/AutoFitText';

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
        'inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-1 rounded-full',
        isFlat && 'bg-muted text-muted-foreground',
        !isFlat && isUp && 'bg-expense/15 text-expense',
        !isFlat && !isUp && 'bg-income/15 text-income'
      )}
    >
      <Icon className="w-3 h-3 stroke-[2]" />
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

const moneyLength = (value: number) =>
  `R$ ${Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`.length;

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
    <div className="space-y-4 max-w-full min-w-0 overflow-hidden">
      {/* Main Balance Card — Premium hero */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-full min-w-0 overflow-hidden glass-elevated rounded-3xl p-5 sm:p-10"
      >
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 w-72 h-72 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative min-w-0 max-w-full">
          <div className="flex min-w-0 items-center justify-between gap-3 mb-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="w-10 h-10 shrink-0 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary stroke-[1.5]" />
              </div>
              <p className="min-w-0 truncate text-xs uppercase tracking-wider text-muted-foreground font-bold">
                Saldo Atual
              </p>
            </div>
            {comparisonLabel && (
              <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
                {comparisonLabel}
              </span>
            )}
          </div>
          <AutoFitText
            max={64}
            min={14}
            length={moneyLength(balance)}
            className={cn(
              'font-black font-display tracking-tight',
              balance >= 0 ? 'text-foreground' : 'text-expense'
            )}
          >
            <PrivacyValue value={Math.abs(balance)} />
          </AutoFitText>
          {balance < 0 && (
            <p className="text-xs text-expense mt-3 font-bold uppercase tracking-wide">Saldo negativo</p>
          )}
        </div>
      </motion.div>

      {/* Income/Expense Row */}
      <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onIncomeClick}
          className="glass-elevated min-w-0 max-w-full overflow-hidden rounded-3xl p-4 sm:p-5 text-left cursor-pointer hover-lift transition-all"
          style={{ background: 'var(--gradient-income)' }}
        >
          <div className="flex items-start justify-between gap-2 mb-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-2xl bg-income/25 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-income stroke-[1.5]" />
              </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wide truncate">
                Receitas
              </span>
            </div>
            <div className="shrink-0">
              <Delta current={income} previous={previousIncome} />
            </div>
          </div>
          <AutoFitText max={26} min={10} length={moneyLength(income)} className="font-black text-income font-display">
            <PrivacyValue value={income} />
          </AutoFitText>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          whileTap={{ scale: 0.97 }}
          onClick={onExpenseClick}
          className="glass-elevated min-w-0 max-w-full overflow-hidden rounded-3xl p-5 text-left cursor-pointer hover-lift transition-all"
          style={{ background: 'var(--gradient-expense)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-expense/25 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-expense stroke-[1.5]" />
              </div>
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wide">
                Despesas
              </span>
            </div>
            <Delta current={expense} previous={previousExpense} />
          </div>
          <AutoFitText max={26} min={10} length={moneyLength(expense)} className="font-black text-expense font-display">
            <PrivacyValue value={expense} />
          </AutoFitText>
        </motion.button>
      </div>
    </div>
  );
}
