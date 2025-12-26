import { motion } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
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
} from 'lucide-react';
import { Transaction, categoryLabels, TransactionCategory } from '@/types/transaction';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
}

export default function TransactionList({
  transactions,
  onEdit,
  onDelete,
}: TransactionListProps) {
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
    return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
  };

  if (transactions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-8 text-center"
      >
        <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhuma transação</h3>
        <p className="text-muted-foreground">
          Use o botão + para adicionar uma transação
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold mb-4">Transações</h3>
      <div className="space-y-6">
        {sortedDates.map((date) => (
          <div key={date}>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 capitalize">
              {formatDateLabel(date)}
            </h4>
            <div className="space-y-2">
              {grouped[date].map((transaction, index) => {
                const Icon = categoryIconMap[transaction.category] || MoreHorizontal;
                const isIncome = transaction.type === 'income';

                return (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        isIncome ? 'bg-income/10' : 'bg-expense/10'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-5 h-5',
                          isIncome ? 'text-income' : 'text-expense'
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {categoryLabels[transaction.category]}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          'font-semibold',
                          isIncome ? 'text-income' : 'text-expense'
                        )}
                      >
                        {isIncome ? '+' : '-'} R${' '}
                        {transaction.amount.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(transaction.id)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(transaction.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}