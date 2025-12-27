import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Download, FileImage, FileText, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Transaction, categoryLabels, categoryColors } from '@/types/transaction';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  stats: {
    income: number;
    expense: number;
    balance: number;
  };
  period: string;
}

type FilterType = 'all' | 'income' | 'expense';

export default function ReportModal({
  isOpen,
  onClose,
  transactions,
  stats,
  period,
}: ReportModalProps) {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  if (!isOpen) return null;

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  // Category data for chart
  const expenses = transactions.filter((t) => t.type === 'expense');
  const categoryTotals = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(categoryTotals)
    .map(([category, value]) => ({
      name: categoryLabels[category as keyof typeof categoryLabels] || category,
      value,
      color: categoryColors[category as keyof typeof categoryColors] || 'hsl(215 20% 65%)',
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((acc, t) => {
    const date = t.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const handleExportPNG = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);

    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `relatorio-financeiro-${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast({
        title: 'PNG exportado!',
        description: 'O relatório foi salvo como imagem.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível gerar a imagem.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);

    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`relatorio-financeiro-${format(new Date(), 'yyyy-MM-dd')}.pdf`);

      toast({
        title: 'PDF exportado!',
        description: 'O relatório foi salvo como PDF.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível gerar o PDF.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
    >
      <div className="fixed inset-0 overflow-y-auto">
        <div className="min-h-full p-4">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border mb-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
                <h1 className="text-lg font-semibold">Relatório Financeiro</h1>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPNG}
                  disabled={isExporting}
                  className="min-h-[44px] px-4"
                >
                  <FileImage className="w-4 h-4 mr-2" />
                  PNG
                </Button>
                <Button
                  size="sm"
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="min-h-[44px] px-4"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
              {[
                { value: 'all', label: 'Tudo' },
                { value: 'income', label: 'Receitas' },
                { value: 'expense', label: 'Despesas' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setFilterType(filter.value as FilterType)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all min-h-[44px] ${
                    filterType === filter.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Report Content (Exportable) */}
          <div
            ref={reportRef}
            className="bg-white text-gray-900 rounded-xl p-6 max-w-2xl mx-auto"
          >
            {/* Report Header */}
            <div className="text-center mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Wallet className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">MoneyFlow Pro</h2>
              </div>
              <p className="text-sm text-gray-500">Relatório Financeiro</p>
              <p className="text-sm font-medium text-gray-700 mt-1">
                Período: {period}
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Receitas</p>
                <p className="text-lg font-bold text-green-600">
                  R$ {stats.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <TrendingDown className="w-5 h-5 text-red-600 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Despesas</p>
                <p className="text-lg font-bold text-red-600">
                  R$ {stats.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className={`${stats.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'} rounded-lg p-4 text-center`}>
                <Wallet className={`w-5 h-5 ${stats.balance >= 0 ? 'text-blue-600' : 'text-orange-600'} mx-auto mb-1`} />
                <p className="text-xs text-gray-500">Saldo</p>
                <p className={`text-lg font-bold ${stats.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  R$ {Math.abs(stats.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Category Chart */}
            {chartData.length > 0 && filterType !== 'income' && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Despesas por Categoria</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Transactions List */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Transações ({filteredTransactions.length})
              </h3>
              <div className="space-y-4">
                {sortedDates.slice(0, 10).map((date) => (
                  <div key={date}>
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      {format(new Date(date), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    <div className="space-y-2">
                      {groupedTransactions[date].map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between py-2 border-b border-gray-100"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">
                              {t.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              {categoryLabels[t.category as keyof typeof categoryLabels] || t.category}
                            </p>
                          </div>
                          <p
                            className={`text-sm font-semibold ${
                              t.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {t.type === 'income' ? '+' : '-'} R${' '}
                            {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-400">
                Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
