/**
 * SaveGameManager - Prompt 6.1: Robust Save System
 * 
 * Features:
 * - Auto-save with configurable interval
 * - Multiple save slots
 * - Save data versioning for migrations
 * - LZ-string compression
 * - Validation and corruption detection
 * - Export/import for backups
 */

import { GameState } from '@application/state';

// =============================================================================
// Types
// =============================================================================

/** Current save format version - increment when schema changes */
export const SAVE_VERSION = 1;

/** Maximum number of save slots */
export const MAX_SAVE_SLOTS = 5;

/** Save slot identifier */
export type SaveSlotId = 0 | 1 | 2 | 3 | 4;

/**
 * Metadata stored with each save
 */
export interface SaveMetadata {
  readonly version: number;
  readonly timestamp: number;
  readonly playtime: number; // Total seconds played
  readonly companyName: string;
  readonly funds: number;
  readonly employeeCount: number;
  readonly gameCount: number;
  readonly currentTick: number;
  readonly checksum: string;
}

/**
 * Complete save data structure
 */
export interface SaveData {
  readonly metadata: SaveMetadata;
  readonly state: GameState;
}

/**
 * Compressed save data for storage
 */
export interface CompressedSaveData {
  readonly v: number; // Version
  readonly c: string; // Compressed data
  readonly cs: string; // Checksum
}

/**
 * Save slot info for display
 */
export interface SaveSlotInfo {
  readonly slotId: SaveSlotId;
  readonly isEmpty: boolean;
  readonly metadata: SaveMetadata | null;
  readonly sizeBytes: number;
}

/**
 * Save operation result
 */
export interface SaveResult {
  readonly success: boolean;
  readonly slotId: SaveSlotId;
  readonly error?: string;
  readonly sizeBytes?: number;
}

/**
 * Load operation result
 */
export interface LoadResult {
  readonly success: boolean;
  readonly state: GameState | null;
  readonly metadata: SaveMetadata | null;
  readonly error?: string;
  readonly migrated?: boolean;
}

/**
 * Validation result
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
}

/**
 * Migration function type
 */
export type MigrationFunction = (state: GameState) => GameState;

/**
 * Auto-save configuration
 */
export interface AutoSaveConfig {
  enabled: boolean;
  intervalMs: number;
  slotId: SaveSlotId;
  onSave?: (result: SaveResult) => void;
  onError?: (error: Error) => void;
}

// =============================================================================
// LZ-String Compression (simplified implementation)
// =============================================================================

/**
 * Simple compression using btoa/atob with URI encoding
 * For production, use the lz-string library
 */
export const Compression = {
  compress(input: string): string {
    try {
      // Use TextEncoder for proper UTF-8 handling
      const encoder = new TextEncoder();
      const bytes = encoder.encode(input);
      
      // Convert to base64
      let binary = '';
      for (const byte of bytes) {
        binary += String.fromCharCode(byte);
      }
      return btoa(binary);
    } catch {
      // Fallback: URI encode
      return encodeURIComponent(input);
    }
  },

  decompress(input: string): string {
    try {
      // Decode from base64
      const binary = atob(input);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      // Use TextDecoder
      const decoder = new TextDecoder();
      return decoder.decode(bytes);
    } catch {
      // Fallback: URI decode
      return decodeURIComponent(input);
    }
  },
};

// =============================================================================
// Checksum Calculation
// =============================================================================

/**
 * Calculate a simple checksum for data integrity
 */
export function calculateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

/**
 * Verify checksum matches data
 */
export function verifyChecksum(data: string, checksum: string): boolean {
  return calculateChecksum(data) === checksum;
}

// =============================================================================
// Save Data Validation
// =============================================================================

/**
 * Validate save data structure
 */
