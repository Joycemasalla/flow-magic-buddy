import { parseBRL } from '@/lib/finance/money';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell } from 'lucide-react';
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

    const parsedAmount = parseBRL(amount);
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
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[55]"
          />

          {/* Bottom-sheet padrão */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[60] bg-card border-t border-border rounded-t-3xl safe-area-bottom max-h-[92dvh] overflow-y-auto overscroll-contain"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-card z-10">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            <div className="px-4 sm:px-5 pb-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4 text-accent stroke-[1.75]" />
                  </div>
                  <h2 className="text-lg font-bold truncate">Novo Gasto Mensal</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 shrink-0">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs font-medium">Nome do gasto</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Aluguel, Netflix, Internet"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-11 rounded-xl"
                    disabled={isProcessing}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="amount" className="text-xs font-medium">Valor</Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                      R$
                    </span>
                    <Input
                      id="amount"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-9 h-11 rounded-xl"
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="dueDay" className="text-xs font-medium">Vence dia</Label>
                    <Input
                      id="dueDay"
                      type="number"
                      min="1"
                      max="31"
                      value={dueDay}
                      onChange={(e) => setDueDay(e.target.value)}
                      className="h-11 rounded-xl"
                      disabled={isProcessing}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="alertDays" className="text-xs font-medium">Alertar (dias)</Label>
                    <Input
                      id="alertDays"
                      type="number"
                      min="0"
                      max="30"
                      value={alertDays}
                      onChange={(e) => setAlertDays(e.target.value)}
                      className="h-11 rounded-xl"
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-xs font-medium">Categoria</Label>
                  <Select value={category} onValueChange={(value) => setCategory(value as TransactionCategory)}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[70]">
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <details className="group">
                  <summary className="cursor-pointer text-xs text-muted-foreground py-1 select-none list-none flex items-center gap-1">
                    <span className="group-open:rotate-90 transition-transform">›</span> Adicionar descrição
                  </summary>
                  <div className="pt-2">
                    <Textarea
                      id="description"
                      placeholder="Detalhes desse gasto..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="rounded-xl resize-none h-20"
                      disabled={isProcessing}
                    />
                  </div>
                </details>

                {/* Sticky action */}
                <div className="flex gap-2 pt-2 sticky bottom-0 bg-card">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 h-11 rounded-xl"
                    disabled={isProcessing}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-[1.4] h-11 rounded-xl bg-accent hover:bg-accent/90"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Salvando...' : 'Adicionar'}
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
