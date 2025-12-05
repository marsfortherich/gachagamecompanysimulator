/**
 * Market Simulator - Enhanced market dynamics
 * Provides competitor AI, seasonal events, and market saturation mechanics
 */

import { Entity, IRNGProvider, defaultRNG } from '../shared';
import { GameGenre } from '../game';
import { Competitor, MarketConditions, TrendDirection } from './Market';

// ============================================================================
// SEASONAL EVENTS
// ============================================================================

export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type Holiday = 'new_years' | 'valentines' | 'summer_break' | 'halloween' | 'thanksgiving' | 'christmas' | 'golden_week' | 'none';

export interface SeasonalEvent extends Entity {
  readonly name: string;
  readonly season: Season;
  readonly holiday: Holiday;
  readonly revenueMultiplier: number;
  readonly acquisitionMultiplier: number;
  readonly startDay: number;  // Day of year (1-365)
  readonly duration: number;  // Days
}

export const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    id: 'event_new_years',
    name: 'New Year Celebration',
    season: 'winter',
    holiday: 'new_years',
    revenueMultiplier: 1.5,
    acquisitionMultiplier: 1.3,
    startDay: 1,
    duration: 7,
  },
  {
    id: 'event_valentines',
    name: 'Valentine\'s Day',
    season: 'winter',
    holiday: 'valentines',
    revenueMultiplier: 1.4,
    acquisitionMultiplier: 1.2,
    startDay: 44,  // Feb 14
    duration: 3,
  },
  {
    id: 'event_golden_week',
    name: 'Golden Week',
    season: 'spring',
    holiday: 'golden_week',
    revenueMultiplier: 1.6,
    acquisitionMultiplier: 1.4,
    startDay: 119,  // Late April
    duration: 7,
  },
  {
    id: 'event_summer',
    name: 'Summer Break',
    season: 'summer',
    holiday: 'summer_break',
    revenueMultiplier: 1.3,
    acquisitionMultiplier: 1.5,
    startDay: 172,  // Late June
    duration: 60,
  },
  {
    id: 'event_halloween',
    name: 'Halloween',
    season: 'fall',
    holiday: 'halloween',
    revenueMultiplier: 1.4,
    acquisitionMultiplier: 1.3,
    startDay: 304,  // Oct 31
    duration: 10,
  },
  {
    id: 'event_thanksgiving',
    name: 'Thanksgiving',
    season: 'fall',
    holiday: 'thanksgiving',
    revenueMultiplier: 1.3,
    acquisitionMultiplier: 1.2,
    startDay: 327,  // Late Nov
    duration: 5,
  },
  {
    id: 'event_christmas',
    name: 'Christmas/Holiday Season',
    season: 'winter',
    holiday: 'christmas',
    revenueMultiplier: 1.8,
    acquisitionMultiplier: 1.5,
    startDay: 350,  // Dec 15
    duration: 17,
  },
];

/**
 * Gets the current season based on day of year
 */
export function getSeason(dayOfYear: number): Season {
  if (dayOfYear >= 80 && dayOfYear < 172) return 'spring';
  if (dayOfYear >= 172 && dayOfYear < 266) return 'summer';
  if (dayOfYear >= 266 && dayOfYear < 355) return 'fall';
  return 'winter';
}

/**
 * Gets active seasonal events for a given day
 */
export function getActiveSeasonalEvents(dayOfYear: number): SeasonalEvent[] {
  const normalizedDay = ((dayOfYear - 1) % 365) + 1;  // 1-365
  
  return SEASONAL_EVENTS.filter(event => {
    const endDay = (event.startDay + event.duration - 1) % 365;
    
    if (event.startDay <= endDay) {
      // Normal range (doesn't wrap around year)
      return normalizedDay >= event.startDay && normalizedDay <= endDay;
    } else {
      // Wraps around year (e.g., Christmas to New Year)
      return normalizedDay >= event.startDay || normalizedDay <= endDay;
    }
  });
}

/**
 * Calculates seasonal multipliers for a given day
 */
