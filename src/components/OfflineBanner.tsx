import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOffline';
import { motion, AnimatePresence } from 'framer-motion';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-yellow-600/90 text-yellow-50 text-center text-xs py-1.5 px-3 flex items-center justify-center gap-1.5 z-50"
        >
          <WifiOff className="h-3 w-3" />
          Sem conexão — usando dados salvos
        </motion.div>
      )}
    </AnimatePresence>
  );
}
