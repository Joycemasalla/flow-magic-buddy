import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, Wallet, UtensilsCrossed, Car, ShoppingBag, Heart, Gamepad2, Receipt, GraduationCap, TrendingUp, HandCoins, MoreHorizontal, Check, User, Calendar, Tag, Clock } from 'lucide-react';
import { Transaction, categoryLabels, TransactionCategory } from '@/types/transaction';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { PrivacyValue } from '@/components/ui/PrivacyValue';

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

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export default function TransactionDetailsModal({ transaction, onClose }: TransactionDetailsModalProps) {
  if (!transaction) return null;

  const Icon = categoryIconMap[transaction.category] || MoreHorizontal;
  const isIncome = transaction.type === 'income';
  
  const isSettledLoan = transaction.isLoan && (
    (transaction.type === 'expense' && transaction.loanStatus === 'received') ||
    (transaction.type === 'income' && transaction.loanStatus === 'paid')
  );

  const getLoanStatusLabel = () => {
    if (!transaction.isLoan) return null;
    if (transaction.type === 'expense') {
      return transaction.loanStatus === 'received' ? 'Recebido de volta' : 'Pendente';
    } else {
      return transaction.loanStatus === 'paid' ? 'Pago' : 'Pendente';
    }
  };

  return (
    <AnimatePresence>
      {transaction && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl max-h-[85vh] overflow-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="px-6 pb-8 pt-2 space-y-6">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0',
                    isSettledLoan && 'bg-income/20',
                    !isSettledLoan && isIncome && 'bg-income/10',
                    !isSettledLoan && !isIncome && 'bg-expense/10'
                  )}
                >
                  {isSettledLoan ? (
                    <Check className="w-7 h-7 text-income" />
                  ) : (
                    <Icon
                      className={cn(
                        'w-7 h-7',
                        isIncome ? 'text-income' : 'text-expense'
                      )}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold">{transaction.description}</p>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      'mt-1',
                      isIncome ? 'border-income text-income' : 'border-expense text-expense'
                    )}
                  >
                    {isIncome ? 'Receita' : 'Despesa'}
                  </Badge>
                </div>
              </div>

              {/* Amount */}
              <div className={cn(
                'text-3xl font-bold',
                isSettledLoan && 'text-income line-through decoration-2',
                !isSettledLoan && isIncome && 'text-income',
                !isSettledLoan && !isIncome && 'text-expense'
              )}>
                {isSettledLoan ? '✓' : (isIncome ? '+' : '-')}{' '}
                <PrivacyValue value={transaction.amount} />
              </div>

              {/* Details */}
              <div className="space-y-4 pt-2 border-t border-border">
                {/* Category */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Tag className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Categoria</p>
                    <p className="font-medium">{categoryLabels[transaction.category]}</p>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Data</p>
                    <p className="font-medium">
                      {format(new Date(transaction.date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {/* Created At */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Criado em</p>
                    <p className="font-medium">
                      {format(new Date(transaction.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {/* Loan Info */}
                {transaction.isLoan && (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pessoa</p>
                        <p className="font-medium">{transaction.loanPerson || '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        <HandCoins className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <Badge 
                          variant="outline"
                          className={cn(
                            isSettledLoan ? 'border-income text-income' : 'border-warning text-warning'
                          )}
                        >
                          {getLoanStatusLabel()}
                        </Badge>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