export function calculateSeasonalMultipliers(dayOfYear: number): {
  revenueMultiplier: number;
  acquisitionMultiplier: number;
  activeEvents: SeasonalEvent[];
} {
  const activeEvents = getActiveSeasonalEvents(dayOfYear);
  
  if (activeEvents.length === 0) {
    return { revenueMultiplier: 1.0, acquisitionMultiplier: 1.0, activeEvents: [] };
  }
  
  // Stack multipliers (with diminishing returns)
  let revenueMult = 1.0;
  let acquisitionMult = 1.0;
  
  for (const event of activeEvents) {
    revenueMult *= event.revenueMultiplier;
    acquisitionMult *= event.acquisitionMultiplier;
  }
  
  // Cap stacked multipliers
  return {
    revenueMultiplier: Math.min(2.5, revenueMult),
    acquisitionMultiplier: Math.min(2.0, acquisitionMult),
    activeEvents,
  };
}

// ============================================================================
// COMPETITOR AI
// ============================================================================

export type CompetitorAction = 
  | 'launch_game'
  | 'major_update'
  | 'marketing_blitz'
  | 'price_cut'
  | 'collaboration'
  | 'acquire_studio'
  | 'none';

export interface CompetitorActionResult {
  readonly competitor: Competitor;
  readonly action: CompetitorAction;
  readonly impact: {
    readonly marketShareChange: number;
    readonly reputationChange: number;
    readonly playerLossToUs: number;  // Players we might lose
  };
  readonly description: string;
}

/**
 * Simulates competitor AI decision making
 */
export function simulateCompetitorAction(
  competitor: Competitor,
  _marketConditions: MarketConditions,
  playerReputation: number,
  dayOfYear: number,
  rng: IRNGProvider = defaultRNG
): CompetitorActionResult {
  // Higher aggressiveness = more likely to take action
  const actionChance = competitor.aggressiveness * 0.05;  // 0-5% daily chance
  
  if (rng.random() > actionChance) {
    return {
      competitor,
      action: 'none',
      impact: { marketShareChange: 0, reputationChange: 0, playerLossToUs: 0 },
      description: '',
    };
  }
  
  // Seasonal events make competitors more active
  const seasonalMult = getActiveSeasonalEvents(dayOfYear).length > 0 ? 1.5 : 1.0;
  
  // Choose action based on competitor state
  const actions: Array<{ action: CompetitorAction; weight: number }> = [
    { action: 'major_update', weight: 3 },
    { action: 'marketing_blitz', weight: 2 * seasonalMult },
    { action: 'price_cut', weight: competitor.marketShare < 10 ? 2 : 1 },
    { action: 'collaboration', weight: 1 },
    { action: 'launch_game', weight: 0.5 },
    { action: 'acquire_studio', weight: competitor.marketShare > 20 ? 0.3 : 0.1 },
  ];
  
  // Weight-based selection
  const totalWeight = actions.reduce((sum, a) => sum + a.weight, 0);
  let roll = rng.random() * totalWeight;
  let selectedAction: CompetitorAction = 'none';
  
  for (const a of actions) {
    roll -= a.weight;
    if (roll <= 0) {
      selectedAction = a.action;
      break;
    }
  }
  
  // Calculate impact based on action
  const impact = calculateCompetitorActionImpact(
    selectedAction,
    competitor,
    playerReputation,
    rng
  );
  
  return {
    competitor,
    action: selectedAction,
    impact,
    description: generateActionDescription(competitor, selectedAction),
  };
}

function calculateCompetitorActionImpact(
  action: CompetitorAction,
  competitor: Competitor,
  playerReputation: number,
  rng: IRNGProvider
): CompetitorActionResult['impact'] {
  const baseImpact = competitor.aggressiveness * (competitor.reputation / 100);
  
  switch (action) {
    case 'launch_game':
      return {
        marketShareChange: 1 + rng.random() * 3,
        reputationChange: rng.random() > 0.7 ? 5 : -2,  // Launches can backfire
        playerLossToUs: Math.round(100 * baseImpact * (1 - playerReputation / 100)),
      };
      
    case 'major_update':
      return {
        marketShareChange: 0.5 + rng.random(),
        reputationChange: 2 + rng.random() * 3,
        playerLossToUs: Math.round(50 * baseImpact * (1 - playerReputation / 100)),
      };
      
    case 'marketing_blitz':
      return {
        marketShareChange: rng.random() * 2,
        reputationChange: 0,
        playerLossToUs: Math.round(200 * baseImpact * (1 - playerReputation / 100)),
      };
      
    case 'price_cut':
      return {
        marketShareChange: 0.3 + rng.random() * 0.7,
        reputationChange: -1,  // Can seem desperate
        playerLossToUs: Math.round(75 * baseImpact * (1 - playerReputation / 100)),
      };
      
    case 'collaboration':
      return {
        marketShareChange: 0.5 + rng.random(),
        reputationChange: 3 + rng.random() * 5,
        playerLossToUs: Math.round(30 * baseImpact * (1 - playerReputation / 100)),
      };
      
    case 'acquire_studio':
      return {
        marketShareChange: 2 + rng.random() * 3,
        reputationChange: rng.random() > 0.5 ? 2 : -3,
        playerLossToUs: Math.round(20 * baseImpact),
      };
      
    default:
      return { marketShareChange: 0, reputationChange: 0, playerLossToUs: 0 };
  }
}

