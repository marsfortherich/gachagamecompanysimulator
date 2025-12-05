/**
 * Configuration Validator - Prompt 10.1
 * 
 * Validation schemas and functions for game balance configurations.
 * Detects invalid values, missing fields, and potential balance issues.
 */

import {
  ConfigBundle,
  GameBalanceConfig,
  EconomyConfig,
  GachaRatesConfig,
  MarketConfig,
  ReputationConfig,
  EmployeeConfig,
  ResearchConfig,
  ConfigValidationResult,
  ConfigValidationError,
} from '../../domain/config/ConfigTypes';

// =============================================================================
// Validation Schema Types
// =============================================================================

interface NumberRange {
  min?: number;
  max?: number;
}

// =============================================================================
// Base Validators
// =============================================================================

function validateNumber(
  value: unknown,
  path: string,
  range?: NumberRange
): ConfigValidationError[] {
  if (typeof value !== 'number' || isNaN(value)) {
    return [{
      path,
      message: `Expected number, got ${typeof value}`,
      expectedType: 'number',
      receivedValue: value,
    }];
  }

  const errors: ConfigValidationError[] = [];

  if (range?.min !== undefined && value < range.min) {
    errors.push({
      path,
      message: `Value ${value} is below minimum ${range.min}`,
      receivedValue: value,
    });
  }

  if (range?.max !== undefined && value > range.max) {
    errors.push({
      path,
      message: `Value ${value} is above maximum ${range.max}`,
      receivedValue: value,
    });
  }

  return errors;
}

function validateString(
  value: unknown,
  path: string,
  required = true
): ConfigValidationError[] {
  if (value === undefined || value === null) {
    if (required) {
      return [{
        path,
        message: 'Required string is missing',
        expectedType: 'string',
        receivedValue: value,
      }];
    }
    return [];
  }

  if (typeof value !== 'string') {
    return [{
      path,
      message: `Expected string, got ${typeof value}`,
      expectedType: 'string',
      receivedValue: value,
    }];
  }

  return [];
}

function validateObject(
  value: unknown,
  path: string
): ConfigValidationError[] {
  if (value === null || value === undefined || typeof value !== 'object') {
    return [{
      path,
      message: `Expected object, got ${typeof value}`,
      expectedType: 'object',
      receivedValue: value,
    }];
  }
  return [];
}

// =============================================================================
// Economy Config Validator
// =============================================================================

function validateEconomyConfig(
  config: EconomyConfig,
  path: string
): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];
  const p = (field: string) => `${path}.${field}`;

  errors.push(...validateString(config.version, p('version')));
  errors.push(...validateNumber(config.baseArpu, p('baseArpu'), { min: 0.1, max: 100 }));
  errors.push(...validateNumber(config.qualityArpuScale, p('qualityArpuScale'), { min: 0, max: 2 }));
  errors.push(...validateNumber(config.maxSaturationPenalty, p('maxSaturationPenalty'), { min: 0, max: 1 }));
  errors.push(...validateNumber(config.advertisementRevenueRate, p('advertisementRevenueRate'), { min: 0, max: 1 }));
  errors.push(...validateNumber(config.merchandiseRevenueRate, p('merchandiseRevenueRate'), { min: 0, max: 1 }));
  errors.push(...validateNumber(config.licensingBaseRate, p('licensingBaseRate'), { min: 0, max: 1 }));
  errors.push(...validateNumber(config.serverCostPer1kUsers, p('serverCostPer1kUsers'), { min: 1, max: 1000 }));
  errors.push(...validateNumber(config.marketingEfficiency, p('marketingEfficiency'), { min: 0.00001, max: 0.01 }));
  errors.push(...validateNumber(config.developmentCostMultiplier, p('developmentCostMultiplier'), { min: 0.5, max: 5 }));

  // Validate monetization multipliers
  const monPath = p('monetizationMultipliers');
  const strategies = ['generous', 'balanced', 'aggressive', 'predatory'] as const;
  for (const strategy of strategies) {
    const mult = config.monetizationMultipliers[strategy];
    if (mult) {
      errors.push(...validateNumber(mult.arpu, `${monPath}.${strategy}.arpu`, { min: 0.1, max: 10 }));
      errors.push(...validateNumber(mult.retention, `${monPath}.${strategy}.retention`, { min: 0.1, max: 2 }));
    }
  }

  // Validate update frequency bonus
  const freqPath = p('updateFrequencyBonus');
  const frequencies = ['weekly', 'biweekly', 'monthly', 'sporadic', 'none'] as const;
  for (const freq of frequencies) {
    const bonus = config.updateFrequencyBonus[freq];
    errors.push(...validateNumber(bonus, `${freqPath}.${freq}`, { min: 0.1, max: 2 }));
  }

  return errors;
}

