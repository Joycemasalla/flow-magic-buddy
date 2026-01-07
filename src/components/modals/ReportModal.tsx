import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Download, FileImage, FileText, TrendingUp, TrendingDown, Wallet, Loader2 } from 'lucide-react';
import { Transaction, categoryLabels, categoryColors } from '@/types/transaction';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

  // Category data for summary
  const expenses = transactions.filter((t) => t.type === 'expense');
  const categoryTotals = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
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
        width: reportRef.current.scrollWidth,
        height: reportRef.current.scrollHeight,
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight,
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
        width: reportRef.current.scrollWidth,
        height: reportRef.current.scrollHeight,
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 10mm margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10; // Top margin

      // First page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);

      // Additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
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

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
                  <X className="w-5 h-5" />
                </Button>
                <h1 className="text-base sm:text-lg font-semibold truncate">Relatório</h1>
              </div>
              <div className="flex gap-1 sm:gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPNG}
                  disabled={isExporting}
                  className="h-9 px-2 sm:px-3"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <FileImage className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">PNG</span>
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="h-9 px-2 sm:px-3"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <FileText className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">PDF</span>
                    </>
                  )}
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
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all min-h-[40px] ${
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

          {/* Report Content (Exportable) - Mobile optimized layout */}
          <div
            ref={reportRef}
            className="bg-white text-gray-900 rounded-xl p-4 sm:p-6 max-w-lg mx-auto"
            style={{ minWidth: '300px', maxWidth: '400px' }}
          >
            {/* Report Header */}
            <div className="text-center mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Wallet className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">MoneyFlow</h2>
              </div>
              <p className="text-xs text-gray-500">Relatório Financeiro</p>
              <p className="text-xs font-medium text-gray-700 mt-1">
                {period}
              </p>
            </div>

            {/* Summary - Vertical Stack for Mobile */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Receitas</span>
                </div>
                <span className="text-sm font-bold text-green-600">
                  R$ {formatCurrency(stats.income)}
                </span>
              </div>
              
              <div className="flex items-center justify-between bg-red-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-gray-600">Despesas</span>
                </div>
                <span className="text-sm font-bold text-red-600">
                  R$ {formatCurrency(stats.expense)}
                </span>
              </div>
              
              <div className={`flex items-center justify-between ${stats.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'} rounded-lg p-3`}>
                <div className="flex items-center gap-2">
                  <Wallet className={`w-4 h-4 ${stats.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                  <span className="text-sm text-gray-600">Saldo</span>
                </div>
                <span className={`text-sm font-bold ${stats.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {stats.balance < 0 ? '-' : ''} R$ {formatCurrency(Math.abs(stats.balance))}
                </span>
              </div>
            </div>

            {/* Categories Summary - Vertical List */}
            {sortedCategories.length > 0 && filterType !== 'income' && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-700 mb-2">Despesas por Categoria</h3>
                <div className="space-y-1">
                  {sortedCategories.map(([category, value]) => {
                    const percentage = stats.expense > 0 ? (value / stats.expense) * 100 : 0;
                    const color = categoryColors[category as keyof typeof categoryColors] || '#6B7280';
                    return (
                      <div key={category} className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-gray-600 flex-1 truncate">
                          {categoryLabels[category as keyof typeof categoryLabels] || category}
                        </span>
                        <span className="text-xs text-gray-500 shrink-0">
                          {percentage.toFixed(0)}%
                        </span>
                        <span className="text-xs font-medium text-gray-800 shrink-0">
                          R$ {formatCurrency(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Transactions List - Card Format */}
            <div>
              <h3 className="text-xs font-semibold text-gray-700 mb-2">
                Transações ({filteredTransactions.length})
              </h3>
              <div className="space-y-3">
                {sortedDates.slice(0, 10).map((date) => (
                  <div key={date}>
                    <p className="text-[10px] font-medium text-gray-400 mb-1 uppercase">
                      {format(new Date(date), "dd MMM", { locale: ptBR })}
                    </p>
                    <div className="space-y-1">
                      {groupedTransactions[date].map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between py-2 px-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1 min-w-0 mr-2">
                            <p className="text-xs font-medium text-gray-800 truncate">
                              {t.description}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {categoryLabels[t.category as keyof typeof categoryLabels] || t.category}
                            </p>
                          </div>
                          <p
                            className={`text-xs font-semibold whitespace-nowrap ${
                              t.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {t.type === 'income' ? '+' : '-'} R$ {formatCurrency(t.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-gray-200 text-center">
              <p className="text-[10px] text-gray-400">
                Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
