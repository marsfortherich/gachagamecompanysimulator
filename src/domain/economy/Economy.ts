/**
 * Economy System - Revenue and Cost calculations
 * Implements detailed financial simulation for gacha game companies
 */


import { Game, GameQuality, calculateOverallQuality } from '../game';
import { Company, OFFICE_TIERS } from '../company';
import { Employee } from '../employee';

// ============================================================================
// CONFIGURABLE CONSTANTS
// ============================================================================

/**
 * Revenue calculation constants
 */
export const ECONOMY_CONSTANTS = {
  // Base ARPU (Average Revenue Per User) in dollars per month
  BASE_ARPU: 2.5,
  
  // ARPU multipliers based on monetization strategy
  MONETIZATION_MULTIPLIERS: {
    generous: { arpu: 0.6, retention: 1.3 },    // Low revenue, high retention
    balanced: { arpu: 1.0, retention: 1.0 },     // Standard
    aggressive: { arpu: 1.5, retention: 0.7 },   // High revenue, lower retention
    predatory: { arpu: 2.5, retention: 0.4 },    // Very high revenue, very low retention
  } as const,

  // Quality impact on ARPU (higher quality = more willing spenders)
  QUALITY_ARPU_SCALE: 0.5,  // 0-50% bonus from quality

  // Content update frequency bonus
  UPDATE_FREQUENCY_BONUS: {
    weekly: 1.2,
    biweekly: 1.1,
    monthly: 1.0,
    sporadic: 0.8,
    none: 0.6,
  } as const,

  // Market saturation penalty
  MAX_SATURATION_PENALTY: 0.5,  // Up to 50% revenue reduction

  // Alternative revenue sources as percentage of game revenue
  ADVERTISEMENT_REVENUE_RATE: 0.15,  // 15% of base from ads
  MERCHANDISE_REVENUE_RATE: 0.05,    // 5% from merchandise (reputation dependent)
  LICENSING_BASE_RATE: 0.02,         // 2% base from licensing

  // Cost constants
  SERVER_COST_PER_1K_USERS: 50,      // $50 per 1000 DAU per month
  MARKETING_EFFICIENCY: 0.0001,      // Players acquired per $ spent
  DEVELOPMENT_COST_MULTIPLIER: 1.5,  // Overhead on direct costs
};

// ============================================================================
// TYPES
// ============================================================================

export type MonetizationStrategy = 'generous' | 'balanced' | 'aggressive' | 'predatory';
export type UpdateFrequency = 'weekly' | 'biweekly' | 'monthly' | 'sporadic' | 'none';

export interface GameEconomyConfig {
  readonly monetizationStrategy: MonetizationStrategy;
  readonly updateFrequency: UpdateFrequency;
  readonly marketingBudget: number;  // Monthly marketing spend
}

export interface RevenueBreakdown {
  readonly inAppPurchases: number;
  readonly advertisements: number;
  readonly merchandise: number;
  readonly licensing: number;
  readonly total: number;
}

export interface CostBreakdown {
  readonly salaries: number;
  readonly officeRent: number;
  readonly serverCosts: number;
  readonly marketingCosts: number;
  readonly developmentCosts: number;
  readonly total: number;
}

export interface ProfitReport {
  readonly revenue: RevenueBreakdown;
  readonly costs: CostBreakdown;
  readonly grossProfit: number;
  readonly profitMargin: number;
  readonly isBankrupt: boolean;
  readonly monthsToSurvival: number | null;  // null = infinite
}

export interface GameFinancials {
  readonly gameId: string;
  readonly playerBase: number;
  readonly arpu: number;
  readonly revenue: RevenueBreakdown;
  readonly serverCost: number;
}

// ============================================================================
// ARPU CALCULATION
// ============================================================================

/**
 * Calculates ARPU for a game based on various factors
 * 
 * Formula:
 * ARPU = BASE_ARPU 
 *        × monetizationMultiplier 
 *        × (1 + qualityBonus) 
 *        × updateFrequencyBonus 
 *        × (1 - saturationPenalty)
 */
export function calculateARPU(
  quality: GameQuality,
  config: GameEconomyConfig,
  marketSaturation: number  // 0-1, how saturated the market is for this genre
): number {
  const { BASE_ARPU, MONETIZATION_MULTIPLIERS, QUALITY_ARPU_SCALE, UPDATE_FREQUENCY_BONUS, MAX_SATURATION_PENALTY } = ECONOMY_CONSTANTS;
  
  const monetizationMult = MONETIZATION_MULTIPLIERS[config.monetizationStrategy].arpu;
  const overallQuality = calculateOverallQuality(quality);
  const qualityBonus = (overallQuality / 100) * QUALITY_ARPU_SCALE;
  const updateMult = UPDATE_FREQUENCY_BONUS[config.updateFrequency];
  const saturationPenalty = marketSaturation * MAX_SATURATION_PENALTY;
  
  return BASE_ARPU * monetizationMult * (1 + qualityBonus) * updateMult * (1 - saturationPenalty);
}

/**
 * Calculates retention multiplier based on monetization strategy
 */
