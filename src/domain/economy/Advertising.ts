/**
 * In-Game Advertising and Sponsorship System
 * 
 * Allows games to generate additional revenue through ads and sponsorships
 * with trade-offs in player satisfaction.
 */

import { EntityId, generateId } from '../shared';

/**
 * Types of in-game advertisements
 */
export type AdType =
  | 'banner_ad'           // Small banner, low impact
  | 'interstitial'        // Full-screen between content
  | 'rewarded_video'      // Player chooses to watch for reward
  | 'native_ad'           // Integrated into game UI
  | 'sponsored_content';  // Branded content/characters

/**
 * Configuration for each ad type
 */
export interface AdTypeConfig {
  readonly type: AdType;
  readonly name: string;
  readonly description: string;
  readonly revenuePerView: number;        // Revenue per ad view
  readonly viewsPerDauPerDay: number;     // Average views per player per day
  readonly satisfactionImpact: number;    // Daily satisfaction change (-negative)
  readonly setupCost: number;             // One-time cost to implement
  readonly canDisable: boolean;           // Can player disable (for a price)?
  readonly disablePrice: number;          // What player pays to disable
}

export const AD_TYPE_CONFIGS: Record<AdType, AdTypeConfig> = {
  banner_ad: {
    type: 'banner_ad',
    name: 'Banner Ads',
    description: 'Small banner advertisements shown during gameplay.',
    revenuePerView: 0.0005,
    viewsPerDauPerDay: 20,
    satisfactionImpact: -0.05,
    setupCost: 2000,
    canDisable: true,
    disablePrice: 3,
  },
  interstitial: {
    type: 'interstitial',
    name: 'Interstitial Ads',
    description: 'Full-screen ads between levels or content.',
    revenuePerView: 0.003,
    viewsPerDauPerDay: 5,
    satisfactionImpact: -0.15,
    setupCost: 3000,
    canDisable: true,
    disablePrice: 5,
  },
  rewarded_video: {
    type: 'rewarded_video',
    name: 'Rewarded Videos',
    description: 'Optional video ads that give players in-game rewards.',
    revenuePerView: 0.01,
    viewsPerDauPerDay: 2,
    satisfactionImpact: 0.02,  // Positive! Players like optional rewards
    setupCost: 5000,
    canDisable: false,
    disablePrice: 0,
  },
  native_ad: {
    type: 'native_ad',
    name: 'Native Ads',
    description: 'Ads integrated naturally into the game interface.',
    revenuePerView: 0.002,
    viewsPerDauPerDay: 10,
    satisfactionImpact: -0.03,
    setupCost: 8000,
    canDisable: true,
    disablePrice: 4,
  },
  sponsored_content: {
    type: 'sponsored_content',
    name: 'Sponsored Content',
    description: 'Branded characters, items, or events from sponsors.',
    revenuePerView: 0.05,
    viewsPerDauPerDay: 0.5,  // Per engagement, not per day
    satisfactionImpact: 0,    // Neutral if done well
    setupCost: 15000,
    canDisable: false,
    disablePrice: 0,
  },
};

/**
 * Active ad configuration for a game
 */
export interface GameAdConfig {
  readonly gameId: EntityId;
  readonly enabledAdTypes: Set<AdType>;
  readonly adFrequency: number;           // Multiplier for ad frequency (0.5-2.0)
  readonly playerOptOutRate: number;      // % of players who paid to remove ads
  readonly totalAdRevenue: number;        // Lifetime ad revenue
}

/**
 * Sponsorship deal
 */
export interface SponsorshipDeal {
  readonly id: EntityId;
  readonly gameId: EntityId;
  readonly sponsorName: string;
  readonly description: string;
  readonly status: 'offered' | 'active' | 'completed' | 'rejected';
  
  // Terms
  readonly totalPayout: number;
  readonly payoutSchedule: 'upfront' | 'monthly' | 'on_completion';
  readonly durationDays: number;
  readonly startTick: number | null;
  readonly endTick: number | null;
  
  // Requirements
  readonly minDauRequired: number;
  readonly contentRequirements: string[];
  readonly exclusivityClause: boolean;    // Can't have competing sponsors
  
  // Effects
  readonly satisfactionModifier: number;  // Can be positive (cool collab) or negative
  readonly dauBoost: number;              // Bonus DAU from sponsor marketing
  
