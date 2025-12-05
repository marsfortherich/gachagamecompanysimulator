/**
 * Player Behavior Simulation
 * Simulates player acquisition, retention, and monetization behavior
 */

import { IRNGProvider, defaultRNG } from '../shared';

// ============================================================================
// PLAYER ARCHETYPES
// ============================================================================

export type PlayerType = 'whale' | 'dolphin' | 'free_to_play';

export interface PlayerArchetype {
  readonly type: PlayerType;
  readonly percentOfPopulation: number;
  readonly monthlySpendRange: { min: number; max: number };
  readonly baseChurnRate: number;  // Monthly churn probability
  readonly conversionRate: number;  // Probability to convert from F2P
  readonly sensitivities: {
    readonly powerCreep: number;      // 0-1, how sensitive to power creep
    readonly exclusiveContent: number; // 0-1, desire for exclusives
    readonly monetizationPressure: number; // 0-1, tolerance for pressure
    readonly quality: number;         // 0-1, how much quality matters
  };
}

export const PLAYER_ARCHETYPES: Record<PlayerType, PlayerArchetype> = {
  whale: {
    type: 'whale',
    percentOfPopulation: 1,
    monthlySpendRange: { min: 100, max: 1000 },
    baseChurnRate: 0.05,
    conversionRate: 0.001,  // Very rare to become whale
    sensitivities: {
      powerCreep: 0.8,
      exclusiveContent: 0.9,
      monetizationPressure: 0.2,
      quality: 0.5,
    },
  },
  dolphin: {
    type: 'dolphin',
    percentOfPopulation: 14,
    monthlySpendRange: { min: 10, max: 50 },
    baseChurnRate: 0.10,
    conversionRate: 0.02,  // 2% of F2P convert to dolphin monthly
    sensitivities: {
      powerCreep: 0.5,
      exclusiveContent: 0.6,
      monetizationPressure: 0.5,
      quality: 0.7,
    },
  },
  free_to_play: {
    type: 'free_to_play',
    percentOfPopulation: 85,
    monthlySpendRange: { min: 0, max: 0 },
    baseChurnRate: 0.25,
    conversionRate: 1.0,  // All new players start here
    sensitivities: {
      powerCreep: 0.3,
      exclusiveContent: 0.4,
      monetizationPressure: 0.9,  // Very sensitive to pressure
      quality: 0.8,
    },
  },
};

// ============================================================================
// PLAYER POPULATION STATE
// ============================================================================

export interface PlayerPopulation {
  readonly whales: number;
  readonly dolphins: number;
  readonly freeToPlay: number;
  readonly total: number;
}

export interface PlayerLifecycleState {
  readonly acquired: number;     // New players today
  readonly onboarding: number;   // Players in first week
  readonly retained: number;     // Active established players
  readonly churned: number;      // Players who left today
}

export interface DailyMetrics {
  readonly day: number;
  readonly population: PlayerPopulation;
  readonly lifecycle: PlayerLifecycleState;
  readonly revenue: number;
  readonly dau: number;  // Daily Active Users
  readonly churnRate: number;
  readonly conversionRate: number;
}

// ============================================================================
// GAME CONDITIONS AFFECTING PLAYERS
// ============================================================================

export interface GameConditions {
  readonly quality: number;              // 0-100
  readonly monetizationPressure: number; // 0-1 (how aggressive)
  readonly contentFreshness: number;     // 0-1 (recent updates)
  readonly hasPowerCreep: boolean;
  readonly hasExclusiveContent: boolean;
  readonly marketingSpend: number;
  readonly reputation: number;           // 0-100
  readonly competitionLevel: number;     // 0-1 (market saturation)
}

// ============================================================================
// ACQUISITION SIMULATION
// ============================================================================

/**
 * Calculates daily player acquisition
 * 
 * Sources:
 * - Marketing (primary driver)
 * - Word of mouth (based on quality and satisfied players)
 * - Viral growth (occasional spikes)
 */
export function calculateDailyAcquisition(
  conditions: GameConditions,
  currentPopulation: PlayerPopulation,
  rng: IRNGProvider = defaultRNG
): number {
  // Marketing-driven acquisition
  const marketingBase = Math.sqrt(conditions.marketingSpend) * 0.1;
  
  // Word of mouth based on quality and existing happy players
  const satisfiedPlayers = currentPopulation.total * (conditions.quality / 100) * (1 - conditions.monetizationPressure);
  const wordOfMouth = satisfiedPlayers * 0.001;
  
  // Reputation bonus
  const reputationMult = 0.5 + (conditions.reputation / 100);
  
  // Competition penalty
  const competitionMult = 1 - (conditions.competitionLevel * 0.5);
  
  // Viral chance (rare spikes)
  const viralChance = rng.random() < 0.01 ? rng.randomInt(100, 1000) : 0;
  
  const baseAcquisition = (marketingBase + wordOfMouth) * reputationMult * competitionMult;
  
  return Math.round(baseAcquisition + viralChance);
}

// ============================================================================
// CHURN SIMULATION
// ============================================================================

/**
 * Calculates churn rate for a player type based on conditions
 */
