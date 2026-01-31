import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Calendar, Clock, Check, FileText, Landmark, PiggyBank, BarChart3, Bitcoin, Layers, Wallet, Coins } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
  FundosDetails,
} from '@/types/investment';

interface InvestmentDetailsModalProps {
  investment: Investment | null;
  onClose: () => void;
}

const iconMap: Record<InvestmentType, React.ElementType> = {
  tesouro_direto: Landmark,
  renda_fixa: PiggyBank,
  acoes: BarChart3,
  cripto: Bitcoin,
  fundos: Layers,
  poupanca: Wallet,
  outros: Coins,
};

export default function InvestmentDetailsModal({ investment, onClose }: InvestmentDetailsModalProps) {
  if (!investment) return null;

  const Icon = iconMap[investment.tipo];
  const color = investmentTypeColors[investment.tipo];

  const renderSpecificDetails = () => {
    const details = investment.detalhesEspecificos;
    if (!details) return null;

    switch (investment.tipo) {
      case 'tesouro_direto': {
        const d = details as TesouroDiretoDetails;
        return (
          <div className="space-y-2">
            <DetailRow label="Título" value={d.titulo} />
            <DetailRow label="Taxa" value={`${d.taxa}% a.a.`} />
            <DetailRow label="Preço Unitário" value={`R$ ${d.precoUnitario.toFixed(2)}`} />
            <DetailRow label="Vencimento" value={format(parseISO(d.vencimento), "MMMM 'de' yyyy", { locale: ptBR })} />
          </div>
        );
      }
      case 'acoes': {
        const d = details as AcoesDetails;
        return (
          <div className="space-y-2">
            <DetailRow label="Ticker" value={d.ticker} />
            <DetailRow label="Quantidade" value={`${d.quantidade} ações`} />
            <DetailRow label="Preço Médio" value={`R$ ${d.precoMedio.toFixed(2)}`} />
          </div>
        );
      }
      case 'cripto': {
        const d = details as CriptoDetails;
        return (
          <div className="space-y-2">
            <DetailRow label="Moeda" value={d.moeda} />
            <DetailRow label="Quantidade" value={d.quantidade.toString()} />
            <DetailRow label="Preço Médio" value={`R$ ${d.precoMedio.toFixed(2)}`} />
          </div>
        );
      }
      case 'renda_fixa': {
        const d = details as RendaFixaDetails;
        return (
          <div className="space-y-2">
            <DetailRow label="Instituição" value={d.instituicao} />
            <DetailRow label="Taxa" value={`${d.taxa}% ${d.tipoTaxa.toUpperCase()}`} />
            <DetailRow label="Vencimento" value={format(parseISO(d.vencimento), "MMMM 'de' yyyy", { locale: ptBR })} />
          </div>
        );
      }
      case 'poupanca': {
        const d = details as PoupancaDetails;
        return (
          <div className="space-y-2">
            <DetailRow label="Instituição" value={d.instituicao} />
            {d.objetivo && <DetailRow label="Objetivo" value={d.objetivo} />}
          </div>
        );
      }
      case 'fundos': {
        const d = details as FundosDetails;
        return (
          <div className="space-y-2">
            <DetailRow label="Gestor" value={d.nomeGestor} />
            <DetailRow label="Tipo do Fundo" value={d.tipoFundo} />
            <DetailRow label="Taxa Admin." value={`${d.taxaAdministracao}% a.a.`} />
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-3xl z-50 max-h-[85vh] overflow-hidden"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Content */}
        <div className="px-6 pb-8 pt-2 overflow-y-auto max-h-[calc(85vh-60px)]">
          {/* Header with Icon and Title */}
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon className="w-6 h-6" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold truncate">{investment.nome}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: color, color }}
                >
                  {investmentTypeLabels[investment.tipo]}
                </Badge>
                <Badge
                  variant={investment.jaInvestido ? 'default' : 'secondary'}
                  className={cn(
                    'text-xs',
                    investment.jaInvestido
                      ? 'bg-income/10 text-income border-income/20'
                      : 'bg-warning/10 text-warning border-warning/20'
                  )}
                >
                  {investment.jaInvestido ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Investido
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 mr-1" />
                      Pendente
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="text-center py-4 border-y border-border/50">
            <p className="text-3xl font-bold" style={{ color }}>
              R$ {investment.valorInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

        {/* Details */}
        <div className="mt-4 space-y-3">
          <DetailRow
            label="Data"
            value={format(parseISO(investment.dataInvestimento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            icon={<Calendar className="w-4 h-4" />}
          />
          
          <DetailRow
            label="Criado em"
            value={format(parseISO(investment.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            icon={<Clock className="w-4 h-4" />}
          />

          {/* Description - Always show section if description exists */}
          {investment.descricao && investment.descricao.trim() !== '' && (
            <div className="pt-3 border-t border-border/50">
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                  <p className="text-sm whitespace-pre-wrap break-words">{investment.descricao}</p>
                </div>
              </div>
            </div>
          )}

          {/* Specific Details */}
          {investment.detalhesEspecificos && (
            <div className="pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Detalhes do Investimento
              </p>
              {renderSpecificDetails()}
            </div>
          )}
        </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function DetailRow({ 
  label, 
  value, 
  icon 
}: { 
  label: string; 
  value: string; 
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
