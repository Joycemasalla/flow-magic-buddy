import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, TrendingUp, TrendingDown } from 'lucide-react';
import { useTransactions } from '@/contexts/TransactionContext';
import { useToast } from '@/hooks/use-toast';
import { TransactionCategory, TransactionType, categoryLabels } from '@/types/transaction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const categoryEmojis: Record<TransactionCategory, string> = {
  salary: '💰',
  food: '🍔',
  transport: '🚗',
  shopping: '🛍️',
  health: '💊',
  entertainment: '🎮',
  bills: '📄',
  education: '📚',
  investment: '📈',
  loan: '🤝',
  other: '📦',
};

export default function TransactionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { transactions, addTransaction, updateTransaction } = useTransactions();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<TransactionCategory>('other');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const isEditing = !!id;

  useEffect(() => {
    if (id) {
      const transaction = transactions.find((t) => t.id === id);
      if (transaction) {
        setType(transaction.type);
        setCategory(transaction.category);
        setAmount(transaction.amount.toString());
        setDescription(transaction.description);
        setDate(transaction.date);
      }
    }
  }, [id, transactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Digite um valor maior que zero.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (isEditing) {
      updateTransaction(id!, {
        type,
        category,
        amount: parsedAmount,
        description: description || categoryLabels[category],
        date,
      });
      toast({
        title: 'Atualizada!',
        description: 'Transação salva.',
      });
    } else {
      addTransaction({
        type,
        category,
        amount: parsedAmount,
        description: description || categoryLabels[category],
        date,
      });
      toast({
        title: type === 'income' ? '💰 Receita!' : '💸 Despesa!',
        description: `R$ ${parsedAmount.toFixed(2)}`,
      });
    }

    setIsLoading(false);
    navigate('/');
  };

  const filteredCategories = Object.entries(categoryLabels).filter(([key]) => {
    if (type === 'income') {
      return ['salary', 'investment', 'other'].includes(key);
    }
    return key !== 'salary';
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto pb-8"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-10 w-10">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-display font-bold">
          {isEditing ? 'Editar' : 'Nova transação'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type Toggle */}
        <div className="flex gap-2 p-1 bg-muted rounded-xl">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3.5 rounded-lg font-semibold transition-all',
              type === 'expense'
                ? 'bg-expense text-white shadow-md'
                : 'text-muted-foreground'
            )}
          >
            <TrendingDown className="w-5 h-5" />
            Despesa
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3.5 rounded-lg font-semibold transition-all',
              type === 'income'
                ? 'bg-income text-white shadow-md'
                : 'text-muted-foreground'
            )}
          >
            <TrendingUp className="w-5 h-5" />
            Receita
          </button>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label className="text-sm">Valor</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-muted-foreground font-medium">
              R$
            </span>
            <Input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="pl-12 h-14 text-2xl font-bold"
              autoFocus
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-sm">Descrição</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Mercado, Uber..."
            className="h-12"
          />
        </div>

        {/* Category Grid */}
        <div className="space-y-2">
          <Label className="text-sm">Categoria</Label>
          <div className="grid grid-cols-3 gap-2">
            {filteredCategories.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key as TransactionCategory)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-all text-center',
                  category === key
                    ? 'bg-primary/10 border-2 border-primary'
                    : 'bg-muted/50 border-2 border-transparent'
                )}
              >
                <span className="text-xl">{categoryEmojis[key as TransactionCategory]}</span>
                <span className="text-xs font-medium truncate w-full">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label className="text-sm">Data</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-12"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-14 text-lg font-semibold"
          disabled={isLoading || !amount.trim()}
        >
          <Check className="w-5 h-5 mr-2" />
          {isEditing ? 'Salvar' : 'Adicionar'}
        </Button>
      </form>
    </motion.div>
  );
}
