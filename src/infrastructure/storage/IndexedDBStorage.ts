/**
 * IndexedDB Storage Service - Prompt 6.1 & 6.3
 * 
 * Provides larger storage quota and backup storage for:
 * - Save data backup
 * - Offline support
 * - Larger game data
 */

import { GameState } from '@application/state';
import { 
  SaveData, 
  SaveSlotId, 
  Compression, 
  calculateChecksum,
  SAVE_VERSION,
} from './SaveGameManager';

// =============================================================================
// Types
// =============================================================================

const DB_NAME = 'GachaSimulator';
const DB_VERSION = 1;
const SAVE_STORE = 'saves';
const SYNC_STORE = 'syncQueue';

interface SyncQueueItem {
  id: string;
  slotId: SaveSlotId;
  data: string;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
}

// =============================================================================
// IndexedDB Helper
// =============================================================================

/**
 * Open or create the IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create saves store
      if (!db.objectStoreNames.contains(SAVE_STORE)) {
        const saveStore = db.createObjectStore(SAVE_STORE, { keyPath: 'slotId' });
        saveStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Create sync queue store
      if (!db.objectStoreNames.contains(SYNC_STORE)) {
        const syncStore = db.createObjectStore(SYNC_STORE, { keyPath: 'id' });
        syncStore.createIndex('status', 'status', { unique: false });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// =============================================================================
// IndexedDB Storage Service
// =============================================================================

export class IndexedDBStorageService {
  private db: IDBDatabase | null = null;

  /**
   * Initialize the database connection
   */
  async init(): Promise<void> {
    if (!this.isSupported()) {
      console.warn('IndexedDB not supported');
      return;
    }
    this.db = await openDatabase();
  }

  /**
   * Check if IndexedDB is supported
   */
  isSupported(): boolean {
    return 'indexedDB' in window;
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.db !== null;
  }

  /**
   * Save game state to IndexedDB
   */
  async save(state: GameState, slotId: SaveSlotId): Promise<boolean> {
    if (!this.db) {
      await this.init();
      if (!this.db) return false;
    }

    try {
      // Create save data
      const saveData: SaveData = {
        metadata: {
          version: SAVE_VERSION,
          timestamp: Date.now(),
          playtime: 0,
          companyName: state.company?.name ?? 'New Company',
          funds: state.company?.funds ?? 0,
          employeeCount: state.employees.length,
          gameCount: state.games.length,
          currentTick: state.currentTick,
          checksum: '',
        },
        state,
      };

      const serialized = JSON.stringify(saveData);
      const checksum = calculateChecksum(serialized);
      const compressed = Compression.compress(serialized);

      const record = {
        slotId,
        data: compressed,
        checksum,
        timestamp: Date.now(),
        version: SAVE_VERSION,
      };

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([SAVE_STORE], 'readwrite');
        const store = transaction.objectStore(SAVE_STORE);
        const request = store.put(record);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB save failed:', error);
      return false;
    }
  }

  /**
   * Load game state from IndexedDB
   */
  async load(slotId: SaveSlotId): Promise<GameState | null> {
    if (!this.db) {
      await this.init();
      if (!this.db) return null;
    }

    try {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([SAVE_STORE], 'readonly');
        const store = transaction.objectStore(SAVE_STORE);
        const request = store.get(slotId);

        request.onsuccess = () => {
          const record = request.result;
          if (!record) {
            resolve(null);
            return;
          }

          try {
            const decompressed = Compression.decompress(record.data);
            const saveData: SaveData = JSON.parse(decompressed);
            resolve(saveData.state);
          } catch {
            console.error('Failed to decompress save data');
            resolve(null);
          }
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB load failed:', error);
      return null;
    }
  }

  /**
   * Delete a save slot
   */
  async delete(slotId: SaveSlotId): Promise<boolean> {
    if (!this.db) return false;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SAVE_STORE], 'readwrite');
      const store = transaction.objectStore(SAVE_STORE);
      const request = store.delete(slotId);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all saved slots
   */
  async getAllSlots(): Promise<Array<{ slotId: SaveSlotId; timestamp: number }>> {
    if (!this.db) {
      await this.init();
      if (!this.db) return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SAVE_STORE], 'readonly');
      const store = transaction.objectStore(SAVE_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = request.result;
        resolve(records.map(r => ({ slotId: r.slotId, timestamp: r.timestamp })));
      };

      request.onerror = () => reject(request.error);
    });
  }

  // ===========================================================================
  // Sync Queue (for offline support)
  // ===========================================================================

  /**
   * Add item to sync queue (for background sync)
   */
  async queueForSync(slotId: SaveSlotId, data: string): Promise<void> {
    if (!this.db) return;

    const item: SyncQueueItem = {
      id: `${slotId}-${Date.now()}`,
      slotId,
      data,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SYNC_STORE], 'readwrite');
      const store = transaction.objectStore(SYNC_STORE);
      const request = store.add(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get pending sync items
   */
  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SYNC_STORE], 'readonly');
      const store = transaction.objectStore(SYNC_STORE);
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove synced item from queue
   */
  async removeSyncItem(id: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SYNC_STORE], 'readwrite');
      const store = transaction.objectStore(SYNC_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear the entire database
   */
  async clearAll(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [SAVE_STORE, SYNC_STORE],
        'readwrite'
      );
      
      transaction.objectStore(SAVE_STORE).clear();
      transaction.objectStore(SYNC_STORE).clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Get estimated storage usage
   */
  async getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage ?? 0,
        quota: estimate.quota ?? 0,
      };
    }
    return null;
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const indexedDBStorage = new IndexedDBStorageService();
