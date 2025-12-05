import { describe, it, expect } from 'vitest';
import {
  DifficultyMode,
  DIFFICULTY_CONFIGS,
  DifficultyManager,
  getDifficultyManager,
} from '../../domain/difficulty';

describe('DifficultyManager', () => {
  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const manager1 = getDifficultyManager();
      const manager2 = getDifficultyManager();
      expect(manager1).toBe(manager2);
    });
  });

  describe('Initialization', () => {
    it('should default to standard difficulty', () => {
      const manager = new DifficultyManager();
      expect(manager.getMode()).toBe('standard');
    });

    it('should initialize with provided difficulty', () => {
      const manager = new DifficultyManager('hardcore');
      expect(manager.getMode()).toBe('hardcore');
    });
  });

  describe('Difficulty Changes', () => {
    it('should change difficulty successfully', () => {
      const manager = new DifficultyManager();
      manager.setMode('casual');
      expect(manager.getMode()).toBe('casual');
    });

    it('should return correct modifiers for current difficulty', () => {
      const manager = new DifficultyManager('casual');
      const modifiers = manager.getModifiers();
      
      expect(modifiers.startingMoney).toBe(
        DIFFICULTY_CONFIGS.casual.modifiers.startingMoney
      );
    });
  });

  describe('Modifier Application', () => {
    it('should apply cost modifiers correctly', () => {
      const manager = new DifficultyManager('casual');
      
      const baseValue = 1000;
      const result = manager.applyCostModifier(baseValue);
      
      expect(result).toBe(baseValue * DIFFICULTY_CONFIGS.casual.modifiers.costMultiplier);
    });

    it('should apply revenue modifiers correctly', () => {
      const manager = new DifficultyManager('casual');
      
      const baseValue = 1000;
      const result = manager.applyRevenueModifier(baseValue);
      
      expect(result).toBe(baseValue * DIFFICULTY_CONFIGS.casual.modifiers.revenuMultiplier);
    });

    it('should handle different modifiers for different difficulties', () => {
      const casualManager = new DifficultyManager('casual');
      const hardcoreManager = new DifficultyManager('hardcore');
      
      const baseValue = 100;
      const casualResult = casualManager.applyCostModifier(baseValue);
      const hardcoreResult = hardcoreManager.applyCostModifier(baseValue);
      
      // Casual should have lower costs
      expect(casualResult).toBeLessThan(hardcoreResult);
    });
  });

  describe('State Management', () => {
    it('should get and load state correctly', () => {
      const manager = new DifficultyManager('hardcore');
      const state = manager.getState();
      
      expect(state.currentMode).toBe('hardcore');
      
      const newManager = new DifficultyManager();
      newManager.loadState(state);
      
      expect(newManager.getMode()).toBe('hardcore');
    });
  });

  describe('Feature Flags', () => {
    it('should check achievements enabled for sandbox', () => {
      const manager = new DifficultyManager('sandbox');
      
      expect(manager.achievementsEnabled()).toBe(false);
      expect(manager.leaderboardEnabled()).toBe(false);
    });

    it('should have achievements enabled for standard mode', () => {
      const manager = new DifficultyManager('standard');
      
      expect(manager.achievementsEnabled()).toBe(true);
    });
  });
});

