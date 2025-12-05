/**
 * Balance Configuration Defaults - Prompt 10.1
 * 
 * Default values for all game balance configurations.
 * These are the baseline values used in Standard difficulty.
 */

import {
  EconomyConfig,
  GachaRatesConfig,
  MarketConfig,
  ReputationConfig,
  EmployeeConfig,
  ResearchConfig,
  GameBalanceConfig,
  ConfigBundle,
  DeepPartial,
} from './ConfigTypes';
import { DifficultyMode } from '../difficulty';

// =============================================================================
// Current Config Version
// =============================================================================

export const CURRENT_CONFIG_VERSION = '1.0.0';

// =============================================================================
// Economy Defaults
// =============================================================================

export const DEFAULT_ECONOMY_CONFIG: EconomyConfig = {
  version: CURRENT_CONFIG_VERSION,
  lastModified: new Date().toISOString(),
  description: 'Default economy configuration for standard difficulty',
  
  baseArpu: 2.5,
  monetizationMultipliers: {
    generous: { arpu: 0.6, retention: 1.3 },
    balanced: { arpu: 1.0, retention: 1.0 },
    aggressive: { arpu: 1.5, retention: 0.7 },
    predatory: { arpu: 2.5, retention: 0.4 },
  },
  qualityArpuScale: 0.5,
  updateFrequencyBonus: {
    weekly: 1.2,
    biweekly: 1.1,
    monthly: 1.0,
    sporadic: 0.8,
    none: 0.6,
  },
  maxSaturationPenalty: 0.5,
  advertisementRevenueRate: 0.15,
  merchandiseRevenueRate: 0.05,
  licensingBaseRate: 0.02,
  serverCostPer1kUsers: 50,
  marketingEfficiency: 0.0001,
  developmentCostMultiplier: 1.5,
};

// =============================================================================
// Gacha Rates Defaults
// =============================================================================

export const DEFAULT_GACHA_RATES_CONFIG: GachaRatesConfig = {
  version: CURRENT_CONFIG_VERSION,
  lastModified: new Date().toISOString(),
  description: 'Default gacha rates configuration',
  
  defaultRates: {
    common: 0.60,
    uncommon: 0.25,
    rare: 0.10,
    epic: 0.04,
    legendary: 0.01,
  },
  rateUpMultiplier: 2.0,
  defaultPityCounter: 90,
  softPityStart: 75,
  softPityIncrement: 0.05,
  pullCost: {
    gems: 160,
    tickets: 1,
  },
  duplicateCurrency: {
    common: 1,
    uncommon: 5,
    rare: 20,
    epic: 50,
    legendary: 200,
  },
};

// =============================================================================
// Market Defaults
// =============================================================================

export const DEFAULT_MARKET_CONFIG: MarketConfig = {
  version: CURRENT_CONFIG_VERSION,
  lastModified: new Date().toISOString(),
  description: 'Default market configuration',
  
  totalMarketSize: 10_000_000,
  playerSegments: {
    whale: {
      spendingPower: 500,
      retentionRate: 0.95,
      gachaAppetite: 0.95,
      qualitySensitivity: 0.7,
      populationPercent: 2,
    },
    dolphin: {
      spendingPower: 50,
      retentionRate: 0.85,
      gachaAppetite: 0.7,
      qualitySensitivity: 0.8,
      populationPercent: 15,
    },
    minnow: {
      spendingPower: 10,
      retentionRate: 0.75,
      gachaAppetite: 0.4,
      qualitySensitivity: 0.85,
      populationPercent: 33,
    },
    freeToPlay: {
      spendingPower: 0,
      retentionRate: 0.6,
      gachaAppetite: 0.2,
      qualitySensitivity: 0.9,
      populationPercent: 50,
    },
  },
  genrePopularityBase: {
    rpg: 75,
    strategy: 65,
    puzzle: 70,
    idle: 60,
    simulation: 55,
    card: 65,
  },
  competitorStrength: {
    weak: 0.5,
    moderate: 1.0,
    strong: 1.5,
    dominant: 2.0,
  },
  seasonalMultipliers: {
    holiday: 1.3,
    summer: 1.1,
    normal: 1.0,
    offSeason: 0.9,
  },
  marketEventChance: 0.05,
  trendVolatility: 0.1,
};

// =============================================================================
// Reputation Defaults
// =============================================================================

