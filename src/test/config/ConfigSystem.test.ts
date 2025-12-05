/**
 * Balance Configuration Tests - Prompt 10.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  parseVersion,
  stringifyVersion,
  isVersionCompatible,
  ConfigVersion,
} from '../../domain/config/ConfigTypes';
import {
  DEFAULT_ECONOMY_CONFIG,
  DEFAULT_GACHA_RATES_CONFIG,
  DEFAULT_MARKET_CONFIG,
  DEFAULT_REPUTATION_CONFIG,
  DEFAULT_EMPLOYEE_CONFIG,
  DEFAULT_GAME_BALANCE_CONFIG,
  DEFAULT_CONFIG_BUNDLE,
  deepMerge,
  getConfigForDifficulty,
  freezeConfig,
} from '../../domain/config/ConfigDefaults';
import {
  ConfigLoader,
  getConfigLoader,
  getCurrentConfig,
  getConfig,
} from '../../infrastructure/config/ConfigLoader';
import {
  validateConfigBundle,
  checkBalanceRegression,
} from '../../infrastructure/config/ConfigValidator';

// =============================================================================
// Version Tests
// =============================================================================

describe('Config Version', () => {
  describe('parseVersion', () => {
    it('should parse valid version strings', () => {
      expect(parseVersion('1.0.0')).toEqual({ major: 1, minor: 0, patch: 0 });
      expect(parseVersion('2.3.4')).toEqual({ major: 2, minor: 3, patch: 4 });
      expect(parseVersion('10.20.30')).toEqual({ major: 10, minor: 20, patch: 30 });
    });

    it('should handle partial version strings', () => {
      expect(parseVersion('1.0')).toEqual({ major: 1, minor: 0, patch: 0 });
      expect(parseVersion('1')).toEqual({ major: 1, minor: 0, patch: 0 });
    });
  });

  describe('stringifyVersion', () => {
    it('should stringify version objects', () => {
      const version: ConfigVersion = { major: 1, minor: 2, patch: 3 };
      expect(stringifyVersion(version)).toBe('1.2.3');
    });
  });

  describe('isVersionCompatible', () => {
    it('should return true for same major version', () => {
      const current: ConfigVersion = { major: 1, minor: 2, patch: 0 };
      const required: ConfigVersion = { major: 1, minor: 1, patch: 0 };
      expect(isVersionCompatible(current, required)).toBe(true);
    });

    it('should return false for different major version', () => {
      const current: ConfigVersion = { major: 2, minor: 0, patch: 0 };
      const required: ConfigVersion = { major: 1, minor: 0, patch: 0 };
      expect(isVersionCompatible(current, required)).toBe(false);
    });

    it('should return false for lower minor version', () => {
      const current: ConfigVersion = { major: 1, minor: 0, patch: 0 };
      const required: ConfigVersion = { major: 1, minor: 1, patch: 0 };
      expect(isVersionCompatible(current, required)).toBe(false);
    });
  });
});

// =============================================================================
// Default Config Tests
// =============================================================================

describe('Default Configurations', () => {
  describe('Economy Config', () => {
    it('should have valid base ARPU', () => {
      expect(DEFAULT_ECONOMY_CONFIG.baseArpu).toBeGreaterThan(0);
      expect(DEFAULT_ECONOMY_CONFIG.baseArpu).toBeLessThan(100);
    });

    it('should have monetization multipliers for all strategies', () => {
      expect(DEFAULT_ECONOMY_CONFIG.monetizationMultipliers.generous).toBeDefined();
      expect(DEFAULT_ECONOMY_CONFIG.monetizationMultipliers.balanced).toBeDefined();
      expect(DEFAULT_ECONOMY_CONFIG.monetizationMultipliers.aggressive).toBeDefined();
      expect(DEFAULT_ECONOMY_CONFIG.monetizationMultipliers.predatory).toBeDefined();
    });

    it('should have balanced strategy at 1.0', () => {
      expect(DEFAULT_ECONOMY_CONFIG.monetizationMultipliers.balanced.arpu).toBe(1.0);
      expect(DEFAULT_ECONOMY_CONFIG.monetizationMultipliers.balanced.retention).toBe(1.0);
    });
  });

  describe('Gacha Rates Config', () => {
    it('should have rates summing to 1.0', () => {
      const rates = DEFAULT_GACHA_RATES_CONFIG.defaultRates;
      const sum = rates.common + rates.uncommon + rates.rare + rates.epic + rates.legendary;
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('should have rates in descending order by rarity', () => {
      const rates = DEFAULT_GACHA_RATES_CONFIG.defaultRates;
      expect(rates.common).toBeGreaterThan(rates.uncommon);
      expect(rates.uncommon).toBeGreaterThan(rates.rare);
      expect(rates.rare).toBeGreaterThan(rates.epic);
      expect(rates.epic).toBeGreaterThan(rates.legendary);
    });

    it('should have soft pity before pity counter', () => {
      expect(DEFAULT_GACHA_RATES_CONFIG.softPityStart).toBeLessThan(
        DEFAULT_GACHA_RATES_CONFIG.defaultPityCounter
      );
    });
  });

  describe('Market Config', () => {
    it('should have player segments summing to 100%', () => {
      const segments = DEFAULT_MARKET_CONFIG.playerSegments;
      const sum = 
        segments.whale.populationPercent +
        segments.dolphin.populationPercent +
        segments.minnow.populationPercent +
        segments.freeToPlay.populationPercent;
      expect(sum).toBe(100);
    });

    it('should have whale spending power higher than other segments', () => {
      const segments = DEFAULT_MARKET_CONFIG.playerSegments;
      expect(segments.whale.spendingPower).toBeGreaterThan(segments.dolphin.spendingPower);
      expect(segments.dolphin.spendingPower).toBeGreaterThan(segments.minnow.spendingPower);
      expect(segments.minnow.spendingPower).toBeGreaterThan(segments.freeToPlay.spendingPower);
    });
  });

  describe('Reputation Config', () => {
    it('should have initial reputation within bounds', () => {
      expect(DEFAULT_REPUTATION_CONFIG.initialReputation).toBeGreaterThanOrEqual(
        DEFAULT_REPUTATION_CONFIG.minReputation
      );
      expect(DEFAULT_REPUTATION_CONFIG.initialReputation).toBeLessThanOrEqual(
        DEFAULT_REPUTATION_CONFIG.maxReputation
      );
    });

    it('should have thresholds in descending order', () => {
      const thresholds = DEFAULT_REPUTATION_CONFIG.thresholds;
      expect(thresholds.excellent).toBeGreaterThan(thresholds.good);
      expect(thresholds.good).toBeGreaterThan(thresholds.neutral);
      expect(thresholds.neutral).toBeGreaterThan(thresholds.poor);
      expect(thresholds.poor).toBeGreaterThan(thresholds.terrible);
    });
  });

  describe('Employee Config', () => {
    it('should have salaries in ascending order by level', () => {
      const salaries = DEFAULT_EMPLOYEE_CONFIG.baseSalary;
      expect(salaries.junior).toBeLessThan(salaries.mid);
      expect(salaries.mid).toBeLessThan(salaries.senior);
      expect(salaries.senior).toBeLessThan(salaries.lead);
    });
  });
});

// =============================================================================
// Deep Merge Tests
// =============================================================================

describe('deepMerge', () => {
  it('should merge simple objects', () => {
    const target = { a: 1, b: 2 };
    const source = { b: 3, c: 4 };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('should merge nested objects', () => {
    const target = { a: { x: 1, y: 2 }, b: 3 };
    const source = { a: { y: 5, z: 6 } };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: { x: 1, y: 5, z: 6 }, b: 3 });
  });

  it('should not modify original objects', () => {
    const target = { a: { x: 1 }, b: 2 };
    const source = { a: { x: 5 }, c: 3 };
    const result = deepMerge(target, source);
    expect(result.a.x).toBe(5);
    expect(target.a.x).toBe(1);
  });

  it('should handle undefined values', () => {
    const target = { a: 1, b: 2 };
    const source = { b: undefined };
    const result = deepMerge(target, source);
    expect(result.a).toBe(1);
    expect(result.b).toBe(2);
  });
});

// =============================================================================
// Difficulty Config Tests
// =============================================================================

describe('getConfigForDifficulty', () => {
  it('should return base config for standard difficulty', () => {
    const config = getConfigForDifficulty('standard');
    expect(config.economy.baseArpu).toBe(DEFAULT_ECONOMY_CONFIG.baseArpu);
    expect(config.gacha.defaultPityCounter).toBe(DEFAULT_GACHA_RATES_CONFIG.defaultPityCounter);
  });

  it('should apply casual overrides', () => {
    const config = getConfigForDifficulty('casual');
    // Casual should have higher ARPU and lower pity
    expect(config.economy.baseArpu).toBeGreaterThan(DEFAULT_ECONOMY_CONFIG.baseArpu);
    expect(config.gacha.defaultPityCounter).toBeLessThan(DEFAULT_GACHA_RATES_CONFIG.defaultPityCounter);
  });

  it('should apply hardcore overrides', () => {
    const config = getConfigForDifficulty('hardcore');
    // Hardcore should have lower ARPU and higher pity
    expect(config.economy.baseArpu).toBeLessThan(DEFAULT_ECONOMY_CONFIG.baseArpu);
    expect(config.gacha.defaultPityCounter).toBeGreaterThan(DEFAULT_GACHA_RATES_CONFIG.defaultPityCounter);
  });

  it('should apply sandbox overrides', () => {
    const config = getConfigForDifficulty('sandbox');
    // Sandbox should have high ARPU and low pity
    expect(config.economy.baseArpu).toBeGreaterThan(DEFAULT_ECONOMY_CONFIG.baseArpu);
    expect(config.gacha.defaultPityCounter).toBeLessThan(DEFAULT_GACHA_RATES_CONFIG.defaultPityCounter);
  });
});

// =============================================================================
// Freeze Config Tests
// =============================================================================

describe('freezeConfig', () => {
  it('should freeze top-level object', () => {
    const config = freezeConfig({ a: 1, b: 2 });
    expect(Object.isFrozen(config)).toBe(true);
  });

  it('should freeze nested objects', () => {
    const config = freezeConfig({ a: { b: { c: 1 } } });
    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.a)).toBe(true);
    expect(Object.isFrozen(config.a.b)).toBe(true);
  });
});

// =============================================================================
// Config Loader Tests
// =============================================================================

describe('ConfigLoader', () => {
  let loader: ConfigLoader;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    ConfigLoader.resetInstance();
    loader = new ConfigLoader({ autoSave: false });
  });

  afterEach(() => {
    localStorage.clear();
    ConfigLoader.resetInstance();
  });

  describe('initialization', () => {
    it('should start with default config', () => {
      const config = loader.getConfig();
      expect(config.economy.baseArpu).toBe(DEFAULT_ECONOMY_CONFIG.baseArpu);
    });

    it('should load from storage if available', () => {
      const customBundle = {
        ...DEFAULT_CONFIG_BUNDLE,
        base: {
          ...DEFAULT_GAME_BALANCE_CONFIG,
          economy: {
            ...DEFAULT_ECONOMY_CONFIG,
            baseArpu: 5.0,
          },
        },
      };
      localStorage.setItem('gacha_config_bundle', JSON.stringify(customBundle));

      const newLoader = new ConfigLoader();
      newLoader.load();
      expect(newLoader.getConfig().economy.baseArpu).toBe(5.0);
    });
  });

  describe('difficulty switching', () => {
    it('should change active config when difficulty changes', () => {
      loader.load();
      const standardConfig = loader.getConfig();
      
      loader.setDifficulty('casual');
      const casualConfig = loader.getConfig();
      
      expect(casualConfig.economy.baseArpu).not.toBe(standardConfig.economy.baseArpu);
    });
  });

  describe('config updates', () => {
    it('should update base config', () => {
      loader.load();
      const result = loader.updateBaseConfig({
        economy: { baseArpu: 10.0 },
      });

      expect(result.isValid).toBe(true);
      expect(loader.getConfig().economy.baseArpu).toBe(10.0);
    });

    it('should reject invalid config updates', () => {
      loader.load();
      const result = loader.updateBaseConfig({
        economy: { baseArpu: -1 }, // Invalid: negative ARPU
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('export/import', () => {
    it('should export config as JSON', () => {
      loader.load();
      const json = loader.exportConfig();
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should import valid config', () => {
      loader.load();
      const customBundle = {
        ...DEFAULT_CONFIG_BUNDLE,
        base: {
          ...DEFAULT_GAME_BALANCE_CONFIG,
          economy: {
            ...DEFAULT_ECONOMY_CONFIG,
            baseArpu: 7.5,
          },
        },
      };

      const result = loader.importConfig(JSON.stringify(customBundle));
      expect(result.isValid).toBe(true);
      expect(loader.getConfig().economy.baseArpu).toBe(7.5);
    });

    it('should reject invalid JSON', () => {
      loader.load();
      const result = loader.importConfig('not json');
      expect(result.isValid).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset to defaults', () => {
      loader.load();
      loader.updateBaseConfig({ economy: { baseArpu: 99 } });
      expect(loader.getConfig().economy.baseArpu).toBe(99);

      loader.reset();
      expect(loader.getConfig().economy.baseArpu).toBe(DEFAULT_ECONOMY_CONFIG.baseArpu);
    });
  });

  describe('listeners', () => {
    it('should notify listeners on config change', () => {
      loader.load();
      const listener = vi.fn();
      loader.subscribe(listener);

      loader.setDifficulty('casual');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should allow unsubscribing', () => {
      loader.load();
      const listener = vi.fn();
      const unsubscribe = loader.subscribe(listener);

      unsubscribe();
      loader.setDifficulty('casual');
      expect(listener).not.toHaveBeenCalled();
    });
  });
});

// =============================================================================
// Config Validation Tests
// =============================================================================

describe('Config Validation', () => {
  describe('validateConfigBundle', () => {
    it('should validate default config', () => {
      const result = validateConfigBundle(DEFAULT_CONFIG_BUNDLE);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid ARPU', () => {
      const invalidBundle = {
        ...DEFAULT_CONFIG_BUNDLE,
        base: {
          ...DEFAULT_GAME_BALANCE_CONFIG,
          economy: {
            ...DEFAULT_ECONOMY_CONFIG,
            baseArpu: -5, // Invalid
          },
        },
      };

      const result = validateConfigBundle(invalidBundle);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.path.includes('baseArpu'))).toBe(true);
    });

    it('should detect invalid gacha rates sum', () => {
      const invalidBundle = {
        ...DEFAULT_CONFIG_BUNDLE,
        base: {
          ...DEFAULT_GAME_BALANCE_CONFIG,
          gacha: {
            ...DEFAULT_GACHA_RATES_CONFIG,
            defaultRates: {
              common: 0.5, // Doesn't sum to 1.0
              uncommon: 0.2,
              rare: 0.1,
              epic: 0.05,
              legendary: 0.01,
            },
          },
        },
      };

      const result = validateConfigBundle(invalidBundle);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('sum to 1.0'))).toBe(true);
    });

    it('should detect invalid player segment sum', () => {
      const invalidBundle = {
        ...DEFAULT_CONFIG_BUNDLE,
        base: {
          ...DEFAULT_GAME_BALANCE_CONFIG,
          market: {
            ...DEFAULT_MARKET_CONFIG,
            playerSegments: {
              ...DEFAULT_MARKET_CONFIG.playerSegments,
              whale: { ...DEFAULT_MARKET_CONFIG.playerSegments.whale, populationPercent: 50 },
            },
          },
        },
      };

      const result = validateConfigBundle(invalidBundle);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('100%'))).toBe(true);
    });

    it('should detect invalid reputation thresholds order', () => {
      const invalidBundle = {
        ...DEFAULT_CONFIG_BUNDLE,
        base: {
          ...DEFAULT_GAME_BALANCE_CONFIG,
          reputation: {
            ...DEFAULT_REPUTATION_CONFIG,
            thresholds: {
              excellent: 50, // Lower than good
              good: 70,
              neutral: 50,
              poor: 30,
              terrible: 10,
            },
          },
        },
      };

      const result = validateConfigBundle(invalidBundle);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('greater than'))).toBe(true);
    });
  });

  describe('checkBalanceRegression', () => {
    it('should pass for identical configs', () => {
      const result = checkBalanceRegression(
        DEFAULT_GAME_BALANCE_CONFIG,
        DEFAULT_GAME_BALANCE_CONFIG
      );
      expect(result.passed).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect large ARPU changes', () => {
      const modified = {
        ...DEFAULT_GAME_BALANCE_CONFIG,
        economy: {
          ...DEFAULT_ECONOMY_CONFIG,
          baseArpu: DEFAULT_ECONOMY_CONFIG.baseArpu * 2, // 100% change
        },
      };

      const result = checkBalanceRegression(modified, DEFAULT_GAME_BALANCE_CONFIG);
      expect(result.passed).toBe(false);
      expect(result.issues.some(i => i.includes('ARPU'))).toBe(true);
    });

    it('should detect large legendary rate changes', () => {
      const modified = {
        ...DEFAULT_GAME_BALANCE_CONFIG,
        gacha: {
          ...DEFAULT_GACHA_RATES_CONFIG,
          defaultRates: {
            ...DEFAULT_GACHA_RATES_CONFIG.defaultRates,
            legendary: DEFAULT_GACHA_RATES_CONFIG.defaultRates.legendary * 2,
          },
        },
      };

      const result = checkBalanceRegression(modified, DEFAULT_GAME_BALANCE_CONFIG);
      expect(result.passed).toBe(false);
      expect(result.issues.some(i => i.includes('Legendary'))).toBe(true);
    });
  });
});

// =============================================================================
// Convenience Function Tests
// =============================================================================

describe('Convenience Functions', () => {
  beforeEach(() => {
    localStorage.clear();
    ConfigLoader.resetInstance();
  });

  afterEach(() => {
    localStorage.clear();
    ConfigLoader.resetInstance();
  });

  it('getConfigLoader should return singleton', () => {
    const loader1 = getConfigLoader();
    const loader2 = getConfigLoader();
    expect(loader1).toBe(loader2);
  });

  it('getCurrentConfig should return active config', () => {
    const config = getCurrentConfig();
    expect(config.economy).toBeDefined();
    expect(config.gacha).toBeDefined();
  });

  it('getConfig should return config for specific difficulty', () => {
    const casualConfig = getConfig('casual');
    const hardcoreConfig = getConfig('hardcore');
    
    expect(casualConfig.economy.baseArpu).toBeGreaterThan(hardcoreConfig.economy.baseArpu);
  });
});