function generateActionDescription(competitor: Competitor, action: CompetitorAction): string {
  switch (action) {
    case 'launch_game':
      return `${competitor.name} has launched a new ${competitor.primaryGenre} game!`;
    case 'major_update':
      return `${competitor.name} released a major content update for their flagship game.`;
    case 'marketing_blitz':
      return `${competitor.name} is running an aggressive marketing campaign.`;
    case 'price_cut':
      return `${competitor.name} has slashed prices on in-app purchases.`;
    case 'collaboration':
      return `${competitor.name} announced a collaboration with a popular franchise.`;
    case 'acquire_studio':
      return `${competitor.name} has acquired a smaller game studio.`;
    default:
      return '';
  }
}

/**
 * Updates competitor after their action
 */
export function updateCompetitorAfterAction(
  competitor: Competitor,
  result: CompetitorActionResult
): Competitor {
  return {
    ...competitor,
    marketShare: Math.max(0, Math.min(50, competitor.marketShare + result.impact.marketShareChange)),
    reputation: Math.max(0, Math.min(100, competitor.reputation + result.impact.reputationChange)),
  };
}

// ============================================================================
// MARKET SATURATION
// ============================================================================

export interface MarketSaturationState {
  readonly overallSaturation: number;  // 0-1
  readonly genreSaturation: Record<GameGenre, number>;  // 0-1 per genre
  readonly competitorPressure: number;  // 0-1
}

/**
 * Calculates market saturation levels
 */
export function calculateMarketSaturation(
  market: MarketConditions,
  playerGamesCount: number
): MarketSaturationState {
  // Overall market saturation based on competitor presence
  const totalCompetitorShare = market.competitors.reduce((sum, c) => sum + c.marketShare, 0);
  const overallSaturation = Math.min(1, totalCompetitorShare / 80 + playerGamesCount / 20);
  
  // Genre-specific saturation
  const genres: GameGenre[] = ['rpg', 'action', 'puzzle', 'strategy', 'idle', 'card', 'rhythm'];
  const genreSaturation: Record<GameGenre, number> = {} as Record<GameGenre, number>;
  
  for (const genre of genres) {
    const genreData = market.genrePopularity.find(g => g.genre === genre);
    const competitorsInGenre = market.competitors.filter(c => c.primaryGenre === genre);
    const competitorSaturation = competitorsInGenre.reduce((sum, c) => sum + c.marketShare, 0) / 30;
    const trendPenalty = genreData?.trend === 'declining' ? 0.2 : 0;
    
    genreSaturation[genre] = Math.min(1, competitorSaturation + trendPenalty);
  }
  
  // Competitor pressure (how aggressive the competition is)
  const avgAggressiveness = market.competitors.reduce((sum, c) => sum + c.aggressiveness, 0) / 
    Math.max(1, market.competitors.length);
  const competitorPressure = avgAggressiveness * (totalCompetitorShare / 100);
  
  return {
    overallSaturation,
    genreSaturation,
    competitorPressure,
  };
}

/**
 * Applies saturation penalties to player acquisition
 */
export function applySaturationPenalty(
  baseAcquisition: number,
  saturation: MarketSaturationState,
  genre: GameGenre
): number {
  const genreSat = saturation.genreSaturation[genre] ?? 0.5;
  const overallPenalty = 1 - (saturation.overallSaturation * 0.3);  // Max 30% penalty
  const genrePenalty = 1 - (genreSat * 0.4);  // Max 40% penalty
  const competitorPenalty = 1 - (saturation.competitorPressure * 0.2);  // Max 20% penalty
  
  return Math.round(baseAcquisition * overallPenalty * genrePenalty * competitorPenalty);
}

