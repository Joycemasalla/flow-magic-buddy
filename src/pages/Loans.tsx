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
          'glass-card rounded-xl p-5 hover-lift',
          !isPending && 'opacity-60'
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                isGiven ? 'bg-expense/10' : 'bg-income/10'
              )}
            >
              {isGiven ? (
                <ArrowUpRight className="w-5 h-5 text-expense" />
              ) : (
                <ArrowDownLeft className="w-5 h-5 text-income" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">{loan.loanPerson}</h3>
              <p className="text-sm text-muted-foreground">
                {isGiven ? 'Você emprestou' : 'Você pegou emprestado'}
              </p>
            </div>
          </div>
          <div
            className={cn(
              'px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1',
              isPending ? 'bg-warning/10 text-warning' : 'bg-income/10 text-income'
            )}
          >
            {isPending ? (
              <>
                <Clock className="w-3 h-3" />
                Pendente
              </>
            ) : (
              <>
                <Check className="w-3 h-3" />
                {isGiven ? 'Recebido' : 'Pago'}
              </>
            )}
          </div>
        </div>

        {loan.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {loan.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <p
            className={cn(
              'text-xl font-bold',
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
            >
              <Check className="w-4 h-4 mr-1" />
              {isGiven ? 'Recebi' : 'Paguei'}
            </Button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Empréstimos</h1>
          <p className="text-muted-foreground">
            Controle seus empréstimos dados e recebidos
          </p>
        </motion.div>

        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Empréstimo
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-5"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-expense/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-expense" />
            </div>
            <span className="text-sm text-muted-foreground">Emprestado</span>
          </div>
          <p className="text-2xl font-bold text-expense">
            R$ {stats.totalGiven.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-5"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-income/10 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5 text-income" />
            </div>
            <span className="text-sm text-muted-foreground">A Pagar</span>
          </div>
          <p className="text-2xl font-bold text-income">
            R$ {stats.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-5"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <HandCoins className="w-5 h-5 text-accent" />
            </div>
            <span className="text-sm text-muted-foreground">Saldo</span>
          </div>
          <p
            className={cn(
              'text-2xl font-bold',
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
          className="glass-card rounded-xl p-8 text-center"
        >
          <HandCoins className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum empréstimo</h3>
          <p className="text-muted-foreground mb-4">
            Registre empréstimos dados ou recebidos
          </p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Empréstimo
          </Button>
        </motion.div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Given Loans */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-expense" />
              Emprestado (A Receber)
            </h2>
            {givenLoans.length === 0 ? (
              <div className="glass-card rounded-xl p-6 text-center text-muted-foreground">
                Nenhum empréstimo dado
              </div>
            ) : (
              <div className="space-y-4">
                {givenLoans.map((loan, index) => renderLoanCard(loan, index))}
              </div>
            )}
          </div>

          {/* Received Loans */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ArrowDownLeft className="w-5 h-5 text-income" />
              Pego Emprestado (A Pagar)
            </h2>
            {receivedLoans.length === 0 ? (
              <div className="glass-card rounded-xl p-6 text-center text-muted-foreground">
                Nenhum empréstimo recebido
              </div>
            ) : (
              <div className="space-y-4">
                {receivedLoans.map((loan, index) => renderLoanCard(loan, index))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Empréstimo</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Loan Type Selector */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLoanType('given')}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-all text-center',
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
                    'p-4 rounded-lg border-2 transition-all text-center',
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

            <Button type="submit" className="w-full">
              Adicionar Empréstimo
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}