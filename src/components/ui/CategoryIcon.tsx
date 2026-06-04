import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface CategoryIconProps {
  icon: LucideIcon;
  /** Hex or HSL string; used as background tint (20% opacity) and icon color. */
  color: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: { box: 'w-8 h-8 rounded-xl', icon: 'w-4 h-4' },
  md: { box: 'w-10 h-10 rounded-2xl', icon: 'w-5 h-5' },
  lg: { box: 'w-12 h-12 rounded-2xl', icon: 'w-6 h-6' },
};

/**
 * Tinted circular container for a category/investment icon.
 * Centralizes the `bg-${color}/20` + `text-${color}` pattern previously
 * duplicated across TransactionList, Investments, InvestmentDetailsModal, etc.
 *
 * Note: the only place we still need inline `style` for arbitrary user
 * category colors — Tailwind cannot generate dynamic color classes.
 */
export function CategoryIcon({ icon: Icon, color, size = 'md', className }: CategoryIconProps) {
  const s = SIZES[size];
  return (
    <div
      className={cn('flex items-center justify-center shrink-0', s.box, className)}
      style={{ backgroundColor: `${color}33`, color }}
    >
      <Icon className={cn(s.icon, 'stroke-[1.5]')} />
    </div>
  );
}