// ============================================================================
// MARKET TRENDS
// ============================================================================

export interface TrendForecast {
  readonly genre: GameGenre;
  readonly currentPopularity: number;
  readonly predictedChange: number;  // -10 to +10
  readonly confidence: number;  // 0-1
  readonly recommendation: 'invest' | 'maintain' | 'divest';
}

/**
 * Forecasts market trends for strategic planning
 */
export function forecastMarketTrends(
  market: MarketConditions,
  rng: IRNGProvider = defaultRNG
): TrendForecast[] {
  return market.genrePopularity.map(gp => {
    // Base prediction on current trend
    let basePrediction = 0;
    if (gp.trend === 'rising') basePrediction = 3;
    else if (gp.trend === 'declining') basePrediction = -3;
    
    // Add noise
    const noise = (rng.random() - 0.5) * 5;
    const predictedChange = Math.max(-10, Math.min(10, basePrediction + noise));
    
    // Confidence based on volatility (low volatility = high confidence)
    const confidence = 1 - gp.volatility;
    
    // Recommendation
    let recommendation: TrendForecast['recommendation'] = 'maintain';
    if (gp.popularity > 60 && gp.trend === 'rising') recommendation = 'invest';
    else if (gp.popularity < 40 || gp.trend === 'declining') recommendation = 'divest';
    
    return {
      genre: gp.genre,
      currentPopularity: gp.popularity,
      predictedChange,
      confidence,
      recommendation,
    };
  });
}

// ============================================================================
// ENHANCED MARKET SIMULATION
// ============================================================================

export interface EnhancedMarketTick {
  readonly newMarket: MarketConditions;
  readonly competitorActions: CompetitorActionResult[];
  readonly seasonalInfo: {
    readonly season: Season;
    readonly activeEvents: SeasonalEvent[];
    readonly revenueMultiplier: number;
    readonly acquisitionMultiplier: number;
  };
  readonly saturation: MarketSaturationState;
}

/**
 * Enhanced market simulation with all features
 */
export function simulateEnhancedMarketTick(
  market: MarketConditions,
  dayOfYear: number,
  playerReputation: number,
  playerGamesCount: number,
  rng: IRNGProvider = defaultRNG
): EnhancedMarketTick {
  // Get seasonal info
  const season = getSeason(dayOfYear);
  const { revenueMultiplier, acquisitionMultiplier, activeEvents } = calculateSeasonalMultipliers(dayOfYear);
  
  // Simulate competitor actions
  const competitorActions: CompetitorActionResult[] = [];
  const updatedCompetitors = [...market.competitors];
  
  for (let i = 0; i < market.competitors.length; i++) {
    const result = simulateCompetitorAction(
      market.competitors[i],
      market,
      playerReputation,
      dayOfYear,
      rng
    );
    
    if (result.action !== 'none') {
      competitorActions.push(result);
      updatedCompetitors[i] = updateCompetitorAfterAction(market.competitors[i], result);
    }
  }
  
  // Update genre popularity
  const updatedGenres = market.genrePopularity.map(gp => {
    const change = (rng.random() - 0.5) * gp.volatility * 10;
    const newPopularity = Math.max(10, Math.min(100, gp.popularity + change));
    
    let trend: TrendDirection = 'stable';
    if (change > 2) trend = 'rising';
    else if (change < -2) trend = 'declining';
    
    return { ...gp, popularity: newPopularity, trend };
  });
  
  // Calculate saturation
  const saturation = calculateMarketSaturation(
    { ...market, competitors: updatedCompetitors },
    playerGamesCount
  );
  
  // Apply seasonal modifier
  const newEconomicMultiplier = Math.max(0.5, Math.min(1.5,
    market.economicMultiplier + (rng.random() - 0.5) * 0.02
  ));
  
  const newMarket: MarketConditions = {
    ...market,
    date: market.date + 1,
    genrePopularity: updatedGenres,
    competitors: updatedCompetitors,
    economicMultiplier: newEconomicMultiplier,
    seasonalMultiplier: revenueMultiplier,
  };
  
  return {
    newMarket,
    competitorActions,
    seasonalInfo: {
      season,
      activeEvents,
      revenueMultiplier,
      acquisitionMultiplier,
    },
    saturation,
  };
}
