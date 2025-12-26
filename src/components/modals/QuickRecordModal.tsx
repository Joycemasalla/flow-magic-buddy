import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTransactions } from '@/contexts/TransactionContext';
import { useToast } from '@/hooks/use-toast';
import { TransactionCategory, TransactionType } from '@/types/transaction';

interface QuickRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const parseQuickInput = (
  input: string
): { type: TransactionType; amount: number; category: TransactionCategory; description: string } | null => {
  const text = input.trim().toLowerCase();
  
  // Detect if it's income (starts with + or contains income keywords)
  const isIncome = text.startsWith('+') || 
    /\b(salário|salario|freelance|renda|recebido|entrada|venda)\b/.test(text);
  
  // Extract amount
  const amountMatch = text.match(/[\d.,]+/);
  if (!amountMatch) return null;
  
  const amount = parseFloat(amountMatch[0].replace(',', '.'));
  if (isNaN(amount) || amount <= 0) return null;
  
  // Detect category based on keywords
  let category: TransactionCategory = 'other';
  const categoryKeywords: Record<TransactionCategory, string[]> = {
    salary: ['salário', 'salario'],
    food: ['mercado', 'supermercado', 'restaurante', 'lanche', 'comida', 'almoço', 'jantar', 'ifood', 'pizza'],
    transport: ['uber', 'gasolina', 'combustível', 'combustivel', 'onibus', 'ônibus', 'metrô', 'metro', 'passagem'],
    shopping: ['roupa', 'shopping', 'loja', 'compra'],
    health: ['farmácia', 'farmacia', 'médico', 'medico', 'consulta', 'remédio', 'remedio', 'academia'],
    entertainment: ['cinema', 'netflix', 'spotify', 'jogo', 'show', 'festa', 'bar'],
    bills: ['conta', 'luz', 'água', 'agua', 'internet', 'telefone', 'aluguel', 'gás', 'gas'],
    education: ['curso', 'livro', 'escola', 'faculdade', 'mensalidade'],
    investment: ['investimento', 'poupança', 'poupanca', 'ação', 'acao', 'fundo'],
    loan: ['empréstimo', 'emprestimo', 'dívida', 'divida'],
    other: [],
  };
  
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((kw) => text.includes(kw))) {
      category = cat as TransactionCategory;
      break;
    }
  }
  
  // Extract description (remove amount and clean up)
  const description = input
    .replace(/[+\-]?\s*[\d.,]+/, '')
    .trim()
    .replace(/^\s*(de|em|no|na|para)\s+/i, '')
    .trim() || (isIncome ? 'Receita' : 'Despesa');
  
  return {
    type: isIncome ? 'income' : 'expense',
    amount,
    category,
    description: description.charAt(0).toUpperCase() + description.slice(1),
  };
};

export default function QuickRecordModal({ isOpen, onClose }: QuickRecordModalProps) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { addTransaction } = useTransactions();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setIsProcessing(true);

    // Simulate a small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    const parsed = parseQuickInput(input);

    if (!parsed) {
      toast({
        title: 'Não entendi',
        description: 'Tente algo como "50 mercado" ou "+100 salário"',
        variant: 'destructive',
      });
      setIsProcessing(false);
      return;
    }

    addTransaction({
      ...parsed,
      date: new Date().toISOString().split('T')[0],
    });

    toast({
      title: parsed.type === 'income' ? '💰 Receita registrada!' : '💸 Despesa registrada!',
      description: `${parsed.description}: R$ ${parsed.amount.toFixed(2)}`,
    });

    setInput('');
    setIsProcessing(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl p-6 pb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Registro Rápido</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder='Ex: "50 mercado" ou "+100 salário"'
                  className="pr-12 h-14 text-lg"
                  disabled={isProcessing}
                  autoFocus
                />
                <Button
                  size="icon"
                  onClick={handleSubmit}
                  disabled={!input.trim() || isProcessing}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium">Exemplos:</p>
                <ul className="space-y-1 pl-4">
                  <li>• <span className="text-expense">40 mercado</span> → Despesa de R$ 40</li>
                  <li>• <span className="text-income">+100 salário</span> → Receita de R$ 100</li>
                  <li>• <span className="text-expense">150 uber</span> → Transporte R$ 150</li>
                  <li>• <span className="text-income">+500 freelance</span> → Receita R$ 500</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}