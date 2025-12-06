/**
 * Achievement System - Prompt 7.2
 * 
 * Comprehensive achievement system with 50+ achievements across categories.
 */

// =============================================================================
// Types
// =============================================================================

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type AchievementCategory =
  | 'financial'
  | 'games'
  | 'employees'
  | 'gacha'
  | 'ethical'
  | 'market'
  | 'hidden'
  | 'speedrun'
  | 'challenge';

export interface AchievementCondition {
  type: string;
  threshold?: number;
  comparison?: 'gte' | 'lte' | 'eq' | 'gt' | 'lt';
  customCheck?: string; // Name of custom check function
}

export interface AchievementReward {
  reputationBonus?: number;
  moneyBonus?: number;
  unlocks?: string[];
  title?: string; // Display title unlock
  cosmetic?: string; // Cosmetic unlock ID
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  category: AchievementCategory;
  condition: AchievementCondition;
  reward?: AchievementReward;
  hidden: boolean;
  order: number; // Sort order within category
}

export interface AchievementProgress {
  achievementId: string;
  currentValue: number;
  targetValue: number;
  percentage: number;
  unlockedAt: number | null;
}

export interface AchievementState {
  unlocked: Record<string, number>; // achievementId -> timestamp
  progress: Record<string, number>; // achievementId -> current value
  favorites: string[];
  totalPoints: number;
}

// =============================================================================
// Rarity Configuration
// =============================================================================

export interface AchievementRarityConfig {
  color: string;
  bgColor: string;
  borderColor: string;
  points: number;
}

export const ACHIEVEMENT_RARITY_CONFIG: Record<AchievementRarity, AchievementRarityConfig> = {
  common: {
    color: 'text-gray-400',
    bgColor: 'bg-gray-600',
    borderColor: 'border-gray-500',
    points: 10,
  },
  rare: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-600',
    borderColor: 'border-blue-500',
    points: 25,
  },
  epic: {
    color: 'text-purple-400',
    bgColor: 'bg-purple-600',
    borderColor: 'border-purple-500',
    points: 50,
  },
  legendary: {
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-600',
    borderColor: 'border-yellow-500',
    points: 100,
  },
};

// =============================================================================
// Achievement Definitions (50+ achievements)
// =============================================================================

