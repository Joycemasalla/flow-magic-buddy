import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Bell, Calendar, Pencil, Trash2, AlertTriangle, Clock } from 'lucide-react';
import { useTransactions } from '@/contexts/TransactionContext';
import { useToast } from '@/hooks/use-toast';
import { categoryLabels, TransactionCategory, Reminder } from '@/types/transaction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

export default function Reminders() {
  const { reminders, addReminder, updateReminder, deleteReminder } = useTransactions();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'monthly' | 'single'>('monthly');
  const [dueDay, setDueDay] = useState('10');
  const [category, setCategory] = useState<TransactionCategory>('bills');
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAmount('');
    setType('monthly');
    setDueDay('10');
    setCategory('bills');
    setIsActive(true);
    setEditingId(null);
  };

  const openModal = (reminder?: Reminder) => {
    if (reminder) {
      setEditingId(reminder.id);
      setTitle(reminder.title);
      setDescription(reminder.description);
      setAmount(reminder.amount.toString());
      setType(reminder.type);
      setDueDay(reminder.dueDay.toString());
      setCategory(reminder.category);
      setIsActive(reminder.isActive);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

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

    const parsedDueDay = parseInt(dueDay);
    if (isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) {
      toast({
        title: 'Dia inválido',
        description: 'Digite um dia entre 1 e 31.',
        variant: 'destructive',
      });
      return;
    }

    if (editingId) {
      updateReminder(editingId, {
        title,
        description,
        amount: parsedAmount,
        type,
        dueDay: parsedDueDay,
        category,
        isActive,
      });
      toast({
        title: 'Lembrete atualizado',
        description: 'O lembrete foi salvo com sucesso.',
      });
    } else {
      addReminder({
        title,
        description,
        amount: parsedAmount,
        type,
        dueDay: parsedDueDay,
        category,
        isActive,
      });
      toast({
        title: 'Lembrete criado',
        description: 'O lembrete foi adicionado com sucesso.',
      });
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteReminder(id);
    toast({
      title: 'Lembrete excluído',
      description: 'O lembrete foi removido.',
    });
  };

  const getDaysUntilDue = (dueDay: number) => {
    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    if (dueDay === currentDay) return 0;
    if (dueDay > currentDay) return dueDay - currentDay;
    return daysInMonth - currentDay + dueDay;
  };

  const getDueStatus = (dueDay: number) => {
    const days = getDaysUntilDue(dueDay);
    if (days === 0) return { label: 'Hoje', color: 'text-warning', bg: 'bg-warning/10' };
    if (days <= 3) return { label: `${days} dias`, color: 'text-expense', bg: 'bg-expense/10' };
    return { label: `${days} dias`, color: 'text-income', bg: 'bg-income/10' };
  };

  const activeReminders = reminders.filter((r) => r.isActive);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 min-w-0"
        >
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold">Lembretes</h1>
          <p className="text-sm text-muted-foreground truncate">
            Gerencie suas contas
          </p>
        </motion.div>

        <Button onClick={() => openModal()} className="min-h-[44px] shrink-0">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Novo Lembrete</span>
        </Button>
      </div>

      {/* Reminders List */}
      {activeReminders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-6 sm:p-8 text-center"
        >
          <Bell className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold mb-2">Nenhum lembrete</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Adicione lembretes para não esquecer de pagar suas contas
          </p>
          <Button onClick={() => openModal()} className="min-h-[44px]">
            <Plus className="w-4 h-4 mr-2" />
            Criar Lembrete
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeReminders.map((reminder, index) => {
            const status = getDueStatus(reminder.dueDay);
            return (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card rounded-xl p-4 sm:p-5 hover-lift active:scale-[0.98] transition-transform"
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm sm:text-base truncate">{reminder.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {categoryLabels[reminder.category]}
                      </p>
                    </div>
                  </div>
                  <div className={cn('px-2 py-1 rounded-full text-xs font-medium shrink-0', status.bg, status.color)}>
                    <Clock className="w-3 h-3 inline mr-1" />
                    {status.label}
                  </div>
                </div>

                {reminder.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-1 sm:line-clamp-2">
                    {reminder.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-border">
                  <div className="min-w-0 flex-1">
                    <p className="text-base sm:text-lg font-bold text-expense">
                      R$ {reminder.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Dia {reminder.dueDay} • {reminder.type === 'monthly' ? 'Mensal' : 'Único'}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openModal(reminder)}
                      className="min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px]"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(reminder.id)}
                      className="text-destructive hover:text-destructive min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Lembrete' : 'Novo Lembrete'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Conta de Internet"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes do lembrete"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    R$
                  </span>
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
                <Label>Dia do vencimento</Label>
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
                <Label>Tipo</Label>
                <Select value={type} onValueChange={(v) => setType(v as 'monthly' | 'single')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="single">Único</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as TransactionCategory)}>
                  <SelectTrigger>
                    <SelectValue />
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
            </div>

            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="active" className="cursor-pointer">
                Lembrete ativo
              </Label>
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            <Button type="submit" className="w-full">
              {editingId ? 'Salvar Alterações' : 'Criar Lembrete'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}