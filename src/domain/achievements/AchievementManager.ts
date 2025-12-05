/**
 * Achievement Manager Service - Prompt 7.2
 * 
 * Manages achievement unlocking, progress tracking, and notifications.
 */

import {
  Achievement,
  AchievementState,
  AchievementProgress,
  ACHIEVEMENTS,
  getAchievementById,
  calculateAchievementPoints,
  createInitialAchievementState,
} from './Achievement';

// =============================================================================
// Game State Interface (for checking conditions)
// =============================================================================

export interface AchievementCheckContext {
  // Financial
  totalRevenue: number;
  currentFunds: number;
  dailyRevenue: number;
  dailyExpenses: number;
  profitMarginStreak: number;
  debtFreeStreak: number;

  // Games
  gamesStarted: number;
  gamesLaunched: number;
  gamesInDevelopment: number;
  maxGameQuality: number;
  maxGameDownloads: number;
  uniqueGenres: number;
  longestGameDays: number;
  revenueGeneratingGames: number;
  singleGameDailyRevenue: number;

  // Employees
  employeesHired: number;
  currentEmployees: number;
  maxEmployeeSkill: number;
  uniqueRoles: number;
  minTeamMorale: number;
  noQuitStreak: number;
  employeesTrained: number;
  legendaryEmployees: number;

  // Gacha
  totalPulls: number;
  legendaryPulls: number;
  pityHits: number;
  rareStreak: number;
  uniqueEmployeesCollected: number;
  duplicatePulls: number;
  tenPulls: number;
  allLegendaries: number;

  // Ethical
  fairRatesStreak: number;
  noPredatoryEver: number;
  satisfactionStreak: number;
  alwaysShowRates: number;
  predatoryUsed: number;

  // Market
  marketRank: number;
  competitorsBeaten: number;
  trendingGenreLaunches: number;
  marketShare: number;
  marketCrashSurvived: number;

  // Hidden
  easterEgg1: number;
  konamiCode: number;
  playAt3AM: number;
  totalPlaytime: number;
  achievementsUnlocked: number;

  // Speedrun
  firstLaunchDays: number;
  millionDays: number;
  prestigeDays: number;
  currentDay: number;

  // Challenge
  noGachaChallenge: number;
  soloGameLaunch: number;
}

// =============================================================================
// Achievement Manager
// =============================================================================

export type AchievementEventCallback = (achievement: Achievement) => void;

export class AchievementManager {
  private state: AchievementState;
  private onUnlock: AchievementEventCallback | null = null;
  private checkThrottle: number = 0;
  private lastCheckTick: number = 0;

