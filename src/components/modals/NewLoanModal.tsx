import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Check,
  CalendarIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useTransactions } from '@/contexts/TransactionContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface NewLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewLoanModal({ isOpen, onClose }: NewLoanModalProps) {
  const [loanType, setLoanType] = useState<'given' | 'received'>('given');
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loanDate, setLoanDate] = useState<Date>(new Date());

  const { addTransaction } = useTransactions();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setLoanType('given');
      setPerson('');
      setAmount('');
      setDescription('');
      setLoanDate(new Date());
    }
  }, [isOpen]);

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

    if (!person.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite o nome da pessoa.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    await addTransaction({
      type: loanType === 'given' ? 'expense' : 'income',
      category: 'loan',
      amount: parsedAmount,
      description: description || `Empréstimo - ${person}`,
      date: loanDate.toISOString().split('T')[0],
      isLoan: true,
      loanPerson: person,
      loanStatus: 'pending',
    });

    toast({
      title: loanType === 'given' ? '💸 Empréstimo registrado' : '💰 Empréstimo recebido',
      description: `${person}: R$ ${parsedAmount.toFixed(2)}`,
    });

    setIsProcessing(false);
    onClose();
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
                <h2 className="text-lg sm:text-xl font-bold">Novo Empréstimo</h2>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Loan Type Selector */}
                <div className="space-y-2">
                  <Label>Tipo de empréstimo</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setLoanType('given')}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all text-center',
                        loanType === 'given'
                          ? 'border-expense bg-expense/10 text-expense'
                          : 'border-border hover:border-muted-foreground bg-muted/50'
                      )}
                    >
                      <ArrowUpRight className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm font-medium block">Emprestei</span>
                      <span className="text-xs text-muted-foreground">Você deu dinheiro</span>
                    </motion.button>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setLoanType('received')}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all text-center',
                        loanType === 'received'
                          ? 'border-income bg-income/10 text-income'
                          : 'border-border hover:border-muted-foreground bg-muted/50'
                      )}
                    >
                      <ArrowDownLeft className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm font-medium block">Peguei</span>
                      <span className="text-xs text-muted-foreground">Você pegou dinheiro</span>
                    </motion.button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nome da pessoa</Label>
                  <Input
                    value={person}
                    onChange={(e) => setPerson(e.target.value)}
                    placeholder="Ex: João, Maria..."
                    required
                  />
                </div>

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
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Data do empréstimo</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(loanDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[70]" align="start">
                      <Calendar
                        mode="single"
                        selected={loanDate}
                        onSelect={(date) => date && setLoanDate(date)}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Motivo ou detalhes do empréstimo..."
                    rows={2}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isProcessing}
                  className="w-full gap-2"
                >
                  <Check className="w-4 h-4" />
                  Registrar Empréstimo
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
