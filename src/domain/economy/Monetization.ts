/**
 * Free-to-Play Monetization System
 * 
 * Implements various F2P monetization strategies beyond gacha,
 * including subscriptions, battle passes, and cosmetic shops.
 */

import { EntityId, generateId } from '../shared';

/**
 * Types of F2P monetization strategies
 */
export type MonetizationStrategy =
  | 'gacha'               // Gacha/loot boxes (existing)
  | 'monthly_pass'        // Monthly subscription
  | 'battle_pass'         // Seasonal battle pass with tiers
  | 'ad_free'             // One-time ad removal
  | 'cosmetic_shop'       // Direct purchase cosmetics
  | 'starter_pack'        // One-time starter bundle
  | 'vip_subscription'    // Premium VIP membership
  | 'energy_system';      // Stamina/energy purchases

/**
 * Configuration for each monetization strategy
 */
export interface MonetizationStrategyConfig {
  readonly strategy: MonetizationStrategy;
  readonly name: string;
  readonly description: string;
  readonly implementationCost: number;       // One-time cost to add
  readonly maintenanceCost: number;          // Monthly maintenance
  readonly conversionRate: number;           // % of DAU that converts
  readonly revenuePerConversion: number;     // $ per converting player
  readonly isRecurring: boolean;             // Monthly vs one-time
  readonly satisfactionImpact: number;       // Impact on satisfaction
  readonly setupDays: number;                // Days to implement
}

export const MONETIZATION_CONFIGS: Record<MonetizationStrategy, MonetizationStrategyConfig> = {
  gacha: {
    strategy: 'gacha',
    name: 'Gacha System',
    description: 'Random character/item pulls with premium currency.',
    implementationCost: 0,  // Comes with game
    maintenanceCost: 0,
    conversionRate: 0.05,   // 5% of players spend on gacha
    revenuePerConversion: 15,
    isRecurring: true,
    satisfactionImpact: -2,
    setupDays: 0,
  },
  monthly_pass: {
    strategy: 'monthly_pass',
    name: 'Monthly Pass',
    description: '$4.99/month subscription with daily rewards.',
    implementationCost: 8000,
    maintenanceCost: 500,
    conversionRate: 0.08,   // 8% of players subscribe
    revenuePerConversion: 4.99,
    isRecurring: true,
    satisfactionImpact: 1,  // Players like value
    setupDays: 7,
  },
  battle_pass: {
    strategy: 'battle_pass',
    name: 'Battle Pass',
    description: 'Seasonal pass with free and premium reward tracks.',
    implementationCost: 15000,
    maintenanceCost: 2000,  // Content creation each season
    conversionRate: 0.12,   // 12% buy battle pass
    revenuePerConversion: 9.99,
    isRecurring: true,      // Each season
    satisfactionImpact: 3,  // Players love battle passes
    setupDays: 14,
  },
  ad_free: {
    strategy: 'ad_free',
    name: 'Ad-Free Package',
    description: 'One-time purchase to remove all advertisements.',
    implementationCost: 3000,
    maintenanceCost: 0,
    conversionRate: 0.02,   // 2% of players (requires ads enabled)
    revenuePerConversion: 4.99,
    isRecurring: false,
    satisfactionImpact: 0,  // Neutral for paying players
    setupDays: 3,
  },
  cosmetic_shop: {
    strategy: 'cosmetic_shop',
    name: 'Cosmetic Shop',
    description: 'Direct purchase skins, effects, and customization.',
    implementationCost: 12000,
    maintenanceCost: 1500,  // New content needed
    conversionRate: 0.15,   // 15% buy at least one cosmetic
    revenuePerConversion: 3.50,
    isRecurring: true,      // Players buy over time
    satisfactionImpact: 2,  // Optional cosmetics are liked
    setupDays: 10,
  },
  starter_pack: {
    strategy: 'starter_pack',
    name: 'Starter Pack',
    description: 'One-time discounted bundle for new players.',
    implementationCost: 5000,
    maintenanceCost: 0,
    conversionRate: 0.25,   // 25% of new players buy
    revenuePerConversion: 2.99,
    isRecurring: false,
    satisfactionImpact: 2,  // Good value perception
    setupDays: 5,
  },
  vip_subscription: {
    strategy: 'vip_subscription',
    name: 'VIP Subscription',
    description: '$14.99/month VIP with exclusive perks.',
    implementationCost: 20000,
    maintenanceCost: 1000,
    conversionRate: 0.02,   // 2% of players (whales)
    revenuePerConversion: 14.99,
    isRecurring: true,
    satisfactionImpact: 0,  // Neutral - premium for whales
    setupDays: 14,
  },
  energy_system: {
    strategy: 'energy_system',
    name: 'Energy/Stamina System',
    description: 'Limited play sessions with paid refills.',
    implementationCost: 10000,
    maintenanceCost: 500,
    conversionRate: 0.10,   // 10% buy energy
    revenuePerConversion: 2.00,
    isRecurring: true,
    satisfactionImpact: -5, // Players hate energy systems
    setupDays: 7,
  },
};

