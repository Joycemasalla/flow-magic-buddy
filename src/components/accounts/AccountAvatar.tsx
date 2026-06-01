import * as LucideIcons from 'lucide-react';
import { useState } from 'react';
import { Account } from '@/types/account';
import { getBankLogo, getBankSlug, isBankSlug } from '@/lib/bankLogos';
import BankLogo from '@/components/accounts/BankLogo';
import { cn } from '@/lib/utils';

interface Props {
  account: Pick<Account, 'icon' | 'color' | 'logoUrl' | 'name'>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { box: 'w-8 h-8', rounded: 'rounded-xl', icon: 'w-4 h-4', img: 'w-5 h-5', font: 'text-[10px]' },
  md: { box: 'w-11 h-11', rounded: 'rounded-2xl', icon: 'w-5 h-5', img: 'w-7 h-7', font: 'text-sm' },
  lg: { box: 'w-12 h-12', rounded: 'rounded-2xl', icon: 'w-6 h-6', img: 'w-8 h-8', font: 'text-base' },
};

export default function AccountAvatar({ account, size = 'md', className }: Props) {
  const [imgError, setImgError] = useState(false);
  const s = sizeMap[size];
  const Icon = (LucideIcons as any)[account.icon] || LucideIcons.Wallet;

  // 1) Bundled bank logo (preferred)
  if (isBankSlug(account.logoUrl)) {
    const logo = getBankLogo(getBankSlug(account.logoUrl));
    if (logo) {
      return (
        <div className={cn(s.box, s.font, className)}>
          <BankLogo logo={logo} sizeClass={cn(s.box)} rounded={s.rounded} />
        </div>
      );
    }
  }

  // 2) Legacy direct URL (kept working for old data)
  const useLegacyUrl = !!account.logoUrl && !isBankSlug(account.logoUrl) && !imgError;

  return (
    <div
      className={cn('flex items-center justify-center shrink-0 overflow-hidden', s.box, s.rounded, className)}
      style={
        useLegacyUrl
          ? { backgroundColor: '#fff' }
          : { backgroundColor: account.color + '22', color: account.color }
      }
    >
      {useLegacyUrl ? (
        <img
          src={account.logoUrl!}
          alt={account.name}
          className={cn('object-contain', s.img)}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <Icon className={cn('stroke-[1.8]', s.icon)} />
      )}
    </div>
  );
}
