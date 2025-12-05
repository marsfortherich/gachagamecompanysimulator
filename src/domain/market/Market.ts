import { Entity, generateId } from '../shared';
import { GameGenre } from '../game';

/**
 * Market trend direction
 */
export type TrendDirection = 'rising' | 'stable' | 'declining';

/**
 * Genre popularity in the market
 */
export interface GenrePopularity {
  readonly genre: GameGenre;
  readonly popularity: number;      // 0-100 scale
  readonly trend: TrendDirection;
  readonly volatility: number;      // How quickly it changes (0-1)
}

/**
 * Represents a competing game company in the market
 */
export interface Competitor extends Entity {
  readonly name: string;
  readonly marketShare: number;     // 0-100 percentage
  readonly reputation: number;      // 0-100
  readonly primaryGenre: GameGenre;
  readonly aggressiveness: number;  // 0-1 (how likely to compete)
}

/**
 * Player segment in the market
 */
export type PlayerSegment = 'whale' | 'dolphin' | 'minnow' | 'free_to_play';

/**
 * Player behavior patterns
 */
export interface PlayerBehavior {
  readonly segment: PlayerSegment;
  readonly spendingPower: number;       // Average $ spent per month
  readonly retentionRate: number;       // 0-1 probability to stay
  readonly gachaAppetite: number;       // 0-1 willingness to pull gacha
  readonly qualitySensitivity: number;  // 0-1 how much quality matters
  readonly populationPercent: number;   // % of total players in this segment
}

/**
 * Market conditions at a point in time
 */
export interface MarketConditions extends Entity {
  readonly date: number;                      // Game tick
  readonly totalMarketSize: number;           // Total players in market
  readonly genrePopularity: GenrePopularity[];
  readonly playerBehaviors: PlayerBehavior[];
  readonly competitors: Competitor[];
  readonly economicMultiplier: number;        // 0.5-1.5 affects spending
  readonly seasonalMultiplier: number;        // 0.8-1.3 seasonal effects
}

/**
 * Market event that can occur
 */
export type MarketEventType =
  | 'genre_boom'           // A genre becomes very popular
  | 'genre_bust'           // A genre falls out of favor
  | 'competitor_launch'    // Competitor launches a game
  | 'competitor_shutdown'  // Competitor shuts down
  | 'economic_boom'        // Players spend more
  | 'economic_recession'   // Players spend less
  | 'viral_moment'         // Random popularity boost chance
  | 'scandal'              // Industry scandal affects trust
  | 'regulation_change';   // New gacha regulations

/**
 * Random market event
 */
export interface MarketEvent extends Entity {
  readonly type: MarketEventType;
  readonly title: string;
  readonly description: string;
  readonly startDate: number;
  readonly duration: number;          // In game ticks
  readonly affectedGenres: GameGenre[];
  readonly impactMultiplier: number;  // How strong the effect is
}

/**
 * Creates default player behavior segments
 */
export function createDefaultPlayerBehaviors(): PlayerBehavior[] {
  return [
    {
      segment: 'whale',
      spendingPower: 500,
      retentionRate: 0.95,
      gachaAppetite: 0.95,
      qualitySensitivity: 0.7,
      populationPercent: 2,
    },
    {
      segment: 'dolphin',
      spendingPower: 50,
      retentionRate: 0.80,
      gachaAppetite: 0.70,
      qualitySensitivity: 0.8,
      populationPercent: 15,
    },
    {
      segment: 'minnow',
      spendingPower: 10,
      retentionRate: 0.60,
      gachaAppetite: 0.40,
      qualitySensitivity: 0.85,
      populationPercent: 30,
    },
    {
      segment: 'free_to_play',
      spendingPower: 0,
      retentionRate: 0.30,
      gachaAppetite: 0.10,
      qualitySensitivity: 0.9,
      populationPercent: 53,
    },
  ];
}

/**
 * Creates initial market conditions
 */