export const ACHIEVEMENTS: Achievement[] = [
  // =========================================================================
  // FINANCIAL ACHIEVEMENTS (10)
  // =========================================================================
  {
    id: 'first_dollar',
    name: 'First Dollar',
    description: 'Earn your first $1 in revenue',
    icon: 'money',
    rarity: 'common',
    category: 'financial',
    condition: { type: 'totalRevenue', threshold: 1 },
    hidden: false,
    order: 1,
  },
  {
    id: 'first_thousand',
    name: 'Getting Started',
    description: 'Earn $1,000 total revenue',
    icon: 'money',
    rarity: 'common',
    category: 'financial',
    condition: { type: 'totalRevenue', threshold: 1000 },
    hidden: false,
    order: 2,
  },
  {
    id: 'first_million',
    name: 'Millionaire',
    description: 'Earn $1,000,000 total revenue',
    icon: 'money',
    rarity: 'rare',
    category: 'financial',
    condition: { type: 'totalRevenue', threshold: 1000000 },
    reward: { reputationBonus: 5, unlocks: ['premium_office'] },
    hidden: false,
    order: 3,
  },
  {
    id: 'billionaire',
    name: 'Billionaire',
    description: 'Earn $1,000,000,000 total revenue',
    icon: 'gem',
    rarity: 'legendary',
    category: 'financial',
    condition: { type: 'totalRevenue', threshold: 1000000000 },
    reward: { reputationBonus: 20, title: 'Gacha Mogul' },
    hidden: false,
    order: 4,
  },
  {
    id: 'profit_margins',
    name: 'Efficient Operations',
    description: 'Maintain 50% profit margins for 30 days',
    icon: 'chart-up',
    rarity: 'rare',
    category: 'financial',
    condition: { type: 'profitMarginStreak', threshold: 30 },
    hidden: false,
    order: 5,
  },
  {
    id: 'no_debt',
    name: 'Debt Free',
    description: 'Never go into debt for 100 days',
    icon: 'check',
    rarity: 'rare',
    category: 'financial',
    condition: { type: 'debtFreeStreak', threshold: 100 },
    hidden: false,
    order: 6,
  },
  {
    id: 'big_spender',
    name: 'Big Spender',
    description: 'Spend $100,000 in a single day',
    icon: 'shop',
    rarity: 'rare',
    category: 'financial',
    condition: { type: 'dailyExpenses', threshold: 100000 },
    hidden: false,
    order: 7,
  },
  {
    id: 'passive_income',
    name: 'Passive Income',
    description: 'Earn $10,000/day from a single game',
    icon: 'bank',
    rarity: 'epic',
    category: 'financial',
    condition: { type: 'singleGameDailyRevenue', threshold: 10000 },
    hidden: false,
    order: 8,
  },
  {
    id: 'diversified_portfolio',
    name: 'Diversified Portfolio',
    description: 'Have 5 games generating revenue simultaneously',
    icon: 'chart-up',
    rarity: 'epic',
    category: 'financial',
    condition: { type: 'revenueGeneratingGames', threshold: 5 },
    hidden: false,
    order: 9,
  },
  {
    id: 'cash_reserves',
    name: 'Rainy Day Fund',
    description: 'Have $10,000,000 in cash reserves',
    icon: 'atm',
    rarity: 'epic',
    category: 'financial',
    condition: { type: 'currentFunds', threshold: 10000000 },
    hidden: false,
    order: 10,
  },

  // =========================================================================
  // GAMES ACHIEVEMENTS (10)
  // =========================================================================
  {
    id: 'first_game',
    name: 'Hello World',
    description: 'Start your first game project',
    icon: 'games',
    rarity: 'common',
    category: 'games',
    condition: { type: 'gamesStarted', threshold: 1 },
    hidden: false,
    order: 1,
  },
  {
    id: 'first_launch',
    name: 'Launch Day',
    description: 'Launch your first game',
    icon: 'rocket',
    rarity: 'common',
    category: 'games',
    condition: { type: 'gamesLaunched', threshold: 1 },
    hidden: false,
    order: 2,
  },
  {
    id: 'game_factory',
    name: 'Game Factory',
    description: 'Launch 10 games',
    icon: 'factory',
    rarity: 'rare',
    category: 'games',
    condition: { type: 'gamesLaunched', threshold: 10 },
    hidden: false,
    order: 3,
  },
  {
    id: 'quality_over_quantity',
    name: 'Quality Over Quantity',
    description: 'Launch a game with 90+ quality rating',
    icon: 'star',
    rarity: 'rare',
    category: 'games',
    condition: { type: 'maxGameQuality', threshold: 90 },
    hidden: false,
    order: 4,
  },
  {
    id: 'masterpiece',
    name: 'Masterpiece',
    description: 'Launch a game with 100 quality rating',
    icon: 'trophy',
    rarity: 'legendary',
    category: 'games',
    condition: { type: 'maxGameQuality', threshold: 100 },
    reward: { reputationBonus: 15, title: 'Master Developer' },
    hidden: false,
    order: 5,
  },
  {
    id: 'genre_master',
    name: 'Genre Master',
    description: 'Launch games in 5 different genres',
    icon: 'target',
    rarity: 'rare',
    category: 'games',
    condition: { type: 'uniqueGenres', threshold: 5 },
    hidden: false,
    order: 6,
  },
  {
    id: 'all_genres',
    name: 'Renaissance Developer',
    description: 'Launch games in all available genres',
    icon: 'palette',
    rarity: 'epic',
    category: 'games',
    condition: { type: 'uniqueGenres', threshold: 7 },
    reward: { unlocks: ['secret_genre'] },
    hidden: false,
    order: 7,
  },
  {
    id: 'viral_hit',
    name: 'Viral Hit',
    description: 'Have a game reach 1 million downloads',
    icon: 'phone',
    rarity: 'epic',
    category: 'games',
    condition: { type: 'maxGameDownloads', threshold: 1000000 },
    hidden: false,
    order: 8,
  },
  {
    id: 'long_runner',
    name: 'Long Runner',
    description: 'Keep a game live for 365 days',
    icon: 'calendar',
    rarity: 'epic',
    category: 'games',
    condition: { type: 'longestGameDays', threshold: 365 },
    hidden: false,
    order: 9,
  },
  {
    id: 'simultaneous_dev',
    name: 'Multitasker',
    description: 'Have 5 games in development at once',
    icon: 'refresh',
    rarity: 'rare',
    category: 'games',
    condition: { type: 'gamesInDevelopment', threshold: 5 },
    hidden: false,
    order: 10,
  },

  // =========================================================================
  // EMPLOYEES ACHIEVEMENTS (10)
  // =========================================================================
  {
    id: 'first_hire',
    name: 'First Hire',
    description: 'Hire your first employee',
    icon: 'character',
    rarity: 'common',
    category: 'employees',
    condition: { type: 'employeesHired', threshold: 1 },
    hidden: false,
    order: 1,
  },
  {
    id: 'small_team',
    name: 'Small Team',
    description: 'Have 10 employees',
    icon: 'users',
    rarity: 'common',
    category: 'employees',
    condition: { type: 'currentEmployees', threshold: 10 },
    hidden: false,
    order: 2,
  },
  {
    id: 'big_company',
    name: 'Big Company',
    description: 'Have 50 employees',
    icon: 'building',
    rarity: 'rare',
    category: 'employees',
    condition: { type: 'currentEmployees', threshold: 50 },
    hidden: false,
    order: 3,
  },
  {
    id: 'mega_corp',
    name: 'Mega Corporation',
    description: 'Have 100 employees',
    icon: 'cityscape',
    rarity: 'epic',
    category: 'employees',
    condition: { type: 'currentEmployees', threshold: 100 },
    hidden: false,
    order: 4,
  },
  {
    id: 'max_skill',
    name: 'Master of Craft',
    description: 'Have an employee with 100 in any skill',
    icon: 'dumbbell',
    rarity: 'epic',
    category: 'employees',
    condition: { type: 'maxEmployeeSkill', threshold: 100 },
    hidden: false,
    order: 5,
  },
  {
    id: 'all_roles',
    name: 'Complete Team',
    description: 'Have employees in all role types',
    icon: 'artist',
    rarity: 'rare',
    category: 'employees',
    condition: { type: 'uniqueRoles', threshold: 5 },
    hidden: false,
    order: 6,
  },
  {
    id: 'happy_team',
    name: 'Happy Team',
    description: 'All employees have 90+ morale',
    icon: 'happy',
    rarity: 'rare',
    category: 'employees',
    condition: { type: 'minTeamMorale', threshold: 90 },
    hidden: false,
    order: 7,
  },
  {
    id: 'no_turnover',
    name: 'Loyalty',
    description: 'Go 180 days without anyone quitting',
    icon: 'handshake',
    rarity: 'epic',
    category: 'employees',
    condition: { type: 'noQuitStreak', threshold: 180 },
    hidden: false,
    order: 8,
  },
  {
    id: 'training_complete',
    name: 'Training Complete',
    description: 'Train 20 employees',
    icon: 'book',
    rarity: 'rare',
    category: 'employees',
    condition: { type: 'employeesTrained', threshold: 20 },
    hidden: false,
    order: 9,
  },
  {
    id: 'legendary_employee',
    name: 'Legendary Talent',
    description: 'Have a legendary rarity employee',
    icon: 'star',
    rarity: 'epic',
    category: 'employees',
    condition: { type: 'legendaryEmployees', threshold: 1 },
    hidden: false,
    order: 10,
  },

  // =========================================================================
  // GACHA ACHIEVEMENTS (10)
  // =========================================================================
  {
    id: 'first_pull',
    name: 'First Pull',
    description: 'Perform your first gacha pull',
    icon: 'casino',
    rarity: 'common',
    category: 'gacha',
    condition: { type: 'totalPulls', threshold: 1 },
    hidden: false,
    order: 1,
  },
  {
    id: 'gacha_addict',
    name: 'Gacha Enthusiast',
    description: 'Perform 100 gacha pulls',
    icon: 'dice',
    rarity: 'common',
    category: 'gacha',
    condition: { type: 'totalPulls', threshold: 100 },
    hidden: false,
    order: 2,
  },
  {
    id: 'whale',
    name: 'Whale',
    description: 'Perform 1000 gacha pulls',
    icon: 'whale',
    rarity: 'rare',
    category: 'gacha',
    condition: { type: 'totalPulls', threshold: 1000 },
    hidden: false,
    order: 3,
  },
  {
    id: 'first_legendary',
    name: 'Jackpot!',
    description: 'Pull a legendary employee',
    icon: 'star',
    rarity: 'rare',
    category: 'gacha',
    condition: { type: 'legendaryPulls', threshold: 1 },
    hidden: false,
    order: 4,
  },
  {
    id: 'pity_breaker',
    name: 'Pity System',
    description: 'Hit pity for the first time',
    icon: 'broken-heart',
    rarity: 'common',
    category: 'gacha',
    condition: { type: 'pityHits', threshold: 1 },
    hidden: false,
    order: 5,
  },
  {
    id: 'lucky_streak',
    name: 'Lucky Streak',
    description: 'Pull 3 rare+ employees in a row',
    icon: 'clover',
    rarity: 'rare',
    category: 'gacha',
    condition: { type: 'rareStreak', threshold: 3 },
    hidden: false,
    order: 6,
  },
  {
    id: 'full_collection',
    name: 'Collector',
    description: 'Collect 50 unique employees',
    icon: 'story',
    rarity: 'epic',
    category: 'gacha',
    condition: { type: 'uniqueEmployeesCollected', threshold: 50 },
    hidden: false,
    order: 7,
  },
  {
    id: 'dupe_city',
    name: 'Dupe City',
    description: 'Pull 10 duplicate employees',
    icon: 'twins',
    rarity: 'common',
    category: 'gacha',
    condition: { type: 'duplicatePulls', threshold: 10 },
    hidden: false,
    order: 8,
  },
  {
    id: 'ten_pull',
    name: 'Ten Pull',
    description: 'Perform a 10-pull',
    icon: 'ten',
    rarity: 'common',
    category: 'gacha',
    condition: { type: 'tenPulls', threshold: 1 },
    hidden: false,
    order: 9,
  },
  {
    id: 'all_legendary',
    name: 'Complete Legendary Set',
    description: 'Collect all legendary employees',
    icon: 'crown',
    rarity: 'legendary',
    category: 'gacha',
    condition: { type: 'allLegendaries', threshold: 1 },
    reward: { title: 'Gacha Master', reputationBonus: 25 },
    hidden: false,
    order: 10,
  },

  // =========================================================================
  // ETHICAL ACHIEVEMENTS (5)
  // =========================================================================
  {
    id: 'fair_rates',
    name: 'Fair Play',
    description: 'Maintain 3%+ legendary drop rate for 30 days',
    icon: 'balance',
    rarity: 'rare',
    category: 'ethical',
    condition: { type: 'fairRatesStreak', threshold: 30 },
    reward: { reputationBonus: 10 },
    hidden: false,
    order: 1,
  },
  {
    id: 'no_predatory',
    name: 'Ethical Developer',
    description: 'Never use predatory monetization',
    icon: 'angel',
    rarity: 'epic',
    category: 'ethical',
    condition: { type: 'noPredatoryEver', threshold: 1 },
    reward: { reputationBonus: 15, title: 'Ethical Developer' },
    hidden: false,
    order: 2,
  },
  {
    id: 'player_first',
    name: 'Player First',
    description: 'Maintain 80+ player satisfaction for 60 days',
    icon: 'heart',
    rarity: 'rare',
    category: 'ethical',
    condition: { type: 'satisfactionStreak', threshold: 60 },
    hidden: false,
    order: 3,
  },
  {
    id: 'transparent',
    name: 'Transparent',
    description: 'Always display gacha rates',
    icon: 'testing',
    rarity: 'common',
    category: 'ethical',
    condition: { type: 'alwaysShowRates', threshold: 1 },
    hidden: false,
    order: 4,
  },
  {
    id: 'dark_path',
    name: 'Dark Path',
    description: 'Use predatory monetization... (hidden cost)',
    icon: 'devil',
    rarity: 'rare',
    category: 'ethical',
    condition: { type: 'predatoryUsed', threshold: 1 },
    reward: { reputationBonus: -10 },
    hidden: true,
    order: 5,
  },

  // =========================================================================
  // MARKET ACHIEVEMENTS (5)
  // =========================================================================
  {
    id: 'market_leader',
    name: 'Market Leader',
    description: 'Become #1 in market share',
    icon: 'medal',
    rarity: 'epic',
    category: 'market',
    condition: { type: 'marketRank', threshold: 1 },
    hidden: false,
    order: 1,
  },
  {
    id: 'beat_competitor',
    name: 'Competitive',
    description: 'Surpass a competitor in revenue',
    icon: 'dumbbell',
    rarity: 'rare',
    category: 'market',
    condition: { type: 'competitorsBeaten', threshold: 1 },
    hidden: false,
    order: 2,
  },
  {
    id: 'trend_setter',
    name: 'Trend Setter',
    description: 'Launch a game in an emerging genre',
    icon: 'wave',
    rarity: 'rare',
    category: 'market',
    condition: { type: 'trendingGenreLaunches', threshold: 1 },
    hidden: false,
    order: 3,
  },
  {
    id: 'monopoly',
    name: 'Monopoly',
    description: 'Control 50% of the gacha market',
    icon: 'castle',
    rarity: 'legendary',
    category: 'market',
    condition: { type: 'marketShare', threshold: 50 },
    hidden: false,
    order: 4,
  },
  {
    id: 'survivor',
    name: 'Survivor',
    description: 'Survive a market crash',
    icon: 'shield',
    rarity: 'rare',
    category: 'market',
    condition: { type: 'marketCrashSurvived', threshold: 1 },
    hidden: false,
    order: 5,
  },

  // =========================================================================
  // HIDDEN ACHIEVEMENTS (5)
  // =========================================================================
  {
    id: 'easter_egg_1',
    name: '???',
    description: 'Find the hidden button',
    icon: 'egg',
    rarity: 'rare',
    category: 'hidden',
    condition: { type: 'easterEgg1', threshold: 1 },
    hidden: true,
    order: 1,
  },
  {
    id: 'konami_code',
    name: 'Old School',
    description: 'Enter the Konami code',
    icon: 'games',
    rarity: 'rare',
    category: 'hidden',
    condition: { type: 'konamiCode', threshold: 1 },
    hidden: true,
    order: 2,
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Play at 3 AM',
    icon: 'owl',
    rarity: 'common',
    category: 'hidden',
    condition: { type: 'playAt3AM', threshold: 1 },
    hidden: true,
    order: 3,
  },
  {
    id: 'dedication',
    name: 'True Dedication',
    description: 'Play for 24 hours total',
    icon: 'clock',
    rarity: 'epic',
    category: 'hidden',
    condition: { type: 'totalPlaytime', threshold: 86400 },
    hidden: true,
    order: 4,
  },
  {
    id: 'meta_achievement',
    name: 'Achievement Hunter',
    description: 'Unlock 40 achievements',
    icon: 'medal',
    rarity: 'epic',
    category: 'hidden',
    condition: { type: 'achievementsUnlocked', threshold: 40 },
    hidden: true,
    order: 5,
  },

  // =========================================================================
  // SPEEDRUN ACHIEVEMENTS (3)
  // =========================================================================
  {
    id: 'speedrun_first_game',
    name: 'Speed Developer',
    description: 'Launch first game within 7 days',
    icon: 'bolt',
    rarity: 'rare',
    category: 'speedrun',
    condition: { type: 'firstLaunchDays', threshold: 7, comparison: 'lte' },
    hidden: false,
    order: 1,
  },
  {
    id: 'speedrun_million',
    name: 'Fast Fortune',
    description: 'Earn $1,000,000 within 30 days',
    icon: 'wind',
    rarity: 'epic',
    category: 'speedrun',
    condition: { type: 'millionDays', threshold: 30, comparison: 'lte' },
    hidden: false,
    order: 2,
  },
  {
    id: 'speedrun_prestige',
    name: 'Speedrun Prestige',
    description: 'Prestige within 100 days',
    icon: 'running',
    rarity: 'legendary',
    category: 'speedrun',
    condition: { type: 'prestigeDays', threshold: 100, comparison: 'lte' },
    hidden: false,
    order: 3,
  },

  // =========================================================================
  // CHALLENGE ACHIEVEMENTS (2)
  // =========================================================================
  {
    id: 'no_gacha',
    name: 'No Gacha Challenge',
    description: 'Reach $100,000 without using gacha',
    icon: 'blocked',
    rarity: 'legendary',
    category: 'challenge',
    condition: { type: 'noGachaChallenge', threshold: 100000 },
    hidden: false,
    order: 1,
  },
  {
    id: 'solo_dev',
    name: 'Solo Developer',
    description: 'Launch a game with only 1 employee',
    icon: 'superhero',
    rarity: 'epic',
    category: 'challenge',
    condition: { type: 'soloGameLaunch', threshold: 1 },
    hidden: false,
    order: 2,
  },
];

