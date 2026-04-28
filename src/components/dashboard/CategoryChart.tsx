import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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
        className={cn('glass-elevated rounded-3xl', compact ? 'p-5' : 'p-6')}
      >
        <h3 className={cn('font-semibold mb-4', compact ? 'text-sm' : 'text-base')}>
          Gastos por Categoria
        </h3>
        <div className={cn('flex items-center justify-center text-muted-foreground text-sm', compact ? 'h-32' : 'h-56')}>
          Sem despesas no período
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('glass-elevated rounded-3xl', compact ? 'p-5' : 'p-6')}
    >
      <h3 className={cn('font-semibold mb-4', compact ? 'text-sm' : 'text-base')}>
        Gastos por Categoria
      </h3>
      <div className={cn(compact ? 'h-40' : 'h-56')}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={compact ? 35 : 50}
              outerRadius={compact ? 60 : 85}
              paddingAngle={3}
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
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                color: 'hsl(var(--popover-foreground))',
                boxShadow: '0 8px 32px hsl(220 70% 1% / 0.6)',
                padding: '8px 12px',
              }}
              itemStyle={{ color: 'hsl(var(--popover-foreground))', fontWeight: 600, fontSize: '12px' }}
              labelStyle={{ color: 'hsl(var(--popover-foreground))', fontWeight: 700 }}
              cursor={{ fill: 'transparent' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend - Subtle and clean */}
      <div className={cn('mt-4 space-y-2', compact ? 'text-xs' : 'text-sm')}>
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-2">
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium">{item.name}</span>
            </div>
            <span className="text-foreground font-semibold">
              R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}