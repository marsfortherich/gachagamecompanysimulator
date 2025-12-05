import { Entity, EntityId, generateId } from '../shared';

/**
 * Game genre types
 */
export type GameGenre = 
  | 'rpg'
  | 'action'
  | 'puzzle'
  | 'strategy'
  | 'idle'
  | 'card'
  | 'rhythm';

/**
 * Game development status
 */
export type GameStatus = 
  | 'planning'
  | 'development'
  | 'testing'
  | 'soft_launch'
  | 'live'
  | 'maintenance'
  | 'shutdown';

/**
 * Game quality metrics (0-100 scale)
 */
export interface GameQuality {
  readonly graphics: number;
  readonly gameplay: number;
  readonly story: number;
  readonly sound: number;
  readonly polish: number;
}

/**
 * Game monetization metrics
 */
export interface GameMonetization {
  readonly gachaRates: GachaRates;
  readonly dailyActiveUsers: number;
  readonly monthlyRevenue: number;
  readonly playerSatisfaction: number;  // 0-100
}

/**
 * Gacha pull rates for different rarities
 */
export interface GachaRates {
  readonly common: number;      // e.g., 0.70 = 70%
  readonly uncommon: number;    // e.g., 0.20 = 20%
  readonly rare: number;        // e.g., 0.07 = 7%
  readonly epic: number;        // e.g., 0.025 = 2.5%
  readonly legendary: number;   // e.g., 0.005 = 0.5%
}

/**
 * Represents a game being developed or operated
 */
export interface Game extends Entity {
  readonly name: string;
  readonly genre: GameGenre;
  readonly status: GameStatus;
  readonly quality: GameQuality;
  readonly monetization: GameMonetization;
  readonly developmentProgress: number;  // 0-100
  readonly startDate: number;            // Game tick when started
  readonly launchDate: number | null;    // Game tick when launched
  readonly assignedEmployees: EntityId[];
}

/**
 * Parameters for creating a new game
 */
export interface CreateGameParams {
  name: string;
  genre: GameGenre;
  startDate: number;
}

/**
 * Creates default gacha rates (industry standard-ish)
 */
export function createDefaultGachaRates(): GachaRates {
  return {
    common: 0.60,
    uncommon: 0.25,
    rare: 0.10,
    epic: 0.04,
    legendary: 0.01,
  };
}

/**
 * Creates default quality metrics
 */
export function createDefaultQuality(): GameQuality {
  return {
    graphics: 0,
    gameplay: 0,
    story: 0,
    sound: 0,
    polish: 0,
  };
}

/**
 * Creates default monetization metrics
 */
export function createDefaultMonetization(): GameMonetization {
  return {
    gachaRates: createDefaultGachaRates(),
    dailyActiveUsers: 0,
    monthlyRevenue: 0,
    playerSatisfaction: 50,
  };
}

/**
 * Creates a new game project
 */
export function createGame(params: CreateGameParams): Game {
  return {
    id: generateId(),
    name: params.name,
    genre: params.genre,
    status: 'planning',
    quality: createDefaultQuality(),
    monetization: createDefaultMonetization(),
    developmentProgress: 0,
    startDate: params.startDate,
    launchDate: null,
    assignedEmployees: [],
  };
}

/**
 * Calculates overall game quality score
 */
export function calculateOverallQuality(quality: GameQuality): number {
  const weights = {
    graphics: 0.2,
    gameplay: 0.35,
    story: 0.2,
    sound: 0.1,
    polish: 0.15,
  };

  return (
    quality.graphics * weights.graphics +
    quality.gameplay * weights.gameplay +
    quality.story * weights.story +
    quality.sound * weights.sound +
    quality.polish * weights.polish
  );
}

/**
 * Updates game development progress
 */
export function updateProgress(game: Game, amount: number): Game {
  return {
    ...game,
    developmentProgress: Math.max(0, Math.min(100, game.developmentProgress + amount)),
  };
}

/**
 * Updates game status
 */
export function updateGameStatus(game: Game, status: GameStatus, currentTick?: number): Game {
  return {
    ...game,
    status,
    launchDate: status === 'live' && !game.launchDate ? (currentTick ?? null) : game.launchDate,
  };
}

/**
 * Updates game quality metrics
 */
export function updateQuality(game: Game, qualityUpdates: Partial<GameQuality>): Game {
  const newQuality = { ...game.quality };
  
  for (const [key, value] of Object.entries(qualityUpdates)) {
    const k = key as keyof GameQuality;
    newQuality[k] = Math.max(0, Math.min(100, value));
  }
  
  return {
    ...game,
    quality: newQuality,
  };
}