export function calculateRetentionMultiplier(strategy: MonetizationStrategy): number {
  return ECONOMY_CONSTANTS.MONETIZATION_MULTIPLIERS[strategy].retention;
}

// ============================================================================
// REVENUE CALCULATIONS
// ============================================================================

/**
 * Calculates in-app purchase revenue for a game
 * 
 * Formula: playerBase × ARPU / 30 (daily)
 */
export function calculateInAppRevenue(
  dailyActiveUsers: number,
  arpu: number
): number {
  // ARPU is monthly, convert to daily
  const dailyArpu = arpu / 30;
  return dailyActiveUsers * dailyArpu;
}

/**
 * Calculates advertisement revenue
 * Only F2P-heavy games generate significant ad revenue
 */
export function calculateAdRevenue(
  dailyActiveUsers: number,
  arpu: number,
  hasAds: boolean = true
): number {
  if (!hasAds) return 0;
  
  // Lower ARPU games rely more on ads
  const adReliance = Math.max(0, 1 - (arpu / ECONOMY_CONSTANTS.BASE_ARPU));
  const baseAdRevenue = dailyActiveUsers * ECONOMY_CONSTANTS.ADVERTISEMENT_REVENUE_RATE / 30;
  
  return baseAdRevenue * (1 + adReliance);
}

/**
 * Calculates merchandise revenue
 * Based on game popularity and company reputation
 */
export function calculateMerchandiseRevenue(
  monthlyActiveUsers: number,
  companyReputation: number,
  gamePopularity: number  // 0-100
): number {
  const baseRevenue = monthlyActiveUsers * ECONOMY_CONSTANTS.MERCHANDISE_REVENUE_RATE;
  const reputationMult = companyReputation / 100;
  const popularityMult = gamePopularity / 100;
  
  return baseRevenue * reputationMult * popularityMult;
}

/**
 * Calculates licensing revenue (IP deals, collaborations)
 */
export function calculateLicensingRevenue(
  monthlyRevenue: number,
  companyReputation: number,
  hasActiveDeal: boolean = false
): number {
  if (!hasActiveDeal) return 0;
  
  const reputationMult = 0.5 + (companyReputation / 200);  // 0.5-1.0
  return monthlyRevenue * ECONOMY_CONSTANTS.LICENSING_BASE_RATE * reputationMult;
}

/**
 * Calculates total revenue breakdown for a single game
 */
export function calculateGameRevenue(
  game: Game,
  config: GameEconomyConfig,
  companyReputation: number,
  marketSaturation: number,
  hasAds: boolean = true,
  hasLicensingDeal: boolean = false
): GameFinancials {
  const arpu = calculateARPU(game.quality, config, marketSaturation);
  const dau = game.monetization.dailyActiveUsers;
  const mau = dau * 1.5;  // Rough MAU estimate
  
  const inAppRevenue = calculateInAppRevenue(dau, arpu) * 30;  // Monthly
  const adRevenue = calculateAdRevenue(dau, arpu, hasAds) * 30;
  const merchRevenue = calculateMerchandiseRevenue(mau, companyReputation, 50);  // Assume 50 popularity
  const licensingRevenue = calculateLicensingRevenue(inAppRevenue, companyReputation, hasLicensingDeal);
  
  const serverCost = Math.ceil(dau / 1000) * ECONOMY_CONSTANTS.SERVER_COST_PER_1K_USERS;
  
  return {
    gameId: game.id,
    playerBase: dau,
    arpu,
    revenue: {
      inAppPurchases: Math.round(inAppRevenue),
      advertisements: Math.round(adRevenue),
      merchandise: Math.round(merchRevenue),
      licensing: Math.round(licensingRevenue),
      total: Math.round(inAppRevenue + adRevenue + merchRevenue + licensingRevenue),
    },
    serverCost: Math.round(serverCost),
  };
}

/**
 * Calculates total revenue for all live games
 */
export function calculateTotalRevenue(
  games: readonly Game[],
  configs: Map<string, GameEconomyConfig>,
  companyReputation: number,
  marketSaturations: Map<string, number>
): RevenueBreakdown {
  const liveGames = games.filter(g => g.status === 'live');
  
  let totalInApp = 0;
  let totalAds = 0;
  let totalMerch = 0;
  let totalLicensing = 0;
  
  for (const game of liveGames) {
    const config = configs.get(game.id) ?? {
      monetizationStrategy: 'balanced' as MonetizationStrategy,
      updateFrequency: 'monthly' as UpdateFrequency,
      marketingBudget: 0,
    };
    const saturation = marketSaturations.get(game.genre) ?? 0.3;
    
    const financials = calculateGameRevenue(game, config, companyReputation, saturation);
    totalInApp += financials.revenue.inAppPurchases;
    totalAds += financials.revenue.advertisements;
    totalMerch += financials.revenue.merchandise;
    totalLicensing += financials.revenue.licensing;
  }
  
  return {
    inAppPurchases: totalInApp,
    advertisements: totalAds,
    merchandise: totalMerch,
    licensing: totalLicensing,
    total: totalInApp + totalAds + totalMerch + totalLicensing,
  };
}