// =============================================================================
// Gacha Rates Config Validator
// =============================================================================

function validateGachaRatesConfig(
  config: GachaRatesConfig,
  path: string
): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];
  const p = (field: string) => `${path}.${field}`;

  errors.push(...validateString(config.version, p('version')));
  errors.push(...validateNumber(config.rateUpMultiplier, p('rateUpMultiplier'), { min: 1, max: 10 }));
  errors.push(...validateNumber(config.defaultPityCounter, p('defaultPityCounter'), { min: 10, max: 500 }));
  errors.push(...validateNumber(config.softPityStart, p('softPityStart'), { min: 1, max: 400 }));
  errors.push(...validateNumber(config.softPityIncrement, p('softPityIncrement'), { min: 0.001, max: 0.5 }));

  // Validate rates
  const ratesPath = p('defaultRates');
  const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
  let totalRate = 0;
  for (const rarity of rarities) {
    const rate = config.defaultRates[rarity];
    errors.push(...validateNumber(rate, `${ratesPath}.${rarity}`, { min: 0.001, max: 1 }));
    totalRate += rate;
  }

  // Rates should sum to approximately 1
  if (Math.abs(totalRate - 1) > 0.01) {
    errors.push({
      path: ratesPath,
      message: `Gacha rates should sum to 1.0, got ${totalRate.toFixed(3)}`,
      receivedValue: totalRate,
    });
  }

  // Soft pity should be less than pity counter
  if (config.softPityStart >= config.defaultPityCounter) {
    errors.push({
      path: p('softPityStart'),
      message: `Soft pity (${config.softPityStart}) should be less than pity counter (${config.defaultPityCounter})`,
      receivedValue: config.softPityStart,
    });
  }

  return errors;
}

// =============================================================================
// Market Config Validator
// =============================================================================

function validateMarketConfig(
  config: MarketConfig,
  path: string
): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];
  const p = (field: string) => `${path}.${field}`;

  errors.push(...validateString(config.version, p('version')));
  errors.push(...validateNumber(config.totalMarketSize, p('totalMarketSize'), { min: 1000, max: 1_000_000_000 }));
  errors.push(...validateNumber(config.marketEventChance, p('marketEventChance'), { min: 0, max: 1 }));
  errors.push(...validateNumber(config.trendVolatility, p('trendVolatility'), { min: 0, max: 1 }));

  // Validate player segments
  const segPath = p('playerSegments');
  const segments = ['whale', 'dolphin', 'minnow', 'freeToPlay'] as const;
  let totalPopulation = 0;

  for (const segment of segments) {
    const seg = config.playerSegments[segment];
    if (seg) {
      const sp = `${segPath}.${segment}`;
      errors.push(...validateNumber(seg.spendingPower, `${sp}.spendingPower`, { min: 0, max: 10000 }));
      errors.push(...validateNumber(seg.retentionRate, `${sp}.retentionRate`, { min: 0, max: 1 }));
      errors.push(...validateNumber(seg.gachaAppetite, `${sp}.gachaAppetite`, { min: 0, max: 1 }));
      errors.push(...validateNumber(seg.qualitySensitivity, `${sp}.qualitySensitivity`, { min: 0, max: 1 }));
      errors.push(...validateNumber(seg.populationPercent, `${sp}.populationPercent`, { min: 0, max: 100 }));
      totalPopulation += seg.populationPercent;
    }
  }

  // Population percentages should sum to approximately 100
  if (Math.abs(totalPopulation - 100) > 1) {
    errors.push({
      path: segPath,
      message: `Player segment populations should sum to 100%, got ${totalPopulation}%`,
      receivedValue: totalPopulation,
    });
  }

  return errors;
}

// =============================================================================
// Reputation Config Validator
// =============================================================================

