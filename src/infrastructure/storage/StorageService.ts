import { GameState } from '../../application/state';

const STORAGE_KEY = 'gacha-company-simulator-save';

/**
 * Interface for storage operations
 * Allows for different storage implementations (localStorage, IndexedDB, cloud, etc.)
 */
export interface IStorageService {
  save(state: GameState): Promise<void>;
  load(): Promise<GameState | null>;
  clear(): Promise<void>;
  hasSave(): Promise<boolean>;
}

/**
 * LocalStorage implementation of storage service
 */
export class LocalStorageService implements IStorageService {
  async save(state: GameState): Promise<void> {
    try {
      // Convert Sets to arrays for JSON serialization
      const serializableState = {
        ...state,
        unlockedGenres: Array.from(state.unlockedGenres),
      };
      const serialized = JSON.stringify(serializableState);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      console.error('Failed to save game state:', error);
      throw new Error('Failed to save game');
    }
  }

  async load(): Promise<GameState | null> {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) {
        return null;
      }
      const parsed = JSON.parse(serialized);
      
      // Reconstruct Set from serialized data (could be array, object, or already Set)
      let unlockedGenres: Set<string>;
      if (parsed.unlockedGenres instanceof Set) {
        unlockedGenres = parsed.unlockedGenres;
      } else if (Array.isArray(parsed.unlockedGenres)) {
        unlockedGenres = new Set(parsed.unlockedGenres);
      } else if (parsed.unlockedGenres && typeof parsed.unlockedGenres === 'object') {
        // Handle case where Set was serialized as empty object {}
        unlockedGenres = new Set(Object.values(parsed.unlockedGenres));
      } else {
        unlockedGenres = new Set();
      }
      
      return {
        ...parsed,
        unlockedGenres,
      } as GameState;
    } catch (error) {
      console.error('Failed to load game state:', error);
      return null;
    }
  }

  async clear(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
  }

  async hasSave(): Promise<boolean> {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }
}

/**
 * Default storage service instance
 */
export const storageService = new LocalStorageService();