/**
 * Active monetization setup for a game
 */
export interface GameMonetizationSetup {
  readonly gameId: EntityId;
  readonly enabledStrategies: Set<MonetizationStrategy>;
  readonly strategyLevels: Record<MonetizationStrategy, MonetizationLevel>;
  readonly battlePassSeason: number;
  readonly battlePassDaysRemaining: number;
  readonly totalRevenueByStrategy: Record<MonetizationStrategy, number>;
}

/**
 * Level/tier for monetization strategies
 * Higher levels = better implementation = higher conversion
 */
export type MonetizationLevel = 1 | 2 | 3;

export interface MonetizationLevelConfig {
  readonly level: MonetizationLevel;
  readonly name: string;
  readonly conversionMultiplier: number;
  readonly satisfactionModifier: number;
  readonly upgradeCost: number;
}

export const MONETIZATION_LEVELS: Record<MonetizationLevel, MonetizationLevelConfig> = {
  1: {
    level: 1,
    name: 'Basic',
    conversionMultiplier: 1.0,
    satisfactionModifier: 0,
    upgradeCost: 0,
  },
  2: {
    level: 2,
    name: 'Enhanced',
    conversionMultiplier: 1.3,
    satisfactionModifier: 1,
    upgradeCost: 25000,
  },
  3: {
    level: 3,
    name: 'Premium',
    conversionMultiplier: 1.6,
    satisfactionModifier: 2,
    upgradeCost: 75000,
  },
};

/**
 * Create default monetization setup (gacha only)
 */
export function createDefaultMonetizationSetup(gameId: EntityId): GameMonetizationSetup {
  const defaultLevels: Record<MonetizationStrategy, MonetizationLevel> = {
    gacha: 1,
    monthly_pass: 1,
    battle_pass: 1,
    ad_free: 1,
    cosmetic_shop: 1,
    starter_pack: 1,
    vip_subscription: 1,
    energy_system: 1,
  };
  
  const defaultRevenue: Record<MonetizationStrategy, number> = {
    gacha: 0,
    monthly_pass: 0,
    battle_pass: 0,
    ad_free: 0,
    cosmetic_shop: 0,
    starter_pack: 0,
    vip_subscription: 0,
    energy_system: 0,
  };
  
  return {
    gameId,
    enabledStrategies: new Set(['gacha']),
    strategyLevels: defaultLevels,
    battlePassSeason: 0,
    battlePassDaysRemaining: 0,
    totalRevenueByStrategy: defaultRevenue,
  };
}

/**
 * Pending monetization implementation
 */
export interface MonetizationImplementation {
  readonly id: EntityId;
  readonly gameId: EntityId;
  readonly strategy: MonetizationStrategy;
  readonly startTick: number;
  readonly endTick: number;
  readonly progress: number;
}

