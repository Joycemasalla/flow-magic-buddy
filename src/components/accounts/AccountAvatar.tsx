import * as LucideIcons from 'lucide-react';
import { useState } from 'react';
import { Account } from '@/types/account';
import { cn } from '@/lib/utils';

interface Props {
  account: Pick<Account, 'icon' | 'color' | 'logoUrl' | 'name'>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { box: 'w-8 h-8 rounded-xl', icon: 'w-4 h-4', img: 'w-5 h-5' },
  md: { box: 'w-11 h-11 rounded-2xl', icon: 'w-5 h-5', img: 'w-7 h-7' },
  lg: { box: 'w-12 h-12 rounded-2xl', icon: 'w-6 h-6', img: 'w-8 h-8' },
};

export default function AccountAvatar({ account, size = 'md', className }: Props) {
  const [imgError, setImgError] = useState(false);
  const Icon = (LucideIcons as any)[account.icon] || LucideIcons.Wallet;
  const s = sizeMap[size];
  const useLogo = !!account.logoUrl && !imgError;

  return (
    <div
      className={cn('flex items-center justify-center shrink-0 overflow-hidden', s.box, className)}
      style={
        useLogo
          ? { backgroundColor: '#fff' }
          : { backgroundColor: account.color + '22', color: account.color }
      }
    >
      {useLogo ? (
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
