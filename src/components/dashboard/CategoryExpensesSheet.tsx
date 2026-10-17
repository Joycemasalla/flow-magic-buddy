import { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { parseLocalDate } from '@/lib/finance/dates';
import { Transaction, categoryLabels, getCategoryColor, withCategoryAlpha, categoryIcons } from '@/types/transaction';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { PrivacyValue } from '@/components/ui/PrivacyValue';

interface CategoryExpensesSheetProps {
  category: string | null;
  transactions: Transaction[];
  periodLabel: string;
  onClose: () => void;
}

export default function CategoryExpensesSheet({ category, transactions, periodLabel, onClose }: CategoryExpensesSheetProps) {
  const items = useMemo(() => {
    if (!category) return [];
    return transactions
      .filter((t) => t.type === 'expense' && !t.isTransfer && t.category === category)
      .sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
  }, [category, transactions]);

  const total = items.reduce((sum, t) => sum + t.amount, 0);

  if (!category) return null;

  const label = categoryLabels[category] || category;
  const color = getCategoryColor(category);
  const IconName = categoryIcons[category] || 'MoreHorizontal';
  const Icon = (Icons as any)[IconName] || Icons.MoreHorizontal;

  return (
    <Sheet open={!!category} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="z-[60] rounded-t-[24px] p-0 max-h-[85vh] flex flex-col">
        <SheetHeader className="p-5 pb-3 border-b border-border text-left">
          <div className="flex items-center gap-3 pr-8">
            <span
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: withCategoryAlpha(color, 0.14) }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </span>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg font-extrabold tracking-tight">{label}</SheetTitle>
              <SheetDescription className="text-xs font-medium">{periodLabel}</SheetDescription>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] font-semibold text-muted-foreground">Total</p>
              <p className="text-base font-bold text-expense tabular-nums">
                <PrivacyValue value={total} />
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="overflow-y-auto px-5 py-4 space-y-2">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum gasto nesta categoria no período.
            </p>
          ) : (
            items.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border/50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{t.description || label}</p>
                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                    {format(parseLocalDate(t.date), "dd/MM/yy '·' EEEE", { locale: ptBR })}
                  </p>
                </div>
                <p className={cn('text-sm font-bold text-expense tabular-nums shrink-0')}>
                  <PrivacyValue value={t.amount} prefix="− R$ " />
                </p>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