export const DEFAULT_REPUTATION_CONFIG: ReputationConfig = {
  version: CURRENT_CONFIG_VERSION,
  lastModified: new Date().toISOString(),
  description: 'Default reputation configuration',
  
  initialReputation: 50,
  maxReputation: 100,
  minReputation: 0,
  decayRate: 0.01,
  gainMultipliers: {
    qualityRelease: 5.0,
    communityEngagement: 2.0,
    bugFix: 1.0,
    contentUpdate: 3.0,
    eventSuccess: 4.0,
  },
  lossMultipliers: {
    serverOutage: 3.0,
    buggyRelease: 4.0,
    controversy: 8.0,
    poorMonetization: 5.0,
    dataLeak: 10.0,
  },
  thresholds: {
    excellent: 90,
    good: 70,
    neutral: 50,
    poor: 30,
    terrible: 10,
  },
  recoverySpeed: 0.5,
};

// =============================================================================
// Employee Defaults
// =============================================================================

export const DEFAULT_EMPLOYEE_CONFIG: EmployeeConfig = {
  version: CURRENT_CONFIG_VERSION,
  lastModified: new Date().toISOString(),
  description: 'Default employee configuration',
  
  baseSalary: {
    junior: 40000,
    mid: 70000,
    senior: 100000,
    lead: 140000,
  },
  salaryGrowthRate: 0.03,
  skillRanges: {
    junior: { min: 10, max: 40 },
    mid: { min: 35, max: 65 },
    senior: { min: 60, max: 85 },
    lead: { min: 80, max: 100 },
  },
  skillGrowthRate: 0.1,
  moraleDecayRate: 0.02,
  moraleRecoveryRate: 0.05,
  quitThreshold: 20,
  quitProbability: 0.1,
  trainingCostMultiplier: 0.2,
  maxEmployees: 100,
};

// =============================================================================
// Research Defaults
// =============================================================================

export const DEFAULT_RESEARCH_CONFIG: ResearchConfig = {
  version: CURRENT_CONFIG_VERSION,
  lastModified: new Date().toISOString(),
  description: 'Default research configuration',
  
  baseCost: 10000,
  costScaling: 1.5,
  baseDuration: 30,
  durationScaling: 1.3,
  maxConcurrentResearch: 1,
  breakthroughChance: 0.05,
  categoryBonuses: {
    development: 0.1,
    monetization: 0.15,
    marketing: 0.1,
    operations: 0.08,
    innovation: 0.2,
  },
};

// =============================================================================
// Combined Game Balance Config
// =============================================================================

export const DEFAULT_GAME_BALANCE_CONFIG: GameBalanceConfig = {
  economy: DEFAULT_ECONOMY_CONFIG,
  gacha: DEFAULT_GACHA_RATES_CONFIG,
  market: DEFAULT_MARKET_CONFIG,
  reputation: DEFAULT_REPUTATION_CONFIG,
  employee: DEFAULT_EMPLOYEE_CONFIG,
  research: DEFAULT_RESEARCH_CONFIG,
};

// =============================================================================
// Difficulty Overrides
// =============================================================================

export const CASUAL_OVERRIDES: DeepPartial<GameBalanceConfig> = {
  economy: {
    baseArpu: 3.0,
    serverCostPer1kUsers: 35,
    marketingEfficiency: 0.00015,
  },
  gacha: {
    defaultRates: {
      rare: 0.12,
      epic: 0.06,
      legendary: 0.02,
    },
    defaultPityCounter: 60,
    softPityStart: 50,
  },
  market: {
    playerSegments: {
      whale: { populationPercent: 3 },
      dolphin: { populationPercent: 18 },
    },
    marketEventChance: 0.03,
  },
  reputation: {
    initialReputation: 60,
    decayRate: 0.005,
    recoverySpeed: 0.75,
  },
  employee: {
    skillGrowthRate: 0.15,
    moraleDecayRate: 0.01,
    quitProbability: 0.05,
  },
  research: {
    costScaling: 1.3,
    durationScaling: 1.1,
    breakthroughChance: 0.08,
  },
};

export const STANDARD_OVERRIDES: DeepPartial<GameBalanceConfig> = {
  // Standard uses all defaults, no overrides needed
};