/**
 * Enable a new monetization strategy
 */
export function startMonetizationImplementation(
  gameId: EntityId,
  strategy: MonetizationStrategy,
  currentTick: number
): MonetizationImplementation {
  const config = MONETIZATION_CONFIGS[strategy];
  
  return {
    id: generateId(),
    gameId,
    strategy,
    startTick: currentTick,
    endTick: currentTick + config.setupDays,
    progress: 0,
  };
}

/**
 * Complete monetization implementation
 */
export function completeMonetizationImplementation(
  setup: GameMonetizationSetup,
  strategy: MonetizationStrategy
): GameMonetizationSetup {
  const newEnabledStrategies = new Set(setup.enabledStrategies);
  newEnabledStrategies.add(strategy);
  
  // Start battle pass if it's the battle pass
  let battlePassDays = setup.battlePassDaysRemaining;
  let battlePassSeason = setup.battlePassSeason;
  if (strategy === 'battle_pass') {
    battlePassSeason = 1;
    battlePassDays = 60; // 60 day seasons
  }
  
  return {
    ...setup,
    enabledStrategies: newEnabledStrategies,
    battlePassSeason,
    battlePassDaysRemaining: battlePassDays,
  };
}

/**
 * Upgrade a monetization strategy level
 */
export function upgradeMonetizationLevel(
  setup: GameMonetizationSetup,
  strategy: MonetizationStrategy
): GameMonetizationSetup {
  const currentLevel = setup.strategyLevels[strategy];
  if (currentLevel >= 3) return setup;
  
  const newLevel = (currentLevel + 1) as MonetizationLevel;
  
  return {
    ...setup,
    strategyLevels: {
      ...setup.strategyLevels,
      [strategy]: newLevel,
    },
  };
}

/**
 * Calculate daily monetization revenue
 */
export function calculateDailyMonetizationRevenue(
  setup: GameMonetizationSetup,
  dau: number,
  newPlayersToday: number
): { totalRevenue: number; revenueByStrategy: Record<MonetizationStrategy, number>; satisfactionChange: number } {
  const revenueByStrategy: Record<MonetizationStrategy, number> = {
    gacha: 0,
    monthly_pass: 0,
    battle_pass: 0,
    ad_free: 0,
    cosmetic_shop: 0,
    starter_pack: 0,
    vip_subscription: 0,
    energy_system: 0,
  };
  
  let totalRevenue = 0;
  let totalSatisfactionChange = 0;
  
  for (const strategy of setup.enabledStrategies) {
    const config = MONETIZATION_CONFIGS[strategy];
    const level = setup.strategyLevels[strategy];
    const levelConfig = MONETIZATION_LEVELS[level];
    
    // Calculate conversions
    const effectiveConversionRate = config.conversionRate * levelConfig.conversionMultiplier;
    
    let dailyRevenue: number;
    if (config.isRecurring) {
      // Recurring revenue: fraction of DAU converts each day
      // Divide by 30 to get daily portion of monthly conversions
      const dailyConversions = (dau * effectiveConversionRate) / 30;
      dailyRevenue = dailyConversions * config.revenuePerConversion;
    } else {
      // One-time revenue: only new players can convert
      const conversions = newPlayersToday * effectiveConversionRate;
      dailyRevenue = conversions * config.revenuePerConversion;
    }
    
    revenueByStrategy[strategy] = Math.round(dailyRevenue * 100) / 100;
    totalRevenue += dailyRevenue;
    
    // Satisfaction impact
    const satisfactionChange = config.satisfactionImpact + levelConfig.satisfactionModifier;
    totalSatisfactionChange += satisfactionChange / 30; // Daily portion
  }
  
  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    revenueByStrategy,
    satisfactionChange: totalSatisfactionChange,
  };
}

/**
 * Process battle pass season tick
 */
