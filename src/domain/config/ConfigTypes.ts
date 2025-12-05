/**
 * Balance Configuration Types - Prompt 10.1
 * 
 * Typed configuration interfaces for game balance settings.
 * Supports versioning, validation, and per-difficulty overrides.
 */

import { DifficultyMode } from '../difficulty';

// =============================================================================
// Config Version
// =============================================================================

export interface ConfigVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

export function parseVersion(version: string): ConfigVersion {
  const parts = version.split('.').map(Number);
  return {
    major: parts[0] ?? 1,
    minor: parts[1] ?? 0,
    patch: parts[2] ?? 0,
  };
}

export function stringifyVersion(version: ConfigVersion): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}

export function isVersionCompatible(
  current: ConfigVersion,
  required: ConfigVersion
): boolean {
  // Major version must match
  if (current.major !== required.major) return false;
  // Current minor must be >= required
  if (current.minor < required.minor) return false;
  return true;
}

// =============================================================================
// Base Config Interface
// =============================================================================

export interface BaseConfig {
  readonly version: string;
  readonly lastModified: string;
  readonly description?: string;
}

// =============================================================================
// Economy Configuration
// =============================================================================

export interface EconomyConfig extends BaseConfig {
  readonly baseArpu: number;                    // Base Average Revenue Per User
  readonly monetizationMultipliers: {
    readonly generous: { arpu: number; retention: number };
    readonly balanced: { arpu: number; retention: number };
    readonly aggressive: { arpu: number; retention: number };
    readonly predatory: { arpu: number; retention: number };
  };
  readonly qualityArpuScale: number;           // 0-1, quality bonus to ARPU
  readonly updateFrequencyBonus: {
    readonly weekly: number;
    readonly biweekly: number;
    readonly monthly: number;
    readonly sporadic: number;
    readonly none: number;
  };
  readonly maxSaturationPenalty: number;       // Max revenue reduction from saturation
  readonly advertisementRevenueRate: number;   // % of base from ads
  readonly merchandiseRevenueRate: number;     // % from merchandise
  readonly licensingBaseRate: number;          // Base % from licensing
  readonly serverCostPer1kUsers: number;       // $ per 1000 DAU/month
  readonly marketingEfficiency: number;        // Players acquired per $ spent
  readonly developmentCostMultiplier: number;  // Overhead on direct costs
}

// =============================================================================
// Gacha Rates Configuration
// =============================================================================

export interface GachaRateValues {
  readonly common: number;
  readonly uncommon: number;
  readonly rare: number;
  readonly epic: number;
  readonly legendary: number;
}

export interface GachaRatesConfig extends BaseConfig {
  readonly defaultRates: GachaRateValues;
  readonly rateUpMultiplier: number;          // Featured item rate boost
  readonly defaultPityCounter: number;        // Pulls until guaranteed
  readonly softPityStart: number;             // When rates start increasing
  readonly softPityIncrement: number;         // Rate increase per pull after soft pity
  readonly pullCost: {
    readonly gems: number;
    readonly tickets: number;
  };
  readonly duplicateCurrency: {
    readonly common: number;
    readonly uncommon: number;
    readonly rare: number;
    readonly epic: number;
    readonly legendary: number;
  };
}

// =============================================================================
// Market Configuration
// =============================================================================

export interface PlayerSegmentConfig {
  readonly spendingPower: number;
  readonly retentionRate: number;
  readonly gachaAppetite: number;
  readonly qualitySensitivity: number;
  readonly populationPercent: number;
}

export interface MarketConfig extends BaseConfig {
  readonly totalMarketSize: number;
  readonly playerSegments: {
    readonly whale: PlayerSegmentConfig;
    readonly dolphin: PlayerSegmentConfig;
    readonly minnow: PlayerSegmentConfig;
    readonly freeToPlay: PlayerSegmentConfig;
  };
  readonly genrePopularityBase: {
    readonly rpg: number;
    readonly strategy: number;
    readonly puzzle: number;
    readonly idle: number;
    readonly simulation: number;
    readonly card: number;
  };
  readonly competitorStrength: {
    readonly weak: number;
    readonly moderate: number;
    readonly strong: number;
    readonly dominant: number;
  };
  readonly seasonalMultipliers: {
    readonly holiday: number;
    readonly summer: number;
    readonly normal: number;
    readonly offSeason: number;
  };
  readonly marketEventChance: number;         // Probability of market events
  readonly trendVolatility: number;           // How quickly trends change
}

