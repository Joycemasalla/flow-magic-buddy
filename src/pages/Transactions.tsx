import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTransactions } from '@/contexts/TransactionContext';
import { useToast } from '@/hooks/use-toast';
import TransactionList from '@/components/dashboard/TransactionList';
import { calculatePeriodSummary } from '@/lib/finance/rules';
import { formatBRL } from '@/lib/finance/money';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'income' | 'expense';

const filterLabels: Record<FilterType, string> = {
  all: 'Todas',
  income: 'Receitas',
  expense: 'Despesas',
};

export default function Transactions() {
  const { transactions, deleteTransaction, pendingTransactionIds } = useTransactions();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<FilterType>('all');

  const { filtered, summary, counts } = useMemo(() => {
    const summary = calculatePeriodSummary(transactions, [], {
      includeFuture: true,
      includeInvestments: true,
      includeLoans: true,
    });

    let incomeCount = 0;
    let expenseCount = 0;
    for (const t of transactions) {
      if (t.type === 'income') incomeCount++;
      else expenseCount++;
    }

    const filtered = tab === 'all' ? transactions : transactions.filter((t) => t.type === tab);
    return {
      filtered,
      summary,
      counts: { all: transactions.length, income: incomeCount, expense: expenseCount },
    };
  }, [transactions, tab]);

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    toast({ title: 'Excluída', description: 'Transação removida.' });
  };

  return (
    <div className="space-y-5 max-w-full overflow-hidden pb-28 lg:pb-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl sm:text-2xl font-display font-bold">Transações</h1>
        <p className="text-sm text-muted-foreground">Todas as suas movimentações</p>
      </motion.div>

      {/* Resumo — 2 métricas */}
      {transactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-4 grid grid-cols-2 gap-3"
        >
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Receitas</p>
            <p className="text-lg sm:text-xl font-bold font-display truncate text-income">
              {formatBRL(summary.income)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{counts.income} registro(s)</p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Despesas</p>
            <p className="text-lg sm:text-xl font-bold font-display truncate text-expense">
              {formatBRL(summary.expense)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{counts.expense} registro(s)</p>
          </div>
        </motion.div>
      )}

      {/* Tabs segmentadas */}
      <div className="flex gap-2 p-1 rounded-2xl bg-muted/40 w-full">
        {(Object.keys(filterLabels) as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setTab(f)}
            className={cn(
              'flex-1 h-9 rounded-xl text-sm font-medium transition-colors',
              tab === f ? 'bg-background shadow-sm' : 'text-muted-foreground'
            )}
          >
            {filterLabels[f]} ({counts[f]})
          </button>
        ))}
      </div>

      <TransactionList
        transactions={filtered}
        onEdit={(id) => navigate(`/transacoes/editar/${id}`)}
        onDelete={handleDelete}
        pendingIds={pendingTransactionIds}
      />
    </div>
  );
}
