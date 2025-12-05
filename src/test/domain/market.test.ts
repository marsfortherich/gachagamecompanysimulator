import { describe, it, expect } from 'vitest';
import {
  createInitialMarket,
  simulateMarketTick,
  calculatePlayerAcquisition,
  calculateExpectedRevenue,
  createDefaultPlayerBehaviors,
} from '../../domain/market';

describe('Market', () => {
  describe('createInitialMarket', () => {
    it('should create market with all genres', () => {
      const market = createInitialMarket(0);

      expect(market.genrePopularity).toHaveLength(7);
      expect(market.genrePopularity.map(g => g.genre)).toContain('rpg');
      expect(market.genrePopularity.map(g => g.genre)).toContain('card');
    });

    it('should create market with player behaviors', () => {
      const market = createInitialMarket(0);

      expect(market.playerBehaviors).toHaveLength(4);
      expect(market.playerBehaviors.map(b => b.segment)).toContain('whale');
      expect(market.playerBehaviors.map(b => b.segment)).toContain('free_to_play');
    });

    it('should create market with competitors', () => {
      const market = createInitialMarket(0);

      expect(market.competitors.length).toBeGreaterThan(0);
      expect(market.competitors[0].name).toBeDefined();
    });

    it('should have economic multiplier at 1.0', () => {
      const market = createInitialMarket(0);
      expect(market.economicMultiplier).toBe(1.0);
    });
  });

  describe('simulateMarketTick', () => {
    it('should increment market date', () => {
      const market = createInitialMarket(100);
      const updated = simulateMarketTick(market);

      expect(updated.date).toBe(101);
    });

    it('should update genre popularity', () => {
      const market = createInitialMarket(0);
      
      // Run multiple ticks to see changes
      let updated = market;
      for (let i = 0; i < 10; i++) {
        updated = simulateMarketTick(updated);
      }

      // Popularity should have changed (statistically very likely)
      const hasChanged = updated.genrePopularity.some(
        (gp, i) => gp.popularity !== market.genrePopularity[i].popularity
      );
      expect(hasChanged).toBe(true);
    });

    it('should keep economic multiplier within bounds', () => {
      let market = createInitialMarket(0);
      
      // Run many ticks
      for (let i = 0; i < 1000; i++) {
        market = simulateMarketTick(market);
      }

      expect(market.economicMultiplier).toBeGreaterThanOrEqual(0.5);
      expect(market.economicMultiplier).toBeLessThanOrEqual(1.5);
    });
  });

  describe('calculatePlayerAcquisition', () => {
    it('should return positive acquisition for valid inputs', () => {
      const market = createInitialMarket(0);
      const acquisition = calculatePlayerAcquisition(market, 'rpg', 70, 10000);

      expect(acquisition).toBeGreaterThan(0);
    });

    it('should increase with higher quality', () => {
      const market = createInitialMarket(0);
      const lowQuality = calculatePlayerAcquisition(market, 'rpg', 30, 10000);
      const highQuality = calculatePlayerAcquisition(market, 'rpg', 90, 10000);

      expect(highQuality).toBeGreaterThan(lowQuality);
    });

    it('should increase with higher marketing spend', () => {
      const market = createInitialMarket(0);
      const lowMarketing = calculatePlayerAcquisition(market, 'rpg', 70, 1000);
      const highMarketing = calculatePlayerAcquisition(market, 'rpg', 70, 100000);

      expect(highMarketing).toBeGreaterThan(lowMarketing);
    });
  });

  describe('calculateExpectedRevenue', () => {
    it('should return positive revenue for players', () => {
      const behaviors = createDefaultPlayerBehaviors();
      const revenue = calculateExpectedRevenue(10000, behaviors, 0.5);

      expect(revenue).toBeGreaterThan(0);
    });

    it('should scale with player count', () => {
      const behaviors = createDefaultPlayerBehaviors();
      const smallRevenue = calculateExpectedRevenue(1000, behaviors, 0.5);
      const largeRevenue = calculateExpectedRevenue(10000, behaviors, 0.5);

      expect(largeRevenue).toBeGreaterThan(smallRevenue * 5);
    });

    it('should increase with higher gacha generosity', () => {
      const behaviors = createDefaultPlayerBehaviors();
      const stingyRevenue = calculateExpectedRevenue(10000, behaviors, 0);
      const generousRevenue = calculateExpectedRevenue(10000, behaviors, 1);

      expect(generousRevenue).toBeGreaterThan(stingyRevenue);
    });
  });

  describe('createDefaultPlayerBehaviors', () => {
    it('should have segments that sum to ~100%', () => {
      const behaviors = createDefaultPlayerBehaviors();
      const totalPercent = behaviors.reduce((sum, b) => sum + b.populationPercent, 0);

      expect(totalPercent).toBeCloseTo(100, 1);
    });

    it('should have whales with highest spending power', () => {
      const behaviors = createDefaultPlayerBehaviors();
      const whale = behaviors.find(b => b.segment === 'whale')!;
      const others = behaviors.filter(b => b.segment !== 'whale');

      for (const other of others) {
        expect(whale.spendingPower).toBeGreaterThan(other.spendingPower);
      }
    });
  });
});
