import { usePrivacy } from '@/contexts/PrivacyContext';
import { cn } from '@/lib/utils';

interface PrivacyValueProps {
  value: number;
  prefix?: string;
  className?: string;
  showSign?: boolean;
}

export function PrivacyValue({ value, prefix = 'R$ ', className, showSign }: PrivacyValueProps) {
  const { isPrivacyMode } = usePrivacy();

  if (isPrivacyMode) {
    return (
      <span className={cn('select-none', className)}>
        {showSign && (value >= 0 ? '+ ' : '- ')}
        {prefix}
        <span className="blur-sm">••••••</span>
      </span>
    );
  }

  const formattedValue = Math.abs(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
  });

  return (
    <span className={className}>
      {showSign && (value >= 0 ? '+ ' : '- ')}
      {prefix}{formattedValue}
    </span>
  );
}