/**
 * Assigns employees to a game
 */
export function assignEmployees(game: Game, employeeIds: EntityId[]): Game {
  return {
    ...game,
    assignedEmployees: [...new Set([...game.assignedEmployees, ...employeeIds])],
  };
}

/**
 * Removes employees from a game
 */
export function removeEmployees(game: Game, employeeIds: EntityId[]): Game {
  const removeSet = new Set(employeeIds);
  return {
    ...game,
    assignedEmployees: game.assignedEmployees.filter(id => !removeSet.has(id)),
  };
}

/**
 * Validates that gacha rates sum to 1.0
 */
export function validateGachaRates(rates: GachaRates): boolean {
  const sum = rates.common + rates.uncommon + rates.rare + rates.epic + rates.legendary;
  return Math.abs(sum - 1.0) < 0.001;
}

/**
 * Updates gacha rates for a game
 */
export function updateGachaRates(game: Game, rates: GachaRates): Game | null {
  if (!validateGachaRates(rates)) {
    return null;
  }
  
  return {
    ...game,
    monetization: {
      ...game.monetization,
      gachaRates: rates,
    },
  };
}

/**
 * Updates monetization metrics for a game
 */
export function updateMonetization(game: Game, updates: Partial<GameMonetization>): Game {
  return {
    ...game,
    monetization: {
      ...game.monetization,
      ...updates,
    },
  };
}

// =============================================================================
// Live Game Simulation
// =============================================================================

/**
 * Genre-specific multipliers for various metrics
 */
export const GENRE_MODIFIERS: Record<GameGenre, {
  baseDAU: number;           // Starting DAU when game launches
  growthRate: number;        // How fast DAU grows
  retentionRate: number;     // Daily retention (1 = 100%)
  arpdau: number;            // Average revenue per DAU per day
  satisfactionDecay: number; // How fast satisfaction drops without updates
}> = {
  idle: { baseDAU: 500, growthRate: 1.2, retentionRate: 0.95, arpdau: 0.03, satisfactionDecay: 0.1 },
  puzzle: { baseDAU: 400, growthRate: 1.15, retentionRate: 0.92, arpdau: 0.04, satisfactionDecay: 0.15 },
  card: { baseDAU: 300, growthRate: 1.1, retentionRate: 0.90, arpdau: 0.08, satisfactionDecay: 0.2 },
  rpg: { baseDAU: 200, growthRate: 1.08, retentionRate: 0.88, arpdau: 0.10, satisfactionDecay: 0.25 },
  strategy: { baseDAU: 150, growthRate: 1.05, retentionRate: 0.85, arpdau: 0.12, satisfactionDecay: 0.2 },
  action: { baseDAU: 250, growthRate: 1.12, retentionRate: 0.87, arpdau: 0.06, satisfactionDecay: 0.3 },
  rhythm: { baseDAU: 180, growthRate: 1.1, retentionRate: 0.89, arpdau: 0.07, satisfactionDecay: 0.25 },
};

/**
 * Configuration for live game simulation
 */
export interface LiveGameConfig {
  companyReputation: number;  // 0-100
  hasMarketer: boolean;       // Is there a marketer assigned?
  daysSinceLaunch: number;    // Days since the game went live
  marketingBudget?: number;   // Optional daily marketing spend
}

/**
 * Result of simulating one day for a live game
 */
export interface LiveGameTickResult {
  game: Game;
  dailyRevenue: number;
  newUsers: number;
  churnedUsers: number;
}

/**
 * Simulates one day of a live game's operation
 * 
 * Factors affecting DAU growth:
 * - Game quality (higher quality = more organic growth)
 * - Company reputation (better rep = more visibility)
 * - Genre (some genres attract more users)
 * - Time since launch (initial boost, then stabilizes)
 * - Player satisfaction (unhappy players leave faster)
 * 
 * Factors affecting revenue:
 * - DAU (more users = more potential spenders)
 * - ARPDAU (revenue per user, affected by genre and gacha rates)
 * - Game quality (higher quality = users spend more)
 * - Player satisfaction (satisfied players spend more)
 */