export const HARDCORE_OVERRIDES: DeepPartial<GameBalanceConfig> = {
  economy: {
    baseArpu: 2.0,
    serverCostPer1kUsers: 70,
    marketingEfficiency: 0.00007,
  },
  gacha: {
    defaultRates: {
      rare: 0.08,
      epic: 0.03,
      legendary: 0.007,
    },
    defaultPityCounter: 120,
    softPityStart: 100,
  },
  market: {
    playerSegments: {
      whale: { populationPercent: 1 },
      dolphin: { populationPercent: 12 },
    },
    competitorStrength: {
      weak: 0.7,
      moderate: 1.2,
      strong: 1.8,
      dominant: 2.5,
    },
    marketEventChance: 0.08,
    trendVolatility: 0.15,
  },
  reputation: {
    initialReputation: 40,
    decayRate: 0.02,
    recoverySpeed: 0.3,
    lossMultipliers: {
      controversy: 12.0,
      dataLeak: 15.0,
    },
  },
  employee: {
    skillGrowthRate: 0.07,
    moraleDecayRate: 0.03,
    quitProbability: 0.15,
    quitThreshold: 30,
  },
  research: {
    costScaling: 1.8,
    durationScaling: 1.5,
    breakthroughChance: 0.03,
  },
};

export const SANDBOX_OVERRIDES: DeepPartial<GameBalanceConfig> = {
  // Sandbox can use modified configs, but typically uses sandbox flags instead
  economy: {
    baseArpu: 5.0,
    serverCostPer1kUsers: 10,
  },
  gacha: {
    defaultRates: {
      legendary: 0.05,
    },
    defaultPityCounter: 30,
  },
  reputation: {
    decayRate: 0,
    recoverySpeed: 1.0,
  },
  employee: {
    moraleDecayRate: 0,
    quitProbability: 0,
  },
  research: {
    costScaling: 1.0,
    durationScaling: 1.0,
    maxConcurrentResearch: 5,
    breakthroughChance: 0.2,
  },
};

// =============================================================================
// Full Config Bundle
// =============================================================================

export const DEFAULT_CONFIG_BUNDLE: ConfigBundle = {
  version: CURRENT_CONFIG_VERSION,
  lastModified: new Date().toISOString(),
  description: 'Complete game balance configuration bundle',
  base: DEFAULT_GAME_BALANCE_CONFIG,
  difficultyOverrides: {
    casual: CASUAL_OVERRIDES,
    standard: STANDARD_OVERRIDES,
    hardcore: HARDCORE_OVERRIDES,
    sandbox: SANDBOX_OVERRIDES,
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Deep merge two objects, with source overriding target
 */
export function deepMerge<T extends object>(target: T, source: DeepPartial<T>): T {
  const result = { ...target } as T;
  
  for (const key in source) {
    const sourceValue = source[key as keyof typeof source];
    const targetValue = target[key as keyof T];
    
    if (
      sourceValue !== undefined &&
      sourceValue !== null &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      (result as Record<string, unknown>)[key] = deepMerge(
        targetValue as object,
        sourceValue as DeepPartial<typeof targetValue>
      );
    } else if (sourceValue !== undefined) {
      (result as Record<string, unknown>)[key] = sourceValue;
    }
  }
  
  return result;
}

/**
 * Get configuration for a specific difficulty mode
 */
export function getConfigForDifficulty(
  difficulty: DifficultyMode,
  baseConfig: GameBalanceConfig = DEFAULT_GAME_BALANCE_CONFIG
): GameBalanceConfig {
  const overrides = DEFAULT_CONFIG_BUNDLE.difficultyOverrides[difficulty];
  
  return {
    economy: deepMerge(baseConfig.economy, overrides.economy ?? {}),
    gacha: deepMerge(baseConfig.gacha, overrides.gacha ?? {}),
    market: deepMerge(baseConfig.market, overrides.market ?? {}),
    reputation: deepMerge(baseConfig.reputation, overrides.reputation ?? {}),
    employee: deepMerge(baseConfig.employee, overrides.employee ?? {}),
    research: deepMerge(baseConfig.research, overrides.research ?? {}),
  };
}

/**
 * Create a frozen (immutable) copy of a config
 */
export function freezeConfig<T extends object>(config: T): Readonly<T> {
  return Object.freeze(
    Object.keys(config).reduce((acc, key) => {
      const value = config[key as keyof T];
      if (value !== null && typeof value === 'object') {
        (acc as Record<string, unknown>)[key] = freezeConfig(value as object);
      } else {
        (acc as Record<string, unknown>)[key] = value;
      }
      return acc;
    }, {} as T)
  );
}
