/**
 * GachaViewModel - Transforms gacha domain models into UI-friendly structures
 * Part of Prompt 5.1: UI Architecture Implementation
 * 
 * Responsibilities:
 * - Format gacha items for display
 * - Transform banners with calculated statistics
 * - Provide pull animation state
 * - Calculate revenue projections
 */

import {
  GachaItem,
  GachaBanner,
  Rarity,
  ItemType,
  PullResult,
  PullCost,
} from '@domain/gacha';

// =============================================================================
// View Models
// =============================================================================

/**
 * UI-ready representation of a gacha item
 */
export interface GachaItemViewModel {
  readonly id: string;
  readonly name: string;
  readonly rarity: Rarity;
  readonly rarityLabel: string;
  readonly rarityColor: string;
  readonly type: ItemType;
  readonly typeLabel: string;
  readonly typeIcon: string;
  readonly description: string;
  readonly developmentCost: number;
  readonly developmentCostFormatted: string;
}

/**
 * UI-ready representation of a gacha banner
 */
export interface GachaBannerViewModel {
  readonly id: string;
  readonly name: string;
  readonly gameId: string;
  readonly featuredItemCount: number;
  readonly totalItemCount: number;
  readonly timeRemaining: string;
  readonly isActive: boolean;
  readonly isLimited: boolean;
  readonly limitedBadge: string | null;
  readonly pullCostDisplay: PullCostDisplay;
  readonly ratesDisplay: RatesDisplay;
  readonly pityInfo: PityInfo;
}

/**
 * Pull cost formatted for display
 */
export interface PullCostDisplay {
  readonly gems: number;
  readonly gemsFormatted: string;
  readonly tickets: number;
  readonly ticketsFormatted: string;
  readonly singlePullCost: string;
  readonly tenPullCost: string;
}

/**
 * Gacha rates formatted for display
 */
export interface RatesDisplay {
  readonly legendaryRate: string;
  readonly epicRate: string;
  readonly rareRate: string;
  readonly commonRate: string;
  readonly rateUpBonus: string;
}

/**
 * Pity system information
 */
export interface PityInfo {
  readonly currentPity: number;
  readonly pityMax: number;
  readonly pityProgress: number; // 0-100
  readonly pullsUntilGuaranteed: number;
}

/**
 * Pull result for animation
 */
export interface PullResultViewModel {
  readonly item: GachaItemViewModel;
  readonly isDuplicate: boolean;
  readonly pityUsed: boolean;
  readonly animationClass: string;
  readonly celebrationLevel: CelebrationLevel;
}

/**
 * Celebration level based on rarity
 */
export type CelebrationLevel = 'none' | 'minor' | 'major' | 'legendary';

/**
 * State for pull animation
 */
export interface PullAnimationState {
  readonly isAnimating: boolean;
  readonly currentPhase: PullPhase;
  readonly results: PullResultViewModel[];
  readonly revealIndex: number;
}

/**
 * Phases of pull animation
 */
export type PullPhase = 
  | 'idle'
  | 'pulling'
  | 'revealing'
  | 'celebrating'
  | 'complete';

/**
 * Banner statistics for analytics
 */
export interface BannerStatsViewModel {
  readonly bannerId: string;
  readonly bannerName: string;
  readonly totalPulls: number;
  readonly totalRevenue: number;
  readonly revenueFormatted: string;
  readonly averagePullsPerUser: number;
  readonly pityTriggerRate: number;
  readonly popularItems: PopularItemStat[];
}

/**
 * Popular item statistics
 */
export interface PopularItemStat {
  readonly itemId: string;
  readonly itemName: string;
  readonly pullCount: number;
  readonly percentage: number;
}

// =============================================================================
// Constants
// =============================================================================

const RARITY_LABELS: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

const RARITY_COLORS: Record<Rarity, string> = {
  common: '#9CA3AF',     // Gray
  uncommon: '#10B981',   // Green
  rare: '#3B82F6',       // Blue
  epic: '#8B5CF6',       // Purple
  legendary: '#F59E0B',  // Gold
};

const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  character: 'Character',
  weapon: 'Weapon',
  artifact: 'Artifact',
  costume: 'Costume',
};

const ITEM_TYPE_ICONS: Record<ItemType, string> = {
  character: '👤',
  weapon: '⚔️',
  artifact: '💎',
  costume: '👗',
};

const CELEBRATION_LEVELS: Record<Rarity, CelebrationLevel> = {
  common: 'none',
  uncommon: 'none',
  rare: 'minor',
  epic: 'major',
  legendary: 'legendary',
};

// =============================================================================
// Transformer Functions
// =============================================================================

/**
 * Transform a GachaItem to GachaItemViewModel
 */