function validateReputationConfig(
  config: ReputationConfig,
  path: string
): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];
  const p = (field: string) => `${path}.${field}`;

  errors.push(...validateString(config.version, p('version')));
  errors.push(...validateNumber(config.initialReputation, p('initialReputation'), { min: 0, max: 100 }));
  errors.push(...validateNumber(config.maxReputation, p('maxReputation'), { min: 1, max: 100 }));
  errors.push(...validateNumber(config.minReputation, p('minReputation'), { min: 0, max: 50 }));
  errors.push(...validateNumber(config.decayRate, p('decayRate'), { min: 0, max: 1 }));
  errors.push(...validateNumber(config.recoverySpeed, p('recoverySpeed'), { min: 0, max: 2 }));

  // Validate thresholds are in descending order
  const thresholds = config.thresholds;
  if (thresholds.excellent <= thresholds.good) {
    errors.push({
      path: p('thresholds.excellent'),
      message: 'Excellent threshold should be greater than good',
      receivedValue: thresholds.excellent,
    });
  }
  if (thresholds.good <= thresholds.neutral) {
    errors.push({
      path: p('thresholds.good'),
      message: 'Good threshold should be greater than neutral',
      receivedValue: thresholds.good,
    });
  }

  // Initial reputation should be within bounds
  if (config.initialReputation < config.minReputation || config.initialReputation > config.maxReputation) {
    errors.push({
      path: p('initialReputation'),
      message: `Initial reputation ${config.initialReputation} should be between ${config.minReputation} and ${config.maxReputation}`,
      receivedValue: config.initialReputation,
    });
  }

  return errors;
}

// =============================================================================
// Employee Config Validator
// =============================================================================

function validateEmployeeConfig(
  config: EmployeeConfig,
  path: string
): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];
  const p = (field: string) => `${path}.${field}`;

  errors.push(...validateString(config.version, p('version')));
  errors.push(...validateNumber(config.salaryGrowthRate, p('salaryGrowthRate'), { min: 0, max: 0.5 }));
  errors.push(...validateNumber(config.skillGrowthRate, p('skillGrowthRate'), { min: 0, max: 1 }));
  errors.push(...validateNumber(config.moraleDecayRate, p('moraleDecayRate'), { min: 0, max: 0.5 }));
  errors.push(...validateNumber(config.moraleRecoveryRate, p('moraleRecoveryRate'), { min: 0, max: 0.5 }));
  errors.push(...validateNumber(config.quitThreshold, p('quitThreshold'), { min: 0, max: 50 }));
  errors.push(...validateNumber(config.quitProbability, p('quitProbability'), { min: 0, max: 1 }));
  errors.push(...validateNumber(config.trainingCostMultiplier, p('trainingCostMultiplier'), { min: 0, max: 2 }));
  errors.push(...validateNumber(config.maxEmployees, p('maxEmployees'), { min: 1, max: 1000 }));

  // Validate salary tiers are in ascending order
  const salaries = config.baseSalary;
  if (salaries.junior >= salaries.mid) {
    errors.push({
      path: p('baseSalary.junior'),
      message: 'Junior salary should be less than mid salary',
      receivedValue: salaries.junior,
    });
  }
  if (salaries.mid >= salaries.senior) {
    errors.push({
      path: p('baseSalary.mid'),
      message: 'Mid salary should be less than senior salary',
      receivedValue: salaries.mid,
    });
  }

  // Validate skill ranges don't overlap incorrectly
  const skills = config.skillRanges;
  if (skills.junior.max > skills.mid.max) {
    errors.push({
      path: p('skillRanges.junior.max'),
      message: 'Junior max skill should not exceed mid max skill',
      receivedValue: skills.junior.max,
    });
  }

  return errors;
}

// =============================================================================
// Research Config Validator
// =============================================================================

function validateResearchConfig(
  config: ResearchConfig,
  path: string
): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];
  const p = (field: string) => `${path}.${field}`;

  errors.push(...validateString(config.version, p('version')));
  errors.push(...validateNumber(config.baseCost, p('baseCost'), { min: 100, max: 1_000_000 }));
  errors.push(...validateNumber(config.costScaling, p('costScaling'), { min: 1, max: 5 }));
  errors.push(...validateNumber(config.baseDuration, p('baseDuration'), { min: 1, max: 365 }));
  errors.push(...validateNumber(config.durationScaling, p('durationScaling'), { min: 1, max: 5 }));
  errors.push(...validateNumber(config.maxConcurrentResearch, p('maxConcurrentResearch'), { min: 1, max: 10 }));
  errors.push(...validateNumber(config.breakthroughChance, p('breakthroughChance'), { min: 0, max: 1 }));

  // Validate category bonuses
  const categories = ['development', 'monetization', 'marketing', 'operations', 'innovation'] as const;
  for (const cat of categories) {
    const bonus = config.categoryBonuses[cat];
    errors.push(...validateNumber(bonus, `${p('categoryBonuses')}.${cat}`, { min: 0, max: 1 }));
  }

  return errors;
}

