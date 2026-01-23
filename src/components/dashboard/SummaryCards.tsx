import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
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
      {/* Main Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5"
      >
        <p className="text-sm text-muted-foreground font-medium mb-1">Saldo atual</p>
        <p className={cn(
          'text-2xl sm:text-3xl lg:text-5xl font-bold font-display truncate',
          balance >= 0 ? 'text-income' : 'text-expense'
        )}>
          <PrivacyValue value={Math.abs(balance)} />
        </p>
        {balance < 0 && (
          <p className="text-xs text-expense mt-1">Saldo negativo</p>
        )}
      </motion.div>

      {/* Income/Expense Row */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={onIncomeClick}
          className="glass-card rounded-xl p-4 text-left cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-income/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-income" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">Receitas</span>
          </div>
          <p className="text-base sm:text-xl lg:text-2xl font-bold text-income truncate">
            <PrivacyValue value={income} />
          </p>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={onExpenseClick}
          className="glass-card rounded-xl p-4 text-left cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-expense/10 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-expense" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">Despesas</span>
          </div>
          <p className="text-base sm:text-xl lg:text-2xl font-bold text-expense truncate">
            <PrivacyValue value={expense} />
          </p>
        </motion.button>
      </div>
    </div>
  );
}
