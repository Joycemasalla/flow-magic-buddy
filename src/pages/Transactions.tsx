import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '@/contexts/TransactionContext';
import { useToast } from '@/hooks/use-toast';
import TransactionList from '@/components/dashboard/TransactionList';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'income' | 'expense';

const filterLabels: Record<FilterType, string> = {
  all: 'Todos',
  income: 'Receitas',
  expense: 'Despesas',
};

export default function Transactions() {
  const { transactions, deleteTransaction } = useTransactions();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredTransactions = useMemo(() => {
    if (activeFilter === 'all') return transactions;
    return transactions.filter((t) => t.type === activeFilter);
  }, [transactions, activeFilter]);

  const handleEdit = (id: string) => {
    navigate(`/transacoes/editar/${id}`);
  };

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    toast({
      title: 'Excluída',
      description: 'Transação removida.',
    });
  };

  return (
    <div className="space-y-5 pb-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl lg:text-2xl font-display font-bold">Transações</h1>
        <p className="text-sm text-muted-foreground">
          Todas as suas movimentações
        </p>
      </motion.div>

      {/* Filter Pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
      >
        {(Object.keys(filterLabels) as FilterType[]).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all min-h-[40px] active:scale-95',
              activeFilter === filter
                ? filter === 'income'
                  ? 'bg-income text-income-foreground'
                  : filter === 'expense'
                  ? 'bg-expense text-expense-foreground'
                  : 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {filterLabels[filter]}
          </button>
        ))}
      </motion.div>

      <TransactionList
        transactions={filteredTransactions}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