  constructor(initialState?: Partial<AchievementState>) {
    this.state = {
      ...createInitialAchievementState(),
      ...initialState,
    };
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  /**
   * Set callback for when achievement is unlocked
   */
  setOnUnlock(callback: AchievementEventCallback): void {
    this.onUnlock = callback;
  }

  /**
   * Set throttle for checks (only check every N ticks)
   */
  setCheckThrottle(ticks: number): void {
    this.checkThrottle = ticks;
  }

  /**
   * Get current state
   */
  getState(): AchievementState {
    return { ...this.state };
  }

  /**
   * Check all achievements against current game state
   * Returns newly unlocked achievements
   */
  checkAchievements(context: AchievementCheckContext, currentTick: number): Achievement[] {
    // Throttle checks
    if (this.checkThrottle > 0 && currentTick - this.lastCheckTick < this.checkThrottle) {
      return [];
    }
    this.lastCheckTick = currentTick;

    const newlyUnlocked: Achievement[] = [];

    for (const achievement of ACHIEVEMENTS) {
      // Skip already unlocked
      if (this.isUnlocked(achievement.id)) {
        continue;
      }

      // Check condition
      const { met, currentValue } = this.checkCondition(achievement, context);

      // Update progress
      if (achievement.condition.threshold) {
        this.state.progress[achievement.id] = currentValue;
      }

      // Unlock if met
      if (met) {
        this.unlock(achievement);
        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
  }

  /**
   * Check single achievement
   */
  checkSingleAchievement(achievementId: string, context: AchievementCheckContext): boolean {
    const achievement = getAchievementById(achievementId);
    if (!achievement || this.isUnlocked(achievementId)) {
      return false;
    }

    const { met, currentValue } = this.checkCondition(achievement, context);
    
    if (achievement.condition.threshold) {
      this.state.progress[achievement.id] = currentValue;
    }

    if (met) {
      this.unlock(achievement);
      return true;
    }

    return false;
  }

  /**
   * Manually unlock an achievement
   */
  unlock(achievement: Achievement): void {
    if (this.isUnlocked(achievement.id)) {
      return;
    }

    this.state.unlocked[achievement.id] = Date.now();
    this.state.totalPoints += calculateAchievementPoints(achievement.rarity);

    // Update achievements unlocked count for meta achievement
    this.state.progress['achievementsUnlocked'] = Object.keys(this.state.unlocked).length;

    this.onUnlock?.(achievement);
  }

  /**
   * Check if achievement is unlocked
   */
  isUnlocked(achievementId: string): boolean {
    return achievementId in this.state.unlocked;
  }

  /**
   * Get progress for achievement
   */
  getProgress(achievementId: string): AchievementProgress {
    const achievement = getAchievementById(achievementId);
    if (!achievement) {
      return {
        achievementId,
        currentValue: 0,
        targetValue: 0,
        percentage: 0,
        unlockedAt: null,
      };
    }

    const currentValue = this.state.progress[achievementId] || 0;
    const targetValue = achievement.condition.threshold || 1;
    const percentage = Math.min(100, (currentValue / targetValue) * 100);
    const unlockedAt = this.state.unlocked[achievementId] || null;

    return {
      achievementId,
      currentValue,
      targetValue,
      percentage,
      unlockedAt,
    };
  }

  /**
   * Get all progress
   */
  getAllProgress(): AchievementProgress[] {
    return ACHIEVEMENTS.map(a => this.getProgress(a.id));
  }

  /**
   * Toggle favorite
   */
  toggleFavorite(achievementId: string): void {
    const index = this.state.favorites.indexOf(achievementId);
    if (index === -1) {
      this.state.favorites.push(achievementId);
    } else {
      this.state.favorites.splice(index, 1);
    }
  }

  /**
   * Is achievement favorited
   */
  isFavorite(achievementId: string): boolean {
    return this.state.favorites.includes(achievementId);
  }

  /**
   * Get stats
   */
  getStats(): {
    totalUnlocked: number;
    totalAchievements: number;
    totalPoints: number;
    maxPoints: number;
    completionPercent: number;
  } {
    const totalUnlocked = Object.keys(this.state.unlocked).length;
    const totalAchievements = ACHIEVEMENTS.length;
    const maxPoints = ACHIEVEMENTS.reduce(
      (sum, a) => sum + calculateAchievementPoints(a.rarity),
      0
    );

    return {
      totalUnlocked,
      totalAchievements,
      totalPoints: this.state.totalPoints,
      maxPoints,
      completionPercent: (totalUnlocked / totalAchievements) * 100,
    };
  }

  /**
   * Load state
   */
  loadState(state: AchievementState): void {
    this.state = { ...state };
  }

  /**
   * Reset state
   */
  reset(): void {
    this.state = createInitialAchievementState();
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private checkCondition(
    achievement: Achievement,
    context: AchievementCheckContext
  ): { met: boolean; currentValue: number } {
    const { type, threshold, comparison = 'gte' } = achievement.condition;
    
    // Get current value from context using index access
    const currentValue = (context as unknown as Record<string, number>)[type] ?? 0;

    if (threshold === undefined) {
      // Boolean condition (threshold = 1 means true)
      return { met: currentValue >= 1, currentValue };
    }

    // Compare based on comparison type
    let met = false;
    switch (comparison) {
      case 'gte':
        met = currentValue >= threshold;
        break;
      case 'lte':
        met = currentValue <= threshold && currentValue > 0;
        break;
      case 'eq':
        met = currentValue === threshold;
        break;
      case 'gt':
        met = currentValue > threshold;
        break;
      case 'lt':
        met = currentValue < threshold && currentValue > 0;
        break;
    }

    return { met, currentValue };
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let achievementManagerInstance: AchievementManager | null = null;

export function getAchievementManager(): AchievementManager {
  if (!achievementManagerInstance) {
    achievementManagerInstance = new AchievementManager();
  }
  return achievementManagerInstance;
}

export function resetAchievementManager(): void {
  achievementManagerInstance = null;
}