export function toGachaItemViewModel(item: GachaItem): GachaItemViewModel {
  const developmentCost = item.artCost + item.designCost;
  
  return {
    id: item.id,
    name: item.name,
    rarity: item.rarity,
    rarityLabel: RARITY_LABELS[item.rarity],
    rarityColor: RARITY_COLORS[item.rarity],
    type: item.type,
    typeLabel: ITEM_TYPE_LABELS[item.type],
    typeIcon: ITEM_TYPE_ICONS[item.type],
    description: item.description,
    developmentCost,
    developmentCostFormatted: formatCurrency(developmentCost),
  };
}

/**
 * Transform a GachaBanner to GachaBannerViewModel
 */
export function toGachaBannerViewModel(
  banner: GachaBanner,
  currentTick: number,
  currentPity: number = 0
): GachaBannerViewModel {
  const isActive = currentTick >= banner.startDate && currentTick < banner.endDate;
  const timeRemaining = calculateTimeRemaining(banner.endDate - currentTick);
  
  return {
    id: banner.id,
    name: banner.name,
    gameId: banner.gameId,
    featuredItemCount: banner.featuredItems.length,
    totalItemCount: banner.itemPool.length,
    timeRemaining,
    isActive,
    isLimited: banner.isLimited,
    limitedBadge: banner.isLimited ? '⭐ Limited' : null,
    pullCostDisplay: toPullCostDisplay(banner.pullCost),
    ratesDisplay: toRatesDisplay(banner),
    pityInfo: toPityInfo(currentPity, banner.pityCounter),
  };
}

/**
 * Transform pull cost to display format
 */
function toPullCostDisplay(cost: PullCost): PullCostDisplay {
  return {
    gems: cost.gems,
    gemsFormatted: formatNumber(cost.gems),
    tickets: cost.tickets,
    ticketsFormatted: formatNumber(cost.tickets),
    singlePullCost: `${formatNumber(cost.gems)} 💎`,
    tenPullCost: `${formatNumber(cost.gems * 10)} 💎`,
  };
}

/**
 * Transform rates to display format
 */
function toRatesDisplay(banner: GachaBanner): RatesDisplay {
  const rates = banner.rates;
  return {
    legendaryRate: `${(rates.legendary * 100).toFixed(2)}%`,
    epicRate: `${(rates.epic * 100).toFixed(2)}%`,
    rareRate: `${(rates.rare * 100).toFixed(2)}%`,
    commonRate: `${((1 - rates.legendary - rates.epic - rates.rare) * 100).toFixed(2)}%`,
    rateUpBonus: `${banner.rateUpMultiplier}x Rate Up`,
  };
}

/**
 * Transform pity info
 */
function toPityInfo(currentPity: number, pityMax: number): PityInfo {
  return {
    currentPity,
    pityMax,
    pityProgress: Math.min((currentPity / pityMax) * 100, 100),
    pullsUntilGuaranteed: Math.max(0, pityMax - currentPity),
  };
}

/**
 * Transform a pull result for animation
 */
export function toPullResultViewModel(result: PullResult): PullResultViewModel {
  const itemViewModel = toGachaItemViewModel(result.item);
  const celebrationLevel = CELEBRATION_LEVELS[result.item.rarity];
  
  return {
    item: itemViewModel,
    isDuplicate: result.isDuplicate,
    pityUsed: result.pityUsed,
    animationClass: getAnimationClass(result.item.rarity),
    celebrationLevel,
  };
}

/**
 * Get animation CSS class based on rarity
 */
function getAnimationClass(rarity: Rarity): string {
  const classes: Record<Rarity, string> = {
    common: 'pull-reveal-common',
    uncommon: 'pull-reveal-uncommon',
    rare: 'pull-reveal-rare',
    epic: 'pull-reveal-epic',
    legendary: 'pull-reveal-legendary',
  };
  return classes[rarity];
}

// =============================================================================
// Animation State Management
// =============================================================================

/**
 * Create initial animation state
 */
export function createInitialAnimationState(): PullAnimationState {
  return {
    isAnimating: false,
    currentPhase: 'idle',
    results: [],
    revealIndex: -1,
  };
}

/**
 * Start pull animation
 */
export function startPullAnimation(
  state: PullAnimationState,
  results: PullResult[]
): PullAnimationState {
  return {
    ...state,
    isAnimating: true,
    currentPhase: 'pulling',
    results: results.map(toPullResultViewModel),
    revealIndex: -1,
  };
}

/**
 * Advance to next reveal
 */
export function advanceReveal(state: PullAnimationState): PullAnimationState {
  const nextIndex = state.revealIndex + 1;
  
  if (nextIndex >= state.results.length) {
    return {
      ...state,
      currentPhase: 'complete',
      revealIndex: nextIndex,
    };
  }
  
  const nextResult = state.results[nextIndex];
  const shouldCelebrate = nextResult.celebrationLevel !== 'none';
  
  return {
    ...state,
    currentPhase: shouldCelebrate ? 'celebrating' : 'revealing',
    revealIndex: nextIndex,
  };
}

