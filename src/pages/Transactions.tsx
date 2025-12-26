import { useNavigate } from 'react-router-dom';
import { useTransactions } from '@/contexts/TransactionContext';
import { useToast } from '@/hooks/use-toast';
import TransactionList from '@/components/dashboard/TransactionList';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function Transactions() {
  const { transactions, deleteTransaction } = useTransactions();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleEdit = (id: string) => {
    navigate(`/transacoes/editar/${id}`);
  };

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    toast({
      title: 'Transação excluída',
      description: 'A transação foi removida com sucesso.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Transações</h1>
          <p className="text-muted-foreground">
            Todas as suas movimentações financeiras
          </p>
        </motion.div>

        <Button onClick={() => navigate('/transacoes/nova')}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Transação
        </Button>
      </div>

      <TransactionList
        transactions={transactions}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}