// ============================================================================
// COST CALCULATIONS
// ============================================================================

/**
 * Calculates total monthly salary costs
 */
export function calculateSalaryCosts(employees: readonly Employee[]): number {
  return employees.reduce((sum, emp) => sum + emp.salary, 0);
}

/**
 * Calculates office rent based on office level
 */
export function calculateOfficeRent(company: Company): number {
  return OFFICE_TIERS[company.officeLevel].monthlyCost;
}

/**
 * Calculates server costs for all live games
 */
export function calculateServerCosts(games: readonly Game[]): number {
  return games
    .filter(g => g.status === 'live')
    .reduce((sum, game) => {
      const dau = game.monetization.dailyActiveUsers;
      return sum + Math.ceil(dau / 1000) * ECONOMY_CONSTANTS.SERVER_COST_PER_1K_USERS;
    }, 0);
}

/**
 * Calculates total marketing costs
 */
export function calculateMarketingCosts(
  configs: Map<string, GameEconomyConfig>
): number {
  let total = 0;
  for (const config of configs.values()) {
    total += config.marketingBudget;
  }
  return total;
}

/**
 * Calculates one-time development costs for games in development
 */
export function calculateDevelopmentCosts(
  games: readonly Game[],
  employees: readonly Employee[]
): number {
  const gamesInDev = games.filter(g => 
    g.status === 'planning' || g.status === 'development' || g.status === 'testing'
  );
  
  // Development cost = assigned employee salaries × multiplier
  let totalCost = 0;
  for (const game of gamesInDev) {
    const assignedEmps = employees.filter(e => game.assignedEmployees.includes(e.id));
    const monthlySalaries = assignedEmps.reduce((sum, e) => sum + e.salary, 0);
    totalCost += monthlySalaries * ECONOMY_CONSTANTS.DEVELOPMENT_COST_MULTIPLIER;
  }
  
  return Math.round(totalCost);
}

/**
 * Calculates complete cost breakdown
 */
export function calculateTotalCosts(
  company: Company,
  employees: readonly Employee[],
  games: readonly Game[],
  configs: Map<string, GameEconomyConfig>
): CostBreakdown {
  const salaries = calculateSalaryCosts(employees);
  const officeRent = calculateOfficeRent(company);
  const serverCosts = calculateServerCosts(games);
  const marketingCosts = calculateMarketingCosts(configs);
  const developmentCosts = calculateDevelopmentCosts(games, employees);
  
  return {
    salaries,
    officeRent,
    serverCosts,
    marketingCosts,
    developmentCosts,
    total: salaries + officeRent + serverCosts + marketingCosts + developmentCosts,
  };
}

// ============================================================================
// PROFIT & BANKRUPTCY
// ============================================================================

/**
 * Generates complete profit report
 */
export function generateProfitReport(
  company: Company,
  employees: readonly Employee[],
  games: readonly Game[],
  configs: Map<string, GameEconomyConfig>,
  marketSaturations: Map<string, number>
): ProfitReport {
  const revenue = calculateTotalRevenue(games, configs, company.reputation, marketSaturations);
  const costs = calculateTotalCosts(company, employees, games, configs);
  
  const grossProfit = revenue.total - costs.total;
  const profitMargin = revenue.total > 0 ? grossProfit / revenue.total : 0;
  
  // Bankruptcy detection
  const isBankrupt = company.funds <= 0 && grossProfit < 0;
  
  // Calculate months to survival if losing money
  let monthsToSurvival: number | null = null;
  if (grossProfit < 0 && company.funds > 0) {
    monthsToSurvival = Math.ceil(company.funds / Math.abs(grossProfit));
  } else if (grossProfit >= 0) {
    monthsToSurvival = null;  // Infinite
  }
  
  return {
    revenue,
    costs,
    grossProfit,
    profitMargin,
    isBankrupt,
    monthsToSurvival,
  };
}

/**
 * Checks if company is bankrupt
 */
export function checkBankruptcy(
  company: Company,
  monthlyLoss: number
): { isBankrupt: boolean; reason: string | null } {
  if (company.funds <= 0) {
    return { isBankrupt: true, reason: 'No remaining funds' };
  }
  
  // Also bankrupt if can't pay next month's expenses
  if (company.funds < monthlyLoss && monthlyLoss > 0) {
    return { isBankrupt: true, reason: 'Cannot cover monthly expenses' };
  }
  
  return { isBankrupt: false, reason: null };
}

/**
 * Calculates player acquisition from marketing spend
 */
export function calculatePlayerAcquisitionFromMarketing(
  marketingSpend: number,
  qualityScore: number,
  genrePopularity: number
): number {
  const baseAcquisition = marketingSpend * ECONOMY_CONSTANTS.MARKETING_EFFICIENCY;
  const qualityMult = 0.5 + (qualityScore / 100);
  const popularityMult = 0.5 + (genrePopularity / 100);
  
  return Math.round(baseAcquisition * qualityMult * popularityMult);
}