  // Tracking
  readonly paidOut: number;
}

/**
 * Create default ad config for a game
 */
export function createGameAdConfig(gameId: EntityId): GameAdConfig {
  return {
    gameId,
    enabledAdTypes: new Set(),
    adFrequency: 1.0,
    playerOptOutRate: 0,
    totalAdRevenue: 0,
  };
}

/**
 * Enable an ad type for a game
 */
export function enableAdType(
  config: GameAdConfig,
  adType: AdType
): GameAdConfig {
  const newEnabledTypes = new Set(config.enabledAdTypes);
  newEnabledTypes.add(adType);
  
  return {
    ...config,
    enabledAdTypes: newEnabledTypes,
  };
}

/**
 * Disable an ad type
 */
export function disableAdType(
  config: GameAdConfig,
  adType: AdType
): GameAdConfig {
  const newEnabledTypes = new Set(config.enabledAdTypes);
  newEnabledTypes.delete(adType);
  
  return {
    ...config,
    enabledAdTypes: newEnabledTypes,
  };
}

/**
 * Calculate daily ad revenue and satisfaction impact
 */
export function calculateDailyAdEffects(
  config: GameAdConfig,
  dau: number
): { revenue: number; satisfactionChange: number } {
  let totalRevenue = 0;
  let totalSatisfactionChange = 0;
  
  // Account for players who paid to remove ads
  const effectiveDau = dau * (1 - config.playerOptOutRate);
  
  for (const adType of config.enabledAdTypes) {
    const adConfig = AD_TYPE_CONFIGS[adType];
    
    // Calculate revenue
    const dailyViews = effectiveDau * adConfig.viewsPerDauPerDay * config.adFrequency;
    const dailyRevenue = dailyViews * adConfig.revenuePerView;
    totalRevenue += dailyRevenue;
    
    // Calculate satisfaction impact
    totalSatisfactionChange += adConfig.satisfactionImpact * config.adFrequency;
  }
  
  return {
    revenue: Math.round(totalRevenue * 100) / 100,
    satisfactionChange: totalSatisfactionChange,
  };
}

/**
 * Calculate ad-free purchase revenue
 * When players pay to remove ads, we get that revenue
 */
export function calculateAdFreeRevenue(
  config: GameAdConfig,
  newDau: number,
  existingDau: number
): number {
  if (config.enabledAdTypes.size === 0) return 0;
  
  // Some new players will buy ad-free
  const netNewPlayers = Math.max(0, newDau - existingDau);
  const adFreePurchaseRate = 0.02; // 2% of new players buy ad-free
  
  // Calculate average ad-free price across enabled types
  let totalDisablePrice = 0;
  let disableableAds = 0;
  
  for (const adType of config.enabledAdTypes) {
    const adConfig = AD_TYPE_CONFIGS[adType];
    if (adConfig.canDisable) {
      totalDisablePrice += adConfig.disablePrice;
      disableableAds++;
    }
  }
  
  if (disableableAds === 0) return 0;
  const avgDisablePrice = totalDisablePrice / disableableAds;
  
  return Math.round(netNewPlayers * adFreePurchaseRate * avgDisablePrice * 100) / 100;
}

/**
 * Generate a random sponsorship offer
 */
