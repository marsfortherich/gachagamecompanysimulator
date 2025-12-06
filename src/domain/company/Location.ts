/**
 * Location/Headquarters System
 * 
 * Different headquarters locations provide unique bonuses that affect various
 * aspects of gameplay including revenue, costs, development speed, and more.
 */

export type LocationId = 
  | 'Tokyo'
  | 'Seoul'
  | 'Shanghai'
  | 'Los Angeles'
  | 'San Francisco'
  | 'Seattle'
  | 'Montreal'
  | 'London'
  | 'Stockholm';

export type Region = 'Asia' | 'North America' | 'Europe';

/**
 * Numeric bonuses that affect game calculations
 */
export interface LocationBonuses {
  // Revenue modifiers (multipliers, e.g., 0.15 = +15%)
  readonly gachaRevenueBonus: number;
  readonly adRevenueBonus: number;
  readonly marketingEffectiveness: number;
  readonly marketReachBonus: number;
  
  // Cost modifiers (negative = savings, e.g., -0.15 = -15% costs)
  readonly employeeCostModifier: number;
  readonly developmentCostModifier: number;
  
  // Development modifiers
  readonly developmentSpeedBonus: number;
  readonly gameQualityBonus: number;
  readonly gamePolishBonus: number;
  
  // Employee/engagement modifiers
  readonly playerEngagementBonus: number;
  readonly employeeMoraleBonus: number;
  readonly hiringPoolBonus: number;
}

/**
 * Full location configuration
 */
export interface LocationConfig {
  readonly id: LocationId;
  readonly name: string;
  readonly region: Region;
  readonly description: string;
  readonly displayBonuses: readonly string[];  // Human-readable bonus descriptions
  readonly targetAudience: string;
  readonly bonuses: LocationBonuses;
}

/**
 * Default bonuses (no effect)
 */
const DEFAULT_BONUSES: LocationBonuses = {
  gachaRevenueBonus: 0,
  adRevenueBonus: 0,
  marketingEffectiveness: 0,
  marketReachBonus: 0,
  employeeCostModifier: 0,
  developmentCostModifier: 0,
  developmentSpeedBonus: 0,
  gameQualityBonus: 0,
  gamePolishBonus: 0,
  playerEngagementBonus: 0,
  employeeMoraleBonus: 0,
  hiringPoolBonus: 0,
};

/**
 * All available headquarters locations with their bonuses
 */
export const LOCATIONS: Record<LocationId, LocationConfig> = {
  'Tokyo': {
    id: 'Tokyo',
    name: 'Tokyo',
    region: 'Asia',
    description: 'The heart of the gacha gaming industry',
    displayBonuses: ['+15% gacha revenue', 'Access to top anime artists', 'Strong mobile gaming market'],
    targetAudience: 'Core mobile gamers, anime/JRPG enthusiasts',
    bonuses: {
      ...DEFAULT_BONUSES,
      gachaRevenueBonus: 0.15,        // +15% gacha revenue
      hiringPoolBonus: 0.10,          // Better access to talent (artists)
      playerEngagementBonus: 0.05,    // Strong mobile gaming market
    },
  },
  'Seoul': {
    id: 'Seoul',
    name: 'Seoul',
    region: 'Asia',
    description: 'Competitive gaming capital with strong esports culture',
    displayBonuses: ['+10% player engagement', 'Skilled developers', 'Esports integration'],
    targetAudience: 'Competitive players, MMO fans',
    bonuses: {
      ...DEFAULT_BONUSES,
      playerEngagementBonus: 0.10,    // +10% player engagement
      gameQualityBonus: 0.05,         // Skilled developers
      marketingEffectiveness: 0.05,   // Esports integration helps marketing
    },
  },
  'Shanghai': {
    id: 'Shanghai',
    name: 'Shanghai',
    region: 'Asia',
    description: 'Gateway to the massive Chinese gaming market',
    displayBonuses: ['+20% potential player base', 'Lower development costs', 'Growing talent pool'],
    targetAudience: 'Casual to mid-core players, large market',
    bonuses: {
      ...DEFAULT_BONUSES,
      marketReachBonus: 0.20,         // +20% potential player base
      developmentCostModifier: -0.10, // Lower development costs
      hiringPoolBonus: 0.05,          // Growing talent pool
    },
  },
  'Los Angeles': {
    id: 'Los Angeles',
    name: 'Los Angeles',
    region: 'North America',
    description: 'Entertainment capital with strong marketing reach',
    displayBonuses: ['+15% marketing effectiveness', 'Celebrity partnerships', 'Media connections'],
    targetAudience: 'Western casual gamers, mainstream audience',
    bonuses: {
      ...DEFAULT_BONUSES,
      marketingEffectiveness: 0.15,   // +15% marketing effectiveness
      adRevenueBonus: 0.10,           // Celebrity partnerships = better ad deals
      marketReachBonus: 0.05,         // Media connections
    },
  },
  'San Francisco': {
    id: 'San Francisco',
    name: 'San Francisco',
    region: 'North America',
    description: 'Tech hub with innovative development culture',
    displayBonuses: ['+10% development speed', 'Access to tech talent', 'Investor connections'],
    targetAudience: 'Tech-savvy players, early adopters',
    bonuses: {
      ...DEFAULT_BONUSES,
      developmentSpeedBonus: 0.10,    // +10% development speed
      hiringPoolBonus: 0.15,          // Access to tech talent
      gameQualityBonus: 0.05,         // Tech innovation
    },
  },
  'Seattle': {
    id: 'Seattle',
    name: 'Seattle',
    region: 'North America',
    description: 'Home to major gaming studios',
    displayBonuses: ['+10% game quality', 'Experienced developers', 'Strong gaming culture'],
    targetAudience: 'Core gamers, AAA-quality seekers',
    bonuses: {
      ...DEFAULT_BONUSES,
      gameQualityBonus: 0.10,         // +10% game quality
      hiringPoolBonus: 0.10,          // Experienced developers
      playerEngagementBonus: 0.05,    // Strong gaming culture
    },
  },
  'Montreal': {
    id: 'Montreal',
    name: 'Montreal',
    region: 'North America',
    description: 'Creative hub with government incentives',
    displayBonuses: ['-15% employee costs', 'Art/design talent', 'Bilingual market access'],
    targetAudience: 'Story-focused players, artistic games',
    bonuses: {
      ...DEFAULT_BONUSES,
      employeeCostModifier: -0.15,    // -15% employee costs
      gamePolishBonus: 0.10,          // Art/design talent
      marketReachBonus: 0.05,         // Bilingual market access (EN/FR)
    },
  },
  'London': {
    id: 'London',
    name: 'London',
    region: 'Europe',
    description: 'European gateway with diverse talent',
    displayBonuses: ['+10% EU market reach', 'Cultural diversity', 'Strong IP protection'],
    targetAudience: 'European market, strategy gamers',
    bonuses: {
      ...DEFAULT_BONUSES,
      marketReachBonus: 0.10,         // +10% EU market reach
      hiringPoolBonus: 0.10,          // Cultural diversity = diverse talent
      gachaRevenueBonus: 0.05,        // Strong IP protection = safer monetization
    },
  },
  'Stockholm': {
    id: 'Stockholm',
    name: 'Stockholm',
    region: 'Europe',
    description: 'Nordic game dev excellence',
    displayBonuses: ['+15% game polish', 'Work-life balance = happy devs', 'Indie success stories'],
    targetAudience: 'Quality-focused players, indie fans',
    bonuses: {
      ...DEFAULT_BONUSES,
      gamePolishBonus: 0.15,          // +15% game polish
      employeeMoraleBonus: 0.15,      // Work-life balance = happy devs
      gameQualityBonus: 0.05,         // Quality culture
    },
  },
};

