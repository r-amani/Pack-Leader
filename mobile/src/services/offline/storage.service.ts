import * as SecureStore from 'expo-secure-store';

/**
 * Robust persistent offline storage using expo-secure-store with in-memory fallback.
 */
class OfflineStorageService {
  private memoryCache = new Map<string, string>();

  public async setItem(key: string, value: any): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    this.memoryCache.set(key, serialized);
    try {
      await SecureStore.setItemAsync(key, serialized);
    } catch {
      // SecureStore may fail in unsupported environments, memoryCache guarantees retention
    }
  }

  public async getItem<T = any>(key: string): Promise<T | null> {
    if (this.memoryCache.has(key)) {
      try {
        return JSON.parse(this.memoryCache.get(key)!);
      } catch {
        return this.memoryCache.get(key) as unknown as T;
      }
    }

    try {
      const stored = await SecureStore.getItemAsync(key);
      if (stored) {
        this.memoryCache.set(key, stored);
        try {
          return JSON.parse(stored);
        } catch {
          return stored as unknown as T;
        }
      }
    } catch {
      // Fallback
    }
    return null;
  }

  public async removeItem(key: string): Promise<void> {
    this.memoryCache.delete(key);
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Fallback
    }
  }
}

export const offlineStorage = new OfflineStorageService();
