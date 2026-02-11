import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Transaction, categoryLabels, categoryColors } from '@/types/transaction';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CategoryChartProps {
  transactions: Transaction[];
  compact?: boolean;
}

export default function CategoryChart({ transactions, compact = false }: CategoryChartProps) {
  const expenses = transactions.filter((t) => t.type === 'expense');
  
  const categoryTotals = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(categoryTotals)
    .map(([category, value]) => ({
      name: categoryLabels[category as keyof typeof categoryLabels] || category,
      value,
      color: categoryColors[category as keyof typeof categoryColors] || 'hsl(215 20% 65%)',
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('glass-card rounded-xl p-4', compact ? 'p-4' : 'p-6')}
      >
        <h3 className={cn('font-semibold mb-3', compact ? 'text-sm' : 'text-lg mb-4')}>
          Gastos por Categoria
        </h3>
        <div className={cn('flex items-center justify-center text-muted-foreground', compact ? 'h-32' : 'h-64')}>
          Sem despesas no período
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('glass-card rounded-xl', compact ? 'p-4' : 'p-6')}
    >
      <h3 className={cn('font-semibold', compact ? 'text-sm mb-3' : 'text-lg mb-4')}>
        Gastos por Categoria
      </h3>
      <div className={cn(compact ? 'h-40' : 'h-64')}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={compact ? 30 : 50}
              outerRadius={compact ? 55 : 80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) =>
                `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              }
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--card-foreground))',
              }}
              itemStyle={{ color: 'hsl(var(--card-foreground))' }}
              labelStyle={{ color: 'hsl(var(--card-foreground))' }}
            />
            <Legend
              formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
              wrapperStyle={{ fontSize: compact ? '10px' : '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}