/**
 * Get location bonuses for a headquarters location
 */
export function getLocationBonuses(headquarters: string): LocationBonuses {
  const location = LOCATIONS[headquarters as LocationId];
  return location?.bonuses ?? DEFAULT_BONUSES;
}

/**
 * Get full location config
 */
export function getLocationConfig(headquarters: string): LocationConfig | null {
  return LOCATIONS[headquarters as LocationId] ?? null;
}

/**
 * Get all available location IDs
 */
export function getAllLocationIds(): LocationId[] {
  return Object.keys(LOCATIONS) as LocationId[];
}

/**
 * Calculate a revenue with location bonus applied
 */
export function applyRevenueBonus(
  baseRevenue: number,
  headquarters: string,
  revenueType: 'gacha' | 'ads' | 'general'
): number {
  const bonuses = getLocationBonuses(headquarters);
  
  let multiplier = 1;
  
  switch (revenueType) {
    case 'gacha':
      multiplier += bonuses.gachaRevenueBonus;
      break;
    case 'ads':
      multiplier += bonuses.adRevenueBonus;
      break;
    case 'general':
      // General revenue gets a smaller portion of both bonuses
      multiplier += (bonuses.gachaRevenueBonus + bonuses.adRevenueBonus) * 0.5;
      break;
  }
  
  // Market reach bonus applies to all revenue types
  multiplier += bonuses.marketReachBonus * 0.5;
  
  return baseRevenue * multiplier;
}

/**
 * Calculate employee cost with location modifier
 */
export function applyEmployeeCostModifier(baseCost: number, headquarters: string): number {
  const bonuses = getLocationBonuses(headquarters);
  return baseCost * (1 + bonuses.employeeCostModifier);
}

/**
 * Calculate development speed with location bonus
 */
export function applyDevelopmentSpeedBonus(baseSpeed: number, headquarters: string): number {
  const bonuses = getLocationBonuses(headquarters);
  return baseSpeed * (1 + bonuses.developmentSpeedBonus);
}

/**
 * Calculate game quality bonus from location
 */
export function getQualityBonus(headquarters: string): number {
  const bonuses = getLocationBonuses(headquarters);
  return bonuses.gameQualityBonus + bonuses.gamePolishBonus;
}

/**
 * Calculate marketing effectiveness multiplier
 */
export function getMarketingMultiplier(headquarters: string): number {
  const bonuses = getLocationBonuses(headquarters);
  return 1 + bonuses.marketingEffectiveness;
}

/**
 * Get employee morale bonus from location
 */
export function getEmployeeMoraleBonus(headquarters: string): number {
  const bonuses = getLocationBonuses(headquarters);
  return bonuses.employeeMoraleBonus;
}

/**
 * Get player engagement multiplier from location
 */
export function getEngagementMultiplier(headquarters: string): number {
  const bonuses = getLocationBonuses(headquarters);
  return 1 + bonuses.playerEngagementBonus;
}
