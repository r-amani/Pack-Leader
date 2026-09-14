import { ILocationSnapshot, IBatchSyncResponse } from '@packleader/shared';
import { offlineStorage } from './storage.service';
import { apiClient } from '../../config/api';

const QUEUE_STORAGE_KEY = 'packleader_offline_sync_queue';

/**
 * Manages outgoing action queue when connectivity is lost and flushes in batches.
 */
class SyncQueueService {
  private queue: ILocationSnapshot[] = [];
  private isSyncing = false;

  constructor() {
    this.restoreQueue();
  }

  private async restoreQueue(): Promise<void> {
    const saved = await offlineStorage.getItem<ILocationSnapshot[]>(QUEUE_STORAGE_KEY);
    if (saved && Array.isArray(saved)) {
      this.queue = saved;
    }
  }

  /**
   * Add an outgoing location snapshot to the offline queue.
   */
  public async enqueue(snapshot: ILocationSnapshot): Promise<void> {
    this.queue.push(snapshot);
    await offlineStorage.setItem(QUEUE_STORAGE_KEY, this.queue);
  }

  /**
   * Get the current count of pending offline queued items.
   */
  public getPendingCount(): number {
    return this.queue.length;
  }

  /**
   * Flush all queued actions to the backend in a single bulk request.
   */
  public async flush(tripId: string): Promise<IBatchSyncResponse | null> {
    if (this.isSyncing || this.queue.length === 0 || !tripId) {
      return null;
    }

    this.isSyncing = true;
    const batch = [...this.queue];

    try {
      const response = await apiClient.post(`/trips/${tripId}/sync`, {
        snapshots: batch,
        timestamp: new Date().toISOString(),
      });

      // Remove successfully synced items
      this.queue.splice(0, batch.length);
      await offlineStorage.setItem(QUEUE_STORAGE_KEY, this.queue);

      return response.data?.data as IBatchSyncResponse;
    } catch (error) {
      console.warn('[SyncQueue] Sync failed, will retry next interval:', error);
      return null;
    } finally {
      this.isSyncing = false;
    }
  }

  public async clear(): Promise<void> {
    this.queue = [];
    await offlineStorage.removeItem(QUEUE_STORAGE_KEY);
  }
}

export const syncQueueService = new SyncQueueService();
