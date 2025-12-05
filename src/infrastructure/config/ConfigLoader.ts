/**
 * Configuration Loader - Prompt 10.1
 * 
 * Loads, validates, and manages game balance configurations.
 * Supports versioning, migration, and runtime config changes.
 */

import {
  ConfigBundle,
  GameBalanceConfig,
  ConfigValidationResult,
  parseVersion,
  isVersionCompatible,
  DeepPartial,
} from '../../domain/config/ConfigTypes';
import {
  DEFAULT_CONFIG_BUNDLE,
  DEFAULT_GAME_BALANCE_CONFIG,
  CURRENT_CONFIG_VERSION,
  deepMerge,
  getConfigForDifficulty,
  freezeConfig,
} from '../../domain/config/ConfigDefaults';
import { DifficultyMode } from '../../domain/difficulty';
import { validateConfigBundle } from './ConfigValidator';

// =============================================================================
// Types
// =============================================================================

export interface ConfigLoaderOptions {
  readonly storageKey?: string;
  readonly autoSave?: boolean;
  readonly validateOnLoad?: boolean;
}

export interface ConfigMigration {
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly migrate: (config: ConfigBundle) => ConfigBundle;
}

export type ConfigChangeListener = (
  newConfig: GameBalanceConfig,
  difficulty: DifficultyMode
) => void;

// =============================================================================
// Config Loader Class
// =============================================================================

export class ConfigLoader {
  private static instance: ConfigLoader | null = null;
  
  private readonly storageKey: string;
  private readonly autoSave: boolean;
  private readonly validateOnLoad: boolean;
  
  private currentBundle: ConfigBundle;
  private currentDifficulty: DifficultyMode;
  private activeConfig: GameBalanceConfig;
  private listeners: Set<ConfigChangeListener>;
  private migrations: Map<string, ConfigMigration>;
  private isLoaded: boolean;

  constructor(options: ConfigLoaderOptions = {}) {
    this.storageKey = options.storageKey ?? 'gacha_config_bundle';
    this.autoSave = options.autoSave ?? true;
    this.validateOnLoad = options.validateOnLoad ?? true;
    
    this.currentBundle = DEFAULT_CONFIG_BUNDLE;
    this.currentDifficulty = 'standard';
    this.activeConfig = DEFAULT_GAME_BALANCE_CONFIG;
    this.listeners = new Set();
    this.migrations = new Map();
    this.isLoaded = false;
    
    this.registerDefaultMigrations();
  }

  // ===========================================================================
  // Singleton Access
  // ===========================================================================

