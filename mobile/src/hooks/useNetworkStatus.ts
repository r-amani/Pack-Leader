import { useState, useEffect, useCallback } from 'react';
import { syncQueueService } from '../services/offline/sync-queue.service';
import { apiClient } from '../config/api';

export interface UseNetworkStatusReturn {
  isOnline: boolean;
  pendingSyncCount: number;
  syncOfflineQueue: (tripId: string) => Promise<boolean>;
}

export function useNetworkStatus(): UseNetworkStatusReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(syncQueueService.getPendingCount());

  const checkConnectivity = useCallback(async () => {
    try {
      await apiClient.get('/health', { timeout: 3000 });
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    }
    setPendingSyncCount(syncQueueService.getPendingCount());
  }, []);

  useEffect(() => {
    checkConnectivity();
    const interval = setInterval(checkConnectivity, 15000);
    return () => clearInterval(interval);
  }, [checkConnectivity]);

  const syncOfflineQueue = useCallback(
    async (tripId: string): Promise<boolean> => {
      const result = await syncQueueService.flush(tripId);
      setPendingSyncCount(syncQueueService.getPendingCount());
      return result !== null;
    },
    []
  );

  return {
    isOnline,
    pendingSyncCount,
    syncOfflineQueue,
  };
}
