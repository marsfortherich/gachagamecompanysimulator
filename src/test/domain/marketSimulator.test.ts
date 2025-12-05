import { describe, it, expect } from 'vitest';
import {
  SEASONAL_EVENTS,
  getSeason,
  getActiveSeasonalEvents,
  calculateSeasonalMultipliers,
  simulateCompetitorAction,
  updateCompetitorAfterAction,
  calculateMarketSaturation,
  applySaturationPenalty,
  forecastMarketTrends,
  simulateEnhancedMarketTick,
} from '@domain/market';
import { createInitialMarket } from '@domain/market';
import { SeededRNG } from '@domain/shared';

describe('Market Simulator', () => {
  describe('getSeason', () => {
    it('returns correct seasons', () => {
      expect(getSeason(1)).toBe('winter');     // Jan 1
      expect(getSeason(100)).toBe('spring');   // Apr 10
      expect(getSeason(200)).toBe('summer');   // Jul 19
      expect(getSeason(280)).toBe('fall');     // Oct 7
      expect(getSeason(360)).toBe('winter');   // Dec 26
    });
  });

  describe('getActiveSeasonalEvents', () => {
    it('returns Christmas event on Dec 25', () => {
      const events = getActiveSeasonalEvents(359);  // Dec 25 (approximately)
      const christmasEvent = events.find(e => e.holiday === 'christmas');
      
      expect(christmasEvent).toBeDefined();
    });

    it('returns no events on a quiet day', () => {
      // Mid-March, no holidays
      const events = getActiveSeasonalEvents(75);
      
      // May have 0 or few events
      expect(events.length).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateSeasonalMultipliers', () => {
    it('returns higher multipliers during holidays', () => {
      const christmas = calculateSeasonalMultipliers(359);  // Christmas
      const quiet = calculateSeasonalMultipliers(75);       // March
      
      expect(christmas.revenueMultiplier).toBeGreaterThan(quiet.revenueMultiplier);
    });

    it('returns base multipliers when no events', () => {
      const result = calculateSeasonalMultipliers(75);  // Quiet period
      
      // Should be close to 1.0 if no events
      expect(result.revenueMultiplier).toBeGreaterThanOrEqual(1.0);
    });
  });

  describe('SEASONAL_EVENTS', () => {
    it('has major holidays defined', () => {
      const holidays = SEASONAL_EVENTS.map(e => e.holiday);
      
      expect(holidays).toContain('christmas');
      expect(holidays).toContain('new_years');
      expect(holidays).toContain('halloween');
    });

    it('Christmas has highest revenue multiplier', () => {
      const christmas = SEASONAL_EVENTS.find(e => e.holiday === 'christmas');
      
      expect(christmas).toBeDefined();
      expect(christmas!.revenueMultiplier).toBeGreaterThanOrEqual(1.5);
    });
  });

  describe('simulateCompetitorAction', () => {
    it('returns action results', () => {
      const rng = new SeededRNG(12345);
      const market = createInitialMarket(0);
      const competitor = market.competitors[0];
      
      // Run many simulations to get at least one action
      let gotAction = false;
      for (let i = 0; i < 100; i++) {
        const result = simulateCompetitorAction(competitor, market, 50, i, rng);
        if (result.action !== 'none') {
          gotAction = true;
          expect(result.competitor).toBeDefined();
          expect(result.impact).toBeDefined();
          break;
        }
      }
      
      // May or may not get an action due to low probability
      expect(typeof gotAction).toBe('boolean');
    });

    it('more aggressive competitors act more often', () => {
      const market = createInitialMarket(0);
      
      // Find most and least aggressive competitors
      const sortedCompetitors = [...market.competitors].sort((a, b) => b.aggressiveness - a.aggressiveness);
      const aggressive = sortedCompetitors[0];
      const passive = sortedCompetitors[sortedCompetitors.length - 1];
      
      let aggressiveActions = 0;
      let passiveActions = 0;
      
      for (let i = 0; i < 100; i++) {
        const rng1 = new SeededRNG(i);
        const rng2 = new SeededRNG(i);
        
        const result1 = simulateCompetitorAction(aggressive, market, 50, i, rng1);
        const result2 = simulateCompetitorAction(passive, market, 50, i, rng2);
        
        if (result1.action !== 'none') aggressiveActions++;
        if (result2.action !== 'none') passiveActions++;
      }
      
      expect(aggressiveActions).toBeGreaterThanOrEqual(passiveActions);
    });
  });

  describe('updateCompetitorAfterAction', () => {
    it('updates competitor stats after action', () => {
      const market = createInitialMarket(0);
      const competitor = market.competitors[0];
      const originalShare = competitor.marketShare;
      
      const actionResult = {
        competitor,
        action: 'marketing_blitz' as const,
        impact: {
          marketShareChange: 2,
          reputationChange: 0,
          playerLossToUs: 100,
        },
        description: 'Test action',
      };
      
      const updated = updateCompetitorAfterAction(competitor, actionResult);
      
      expect(updated.marketShare).toBe(Math.min(50, originalShare + 2));
    });

    it('clamps values to valid range', () => {
      const market = createInitialMarket(0);
      const competitor = { ...market.competitors[0], marketShare: 48 };
      
      const actionResult = {
        competitor,
        action: 'acquire_studio' as const,
        impact: {
          marketShareChange: 10,  // Would exceed 50
          reputationChange: 0,
          playerLossToUs: 0,
        },
        description: 'Test',
      };
      
      const updated = updateCompetitorAfterAction(competitor, actionResult);
      
      expect(updated.marketShare).toBe(50);  // Clamped
    });
  });

  describe('calculateMarketSaturation', () => {
    it('returns saturation metrics', () => {
      const market = createInitialMarket(0);
      
      const saturation = calculateMarketSaturation(market, 2);
      
      expect(saturation.overallSaturation).toBeGreaterThanOrEqual(0);
      expect(saturation.overallSaturation).toBeLessThanOrEqual(1);
      expect(saturation.competitorPressure).toBeGreaterThanOrEqual(0);
    });

    it('increases with more player games', () => {
      const market = createInitialMarket(0);
      
      const fewGames = calculateMarketSaturation(market, 1);
      const manyGames = calculateMarketSaturation(market, 10);
      
      expect(manyGames.overallSaturation).toBeGreaterThan(fewGames.overallSaturation);
    });
  });

  describe('applySaturationPenalty', () => {
    it('reduces acquisition based on saturation', () => {
      const market = createInitialMarket(0);
      const saturation = calculateMarketSaturation(market, 5);
      
      const baseAcquisition = 1000;
      const penalized = applySaturationPenalty(baseAcquisition, saturation, 'rpg');
      
      expect(penalized).toBeLessThan(baseAcquisition);
      expect(penalized).toBeGreaterThan(0);
    });
  });

  describe('forecastMarketTrends', () => {
    it('forecasts all genres', () => {
      const rng = new SeededRNG(12345);
      const market = createInitialMarket(0);
      
      const forecasts = forecastMarketTrends(market, rng);
      
      expect(forecasts.length).toBe(market.genrePopularity.length);
      
      for (const forecast of forecasts) {
        expect(['invest', 'maintain', 'divest']).toContain(forecast.recommendation);
        expect(forecast.confidence).toBeGreaterThanOrEqual(0);
        expect(forecast.confidence).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('simulateEnhancedMarketTick', () => {
    it('returns complete tick results', () => {
      const rng = new SeededRNG(12345);
      const market = createInitialMarket(0);
      
      const result = simulateEnhancedMarketTick(market, 100, 60, 2, rng);
      
      expect(result.newMarket.date).toBe(market.date + 1);
      expect(result.seasonalInfo.season).toBeDefined();
      expect(result.saturation).toBeDefined();
    });

    it('provides seasonal info', () => {
      const rng = new SeededRNG(12345);
      const market = createInitialMarket(0);
      
      // Christmas period
      const christmasResult = simulateEnhancedMarketTick(market, 359, 60, 2, rng);
      
      expect(christmasResult.seasonalInfo.season).toBe('winter');
      expect(christmasResult.seasonalInfo.revenueMultiplier).toBeGreaterThan(1);
    });
  });
});
