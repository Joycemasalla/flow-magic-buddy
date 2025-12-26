import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useTransactions } from '@/contexts/TransactionContext';
import { useToast } from '@/hooks/use-toast';
import { TransactionCategory, TransactionType, categoryLabels } from '@/types/transaction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

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

    if (!date) {
      toast({
        title: 'Data inválida',
        description: 'Selecione uma data válida.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (isEditing) {
      updateTransaction(id!, {
        type,
        category,
        amount: parsedAmount,
        description: description || (type === 'income' ? 'Receita' : 'Despesa'),
        date,
      });
      toast({
        title: 'Transação atualizada',
        description: 'A transação foi salva com sucesso.',
      });
    } else {
      addTransaction({
        type,
        category,
        amount: parsedAmount,
        description: description || (type === 'income' ? 'Receita' : 'Despesa'),
        date,
      });
      toast({
        title: type === 'income' ? '💰 Receita adicionada!' : '💸 Despesa adicionada!',
        description: `${description || (type === 'income' ? 'Receita' : 'Despesa')}: R$ ${parsedAmount.toFixed(2)}`,
      });
    }

    setIsLoading(false);
    navigate('/');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto"
    >
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold">
            {isEditing ? 'Editar Transação' : 'Nova Transação'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Altere os dados da transação' : 'Registre uma nova movimentação'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-6">
        {/* Type Selector */}
        <div className="space-y-2">
          <Label>Tipo</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('income')}
              className={cn(
                'p-4 rounded-lg border-2 transition-all text-center font-medium',
                type === 'income'
                  ? 'border-income bg-income/10 text-income'
                  : 'border-border hover:border-muted-foreground'
              )}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={cn(
                'p-4 rounded-lg border-2 transition-all text-center font-medium',
                type === 'expense'
                  ? 'border-expense bg-expense/10 text-expense'
                  : 'border-border hover:border-muted-foreground'
              )}
            >
              Despesa
            </button>
          </div>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as TransactionCategory)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label>Valor</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              R$
            </span>
            <Input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="pl-10 text-lg"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label>Descrição</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Compras no supermercado"
            rows={3}
          />
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label>Data</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 text-lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              {isEditing ? 'Salvar Alterações' : 'Adicionar'}
            </>
          )}
        </Button>
      </form>
    </motion.div>
  );
}