import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTransactions } from '@/contexts/TransactionContext';
import { useAccounts } from '@/contexts/AccountContext';
import { useToast } from '@/hooks/use-toast';
import TransactionList from '@/components/dashboard/TransactionList';
import { calculatePeriodSummary } from '@/lib/finance/rules';
import { formatBRL } from '@/lib/finance/money';
import { cn } from '@/lib/utils';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categoryLabels, TransactionCategory } from '@/types/transaction';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

type FilterType = 'all' | 'income' | 'expense';

const filterLabels: Record<FilterType, string> = {
  all: 'Todas',
  income: 'Receitas',
  expense: 'Despesas',
};

export default function Transactions() {
  const { transactions, deleteTransaction, pendingTransactionIds } = useTransactions();
  const { accounts } = useAccounts();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { filtered, summary, counts } = useMemo(() => {
    let result = transactions;

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((t) => t.description.toLowerCase().includes(lowerSearch));
    }

    if (selectedAccount !== 'all') {
      result = result.filter((t) => t.accountId === selectedAccount);
    }

    if (selectedCategory !== 'all') {
      result = result.filter((t) => t.category === selectedCategory);
    }

    const summary = calculatePeriodSummary(result, [], {
      includeFuture: true,
      includeInvestments: true,
      includeLoans: true,
    });

    let incomeCount = 0;
    let expenseCount = 0;
    for (const t of result) {
      if (t.type === 'income') incomeCount++;
      else expenseCount++;
    }

    const filtered = tab === 'all' ? result : result.filter((t) => t.type === tab);
    return {
      filtered,
      summary,
      counts: { all: result.length, income: incomeCount, expense: expenseCount },
    };
  }, [transactions, tab, searchTerm, selectedAccount, selectedCategory]);

  const activeFiltersCount = (selectedAccount !== 'all' ? 1 : 0) + (selectedCategory !== 'all' ? 1 : 0);

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

      {/* Busca e Filtros */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar transações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-muted/20 border-border/40 rounded-xl"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="rounded-xl px-3 border-border/40 gap-2">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filtros</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="px-1.5 min-w-[20px] rounded-md flex justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-4 rounded-2xl space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Conta</label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Todas as contas" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Todas as contas</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Categoria</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-64">
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                className="w-full text-xs text-muted-foreground h-8 mt-2"
                onClick={() => {
                  setSelectedAccount('all');
                  setSelectedCategory('all');
                }}
              >
                Limpar filtros
              </Button>
            )}
          </PopoverContent>
        </Popover>
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