export function createInitialMarket(currentTick: number): MarketConditions {
  const genres: GameGenre[] = ['rpg', 'action', 'puzzle', 'strategy', 'idle', 'card', 'rhythm'];
  
  return {
    id: generateId(),
    date: currentTick,
    totalMarketSize: 10000000,  // 10M potential players
    genrePopularity: genres.map(genre => ({
      genre,
      popularity: 40 + Math.random() * 30,  // 40-70 initial
      trend: 'stable' as TrendDirection,
      volatility: 0.1 + Math.random() * 0.2,
    })),
    playerBehaviors: createDefaultPlayerBehaviors(),
    competitors: createInitialCompetitors(),
    economicMultiplier: 1.0,
    seasonalMultiplier: 1.0,
  };
}

/**
 * Creates initial competitor companies
 */
function createInitialCompetitors(): Competitor[] {
  return [
    {
      id: generateId(),
      name: 'MegaGacha Corp',
      marketShare: 25,
      reputation: 70,
      primaryGenre: 'rpg',
      aggressiveness: 0.7,
    },
    {
      id: generateId(),
      name: 'CasualPlay Studios',
      marketShare: 15,
      reputation: 60,
      primaryGenre: 'puzzle',
      aggressiveness: 0.4,
    },
    {
      id: generateId(),
      name: 'CardMaster Games',
      marketShare: 10,
      reputation: 75,
      primaryGenre: 'card',
      aggressiveness: 0.5,
    },
    {
      id: generateId(),
      name: 'IdleEmpire Inc',
      marketShare: 8,
      reputation: 55,
      primaryGenre: 'idle',
      aggressiveness: 0.3,
    },
  ];
}

/**
 * Simulates market changes over time
 */
export function simulateMarketTick(market: MarketConditions): MarketConditions {
  // Update genre popularity with random fluctuation
  const updatedGenres = market.genrePopularity.map(gp => {
    const change = (Math.random() - 0.5) * gp.volatility * 10;
    const newPopularity = Math.max(10, Math.min(100, gp.popularity + change));
    
    let trend: TrendDirection = 'stable';
    if (change > 2) trend = 'rising';
    else if (change < -2) trend = 'declining';
    
    return {
      ...gp,
      popularity: newPopularity,
      trend,
    };
  });

  // Small random economic fluctuation
  const economicChange = (Math.random() - 0.5) * 0.02;
  const newEconomicMultiplier = Math.max(0.5, Math.min(1.5, 
    market.economicMultiplier + economicChange
  ));

  return {
    ...market,
    date: market.date + 1,
    genrePopularity: updatedGenres,
    economicMultiplier: newEconomicMultiplier,
  };
}

/**
 * Calculates potential player acquisition for a game
 */
export function calculatePlayerAcquisition(
  market: MarketConditions,
  genre: GameGenre,
  qualityScore: number,
  marketingSpend: number
): number {
  const genreData = market.genrePopularity.find(g => g.genre === genre);
  if (!genreData) return 0;

  const baseAcquisition = market.totalMarketSize * 0.0001;  // 0.01% base
  const genreMultiplier = genreData.popularity / 50;        // 0-2x based on popularity
  const qualityMultiplier = 0.5 + (qualityScore / 100);     // 0.5-1.5x
  const marketingMultiplier = 1 + Math.log10(1 + marketingSpend / 1000); // Diminishing returns

  return Math.round(
    baseAcquisition * 
    genreMultiplier * 
    qualityMultiplier * 
    marketingMultiplier * 
    market.economicMultiplier
  );
}

/**
 * Calculates expected revenue based on player segments
 */
export function calculateExpectedRevenue(
  playerCount: number,
  behaviors: PlayerBehavior[],
  gachaGenerosity: number  // 0-1, higher = more player-friendly rates
): number {
  let totalRevenue = 0;

  for (const behavior of behaviors) {
    const segmentPlayers = playerCount * (behavior.populationPercent / 100);
    const willingnessFactor = behavior.gachaAppetite * (1 + gachaGenerosity * 0.3);
    const segmentRevenue = segmentPlayers * behavior.spendingPower * willingnessFactor;
    totalRevenue += segmentRevenue;
  }

  return Math.round(totalRevenue);
}
