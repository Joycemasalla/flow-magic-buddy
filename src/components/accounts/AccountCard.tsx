import { Account } from '@/types/account';
import { accountOwnerLabels, accountTypeShort } from '@/types/account';
import AccountAvatar from '@/components/accounts/AccountAvatar';
import { PrivacyValue } from '@/components/ui/PrivacyValue';
import { cn } from '@/lib/utils';

interface Props {
  account: Account;
  balance: number;
  onClick?: () => void;
  showOwner?: boolean;
}

export default function AccountCard({ account, balance, onClick, showOwner }: Props) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-2xl border border-border/50 bg-card hover:bg-muted/30 transition-all active:scale-[0.98] flex items-center gap-3 min-w-0',
        account.archived && 'opacity-50'
      )}
    >
      <AccountAvatar account={account} size="md" />
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
