import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { toast } from '@/hooks/use-toast';
import { toLocalDateString } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Goal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  category: string | null;
  wallet_id: string | null;
}

export default function Goals() {
  const { user } = useAuth();
  const { activeWalletId } = useWallet();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [deadline, setDeadline] = useState('');

  const fetchGoals = async () => {
    if (!user) return;
    setLoading(true);
    const query = supabase.from('goals').select('*').order('created_at', { ascending: false });
    const { data } = activeWalletId
      ? await query.eq('wallet_id', activeWalletId)
      : await query.is('wallet_id', null);
    if (data) setGoals(data as Goal[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeWalletId]);

  const reset = () => {
    setTitle(''); setTarget(''); setCurrent(''); setDeadline('');
  };

  const handleCreate = async () => {
    if (!user || !title || !target) {
      toast({ title: 'Preencha título e valor alvo', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('goals').insert({
      user_id: user.id,
      wallet_id: activeWalletId,
      title,
      target_amount: Number(target),
      current_amount: Number(current) || 0,
      deadline: deadline || null,
    });
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Meta criada!' });
    reset();
    setOpen(false);
    fetchGoals();
  };

  const handleUpdateProgress = async (id: string, newAmount: number) => {
    const { error } = await supabase.from('goals').update({ current_amount: newAmount }).eq('id', id);
    if (!error) fetchGoals();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('goals').delete().eq('id', id);
    fetchGoals();
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-5 pb-28 lg:pb-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-display font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-primary stroke-[1.5]" />
            Metas
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {activeWalletId ? 'Metas compartilhadas' : 'Suas metas pessoais'}
          </p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button className="rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Plus className="w-4 h-4 mr-2" /> Nova Meta
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl z-[60]">
            <SheetHeader><SheetTitle>Nova Meta</SheetTitle></SheetHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Título</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Viagem, Carro novo..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Valor alvo (R$)</Label>
                  <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="10000" />
                </div>
                <div>
                  <Label>Valor atual (R$)</Label>
                  <Input type="number" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div>
                <Label>Prazo (opcional)</Label>
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <Button onClick={handleCreate} className="w-full rounded-2xl bg-gradient-primary">Criar Meta</Button>
            </div>
          </SheetContent>
        </Sheet>
      </motion.div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>
      ) : goals.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-3xl p-10 text-center space-y-3">
          <Target className="w-12 h-12 mx-auto text-muted-foreground/50 stroke-[1.5]" />
          <h2 className="font-display font-semibold">Nenhuma meta ainda</h2>
          <p className="text-sm text-muted-foreground">Defina metas financeiras para acompanhar seu progresso.</p>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence>
            {goals.map((goal) => {
              const pct = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
              const remaining = Math.max(0, goal.target_amount - goal.current_amount);
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card rounded-3xl p-5 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-display font-semibold">{goal.title}</h3>
                      {goal.deadline && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(goal.deadline + 'T12:00:00'), "dd 'de' MMM yyyy", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                    <button onClick={() => handleDelete(goal.id)} className="text-muted-foreground hover:text-expense p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">{fmt(goal.current_amount)}</span>
                      <span className="text-muted-foreground">de {fmt(goal.target_amount)}</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <div className="flex justify-between text-xs">
                      <span className="text-primary font-semibold flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> {pct.toFixed(0)}%
                      </span>
                      <span className="text-muted-foreground">Faltam {fmt(remaining)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Adicionar valor"
                      className="text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const v = Number((e.target as HTMLInputElement).value);
                          if (v > 0) {
                            handleUpdateProgress(goal.id, goal.current_amount + v);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
