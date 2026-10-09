import fs from 'fs';
let c = fs.readFileSync('src/components/modals/ReportModal.tsx', 'utf8');

c = c.replace('FileText, FileSpreadsheet, FileSpreadsheet,', 'FileText, FileSpreadsheet,');

const funcStr = `  const handleExportCSV = () => {
    const csvRows = [];
    csvRows.push(['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'].join(','));

    filteredTransactions.forEach(t => {
      const date = t.date;
      const desc = t.description.replace(/"/g, '""');
      const category = categoryLabels[t.category as keyof typeof categoryLabels] || t.category;
      const type = t.type === 'income' ? 'Receita' : 'Despesa';
      const amount = t.amount.toString().replace('.', ',');
      
      csvRows.push([date, \`"\${desc}"\`, \`"\${category}"\`, type, amount].join(','));
    });

    const csvContent = "\\uFEFF" + csvRows.join('\\n'); // UTF-8 BOM for Excel
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = \`extrato-\${format(new Date(), 'yyyy-MM-dd')}.csv\`;
    link.click();
    
    toast({
      title: 'CSV exportado!',
      description: 'O arquivo foi salvo no seu dispositivo.',
    });
  };

  const formatCurrency`;

if (!c.includes('handleExportCSV')) {
  c = c.replace('  const formatCurrency', funcStr);
}

const btnStr = `                </Button>
                <Button
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={isExporting}
                  className="h-9 px-2 sm:px-3 bg-green-600 hover:bg-green-700 text-white"
                >
                  <FileSpreadsheet className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">CSV</span>
                </Button>
              </div>`;

if (!c.includes('onClick={handleExportCSV}')) {
  c = c.replace('                </Button>\r\n              </div>', btnStr);
  c = c.replace('                </Button>\n              </div>', btnStr);
}

fs.writeFileSync('src/components/modals/ReportModal.tsx', c);
