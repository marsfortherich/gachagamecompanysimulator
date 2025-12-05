import { Entity, generateId, IRNGProvider, defaultRNG } from '../shared';
import { GachaRates } from '../game';

/**
 * Rarity levels for gacha items
 */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/**
 * Item type categories
 */
export type ItemType = 'character' | 'weapon' | 'artifact' | 'costume';

/**
 * Represents an item that can be obtained from gacha
 */
export interface GachaItem extends Entity {
  readonly name: string;
  readonly rarity: Rarity;
  readonly type: ItemType;
  readonly description: string;
  readonly artCost: number;      // Development cost for art
  readonly designCost: number;   // Development cost for design/balance
}

/**
 * Represents a gacha banner/event
 */
export interface GachaBanner extends Entity {
  readonly name: string;
  readonly gameId: string;
  readonly featuredItems: string[];    // Item IDs with rate-up
  readonly itemPool: string[];         // All available item IDs
  readonly startDate: number;          // Game tick
  readonly endDate: number;            // Game tick
  readonly rates: GachaRates;
  readonly rateUpMultiplier: number;   // e.g., 2.0 = double chance for featured
  readonly pullCost: PullCost;
  readonly pityCounter: number;        // Pulls until guaranteed
  readonly isLimited: boolean;
}

/**
 * Cost to perform a gacha pull
 */
export interface PullCost {
  readonly gems: number;
  readonly tickets: number;  // Alternative currency
}

/**
 * Result of a gacha pull
 */
export interface PullResult {
  readonly item: GachaItem;
  readonly isDuplicate: boolean;
  readonly pityUsed: boolean;
}

/**
 * Creates a new gacha item
 */
export interface CreateGachaItemParams {
  name: string;
  rarity: Rarity;
  type: ItemType;
  description?: string;
  artCost?: number;
  designCost?: number;
}

export function createGachaItem(params: CreateGachaItemParams): GachaItem {
  const costMultipliers: Record<Rarity, number> = {
    common: 1,
    uncommon: 2,
    rare: 4,
    epic: 8,
    legendary: 16,
  };

  const multiplier = costMultipliers[params.rarity];

  return {
    id: generateId(),
    name: params.name,
    rarity: params.rarity,
    type: params.type,
    description: params.description ?? '',
    artCost: params.artCost ?? 1000 * multiplier,
    designCost: params.designCost ?? 500 * multiplier,
  };
}

/**
 * Creates a new gacha banner
 */
export interface CreateBannerParams {
  name: string;
  gameId: string;
  featuredItems: string[];
  itemPool: string[];
  startDate: number;
  duration: number;  // In game ticks
  rates?: GachaRates;
  rateUpMultiplier?: number;
  pullCost?: PullCost;
  pityCounter?: number;
  isLimited?: boolean;
}

export function createGachaBanner(params: CreateBannerParams): GachaBanner {
  return {
    id: generateId(),
    name: params.name,
    gameId: params.gameId,
    featuredItems: params.featuredItems,
    itemPool: params.itemPool,
    startDate: params.startDate,
    endDate: params.startDate + params.duration,
    rates: params.rates ?? {
      common: 0.60,
      uncommon: 0.25,
      rare: 0.10,
      epic: 0.04,
      legendary: 0.01,
    },
    rateUpMultiplier: params.rateUpMultiplier ?? 2.0,
    pullCost: params.pullCost ?? { gems: 300, tickets: 1 },
    pityCounter: params.pityCounter ?? 90,
    isLimited: params.isLimited ?? false,
  };
}

/**
 * Performs a single gacha pull simulation
 * @param banner - The banner to pull from
 * @param items - Map of all available items
 * @param currentPity - Current pity counter
 * @param ownedItems - Set of already owned item IDs
 * @param rng - Random number generator (injectable for testing)
 */