export function calculateChurnRate(
  playerType: PlayerType,
  conditions: GameConditions
): number {
  const archetype = PLAYER_ARCHETYPES[playerType];
  let churnRate = archetype.baseChurnRate;
  
  // Quality impact (lower quality = higher churn)
  const qualityImpact = (1 - conditions.quality / 100) * archetype.sensitivities.quality;
  churnRate += qualityImpact * 0.1;
  
  // Monetization pressure (F2P especially sensitive)
  const pressureImpact = conditions.monetizationPressure * archetype.sensitivities.monetizationPressure;
  churnRate += pressureImpact * 0.15;
  
  // Content freshness (stale content = higher churn)
  const staleImpact = (1 - conditions.contentFreshness) * 0.05;
  churnRate += staleImpact;
  
  // Power creep (affects whales/dolphins)
  if (conditions.hasPowerCreep) {
    churnRate += archetype.sensitivities.powerCreep * 0.05;
  }
  
  // Competition (more competition = easier to leave)
  churnRate += conditions.competitionLevel * 0.05;
  
  // Clamp to reasonable bounds
  return Math.max(0.01, Math.min(0.50, churnRate));
}

/**
 * Calculates number of players churning today
 */
export function calculateDailyChurn(
  population: PlayerPopulation,
  conditions: GameConditions,
  rng: IRNGProvider = defaultRNG
): { churned: PlayerPopulation; churnRates: Record<PlayerType, number> } {
  const whaleChurnRate = calculateChurnRate('whale', conditions);
  const dolphinChurnRate = calculateChurnRate('dolphin', conditions);
  const f2pChurnRate = calculateChurnRate('free_to_play', conditions);
  
  // Daily churn = monthly rate / 30
  const whalesChurned = Math.round(population.whales * (whaleChurnRate / 30) * (0.8 + rng.random() * 0.4));
  const dolphinsChurned = Math.round(population.dolphins * (dolphinChurnRate / 30) * (0.8 + rng.random() * 0.4));
  const f2pChurned = Math.round(population.freeToPlay * (f2pChurnRate / 30) * (0.8 + rng.random() * 0.4));
  
  return {
    churned: {
      whales: whalesChurned,
      dolphins: dolphinsChurned,
      freeToPlay: f2pChurned,
      total: whalesChurned + dolphinsChurned + f2pChurned,
    },
    churnRates: {
      whale: whaleChurnRate,
      dolphin: dolphinChurnRate,
      free_to_play: f2pChurnRate,
    },
  };
}

// ============================================================================
// CONVERSION SIMULATION
// ============================================================================

/**
 * Calculates conversions between player types
 */
export function calculateDailyConversions(
  population: PlayerPopulation,
  conditions: GameConditions,
  rng: IRNGProvider = defaultRNG
): { f2pToDolphin: number; dolphinToWhale: number } {
  // F2P -> Dolphin conversion
  // Higher with good content, exclusive offers, lower monetization pressure
  let f2pConversionRate = PLAYER_ARCHETYPES.dolphin.conversionRate;
  
  // Good deals increase conversion
  if (conditions.hasExclusiveContent) {
    f2pConversionRate *= 1.5;
  }
  
  // High pressure actually reduces conversions
  f2pConversionRate *= (1 - conditions.monetizationPressure * 0.5);
  
  // Quality helps conversion
  f2pConversionRate *= (conditions.quality / 100);
  
  const f2pToDolphin = Math.round(
    population.freeToPlay * (f2pConversionRate / 30) * (0.7 + rng.random() * 0.6)
  );
  
  // Dolphin -> Whale conversion (much rarer)
  let whaleConversionRate = PLAYER_ARCHETYPES.whale.conversionRate;
  
  // Power creep and exclusives drive whale creation
  if (conditions.hasPowerCreep) {
    whaleConversionRate *= 2;
  }
  if (conditions.hasExclusiveContent) {
    whaleConversionRate *= 1.5;
  }
  
  const dolphinToWhale = Math.round(
    population.dolphins * (whaleConversionRate / 30) * (0.5 + rng.random())
  );
  
  return { f2pToDolphin, dolphinToWhale };
}

// ============================================================================
// REVENUE SIMULATION
// ============================================================================

/**
 * Calculates daily revenue from player spending
 */
export function calculateDailyPlayerRevenue(
  population: PlayerPopulation,
  conditions: GameConditions,
  rng: IRNGProvider = defaultRNG
): number {
  // Whale spending
  const whaleArchetype = PLAYER_ARCHETYPES.whale;
  const avgWhaleSpend = (whaleArchetype.monthlySpendRange.min + whaleArchetype.monthlySpendRange.max) / 2;
  const whaleRevenue = population.whales * (avgWhaleSpend / 30);
  
  // Dolphin spending
  const dolphinArchetype = PLAYER_ARCHETYPES.dolphin;
  const avgDolphinSpend = (dolphinArchetype.monthlySpendRange.min + dolphinArchetype.monthlySpendRange.max) / 2;
  const dolphinRevenue = population.dolphins * (avgDolphinSpend / 30);
  
  // Modifiers
  const qualityMult = 0.8 + (conditions.quality / 100) * 0.4;  // 0.8-1.2
  
  // Aggressive monetization boosts short-term revenue
  const pressureMult = 1 + (conditions.monetizationPressure * 0.5);
  
  // Exclusive content drives spending
  const exclusiveMult = conditions.hasExclusiveContent ? 1.3 : 1.0;
  
  // Random variance
  const variance = 0.8 + rng.random() * 0.4;
  
  return Math.round((whaleRevenue + dolphinRevenue) * qualityMult * pressureMult * exclusiveMult * variance);
}

