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

interface EvolutionChartProps {
  transactions: Transaction[];
}

export default function EvolutionChart({ transactions }: EvolutionChartProps) {
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
      className="glass-card rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold mb-4">Evolução Semanal</h3>
      <div className="h-64">
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
              tick={{ fill: 'hsl(215 20% 65%)', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215 20% 65%)', fontSize: 12 }}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip
              formatter={(value: number) =>
                `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              }
              contentStyle={{
                backgroundColor: 'hsl(222 47% 14%)',
                border: '1px solid hsl(217 33% 22%)',
                borderRadius: '8px',
                color: 'hsl(210 40% 98%)',
              }}
            />
            <Legend
              formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
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