// =============================================================================
// Game Balance Config Validator
// =============================================================================

function validateGameBalanceConfig(
  config: GameBalanceConfig,
  path: string
): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];

  errors.push(...validateObject(config.economy, `${path}.economy`));
  if (config.economy) {
    errors.push(...validateEconomyConfig(config.economy, `${path}.economy`));
  }

  errors.push(...validateObject(config.gacha, `${path}.gacha`));
  if (config.gacha) {
    errors.push(...validateGachaRatesConfig(config.gacha, `${path}.gacha`));
  }

  errors.push(...validateObject(config.market, `${path}.market`));
  if (config.market) {
    errors.push(...validateMarketConfig(config.market, `${path}.market`));
  }

  errors.push(...validateObject(config.reputation, `${path}.reputation`));
  if (config.reputation) {
    errors.push(...validateReputationConfig(config.reputation, `${path}.reputation`));
  }

  errors.push(...validateObject(config.employee, `${path}.employee`));
  if (config.employee) {
    errors.push(...validateEmployeeConfig(config.employee, `${path}.employee`));
  }

  errors.push(...validateObject(config.research, `${path}.research`));
  if (config.research) {
    errors.push(...validateResearchConfig(config.research, `${path}.research`));
  }

  return errors;
}

// =============================================================================
// Config Bundle Validator
// =============================================================================

export function validateConfigBundle(bundle: ConfigBundle): ConfigValidationResult {
  const errors: ConfigValidationError[] = [];
  const warnings: string[] = [];

  // Validate base config
  errors.push(...validateString(bundle.version, 'version'));
  errors.push(...validateObject(bundle.base, 'base'));
  
  if (bundle.base) {
    errors.push(...validateGameBalanceConfig(bundle.base, 'base'));
  }

  // Validate difficulty overrides (partial validation - only check provided values)
  if (bundle.difficultyOverrides) {
    const difficulties = ['casual', 'standard', 'hardcore', 'sandbox'] as const;
    for (const diff of difficulties) {
      const overrides = bundle.difficultyOverrides[diff];
      if (overrides && Object.keys(overrides).length > 0) {
        // Partial config validation could be added here if needed
        // For now, we just warn about large deviations
        warnings.push(`Difficulty override present for ${diff}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// Regression Testing Helper
// =============================================================================

export interface BalanceCheckResult {
  readonly passed: boolean;
  readonly issues: string[];
}

/**
 * Check for potential balance issues in the config
 */
export function checkBalanceRegression(
  current: GameBalanceConfig,
  previous: GameBalanceConfig
): BalanceCheckResult {
  const issues: string[] = [];

  // Check for significant economy changes
  const arpuChange = Math.abs(current.economy.baseArpu - previous.economy.baseArpu) / previous.economy.baseArpu;
  if (arpuChange > 0.2) {
    issues.push(`ARPU changed by ${(arpuChange * 100).toFixed(1)}% (was ${previous.economy.baseArpu}, now ${current.economy.baseArpu})`);
  }

  // Check for gacha rate changes
  const prevLegendary = previous.gacha.defaultRates.legendary;
  const currLegendary = current.gacha.defaultRates.legendary;
  if (Math.abs(currLegendary - prevLegendary) / prevLegendary > 0.25) {
    issues.push(`Legendary rate changed significantly (was ${prevLegendary}, now ${currLegendary})`);
  }

  // Check for employee cost changes
  const prevSenior = previous.employee.baseSalary.senior;
  const currSenior = current.employee.baseSalary.senior;
  if (Math.abs(currSenior - prevSenior) / prevSenior > 0.3) {
    issues.push(`Senior salary changed by more than 30% (was ${prevSenior}, now ${currSenior})`);
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}
