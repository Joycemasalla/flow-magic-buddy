import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  /** Tailwind tint token (e.g. "primary", "income", "expense"). Used for icon + bg. */
  tone?: 'primary' | 'income' | 'expense' | 'accent' | 'muted';
  children: ReactNode;
  className?: string;
}

const TONE: Record<NonNullable<StatCardProps['tone']>, { bg: string; text: string }> = {
  primary: { bg: 'bg-primary/20', text: 'text-primary' },
  income: { bg: 'bg-income/25', text: 'text-income' },
  expense: { bg: 'bg-expense/25', text: 'text-expense' },
  accent: { bg: 'bg-accent/20', text: 'text-accent' },
  muted: { bg: 'bg-muted', text: 'text-muted-foreground' },
};

/**
 * Compact stat card: icon + uppercase label + content slot.
 * Used by InvestmentSummary, AccountsSummary, and similar widgets.
 */
export function StatCard({ icon: Icon, label, tone = 'primary', children, className }: StatCardProps) {
  const t = TONE[tone];
  return (
    <div className={cn('glass-card rounded-2xl p-4 min-w-0', className)}>
      <div className="flex items-center gap-2 mb-2 min-w-0">
        <div className={cn('w-8 h-8 shrink-0 rounded-xl flex items-center justify-center', t.bg)}>
          <Icon className={cn('w-4 h-4 stroke-[1.5]', t.text)} />
        </div>
        <span className="text-[10px] sm:text-xs uppercase tracking-wide font-bold text-muted-foreground truncate">
          {label}
        </span>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