export function generateSponsorshipOffer(
  gameId: EntityId,
  gameDau: number,
  companyReputation: number,
  _currentTick: number
): SponsorshipDeal | null {
  // Higher DAU and reputation = better sponsors
  if (gameDau < 1000) return null; // Minimum DAU for sponsors
  
  const sponsorChance = Math.min(0.1, (gameDau / 100000) * (companyReputation / 100));
  if (Math.random() > sponsorChance) return null;
  
  // Generate sponsor based on game metrics
  const sponsors = [
    { name: 'TechGadget Co', minDau: 1000, basePayout: 5000 },
    { name: 'EnergyDrink Brand', minDau: 5000, basePayout: 15000 },
    { name: 'SnackFood Corp', minDau: 10000, basePayout: 30000 },
    { name: 'MobileProvider Inc', minDau: 25000, basePayout: 75000 },
    { name: 'StreamingService+', minDau: 50000, basePayout: 150000 },
    { name: 'GlobalBrand International', minDau: 100000, basePayout: 500000 },
  ];
  
  const eligibleSponsors = sponsors.filter(s => gameDau >= s.minDau);
  if (eligibleSponsors.length === 0) return null;
  
  const sponsor = eligibleSponsors[Math.floor(Math.random() * eligibleSponsors.length)];
  const payoutMultiplier = 0.8 + (Math.random() * 0.4) + (companyReputation / 200);
  const totalPayout = Math.round(sponsor.basePayout * payoutMultiplier);
  const durationDays = 30 + Math.floor(Math.random() * 60); // 30-90 days
  
  return {
    id: generateId(),
    gameId,
    sponsorName: sponsor.name,
    description: `${sponsor.name} wants to sponsor your game with branded content.`,
    status: 'offered',
    totalPayout,
    payoutSchedule: Math.random() > 0.5 ? 'monthly' : 'upfront',
    durationDays,
    startTick: null,
    endTick: null,
    minDauRequired: Math.floor(gameDau * 0.8), // Must maintain 80% of current DAU
    contentRequirements: ['Add branded loading screen', 'Include sponsored items'],
    exclusivityClause: Math.random() > 0.7,
    satisfactionModifier: -2 + Math.floor(Math.random() * 5), // -2 to +2
    dauBoost: 0.05 + Math.random() * 0.1, // 5-15% DAU boost
    paidOut: 0,
  };
}

/**
 * Accept a sponsorship offer
 */
export function acceptSponsorship(
  deal: SponsorshipDeal,
  currentTick: number
): SponsorshipDeal {
  if (deal.status !== 'offered') return deal;
  
  return {
    ...deal,
    status: 'active',
    startTick: currentTick,
    endTick: currentTick + deal.durationDays,
    paidOut: deal.payoutSchedule === 'upfront' ? deal.totalPayout : 0,
  };
}

/**
 * Reject a sponsorship offer
 */
export function rejectSponsorship(deal: SponsorshipDeal): SponsorshipDeal {
  return {
    ...deal,
    status: 'rejected',
  };
}

/**
 * Process monthly sponsorship payout
 */
export function processSponsorshipPayout(
  deal: SponsorshipDeal,
  _currentTick: number
): { deal: SponsorshipDeal; payout: number } {
  if (deal.status !== 'active') return { deal, payout: 0 };
  if (deal.payoutSchedule !== 'monthly') return { deal, payout: 0 };
  
  const monthsTotal = Math.ceil(deal.durationDays / 30);
  const monthlyAmount = Math.floor(deal.totalPayout / monthsTotal);
  
  return {
    deal: {
      ...deal,
      paidOut: deal.paidOut + monthlyAmount,
    },
    payout: monthlyAmount,
  };
}

/**
 * Check if sponsorship should be terminated (DAU too low)
 */
export function checkSponsorshipTermination(
  deal: SponsorshipDeal,
  currentDau: number,
  currentTick: number
): { deal: SponsorshipDeal; terminated: boolean; reason?: string } {
  if (deal.status !== 'active') return { deal, terminated: false };
  
  // Check if DAU is below minimum
  if (currentDau < deal.minDauRequired) {
    return {
      deal: {
        ...deal,
        status: 'completed', // Early termination
        endTick: currentTick,
      },
      terminated: true,
      reason: `DAU dropped below ${deal.minDauRequired.toLocaleString()} required minimum`,
    };
  }
  
  // Check if deal has ended naturally
  if (deal.endTick && currentTick >= deal.endTick) {
    return {
      deal: {
        ...deal,
        status: 'completed',
        paidOut: deal.totalPayout, // Ensure full payout on completion
      },
      terminated: false,
    };
  }
  
  return { deal, terminated: false };
}

/**
 * Get all active sponsorship effects for a game
 */
export function getActiveSponsorshipEffects(
  deals: SponsorshipDeal[],
  gameId: EntityId
): { satisfactionModifier: number; dauBoost: number } {
  const activeDeals = deals.filter(
    d => d.gameId === gameId && d.status === 'active'
  );
  
  return {
    satisfactionModifier: activeDeals.reduce((sum, d) => sum + d.satisfactionModifier, 0),
    dauBoost: activeDeals.reduce((sum, d) => sum + d.dauBoost, 0),
  };
}
