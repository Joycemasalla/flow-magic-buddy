import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SwipeableCard } from '@/components/ui/SwipeableCard';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CloudUpload,
  Wallet,
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Heart,
  Gamepad2,
  Receipt,
  GraduationCap,
  TrendingUp,
  HandCoins,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
} from 'lucide-react';
import { Transaction, categoryLabels, TransactionCategory } from '@/types/transaction';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PrivacyValue } from '@/components/ui/PrivacyValue';
import TransactionDetailsModal from './TransactionDetailsModal';

const categoryIconMap: Record<TransactionCategory, React.ElementType> = {
  salary: Wallet,
  food: UtensilsCrossed,
  transport: Car,
  shopping: ShoppingBag,
  health: Heart,
  entertainment: Gamepad2,
  bills: Receipt,
  education: GraduationCap,
  investment: TrendingUp,
  loan: HandCoins,
  other: MoreHorizontal,
};

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  pendingIds?: Set<string>;
}

interface SwipeableItemProps {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
  isPending?: boolean;
}

function SwipeableItem({ transaction, onEdit, onDelete, onViewDetails, isPending }: SwipeableItemProps) {
  const Icon = categoryIconMap[transaction.category] || MoreHorizontal;
  const isIncome = transaction.type === 'income';

  const isSettledLoan = transaction.isLoan && (
    (transaction.type === 'expense' && transaction.loanStatus === 'received') ||
    (transaction.type === 'income' && transaction.loanStatus === 'paid')
  );

  return (
    <SwipeableCard
      onEdit={onEdit}
      onDelete={onDelete}
      onClick={onViewDetails}
      className={cn(
        'flex items-center gap-3 sm:gap-4 px-4 py-4 sm:p-5 rounded-2xl border transition-all',
        isSettledLoan
          ? 'bg-income/8 border-income/20 hover:border-income/30'
          : 'glass-elevated border-border/40 hover:border-border/60'
      )}
    >
      <div
        className={cn(
          'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all',
          isSettledLoan && 'bg-income/15',
          !isSettledLoan && isIncome && 'bg-income/12',
          !isSettledLoan && !isIncome && 'bg-expense/12'
        )}
      >
        {isSettledLoan ? (
          <Check className="w-5 h-5 sm:w-6 sm:h-6 text-income stroke-[2]" />
        ) : (
          <Icon
            className={cn(
              'w-5 h-5 sm:w-6 sm:h-6 stroke-[1.5]',
              isIncome ? 'text-income' : 'text-expense'
            )}
          />
        )}
      </div>
      <div className="flex-1 min-w-0 pr-2">
        <p className={cn(
          'font-semibold truncate text-sm',
          isSettledLoan && 'text-muted-foreground/70'
        )}>
          {transaction.description}
        </p>
        <p className="text-xs text-muted-foreground/80 truncate font-medium mt-1">
          {isSettledLoan
            ? (transaction.type === 'expense' ? '✓ Recebido de volta' : '✓ Pago')
            : categoryLabels[transaction.category]
          }
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 text-right">
        {isPending && (
          <CloudUpload className="w-4 h-4 text-amber-500 animate-pulse" />
        )}
        <p
          className={cn(
            'font-bold text-sm whitespace-nowrap tabular-nums',
            isSettledLoan && 'text-income line-through decoration-2',
            !isSettledLoan && isIncome && 'text-income',
            !isSettledLoan && !isIncome && 'text-expense'
          )}
        >
          {isSettledLoan ? '✓' : (isIncome ? '+' : '-')}{' '}
          <PrivacyValue value={transaction.amount} />
        </p>
      </div>
    </SwipeableCard>
  );
}

export default function TransactionList({
  transactions,
  onEdit,
  onDelete,
  pendingIds,
}: TransactionListProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Group transactions by date
  const grouped = transactions.reduce((acc, transaction) => {
    const date = transaction.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    return format(date, "EEE, d 'de' MMM", { locale: ptBR });
  };

  if (transactions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-elevated rounded-3xl p-10 text-center"
      >
        <Receipt className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4 stroke-[1.5]" />
        <h3 className="text-lg font-semibold mb-2">Nenhuma transação</h3>
        <p className="text-muted-foreground text-sm">
          Toque no botão + para adicionar
        </p>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 max-w-full overflow-hidden"
      >
        <h3 className="text-base font-semibold">Transações</h3>
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                {formatDateLabel(date)}
              </h4>
              <div className="space-y-3">
                <AnimatePresence>
                  {grouped[date].map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <SwipeableItem
                        transaction={transaction}
                        onEdit={() => onEdit(transaction.id)}
                        onDelete={() => onDelete(transaction.id)}
                        onViewDetails={() => setSelectedTransaction(transaction)}
                        isPending={pendingIds?.has(transaction.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
        
        {/* Swipe Hint */}
        <p className="text-center text-xs text-muted-foreground/60 lg:hidden font-medium">
          ← Deslize para editar ou excluir
        </p>
      </motion.div>

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </>
  );
}
