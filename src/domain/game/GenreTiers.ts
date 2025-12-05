/**
 * Genre Tier System
 * 
 * Genres are organized into tiers that unlock as the company grows.
 * Higher tier genres have higher potential but are more demanding.
 */

import { GameGenre } from './Game';

export type GenreTier = 'starter' | 'intermediate' | 'advanced' | 'premium';

export interface GenreConfig {
  readonly genre: GameGenre;
  readonly tier: GenreTier;
  readonly unlockCost: number;
  readonly name: string;
  readonly description: string;
  
  // Development requirements
  readonly baseDevelopmentTime: number;  // Days to complete at 100% team efficiency
  readonly requiredTeamSize: number;     // Minimum recommended team size
  readonly skillRequirements: {
    programming: number;
    art: number;
    game_design: number;
    sound: number;
  };
  
  // Revenue potential
  readonly baseDAU: number;              // Starting daily active users
  readonly maxDAU: number;               // Maximum potential DAU
  readonly baseARPDAU: number;           // Base revenue per user per day
  readonly whalePercentage: number;      // Percentage of users who are whales (0-1)
  readonly whaleMultiplier: number;      // How much more whales spend
  
  // Retention characteristics
  readonly retentionRate: number;        // Daily retention (0.95 = 95%)
  readonly satisfactionDecay: number;    // How fast satisfaction drops
  readonly contentDemand: number;        // How often content updates are needed
  
  // Combination bonuses
  readonly combinesWith: GameGenre[];    // Genres that work well together
}

/**
 * All genre configurations with tier information
 */
export const GENRE_CONFIGS: Record<GameGenre, GenreConfig> = {
  // === STARTER TIER (Free, available immediately) ===
  idle: {
    genre: 'idle',
    tier: 'starter',
    unlockCost: 0,
    name: 'Idle',
    description: 'Simple, low-maintenance games that players check periodically. Easy to develop, steady but modest revenue.',
    baseDevelopmentTime: 30,
    requiredTeamSize: 2,
    skillRequirements: { programming: 30, art: 25, game_design: 35, sound: 15 },
    baseDAU: 800,
    maxDAU: 50000,
    baseARPDAU: 0.05,
    whalePercentage: 0.02,
    whaleMultiplier: 20,
    retentionRate: 0.96,
    satisfactionDecay: 0.08,
    contentDemand: 0.3,
    combinesWith: ['rpg', 'strategy'],
  },
  
  puzzle: {
    genre: 'puzzle',
    tier: 'starter',
    unlockCost: 0,
    name: 'Puzzle',
    description: 'Casual games with broad appeal. Quick development, good retention, steady ad revenue potential.',
    baseDevelopmentTime: 35,
    requiredTeamSize: 2,
    skillRequirements: { programming: 25, art: 35, game_design: 40, sound: 20 },
    baseDAU: 1000,
    maxDAU: 100000,
    baseARPDAU: 0.04,
    whalePercentage: 0.01,
    whaleMultiplier: 15,
    retentionRate: 0.93,
    satisfactionDecay: 0.12,
    contentDemand: 0.5,
    combinesWith: ['idle', 'rhythm'],
  },
  
  // === INTERMEDIATE TIER ===
  card: {
    genre: 'card',
    tier: 'intermediate',
    unlockCost: 50000,
    name: 'Card/TCG',
    description: 'Collectible card games with deep meta. Medium development time, strong whale spending on rare cards.',
    baseDevelopmentTime: 60,
    requiredTeamSize: 4,
    skillRequirements: { programming: 45, art: 50, game_design: 55, sound: 25 },
    baseDAU: 500,
    maxDAU: 200000,
    baseARPDAU: 0.12,
    whalePercentage: 0.05,
    whaleMultiplier: 50,
    retentionRate: 0.91,
    satisfactionDecay: 0.18,
    contentDemand: 0.7,
    combinesWith: ['rpg', 'strategy'],
  },
  
  rhythm: {
    genre: 'rhythm',
    tier: 'intermediate',
    unlockCost: 40000,
    name: 'Rhythm',
    description: 'Music-based games with passionate fanbases. Requires sound expertise, steady revenue from song packs.',
    baseDevelopmentTime: 50,
    requiredTeamSize: 3,
    skillRequirements: { programming: 40, art: 45, game_design: 40, sound: 60 },
    baseDAU: 400,
    maxDAU: 150000,
    baseARPDAU: 0.08,
    whalePercentage: 0.03,
    whaleMultiplier: 30,
    retentionRate: 0.90,
    satisfactionDecay: 0.20,
    contentDemand: 0.8,
    combinesWith: ['idle', 'puzzle'],
  },
  
  // === ADVANCED TIER ===
  action: {
    genre: 'action',
    tier: 'advanced',
    unlockCost: 100000,
    name: 'Action',
    description: 'Fast-paced games with impressive graphics. High development cost but attracts dedicated players.',
    baseDevelopmentTime: 90,
    requiredTeamSize: 6,
    skillRequirements: { programming: 60, art: 70, game_design: 55, sound: 50 },
    baseDAU: 600,
    maxDAU: 500000,
    baseARPDAU: 0.10,
    whalePercentage: 0.04,
    whaleMultiplier: 40,
    retentionRate: 0.88,
    satisfactionDecay: 0.25,
    contentDemand: 0.9,
    combinesWith: ['rpg', 'rhythm'],
  },
  
  strategy: {
    genre: 'strategy',
    tier: 'advanced',
    unlockCost: 80000,
    name: 'Strategy',
    description: 'Deep tactical games with engaged communities. Long development, excellent long-term retention.',
    baseDevelopmentTime: 75,
    requiredTeamSize: 5,
    skillRequirements: { programming: 55, art: 45, game_design: 70, sound: 30 },
    baseDAU: 300,
    maxDAU: 300000,
    baseARPDAU: 0.15,
    whalePercentage: 0.06,
    whaleMultiplier: 60,
    retentionRate: 0.92,
    satisfactionDecay: 0.15,
    contentDemand: 0.6,
    combinesWith: ['card', 'idle'],
  },
  
  // === PREMIUM TIER ===
  rpg: {
    genre: 'rpg',
    tier: 'premium',
    unlockCost: 200000,
    name: 'RPG',
    description: 'Story-rich games with character gacha. Highest development cost but massive whale potential.',
    baseDevelopmentTime: 120,
    requiredTeamSize: 8,
    skillRequirements: { programming: 65, art: 75, game_design: 70, sound: 55 },
    baseDAU: 400,
    maxDAU: 1000000,
    baseARPDAU: 0.18,
    whalePercentage: 0.08,
    whaleMultiplier: 100,
    retentionRate: 0.89,
    satisfactionDecay: 0.22,
    contentDemand: 1.0,
    combinesWith: ['action', 'card', 'idle'],
  },
};

