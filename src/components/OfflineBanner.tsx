import { WifiOff, RefreshCw, CloudOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOffline';
import { useTransactions } from '@/contexts/TransactionContext';
import { motion, AnimatePresence } from 'framer-motion';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { pendingOpsCount, isSyncing } = useTransactions();

  const showBanner = !isOnline || isSyncing || (isOnline && pendingOpsCount > 0);

  const getMessage = () => {
    if (isSyncing) return 'Sincronizando dados...';
    if (!isOnline && pendingOpsCount > 0) 
      return `Sem conexão — ${pendingOpsCount} alteração(ões) pendente(s)`;
    if (!isOnline) return 'Sem conexão — usando dados salvos';
    if (pendingOpsCount > 0) return `Sincronizando ${pendingOpsCount} operação(ões)...`;
    return '';
  };

  const getIcon = () => {
    if (isSyncing) return <RefreshCw className="h-3 w-3 animate-spin" />;
    if (!isOnline) return <WifiOff className="h-3 w-3" />;
    return <CloudOff className="h-3 w-3" />;
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-amber-600/90 text-amber-50 text-center text-xs py-1.5 px-3 flex items-center justify-center gap-1.5 z-50"
        >
          {getIcon()}
          {getMessage()}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
