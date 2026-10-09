import fs from 'fs';
let c = fs.readFileSync('src/hooks/useOfflineQueue.ts', 'utf8');

const updateInQueueStr = `  const updateInQueue = useCallback((tempId: string, payload: any) => {
    setQueue(prev => {
      const updated = prev.map(op => {
        if (op.tempId === tempId || op.id === tempId) {
          return { ...op, payload: { ...op.payload, ...payload } };
        }
        return op;
      });
      saveQueue(updated);
      return updated;
    });
  }, []);`;

if (!c.includes('updateInQueue')) {
  c = c.replace('  const removeFromQueue = useCallback', updateInQueueStr + '\n\n  const removeFromQueue = useCallback');
  c = c.replace('isSyncing, setIsSyncing, isOnline, syncingRef };', 'isSyncing, setIsSyncing, isOnline, syncingRef, updateInQueue };');
  fs.writeFileSync('src/hooks/useOfflineQueue.ts', c);
}
