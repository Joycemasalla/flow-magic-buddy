import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
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
      name: format(date, 'EEE', { locale: ptBR }),
      Receitas: income,
      Despesas: expense,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={cn('glass-card rounded-xl', compact ? 'p-4' : 'p-6')}
    >
      <h3 className={cn('font-semibold', compact ? 'text-sm mb-3' : 'text-lg mb-4')}>
        Evolução Semanal
      </h3>
      <div className={cn(compact ? 'h-40' : 'h-64')}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={last7Days}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(217 33% 22%)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215 20% 65%)', fontSize: compact ? 10 : 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215 20% 65%)', fontSize: compact ? 10 : 12 }}
              tickFormatter={(value) => `${value / 1000}k`}
              width={compact ? 30 : 40}
            />
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
            <Bar
              dataKey="Receitas"
              fill="hsl(160 84% 39%)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="Despesas"
              fill="hsl(0 84% 60%)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}