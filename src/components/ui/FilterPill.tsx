import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'default' | 'income' | 'expense';

interface FilterPillProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  active?: boolean;
  variant?: Variant;
  children: ReactNode;
}

/**
 * Reusable filter pill used across Dashboard, Loans, Reminders and Investments.
 * Centralizes the visual style of horizontally-scrollable filter rows.
 */
export function FilterPill({
  active = false,
  variant = 'default',
  className,
  children,
  ...rest
}: FilterPillProps) {
  const activeClass =
    variant === 'income'
      ? 'bg-income text-income-foreground border-transparent'
      : variant === 'expense'
      ? 'bg-expense text-expense-foreground border-transparent'
      : 'bg-gradient-primary text-primary-foreground border-transparent shadow-glow';

  return (
    <button
      {...rest}
      className={cn(
        'px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all min-h-[40px] active:scale-95 border',
        active ? activeClass : 'glass-card text-muted-foreground border-border/40 hover:text-foreground',
        className,
      )}
    >
      {children}
    </button>
  );
}

interface FilterPillRowProps {
  children: ReactNode;
  className?: string;
  /** Pass through framer-motion delay for staggered rows */
  delay?: number;
}

export function FilterPillRow({ children, className, delay = 0 }: FilterPillRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className={cn('flex gap-2 overflow-x-auto pb-1 scrollbar-hide', className)}
    >
      {children}
    </motion.div>
  );
}
