import { describe, it, expect } from 'vitest';
import {
  PLAYER_ARCHETYPES,
  createInitialPopulation,
  calculateDailyAcquisition,
  calculateChurnRate,
  calculateDailyChurn,
  calculateDailyConversions,
  calculateDailyPlayerRevenue,
  simulateDay,
  runYearSimulation,
  GameConditions,
} from '@domain/player';
import { SeededRNG } from '@domain/shared';

describe('Player Behavior System', () => {
  // Helper to create standard game conditions
  const createTestConditions = (overrides: Partial<GameConditions> = {}): GameConditions => ({
    quality: 70,
    monetizationPressure: 0.3,
    contentFreshness: 0.8,
    hasPowerCreep: false,
    hasExclusiveContent: false,
    marketingSpend: 10000,
    reputation: 60,
    competitionLevel: 0.3,
    ...overrides,
  });

  describe('PLAYER_ARCHETYPES', () => {
    it('has all three player types defined', () => {
      expect(PLAYER_ARCHETYPES.whale).toBeDefined();
      expect(PLAYER_ARCHETYPES.dolphin).toBeDefined();
      expect(PLAYER_ARCHETYPES.free_to_play).toBeDefined();
    });

    it('archetypes have correct spending ranges', () => {
      expect(PLAYER_ARCHETYPES.whale.monthlySpendRange.min).toBeGreaterThan(0);
      expect(PLAYER_ARCHETYPES.dolphin.monthlySpendRange.min).toBeGreaterThan(0);
      expect(PLAYER_ARCHETYPES.free_to_play.monthlySpendRange.max).toBe(0);
    });

    it('population percentages sum to 100', () => {
      const total = 
        PLAYER_ARCHETYPES.whale.percentOfPopulation +
        PLAYER_ARCHETYPES.dolphin.percentOfPopulation +
        PLAYER_ARCHETYPES.free_to_play.percentOfPopulation;
      
      expect(total).toBe(100);
    });

    it('whales spend more than dolphins', () => {
      expect(PLAYER_ARCHETYPES.whale.monthlySpendRange.min)
        .toBeGreaterThan(PLAYER_ARCHETYPES.dolphin.monthlySpendRange.max);
    });
  });

  describe('createInitialPopulation', () => {
    it('creates population with correct proportions', () => {
      const pop = createInitialPopulation(10000);
      
      // Whales: 1%, Dolphins: 14%, F2P: 85%
      expect(pop.whales).toBe(100);
      expect(pop.dolphins).toBe(1400);
      expect(pop.freeToPlay).toBe(8500);
      expect(pop.total).toBe(10000);
    });

    it('handles zero players', () => {
      const pop = createInitialPopulation(0);
      
      expect(pop.whales).toBe(0);
      expect(pop.dolphins).toBe(0);
      expect(pop.freeToPlay).toBe(0);
      expect(pop.total).toBe(0);
    });
  });

  describe('calculateDailyAcquisition', () => {
    it('increases with marketing spend', () => {
      const rng = new SeededRNG(12345);
      const pop = createInitialPopulation(10000);
      
      const lowMarketing = calculateDailyAcquisition(
        createTestConditions({ marketingSpend: 1000 }),
        pop,
        rng
      );
      
      const rng2 = new SeededRNG(12345);
      const highMarketing = calculateDailyAcquisition(
        createTestConditions({ marketingSpend: 50000 }),
        pop,
        rng2
      );
      
      expect(highMarketing).toBeGreaterThan(lowMarketing);
    });

    it('increases with reputation', () => {
      const rng = new SeededRNG(12345);
      const pop = createInitialPopulation(10000);
      
      const lowRep = calculateDailyAcquisition(
        createTestConditions({ reputation: 20 }),
        pop,
        rng
      );
      
      const rng2 = new SeededRNG(12345);
      const highRep = calculateDailyAcquisition(
        createTestConditions({ reputation: 90 }),
        pop,
        rng2
      );
      
      expect(highRep).toBeGreaterThan(lowRep);
    });
  });

  describe('calculateChurnRate', () => {
    it('returns higher churn for F2P under pressure', () => {
      const f2pChurn = calculateChurnRate('free_to_play', createTestConditions({ monetizationPressure: 0.8 }));
      const whaleChurn = calculateChurnRate('whale', createTestConditions({ monetizationPressure: 0.8 }));
      
      expect(f2pChurn).toBeGreaterThan(whaleChurn);
    });

    it('higher quality reduces churn', () => {
      const lowQuality = calculateChurnRate('dolphin', createTestConditions({ quality: 30 }));
      const highQuality = calculateChurnRate('dolphin', createTestConditions({ quality: 90 }));
      
      expect(lowQuality).toBeGreaterThan(highQuality);
    });

    it('churn rate is bounded', () => {
      const churn = calculateChurnRate('free_to_play', createTestConditions({
        quality: 10,
        monetizationPressure: 1.0,
        competitionLevel: 1.0,
      }));
      
      expect(churn).toBeLessThanOrEqual(0.50);
      expect(churn).toBeGreaterThanOrEqual(0.01);
    });
  });

  describe('calculateDailyChurn', () => {
    it('returns churned players for each segment', () => {
      const rng = new SeededRNG(12345);
      const pop = createInitialPopulation(100000);
      
      const { churned } = calculateDailyChurn(pop, createTestConditions(), rng);
      
      expect(churned.whales).toBeGreaterThanOrEqual(0);
      expect(churned.dolphins).toBeGreaterThanOrEqual(0);
      expect(churned.freeToPlay).toBeGreaterThanOrEqual(0);
      expect(churned.total).toBe(churned.whales + churned.dolphins + churned.freeToPlay);
    });
  });

  describe('calculateDailyConversions', () => {
    it('converts some F2P to dolphins', () => {
      const rng = new SeededRNG(12345);
      const pop = createInitialPopulation(100000);
      
      const conversions = calculateDailyConversions(pop, createTestConditions(), rng);
      
      expect(conversions.f2pToDolphin).toBeGreaterThanOrEqual(0);
    });

    it('exclusive content increases conversions', () => {
      const rng = new SeededRNG(12345);
      const pop = createInitialPopulation(100000);
      
      const noExclusive = calculateDailyConversions(
        pop,
        createTestConditions({ hasExclusiveContent: false }),
        rng
      );
      
      const rng2 = new SeededRNG(12345);
      const withExclusive = calculateDailyConversions(
        pop,
        createTestConditions({ hasExclusiveContent: true }),
        rng2
      );
      
      expect(withExclusive.f2pToDolphin).toBeGreaterThanOrEqual(noExclusive.f2pToDolphin);
    });
  });

  describe('calculateDailyPlayerRevenue', () => {
    it('generates revenue from paying players', () => {
      const rng = new SeededRNG(12345);
      const pop = createInitialPopulation(100000);
      
      const revenue = calculateDailyPlayerRevenue(pop, createTestConditions(), rng);
      
      expect(revenue).toBeGreaterThan(0);
    });

    it('higher quality increases revenue', () => {
      const rng = new SeededRNG(12345);
      const pop = createInitialPopulation(100000);
      
      const lowQuality = calculateDailyPlayerRevenue(
        pop,
        createTestConditions({ quality: 30 }),
        rng
      );
      
      const rng2 = new SeededRNG(12345);
      const highQuality = calculateDailyPlayerRevenue(
        pop,
        createTestConditions({ quality: 90 }),
        rng2
      );
      
      expect(highQuality).toBeGreaterThan(lowQuality);
    });
  });

  describe('simulateDay', () => {
    it('returns complete daily metrics', () => {
      const rng = new SeededRNG(12345);
      const pop = createInitialPopulation(10000);
      
      const metrics = simulateDay(pop, createTestConditions(), 1, rng);
      
      expect(metrics.day).toBe(1);
      expect(metrics.population.total).toBeGreaterThanOrEqual(0);
      expect(metrics.lifecycle.acquired).toBeGreaterThanOrEqual(0);
      expect(metrics.lifecycle.churned).toBeGreaterThanOrEqual(0);
      expect(metrics.revenue).toBeGreaterThanOrEqual(0);
      expect(metrics.dau).toBeGreaterThan(0);
    });

    it('is deterministic with same seed', () => {
      const pop = createInitialPopulation(10000);
      const conditions = createTestConditions();
      
      const rng1 = new SeededRNG(12345);
      const metrics1 = simulateDay(pop, conditions, 1, rng1);
      
      const rng2 = new SeededRNG(12345);
      const metrics2 = simulateDay(pop, conditions, 1, rng2);
      
      expect(metrics1.revenue).toBe(metrics2.revenue);
      expect(metrics1.population.total).toBe(metrics2.population.total);
    });
  });

  describe('runYearSimulation', () => {
    it('simulates 365 days', () => {
      const rng = new SeededRNG(12345);
      
      const result = runYearSimulation(10000, createTestConditions(), rng);
      
      expect(result.dailyMetrics.length).toBe(365);
      expect(result.dailyMetrics[0].day).toBe(1);
      expect(result.dailyMetrics[364].day).toBe(365);
    });

    it('provides meaningful summary', () => {
      const rng = new SeededRNG(12345);
      
      const result = runYearSimulation(50000, createTestConditions(), rng);
      
      expect(result.summary.totalRevenue).toBeGreaterThan(0);
      expect(result.summary.averageDAU).toBeGreaterThan(0);
      expect(result.summary.peakDAU).toBeGreaterThanOrEqual(result.summary.averageDAU);
      expect(result.summary.totalChurned).toBeGreaterThan(0);
      expect(result.summary.totalAcquired).toBeGreaterThan(0);
    });

    it('bad conditions lead to declining population', () => {
      const rng = new SeededRNG(12345);
      
      const badConditions = createTestConditions({
        quality: 20,
        monetizationPressure: 0.9,
        contentFreshness: 0.1,
        marketingSpend: 100,
        reputation: 20,
        competitionLevel: 0.9,
      });
      
      const result = runYearSimulation(50000, badConditions, rng);
      
      // With bad conditions, we should lose players
      expect(result.summary.finalPopulation.total).toBeLessThan(50000);
    });
  });
});
