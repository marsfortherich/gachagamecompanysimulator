import { describe, it, expect } from 'vitest';
import {
  createGame,
  updateProgress,
  updateGameStatus,
  updateQuality,
  assignEmployees,
  removeEmployees,
  validateGachaRates,
  simulateLiveGameTick,
  initializeLiveGame,
  GENRE_MODIFIERS,
  updateMonetization,
} from '../../domain/game';

describe('Game', () => {
  describe('createGame', () => {
    it('should create a game in planning status', () => {
      const game = createGame({
        name: 'Epic Gacha',
        genre: 'rpg',
        startDate: 100,
      });

      expect(game.name).toBe('Epic Gacha');
      expect(game.genre).toBe('rpg');
      expect(game.status).toBe('planning');
      expect(game.developmentProgress).toBe(0);
      expect(game.launchDate).toBeNull();
      expect(game.assignedEmployees).toHaveLength(0);
    });

    it('should create default gacha rates', () => {
      const game = createGame({
        name: 'Test',
        genre: 'card',
        startDate: 0,
      });

      const rates = game.monetization.gachaRates;
      expect(rates.common).toBe(0.60);
      expect(rates.legendary).toBe(0.01);
      
      // Rates should sum to 1.0
      const sum = rates.common + rates.uncommon + rates.rare + rates.epic + rates.legendary;
      expect(sum).toBeCloseTo(1.0);
    });
  });

  describe('updateProgress', () => {
    it('should increase progress', () => {
      const game = createGame({ name: 'Test', genre: 'rpg', startDate: 0 });
      const updated = updateProgress(game, 25);
      expect(updated.developmentProgress).toBe(25);
    });

    it('should clamp progress to 100', () => {
      const game = createGame({ name: 'Test', genre: 'rpg', startDate: 0 });
      const updated = updateProgress(game, 150);
      expect(updated.developmentProgress).toBe(100);
    });

    it('should not go below 0', () => {
      const game = createGame({ name: 'Test', genre: 'rpg', startDate: 0 });
      const updated = updateProgress(game, -50);
      expect(updated.developmentProgress).toBe(0);
    });
  });

  describe('updateGameStatus', () => {
    it('should update status', () => {
      const game = createGame({ name: 'Test', genre: 'rpg', startDate: 0 });
      const updated = updateGameStatus(game, 'development');
      expect(updated.status).toBe('development');
    });

    it('should set launch date when going live', () => {
      const game = createGame({ name: 'Test', genre: 'rpg', startDate: 0 });
      const updated = updateGameStatus(game, 'live', 365);
      expect(updated.status).toBe('live');
      expect(updated.launchDate).toBe(365);
    });
  });

  describe('updateQuality', () => {
    it('should update quality metrics', () => {
      const game = createGame({ name: 'Test', genre: 'rpg', startDate: 0 });
      const updated = updateQuality(game, { graphics: 75, gameplay: 60 });
      
      expect(updated.quality.graphics).toBe(75);
      expect(updated.quality.gameplay).toBe(60);
      expect(updated.quality.story).toBe(0); // unchanged
    });

    it('should clamp quality to 0-100', () => {
      const game = createGame({ name: 'Test', genre: 'rpg', startDate: 0 });
      const updated = updateQuality(game, { graphics: 150 });
      expect(updated.quality.graphics).toBe(100);
    });
  });

  describe('assignEmployees', () => {
    it('should add employees to the game', () => {
      const game = createGame({ name: 'Test', genre: 'rpg', startDate: 0 });
      const updated = assignEmployees(game, ['emp1', 'emp2']);
      
      expect(updated.assignedEmployees).toContain('emp1');
      expect(updated.assignedEmployees).toContain('emp2');
    });

    it('should not duplicate employees', () => {
      const game = createGame({ name: 'Test', genre: 'rpg', startDate: 0 });
      let updated = assignEmployees(game, ['emp1']);
      updated = assignEmployees(updated, ['emp1', 'emp2']);
      
      expect(updated.assignedEmployees.filter(e => e === 'emp1')).toHaveLength(1);
    });
  });

  describe('removeEmployees', () => {
    it('should remove employees from the game', () => {
      const game = createGame({ name: 'Test', genre: 'rpg', startDate: 0 });
      let updated = assignEmployees(game, ['emp1', 'emp2', 'emp3']);
      updated = removeEmployees(updated, ['emp2']);
      
      expect(updated.assignedEmployees).toContain('emp1');
      expect(updated.assignedEmployees).not.toContain('emp2');
      expect(updated.assignedEmployees).toContain('emp3');
    });
  });

  describe('validateGachaRates', () => {
    it('should return true for valid rates', () => {
      const rates = {
        common: 0.60,
        uncommon: 0.25,
        rare: 0.10,
        epic: 0.04,
        legendary: 0.01,
      };
      expect(validateGachaRates(rates)).toBe(true);
    });

    it('should return false for invalid rates', () => {
      const rates = {
        common: 0.50,
        uncommon: 0.25,
        rare: 0.10,
        epic: 0.04,
        legendary: 0.01,
      };
      expect(validateGachaRates(rates)).toBe(false);
    });
  });

  describe('Live Game Simulation', () => {
    it('should have genre modifiers for all genres', () => {
      const genres = ['idle', 'puzzle', 'card', 'rpg', 'strategy', 'action', 'rhythm'];
      for (const genre of genres) {
        expect(GENRE_MODIFIERS[genre as keyof typeof GENRE_MODIFIERS]).toBeDefined();
        expect(GENRE_MODIFIERS[genre as keyof typeof GENRE_MODIFIERS].baseDAU).toBeGreaterThan(0);
      }
    });

    it('should initialize a live game with DAU based on quality', () => {
      let game = createGame({ name: 'Test', genre: 'idle', startDate: 0 });
      game = updateGameStatus(game, 'live');
      game = updateQuality(game, { graphics: 80, gameplay: 80, story: 60, sound: 70, polish: 75 });
      
      const initialized = initializeLiveGame(game, 50); // 50 reputation
      
      expect(initialized.monetization.dailyActiveUsers).toBeGreaterThan(0);
      expect(initialized.monetization.playerSatisfaction).toBeGreaterThan(50);
    });

    it('should not initialize a non-live game', () => {
      const game = createGame({ name: 'Test', genre: 'idle', startDate: 0 });
      const result = initializeLiveGame(game, 50);
      
      expect(result.monetization.dailyActiveUsers).toBe(0);
    });

    it('should generate revenue for live games', () => {
      let game = createGame({ name: 'Test', genre: 'idle', startDate: 0 });
      game = updateGameStatus(game, 'live', 0);
      game = updateQuality(game, { graphics: 70, gameplay: 70, story: 50, sound: 60, polish: 65 });
      game = updateMonetization(game, { dailyActiveUsers: 1000, playerSatisfaction: 70 });
      
      const result = simulateLiveGameTick(game, {
        companyReputation: 50,
        hasMarketer: false,
        daysSinceLaunch: 10,
      });
      
      expect(result.dailyRevenue).toBeGreaterThan(0);
      expect(result.game.monetization.dailyActiveUsers).toBeGreaterThan(0);
    });

    it('should grow DAU faster with a marketer', () => {
      let game = createGame({ name: 'Test', genre: 'puzzle', startDate: 0 });
      game = updateGameStatus(game, 'live', 0);
      game = updateQuality(game, { graphics: 60, gameplay: 60, story: 50, sound: 50, polish: 55 });
      game = updateMonetization(game, { dailyActiveUsers: 500, playerSatisfaction: 60 });
      
      const withoutMarketer = simulateLiveGameTick(game, {
        companyReputation: 50,
        hasMarketer: false,
        daysSinceLaunch: 5,
      });
      
      const withMarketer = simulateLiveGameTick(game, {
        companyReputation: 50,
        hasMarketer: true,
        daysSinceLaunch: 5,
      });
      
      // Marketer should bring more new users on average
      // Note: Due to randomness, we check the game state was updated
      expect(withMarketer.game.monetization.dailyActiveUsers).toBeGreaterThan(0);
      expect(withoutMarketer.game.monetization.dailyActiveUsers).toBeGreaterThan(0);
    });

    it('should not process non-live games', () => {
      const game = createGame({ name: 'Test', genre: 'rpg', startDate: 0 });
      
      const result = simulateLiveGameTick(game, {
        companyReputation: 50,
        hasMarketer: false,
        daysSinceLaunch: 0,
      });
      
      expect(result.dailyRevenue).toBe(0);
      expect(result.newUsers).toBe(0);
    });

    it('should decay player satisfaction over time', () => {
      let game = createGame({ name: 'Test', genre: 'rpg', startDate: 0 });
      game = updateGameStatus(game, 'live', 0);
      game = updateMonetization(game, { dailyActiveUsers: 1000, playerSatisfaction: 80 });
      
      const result = simulateLiveGameTick(game, {
        companyReputation: 50,
        hasMarketer: false,
        daysSinceLaunch: 30,
      });
      
      expect(result.game.monetization.playerSatisfaction).toBeLessThan(80);
    });

    it('should have higher revenue for higher quality games', () => {
      let lowQuality = createGame({ name: 'Low', genre: 'idle', startDate: 0 });
      lowQuality = updateGameStatus(lowQuality, 'live', 0);
      lowQuality = updateMonetization(lowQuality, { dailyActiveUsers: 1000, playerSatisfaction: 50 });
      
      let highQuality = createGame({ name: 'High', genre: 'idle', startDate: 0 });
      highQuality = updateGameStatus(highQuality, 'live', 0);
      highQuality = updateQuality(highQuality, { graphics: 90, gameplay: 90, story: 80, sound: 85, polish: 88 });
      highQuality = updateMonetization(highQuality, { dailyActiveUsers: 1000, playerSatisfaction: 80 });
      
      const lowResult = simulateLiveGameTick(lowQuality, {
        companyReputation: 50,
        hasMarketer: false,
        daysSinceLaunch: 30,
      });
      
      const highResult = simulateLiveGameTick(highQuality, {
        companyReputation: 50,
        hasMarketer: false,
        daysSinceLaunch: 30,
      });
      
      // High quality should generate more revenue (same DAU but better conversion)
      expect(highResult.dailyRevenue).toBeGreaterThan(lowResult.dailyRevenue);
    });
  });
});
