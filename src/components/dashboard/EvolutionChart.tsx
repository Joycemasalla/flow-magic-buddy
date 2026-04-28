import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Transaction } from '@/types/transaction';
import { motion } from 'framer-motion';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface EvolutionChartProps {
  transactions: Transaction[];
  compact?: boolean;
}

export default function EvolutionChart({ transactions, compact = false }: EvolutionChartProps) {
  // Get last 7 days data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const dayTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= dayStart && tDate <= dayEnd;
    });

    const income = dayTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = dayTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      name: format(date, 'EEE', { locale: ptBR }).charAt(0).toUpperCase() + format(date, 'EEE', { locale: ptBR }).slice(1),
      Receitas: income,
      Despesas: expense,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={cn('glass-elevated rounded-3xl', compact ? 'p-5' : 'p-6')}
    >
      <h3 className={cn('font-semibold mb-4', compact ? 'text-sm' : 'text-base')}>
        Evolução Semanal
      </h3>
      <div className={cn(compact ? 'h-40' : 'h-56')}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={last7Days} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border) / 0.3)"
              vertical={false}
              strokeWidth={0.5}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: compact ? 11 : 12, fontWeight: 500 }}
              interval={0}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: compact ? 10 : 11, fontWeight: 500 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              width={compact ? 35 : 45}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted) / 0.2)', radius: 8 }}
              formatter={(value: number) =>
                `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
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
            />
            <Bar
              dataKey="Receitas"
              fill="hsl(var(--income))"
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
              strokeWidth={0}
            />
            <Bar
              dataKey="Despesas"
              fill="hsl(var(--expense))"
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
              strokeWidth={0}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}