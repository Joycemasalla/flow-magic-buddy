import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryCardsProps {
  income: number;
  expense: number;
  balance: number;
  transactionCount: number;
  onTransactionsClick?: () => void;
}

export default function SummaryCards({
  income,
  expense,
  balance,
  transactionCount,
  onTransactionsClick,
}: SummaryCardsProps) {
  const cards = [
    {
      label: 'Receitas',
      value: income,
      icon: TrendingUp,
      color: 'text-income',
      bgColor: 'bg-income/10',
      borderColor: 'border-income/20',
    },
    {
      label: 'Despesas',
      value: expense,
      icon: TrendingDown,
      color: 'text-expense',
      bgColor: 'bg-expense/10',
      borderColor: 'border-expense/20',
    },
    {
      label: 'Saldo',
      value: balance,
      icon: Wallet,
      color: balance >= 0 ? 'text-income' : 'text-expense',
      bgColor: balance >= 0 ? 'bg-income/10' : 'bg-expense/10',
      borderColor: balance >= 0 ? 'border-income/20' : 'border-expense/20',
    },
    {
      label: 'Transações',
      value: transactionCount,
      icon: Receipt,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      borderColor: 'border-accent/20',
      isCount: true,
      onClick: onTransactionsClick,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={card.onClick}
          className={cn(
            'glass-card rounded-xl p-4 lg:p-5 hover-lift',
            card.onClick && 'cursor-pointer'
          )}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                card.bgColor,
                'border',
                card.borderColor
              )}
            >
              <card.icon className={cn('w-5 h-5', card.color)} />
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              {card.label}
            </span>
          </div>
          <p className={cn('text-2xl lg:text-3xl font-bold font-display', card.color)}>
            {card.isCount
              ? card.value
              : `R$ ${Math.abs(card.value).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                })}`}
          </p>
        </motion.div>
      ))}
    </div>
  );
}