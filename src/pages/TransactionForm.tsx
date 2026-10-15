import { parseLocalDate } from '@/lib/finance/dates';
import { parseBRL } from '@/lib/finance/money';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useTransactions } from '@/contexts/TransactionContext';
import { useToast } from '@/hooks/use-toast';
import { TransactionCategory, TransactionType, categoryLabels, getCategoryColor, withCategoryAlpha } from '@/types/transaction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn, toLocalDateString } from '@/lib/utils';
import AccountPicker from '@/components/accounts/AccountPicker';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';

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
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const { user } = useAuth();
  const { activeWalletId } = useWallet();

  const handleCreateCategory = async () => {
    if (!newCatName || !user) return;
    const { data, error } = await supabase.from('custom_categories').insert({
      name: newCatName,
      type: type,
      user_id: user.id,
      wallet_id: activeWalletId || null
    }).select().single();

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível criar a categoria.', variant: 'destructive' });
      return;
    }

    // Update in memory for immediate use
    categoryLabels[newCatName] = newCatName;
    setCategory(newCatName);
    setIsNewCategoryOpen(false);
    setNewCatName("");
    toast({ title: 'Sucesso', description: 'Categoria criada!' });
  };

  const { transactions, addTransaction, updateTransaction } = useTransactions();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<TransactionCategory>('other');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(toLocalDateString());
  const [isRecurring, setIsRecurring] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);

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
        setAccountId(transaction.accountId ?? null);
      }
    }
  }, [id, transactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseBRL(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Digite um valor maior que zero.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    const transactionData = {
      type,
      category,
      amount: parsedAmount,
      description: description || categoryLabels[category],
      date,
      accountId,
    };

    if (isEditing) {
      await updateTransaction(id!, transactionData);
      toast({
        title: 'Atualizada!',
        description: 'Transação salva.',
      });
    } else {
      // Add the main transaction
      await addTransaction(transactionData);
      
      // If recurring, create transactions for the next 11 months
      if (isRecurring) {
        const baseDate = parseLocalDate(date);
        for (let i = 1; i <= 11; i++) {
          const futureDate = new Date(baseDate);
          futureDate.setMonth(futureDate.getMonth() + i);
          
          await addTransaction({
            ...transactionData,
            date: toLocalDateString(futureDate),
            description: `${description || categoryLabels[category]} (Recorrente)`,
          });
        }
        toast({
          title: type === 'income' ? '💰 Receita recorrente!' : '💸 Despesa recorrente!',
          description: `12 lançamentos criados de R$ ${parsedAmount.toFixed(2)}`,
        });
      } else {
        toast({
          title: type === 'income' ? '💰 Receita!' : '💸 Despesa!',
          description: `R$ ${parsedAmount.toFixed(2)}`,
        });
      }
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
      className="max-w-lg mx-auto pb-[120px] lg:pb-8"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" aria-label="Voltar" onClick={() => navigate(-1)} className="h-11 w-11">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-[22px] font-extrabold tracking-tight">
          {isEditing ? 'Editar' : 'Nova transação'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type Toggle */}
        <div className="segmented" role="tablist" aria-label="Tipo de transação">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={type === t}
              onClick={() => setType(t)}
              className={cn('segmented-item min-h-[44px] flex items-center justify-center gap-2', type === t && 'segmented-item-active')}
            >
              {t === 'expense' ? <TrendingDown className="w-4 h-4 text-expense" /> : <TrendingUp className="w-4 h-4 text-income" />}
              {t === 'expense' ? 'Despesa' : 'Receita'}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="bg-card border border-border rounded-[20px] p-5">
          <Label htmlFor="amount" className="text-[13px] font-semibold text-muted-foreground">Valor</Label>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-xl font-bold text-muted-foreground">R$</span>
            <input
              id="amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="flex-1 min-w-0 bg-transparent text-[40px] leading-none font-extrabold tracking-[-0.03em] tabular-nums outline-none placeholder:text-muted-foreground/50"
              autoFocus
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-semibold">Descrição</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex.: mercado, Uber"
            className="h-12 rounded-xl"
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
                  'flex flex-col items-center justify-center gap-1.5 h-20 p-2 rounded-xl transition-colors text-center border-2',
                  category === key ? 'border-primary' : 'bg-card border-border'
                )}
                style={
                  category === key
                    ? { backgroundColor: withCategoryAlpha(getCategoryColor(key), 0.14), borderColor: getCategoryColor(key) }
                    : undefined
                }
              >
                <span className="text-xl">{categoryEmojis[key as TransactionCategory] || '📁'}</span>
                <span className="text-xs font-semibold truncate w-full">{label}</span>
              </button>
            ))}

            {/* NEW CATEGORY BUTTON */}
            <Dialog open={isNewCategoryOpen} onOpenChange={setIsNewCategoryOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="flex flex-col items-center justify-center gap-1.5 h-20 p-2 rounded-xl text-center bg-card border-2 border-dashed border-border hover:border-primary/50"
                >
                  <span className="text-xl">➕</span>
                  <span className="text-xs font-semibold truncate w-full">Nova categoria</span>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Categoria</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Nome da Categoria</Label>
                    <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Ex: Viagem" />
                  </div>
                  <Button type="button" onClick={handleCreateCategory} className="w-full">Salvar Categoria</Button>
                </div>
              </DialogContent>
            </Dialog>

          </div>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label className="text-sm">Data</Label>
          <DatePickerField value={date} onChange={setDate} />
        </div>

        {/* Account */}
        <AccountPicker value={accountId} onChange={setAccountId} />

        {/* Recurring Checkbox - Only for new transactions */}
        {!isEditing && (
          <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-xl">
            <Checkbox
              id="recurring"
              checked={isRecurring}
              onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
            />
            <div className="flex-1">
              <label
                htmlFor="recurring"
                className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4 text-primary" />
                Repetir mensalmente
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Cria automaticamente nos próximos 12 meses
              </p>
            </div>
          </div>
        )}

        {/* Submit Button — fixo no rodapé */}
        <div className="fixed inset-x-0 bottom-0 z-50 px-4 pt-6 pb-[calc(16px+env(safe-area-inset-bottom))] bg-gradient-to-t from-background via-background to-transparent lg:static lg:p-0 lg:bg-none">
          <Button
            type="submit"
            className="w-full max-w-lg mx-auto flex h-14 text-base font-bold rounded-2xl"
            disabled={isLoading || !amount.trim()}
          >
            <Check className="w-5 h-5 mr-2" />
            {isEditing ? 'Salvar alterações' : type === 'expense' ? 'Salvar despesa' : 'Salvar receita'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
