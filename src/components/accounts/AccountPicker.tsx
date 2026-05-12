import * as LucideIcons from 'lucide-react';
import { useAccounts } from '@/contexts/AccountContext';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Props {
  value: string | null | undefined;
  onChange: (id: string | null) => void;
  label?: string;
  compact?: boolean;
}

export default function AccountPicker({ value, onChange, label = 'Conta', compact }: Props) {
  const { accounts } = useAccounts();
  const active = accounts.filter((a) => !a.archived);

  if (active.length === 0) return null;

  return (
    <div className={cn('space-y-2', compact && 'space-y-1.5')}>
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={cn(
            'shrink-0 px-3 py-2 rounded-xl text-xs font-medium border-2 transition-all min-h-[40px]',
            !value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-transparent bg-muted/40 text-muted-foreground'
          )}
        >
          Sem conta
        </button>
        {active.map((a) => {
          const Icon = (LucideIcons as any)[a.icon] || LucideIcons.Wallet;
          const selected = value === a.id;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onChange(a.id)}
              className={cn(
                'shrink-0 px-3 py-2 rounded-xl text-xs font-medium border-2 transition-all min-h-[40px] flex items-center gap-2',
                selected ? 'border-primary bg-primary/10' : 'border-transparent bg-muted/40'
              )}
              style={selected || a.logoUrl ? undefined : { color: a.color }}
            >
              {a.logoUrl ? (
                <img src={a.logoUrl} alt={a.name} className="w-4 h-4 object-contain rounded-sm bg-white" />
              ) : (
                <Icon className="w-3.5 h-3.5" />
              )}
              <span className="truncate max-w-[80px]">{a.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
