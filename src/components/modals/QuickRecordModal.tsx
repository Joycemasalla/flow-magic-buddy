import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTransactions } from '@/contexts/TransactionContext';
import { useToast } from '@/hooks/use-toast';
import { TransactionCategory, TransactionType, categoryLabels } from '@/types/transaction';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface QuickRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const quickCategories: { key: TransactionCategory; label: string; keywords: string[] }[] = [
  { key: 'food', label: '🍔 Comida', keywords: ['mercado', 'restaurante', 'ifood', 'lanche'] },
  { key: 'transport', label: '🚗 Transporte', keywords: ['uber', 'gasolina', 'ônibus'] },
  { key: 'shopping', label: '🛍️ Compras', keywords: ['roupa', 'loja', 'shopping'] },
  { key: 'bills', label: '📄 Contas', keywords: ['luz', 'água', 'internet', 'aluguel'] },
  { key: 'entertainment', label: '🎮 Lazer', keywords: ['cinema', 'netflix', 'bar'] },
  { key: 'health', label: '💊 Saúde', keywords: ['farmácia', 'médico', 'academia'] },
  { key: 'salary', label: '💰 Salário', keywords: ['salário', 'freelance'] },
  { key: 'other', label: '📦 Outros', keywords: [] },
];

export default function QuickRecordModal({ isOpen, onClose }: QuickRecordModalProps) {
  const [step, setStep] = useState<'amount' | 'category'>('amount');
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('other');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addTransaction } = useTransactions();
  const { toast } = useToast();

  // Reset and focus on open
  useEffect(() => {
    if (isOpen) {
      setStep('amount');
      setType('expense');
      setAmount('');
      setCategory('other');
      setDescription('');
      setShowAdvanced(false);
      setSelectedDate(new Date());
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleAmountSubmit = () => {
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Digite um valor maior que zero.',
        variant: 'destructive',
      });
      return;
    }
    setStep('category');
  };

  const handleCategorySelect = async (selectedCategory: TransactionCategory) => {
    setCategory(selectedCategory);
    setIsProcessing(true);

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    const categoryLabel = categoryLabels[selectedCategory];

    addTransaction({
      type,
      amount: parsedAmount,
      category: selectedCategory,
      description: description || categoryLabel,
      date: selectedDate.toISOString().split('T')[0],
    });

    const isToday = selectedDate.toDateString() === new Date().toDateString();
    const dateText = isToday ? '' : ` em ${format(selectedDate, 'dd/MM')}`;

    toast({
      title: type === 'income' ? '💰 Receita registrada!' : '💸 Despesa registrada!',
      description: `${categoryLabel}: R$ ${parsedAmount.toFixed(2)}${dateText}`,
    });

    setIsProcessing(false);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (step === 'amount') {
        handleAmountSubmit();
      }
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setIsCalendarOpen(false);
    }
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

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
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[55]"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[60] bg-card border-t border-border rounded-t-3xl safe-area-bottom max-h-[90vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-card">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            <div className="px-4 sm:px-5 pb-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold">
                  {step === 'amount' ? 'Novo registro' : 'Categoria'}
                </h2>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <AnimatePresence mode="wait">
                {step === 'amount' ? (
                  <motion.div
                    key="amount"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {/* Type Toggle */}
                    <div className="flex gap-2 p-1 bg-muted rounded-xl">
                      <button
                        type="button"
                        onClick={() => setType('expense')}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all text-sm sm:text-base',
                          type === 'expense'
                            ? 'bg-expense text-white shadow-md'
                            : 'text-muted-foreground'
                        )}
                      >
                        <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
                        Despesa
                      </button>
                      <button
                        type="button"
                        onClick={() => setType('income')}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all text-sm sm:text-base',
                          type === 'income'
                            ? 'bg-income text-white shadow-md'
                            : 'text-muted-foreground'
                        )}
                      >
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                        Receita
                      </button>
                    </div>

                    {/* Amount Input */}
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl sm:text-2xl text-muted-foreground font-medium">
                        R$
                      </span>
                      <Input
                        ref={inputRef}
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="0,00"
                        className="pl-12 sm:pl-14 h-14 sm:h-16 text-2xl sm:text-3xl font-bold border-2 focus:border-primary"
                        autoFocus
                      />
                    </div>

                    {/* Optional Description */}
                    <Input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descrição (opcional)"
                      className="h-11 sm:h-12"
                    />

                    {/* Advanced Options Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center justify-center gap-2 w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showAdvanced ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Menos opções
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Mais opções (data retroativa)
                        </>
                      )}
                    </button>

                    {/* Advanced Options */}
                    <AnimatePresence>
                      {showAdvanced && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3 overflow-hidden"
                        >
                          <div className="space-y-2">
                            <Label className="text-sm">Data da transação</Label>
                            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'w-full justify-start text-left font-normal h-11 sm:h-12',
                                    !isToday && 'text-primary'
                                  )}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {isToday
                                    ? 'Hoje'
                                    : format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={selectedDate}
                                  onSelect={handleDateSelect}
                                  disabled={(date) => date > new Date()}
                                  initialFocus
                                  className="pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Continue Button */}
                    <Button
                      onClick={handleAmountSubmit}
                      disabled={!amount.trim()}
                      className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold"
                      size="lg"
                    >
                      Continuar
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="category"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    {/* Amount Display */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3 sm:p-4 bg-muted/50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">Valor:</span>
                        <span className={cn(
                          'text-xl sm:text-2xl font-bold',
                          type === 'income' ? 'text-income' : 'text-expense'
                        )}>
                          {type === 'income' ? '+' : '-'} R$ {parseFloat(amount.replace(',', '.')).toFixed(2)}
                        </span>
                      </div>
                      {!isToday && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(selectedDate, 'dd/MM/yyyy')}
                        </span>
                      )}
                    </div>

                    {/* Category Grid */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {quickCategories
                        .filter(cat => type === 'income' ? ['salary', 'other'].includes(cat.key) : cat.key !== 'salary')
                        .map((cat) => (
                          <motion.button
                            key={cat.key}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCategorySelect(cat.key)}
                            disabled={isProcessing}
                            className="flex items-center justify-center gap-1 sm:gap-2 p-3 sm:p-4 bg-muted/50 hover:bg-muted rounded-xl font-medium transition-colors text-sm sm:text-base"
                          >
                            {cat.label}
                          </motion.button>
                        ))}
                    </div>

                    {/* Back Button */}
                    <Button
                      variant="ghost"
                      onClick={() => setStep('amount')}
                      className="w-full h-11 sm:h-12"
                    >
                      Voltar
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
