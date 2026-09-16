import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, HandCoins, ArrowUpRight, ArrowDownLeft, Check, Clock, CalendarIcon, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTransactions } from '@/contexts/TransactionContext';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import TransactionDetailsModal from '@/components/dashboard/TransactionDetailsModal';
import { Transaction } from '@/types/transaction';
import { SwipeableCard } from '@/components/ui/SwipeableCard';

function PartialPaymentForm({
  loan,
  onConfirm,
}: {
  loan: Transaction;
  onConfirm: (value: number, settleAll: boolean) => void;
}) {
  const isGiven = loan.type === 'expense';
  const paid = loan.loanPaidAmount ?? 0;
  const remaining = Math.max(0, loan.amount - paid);
  const [value, setValue] = useState('');

  const handleSubmit = (settleAll: boolean) => {
    const parsed = parseFloat(value.replace(',', '.')) || 0;
    onConfirm(parsed, settleAll);
    setValue('');
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold">{isGiven ? 'Quanto você recebeu?' : 'Quanto você pagou?'}</p>
        <p className="text-[11px] text-muted-foreground">
          Falta R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ {loan.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
        <Input
          type="text"
          inputMode="decimal"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="0,00"
          className="pl-9 h-9 text-sm"
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="flex-1 h-9 text-xs" onClick={() => handleSubmit(false)}>
          Registrar
        </Button>
        <Button size="sm" variant="outline" className="flex-1 h-9 text-xs" onClick={() => handleSubmit(true)}>
          Quitar tudo
        </Button>
      </div>
    </div>
  );
}

export default function Loans() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Transaction | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Transaction | null>(null);
  const [tab, setTab] = useState<'receive' | 'pay' | 'done'>('receive');

  const [loanType, setLoanType] = useState<'given' | 'received'>('given');
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loanDate, setLoanDate] = useState<Date>(new Date());

  const openNewLoan = () => {
    setEditingLoan(null);
    setLoanType('given');
    setPerson('');
    setAmount('');
    setPaidAmount('');
    setDescription('');
    setLoanDate(new Date());
    setIsModalOpen(true);
  };

  const openEditLoan = (loan: Transaction) => {
    setEditingLoan(loan);
    setLoanType(loan.type === 'expense' ? 'given' : 'received');
    setPerson(loan.loanPerson ?? '');
    setAmount(String(loan.amount).replace('.', ','));
    setPaidAmount(loan.loanPaidAmount ? String(loan.loanPaidAmount).replace('.', ',') : '');
    setDescription(loan.description ?? '');
    setLoanDate(new Date(loan.date + 'T12:00:00'));
    setIsModalOpen(true);
  };

  const loans = useMemo(() => transactions.filter((t) => t.isLoan), [transactions]);
  const remaining = (l: Transaction) => Math.max(0, l.amount - (l.loanPaidAmount ?? 0));

  const toReceive = useMemo(
    () => loans.filter((l) => l.type === 'expense' && l.loanStatus === 'pending'),
    [loans]
  );
  const toPay = useMemo(
    () => loans.filter((l) => l.type === 'income' && l.loanStatus === 'pending'),
    [loans]
  );
  const settled = useMemo(
    () => loans.filter((l) => l.loanStatus !== 'pending').sort((a, b) => (b.loanSettledDate ?? '').localeCompare(a.loanSettledDate ?? '')),
    [loans]
  );

  const totalReceive = toReceive.reduce((s, l) => s + remaining(l), 0);
  const totalPay = toPay.reduce((s, l) => s + remaining(l), 0);

  const list = tab === 'receive' ? toReceive : tab === 'pay' ? toPay : settled;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: 'Valor inválido', description: 'Digite um valor maior que zero.', variant: 'destructive' });
      return;
    }
    if (!person.trim()) {
      toast({ title: 'Nome obrigatório', description: 'Digite o nome da pessoa.', variant: 'destructive' });
      return;
    }

    addTransaction({
      type: loanType === 'given' ? 'expense' : 'income',
      category: 'loan',
      amount: parsedAmount,
      description: description || `Empréstimo - ${person}`,
      date: `${loanDate.getFullYear()}-${String(loanDate.getMonth() + 1).padStart(2, '0')}-${String(loanDate.getDate()).padStart(2, '0')}`,
      isLoan: true,
      loanPerson: person,
      loanStatus: 'pending',
    });

    toast({
      title: loanType === 'given' ? '💸 Empréstimo registrado' : '💰 Empréstimo recebido',
      description: `${person}: R$ ${parsedAmount.toFixed(2)}`,
    });

    setIsModalOpen(false);
    setPerson(''); setAmount(''); setDescription(''); setLoanDate(new Date());
  };

  const handleRegisterPayment = (loan: Transaction, paidValue: number, settleAll: boolean) => {
    const current = loan.loanPaidAmount ?? 0;
    const newPaid = settleAll
      ? loan.amount
      : Math.min(loan.amount, Number((current + paidValue).toFixed(2)));

    if (!settleAll && paidValue <= 0) {
      toast({ title: 'Valor inválido', description: 'Informe um valor maior que zero.', variant: 'destructive' });
      return;
    }

    const isFullySettled = newPaid >= loan.amount;
    const updates: Partial<Transaction> = { loanPaidAmount: newPaid };
    if (isFullySettled) {
      updates.loanStatus = loan.type === 'expense' ? 'received' : 'paid';
      const d = new Date();
      updates.loanSettledDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    updateTransaction(loan.id, updates);

    const verb = loan.type === 'expense' ? 'recebido' : 'pago';
    if (isFullySettled) {
      toast({
        title: loan.type === 'expense' ? '✅ Empréstimo Recebido!' : '✅ Empréstimo Pago!',
        description: `Total ${verb}: R$ ${newPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      });
    } else {
      const added = newPaid - current;
      toast({
        title: '💵 Pagamento registrado',
        description: `+R$ ${added.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${verb}. Falta R$ ${(loan.amount - newPaid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      });
    }
  };

  const renderLoanCard = (loan: Transaction, index: number) => {
    const isGiven = loan.type === 'expense';
    const isPending = loan.loanStatus === 'pending';
    const paid = loan.loanPaidAmount ?? 0;
    const rem = Math.max(0, loan.amount - paid);
    const progress = loan.amount > 0 ? Math.min(100, (paid / loan.amount) * 100) : 0;
    const hasPartial = isPending && paid > 0;

    const status: { label: string; color: string; bg: string; Icon: typeof Clock } = !isPending
      ? { label: isGiven ? 'Recebido' : 'Pago', color: 'text-income', bg: 'bg-income/10', Icon: CheckCircle2 }
      : hasPartial
      ? { label: 'Parcial', color: 'text-primary', bg: 'bg-primary/10', Icon: Clock }
      : { label: 'Pendente', color: 'text-warning', bg: 'bg-warning/10', Icon: Clock };
    const StatusIcon = status.Icon;

    return (
      <motion.div
        key={loan.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
      >
        <SwipeableCard
          onEdit={() => setSelectedLoan(loan)}
          onDelete={() => {
            deleteTransaction(loan.id);
            toast({ title: 'Empréstimo excluído' });
          }}
          onClick={() => setSelectedLoan(loan)}
          className={cn(
            'glass-card rounded-2xl p-4 relative overflow-hidden',
            !isPending && 'opacity-75'
          )}
        >
          {/* Linha 1: pessoa + status */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <h3 className={cn('font-semibold text-[15px] truncate', !isPending && 'text-muted-foreground')}>
                {loan.loanPerson}
              </h3>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {isGiven ? 'Você emprestou' : 'Você pegou'} · {format(new Date(loan.date + 'T12:00:00'), "dd/MM/yy")}
              </p>
            </div>
            <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold shrink-0', status.bg, status.color)}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </div>
          </div>

          {/* Progresso (parcial) */}
          {isPending && hasPartial && (
            <div className="mb-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">
                  {isGiven ? 'Recebido' : 'Pago'}: <span className="font-semibold text-foreground">R$ {paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </span>
                <span className="text-muted-foreground">
                  Falta: <span className="font-semibold text-foreground">R$ {rem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn('h-full transition-all', isGiven ? 'bg-income' : 'bg-primary')}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Linha 2: valor + ação */}
          <div className="flex items-center justify-between pt-3 border-t border-border/50 gap-2">
            <p
              className={cn(
                'text-base font-bold font-display',
                isPending && isGiven && 'text-expense',
                isPending && !isGiven && 'text-income',
                !isPending && 'text-muted-foreground line-through'
              )}
            >
              R$ {loan.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>

            {isPending && (
              <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-3 text-xs text-income hover:text-income hover:bg-income/10">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      {isGiven ? 'Recebi' : 'Paguei'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 z-[70]" align="end">
                    <PartialPaymentForm
                      loan={loan}
                      onConfirm={(val, settleAll) => handleRegisterPayment(loan, val, settleAll)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {!isPending && loan.loanSettledDate && (
            <p className="mt-2 text-[11px] text-income/80 flex items-center gap-1">
              <Check className="w-3 h-3" />
              Quitado em {format(new Date(loan.loanSettledDate + 'T12:00:00'), "dd/MM/yy")}
            </p>
          )}
        </SwipeableCard>
      </motion.div>
    );
  };

  return (
    <div className="space-y-5 max-w-full overflow-hidden pb-28 lg:pb-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 min-w-0"
        >
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold">Empréstimos</h1>
          <p className="text-sm text-muted-foreground truncate">Controle o que entra e sai</p>
        </motion.div>

        <Button onClick={() => setIsModalOpen(true)} className="min-h-[44px] shrink-0">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Novo</span>
        </Button>
      </div>

      {/* Resumo — 2 métricas */}
      {loans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-4 grid grid-cols-2 gap-3"
        >
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">A receber</p>
            <p className="text-lg sm:text-xl font-bold font-display truncate text-income">
              R$ {totalReceive.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{toReceive.length} pendente(s)</p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">A pagar</p>
            <p className="text-lg sm:text-xl font-bold font-display truncate text-expense">
              R$ {totalPay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{toPay.length} pendente(s)</p>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      {loans.length > 0 && (
        <div className="flex gap-2 p-1 rounded-2xl bg-muted/40 w-full">
          {([
            { id: 'receive' as const, label: `A receber (${toReceive.length})` },
            { id: 'pay' as const, label: `A pagar (${toPay.length})` },
            { id: 'done' as const, label: `Quitados (${settled.length})` },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 h-9 rounded-xl text-xs sm:text-sm font-medium transition-colors truncate px-2',
                tab === t.id ? 'bg-background shadow-sm' : 'text-muted-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      {loans.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 text-center"
        >
          <HandCoins className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-base font-semibold mb-1">Nenhum empréstimo</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Registre empréstimos dados ou recebidos e acompanhe o status.
          </p>
          <Button onClick={() => setIsModalOpen(true)} className="min-h-[44px]">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Empréstimo
          </Button>
        </motion.div>
      ) : list.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-2xl p-6 text-center"
        >
          <CheckCircle2 className={cn('w-8 h-8 mx-auto mb-2', tab === 'done' ? 'text-muted-foreground' : 'text-income')} />
          <p className="text-sm text-muted-foreground">
            {tab === 'receive' && 'Ninguém te deve nada 🎉'}
            {tab === 'pay' && 'Você não deve nada 🎉'}
            {tab === 'done' && 'Nenhum empréstimo quitado ainda.'}
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((loan, index) => renderLoanCard(loan, index))}
        </div>
      )}

      {/* Modal — bottom-sheet friendly */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-lg mx-auto top-4 translate-y-0 sm:top-1/2 sm:-translate-y-1/2 max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Empréstimo</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Input value={person} onChange={(e) => setPerson(e.target.value)} placeholder="Nome da pessoa" required />
            </div>

            <div className="space-y-2">
              <Label>Valor</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
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
              <Label>Data</Label>
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

      <TransactionDetailsModal
        transaction={selectedLoan}
        onClose={() => setSelectedLoan(null)}
      />
    </div>
  );
}