// =============================================================================
// Reputation Configuration
// =============================================================================

export interface ReputationConfig extends BaseConfig {
  readonly initialReputation: number;
  readonly maxReputation: number;
  readonly minReputation: number;
  readonly decayRate: number;                  // Natural decay per tick
  readonly gainMultipliers: {
    readonly qualityRelease: number;
    readonly communityEngagement: number;
    readonly bugFix: number;
    readonly contentUpdate: number;
    readonly eventSuccess: number;
  };
  readonly lossMultipliers: {
    readonly serverOutage: number;
    readonly buggyRelease: number;
    readonly controversy: number;
    readonly poorMonetization: number;
    readonly dataLeak: number;
  };
  readonly thresholds: {
    readonly excellent: number;
    readonly good: number;
    readonly neutral: number;
    readonly poor: number;
    readonly terrible: number;
  };
  readonly recoverySpeed: number;             // How fast negative rep recovers
}

// =============================================================================
// Employee Configuration
// =============================================================================

export interface EmployeeSkillRange {
  readonly min: number;
  readonly max: number;
}

export interface EmployeeConfig extends BaseConfig {
  readonly baseSalary: {
    readonly junior: number;
    readonly mid: number;
    readonly senior: number;
    readonly lead: number;
  };
  readonly salaryGrowthRate: number;          // Annual salary increase %
  readonly skillRanges: {
    readonly junior: EmployeeSkillRange;
    readonly mid: EmployeeSkillRange;
    readonly senior: EmployeeSkillRange;
    readonly lead: EmployeeSkillRange;
  };
  readonly skillGrowthRate: number;           // Skill improvement per tick
  readonly moraleDecayRate: number;           // Natural morale decay
  readonly moraleRecoveryRate: number;        // Recovery when conditions improve
  readonly quitThreshold: number;             // Morale level that triggers quit risk
  readonly quitProbability: number;           // Chance to quit when below threshold
  readonly trainingCostMultiplier: number;    // Cost of training relative to salary
  readonly maxEmployees: number;              // Company employee cap
}

// =============================================================================
// Research Configuration
// =============================================================================

export interface ResearchConfig extends BaseConfig {
  readonly baseCost: number;
  readonly costScaling: number;               // How cost increases per tier
  readonly baseDuration: number;              // Ticks for basic research
  readonly durationScaling: number;           // How duration increases per tier
  readonly maxConcurrentResearch: number;     // Parallel research limit
  readonly breakthroughChance: number;        // Chance for 2x effect
  readonly categoryBonuses: {
    readonly development: number;
    readonly monetization: number;
    readonly marketing: number;
    readonly operations: number;
    readonly innovation: number;
  };
}

// =============================================================================
// Combined Game Configuration
// =============================================================================

export interface GameBalanceConfig {
  readonly economy: EconomyConfig;
  readonly gacha: GachaRatesConfig;
  readonly market: MarketConfig;
  readonly reputation: ReputationConfig;
  readonly employee: EmployeeConfig;
  readonly research: ResearchConfig;
}

// =============================================================================
// Difficulty Override Configuration
// =============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface DifficultyOverrides {
  readonly difficulty: DifficultyMode;
  readonly overrides: DeepPartial<GameBalanceConfig>;
}

// =============================================================================
// Full Configuration Bundle
// =============================================================================

export interface ConfigBundle extends BaseConfig {
  readonly base: GameBalanceConfig;
  readonly difficultyOverrides: Record<DifficultyMode, DeepPartial<GameBalanceConfig>>;
}

// =============================================================================
// Config Validation Result
// =============================================================================

export interface ConfigValidationError {
  readonly path: string;
  readonly message: string;
  readonly expectedType?: string;
  readonly receivedValue?: unknown;
}

export interface ConfigValidationResult {
  readonly isValid: boolean;
  readonly errors: ConfigValidationError[];
  readonly warnings: string[];
}
