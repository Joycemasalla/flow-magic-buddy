import { useState, useMemo } from "react";
import { Plus, Wallet, Pencil, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBudgets } from "@/contexts/BudgetContext";
import { useTransactions } from "@/contexts/TransactionContext";
import { categoryLabels, categoryColors, categoryIcons } from "@/types/transaction";
import { calculatePeriodSummary } from "@/lib/finance/rules";
import * as Icons from "lucide-react";

export default function Budgets() {
  const { budgets, addBudget, updateBudget, deleteBudget, loading } = useBudgets();
  const { transactions } = useTransactions();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);

  // Form states
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");

  const handleSave = async () => {
    if (!category || !amount) return;
    try {
      if (editingBudget) {
        await updateBudget(editingBudget, { category, amount: Number(amount) });
      } else {
        await addBudget({ category, amount: Number(amount) });
      }
      setIsAddOpen(false);
      setEditingBudget(null);
      setCategory("");
      setAmount("");
    } catch (e) {
      console.error(e);
    }
  };

  const openEdit = (b: any) => {
    setEditingBudget(b.id);
    setCategory(b.category);
    setAmount(b.amount.toString());
    setIsAddOpen(true);
  };

  // Calcula gastos reais das transações (somente no mês atual)
  const now = new Date();
  const currentMonthTransactions = transactions.filter(t => {
    if (t.type !== 'expense' || t.isTransfer) return false;
    const date = new Date(t.date);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const spentByCategory = useMemo(() => {
    const acc: Record<string, number> = {};
    currentMonthTransactions.forEach(t => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
    });
    return acc;
  }, [currentMonthTransactions]);

  const allCategories = Object.keys(categoryLabels);

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orçamentos Mensais</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Defina limites de gastos por categoria
          </p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" onClick={() => {
              setEditingBudget(null);
              setCategory("");
              setAmount("");
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Orçamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBudget ? "Editar Orçamento" : "Novo Orçamento"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecione uma categoria...</option>
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {categoryLabels[cat] || cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Limite Mensal (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <Button onClick={handleSave} className="w-full">
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-border shadow-sm">
          <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground">Nenhum orçamento</h3>
          <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
            Crie um orçamento para acompanhar e limitar seus gastos em diferentes categorias.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const spent = spentByCategory[budget.category] || 0;
            const percentage = Math.min((spent / budget.amount) * 100, 100);
            const isOver = spent > budget.amount;
            const label = categoryLabels[budget.category] || budget.category;
            const IconName = categoryIcons[budget.category] || 'MoreHorizontal';
            const Icon = (Icons as any)[IconName] || Icons.MoreHorizontal;
            const color = categoryColors[budget.category] || '#666';

            return (
              <div key={budget.id} className="bg-white p-5 rounded-xl border border-border shadow-sm relative group overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20`, color }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{label}</h3>
                      <p className="text-xs text-muted-foreground">
                        {isOver ? "Lmite excedido" : "Dentro do limite"}
                      </p>
                    </div>
                  </div>
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(budget)}>
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteBudget(budget.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900">
                      R$ {spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-muted-foreground">
                      de R$ {budget.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={\`h-full transition-all duration-500 \${isOver ? 'bg-red-500' : 'bg-primary'}\`}
                      style={{ width: \`\${percentage}%\` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
