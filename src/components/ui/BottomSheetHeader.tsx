import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface BottomSheetHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  onClose?: () => void;
  className?: string;
}

/**
 * Standard header for bottom-sheet / modal screens.
 * Replaces the ~10 duplicated `<div className="flex items-center justify-between mb-4">…<button onClick={onClose}><X/></button></div>` blocks.
 */
export function BottomSheetHeader({ title, subtitle, icon, onClose, className }: BottomSheetHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3 mb-4', className)}>
      <div className="flex items-center gap-3 min-w-0">
        {icon && <div className="shrink-0">{icon}</div>}
        <div className="min-w-0">
          <h2 className="text-lg font-display font-bold truncate">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted/50 active:scale-95 transition-all"
        >
          <X className="w-5 h-5 stroke-[1.5]" />
        </button>
      )}
    </div>
  );
}
