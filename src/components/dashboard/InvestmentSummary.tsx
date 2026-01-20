import { motion } from 'framer-motion';
import { TrendingUp, Wallet, Clock } from 'lucide-react';
import { Investment } from '@/types/investment';
import { PrivacyValue } from '@/components/ui/PrivacyValue';
import { useNavigate } from 'react-router-dom';

interface InvestmentSummaryProps {
  investments: Investment[];
}

export default function InvestmentSummary({ investments }: InvestmentSummaryProps) {
  const navigate = useNavigate();

  const stats = {
    totalInvestido: investments
      .filter((i) => i.jaInvestido)
      .reduce((sum, i) => sum + i.valorInvestido, 0),
    pendentes: investments.filter((i) => !i.jaInvestido).length,
    totalPendente: investments
      .filter((i) => !i.jaInvestido)
      .reduce((sum, i) => sum + i.valorInvestido, 0),
  };

  // Don't show if no investments
  if (investments.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      onClick={() => navigate('/investimentos')}
      className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-4 cursor-pointer hover:border-primary/40 transition-colors active:scale-[0.99]"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-primary/20">
          <TrendingUp className="w-4 h-4 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground">Investimentos</span>
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Total Investido */}
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
            <Wallet className="w-3.5 h-3.5" />
            <span className="text-xs">Investido</span>
          </div>
          <PrivacyValue
            value={stats.totalInvestido}
            className="text-lg font-bold text-foreground"
          />
        </div>

        {/* Divider */}
        <div className="w-px h-10 bg-border" />

        {/* Pendentes */}
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">Planejados</span>
          </div>
          {stats.pendentes > 0 ? (
            <div className="flex items-baseline gap-1">
              <PrivacyValue
                value={stats.totalPendente}
                className="text-lg font-bold text-foreground"
              />
              <span className="text-xs text-muted-foreground">
                ({stats.pendentes})
              </span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Nenhum</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