// =============================================================================
// Achievement Helper Functions
// =============================================================================

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.category === category).sort((a, b) => a.order - b.order);
}

export function getAchievementsByRarity(rarity: AchievementRarity): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.rarity === rarity);
}

export function getVisibleAchievements(unlockedIds: string[]): Achievement[] {
  return ACHIEVEMENTS.filter(a => !a.hidden || unlockedIds.includes(a.id));
}

export function calculateAchievementPoints(rarity: AchievementRarity): number {
  return ACHIEVEMENT_RARITY_CONFIG[rarity].points;
}

export function getTotalAchievementPoints(unlockedIds: string[]): number {
  return unlockedIds.reduce((total, id) => {
    const achievement = getAchievementById(id);
    return total + (achievement ? calculateAchievementPoints(achievement.rarity) : 0);
  }, 0);
}

export function getRarityColor(rarity: AchievementRarity): string {
  const colors: Record<AchievementRarity, string> = {
    common: '#9CA3AF',
    rare: '#3B82F6',
    epic: '#8B5CF6',
    legendary: '#F59E0B',
  };
  return colors[rarity];
}

export function getRarityLabel(rarity: AchievementRarity): string {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}

// =============================================================================
// Initial State
// =============================================================================

export function createInitialAchievementState(): AchievementState {
  return {
    unlocked: {},
    progress: {},
    favorites: [],
    totalPoints: 0,
  };
}
