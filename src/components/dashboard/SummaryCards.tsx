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
    <div className="space-y-3 max-w-full min-w-0 overflow-hidden">
      {/* Saldo — hero enxuto */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative max-w-full min-w-0 overflow-hidden glass-elevated rounded-3xl p-5 sm:p-7"
      >
        <div className="relative min-w-0 max-w-full">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <Wallet className="w-4 h-4 text-primary stroke-[1.75]" />
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Saldo
              </p>
            </div>
            {comparisonLabel && (
              <span className="shrink-0 text-[10px] text-muted-foreground/60 font-medium">
                {comparisonLabel}
              </span>
            )}
          </div>
          <AutoFitText
            max={40}
            min={14}
            length={moneyLength(balance)}
            className={cn(
              'font-bold font-display tracking-tight',
              balance >= 0 ? 'text-foreground' : 'text-expense'
            )}
          >
            <PrivacyValue value={Math.abs(balance)} />
          </AutoFitText>
          {balance < 0 && (
            <p className="text-[11px] text-expense mt-1.5 font-semibold">Saldo negativo</p>
          )}
        </div>
      </motion.div>

      {/* Receitas / Despesas — cards leves */}
      <div className="grid min-w-0 grid-cols-2 gap-3">
        <button
          onClick={onIncomeClick}
          className="glass-card min-w-0 rounded-2xl p-3.5 text-left transition-colors hover:border-income/30 active:scale-[0.98]"
        >
          <div className="flex items-center gap-2 mb-2 min-w-0">
            <TrendingUp className="w-3.5 h-3.5 text-income stroke-[2]" />
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate flex-1">
              Receitas
            </span>
            <Delta current={income} previous={previousIncome} />
          </div>
          <AutoFitText max={20} min={11} length={moneyLength(income)} className="font-bold text-income font-display">
            <PrivacyValue value={income} />
          </AutoFitText>
        </button>

        <button
          onClick={onExpenseClick}
          className="glass-card min-w-0 rounded-2xl p-3.5 text-left transition-colors hover:border-expense/30 active:scale-[0.98]"
        >
          <div className="flex items-center gap-2 mb-2 min-w-0">
            <TrendingDown className="w-3.5 h-3.5 text-expense stroke-[2]" />
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate flex-1">
              Despesas
            </span>
            <Delta current={expense} previous={previousExpense} />
          </div>
          <AutoFitText max={20} min={11} length={moneyLength(expense)} className="font-bold text-expense font-display">
            <PrivacyValue value={expense} />
          </AutoFitText>
        </button>
      </div>
    </div>
  );
}
