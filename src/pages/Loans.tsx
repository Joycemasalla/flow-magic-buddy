import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, HandCoins, ArrowUpRight, ArrowDownLeft, Check, Clock } from 'lucide-react';
import { useTransactions } from '@/contexts/TransactionContext';
import { useToast } from '@/hooks/use-toast';
import { TransactionType } from '@/types/transaction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function Loans() {
  const { transactions, addTransaction, updateTransaction } = useTransactions();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loanType, setLoanType] = useState<'given' | 'received'>('given');
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const loans = useMemo(() => {
    return transactions.filter((t) => t.isLoan);
  }, [transactions]);

  const givenLoans = loans.filter((l) => l.type === 'expense');
  const receivedLoans = loans.filter((l) => l.type === 'income');

  const stats = useMemo(() => {
    const totalGiven = givenLoans
      .filter((l) => l.loanStatus === 'pending')
      .reduce((sum, l) => sum + l.amount, 0);

    const totalReceived = receivedLoans
      .filter((l) => l.loanStatus === 'pending')
      .reduce((sum, l) => sum + l.amount, 0);

    return {
      totalGiven,
      totalReceived,
      balance: totalGiven - totalReceived,
    };
  }, [givenLoans, receivedLoans]);

  const handleSubmit = (e: React.FormEvent) => {
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

    addTransaction({
      type: loanType === 'given' ? 'expense' : 'income',
      category: 'loan',
      amount: parsedAmount,
      description: description || `Empréstimo - ${person}`,
      date: new Date().toISOString().split('T')[0],
      isLoan: true,
      loanPerson: person,
      loanStatus: 'pending',
    });

    toast({
      title: loanType === 'given' ? '💸 Empréstimo registrado' : '💰 Empréstimo recebido',
      description: `${person}: R$ ${parsedAmount.toFixed(2)}`,
    });

    setIsModalOpen(false);
    setPerson('');
    setAmount('');
    setDescription('');
  };

  const handleStatusChange = (id: string, type: TransactionType) => {
    const newStatus = type === 'expense' ? 'received' : 'paid';
    updateTransaction(id, { loanStatus: newStatus });
    toast({
      title: type === 'expense' ? '✅ Recebido!' : '✅ Pago!',
      description: 'Status do empréstimo atualizado.',
    });
  };

  const renderLoanCard = (loan: typeof loans[0], index: number) => {
    const isGiven = loan.type === 'expense';
    const isPending = loan.loanStatus === 'pending';

    return (
      <motion.div
        key={loan.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={cn(
          'glass-card rounded-xl p-4 sm:p-5 hover-lift active:scale-[0.98] transition-transform',
          !isPending && 'opacity-60'
        )}
      >
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div
              className={cn(
                'w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0',
                isGiven ? 'bg-expense/10' : 'bg-income/10'
              )}
            >
              {isGiven ? (
                <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-expense" />
              ) : (
                <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5 text-income" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm sm:text-base truncate">{loan.loanPerson}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {isGiven ? 'Você emprestou' : 'Você pegou'}
              </p>
            </div>
          </div>
          <div
            className={cn(
              'px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shrink-0',
              isPending ? 'bg-warning/10 text-warning' : 'bg-income/10 text-income'
            )}
          >
            {isPending ? (
              <>
                <Clock className="w-3 h-3" />
                <span className="hidden sm:inline">Pendente</span>
              </>
            ) : (
              <>
                <Check className="w-3 h-3" />
                <span className="hidden sm:inline">{isGiven ? 'Recebido' : 'Pago'}</span>
              </>
            )}
          </div>
        </div>

        {loan.description && (
          <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-1 sm:line-clamp-2">
            {loan.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-border">
          <p
            className={cn(
              'text-lg sm:text-xl font-bold',
              isGiven ? 'text-expense' : 'text-income'
            )}
          >
            {isGiven ? '-' : '+'} R${' '}
            {loan.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>

          {isPending && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange(loan.id, loan.type)}
              className="min-h-[36px] sm:min-h-[40px] text-xs sm:text-sm"
            >
              <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              {isGiven ? 'Recebi' : 'Paguei'}
            </Button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 min-w-0"
        >
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold">Empréstimos</h1>
          <p className="text-sm text-muted-foreground truncate">
            Controle seus empréstimos
          </p>
        </motion.div>

        <Button onClick={() => setIsModalOpen(true)} className="min-h-[44px] shrink-0">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Novo Empréstimo</span>
        </Button>
      </div>

      {/* Summary Cards - Horizontal scroll on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide sm:grid sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 min-w-[140px] sm:min-w-0 shrink-0 sm:shrink"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-expense/10 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-expense" />
            </div>
            <span className="text-xs text-muted-foreground">Emprestado</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-expense">
            R$ {stats.totalGiven.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-4 min-w-[140px] sm:min-w-0 shrink-0 sm:shrink"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-income/10 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 text-income" />
            </div>
            <span className="text-xs text-muted-foreground">A Pagar</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-income">
            R$ {stats.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-4 min-w-[140px] sm:min-w-0 shrink-0 sm:shrink"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <HandCoins className="w-4 h-4 text-accent" />
            </div>
            <span className="text-xs text-muted-foreground">Saldo</span>
          </div>
          <p
            className={cn(
              'text-lg sm:text-2xl font-bold',
              stats.balance >= 0 ? 'text-income' : 'text-expense'
            )}
          >
            R$ {Math.abs(stats.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </motion.div>
      </div>

      {/* Loans Lists */}
      {loans.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-6 sm:p-8 text-center"
        >
          <HandCoins className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold mb-2">Nenhum empréstimo</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Registre empréstimos dados ou recebidos
          </p>
          <Button onClick={() => setIsModalOpen(true)} className="min-h-[44px]">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Empréstimo
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
          {/* Given Loans */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-expense" />
              Emprestado (A Receber)
            </h2>
            {givenLoans.length === 0 ? (
              <div className="glass-card rounded-xl p-4 sm:p-6 text-center text-muted-foreground text-sm">
                Nenhum empréstimo dado
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {givenLoans.map((loan, index) => renderLoanCard(loan, index))}
              </div>
            )}
          </div>

          {/* Received Loans */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5 text-income" />
              Pego Emprestado (A Pagar)
            </h2>
            {receivedLoans.length === 0 ? (
              <div className="glass-card rounded-xl p-4 sm:p-6 text-center text-muted-foreground text-sm">
                Nenhum empréstimo recebido
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {receivedLoans.map((loan, index) => renderLoanCard(loan, index))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg mx-auto">
          <DialogHeader>
            <DialogTitle>Novo Empréstimo</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Loan Type Selector */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLoanType('given')}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all text-center',
                    loanType === 'given'
                      ? 'border-expense bg-expense/10 text-expense'
                      : 'border-border hover:border-muted-foreground'
                  )}
                >
                  <ArrowUpRight className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-sm font-medium">Emprestei</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoanType('received')}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all text-center',
                    loanType === 'received'
                      ? 'border-income bg-income/10 text-income'
                      : 'border-border hover:border-muted-foreground'
                  )}
                >
                  <ArrowDownLeft className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-sm font-medium">Peguei</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pessoa</Label>
              <Input
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                placeholder="Nome da pessoa"
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
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes do empréstimo"
                rows={2}
              />
            </div>

            <Button type="submit" className="w-full min-h-[44px]">
              Adicionar Empréstimo
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}