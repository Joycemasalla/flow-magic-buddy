import { useState, useEffect, useCallback, useRef } from 'react';
import { useOnlineStatus } from '@/hooks/useOffline';
import { toast } from '@/hooks/use-toast';

export interface OfflineOperation {
  id: string;
  table: 'transactions' | 'reminders' | 'investments';
  action: 'insert' | 'update' | 'delete';
  payload?: Record<string, unknown>;
  entityId?: string; // for update/delete
  tempId?: string; // temporary local ID for inserts
  createdAt: number;
}

const QUEUE_KEY = 'moneyflow_offline_queue';

function loadQueue(): OfflineOperation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: OfflineOperation[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Storage full
  }
}

export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function useOfflineQueue() {
  const isOnline = useOnlineStatus();
  const [queue, setQueue] = useState<OfflineOperation[]>(loadQueue);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingRef = useRef(false);

  const pendingCount = queue.length;

  const enqueue = useCallback((op: Omit<OfflineOperation, 'id' | 'createdAt'>) => {
    const operation: OfflineOperation = {
      ...op,
      id: generateTempId(),
      createdAt: Date.now(),
    };
    setQueue((prev) => {
      const updated = [...prev, operation];
      saveQueue(updated);
      return updated;
    });
    return operation;
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    saveQueue([]);
  }, []);

  return { queue, pendingCount, enqueue, clearQueue, isSyncing, setIsSyncing, isOnline, syncingRef };
}
