import { useNavigate } from 'react-router-dom';
import { useTransactions } from '@/contexts/TransactionContext';
import { useToast } from '@/hooks/use-toast';
import TransactionList from '@/components/dashboard/TransactionList';
import { motion } from 'framer-motion';

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
      title: 'Excluída',
      description: 'Transação removida.',
    });
  };

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl lg:text-2xl font-display font-bold">Transações</h1>
        <p className="text-sm text-muted-foreground">
          Todas as suas movimentações
        </p>
      </motion.div>

      <TransactionList
        transactions={transactions}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
