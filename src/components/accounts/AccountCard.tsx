import * as LucideIcons from 'lucide-react';
import { Account } from '@/types/account';
import { accountOwnerLabels, accountTypeShort } from '@/types/account';
import { PrivacyValue } from '@/components/ui/PrivacyValue';
import { cn } from '@/lib/utils';

interface Props {
  account: Account;
  balance: number;
  onClick?: () => void;
  showOwner?: boolean;
}

export default function AccountCard({ account, balance, onClick, showOwner }: Props) {
  const Icon = (LucideIcons as any)[account.icon] || LucideIcons.Wallet;
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-2xl border border-border/50 bg-card hover:bg-muted/30 transition-all active:scale-[0.98] flex items-center gap-3 min-w-0',
        account.archived && 'opacity-50'
      )}
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: account.color + '22', color: account.color }}
      >
        <Icon className="w-5 h-5 stroke-[1.8]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate text-sm">{account.name}</p>
        <p className="text-[10px] text-muted-foreground truncate">
          {accountTypeShort[account.type]}
          {showOwner && ` · ${accountOwnerLabels[account.ownerScope]}`}
        </p>
      </div>
      <div className="text-right shrink-0 min-w-0">
        <PrivacyValue
          value={balance}
          className={cn('font-bold text-sm tabular-nums', balance < 0 && 'text-expense')}
        />
      </div>
    </button>
  );
}