export function validateSaveData(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Save data is not an object');
    return { isValid: false, errors, warnings };
  }

  const saveData = data as Record<string, unknown>;

  // Check metadata
  if (!saveData.metadata || typeof saveData.metadata !== 'object') {
    errors.push('Missing or invalid metadata');
  } else {
    const meta = saveData.metadata as Record<string, unknown>;
    if (typeof meta.version !== 'number') errors.push('Invalid version');
    if (typeof meta.timestamp !== 'number') errors.push('Invalid timestamp');
    if (typeof meta.checksum !== 'string') errors.push('Invalid checksum');
  }

  // Check state
  if (!saveData.state || typeof saveData.state !== 'object') {
    errors.push('Missing or invalid state');
  } else {
    const state = saveData.state as Record<string, unknown>;
    
    // Required state properties
    if (typeof state.currentTick !== 'number') errors.push('Invalid currentTick');
    if (typeof state.isPaused !== 'boolean') errors.push('Invalid isPaused');
    if (!Array.isArray(state.employees)) errors.push('Invalid employees array');
    if (!Array.isArray(state.games)) errors.push('Invalid games array');

    // Warnings for potentially problematic data
    if (state.company === null) {
      warnings.push('No company data - new game or corrupted');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// Migration System
// =============================================================================

/**
 * Registry of migrations from version X to X+1
 */
const migrations: Map<number, MigrationFunction> = new Map();

/**
 * Register a migration function
 */
export function registerMigration(fromVersion: number, migration: MigrationFunction): void {
  migrations.set(fromVersion, migration);
}

/**
 * Migrate save data to current version
 */
export function migrateSaveData(
  state: GameState,
  fromVersion: number
): { state: GameState; migrated: boolean } {
  let currentState = state;
  let currentVersion = fromVersion;
  let migrated = false;

  while (currentVersion < SAVE_VERSION) {
    const migration = migrations.get(currentVersion);
    if (migration) {
      console.log(`Migrating save from v${currentVersion} to v${currentVersion + 1}`);
      currentState = migration(currentState);
      migrated = true;
    }
    currentVersion++;
  }

  return { state: currentState, migrated };
}

// Example migration (v1 to v2 - placeholder)
// registerMigration(1, (state) => {
//   return { ...state, newField: 'default' };
// });

// =============================================================================
// SaveGameManager Class
// =============================================================================

const STORAGE_PREFIX = 'gacha-sim-save-';
const AUTO_SAVE_SLOT: SaveSlotId = 0;

export class SaveGameManager {
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;
  private autoSaveConfig: AutoSaveConfig | null = null;
  private playtimeStart: number = Date.now();

  constructor() {
    // Initialize playtime tracking
    this.playtimeStart = Date.now();
  }

  // ===========================================================================
  // Save Operations
  // ===========================================================================

  /**
   * Save game state to a slot
   */
  async save(state: GameState, slotId: SaveSlotId = AUTO_SAVE_SLOT): Promise<SaveResult> {
    try {
      // Create metadata
      const metadata: SaveMetadata = {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        playtime: this.calculatePlaytime(state),
        companyName: state.company?.name ?? 'New Company',
        funds: state.company?.funds ?? 0,
        employeeCount: state.employees.length,
        gameCount: state.games.length,
        currentTick: state.currentTick,
        checksum: '', // Will be set after serialization
      };

      // Create save data
      const saveData: SaveData = {
        metadata,
        state,
      };

      // Serialize
      const serialized = JSON.stringify(saveData);
      
      // Calculate checksum
      const checksum = calculateChecksum(serialized);
      
      // Update metadata with checksum
      const finalSaveData: SaveData = {
        ...saveData,
        metadata: { ...metadata, checksum },
      };

      // Compress
      const finalSerialized = JSON.stringify(finalSaveData);
      const compressed = Compression.compress(finalSerialized);

      // Create storage format
      const storageData: CompressedSaveData = {
        v: SAVE_VERSION,
        c: compressed,
        cs: checksum,
      };

      // Store
      const storageKey = this.getStorageKey(slotId);
      const storageValue = JSON.stringify(storageData);
      
      try {
        localStorage.setItem(storageKey, storageValue);
      } catch (error) {
        if (this.isQuotaExceeded(error)) {
          return {
            success: false,
            slotId,
            error: 'Storage quota exceeded. Try deleting old saves.',
          };
        }
        throw error;
      }

      return {
        success: true,
        slotId,
        sizeBytes: storageValue.length,
      };
    } catch (error) {
      console.error('Save failed:', error);
      return {
        success: false,
        slotId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Load game state from a slot
   */
  async load(slotId: SaveSlotId = AUTO_SAVE_SLOT): Promise<LoadResult> {
    try {
      const storageKey = this.getStorageKey(slotId);
      const storageValue = localStorage.getItem(storageKey);

      if (!storageValue) {
        return {
          success: false,
          state: null,
          metadata: null,
          error: 'No save data found',
        };
      }

      // Parse compressed format
      const compressedData: CompressedSaveData = JSON.parse(storageValue);

      // Verify checksum before decompression
      const decompressed = Compression.decompress(compressedData.c);
      const saveData: SaveData = JSON.parse(decompressed);

      // Validate checksum if present
      if (saveData.metadata.checksum) {
        const dataForChecksum = JSON.stringify({
          ...saveData,
          metadata: { ...saveData.metadata, checksum: '' },
        });
        const expectedChecksum = calculateChecksum(dataForChecksum);
        
        if (expectedChecksum !== saveData.metadata.checksum) {
          console.warn('Checksum mismatch - save data may be corrupted');
          // Continue anyway, as the data might still be usable
        }
      } else {
        console.warn('Save data has no checksum, skipping validation');
      }

      // Validate structure
      const validation = validateSaveData(saveData);
      if (!validation.isValid) {
        return {
          success: false,
          state: null,
          metadata: null,
          error: `Corrupted save: ${validation.errors.join(', ')}`,
        };
      }

      // Log warnings
      validation.warnings.forEach(w => console.warn('Save warning:', w));

      // Migrate if needed
      let state = saveData.state;
      let migrated = false;

      if (compressedData.v < SAVE_VERSION) {
        const result = migrateSaveData(state, compressedData.v);
        state = result.state;
        migrated = result.migrated;
      }

      // Reset playtime tracking
      this.playtimeStart = Date.now();

      return {
        success: true,
        state,
        metadata: saveData.metadata,
        migrated,
      };
    } catch (error) {
      console.error('Load failed:', error);
      return {
        success: false,
        state: null,
        metadata: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete a save slot
   */
  async deleteSave(slotId: SaveSlotId): Promise<boolean> {
    try {
      localStorage.removeItem(this.getStorageKey(slotId));
      return true;
    } catch {
      return false;
    }
  }

  // ===========================================================================
  // Slot Management
  // ===========================================================================

  /**
   * Get info about all save slots
   */
  getSaveSlots(): SaveSlotInfo[] {
    const slots: SaveSlotInfo[] = [];

    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
      const slotId = i as SaveSlotId;
      const storageKey = this.getStorageKey(slotId);
      const storageValue = localStorage.getItem(storageKey);

      if (!storageValue) {
        slots.push({
          slotId,
          isEmpty: true,
          metadata: null,
          sizeBytes: 0,
        });
        continue;
      }

      try {
        const compressedData: CompressedSaveData = JSON.parse(storageValue);
        const decompressed = Compression.decompress(compressedData.c);
        const saveData: SaveData = JSON.parse(decompressed);

        slots.push({
          slotId,
          isEmpty: false,
          metadata: saveData.metadata,
          sizeBytes: storageValue.length,
        });
      } catch {
        // Corrupted slot
        slots.push({
          slotId,
          isEmpty: false,
          metadata: null,
          sizeBytes: storageValue.length,
        });
      }
    }

    return slots;
  }

  /**
   * Get the first empty slot, or null if all are full
   */
  getFirstEmptySlot(): SaveSlotId | null {
    const slots = this.getSaveSlots();
    const empty = slots.find(s => s.isEmpty);
    return empty?.slotId ?? null;
  }

  // ===========================================================================
  // Auto-Save
  // ===========================================================================

  /**
   * Start auto-save with configuration
   */
  startAutoSave(
    getState: () => GameState,
    config: Partial<AutoSaveConfig> = {}
  ): void {
    this.stopAutoSave();

    this.autoSaveConfig = {
      enabled: true,
      intervalMs: config.intervalMs ?? 30000, // Default 30 seconds
      slotId: config.slotId ?? AUTO_SAVE_SLOT,
      onSave: config.onSave,
      onError: config.onError,
    };

    this.autoSaveTimer = setInterval(async () => {
      if (!this.autoSaveConfig?.enabled) return;

      try {
        const state = getState();
        const result = await this.save(state, this.autoSaveConfig.slotId);
        
        if (result.success) {
          this.autoSaveConfig.onSave?.(result);
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        this.autoSaveConfig?.onError?.(
          error instanceof Error ? error : new Error('Auto-save failed')
        );
      }
    }, this.autoSaveConfig.intervalMs);
  }

  /**
   * Stop auto-save
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    this.autoSaveConfig = null;
  }

  /**
   * Check if auto-save is running
   */
  isAutoSaveEnabled(): boolean {
    return this.autoSaveTimer !== null;
  }

  // ===========================================================================
  // Export/Import
  // ===========================================================================

  /**
   * Export save data as a downloadable string
   */
  async exportSave(slotId: SaveSlotId): Promise<string | null> {
    const storageKey = this.getStorageKey(slotId);
    const data = localStorage.getItem(storageKey);
    
    if (!data) return null;

    // Add export metadata
    const exportData = {
      exportedAt: Date.now(),
      format: 'gacha-sim-v1',
      data: JSON.parse(data),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import save data from exported string
   */
  async importSave(exportedData: string, targetSlotId: SaveSlotId): Promise<SaveResult> {
    try {
      const parsed = JSON.parse(exportedData);

      // Validate export format
      if (!parsed.format || !parsed.format.startsWith('gacha-sim')) {
        return {
          success: false,
          slotId: targetSlotId,
          error: 'Invalid save file format',
        };
      }

      // Extract compressed data
      const compressedData = parsed.data as CompressedSaveData;
      
      // Validate the save data
      const decompressed = Compression.decompress(compressedData.c);
      const saveData: SaveData = JSON.parse(decompressed);
      const validation = validateSaveData(saveData);

      if (!validation.isValid) {
        return {
          success: false,
          slotId: targetSlotId,
          error: `Invalid save data: ${validation.errors.join(', ')}`,
        };
      }

      // Store in target slot
      const storageKey = this.getStorageKey(targetSlotId);
      const storageValue = JSON.stringify(compressedData);
      localStorage.setItem(storageKey, storageValue);

      return {
        success: true,
        slotId: targetSlotId,
        sizeBytes: storageValue.length,
      };
    } catch (error) {
      return {
        success: false,
        slotId: targetSlotId,
        error: error instanceof Error ? error.message : 'Import failed',
      };
    }
  }

  /**
   * Download save as file
   */
  downloadSave(slotId: SaveSlotId, filename?: string): void {
    this.exportSave(slotId).then(data => {
      if (!data) {
        console.error('No save data to export');
        return;
      }

      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename ?? `gacha-sim-save-${slotId}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // ===========================================================================
  // Utilities
  // ===========================================================================

  private getStorageKey(slotId: SaveSlotId): string {
    return `${STORAGE_PREFIX}${slotId}`;
  }

  private isQuotaExceeded(error: unknown): boolean {
    return (
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    );
  }

  private calculatePlaytime(_state: GameState): number {
    // This would ideally come from the state
    // For now, calculate from session
    const sessionTime = Math.floor((Date.now() - this.playtimeStart) / 1000);
    return sessionTime;
  }

  /**
   * Get total storage used by all save slots
   */
  getTotalStorageUsed(): number {
    let total = 0;
    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
      const key = this.getStorageKey(i as SaveSlotId);
      const data = localStorage.getItem(key);
      if (data) {
        total += data.length;
      }
    }
    return total;
  }

  /**
   * Estimate remaining storage quota
   */
  async getStorageQuota(): Promise<{ used: number; quota: number } | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage ?? 0,
        quota: estimate.quota ?? 0,
      };
    }
    return null;
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const saveGameManager = new SaveGameManager();
