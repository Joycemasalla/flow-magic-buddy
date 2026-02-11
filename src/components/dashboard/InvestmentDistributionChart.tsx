import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Investment, investmentTypeLabels, investmentTypeColors, InvestmentType } from '@/types/investment';
import { motion } from 'framer-motion';

interface InvestmentDistributionChartProps {
  investments: Investment[];
}

export default function InvestmentDistributionChart({ investments }: InvestmentDistributionChartProps) {
  // Filter only completed investments
  const invested = investments.filter((i) => i.jaInvestido);

  // Group by type and sum values
  const byType = invested.reduce((acc, inv) => {
    acc[inv.tipo] = (acc[inv.tipo] || 0) + inv.valorInvestido;
    return acc;
  }, {} as Record<InvestmentType, number>);

  // Calculate total for percentages
  const total = Object.values(byType).reduce((sum, val) => sum + val, 0);

  // Convert to chart format
  const data = Object.entries(byType)
    .map(([type, value]) => ({
      name: investmentTypeLabels[type as InvestmentType],
      value,
      color: investmentTypeColors[type as InvestmentType],
      percentage: ((value / total) * 100).toFixed(1),
    }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-4 sm:p-6"
      >
        <h3 className="font-semibold text-sm sm:text-lg mb-3 sm:mb-4">
          Distribuição da Carteira
        </h3>
        <div className="flex items-center justify-center text-muted-foreground h-32 sm:h-48">
          Nenhum investimento realizado
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-4 sm:p-6"
    >
      <h3 className="font-semibold text-sm sm:text-lg mb-3 sm:mb-4">
        Distribuição da Carteira
      </h3>
      <div className="h-48 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius="70%"
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string, props: { payload: { percentage: string } }) => [
                `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${props.payload.percentage}%)`,
                name,
              ]}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
                fontSize: '12px',
              }}
            />
            <Legend
              formatter={(value) => (
                <span className="text-xs text-foreground">{value}</span>
              )}
              wrapperStyle={{ fontSize: '11px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
