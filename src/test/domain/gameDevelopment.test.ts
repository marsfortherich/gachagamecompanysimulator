import { describe, it, expect } from 'vitest';
import {
  createGame,
  calculateOverallQuality,
} from '../../domain/game';
import {
  canTransition,
  transitionPhase,
  processDevelopmentTick,
  calculateTickProgress,
  estimatePhaseCompletion,
  DEVELOPMENT_PHASES,
} from '../../domain/game/GameDevelopmentManager';
import { createEmployee } from '../../domain/employee';
import { SeededRNG } from '../../domain/shared';

describe('GameDevelopmentManager', () => {
  const createTestTeam = () => [
    createEmployee({ name: 'Programmer', role: 'Programmer', skills: { programming: 80 }, salary: 5000, hiredDate: 0 }),
    createEmployee({ name: 'Artist', role: 'Artist', skills: { art: 75 }, salary: 4500, hiredDate: 0 }),
    createEmployee({ name: 'Designer', role: 'Designer', skills: { game_design: 70 }, salary: 4000, hiredDate: 0 }),
  ];

  describe('canTransition', () => {
    it('should allow normal phase progression', () => {
      expect(canTransition('planning', 'development')).toBe(true);
      expect(canTransition('development', 'testing')).toBe(true);
      expect(canTransition('testing', 'soft_launch')).toBe(true);
      expect(canTransition('soft_launch', 'live')).toBe(true);
    });

    it('should not allow skipping phases', () => {
      expect(canTransition('planning', 'testing')).toBe(false);
      expect(canTransition('planning', 'live')).toBe(false);
      expect(canTransition('development', 'live')).toBe(false);
    });

    it('should allow shutdown from any phase', () => {
      expect(canTransition('planning', 'shutdown')).toBe(true);
      expect(canTransition('development', 'shutdown')).toBe(true);
      expect(canTransition('live', 'shutdown')).toBe(true);
    });

    it('should allow maintenance toggle for live games', () => {
      expect(canTransition('live', 'maintenance')).toBe(true);
      expect(canTransition('maintenance', 'live')).toBe(true);
    });
  });

  describe('transitionPhase', () => {
    it('should transition to next phase', () => {
      const game = createGame({ name: 'Test Game', genre: 'rpg', startDate: 0 });
      const result = transitionPhase(game, 'development', 100);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.status).toBe('development');
        expect(result.value.developmentProgress).toBe(0);
      }
    });

    it('should fail for invalid transition', () => {
      const game = createGame({ name: 'Test Game', genre: 'rpg', startDate: 0 });
      const result = transitionPhase(game, 'live', 100);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_TRANSITION');
      }
    });

    it('should fail for shutdown game', () => {
      let game = createGame({ name: 'Test Game', genre: 'rpg', startDate: 0 });
      const shutdownResult = transitionPhase(game, 'shutdown', 100);
      if (shutdownResult.success) {
        game = shutdownResult.value;
      }
      
      const result = transitionPhase(game, 'planning', 200);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('GAME_SHUTDOWN');
      }
    });
  });

  describe('calculateTickProgress', () => {
    it('should return 0 for no employees', () => {
      const game = createGame({ name: 'Test Game', genre: 'rpg', startDate: 0 });
      const progress = calculateTickProgress(game, []);
      expect(progress).toBe(0);
    });

    it('should calculate progress based on team effectiveness', () => {
      const game = createGame({ name: 'Test Game', genre: 'rpg', startDate: 0 });
      const team = createTestTeam();
      const rng = new SeededRNG(42);
      
      const progress = calculateTickProgress(game, team, rng);
      expect(progress).toBeGreaterThan(0);
    });

    it('should be deterministic with seeded RNG', () => {
      const game = createGame({ name: 'Test Game', genre: 'rpg', startDate: 0 });
      const team = createTestTeam();
      
      const rng1 = new SeededRNG(12345);
      const rng2 = new SeededRNG(12345);
      
      const progress1 = calculateTickProgress(game, team, rng1);
      const progress2 = calculateTickProgress(game, team, rng2);
      
      expect(progress1).toBe(progress2);
    });
  });

  describe('processDevelopmentTick', () => {
    it('should increase progress', () => {
      const game = createGame({ name: 'Test Game', genre: 'rpg', startDate: 0 });
      const team = createTestTeam();
      const rng = new SeededRNG(42);
      
      const result = processDevelopmentTick(game, team, 1, rng);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.progressMade).toBeGreaterThan(0);
        expect(result.value.game.developmentProgress).toBeGreaterThan(0);
      }
    });

    it('should improve quality metrics', () => {
      const game = createGame({ name: 'Test Game', genre: 'rpg', startDate: 0 });
      const team = createTestTeam();
      const rng = new SeededRNG(42);
      
      const result = processDevelopmentTick(game, team, 1, rng);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const qualityKeys = Object.keys(result.value.qualityGained);
        expect(qualityKeys.length).toBeGreaterThan(0);
      }
    });

    it('should complete phase when progress reaches 100', () => {
      let game = createGame({ name: 'Test Game', genre: 'rpg', startDate: 0 });
      // Force progress to very near completion - need to exceed 100 after tick
      game = { ...game, developmentProgress: 99.5 };
      
      const team = createTestTeam();
      const rng = new SeededRNG(42);
      
      const result = processDevelopmentTick(game, team, 100, rng);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // Progress should have exceeded 100
        expect(result.value.phaseCompleted).toBe(true);
        expect(result.value.game.status).toBe('development'); // Auto-transitioned
      }
    });
  });

  describe('estimatePhaseCompletion', () => {
    it('should return null for live phase', () => {
      let game = createGame({ name: 'Test Game', genre: 'rpg', startDate: 0 });
      game = { ...game, status: 'live' };
      
      const estimate = estimatePhaseCompletion(game, createTestTeam());
      expect(estimate).toBeNull();
    });

    it('should return 0 for completed phase', () => {
      let game = createGame({ name: 'Test Game', genre: 'rpg', startDate: 0 });
      game = { ...game, developmentProgress: 100 };
      
      const estimate = estimatePhaseCompletion(game, createTestTeam());
      expect(estimate).toBe(0);
    });

    it('should estimate days based on team size', () => {
      const game = createGame({ name: 'Test Game', genre: 'rpg', startDate: 0 });
      const smallTeam = [createTestTeam()[0]];
      const largeTeam = createTestTeam();
      
      const smallEstimate = estimatePhaseCompletion(game, smallTeam);
      const largeEstimate = estimatePhaseCompletion(game, largeTeam);
      
      expect(smallEstimate).toBeGreaterThan(0);
      expect(largeEstimate).toBeGreaterThan(0);
    });
  });

  describe('DEVELOPMENT_PHASES', () => {
    it('should have all phases configured', () => {
      expect(DEVELOPMENT_PHASES.planning).toBeDefined();
      expect(DEVELOPMENT_PHASES.development).toBeDefined();
      expect(DEVELOPMENT_PHASES.testing).toBeDefined();
      expect(DEVELOPMENT_PHASES.soft_launch).toBeDefined();
      expect(DEVELOPMENT_PHASES.live).toBeDefined();
      expect(DEVELOPMENT_PHASES.maintenance).toBeDefined();
      expect(DEVELOPMENT_PHASES.shutdown).toBeDefined();
    });

    it('should chain correctly', () => {
      expect(DEVELOPMENT_PHASES.planning.nextPhase).toBe('development');
      expect(DEVELOPMENT_PHASES.development.nextPhase).toBe('testing');
      expect(DEVELOPMENT_PHASES.testing.nextPhase).toBe('soft_launch');
      expect(DEVELOPMENT_PHASES.soft_launch.nextPhase).toBe('live');
      expect(DEVELOPMENT_PHASES.live.nextPhase).toBeNull();
    });
  });
});

describe('Game Quality', () => {
  it('should calculate weighted overall quality', () => {
    const quality = {
      graphics: 80,
      gameplay: 90,
      story: 70,
      sound: 60,
      polish: 50,
    };
    
    // weights: graphics 0.2, gameplay 0.35, story 0.2, sound 0.1, polish 0.15
    const expected = 80 * 0.2 + 90 * 0.35 + 70 * 0.2 + 60 * 0.1 + 50 * 0.15;
    const overall = calculateOverallQuality(quality);
    
    expect(overall).toBeCloseTo(expected, 2);
  });
});