/**
 * Get genres available at a given tier
 */
export function getGenresByTier(tier: GenreTier): GameGenre[] {
  return Object.values(GENRE_CONFIGS)
    .filter(config => config.tier === tier)
    .map(config => config.genre);
}

/**
 * Get all unlocked genres based on what the company has purchased
 */
export function getUnlockedGenres(unlockedGenres: Set<GameGenre>): GameGenre[] {
  // Starter genres are always available
  const starters = getGenresByTier('starter');
  return [...starters, ...Array.from(unlockedGenres)];
}

/**
 * Calculate development time modifier based on team skills vs requirements
 */
export function calculateDevelopmentTimeModifier(
  genre: GameGenre,
  teamSkills: { programming: number; art: number; game_design: number; sound: number }
): number {
  const config = GENRE_CONFIGS[genre];
  const requirements = config.skillRequirements;
  
  // Calculate how well the team meets requirements
  let skillScore = 0;
  skillScore += Math.min(1.5, teamSkills.programming / requirements.programming);
  skillScore += Math.min(1.5, teamSkills.art / requirements.art);
  skillScore += Math.min(1.5, teamSkills.game_design / requirements.game_design);
  skillScore += Math.min(1.5, teamSkills.sound / requirements.sound);
  skillScore /= 4;
  
  // Convert to time modifier (0.5 = twice as fast, 2.0 = twice as slow)
  return 1 / Math.max(0.5, skillScore);
}

/**
 * Calculate revenue with whale consideration
 */
export function calculateRevenueWithWhales(
  genre: GameGenre,
  dau: number,
  qualityFactor: number,
  satisfactionFactor: number
): number {
  const config = GENRE_CONFIGS[genre];
  
  // Split users into regular and whales
  const whaleCount = Math.floor(dau * config.whalePercentage);
  const regularCount = dau - whaleCount;
  
  // Base ARPDAU modified by quality and satisfaction
  const baseRevenue = config.baseARPDAU * (0.6 + qualityFactor * 0.5) * (0.5 + satisfactionFactor * 0.6);
  
  // Regular user revenue
  const regularRevenue = regularCount * baseRevenue;
  
  // Whale revenue (much higher spending)
  const whaleRevenue = whaleCount * baseRevenue * config.whaleMultiplier;
  
  return regularRevenue + whaleRevenue;
}

/**
 * Calculate combination bonus when genres are combined
 */
export function calculateCombinationBonus(primaryGenre: GameGenre, secondaryGenres: GameGenre[]): number {
  const config = GENRE_CONFIGS[primaryGenre];
  let bonus = 1.0;
  
  for (const secondary of secondaryGenres) {
    if (config.combinesWith.includes(secondary)) {
      bonus += 0.15; // 15% bonus per synergistic genre
    } else {
      bonus -= 0.05; // 5% penalty for non-synergistic combinations
    }
  }
  
  return Math.max(0.5, Math.min(1.5, bonus));
}

/**
 * Get tier display info
 */
export const TIER_INFO: Record<GenreTier, { name: string; color: string; description: string }> = {
  starter: {
    name: 'Starter',
    color: 'text-gray-400',
    description: 'Basic genres available to all companies',
  },
  intermediate: {
    name: 'Intermediate', 
    color: 'text-green-400',
    description: 'Unlocked genres with better revenue potential',
  },
  advanced: {
    name: 'Advanced',
    color: 'text-blue-400', 
    description: 'Premium genres requiring significant investment',
  },
  premium: {
    name: 'Premium',
    color: 'text-purple-400',
    description: 'Top-tier genres with massive whale potential',
  },
};
