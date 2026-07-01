import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Bell,
  Calendar as CalendarIcon,
} from 'lucide-react';
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
import { useTransactions } from '@/contexts/TransactionContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { TransactionCategory, categoryLabels } from '@/types/transaction';

interface NewReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryOptions = [
  { value: 'bills', label: categoryLabels['bills'] },
  { value: 'food', label: categoryLabels['food'] },
  { value: 'transport', label: categoryLabels['transport'] },
  { value: 'shopping', label: categoryLabels['shopping'] },
  { value: 'health', label: categoryLabels['health'] },
  { value: 'entertainment', label: categoryLabels['entertainment'] },
  { value: 'education', label: categoryLabels['education'] },
  { value: 'other', label: categoryLabels['other'] },
] as const;

export default function NewReminderModal({ isOpen, onClose }: NewReminderModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('10');
  const [alertDays, setAlertDays] = useState('3');
  const [category, setCategory] = useState<TransactionCategory>('bills');
  const [isProcessing, setIsProcessing] = useState(false);

  const { addReminder } = useTransactions();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setAmount('');
      setDueDay('10');
      setAlertDays('3');
      setCategory('bills');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite um nome para o gasto mensal.',
        variant: 'destructive',
      });
      return;
    }

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Digite um valor maior que zero.',
        variant: 'destructive',
      });
      return;
    }

    const parsedDueDay = parseInt(dueDay);
    if (isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) {
      toast({
        title: 'Dia inválido',
        description: 'Digite um dia entre 1 e 31.',
        variant: 'destructive',
      });
      return;
    }

    const parsedAlert = parseInt(alertDays);
    const safeAlert = isNaN(parsedAlert) || parsedAlert < 0 ? 3 : Math.min(parsedAlert, 30);

    setIsProcessing(true);

    try {
      await addReminder({
        title,
        description,
        amount: parsedAmount,
        type: 'monthly',
        dueDay: parsedDueDay,
        category,
        isActive: true,
        alertDaysBefore: safeAlert,
      });

      toast({
        title: '✅ Gasto mensal criado',
        description: `${title} — R$ ${parsedAmount.toFixed(2)}`,
      });

      setIsProcessing(false);
      onClose();
    } catch (error) {
      toast({
        title: 'Erro ao criar gasto',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto lg:max-w-lg"
          >
            <div className="glass-elevated rounded-3xl p-6 lg:p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-accent/15 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-accent stroke-[1.5]" />
                  </div>
                  <h2 className="text-2xl font-bold">Novo Alerta</h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 stroke-[1.5]" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Título do Alerta
                  </Label>
                  <Input
                    id="title"
                    placeholder="Ex: Conta de Luz"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="rounded-2xl bg-muted/40 border-border/40 h-11"
                    disabled={isProcessing}
                  />
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-medium">
                    Valor
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                      R$
                    </span>
                    <Input
                      id="amount"
                      placeholder="0,00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-10 rounded-2xl bg-muted/40 border-border/40 h-11"
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                {/* Due Day */}
                <div className="space-y-2">
                  <Label htmlFor="dueDay" className="text-sm font-medium">
                    Dia do Mês (1-31)
                  </Label>
                  <Input
                    id="dueDay"
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="rounded-2xl bg-muted/40 border-border/40 h-11"
                    disabled={isProcessing}
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">
                    Categoria
                  </Label>
                  <Select value={category} onValueChange={(value) => setCategory(value as TransactionCategory)}>
                    <SelectTrigger className="rounded-2xl bg-muted/40 border-border/40 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Descrição (opcional)
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Adicione detalhes sobre o alerta..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="rounded-2xl bg-muted/40 border-border/40 resize-none h-24"
                    disabled={isProcessing}
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 rounded-2xl h-11"
                    disabled={isProcessing}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 rounded-2xl h-11 bg-accent hover:bg-accent/90"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Criando...' : 'Criar Alerta'}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
