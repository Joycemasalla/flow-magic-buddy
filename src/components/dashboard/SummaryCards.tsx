import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
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
}

export default function SummaryCards({
  income,
  expense,
  balance,
  onIncomeClick,
  onExpenseClick,
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
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Saldo atual
            </p>
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
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-income/15 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-income" />
            </div>
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
              Receitas
            </span>
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
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-expense/15 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-expense" />
            </div>
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
              Despesas
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-expense truncate font-display">
            <PrivacyValue value={expense} />
          </p>
        </motion.button>
      </div>
    </div>
  );
}