  static getInstance(options?: ConfigLoaderOptions): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader(options);
    }
    return ConfigLoader.instance;
  }

  static resetInstance(): void {
    ConfigLoader.instance = null;
  }

  // ===========================================================================
  // Loading & Saving
  // ===========================================================================

  /**
   * Load configuration from storage
   */
  load(): ConfigValidationResult {
    try {
      const stored = localStorage.getItem(this.storageKey);
      
      if (!stored) {
        // No stored config, use defaults
        this.currentBundle = DEFAULT_CONFIG_BUNDLE;
        this.activeConfig = getConfigForDifficulty(this.currentDifficulty);
        this.isLoaded = true;
        return { isValid: true, errors: [], warnings: [] };
      }

      const parsed = JSON.parse(stored) as ConfigBundle;
      
      // Check version compatibility
      const currentVersion = parseVersion(CURRENT_CONFIG_VERSION);
      const loadedVersion = parseVersion(parsed.version);
      
      if (!isVersionCompatible(loadedVersion, currentVersion)) {
        // Try to migrate
        const migrated = this.migrateConfig(parsed);
        if (migrated) {
          this.currentBundle = migrated;
        } else {
          // Migration failed, use defaults
          this.currentBundle = DEFAULT_CONFIG_BUNDLE;
          this.isLoaded = true;
          return {
            isValid: false,
            errors: [{
              path: 'version',
              message: `Incompatible config version ${parsed.version}, using defaults`,
              expectedType: CURRENT_CONFIG_VERSION,
              receivedValue: parsed.version,
            }],
            warnings: [],
          };
        }
      } else {
        this.currentBundle = parsed;
      }

      // Validate if enabled
      if (this.validateOnLoad) {
        const validation = validateConfigBundle(this.currentBundle);
        if (!validation.isValid) {
          // Use defaults for invalid config
          this.currentBundle = DEFAULT_CONFIG_BUNDLE;
          this.activeConfig = getConfigForDifficulty(this.currentDifficulty);
          this.isLoaded = true;
          return validation;
        }
      }

      this.activeConfig = getConfigForDifficulty(
        this.currentDifficulty,
        this.currentBundle.base
      );
      this.isLoaded = true;
      
      return { isValid: true, errors: [], warnings: [] };
    } catch (error) {
      // Parse error, use defaults
      this.currentBundle = DEFAULT_CONFIG_BUNDLE;
      this.activeConfig = getConfigForDifficulty(this.currentDifficulty);
      this.isLoaded = true;
      
      return {
        isValid: false,
        errors: [{
          path: 'root',
          message: `Failed to parse config: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        warnings: [],
      };
    }
  }

  /**
   * Save current configuration to storage
   */
  save(): boolean {
    try {
      const bundle: ConfigBundle = {
        ...this.currentBundle,
        lastModified: new Date().toISOString(),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(bundle));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reset to default configuration
   */
  reset(): void {
    this.currentBundle = DEFAULT_CONFIG_BUNDLE;
    this.activeConfig = getConfigForDifficulty(this.currentDifficulty);
    
    if (this.autoSave) {
      localStorage.removeItem(this.storageKey);
    }
    
    this.notifyListeners();
  }

  // ===========================================================================
  // Config Access
  // ===========================================================================

  /**
   * Get the currently active configuration
   */
  getConfig(): Readonly<GameBalanceConfig> {
    if (!this.isLoaded) {
      this.load();
    }
    return freezeConfig(this.activeConfig);
  }

  /**
   * Get configuration for a specific difficulty
   */
  getConfigForDifficulty(difficulty: DifficultyMode): Readonly<GameBalanceConfig> {
    if (!this.isLoaded) {
      this.load();
    }
    return freezeConfig(getConfigForDifficulty(difficulty, this.currentBundle.base));
  }

  /**
   * Get the full config bundle
   */
  getBundle(): Readonly<ConfigBundle> {
    if (!this.isLoaded) {
      this.load();
    }
    return freezeConfig(this.currentBundle);
  }

  /**
   * Get current difficulty mode
   */
  getCurrentDifficulty(): DifficultyMode {
    return this.currentDifficulty;
  }

  // ===========================================================================
  // Config Modification
  // ===========================================================================

  /**
   * Set the active difficulty mode
   */
  setDifficulty(difficulty: DifficultyMode): void {
    this.currentDifficulty = difficulty;
    this.activeConfig = getConfigForDifficulty(difficulty, this.currentBundle.base);
    
    if (this.autoSave) {
      this.save();
    }
    
    this.notifyListeners();
  }

  /**
   * Update base configuration (applies to all difficulties)
   */
  updateBaseConfig(updates: DeepPartial<GameBalanceConfig>): ConfigValidationResult {
    const newBase = {
      economy: deepMerge(this.currentBundle.base.economy, updates.economy ?? {}),
      gacha: deepMerge(this.currentBundle.base.gacha, updates.gacha ?? {}),
      market: deepMerge(this.currentBundle.base.market, updates.market ?? {}),
      reputation: deepMerge(this.currentBundle.base.reputation, updates.reputation ?? {}),
      employee: deepMerge(this.currentBundle.base.employee, updates.employee ?? {}),
      research: deepMerge(this.currentBundle.base.research, updates.research ?? {}),
    };

    // Validate the new config
    const testBundle: ConfigBundle = {
      ...this.currentBundle,
      base: newBase,
    };
    
    const validation = validateConfigBundle(testBundle);
    if (!validation.isValid) {
      return validation;
    }

    this.currentBundle = {
      ...testBundle,
      lastModified: new Date().toISOString(),
    };
    
    this.activeConfig = getConfigForDifficulty(
      this.currentDifficulty,
      this.currentBundle.base
    );
    
    if (this.autoSave) {
      this.save();
    }
    
    this.notifyListeners();
    return validation;
  }

  /**
   * Update difficulty-specific overrides
   */
  updateDifficultyOverrides(
    difficulty: DifficultyMode,
    overrides: DeepPartial<GameBalanceConfig>
  ): void {
    this.currentBundle = {
      ...this.currentBundle,
      difficultyOverrides: {
        ...this.currentBundle.difficultyOverrides,
        [difficulty]: deepMerge(
          this.currentBundle.difficultyOverrides[difficulty] ?? {},
          overrides
        ),
      },
      lastModified: new Date().toISOString(),
    };

    if (this.currentDifficulty === difficulty) {
      this.activeConfig = getConfigForDifficulty(difficulty, this.currentBundle.base);
      this.notifyListeners();
    }

    if (this.autoSave) {
      this.save();
    }
  }

  // ===========================================================================
  // Change Listeners
  // ===========================================================================

  /**
   * Subscribe to configuration changes
   */
  subscribe(listener: ConfigChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.activeConfig, this.currentDifficulty);
    }
  }

  // ===========================================================================
  // Version Migration
  // ===========================================================================

  /**
   * Register a config migration
   */
  registerMigration(migration: ConfigMigration): void {
    const key = `${migration.fromVersion}->${migration.toVersion}`;
    this.migrations.set(key, migration);
  }

  private registerDefaultMigrations(): void {
    // Example migration from 0.9.0 to 1.0.0
    this.registerMigration({
      fromVersion: '0.9.0',
      toVersion: '1.0.0',
      migrate: (config: ConfigBundle): ConfigBundle => {
        // Add any new fields with defaults
        return {
          ...config,
          version: '1.0.0',
        };
      },
    });
  }

  private migrateConfig(config: ConfigBundle): ConfigBundle | null {
    let current = config;
    const targetVersion = parseVersion(CURRENT_CONFIG_VERSION);
    
    while (true) {
      const currentVersion = parseVersion(current.version);
      
      if (isVersionCompatible(currentVersion, targetVersion)) {
        return current;
      }

      // Find a migration
      let migrated = false;
      for (const migration of this.migrations.values()) {
        if (migration.fromVersion === current.version) {
          current = migration.migrate(current);
          migrated = true;
          break;
        }
      }

      if (!migrated) {
        // No migration path found
        return null;
      }
    }
  }

  // ===========================================================================
  // Import/Export
  // ===========================================================================

  /**
   * Export configuration as JSON string
   */
  exportConfig(): string {
    return JSON.stringify(this.currentBundle, null, 2);
  }

  /**
   * Import configuration from JSON string
   */
  importConfig(json: string): ConfigValidationResult {
    try {
      const parsed = JSON.parse(json) as ConfigBundle;
      const validation = validateConfigBundle(parsed);
      
      if (validation.isValid) {
        this.currentBundle = parsed;
        this.activeConfig = getConfigForDifficulty(
          this.currentDifficulty,
          this.currentBundle.base
        );
        
        if (this.autoSave) {
          this.save();
        }
        
        this.notifyListeners();
      }
      
      return validation;
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          path: 'root',
          message: `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        warnings: [],
      };
    }
  }
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Get the global config loader instance
 */
export function getConfigLoader(): ConfigLoader {
  return ConfigLoader.getInstance();
}

/**
 * Get the current active configuration
 */
export function getCurrentConfig(): Readonly<GameBalanceConfig> {
  return getConfigLoader().getConfig();
}

/**
 * Get config for a specific difficulty
 */
export function getConfig(difficulty: DifficultyMode): Readonly<GameBalanceConfig> {
  return getConfigLoader().getConfigForDifficulty(difficulty);
}
