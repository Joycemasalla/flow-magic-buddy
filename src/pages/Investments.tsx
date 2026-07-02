import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Plus,
  Check,
  Clock,
  Landmark,
  PiggyBank,
  BarChart3,
  Bitcoin,
  Layers,
  Wallet,
  Coins,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTransactions } from '@/contexts/TransactionContext';
import { useToast } from '@/hooks/use-toast';
import {
  Investment,
  InvestmentType,
  investmentTypeLabels,
  investmentTypeColors,
} from '@/types/investment';
import { cn } from '@/lib/utils';
import { format, parseISO, isThisMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import NewInvestmentModal from '@/components/modals/NewInvestmentModal';
import InvestmentDetailsModal from '@/components/dashboard/InvestmentDetailsModal';
import { SwipeableCard } from '@/components/ui/SwipeableCard';
import InvestmentDistributionChart from '@/components/dashboard/InvestmentDistributionChart';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const iconMap: Record<InvestmentType, React.ElementType> = {
  tesouro_direto: Landmark,
  renda_fixa: PiggyBank,
  acoes: BarChart3,
  cripto: Bitcoin,
  fundos: Layers,
  poupanca: Wallet,
  outros: Coins,
};

type Tab = 'pending' | 'invested';

export default function Investments() {
  const { investments, markInvestmentAsDone, deleteInvestment } = useTransactions();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('pending');
  const [investmentToDelete, setInvestmentToDelete] = useState<Investment | null>(null);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);

  const { pending, invested, totalInvested, totalPending, monthTotal } = useMemo(() => {
    const pending: Investment[] = [];
    const invested: Investment[] = [];
    let totalInvested = 0;
    let totalPending = 0;
    let monthTotal = 0;

    for (const i of investments) {
      if (i.jaInvestido) {
        invested.push(i);
        totalInvested += i.valorInvestido;
        if (isThisMonth(parseISO(i.dataInvestimento))) monthTotal += i.valorInvestido;
      } else {
        pending.push(i);
        totalPending += i.valorInvestido;
      }
    }
    return { pending, invested, totalInvested, totalPending, monthTotal };
  }, [investments]);

  const list = tab === 'pending' ? pending : invested;

  const handleMarkAsDone = (investment: Investment) => {
    markInvestmentAsDone(investment.id);
    toast({
      title: 'Investimento realizado',
      description: `${investment.nome} registrado como despesa.`,
    });
  };

  const handleDelete = () => {
    if (!investmentToDelete) return;
    deleteInvestment(investmentToDelete.id);
    toast({ title: 'Investimento excluído' });
    setInvestmentToDelete(null);
  };

  return (
    <div className="space-y-5 max-w-full overflow-hidden pb-28 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-display font-bold">Investimentos</h1>
          <p className="text-sm text-muted-foreground truncate">Controle seus aportes</p>
        </motion.div>
        <Button onClick={() => setIsModalOpen(true)} className="min-h-[44px] shrink-0">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Novo</span>
        </Button>
      </div>

      {/* Resumo — 2 métricas */}
      {investments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-4 grid grid-cols-2 gap-3"
        >
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Investido</p>
            <p className="text-lg sm:text-xl font-bold font-display truncate text-income">
              R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Este mês: R$ {monthTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Pendente</p>
            <p className="text-lg sm:text-xl font-bold font-display truncate text-warning">
              R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{pending.length} aporte(s)</p>
          </div>
        </motion.div>
      )}

      {/* Distribution Chart */}
      {invested.length > 0 && <InvestmentDistributionChart investments={investments} />}

      {/* Tabs segmentadas */}
      {investments.length > 0 && (
        <div className="flex gap-2 p-1 rounded-2xl bg-muted/40 w-full">
          {([
            { id: 'pending' as const, label: `Pendentes (${pending.length})` },
            { id: 'invested' as const, label: `Investidos (${invested.length})` },
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
      {investments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 text-center"
        >
          <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-base font-semibold mb-1">Nenhum investimento</h3>
          <p className="text-sm text-muted-foreground mb-4">Comece cadastrando seu primeiro aporte.</p>
          <Button onClick={() => setIsModalOpen(true)} className="min-h-[44px]">
            <Plus className="w-4 h-4 mr-2" /> Adicionar investimento
          </Button>
        </motion.div>
      ) : list.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-2xl p-6 text-center"
        >
          <Check className={cn('w-8 h-8 mx-auto mb-2', tab === 'pending' ? 'text-income' : 'text-muted-foreground')} />
          <p className="text-sm text-muted-foreground">
            {tab === 'pending' ? 'Nenhum aporte pendente 🎉' : 'Nenhum aporte realizado ainda.'}
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((investment, index) => {
            const Icon = iconMap[investment.tipo];
            const color = investmentTypeColors[investment.tipo];

            return (
              <motion.div
                key={investment.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <SwipeableCard
                  onEdit={() => setEditingInvestment(investment)}
                  onDelete={() => setInvestmentToDelete(investment)}
                  onClick={() => setSelectedInvestment(investment)}
                  className="glass-card rounded-2xl p-4"
                >
                  {/* Linha 1: nome + tipo */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-[15px] truncate">{investment.nome}</h3>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {investmentTypeLabels[investment.tipo]}
                          {investment.jaInvestido && ` · ${format(parseISO(investment.dataInvestimento), 'dd/MM', { locale: ptBR })}`}
                        </p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold shrink-0',
                        investment.jaInvestido ? 'bg-income/10 text-income' : 'bg-warning/15 text-warning'
                      )}
                    >
                      {investment.jaInvestido ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {investment.jaInvestido ? 'OK' : 'Pend.'}
                    </div>
                  </div>

                  {/* Linha 2: valor + ação */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <p className="text-base font-bold font-display">
                      R$ {investment.valorInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    {!investment.jaInvestido && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsDone(investment);
                        }}
                        className="h-8 px-3 text-xs text-income hover:text-income hover:bg-income/10"
                      >
                        <Check className="w-4 h-4 mr-1" /> Feito
                      </Button>
                    )}
                  </div>
                </SwipeableCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modais */}
      <NewInvestmentModal
        isOpen={isModalOpen || !!editingInvestment}
        onClose={() => { setIsModalOpen(false); setEditingInvestment(null); }}
        editingInvestment={editingInvestment}
      />

      <AlertDialog open={!!investmentToDelete} onOpenChange={() => setInvestmentToDelete(null)}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir investimento?</AlertDialogTitle>
            <AlertDialogDescription>
              {investmentToDelete?.jaInvestido
                ? 'Isso também excluirá a transação de despesa associada.'
                : 'Esta ação não pode ser desfeita.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InvestmentDetailsModal
        investment={selectedInvestment}
        onClose={() => setSelectedInvestment(null)}
        onEdit={(inv) => {
          setSelectedInvestment(null);
          setEditingInvestment(inv);
        }}
      />
    </div>
  );
}
