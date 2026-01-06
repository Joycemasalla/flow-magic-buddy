import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Plus,
  Filter,
  Check,
  Clock,
  Landmark,
  PiggyBank,
  BarChart3,
  Bitcoin,
  Layers,
  Wallet,
  Coins,
  Calendar,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTransactions } from '@/contexts/TransactionContext';
import { useToast } from '@/hooks/use-toast';
import {
  Investment,
  InvestmentType,
  investmentTypeLabels,
  investmentTypeColors,
  TesouroDiretoDetails,
  AcoesDetails,
  CriptoDetails,
  RendaFixaDetails,
  PoupancaDetails,
} from '@/types/investment';
import { cn } from '@/lib/utils';
import { format, parseISO, isThisMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import NewInvestmentModal from '@/components/modals/NewInvestmentModal';
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

type StatusFilter = 'all' | 'pending' | 'invested';
type TypeFilter = InvestmentType | 'all';

export default function Investments() {
  const { investments, markInvestmentAsDone, deleteInvestment } = useTransactions();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [investmentToDelete, setInvestmentToDelete] = useState<Investment | null>(null);

  const stats = useMemo(() => {
    const total = investments
      .filter((i) => i.jaInvestido)
      .reduce((sum, i) => sum + i.valorInvestido, 0);
    const pending = investments
      .filter((i) => !i.jaInvestido)
      .reduce((sum, i) => sum + i.valorInvestido, 0);
    const thisMonth = investments
      .filter((i) => i.jaInvestido && isThisMonth(parseISO(i.dataInvestimento)))
      .reduce((sum, i) => sum + i.valorInvestido, 0);

    const byType = investments.reduce((acc, inv) => {
      if (inv.jaInvestido) {
        acc[inv.tipo] = (acc[inv.tipo] || 0) + inv.valorInvestido;
      }
      return acc;
    }, {} as Record<InvestmentType, number>);

    return { total, pending, thisMonth, byType };
  }, [investments]);

  const filteredInvestments = useMemo(() => {
    return investments.filter((i) => {
      if (statusFilter === 'pending' && i.jaInvestido) return false;
      if (statusFilter === 'invested' && !i.jaInvestido) return false;
      if (typeFilter !== 'all' && i.tipo !== typeFilter) return false;
      return true;
    });
  }, [investments, statusFilter, typeFilter]);

  const handleMarkAsDone = (investment: Investment) => {
    markInvestmentAsDone(investment.id);
    toast({
      title: '✅ Investimento realizado!',
      description: `${investment.nome} - R$ ${investment.valorInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} registrado como despesa.`,
    });
  };

  const handleDelete = () => {
    if (!investmentToDelete) return;
    deleteInvestment(investmentToDelete.id);
    toast({
      title: 'Investimento excluído',
      description: `${investmentToDelete.nome} foi removido.`,
    });
    setInvestmentToDelete(null);
  };

  const renderDetails = (investment: Investment) => {
    const details = investment.detalhesEspecificos;
    if (!details) return null;

    switch (investment.tipo) {
      case 'tesouro_direto': {
        const d = details as TesouroDiretoDetails;
        return (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {d.titulo} | Taxa: {d.taxa}% | Venc: {format(parseISO(d.vencimento), 'MM/yyyy')}
          </p>
        );
      }
      case 'acoes': {
        const d = details as AcoesDetails;
        return (
          <p className="text-xs text-muted-foreground mt-1">
            {d.quantidade} ações @ R$ {d.precoMedio.toFixed(2)}
          </p>
        );
      }
      case 'cripto': {
        const d = details as CriptoDetails;
        return (
          <p className="text-xs text-muted-foreground mt-1">
            {d.quantidade} {d.moeda} @ R$ {d.precoMedio.toFixed(2)}
          </p>
        );
      }
      case 'renda_fixa': {
        const d = details as RendaFixaDetails;
        return (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {d.instituicao} | {d.taxa}% {d.tipoTaxa.toUpperCase()} | Venc: {format(parseISO(d.vencimento), 'MM/yyyy')}
          </p>
        );
      }
      case 'poupanca': {
        const d = details as PoupancaDetails;
        return (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {d.instituicao} {d.objetivo && `- ${d.objetivo}`}
          </p>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 max-w-full overflow-x-hidden pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 min-w-0"
        >
          <h1 className="text-xl sm:text-2xl font-display font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
            <span className="truncate">Investimentos</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Controle seus aportes mensais
          </p>
        </motion.div>

        <Button 
          onClick={() => setIsModalOpen(true)} 
          size="sm" 
          className="gap-1.5 flex-shrink-0 h-9"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-3"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-6 h-6 rounded-md bg-income/10 flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-income" />
            </div>
            <span className="text-[10px] text-muted-foreground truncate">Total</span>
          </div>
          <p className="text-sm sm:text-lg font-bold text-income truncate">
            R$ {stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-3"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-6 h-6 rounded-md bg-warning/10 flex items-center justify-center">
              <Clock className="w-3 h-3 text-warning" />
            </div>
            <span className="text-[10px] text-muted-foreground truncate">Pendente</span>
          </div>
          <p className="text-sm sm:text-lg font-bold text-warning truncate">
            R$ {stats.pending.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-3"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
              <Calendar className="w-3 h-3 text-primary" />
            </div>
            <span className="text-[10px] text-muted-foreground truncate">Este Mês</span>
          </div>
          <p className="text-sm sm:text-lg font-bold text-primary truncate">
            R$ {stats.thisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
          {(['all', 'pending', 'invested'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                statusFilter === status
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {status === 'all' && 'Todos'}
              {status === 'pending' && 'Pendentes'}
              {status === 'invested' && 'Investidos'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="text-xs bg-muted/50 border-0 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-primary"
          >
            <option value="all">Todos os tipos</option>
            {(Object.keys(investmentTypeLabels) as InvestmentType[]).map((type) => (
              <option key={type} value={type}>
                {investmentTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Investment List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredInvestments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-10 text-muted-foreground"
            >
              <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhum investimento encontrado</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setIsModalOpen(true)}
              >
                Adicionar investimento
              </Button>
            </motion.div>
          ) : (
            filteredInvestments.map((investment, index) => {
              const Icon = iconMap[investment.tipo];
              const color = investmentTypeColors[investment.tipo];
              
              return (
                <motion.div
                  key={investment.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card rounded-xl p-3 sm:p-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color }} />
                    </div>

                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm sm:text-base truncate">{investment.nome}</h3>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {investmentTypeLabels[investment.tipo]}
                          </p>
                          {renderDetails(investment)}
                        </div>

                        <Badge
                          variant={investment.jaInvestido ? 'default' : 'secondary'}
                          className={cn(
                            'shrink-0 text-[10px] sm:text-xs px-1.5 sm:px-2',
                            investment.jaInvestido
                              ? 'bg-income/10 text-income border-income/20'
                              : 'bg-warning/10 text-warning border-warning/20'
                          )}
                        >
                          {investment.jaInvestido ? (
                            <>
                              <Check className="w-3 h-3 mr-0.5 sm:mr-1" />
                              <span className="hidden sm:inline">Investido</span>
                              <span className="sm:hidden">OK</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 mr-0.5 sm:mr-1" />
                              <span className="hidden sm:inline">Pendente</span>
                              <span className="sm:hidden">Pend.</span>
                            </>
                          )}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border/50">
                        <p className="text-base sm:text-lg font-bold">
                          R$ {investment.valorInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>

                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {investment.jaInvestido ? (
                            <span className="text-[10px] sm:text-xs text-muted-foreground">
                              {format(parseISO(investment.dataInvestimento), 'dd/MM', { locale: ptBR })}
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-income border-income/30 hover:bg-income/10 h-7 sm:h-8 text-xs px-2 sm:px-3"
                              onClick={() => handleMarkAsDone(investment)}
                            >
                              <Check className="w-3 h-3" />
                              <span className="hidden sm:inline">Marcar Feito</span>
                              <span className="sm:hidden">Feito</span>
                            </Button>
                          )}
                          
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setInvestmentToDelete(investment)}
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* New Investment Modal */}
      <NewInvestmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
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
    </div>
  );
}
