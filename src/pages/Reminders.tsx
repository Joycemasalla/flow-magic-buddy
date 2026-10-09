import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Bell, Calendar, AlertTriangle, Clock, CheckCircle2, Flame, RotateCcw } from 'lucide-react';
import { useTransactions } from '@/contexts/TransactionContext';
import { useToast } from '@/hooks/use-toast';
import { categoryLabels, TransactionCategory, Reminder } from '@/types/transaction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { SwipeableCard } from '@/components/ui/SwipeableCard';
import { parseBRL } from '@/lib/finance/money';

const currentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const isPaidThisMonth = (r: Reminder) => r.lastPaidMonth === currentMonthKey();

const getDaysUntilDue = (dueDay: number) => {
  const today = new Date();
  const currentDay = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const clampedDue = Math.min(dueDay, daysInMonth);
  if (clampedDue === currentDay) return 0;
  if (clampedDue > currentDay) return clampedDue - currentDay;
  return daysInMonth - currentDay + Math.min(dueDay, 31);
};

export default function Reminders() {
  const { reminders, addReminder, updateReminder, deleteReminder, markReminderAsPaid, deleteTransaction } = useTransactions();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tab, setTab] = useState<'pending' | 'paid'>('pending');

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('10');
  const [alertDays, setAlertDays] = useState('3');
  const [category, setCategory] = useState<TransactionCategory>('bills');
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setTitle(''); setAmount(''); setDueDay('10'); setAlertDays('3');
    setCategory('bills'); setIsActive(true); setEditingId(null);
  };

  const openModal = (reminder?: Reminder) => {
    if (reminder) {
      setEditingId(reminder.id);
      setTitle(reminder.title);
      setAmount(reminder.amount.toString());
      setDueDay(reminder.dueDay.toString());
      setAlertDays(String(reminder.alertDaysBefore ?? 3));
      setCategory(reminder.category);
      setIsActive(reminder.isActive);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseBRL(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: 'Valor inválido', description: 'Digite um valor maior que zero.', variant: 'destructive' });
      return;
    }
    const parsedDueDay = parseInt(dueDay);
    if (isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) {
      toast({ title: 'Dia inválido', description: 'Digite um dia entre 1 e 31.', variant: 'destructive' });
      return;
    }
    const parsedAlert = parseInt(alertDays);
    const safeAlert = isNaN(parsedAlert) || parsedAlert < 0 ? 3 : Math.min(parsedAlert, 30);

    const payload = {
      title,
      description: title,
      amount: parsedAmount,
      type: 'monthly' as const,
      dueDay: parsedDueDay,
      category,
      isActive,
      alertDaysBefore: safeAlert,
    };

    if (editingId) {
      updateReminder(editingId, payload);
      toast({ title: 'Gasto atualizado' });
    } else {
      addReminder(payload);
      toast({ title: 'Gasto mensal criado' });
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteReminder(id);
    toast({ title: 'Gasto removido' });
  };

  const handleUndoPaid = async (r: Reminder) => {
    if (r.lastTransactionId) {
      await deleteTransaction(r.lastTransactionId);
    }
    await updateReminder(r.id, { lastPaidMonth: null, lastTransactionId: null });
    toast({ title: 'Marcado como pendente novamente' });
  };

  const activeReminders = useMemo(() => reminders.filter((r) => r.isActive), [reminders]);
  const pending = useMemo(
    () => activeReminders.filter((r) => !isPaidThisMonth(r)).sort((a, b) => getDaysUntilDue(a.dueDay) - getDaysUntilDue(b.dueDay)),
    [activeReminders]
  );
  const paid = useMemo(
    () => activeReminders.filter(isPaidThisMonth).sort((a, b) => a.dueDay - b.dueDay),
    [activeReminders]
  );

  const totalPending = pending.reduce((s, r) => s + r.amount, 0);
  const totalPaid = paid.reduce((s, r) => s + r.amount, 0);
  const totalMonthly = activeReminders.reduce((s, r) => s + r.amount, 0);

  const list = tab === 'pending' ? pending : paid;

  const monthLabel = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-5 max-w-full overflow-hidden pb-28 lg:pb-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 min-w-0"
        >
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold">Gastos Mensais</h1>
          <p className="text-sm text-muted-foreground truncate capitalize">{monthLabel}</p>
        </motion.div>

        <Button onClick={() => openModal()} className="min-h-[44px] shrink-0">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Novo Gasto</span>
        </Button>
      </div>

      {/* Resumo — clean, 2 métricas */}
      {activeReminders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-4 grid grid-cols-2 gap-3"
        >
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">A pagar</p>
            <p className="text-lg sm:text-xl font-bold font-display truncate text-expense">
              R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              de R$ {totalMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Pagos este mês</p>
            <p className="text-lg sm:text-xl font-bold font-display truncate text-income">
              R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {paid.length} de {activeReminders.length}
            </p>
          </div>
        </motion.div>
      )}

      {/* Tabs simples */}
      {activeReminders.length > 0 && (
        <div className="flex gap-2 p-1 rounded-2xl bg-muted/40 w-full">
          {([
            { id: 'pending' as const, label: `A pagar (${pending.length})` },
            { id: 'paid' as const, label: `Pagos (${paid.length})` },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 h-9 rounded-xl text-sm font-medium transition-colors',
                tab === t.id ? 'bg-background shadow-sm' : 'text-muted-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      {activeReminders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 text-center"
        >
          <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-base font-semibold mb-1">Nenhum gasto mensal</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Cadastre contas fixas (aluguel, internet, streaming…) e receba alertas antes do vencimento.
          </p>
          <Button onClick={() => openModal()} className="min-h-[44px]">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Gasto Mensal
          </Button>
        </motion.div>
      ) : list.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-2xl p-6 text-center"
        >
          <CheckCircle2 className={cn('w-8 h-8 mx-auto mb-2', tab === 'pending' ? 'text-income' : 'text-muted-foreground')} />
          <p className="text-sm text-muted-foreground">
            {tab === 'pending' ? 'Tudo em dia este mês 🎉' : 'Nenhum pagamento registrado ainda este mês.'}
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((reminder, index) => {
            const days = getDaysUntilDue(reminder.dueDay);
            const paidNow = isPaidThisMonth(reminder);
            const alertWindow = reminder.alertDaysBefore ?? 3;
            const isAlerting = !paidNow && days <= alertWindow;
            const isToday = !paidNow && days === 0;

            let status: { label: string; color: string; bg: string; Icon: typeof Clock };
            if (paidNow) {
              status = { label: 'Pago', color: 'text-income', bg: 'bg-income/10', Icon: CheckCircle2 };
            } else if (isToday) {
              status = { label: 'Hoje', color: 'text-warning', bg: 'bg-warning/15', Icon: Flame };
            } else if (isAlerting) {
              status = { label: `${days}d`, color: 'text-expense', bg: 'bg-expense/15', Icon: AlertTriangle };
            } else {
              status = { label: `${days}d`, color: 'text-muted-foreground', bg: 'bg-muted/60', Icon: Clock };
            }
            const StatusIcon = status.Icon;

            return (
              <SwipeableCard
                key={reminder.id}
                onEdit={() => openModal(reminder)}
                onDelete={() => handleDelete(reminder.id)}
                className={cn(
                  'glass-card rounded-2xl p-4 relative overflow-hidden',
                  isAlerting && !paidNow && 'ring-1 ring-expense/25',
                  paidNow && 'opacity-70'
                )}
              >
                {isAlerting && !paidNow && (
                  <span className="pointer-events-none absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-expense to-transparent" />
                )}

                {/* Linha 1: título + status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className={cn('font-semibold text-[15px] truncate', paidNow && 'line-through text-muted-foreground')}>
                      {reminder.title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {categoryLabels[reminder.category]} · vence dia {reminder.dueDay}
                    </p>
                  </div>
                  <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold shrink-0', status.bg, status.color)}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </div>
                </div>

                {/* Linha 2: valor + ação */}
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <p className={cn('text-base font-bold font-display', paidNow ? 'text-muted-foreground' : 'text-expense')}>
                    R$ {reminder.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  {paidNow ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleUndoPaid(reminder); }}
                      className="h-8 px-2 text-xs text-muted-foreground"
                      title="Desfazer pagamento"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      Desfazer
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); markReminderAsPaid(reminder.id); }}
                      className="h-8 px-3 text-xs text-income hover:text-income hover:bg-income/10"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Paguei
                    </Button>
                  )}
                </div>

                {isAlerting && !paidNow && (
                  <p className="mt-2 text-[11px] text-expense/90 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {days === 0 ? 'Vence hoje' : `Vence em ${days} ${days === 1 ? 'dia' : 'dias'}`}
                  </p>
                )}
              </SwipeableCard>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Gasto Mensal' : 'Novo Gasto Mensal'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Aluguel, Netflix, Internet"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Vence dia</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as TransactionCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Alertar (dias antes)</Label>
                <Input
                  type="number"
                  min="0"
                  max="30"
                  value={alertDays}
                  onChange={(e) => setAlertDays(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="active" className="cursor-pointer">Ativo (lembrar todo mês)</Label>
              <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <Button type="submit" className="w-full">
              {editingId ? 'Salvar' : 'Adicionar'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