export function simulatePull(
  banner: GachaBanner,
  items: Map<string, GachaItem>,
  currentPity: number,
  ownedItems: Set<string>,
  rng: IRNGProvider = defaultRNG
): { result: PullResult; newPity: number } {
  const pityTriggered = currentPity >= banner.pityCounter - 1;
  
  // Soft pity: increased rates starting at 75% of pity counter
  const softPityStart = Math.floor(banner.pityCounter * 0.75);
  const inSoftPity = currentPity >= softPityStart && !pityTriggered;
  
  // Determine rarity
  let rarity: Rarity;
  if (pityTriggered) {
    rarity = 'legendary';
  } else {
    // Apply soft pity boost
    const rates = inSoftPity 
      ? applySoftPityBoost(banner.rates, currentPity, softPityStart, banner.pityCounter)
      : banner.rates;
    rarity = rollRarity(rates, rng);
  }

  // Get items of that rarity from pool
  const eligibleItems = banner.itemPool
    .map(id => items.get(id))
    .filter((item): item is GachaItem => item !== undefined && item.rarity === rarity);

  if (eligibleItems.length === 0) {
    // Fallback to any item if no items of that rarity
    const anyItem = items.get(banner.itemPool[0]);
    if (!anyItem) {
      throw new Error('Banner has no valid items');
    }
    return {
      result: {
        item: anyItem,
        isDuplicate: ownedItems.has(anyItem.id),
        pityUsed: false,
      },
      newPity: pityTriggered ? 0 : currentPity + 1,
    };
  }

  // Check for featured item rate-up
  const featuredEligible = eligibleItems.filter(item => 
    banner.featuredItems.includes(item.id)
  );

  let selectedItem: GachaItem;
  if (featuredEligible.length > 0 && rng.random() < 0.5 * banner.rateUpMultiplier) {
    // Rate-up triggered
    selectedItem = rng.pick(featuredEligible) ?? featuredEligible[0];
  } else {
    selectedItem = rng.pick(eligibleItems) ?? eligibleItems[0];
  }

  return {
    result: {
      item: selectedItem,
      isDuplicate: ownedItems.has(selectedItem.id),
      pityUsed: pityTriggered,
    },
    newPity: pityTriggered ? 0 : currentPity + 1,
  };
}

/**
 * Applies soft pity boost to rates
 */
function applySoftPityBoost(
  baseRates: GachaRates,
  currentPity: number,
  softPityStart: number,
  maxPity: number
): GachaRates {
  const softPityProgress = (currentPity - softPityStart) / (maxPity - softPityStart);
  const boost = softPityProgress * 0.06; // Up to 6% boost per pull in soft pity
  
  const newLegendaryRate = Math.min(1, baseRates.legendary + boost);
  const scaleFactor = (1 - newLegendaryRate) / (1 - baseRates.legendary);
  
  return {
    legendary: newLegendaryRate,
    epic: baseRates.epic * scaleFactor,
    rare: baseRates.rare * scaleFactor,
    uncommon: baseRates.uncommon * scaleFactor,
    common: baseRates.common * scaleFactor,
  };
}

/**
 * Rolls a rarity based on rates
 */
function rollRarity(rates: GachaRates, rng: IRNGProvider = defaultRNG): Rarity {
  const roll = rng.random();
  let cumulative = 0;

  cumulative += rates.legendary;
  if (roll < cumulative) return 'legendary';

  cumulative += rates.epic;
  if (roll < cumulative) return 'epic';

  cumulative += rates.rare;
  if (roll < cumulative) return 'rare';

  cumulative += rates.uncommon;
  if (roll < cumulative) return 'uncommon';

  return 'common';
}

/**
 * Calculates expected revenue from banner
 */
export function calculateBannerRevenue(
  banner: GachaBanner,
  averagePullsPerUser: number,
  activeUsers: number,
  gemPrice: number  // Real $ per gem
): number {
  const totalPulls = averagePullsPerUser * activeUsers;
  const totalGems = totalPulls * banner.pullCost.gems;
  return totalGems * gemPrice;
}
