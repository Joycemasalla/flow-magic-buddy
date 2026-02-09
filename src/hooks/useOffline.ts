import { useState, useEffect, useCallback } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

const CACHE_PREFIX = 'moneyflow_cache_';
const CACHE_EXPIRY = 1000 * 60 * 60 * 24; // 24 hours

export function setOfflineCache<T>(key: string, data: T) {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheEntry));
  } catch (e) {
    // Storage full - clear old caches
    clearExpiredCaches();
  }
}

export function getOfflineCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;

    const cacheEntry = JSON.parse(raw);
    if (Date.now() - cacheEntry.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return cacheEntry.data as T;
  } catch {
    return null;
  }
}

function clearExpiredCaches() {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const entry = JSON.parse(raw);
          if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
            localStorage.removeItem(key);
          }
        }
      } catch {
        localStorage.removeItem(key!);
      }
    }
  }
}