export function processBattlePassTick(
  setup: GameMonetizationSetup
): GameMonetizationSetup {
  if (!setup.enabledStrategies.has('battle_pass')) return setup;
  if (setup.battlePassDaysRemaining <= 0) {
    // Start new season
    return {
      ...setup,
      battlePassSeason: setup.battlePassSeason + 1,
      battlePassDaysRemaining: 60, // New 60-day season
    };
  }
  
  return {
    ...setup,
    battlePassDaysRemaining: setup.battlePassDaysRemaining - 1,
  };
}

/**
 * Calculate total monthly maintenance cost
 */
export function calculateMonthlyMaintenanceCost(
  setup: GameMonetizationSetup
): number {
  let totalCost = 0;
  
  for (const strategy of setup.enabledStrategies) {
    totalCost += MONETIZATION_CONFIGS[strategy].maintenanceCost;
  }
  
  return totalCost;
}

/**
 * Get available strategies to implement
 */
export function getAvailableStrategies(
  setup: GameMonetizationSetup
): MonetizationStrategy[] {
  const allStrategies: MonetizationStrategy[] = [
    'gacha', 'monthly_pass', 'battle_pass', 'ad_free',
    'cosmetic_shop', 'starter_pack', 'vip_subscription', 'energy_system'
  ];
  
  return allStrategies.filter(s => !setup.enabledStrategies.has(s));
}

/**
 * Calculate implementation cost for a strategy
 */
export function getImplementationCost(strategy: MonetizationStrategy): number {
  return MONETIZATION_CONFIGS[strategy].implementationCost;
}

/**
 * Get upgrade cost for a strategy
 */
export function getUpgradeCost(
  setup: GameMonetizationSetup,
  strategy: MonetizationStrategy
): number {
  const currentLevel = setup.strategyLevels[strategy];
  if (currentLevel >= 3) return 0;
  
  const nextLevel = (currentLevel + 1) as MonetizationLevel;
  return MONETIZATION_LEVELS[nextLevel].upgradeCost;
}

/**
 * Summary of monetization performance
 */
export interface MonetizationSummary {
  readonly totalMonthlyRevenue: number;
  readonly revenueByStrategy: Record<MonetizationStrategy, number>;
  readonly activeStrategies: number;
  readonly avgConversionRate: number;
  readonly satisfactionImpact: number;
}

/**
 * Calculate monthly monetization summary
 */
export function calculateMonetizationSummary(
  setup: GameMonetizationSetup,
  avgDau: number
): MonetizationSummary {
  let totalRevenue = 0;
  let totalSatisfactionImpact = 0;
  let totalConversionRate = 0;
  
  const revenueByStrategy: Record<MonetizationStrategy, number> = {
    gacha: 0,
    monthly_pass: 0,
    battle_pass: 0,
    ad_free: 0,
    cosmetic_shop: 0,
    starter_pack: 0,
    vip_subscription: 0,
    energy_system: 0,
  };
  
  for (const strategy of setup.enabledStrategies) {
    const config = MONETIZATION_CONFIGS[strategy];
    const level = setup.strategyLevels[strategy];
    const levelConfig = MONETIZATION_LEVELS[level];
    
    const effectiveConversion = config.conversionRate * levelConfig.conversionMultiplier;
    const monthlyConversions = avgDau * effectiveConversion;
    const monthlyRevenue = monthlyConversions * config.revenuePerConversion;
    
    revenueByStrategy[strategy] = Math.round(monthlyRevenue);
    totalRevenue += monthlyRevenue;
    totalConversionRate += effectiveConversion;
    totalSatisfactionImpact += config.satisfactionImpact + levelConfig.satisfactionModifier;
  }
  
  const activeCount = setup.enabledStrategies.size;
  
  return {
    totalMonthlyRevenue: Math.round(totalRevenue),
    revenueByStrategy,
    activeStrategies: activeCount,
    avgConversionRate: activeCount > 0 ? totalConversionRate / activeCount : 0,
    satisfactionImpact: totalSatisfactionImpact,
  };
}