describe('Difficulty Configurations', () => {
  const difficulties: DifficultyMode[] = ['casual', 'standard', 'hardcore', 'sandbox'];

  describe('Configuration Existence', () => {
    it('should have configurations for all difficulty modes', () => {
      difficulties.forEach((mode) => {
        expect(DIFFICULTY_CONFIGS[mode]).toBeDefined();
      });
    });

    it('should have valid structure for all configurations', () => {
      difficulties.forEach((mode) => {
        const config = DIFFICULTY_CONFIGS[mode];
        
        expect(config.id).toBe(mode);
        expect(config.name).toBeDefined();
        expect(config.description).toBeDefined();
        expect(config.modifiers).toBeDefined();
      });
    });
  });

  describe('Modifier Values', () => {
    it('should have starting money multiplier', () => {
      difficulties.forEach((mode) => {
        expect(typeof DIFFICULTY_CONFIGS[mode].modifiers.startingMoney).toBe('number');
      });
    });

    it('should have casual with highest starting money', () => {
      expect(DIFFICULTY_CONFIGS.casual.modifiers.startingMoney)
        .toBeGreaterThan(DIFFICULTY_CONFIGS.standard.modifiers.startingMoney);
      expect(DIFFICULTY_CONFIGS.standard.modifiers.startingMoney)
        .toBeGreaterThan(DIFFICULTY_CONFIGS.hardcore.modifiers.startingMoney);
    });

    it('should have hardcore with highest competition', () => {
      expect(DIFFICULTY_CONFIGS.hardcore.modifiers.marketCompetition)
        .toBeGreaterThan(DIFFICULTY_CONFIGS.standard.modifiers.marketCompetition);
      expect(DIFFICULTY_CONFIGS.standard.modifiers.marketCompetition)
        .toBeGreaterThan(DIFFICULTY_CONFIGS.casual.modifiers.marketCompetition);
    });

    it('should have bankruptcy tolerance vary by difficulty', () => {
      // Casual should have more bankruptcy tolerance (higher threshold)
      expect(DIFFICULTY_CONFIGS.casual.modifiers.bankruptcyTolerance)
        .toBeGreaterThan(DIFFICULTY_CONFIGS.hardcore.modifiers.bankruptcyTolerance);
    });
  });

  describe('Sandbox Mode', () => {
    it('should have sandbox with generous modifiers', () => {
      const sandbox = DIFFICULTY_CONFIGS.sandbox.modifiers;
      
      // Sandbox should have high starting money
      expect(sandbox.startingMoney).toBeGreaterThanOrEqual(
        DIFFICULTY_CONFIGS.casual.modifiers.startingMoney
      );
      
      // Low competition
      expect(sandbox.marketCompetition).toBeLessThanOrEqual(
        DIFFICULTY_CONFIGS.casual.modifiers.marketCompetition
      );
    });

    it('should have achievements disabled', () => {
      expect(DIFFICULTY_CONFIGS.sandbox.features.achievementsEnabled).toBe(false);
    });
  });
});

describe('Difficulty Progression', () => {
  it('should have difficulty ordered from easiest to hardest', () => {
    const difficultyOrder: DifficultyMode[] = ['casual', 'standard', 'hardcore'];
    
    for (let i = 0; i < difficultyOrder.length - 1; i++) {
      const easier = DIFFICULTY_CONFIGS[difficultyOrder[i]].modifiers;
      const harder = DIFFICULTY_CONFIGS[difficultyOrder[i + 1]].modifiers;
      
      // Starting money should decrease
      expect(easier.startingMoney).toBeGreaterThanOrEqual(harder.startingMoney);
      
      // Competition should increase
      expect(easier.marketCompetition).toBeLessThanOrEqual(harder.marketCompetition);
    }
  });
});

describe('DifficultyModifiers Interface', () => {
  it('should have all expected modifier keys', () => {
    const modifiers = DIFFICULTY_CONFIGS.standard.modifiers;
    
    // Check all expected modifiers exist
    expect(modifiers.startingMoney).toBeDefined();
    expect(modifiers.startingReputation).toBeDefined();
    expect(modifiers.salaryGrowthRate).toBeDefined();
    expect(modifiers.marketCompetition).toBeDefined();
    expect(modifiers.revenuMultiplier).toBeDefined();
    expect(modifiers.costMultiplier).toBeDefined();
    expect(modifiers.reputationGainMultiplier).toBeDefined();
    expect(modifiers.reputationLossMultiplier).toBeDefined();
    expect(modifiers.bankruptcyTolerance).toBeDefined();
    expect(modifiers.rngVariance).toBeDefined();
    expect(modifiers.developmentSpeed).toBeDefined();
  });
});