/**
 * Complete animation
 */
export function completeAnimation(state: PullAnimationState): PullAnimationState {
  return {
    ...state,
    isAnimating: false,
    currentPhase: 'idle',
  };
}

// =============================================================================
// Filtering and Sorting
// =============================================================================

/**
 * Filter gacha items
 */
export function filterGachaItems(
  items: GachaItem[],
  filters: GachaItemFilters
): GachaItemViewModel[] {
  return items
    .filter(item => {
      if (filters.rarity && item.rarity !== filters.rarity) return false;
      if (filters.type && item.type !== filters.type) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!item.name.toLowerCase().includes(searchLower)) return false;
      }
      return true;
    })
    .map(toGachaItemViewModel)
    .sort((a, b) => {
      if (filters.sortBy === 'rarity') {
        return getRarityOrder(b.rarity) - getRarityOrder(a.rarity);
      }
      if (filters.sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (filters.sortBy === 'cost') {
        return b.developmentCost - a.developmentCost;
      }
      return 0;
    });
}

/**
 * Filter options for gacha items
 */
export interface GachaItemFilters {
  rarity?: Rarity;
  type?: ItemType;
  search?: string;
  sortBy?: 'rarity' | 'name' | 'cost';
}

/**
 * Get rarity order for sorting
 */
function getRarityOrder(rarity: Rarity): number {
  const order: Record<Rarity, number> = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5,
  };
  return order[rarity];
}

/**
 * Filter banners
 */
export function filterBanners(
  banners: GachaBanner[],
  currentTick: number,
  filters: BannerFilters
): GachaBannerViewModel[] {
  return banners
    .filter(banner => {
      const isActive = currentTick >= banner.startDate && currentTick < banner.endDate;
      if (filters.activeOnly && !isActive) return false;
      if (filters.limitedOnly && !banner.isLimited) return false;
      if (filters.gameId && banner.gameId !== filters.gameId) return false;
      return true;
    })
    .map(banner => toGachaBannerViewModel(banner, currentTick));
}

/**
 * Filter options for banners
 */
export interface BannerFilters {
  activeOnly?: boolean;
  limitedOnly?: boolean;
  gameId?: string;
}

// =============================================================================
// Revenue Calculations
// =============================================================================

/**
 * Calculate projected revenue for a banner
 */
export function calculateBannerRevenue(
  banner: GachaBanner,
  playerCount: number,
  averagePullsPerPlayer: number,
  gemPriceUSD: number = 0.01
): BannerRevenueProjection {
  const totalPulls = playerCount * averagePullsPerPlayer;
  const gemsSpent = totalPulls * banner.pullCost.gems;
  const revenueUSD = gemsSpent * gemPriceUSD;
  
  return {
    totalPulls,
    gemsSpent,
    revenueUSD,
    revenueFormatted: formatCurrency(revenueUSD),
    averageRevenuePerPlayer: revenueUSD / playerCount,
    breakEvenPulls: calculateBreakEven(banner),
  };
}

/**
 * Revenue projection for a banner
 */
export interface BannerRevenueProjection {
  readonly totalPulls: number;
  readonly gemsSpent: number;
  readonly revenueUSD: number;
  readonly revenueFormatted: string;
  readonly averageRevenuePerPlayer: number;
  readonly breakEvenPulls: number;
}

/**
 * Calculate break-even point
 */
function calculateBreakEven(banner: GachaBanner): number {
  // Simplified break-even calculation
  const developmentCost = 10000; // Placeholder
  const revenuePerPull = banner.pullCost.gems * 0.01;
  return Math.ceil(developmentCost / revenuePerPull);
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Format number with K/M suffixes
 */
function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

/**
 * Format currency
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Calculate time remaining string
 */
function calculateTimeRemaining(ticks: number): string {
  if (ticks <= 0) return 'Ended';
  
  const days = Math.floor(ticks / (24 * 60));
  const hours = Math.floor((ticks % (24 * 60)) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  }
  if (hours > 0) {
    return `${hours}h remaining`;
  }
  return `${ticks}m remaining`;
}

/**
 * Get all rarity options for filters
 */
export function getRarityOptions(): Array<{ value: Rarity; label: string }> {
  return Object.entries(RARITY_LABELS).map(([value, label]) => ({
    value: value as Rarity,
    label,
  }));
}

/**
 * Get all item type options for filters
 */
export function getItemTypeOptions(): Array<{ value: ItemType; label: string }> {
  return Object.entries(ITEM_TYPE_LABELS).map(([value, label]) => ({
    value: value as ItemType,
    label,
  }));
}
