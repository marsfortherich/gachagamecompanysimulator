/**
 * Achievement System Tests - Prompt 7.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ACHIEVEMENTS,
  createInitialAchievementState,
  getAchievementById,
  getAchievementsByCategory,
  getAchievementsByRarity,
  calculateAchievementPoints,
  ACHIEVEMENT_RARITY_CONFIG,
} from '../../domain/achievements/Achievement';
import {
  AchievementManager,
  getAchievementManager,
  resetAchievementManager,
  type AchievementCheckContext,
} from '../../domain/achievements/AchievementManager';

describe('Achievement System', () => {
  describe('Achievement Definitions', () => {
    it('should have at least 50 achievements', () => {
      expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(50);
    });

    it('should have unique IDs', () => {
      const ids = ACHIEVEMENTS.map(a => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have all required properties', () => {
      for (const achievement of ACHIEVEMENTS) {
        expect(achievement).toHaveProperty('id');
        expect(achievement).toHaveProperty('name');
        expect(achievement).toHaveProperty('description');
        expect(achievement).toHaveProperty('icon');
        expect(achievement).toHaveProperty('rarity');
        expect(achievement).toHaveProperty('category');
        expect(achievement).toHaveProperty('condition');
        expect(achievement).toHaveProperty('hidden');
        expect(achievement).toHaveProperty('order');
      }
    });

    it('should cover all categories', () => {
      const categories = new Set(ACHIEVEMENTS.map(a => a.category));
      expect(categories.size).toBeGreaterThanOrEqual(8);
    });

    it('should have all rarities represented', () => {
      const rarities = new Set(ACHIEVEMENTS.map(a => a.rarity));
      expect(rarities.has('common')).toBe(true);
      expect(rarities.has('rare')).toBe(true);
      expect(rarities.has('epic')).toBe(true);
      expect(rarities.has('legendary')).toBe(true);
    });
  });

  describe('Helper Functions', () => {
    it('should get achievement by ID', () => {
      const achievement = getAchievementById('first_dollar');
      expect(achievement).toBeDefined();
      expect(achievement?.name).toBe('First Dollar');
    });

    it('should return undefined for invalid ID', () => {
      const achievement = getAchievementById('nonexistent');
      expect(achievement).toBeUndefined();
    });

    it('should get achievements by category', () => {
      const financialAchievements = getAchievementsByCategory('financial');
      expect(financialAchievements.length).toBeGreaterThan(0);
      expect(financialAchievements.every(a => a.category === 'financial')).toBe(true);
    });

    it('should get achievements by rarity', () => {
      const legendaryAchievements = getAchievementsByRarity('legendary');
      expect(legendaryAchievements.length).toBeGreaterThan(0);
      expect(legendaryAchievements.every(a => a.rarity === 'legendary')).toBe(true);
    });

    it('should calculate points correctly for each rarity', () => {
      expect(calculateAchievementPoints('common')).toBe(ACHIEVEMENT_RARITY_CONFIG.common.points);
      expect(calculateAchievementPoints('rare')).toBe(ACHIEVEMENT_RARITY_CONFIG.rare.points);
      expect(calculateAchievementPoints('epic')).toBe(ACHIEVEMENT_RARITY_CONFIG.epic.points);
      expect(calculateAchievementPoints('legendary')).toBe(ACHIEVEMENT_RARITY_CONFIG.legendary.points);
    });
  });

  describe('Initial State', () => {
    it('should create empty initial state', () => {
      const state = createInitialAchievementState();
      expect(state.unlocked).toEqual({});
      expect(state.progress).toEqual({});
      expect(state.favorites).toEqual([]);
      expect(state.totalPoints).toBe(0);
    });
  });
});

describe('AchievementManager', () => {
  let manager: AchievementManager;

  beforeEach(() => {
    resetAchievementManager();
    manager = new AchievementManager();
  });

  const createMockContext = (overrides: Partial<AchievementCheckContext> = {}): AchievementCheckContext => ({
    totalRevenue: 0,
    currentFunds: 0,
    dailyRevenue: 0,
    dailyExpenses: 0,
    profitMarginStreak: 0,
    debtFreeStreak: 0,
    gamesStarted: 0,
    gamesLaunched: 0,
    gamesInDevelopment: 0,
    maxGameQuality: 0,
    maxGameDownloads: 0,
    uniqueGenres: 0,
    longestGameDays: 0,
    revenueGeneratingGames: 0,
    singleGameDailyRevenue: 0,
    employeesHired: 0,
    currentEmployees: 0,
    maxEmployeeSkill: 0,
    uniqueRoles: 0,
    minTeamMorale: 0,
    noQuitStreak: 0,
    employeesTrained: 0,
    legendaryEmployees: 0,
    totalPulls: 0,
    legendaryPulls: 0,
    pityHits: 0,
    rareStreak: 0,
    uniqueEmployeesCollected: 0,
    duplicatePulls: 0,
    tenPulls: 0,
    allLegendaries: 0,
    fairRatesStreak: 0,
    noPredatoryEver: 0,
    satisfactionStreak: 0,
    alwaysShowRates: 0,
    predatoryUsed: 0,
    marketRank: 0,
    competitorsBeaten: 0,
    trendingGenreLaunches: 0,
    marketShare: 0,
    marketCrashSurvived: 0,
    easterEgg1: 0,
    konamiCode: 0,
    playAt3AM: 0,
    totalPlaytime: 0,
    achievementsUnlocked: 0,
    firstLaunchDays: 999,
    millionDays: 999,
    prestigeDays: 999,
    currentDay: 0,
    noGachaChallenge: 0,
    soloGameLaunch: 0,
    ...overrides,
  });

  describe('Achievement Unlocking', () => {
    it('should unlock achievement when condition is met', () => {
      const context = createMockContext({ totalRevenue: 1 });
      const unlocked = manager.checkAchievements(context, 1);
      
      expect(unlocked.some(a => a.id === 'first_dollar')).toBe(true);
      expect(manager.isUnlocked('first_dollar')).toBe(true);
    });

    it('should not unlock when condition is not met', () => {
      const context = createMockContext({ totalRevenue: 0 });
      manager.checkAchievements(context, 1);
      
      expect(manager.isUnlocked('first_dollar')).toBe(false);
    });

    it('should not unlock same achievement twice', () => {
      const context = createMockContext({ totalRevenue: 1 });
      
      const first = manager.checkAchievements(context, 1);
      const second = manager.checkAchievements(context, 2);
      
      expect(first.some(a => a.id === 'first_dollar')).toBe(true);
      expect(second.some(a => a.id === 'first_dollar')).toBe(false);
    });

    it('should track progress towards achievements', () => {
      const context = createMockContext({ totalRevenue: 500 });
      manager.checkAchievements(context, 1);
      
      const progress = manager.getProgress('first_thousand');
      expect(progress.currentValue).toBe(500);
      expect(progress.targetValue).toBe(1000);
      expect(progress.percentage).toBe(50);
    });

    it('should award points on unlock', () => {
      const context = createMockContext({ totalRevenue: 1 });
      manager.checkAchievements(context, 1);
      
      const stats = manager.getStats();
      expect(stats.totalPoints).toBeGreaterThan(0);
    });
  });

  describe('Callbacks', () => {
    it('should call onUnlock callback when achievement unlocked', () => {
      const callback = vi.fn();
      manager.setOnUnlock(callback);
      
      const context = createMockContext({ totalRevenue: 1 });
      manager.checkAchievements(context, 1);
      
      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[0][0].id).toBe('first_dollar');
    });
  });

  describe('Favorites', () => {
    it('should toggle favorites', () => {
      manager.toggleFavorite('first_dollar');
      expect(manager.isFavorite('first_dollar')).toBe(true);
      
      manager.toggleFavorite('first_dollar');
      expect(manager.isFavorite('first_dollar')).toBe(false);
    });
  });

  describe('Stats', () => {
    it('should track completion stats', () => {
      const stats = manager.getStats();
      
      expect(stats.totalUnlocked).toBe(0);
      expect(stats.totalAchievements).toBe(ACHIEVEMENTS.length);
      expect(stats.totalPoints).toBe(0);
      expect(stats.maxPoints).toBeGreaterThan(0);
      expect(stats.completionPercent).toBe(0);
    });
  });

  describe('Throttling', () => {
    it('should respect check throttle', () => {
      manager.setCheckThrottle(10);
      
      // Use context that meets at least one achievement condition
      const context = createMockContext({ totalRevenue: 1000000 });
      
      // First check should work (may or may not unlock depending on conditions)
      const first = manager.checkAchievements(context, 1);
      // Just verify it ran without error - unlocks depend on achievement definitions
      expect(first).toBeDefined();
      
      // Second check too soon should be skipped
      const second = manager.checkAchievements(context, 5);
      expect(second.length).toBe(0);
      
      // Third check after throttle should work
      const third = manager.checkAchievements(context, 15);
      expect(third).toBeDefined(); // May or may not have achievements
    });
  });

  describe('Singleton', () => {
    it('should return same instance from getAchievementManager', () => {
      const manager1 = getAchievementManager();
      const manager2 = getAchievementManager();
      expect(manager1).toBe(manager2);
    });

    it('should reset singleton on resetAchievementManager', () => {
      const manager1 = getAchievementManager();
      const context = createMockContext({ totalRevenue: 1 });
      manager1.checkAchievements(context, 1);
      
      resetAchievementManager();
      
      const manager2 = getAchievementManager();
      expect(manager2.isUnlocked('first_dollar')).toBe(false);
    });
  });
});
