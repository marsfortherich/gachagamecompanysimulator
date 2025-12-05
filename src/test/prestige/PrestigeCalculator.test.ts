/**
 * Prestige System Tests - Prompt 7.3
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createInitialPrestigeState,
  PRESTIGE_UPGRADES,
  getUpgradeById,
  getUpgradeLevel,
  getUpgradeCost,
  canPurchaseUpgrade,
  calculateEffectValue,
  getAllEffects,
  type PrestigeState,
} from '../../domain/prestige/Prestige';
import {
  PrestigeCalculator,
  calculateLegacyPoints,
  getPrestigeCalculator,
  resetPrestigeCalculator,
  type RunSummary,
} from '../../domain/prestige/PrestigeCalculator';

describe('Prestige System', () => {
  describe('Upgrade Definitions', () => {
    it('should have multiple upgrades', () => {
      expect(PRESTIGE_UPGRADES.length).toBeGreaterThanOrEqual(15);
    });

    it('should have unique IDs', () => {
      const ids = PRESTIGE_UPGRADES.map(u => u.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have all required properties', () => {
      for (const upgrade of PRESTIGE_UPGRADES) {
        expect(upgrade).toHaveProperty('id');
        expect(upgrade).toHaveProperty('name');
        expect(upgrade).toHaveProperty('description');
        expect(upgrade).toHaveProperty('icon');
        expect(upgrade).toHaveProperty('category');
        expect(upgrade).toHaveProperty('maxLevel');
        expect(upgrade).toHaveProperty('baseCost');
        expect(upgrade).toHaveProperty('costMultiplier');
        expect(upgrade).toHaveProperty('effect');
      }
    });

    it('should have positive costs', () => {
      for (const upgrade of PRESTIGE_UPGRADES) {
        expect(upgrade.baseCost).toBeGreaterThan(0);
        expect(upgrade.costMultiplier).toBeGreaterThan(1);
      }
    });
  });

  describe('Helper Functions', () => {
    it('should get upgrade by ID', () => {
      const upgrade = getUpgradeById('starting_funds');
      expect(upgrade).toBeDefined();
      expect(upgrade?.name).toBe('Trust Fund');
    });

    it('should return undefined for invalid ID', () => {
      const upgrade = getUpgradeById('nonexistent');
      expect(upgrade).toBeUndefined();
    });

    it('should get upgrade level from state', () => {
      const state = createInitialPrestigeState();
      expect(getUpgradeLevel(state, 'starting_funds')).toBe(0);
      
      state.upgrades['starting_funds'] = 3;
      expect(getUpgradeLevel(state, 'starting_funds')).toBe(3);
    });

    it('should calculate upgrade cost with scaling', () => {
      const upgrade = getUpgradeById('starting_funds')!;
      
      const level0Cost = getUpgradeCost(upgrade, 0);
      const level1Cost = getUpgradeCost(upgrade, 1);
      const level2Cost = getUpgradeCost(upgrade, 2);
      
      expect(level0Cost).toBe(upgrade.baseCost);
      expect(level1Cost).toBeGreaterThan(level0Cost);
      expect(level2Cost).toBeGreaterThan(level1Cost);
    });
  });

  describe('Initial State', () => {
    it('should create valid initial state', () => {
      const state = createInitialPrestigeState();
      
      expect(state.totalLegacyPoints).toBe(0);
      expect(state.availableLegacyPoints).toBe(0);
      expect(state.lifetimeLegacyPointsEarned).toBe(0);
      expect(state.upgrades).toEqual({});
      expect(state.currentRun).toBe(1);
      expect(state.runHistory).toEqual([]);
      expect(state.totalPrestigeCount).toBe(0);
    });
  });

  describe('Purchase Validation', () => {
    let state: PrestigeState;

    beforeEach(() => {
      state = createInitialPrestigeState();
    });

    it('should not allow purchase with insufficient points', () => {
      const upgrade = getUpgradeById('starting_funds')!;
      const result = canPurchaseUpgrade(state, upgrade);
      
      expect(result.canPurchase).toBe(false);
      expect(result.reason).toContain('Legacy Points');
    });

    it('should allow purchase with sufficient points', () => {
      state.availableLegacyPoints = 1000;
      const upgrade = getUpgradeById('starting_funds')!;
      const result = canPurchaseUpgrade(state, upgrade);
      
      expect(result.canPurchase).toBe(true);
    });

    it('should not allow purchase above max level', () => {
      const upgrade = getUpgradeById('starting_funds')!;
      state.upgrades[upgrade.id as string] = upgrade.maxLevel;
      state.availableLegacyPoints = 10000;
      
      const result = canPurchaseUpgrade(state, upgrade);
      expect(result.canPurchase).toBe(false);
      expect(result.reason).toContain('Max level');
    });

    it('should require prerequisite upgrades', () => {
      const criticalSuccess = getUpgradeById('critical_success')!;
      state.availableLegacyPoints = 10000;
      
      const result = canPurchaseUpgrade(state, criticalSuccess);
      expect(result.canPurchase).toBe(false);
      expect(result.reason).toContain('Requires');
    });

    it('should allow purchase when prerequisite is met', () => {
      const criticalSuccess = getUpgradeById('critical_success')!;
      state.availableLegacyPoints = 10000;
      state.upgrades['quality_boost'] = 1; // Prerequisite
      
      const result = canPurchaseUpgrade(state, criticalSuccess);
      expect(result.canPurchase).toBe(true);
    });
  });

  describe('Effect Calculation', () => {
    let state: PrestigeState;

    beforeEach(() => {
      state = createInitialPrestigeState();
    });

    it('should return 0 for unpurchased upgrades', () => {
      const value = calculateEffectValue(state, 'startingMoney');
      expect(value).toBe(0);
    });

    it('should calculate effect value based on level', () => {
      state.upgrades['starting_funds'] = 3;
      const value = calculateEffectValue(state, 'startingMoney');
      
      const upgrade = getUpgradeById('starting_funds')!;
      const expected = upgrade.effect.baseValue + (upgrade.effect.perLevel * 3);
      expect(value).toBe(expected);
    });

    it('should get all effects', () => {
      state.upgrades['starting_funds'] = 1;
      state.upgrades['dev_speed'] = 2;
      
      const effects = getAllEffects(state);
      expect(effects.startingMoney).toBeGreaterThan(0);
      expect(effects.devSpeedBonus).toBeGreaterThan(0);
    });
  });
});

describe('Legacy Point Calculation', () => {
  const createSummary = (overrides: Partial<RunSummary> = {}): RunSummary => ({
    daysPlayed: 100,
    totalRevenue: 100000,
    maxReputation: 50,
    gamesLaunched: 5,
    peakEmployees: 10,
    achievementsUnlocked: 10,
    ...overrides,
  });

  it('should calculate base points', () => {
    const breakdown = calculateLegacyPoints(createSummary());
    expect(breakdown.basePoints).toBe(10);
  });

  it('should calculate revenue points logarithmically', () => {
    const low = calculateLegacyPoints(createSummary({ totalRevenue: 1000 }));
    const mid = calculateLegacyPoints(createSummary({ totalRevenue: 100000 }));
    const high = calculateLegacyPoints(createSummary({ totalRevenue: 1000000 }));
    
    expect(mid.revenuePoints).toBeGreaterThan(low.revenuePoints);
    expect(high.revenuePoints).toBeGreaterThan(mid.revenuePoints);
  });

  it('should calculate reputation points', () => {
    const breakdown = calculateLegacyPoints(createSummary({ maxReputation: 50 }));
    expect(breakdown.reputationPoints).toBe(25); // 50 * 0.5
  });

  it('should cap reputation points', () => {
    const breakdown = calculateLegacyPoints(createSummary({ maxReputation: 200 }));
    expect(breakdown.reputationPoints).toBe(50); // Capped
  });

  it('should calculate game launch points', () => {
    const breakdown = calculateLegacyPoints(createSummary({ gamesLaunched: 5 }));
    expect(breakdown.gamesPoints).toBe(25); // 5 * 5
  });

  it('should apply speed bonus for fast runs', () => {
    const fast = calculateLegacyPoints(createSummary({ daysPlayed: 25 }));
    const slow = calculateLegacyPoints(createSummary({ daysPlayed: 150 }));
    
    expect(fast.speedBonus).toBeGreaterThan(0);
    expect(slow.speedBonus).toBe(0);
    expect(fast.totalPoints).toBeGreaterThan(slow.totalPoints);
  });

  it('should include milestone bonuses', () => {
    const breakdown = calculateLegacyPoints(createSummary({ 
      gamesLaunched: 10, // Triggers 'prolific_dev' milestone
      totalRevenue: 1000000, // Triggers 'first_million' milestone
    }));
    
    expect(breakdown.milestonePoints).toBeGreaterThan(0);
    expect(breakdown.milestones.length).toBeGreaterThan(0);
  });
});

describe('PrestigeCalculator', () => {
  let calculator: PrestigeCalculator;

  beforeEach(() => {
    resetPrestigeCalculator();
    calculator = new PrestigeCalculator();
  });

  const createSummary = (overrides: Partial<RunSummary> = {}): RunSummary => ({
    daysPlayed: 100,
    totalRevenue: 100000,
    maxReputation: 50,
    gamesLaunched: 5,
    peakEmployees: 10,
    achievementsUnlocked: 10,
    ...overrides,
  });

  describe('Prestige Execution', () => {
    it('should check prestige requirements', () => {
      const noGame = calculator.canPrestige(createSummary({ gamesLaunched: 0 }));
      expect(noGame.canPrestige).toBe(false);
      
      const valid = calculator.canPrestige(createSummary());
      expect(valid.canPrestige).toBe(true);
    });

    it('should execute prestige and award points', () => {
      const result = calculator.prestige(createSummary());
      
      expect(result.success).toBe(true);
      expect(result.breakdown.totalPoints).toBeGreaterThan(0);
      
      const state = calculator.getState();
      expect(state.availableLegacyPoints).toBe(result.breakdown.totalPoints);
      expect(state.currentRun).toBe(2);
      expect(state.runHistory.length).toBe(1);
    });

    it('should accumulate points across prestiges', () => {
      calculator.prestige(createSummary());
      const firstPoints = calculator.getState().availableLegacyPoints;
      
      calculator.prestige(createSummary());
      const secondPoints = calculator.getState().availableLegacyPoints;
      
      expect(secondPoints).toBeGreaterThan(firstPoints);
    });
  });

  describe('Upgrade Purchase', () => {
    beforeEach(() => {
      // Give enough points to test purchases
      calculator.prestige(createSummary({ totalRevenue: 10000000 }));
    });

    it('should purchase upgrade and deduct points', () => {
      const initialPoints = calculator.getState().availableLegacyPoints;
      const result = calculator.purchaseUpgrade('starting_funds');
      
      expect(result.success).toBe(true);
      expect(calculator.getState().availableLegacyPoints).toBeLessThan(initialPoints);
      expect(calculator.getState().upgrades['starting_funds']).toBe(1);
    });

    it('should reject purchase without enough points', () => {
      // Use all points
      while (calculator.purchaseUpgrade('starting_funds').success) {
        // Drain all points
      }
      
      const result = calculator.purchaseUpgrade('dev_speed');
      expect(result.success).toBe(false);
    });

    it('should refund all upgrades', () => {
      calculator.purchaseUpgrade('starting_funds');
      calculator.purchaseUpgrade('dev_speed');
      
      const beforeRefund = calculator.getState().availableLegacyPoints;
      const refunded = calculator.refundAllUpgrades();
      
      expect(refunded).toBeGreaterThan(0);
      expect(calculator.getState().availableLegacyPoints).toBeGreaterThan(beforeRefund);
      expect(Object.keys(calculator.getState().upgrades).length).toBe(0);
    });
  });

  describe('Active Effects', () => {
    beforeEach(() => {
      calculator.prestige(createSummary({ totalRevenue: 10000000 }));
    });

    it('should return effects for purchased upgrades', () => {
      calculator.purchaseUpgrade('starting_funds');
      
      const effects = calculator.getActiveEffects();
      expect(effects.startingMoney).toBeGreaterThan(0);
    });

    it('should get specific effect', () => {
      calculator.purchaseUpgrade('dev_speed');
      calculator.purchaseUpgrade('dev_speed');
      
      const devSpeed = calculator.getEffect('devSpeedBonus');
      expect(devSpeed).toBeGreaterThan(0);
    });
  });

  describe('Stats', () => {
    it('should track run statistics', () => {
      calculator.prestige(createSummary({ totalRevenue: 50000 }));
      calculator.prestige(createSummary({ totalRevenue: 100000 }));
      calculator.prestige(createSummary({ totalRevenue: 200000 }));
      
      const stats = calculator.getStats();
      expect(stats.totalRuns).toBe(3);
      expect(stats.totalLegacyEarned).toBeGreaterThan(0);
      expect(stats.bestRun).toBeDefined();
      expect(stats.averagePointsPerRun).toBeGreaterThan(0);
    });
  });

  describe('Singleton', () => {
    it('should return same instance from getPrestigeCalculator', () => {
      const calc1 = getPrestigeCalculator();
      const calc2 = getPrestigeCalculator();
      expect(calc1).toBe(calc2);
    });

    it('should reset singleton on resetPrestigeCalculator', () => {
      const calc1 = getPrestigeCalculator();
      calc1.prestige(createSummary());
      
      resetPrestigeCalculator();
      
      const calc2 = getPrestigeCalculator();
      expect(calc2.getState().currentRun).toBe(1);
    });
  });
});