export function simulateLiveGameTick(
  game: Game,
  config: LiveGameConfig
): LiveGameTickResult {
  if (game.status !== 'live') {
    return { game, dailyRevenue: 0, newUsers: 0, churnedUsers: 0 };
  }

  const genreMod = GENRE_MODIFIERS[game.genre];
  const overallQuality = calculateOverallQuality(game.quality);
  const qualityFactor = overallQuality / 100; // 0-1
  const reputationFactor = config.companyReputation / 100; // 0-1
  const satisfactionFactor = game.monetization.playerSatisfaction / 100; // 0-1

  // === Calculate new user acquisition ===
  // Base new users depends on genre and quality
  let baseNewUsers = genreMod.baseDAU * 0.1; // 10% of base DAU per day initially
  
  // Quality boost (high quality games attract more users)
  baseNewUsers *= (0.5 + qualityFactor);
  
  // Reputation boost (well-known companies get more visibility)
  baseNewUsers *= (0.5 + reputationFactor * 0.5);
  
  // Launch boost (more users in first 30 days, then tapers off)
  const launchBoost = config.daysSinceLaunch < 30 
    ? 2.0 - (config.daysSinceLaunch / 30) 
    : 1.0;
  baseNewUsers *= launchBoost;
  
  // Marketer boost
  if (config.hasMarketer) {
    baseNewUsers *= 1.5;
  }
  
  // Word of mouth (satisfied players bring friends)
  baseNewUsers *= (0.8 + satisfactionFactor * 0.4);
  
  // Add some randomness (±20%)
  const variance = 0.8 + Math.random() * 0.4;
  const newUsers = Math.round(baseNewUsers * variance);

  // === Calculate user churn ===
  const currentDAU = game.monetization.dailyActiveUsers;
  
  // Base retention from genre
  let retentionRate = genreMod.retentionRate;
  
  // Quality affects retention (poor quality = more churn)
  retentionRate *= (0.9 + qualityFactor * 0.1);
  
  // Satisfaction affects retention significantly
  retentionRate *= (0.8 + satisfactionFactor * 0.2);
  
  // Calculate churned users
  const churnRate = 1 - retentionRate;
  const churnedUsers = Math.round(currentDAU * churnRate);

  // === Calculate new DAU ===
  const newDAU = Math.max(0, currentDAU + newUsers - churnedUsers);

  // === Calculate daily revenue ===
  // Base ARPDAU from genre
  let arpdau = genreMod.arpdau;
  
  // Quality affects willingness to spend
  arpdau *= (0.7 + qualityFactor * 0.6);
  
  // Satisfaction affects spending (happy players spend more)
  arpdau *= (0.6 + satisfactionFactor * 0.8);
  
  // Gacha rates affect spending (more generous = less per-user but happier users)
  // High legendary rate = players need to spend less
  const gachaGenerosity = game.monetization.gachaRates.legendary * 50; // 0.01 * 50 = 0.5
  arpdau *= (0.8 + (1 - gachaGenerosity) * 0.4);
  
  const dailyRevenue = Math.round(newDAU * arpdau * 100) / 100;

  // === Update player satisfaction ===
  // Satisfaction naturally decays without content updates
  let newSatisfaction = game.monetization.playerSatisfaction;
  newSatisfaction -= genreMod.satisfactionDecay;
  
  // High quality slows decay
  newSatisfaction += qualityFactor * 0.05;
  
  // Clamp to 0-100
  newSatisfaction = Math.max(0, Math.min(100, newSatisfaction));

  // === Create updated game ===
  const updatedGame = updateMonetization(game, {
    dailyActiveUsers: newDAU,
    monthlyRevenue: dailyRevenue * 30, // Estimated monthly based on today
    playerSatisfaction: newSatisfaction,
  });

  return {
    game: updatedGame,
    dailyRevenue,
    newUsers,
    churnedUsers,
  };
}

/**
 * Initialize a game when it first goes live
 * Sets initial DAU based on quality and company reputation
 */
export function initializeLiveGame(game: Game, companyReputation: number): Game {
  if (game.status !== 'live') return game;
  
  const genreMod = GENRE_MODIFIERS[game.genre];
  const overallQuality = calculateOverallQuality(game.quality);
  const qualityFactor = overallQuality / 100;
  const reputationFactor = companyReputation / 100;
  
  // Initial DAU based on genre, quality, and reputation
  const initialDAU = Math.round(
    genreMod.baseDAU * 
    (0.5 + qualityFactor) * 
    (0.5 + reputationFactor * 0.5)
  );
  
  return updateMonetization(game, {
    dailyActiveUsers: initialDAU,
    playerSatisfaction: 50 + Math.round(qualityFactor * 30), // Start at 50-80 based on quality
  });
}
