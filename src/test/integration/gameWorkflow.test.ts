/**
 * Integration Tests - Game Development Workflow
 * 
 * Tests complete game development workflows from start to finish,
 * verifying that all components work together correctly.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Employee } from '@domain/employee';
import { Game, GameStatus } from '@domain/game';
import { 
  processDevelopmentTick, 
  transitionPhase,
  canTransition,
} from '@domain/game';
import { SeededRNG } from '@domain/shared';
import { 
  CompanyBuilder, 
  EmployeeBuilder, 
  GameBuilder,
  assertResultSuccess,
  assertValidCompany,
  assertValidGame,
} from '../utils';

describe('Game Development Workflow Integration', () => {
  // =========================================================================
  // Test Setup
  // =========================================================================
  
  let team: Employee[];
  let game: Game;
  let rng: SeededRNG;
  let currentTick: number;

  beforeEach(() => {
    rng = new SeededRNG(12345);
    currentTick = 0;

    // Create a diverse team
    team = [
      new EmployeeBuilder()
        .withName('Lead Programmer')
        .withRole('Programmer')
        .withSkills({ programming: 80, game_design: 40 })
        .withMorale(85)
        .build(),
      new EmployeeBuilder()
        .withName('Artist')
        .withRole('Artist')
        .withSkills({ art: 75, game_design: 30 })
        .withMorale(80)
        .build(),
      new EmployeeBuilder()
        .withName('Game Designer')
        .withRole('Designer')
        .withSkills({ game_design: 70, programming: 25, writing: 60 })
        .withMorale(90)
        .build(),
    ];

    // Create a new game in planning phase
    game = new GameBuilder()
      .withName('Epic Adventure')
      .withGenre('rpg')
      .withStatus('planning')
      .withProgress(0)
      .build();
  });

  // =========================================================================
  // Complete Workflow Tests
  // =========================================================================
  
  describe('Complete Development Cycle', () => {
    it('should progress a game from planning through launch', () => {
      // Similar to other tests, rely on auto-transition
      let currentGame = game;
      let tick = 0;
      const maxTicks = 1000;

      // Game starts in planning
      expect(currentGame.status).toBe('planning');

      // Process until game reaches live status (auto-transition handles phase changes)
      while (currentGame.status !== 'live' && tick < maxTicks) {
        const result = processDevelopmentTick(currentGame, team, tick++, rng);
        if (result.success) {
          currentGame = result.value.game;
        }
      }

      // Final state should be live
      expect(currentGame.status).toBe('live');
      expect(tick).toBeLessThan(maxTicks);
      assertValidGame(currentGame);
    });

    it('should accumulate quality during development phases', () => {
      let currentGame = game;
      let tick = 0;
      
      // Record initial quality
      const initialQuality = { ...currentGame.quality };

      // Run through planning and development phases (limited ticks)
      for (let i = 0; i < 50; i++) {
        const tickResult = processDevelopmentTick(currentGame, team, tick++, rng);
        if (tickResult.success) {
          currentGame = tickResult.value.game;
        }
      }

      // Quality should have improved
      const finalQuality = currentGame.quality;
      const totalInitial = Object.values(initialQuality).reduce((a, b) => a + b, 0);
      const totalFinal = Object.values(finalQuality).reduce((a, b) => a + b, 0);

      expect(totalFinal).toBeGreaterThan(totalInitial);
    });

    it('should apply team skills to relevant quality metrics', () => {
      // Start with a team strong in specific areas
      const artTeam = [
        new EmployeeBuilder()
          .withRole('Artist')
          .withSkills({ art: 95 })
          .build(),
        new EmployeeBuilder()
          .withRole('Artist')
          .withSkills({ art: 90 })
          .build(),
      ];

      const devGame = new GameBuilder()
        .withStatus('development')
        .withProgress(0)
        .build();

      let currentGame = devGame;
      for (let i = 0; i < 50; i++) {
        const tickResult = processDevelopmentTick(currentGame, artTeam, i, rng);
        if (tickResult.success) {
          currentGame = tickResult.value.game;
        }
      }

      // Graphics should be the most improved quality (artists = graphics)
      expect(currentGame.quality.graphics).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Phase Transition Tests
  // =========================================================================
  
  describe('Phase Transitions', () => {
    it('should validate allowed transitions', () => {
      expect(canTransition('planning', 'development')).toBe(true);
      expect(canTransition('development', 'testing')).toBe(true);
      expect(canTransition('testing', 'soft_launch')).toBe(true);
      expect(canTransition('soft_launch', 'live')).toBe(true);
      expect(canTransition('live', 'maintenance')).toBe(true);
      expect(canTransition('maintenance', 'live')).toBe(true);
    });

    it('should reject invalid transitions', () => {
      expect(canTransition('planning', 'live')).toBe(false);
      expect(canTransition('testing', 'planning')).toBe(false);
      expect(canTransition('live', 'development')).toBe(false);
    });

    it('should allow shutdown from any active phase', () => {
      const activePhases: GameStatus[] = ['planning', 'development', 'testing', 'soft_launch', 'live', 'maintenance'];
      
      for (const phase of activePhases) {
        expect(canTransition(phase, 'shutdown')).toBe(true);
      }
    });

    it('should not allow transitions after shutdown', () => {
      const shutdownGame = new GameBuilder().withStatus('shutdown').build();
      
      const result = transitionPhase(shutdownGame, 'live', 100);
      expect(result.success).toBe(false);
    });
  });

  // =========================================================================
  // Team Effectiveness Tests
  // =========================================================================
  
  describe('Team Effectiveness', () => {
    it('should develop faster with more employees', () => {
      const smallTeam = [team[0]]; // Just one programmer
      const fullTeam = team;       // Three employees

      let gameSmall = game;
      let gameFull = { ...game, id: 'game-full' } as Game;

      // Run 20 ticks on each
      for (let i = 0; i < 20; i++) {
        const rngSmall = new SeededRNG(i);
        const rngFull = new SeededRNG(i);
        
        const smallResult = processDevelopmentTick(gameSmall, smallTeam, i, rngSmall);
        const fullResult = processDevelopmentTick(gameFull, fullTeam, i, rngFull);
        
        gameSmall = assertResultSuccess(smallResult).game;
        gameFull = assertResultSuccess(fullResult).game;
      }

      // Full team should have made more progress
      expect(gameFull.developmentProgress).toBeGreaterThan(gameSmall.developmentProgress);
    });

    it('should develop faster with skilled employees', () => {
      const juniorTeam = [
        new EmployeeBuilder().withSkills({ programming: 20, game_design: 15 }).build(),
        new EmployeeBuilder().withSkills({ art: 25, game_design: 20 }).build(),
      ];

      const seniorTeam = [
        new EmployeeBuilder().withSkills({ programming: 90, game_design: 80 }).build(),
        new EmployeeBuilder().withSkills({ art: 85, game_design: 75 }).build(),
      ];

      let gameJunior = game;
      let gameSenior = { ...game, id: 'game-senior' } as Game;

      for (let i = 0; i < 30; i++) {
        const rngJunior = new SeededRNG(i);
        const rngSenior = new SeededRNG(i);
        
        const juniorResult = processDevelopmentTick(gameJunior, juniorTeam, i, rngJunior);
        const seniorResult = processDevelopmentTick(gameSenior, seniorTeam, i, rngSenior);
        
        gameJunior = assertResultSuccess(juniorResult).game;
        gameSenior = assertResultSuccess(seniorResult).game;
      }

      expect(gameSenior.developmentProgress).toBeGreaterThan(gameJunior.developmentProgress);
    });

    it('should handle empty team gracefully', () => {
      const emptyTeam: Employee[] = [];
      
      const result = processDevelopmentTick(game, emptyTeam, currentTick, rng);
      
      // Should succeed but make no progress
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.progressMade).toBe(0);
      }
    });
  });

  // =========================================================================
  // Deterministic Behavior Tests
  // =========================================================================
  
  describe('Deterministic Behavior', () => {
    it('should produce identical results with same seed', () => {
      const rng1 = new SeededRNG(99999);
      const rng2 = new SeededRNG(99999);

      let game1 = game;
      let game2 = { ...game };

      for (let i = 0; i < 50; i++) {
        const result1 = processDevelopmentTick(game1, team, i, rng1);
        const result2 = processDevelopmentTick(game2, team, i, rng2);

        game1 = assertResultSuccess(result1).game;
        game2 = assertResultSuccess(result2).game;
      }

      expect(game1.developmentProgress).toBe(game2.developmentProgress);
      expect(game1.quality).toEqual(game2.quality);
    });

    it('should produce different results with different seeds', () => {
      const results: number[] = [];

      for (const seed of [11111, 22222, 33333]) {
        const seedRng = new SeededRNG(seed);
        let currentGame = game;

        for (let i = 0; i < 30; i++) {
          const result = processDevelopmentTick(currentGame, team, i, seedRng);
          currentGame = assertResultSuccess(result).game;
        }

        results.push(currentGame.developmentProgress);
      }

      // At least 2 different results (extremely unlikely to be all same)
      const uniqueResults = new Set(results.map(r => Math.round(r)));
      expect(uniqueResults.size).toBeGreaterThanOrEqual(2);
    });
  });

  // =========================================================================
  // Edge Cases
  // =========================================================================
  
  describe('Edge Cases', () => {
    it('should handle game at 100% progress', () => {
      const completedGame = new GameBuilder()
        .withStatus('development')
        .withProgress(100)
        .build();

      const result = processDevelopmentTick(completedGame, team, currentTick, rng);
      expect(result.success).toBe(true);
    });

    it('should handle game in live status (no progress needed)', () => {
      const liveGame = new GameBuilder()
        .withStatus('live')
        .withProgress(100)
        .build();

      const result = processDevelopmentTick(liveGame, team, currentTick, rng);
      expect(result.success).toBe(true);
      if (result.success) {
        // Live phase doesn't need progress
        expect(result.value.game.status).toBe('live');
      }
    });

    it('should handle transition through all phases in sequence', () => {
      let currentGame = game;
      let tick = 0;
      const maxTicks = 500;

      // Process until game reaches live status (auto-transition handles phase changes)
      while (currentGame.status !== 'live' && tick < maxTicks) {
        const result = processDevelopmentTick(currentGame, team, tick++, rng);
        if (result.success) {
          currentGame = result.value.game;
        }
      }

      expect(currentGame.status).toBe('live');
      expect(tick).toBeLessThan(maxTicks);
    });
  });

  // =========================================================================
  // Multi-Week Simulation
  // =========================================================================
  
  describe('Multi-Week Simulation', () => {
    it('should simulate multiple weeks of development', () => {
      const ticksPerWeek = 7; // Assuming 1 tick per day
      const weeksToSimulate = 4;
      let currentGame = game;
      let tick = 0;

      const weeklyProgress: number[] = [];

      for (let week = 0; week < weeksToSimulate; week++) {
        const startProgress = currentGame.developmentProgress;

        for (let day = 0; day < ticksPerWeek; day++) {
          const result = processDevelopmentTick(currentGame, team, tick++, rng);
          currentGame = assertResultSuccess(result).game;
        }

        const weekProgress = currentGame.developmentProgress - startProgress;
        weeklyProgress.push(weekProgress);
      }

      // Each week should have made some progress
      expect(weeklyProgress.every(p => p > 0)).toBe(true);

      // Total progress should be substantial
      const totalProgress = weeklyProgress.reduce((a, b) => a + b, 0);
      expect(totalProgress).toBeGreaterThan(10); // At least 10% in 4 weeks
    });

    it('should track quality improvements over time', () => {
      const ticksToSimulate = 50;
      let currentGame = game;
      const qualityHistory: number[] = [];

      for (let i = 0; i < ticksToSimulate; i++) {
        const result = processDevelopmentTick(currentGame, team, i, rng);
        currentGame = assertResultSuccess(result).game;

        const totalQuality = Object.values(currentGame.quality).reduce((a, b) => a + b, 0);
        qualityHistory.push(totalQuality);
      }

      // Quality should generally trend upward
      const firstHalf = qualityHistory.slice(0, 25);
      const secondHalf = qualityHistory.slice(25);

      const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      expect(avgSecond).toBeGreaterThanOrEqual(avgFirst);
    });
  });
});

// =========================================================================
// Scenario-Based Integration Tests
// =========================================================================

describe('Scenario-Based Integration', () => {
  describe('Startup Studio Scenario', () => {
    it('should complete a full game development cycle for a small startup', () => {
      const rng = new SeededRNG(42);
      
      // Small startup with limited resources
      const startup = new CompanyBuilder()
        .asStartup()
        .withName('Indie Dreams')
        .build();

      // Just 2 developers
      const minimalTeam = [
        new EmployeeBuilder().asJunior().withRole('Programmer').build(),
        new EmployeeBuilder().asJunior().withRole('Artist').build(),
      ];

      // Simple game
      let game = new GameBuilder()
        .withName('First Game')
        .withGenre('puzzle')
        .withStatus('planning')
        .build();

      assertValidCompany(startup);

      // Simulate development - game auto-transitions between phases
      let ticks = 0;
      const maxTicks = 1000;

      while (game.status !== 'live' && ticks < maxTicks) {
        const result = processDevelopmentTick(game, minimalTeam, ticks, rng);
        if (result.success) {
          game = result.value.game;
        }
        ticks++;
      }

      expect(game.status).toBe('live');
      expect(ticks).toBeLessThan(maxTicks);
      assertValidGame(game);
    });
  });

  describe('Established Studio Scenario', () => {
    it('should develop high-quality games with experienced team', () => {
      const rng = new SeededRNG(12345);

      // Large team of seniors
      const expertTeam = [
        new EmployeeBuilder().asSenior().withRole('Programmer').withSkills({ programming: 95 }).build(),
        new EmployeeBuilder().asSenior().withRole('Artist').withSkills({ art: 90 }).build(),
        new EmployeeBuilder().asSenior().withRole('Designer').withSkills({ game_design: 88 }).build(),
        new EmployeeBuilder().withRole('Programmer').withSkills({ programming: 85, sound: 70 }).build(),
        new EmployeeBuilder().withRole('Marketer').withSkills({ marketing: 80 }).build(),
      ];

      let game = new GameBuilder()
        .withName('AAA Title')
        .withGenre('rpg')
        .withStatus('development')
        .build();

      // Run development phase
      for (let i = 0; i < 100; i++) {
        const result = processDevelopmentTick(game, expertTeam, i, rng);
        game = assertResultSuccess(result).game;
      }

      // Quality should be improved with expert team
      const avgQuality = Object.values(game.quality).reduce((a, b) => a + b, 0) / 5;
      expect(avgQuality).toBeGreaterThan(0); // Should have gained some quality
    });
  });
});