// ============================================================================
// SIMULATION ENGINE
// ============================================================================

/**
 * Initial population from player count
 */
export function createInitialPopulation(totalPlayers: number): PlayerPopulation {
  const whales = Math.round(totalPlayers * (PLAYER_ARCHETYPES.whale.percentOfPopulation / 100));
  const dolphins = Math.round(totalPlayers * (PLAYER_ARCHETYPES.dolphin.percentOfPopulation / 100));
  const freeToPlay = totalPlayers - whales - dolphins;
  
  return {
    whales,
    dolphins,
    freeToPlay,
    total: totalPlayers,
  };
}

/**
 * Simulates one day of player behavior
 */
export function simulateDay(
  currentPopulation: PlayerPopulation,
  conditions: GameConditions,
  day: number,
  rng: IRNGProvider = defaultRNG
): DailyMetrics {
  // Acquisition
  const acquired = calculateDailyAcquisition(conditions, currentPopulation, rng);
  
  // Churn
  const { churned, churnRates } = calculateDailyChurn(currentPopulation, conditions, rng);
  
  // Conversions
  const conversions = calculateDailyConversions(currentPopulation, conditions, rng);
  
  // Update population
  const newPopulation: PlayerPopulation = {
    whales: currentPopulation.whales - churned.whales + conversions.dolphinToWhale,
    dolphins: currentPopulation.dolphins - churned.dolphins + conversions.f2pToDolphin - conversions.dolphinToWhale,
    freeToPlay: currentPopulation.freeToPlay - churned.freeToPlay + acquired - conversions.f2pToDolphin,
    total: 0,  // Will be calculated
  };
  
  const total = Math.max(0, newPopulation.whales + newPopulation.dolphins + newPopulation.freeToPlay);
  
  const finalPopulation: PlayerPopulation = {
    ...newPopulation,
    whales: Math.max(0, newPopulation.whales),
    dolphins: Math.max(0, newPopulation.dolphins),
    freeToPlay: Math.max(0, newPopulation.freeToPlay),
    total,
  };
  
  // Revenue
  const revenue = calculateDailyPlayerRevenue(finalPopulation, conditions, rng);
  
  // DAU (typically ~30% of total are active daily)
  const dauRate = 0.25 + (conditions.contentFreshness * 0.15);  // 25-40%
  const dau = Math.round(total * dauRate);
  
  // Average churn rate
  const avgChurnRate = (churnRates.whale + churnRates.dolphin + churnRates.free_to_play) / 3;
  
  // Conversion rate
  const conversionRate = total > 0 
    ? (conversions.f2pToDolphin + conversions.dolphinToWhale) / total 
    : 0;
  
  return {
    day,
    population: finalPopulation,
    lifecycle: {
      acquired,
      onboarding: acquired,  // Simplified
      retained: total - acquired,
      churned: churned.total,
    },
    revenue,
    dau,
    churnRate: avgChurnRate,
    conversionRate,
  };
}

/**
 * Runs a full year (365 days) simulation
 */
export function runYearSimulation(
  initialPlayers: number,
  conditions: GameConditions,
  rng: IRNGProvider = defaultRNG
): {
  dailyMetrics: DailyMetrics[];
  summary: {
    totalRevenue: number;
    averageDAU: number;
    peakDAU: number;
    finalPopulation: PlayerPopulation;
    totalChurned: number;
    totalAcquired: number;
    averageChurnRate: number;
  };
} {
  const dailyMetrics: DailyMetrics[] = [];
  let currentPopulation = createInitialPopulation(initialPlayers);
  
  let totalRevenue = 0;
  let totalDAU = 0;
  let peakDAU = 0;
  let totalChurned = 0;
  let totalAcquired = 0;
  let totalChurnRate = 0;
  
  for (let day = 1; day <= 365; day++) {
    const metrics = simulateDay(currentPopulation, conditions, day, rng);
    dailyMetrics.push(metrics);
    
    currentPopulation = metrics.population;
    totalRevenue += metrics.revenue;
    totalDAU += metrics.dau;
    peakDAU = Math.max(peakDAU, metrics.dau);
    totalChurned += metrics.lifecycle.churned;
    totalAcquired += metrics.lifecycle.acquired;
    totalChurnRate += metrics.churnRate;
  }
  
  return {
    dailyMetrics,
    summary: {
      totalRevenue,
      averageDAU: Math.round(totalDAU / 365),
      peakDAU,
      finalPopulation: currentPopulation,
      totalChurned,
      totalAcquired,
      averageChurnRate: totalChurnRate / 365,
    },
  };
}
