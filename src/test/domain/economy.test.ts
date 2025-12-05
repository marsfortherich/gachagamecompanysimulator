import { describe, it, expect } from 'vitest';
import {
  calculateARPU,
  calculateGameRevenue,
  calculateInAppRevenue,
  calculateAdRevenue,
  calculateMerchandiseRevenue,
  calculateSalaryCosts,
  calculateServerCosts,
  checkBankruptcy,
  calculatePlayerAcquisitionFromMarketing,
  calculateRetentionMultiplier,
  GameEconomyConfig,
} from '@domain/economy';
import { createGame, Game } from '@domain/game';
import { createCompany } from '@domain/company';
import { createEmployee } from '@domain/employee';

describe('Economy System', () => {
  // Helper to create a test game economy config
  const createTestConfig = (overrides: Partial<GameEconomyConfig> = {}): GameEconomyConfig => ({
    monetizationStrategy: 'balanced',
    updateFrequency: 'monthly',
    marketingBudget: 10000,
    ...overrides,
  });

  // Helper to create a test game with quality
  const createTestGame = (): Game => {
    const game = createGame({ name: 'Test Game', genre: 'rpg', startDate: 0 });
    return {
      ...game,
      status: 'live' as const,
      quality: {
        gameplay: 70,
        graphics: 70,
        sound: 70,
        story: 70,
        polish: 70,
      },
      monetization: {
        ...game.monetization,
        dailyActiveUsers: 10000,
      },
    };
  };

  describe('calculateARPU', () => {
    it('calculates ARPU correctly for balanced monetization', () => {
      const game = createTestGame();
      const config = createTestConfig();
      
      const arpu = calculateARPU(game.quality, config, 0.3);
      
      expect(arpu).toBeGreaterThan(0);
      expect(arpu).toBeLessThan(10);
    });

    it('increases ARPU for aggressive monetization', () => {
      const game = createTestGame();
      const balanced = calculateARPU(game.quality, createTestConfig({ monetizationStrategy: 'balanced' }), 0.3);
      const aggressive = calculateARPU(game.quality, createTestConfig({ monetizationStrategy: 'aggressive' }), 0.3);
      
      expect(aggressive).toBeGreaterThan(balanced);
    });

    it('predatory monetization has highest ARPU', () => {
      const game = createTestGame();
      const aggressive = calculateARPU(game.quality, createTestConfig({ monetizationStrategy: 'aggressive' }), 0.3);
      const predatory = calculateARPU(game.quality, createTestConfig({ monetizationStrategy: 'predatory' }), 0.3);
      
      expect(predatory).toBeGreaterThan(aggressive);
    });

    it('generous monetization has lower ARPU', () => {
      const game = createTestGame();
      const balanced = calculateARPU(game.quality, createTestConfig({ monetizationStrategy: 'balanced' }), 0.3);
      const generous = calculateARPU(game.quality, createTestConfig({ monetizationStrategy: 'generous' }), 0.3);
      
      expect(generous).toBeLessThan(balanced);
    });

    it('higher quality increases ARPU', () => {
      const config = createTestConfig();
      const lowQuality = {
        gameplay: 40, graphics: 40, sound: 40, story: 40, polish: 40,
      };
      const highQuality = {
        gameplay: 90, graphics: 90, sound: 90, story: 90, polish: 90,
      };
      
      const lowArpu = calculateARPU(lowQuality, config, 0.3);
      const highArpu = calculateARPU(highQuality, config, 0.3);
      
      expect(highArpu).toBeGreaterThan(lowArpu);
    });

    it('frequent updates increase ARPU', () => {
      const game = createTestGame();
      const rarely = calculateARPU(game.quality, createTestConfig({ updateFrequency: 'sporadic' }), 0.3);
      const weekly = calculateARPU(game.quality, createTestConfig({ updateFrequency: 'weekly' }), 0.3);
      
      expect(weekly).toBeGreaterThan(rarely);
    });

    it('high saturation decreases ARPU', () => {
      const game = createTestGame();
      const config = createTestConfig();
      
      const lowSaturation = calculateARPU(game.quality, config, 0.1);
      const highSaturation = calculateARPU(game.quality, config, 0.9);
      
      expect(lowSaturation).toBeGreaterThan(highSaturation);
    });
  });

  describe('calculateRetentionMultiplier', () => {
    it('generous monetization has highest retention', () => {
      const generous = calculateRetentionMultiplier('generous');
      const balanced = calculateRetentionMultiplier('balanced');
      
      expect(generous).toBeGreaterThan(balanced);
    });

    it('predatory monetization has lowest retention', () => {
      const predatory = calculateRetentionMultiplier('predatory');
      const balanced = calculateRetentionMultiplier('balanced');
      
      expect(predatory).toBeLessThan(balanced);
    });
  });

  describe('calculateInAppRevenue', () => {
    it('calculates daily IAP revenue correctly', () => {
      const dau = 10000;
      const arpu = 2.5;  // $2.50 per month
      
      const dailyRevenue = calculateInAppRevenue(dau, arpu);
      
      // ARPU / 30 * DAU = 2.5 / 30 * 10000 ≈ 833
      expect(dailyRevenue).toBeGreaterThan(800);
      expect(dailyRevenue).toBeLessThan(900);
    });

    it('scales with player count', () => {
      const small = calculateInAppRevenue(1000, 2.5);
      const large = calculateInAppRevenue(10000, 2.5);
      
      expect(large).toBe(small * 10);
    });
  });

  describe('calculateAdRevenue', () => {
    it('returns 0 when ads disabled', () => {
      const revenue = calculateAdRevenue(10000, 2.5, false);
      expect(revenue).toBe(0);
    });

    it('generates revenue when ads enabled', () => {
      const revenue = calculateAdRevenue(10000, 2.5, true);
      expect(revenue).toBeGreaterThan(0);
    });
  });

  describe('calculateMerchandiseRevenue', () => {
    it('scales with reputation', () => {
      const lowRep = calculateMerchandiseRevenue(100000, 30, 50);
      const highRep = calculateMerchandiseRevenue(100000, 90, 50);
      
      expect(highRep).toBeGreaterThan(lowRep);
    });

    it('scales with game popularity', () => {
      const lowPop = calculateMerchandiseRevenue(100000, 70, 20);
      const highPop = calculateMerchandiseRevenue(100000, 70, 80);
      
      expect(highPop).toBeGreaterThan(lowPop);
    });
  });

  describe('calculateGameRevenue', () => {
    it('calculates complete revenue breakdown', () => {
      const game = createTestGame();
      const config = createTestConfig();
      
      const financials = calculateGameRevenue(game, config, 70, 0.3);
      
      expect(financials.revenue.inAppPurchases).toBeGreaterThan(0);
      expect(financials.revenue.advertisements).toBeGreaterThan(0);
      // Allow for rounding differences (each component is rounded individually,
      // but total is rounded from the sum of unrounded values, can differ by up to 2)
      const sumOfComponents = 
        financials.revenue.inAppPurchases + 
        financials.revenue.advertisements + 
        financials.revenue.merchandise + 
        financials.revenue.licensing;
      expect(Math.abs(financials.revenue.total - sumOfComponents)).toBeLessThanOrEqual(2);
    });

    it('includes server costs', () => {
      const game = createTestGame();
      const config = createTestConfig();
      
      const financials = calculateGameRevenue(game, config, 70, 0.3);
      
      expect(financials.serverCost).toBeGreaterThan(0);
    });
  });

  describe('calculateSalaryCosts', () => {
    it('sums all employee salaries', () => {
      const emp1 = createEmployee({ name: 'Dev', role: 'Programmer', salary: 5000, hiredDate: 0, skills: { programming: 50 } });
      const emp2 = createEmployee({ name: 'Designer', role: 'Artist', salary: 4500, hiredDate: 0, skills: { art: 50 } });
      
      const employees = [emp1, emp2];
      
      const total = calculateSalaryCosts(employees);
      
      expect(total).toBe(9500);
    });

    it('returns 0 for empty array', () => {
      const total = calculateSalaryCosts([]);
      expect(total).toBe(0);
    });
  });

  describe('calculateServerCosts', () => {
    it('calculates costs based on DAU', () => {
      const game = createTestGame();
      
      const cost = calculateServerCosts([game]);
      
      // 10000 DAU = 10 * $50 = $500
      expect(cost).toBe(500);
    });

    it('only counts live games', () => {
      const liveGame = createTestGame();
      const devGame = { ...createTestGame(), status: 'development' as const };
      
      const liveCost = calculateServerCosts([liveGame]);
      const combinedCost = calculateServerCosts([liveGame, devGame]);
      
      expect(combinedCost).toBe(liveCost);
    });
  });

  describe('checkBankruptcy', () => {
    it('detects bankruptcy when funds are empty', () => {
      const company = { ...createCompany({ name: 'Test', foundedDate: 0 }), funds: 0 };
      
      const result = checkBankruptcy(company, 10000);
      
      expect(result.isBankrupt).toBe(true);
      expect(result.reason).toBeDefined();
    });

    it('detects bankruptcy when cannot cover expenses', () => {
      const company = { ...createCompany({ name: 'Test', foundedDate: 0 }), funds: 5000 };
      
      const result = checkBankruptcy(company, 10000);
      
      expect(result.isBankrupt).toBe(true);
    });

    it('healthy company is not bankrupt', () => {
      const company = { ...createCompany({ name: 'Test', foundedDate: 0 }), funds: 100000 };
      
      const result = checkBankruptcy(company, 10000);
      
      expect(result.isBankrupt).toBe(false);
      expect(result.reason).toBeNull();
    });
  });

  describe('calculatePlayerAcquisitionFromMarketing', () => {
    it('returns players based on spend', () => {
      const players = calculatePlayerAcquisitionFromMarketing(10000, 70, 50);
      
      expect(players).toBeGreaterThan(0);
    });

    it('higher spend means more players', () => {
      const low = calculatePlayerAcquisitionFromMarketing(1000, 70, 50);
      const high = calculatePlayerAcquisitionFromMarketing(50000, 70, 50);
      
      expect(high).toBeGreaterThan(low);
    });

    it('better quality increases effectiveness', () => {
      // Use higher spend so quality difference is visible after rounding
      const lowQuality = calculatePlayerAcquisitionFromMarketing(100000, 30, 50);
      const highQuality = calculatePlayerAcquisitionFromMarketing(100000, 90, 50);
      
      expect(highQuality).toBeGreaterThan(lowQuality);
    });

    it('higher genre popularity increases effectiveness', () => {
      const lowPop = calculatePlayerAcquisitionFromMarketing(10000, 70, 20);
      const highPop = calculatePlayerAcquisitionFromMarketing(10000, 70, 80);
      
      expect(highPop).toBeGreaterThan(lowPop);
    });
  });
});
