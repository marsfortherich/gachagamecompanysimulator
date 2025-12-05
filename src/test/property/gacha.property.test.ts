/**
 * Property-Based Tests using fast-check
 * 
 * These tests verify invariants and properties that should hold
 * for all possible inputs, not just specific test cases.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  createCurrency, 
  addCurrency, 
  subtractCurrency,
  Currency,
} from '@domain/shared';
import { createCompany, updateCompanyFunds, updateCompanyReputation } from '@domain/company';
import { generateRandomEmployee } from '@domain/employee';
import { createGame, createDefaultGachaRates, GachaRates } from '@domain/game';
import { simulatePull, Rarity } from '@domain/gacha';
import { SeededRNG } from '@domain/shared';
import { 
  createItemPool, 
  BannerBuilder,
} from '../utils';

describe('Property-Based Tests', () => {
  // =========================================================================
  // Currency Properties
  // =========================================================================
  
  describe('Currency Properties', () => {
    // Arbitrary for valid currency amounts
    const currencyAmount = fc.nat(1000000);
    const currencyArb = fc.record({
      gems: currencyAmount,
      gold: currencyAmount,
      tickets: currencyAmount,
    });

    it('should maintain non-negative values after creation', () => {
      fc.assert(
        fc.property(
          fc.nat(1000000),
          fc.nat(1000000),
          fc.nat(1000000),
          (gems, gold, tickets) => {
            const currency = createCurrency({ gems, gold, tickets });
            return (
              currency.gems >= 0 &&
              currency.gold >= 0 &&
              currency.tickets >= 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('addCurrency should be commutative (a + b = b + a)', () => {
      fc.assert(
        fc.property(currencyArb, currencyArb, (a, b) => {
          const result1 = addCurrency(a, b);
          const result2 = addCurrency(b, a);
          return (
            result1.gems === result2.gems &&
            result1.gold === result2.gold &&
            result1.tickets === result2.tickets
          );
        }),
        { numRuns: 100 }
      );
    });

    it('addCurrency should be associative ((a + b) + c = a + (b + c))', () => {
      fc.assert(
        fc.property(currencyArb, currencyArb, currencyArb, (a, b, c) => {
          const left = addCurrency(addCurrency(a, b), c);
          const right = addCurrency(a, addCurrency(b, c));
          return (
            left.gems === right.gems &&
            left.gold === right.gold &&
            left.tickets === right.tickets
          );
        }),
        { numRuns: 100 }
      );
    });

    it('addCurrency with zero should return same currency', () => {
      const zero = createCurrency({ gems: 0, gold: 0, tickets: 0 });
      
      fc.assert(
        fc.property(currencyArb, (a) => {
          const result = addCurrency(a, zero);
          return (
            result.gems === a.gems &&
            result.gold === a.gold &&
            result.tickets === a.tickets
          );
        }),
        { numRuns: 100 }
      );
    });

    it('subtractCurrency should return null when result would be negative', () => {
      fc.assert(
        fc.property(currencyArb, currencyArb, (a, b) => {
          const result = subtractCurrency(a, b);
          if (a.gems < b.gems || a.gold < b.gold || a.tickets < b.tickets) {
            return result === null;
          }
          return result !== null;
        }),
        { numRuns: 100 }
      );
    });

    it('subtractCurrency followed by addCurrency should restore original', () => {
      fc.assert(
        fc.property(currencyArb, currencyArb, (a, b) => {
          // Ensure a >= b for valid subtraction
          const larger: Currency = {
            gems: Math.max(a.gems, b.gems),
            gold: Math.max(a.gold, b.gold),
            tickets: Math.max(a.tickets, b.tickets),
          };
          const smaller: Currency = {
            gems: Math.min(a.gems, b.gems),
            gold: Math.min(a.gold, b.gold),
            tickets: Math.min(a.tickets, b.tickets),
          };
          
          const subtracted = subtractCurrency(larger, smaller);
          if (subtracted === null) return true;
          
          const restored = addCurrency(subtracted, smaller);
          return (
            restored.gems === larger.gems &&
            restored.gold === larger.gold &&
            restored.tickets === larger.tickets
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  // =========================================================================
  // Company Properties
  // =========================================================================
  
  describe('Company Properties', () => {
    it('reputation should always be clamped between 0 and 100', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000, max: 1000 }),
          (change) => {
            const company = createCompany({ name: 'Test', foundedDate: 0 });
            const updated = updateCompanyReputation(company, change);
            return updated.reputation >= 0 && updated.reputation <= 100;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('funds should never go below 0', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000000, max: 1000000 }),
          (change) => {
            const company = createCompany({ name: 'Test', foundedDate: 0, startingFunds: 50000 });
            const updated = updateCompanyFunds(company, change);
            return updated.funds >= 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('adding and removing same amount should return to original (when possible)', () => {
      fc.assert(
        fc.property(
          fc.nat(50000), // Positive amounts only
          (amount) => {
            const company = createCompany({ name: 'Test', foundedDate: 0, startingFunds: 100000 });
            const added = updateCompanyFunds(company, amount);
            const subtracted = updateCompanyFunds(added, -amount);
            return subtracted.funds === company.funds;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // =========================================================================
  // Gacha Rate Properties
  // =========================================================================
  
  describe('Gacha Rate Properties', () => {
    // Generate valid gacha rates that sum to 1.0 using integers to avoid NaN issues
    const gachaRatesArb = fc.tuple(
      fc.integer({ min: 1, max: 50 }),   // legendary (1-50%)
      fc.integer({ min: 1, max: 20 }),   // epic (1-20%)
      fc.integer({ min: 1, max: 30 }),   // rare (1-30%)
      fc.integer({ min: 10, max: 40 }),  // uncommon (10-40%)
    ).map(([legendary, epic, rare, uncommon]) => {
      const total = legendary + epic + rare + uncommon;
      const common = Math.max(1, 100 - total);
      
      // Convert to percentages that sum to 1.0
      const sum = common + legendary + epic + rare + uncommon;
      return {
        legendary: legendary / sum,
        epic: epic / sum,
        rare: rare / sum,
        uncommon: uncommon / sum,
        common: common / sum,
      };
    });

    it('gacha rates should always sum to approximately 1.0', () => {
      fc.assert(
        fc.property(gachaRatesArb, (rates) => {
          const sum = rates.common + rates.uncommon + rates.rare + rates.epic + rates.legendary;
          return Math.abs(sum - 1.0) < 0.001;
        }),
        { numRuns: 100 }
      );
    });

    it('default gacha rates should sum to 1.0', () => {
      const defaultRates = createDefaultGachaRates();
      const sum = defaultRates.common + defaultRates.uncommon + defaultRates.rare + 
                  defaultRates.epic + defaultRates.legendary;
      expect(sum).toBeCloseTo(1.0, 10);
    });

    it('all rate values should be non-negative', () => {
      fc.assert(
        fc.property(gachaRatesArb, (rates) => {
          return (
            rates.common >= 0 &&
            rates.uncommon >= 0 &&
            rates.rare >= 0 &&
            rates.epic >= 0 &&
            rates.legendary >= 0
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  // =========================================================================
  // Pity System Properties
  // =========================================================================
  
  describe('Pity System Properties', () => {
    it('pity counter should always increment or reset to 0', () => {
      const { itemMap, itemIds } = createItemPool({});
      
      fc.assert(
        fc.property(
          fc.nat(89),           // Starting pity
          fc.nat(99999),        // RNG seed
          (startPity, seed) => {
            const banner = new BannerBuilder()
              .withItemPool(itemIds)
              .withPityCounter(90)
              .build();
            
            const rng = new SeededRNG(seed);
            const result = simulatePull(banner, itemMap, startPity, new Set(), rng);
            
            // Pity should either increment by 1 or reset to 0
            return result.newPity === startPity + 1 || result.newPity === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('hard pity should always guarantee legendary', () => {
      const { itemMap, itemIds } = createItemPool({});
      
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 200 }),  // Pity counter
          fc.nat(99999),                       // RNG seed
          (pityCounter, seed) => {
            const banner = new BannerBuilder()
              .withItemPool(itemIds)
              .withPityCounter(pityCounter)
              .build();
            
            // Simulate at pity - 1 (should trigger)
            const rng = new SeededRNG(seed);
            const result = simulatePull(banner, itemMap, pityCounter - 1, new Set(), rng);
            
            return result.result.item.rarity === 'legendary' && result.result.pityUsed === true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('pity should reset after getting legendary', () => {
      const { itemMap, itemIds } = createItemPool({});
      
      fc.assert(
        fc.property(
          fc.nat(99999),  // RNG seed
          (seed) => {
            const banner = new BannerBuilder()
              .withItemPool(itemIds)
              .withPityCounter(90)
              .build();
            
            // Force pity pull
            const rng = new SeededRNG(seed);
            const result = simulatePull(banner, itemMap, 89, new Set(), rng);
            
            // If legendary was obtained, pity should reset
            if (result.result.item.rarity === 'legendary') {
              return result.newPity === 0;
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // =========================================================================
  // Employee Properties
  // =========================================================================
  
  describe('Employee Properties', () => {
    it('employee skills should always be between 0 and 100', () => {
      fc.assert(
        fc.property(
          fc.nat(99999),
          (seed) => {
            const rng = new SeededRNG(seed);
            const employee = generateRandomEmployee(0, rng);
            
            const skills = employee.skills;
            return Object.values(skills).every((skill: number) => skill >= 0 && skill <= 100);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('employee morale should always be between 0 and 100', () => {
      fc.assert(
        fc.property(
          fc.nat(99999),
          (seed) => {
            const rng = new SeededRNG(seed);
            const employee = generateRandomEmployee(0, rng);
            
            return employee.morale >= 0 && employee.morale <= 100;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('employee salary should always be positive', () => {
      fc.assert(
        fc.property(
          fc.nat(99999),
          (seed) => {
            const rng = new SeededRNG(seed);
            const employee = generateRandomEmployee(0, rng);
            
            return employee.salary > 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // =========================================================================
  // Game Properties
  // =========================================================================
  
  describe('Game Properties', () => {
    const genreArb = fc.constantFrom(
      'rpg' as const,
      'action' as const,
      'puzzle' as const,
      'strategy' as const,
      'idle' as const,
      'card' as const,
      'rhythm' as const
    );

    it('game progress should always be between 0 and 100', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          genreArb,
          fc.nat(1000),
          (name, genre, startDate) => {
            const game = createGame({ name, genre, startDate });
            return game.developmentProgress >= 0 && game.developmentProgress <= 100;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('game quality metrics should all be between 0 and 100', () => {
      fc.assert(
        fc.property(
          genreArb,
          (genre) => {
            const game = createGame({ name: 'Test', genre, startDate: 0 });
            const quality = game.quality;
            return (
              quality.graphics >= 0 && quality.graphics <= 100 &&
              quality.gameplay >= 0 && quality.gameplay <= 100 &&
              quality.story >= 0 && quality.story <= 100 &&
              quality.sound >= 0 && quality.sound <= 100 &&
              quality.polish >= 0 && quality.polish <= 100
            );
          }
        ),
        { numRuns: 50 }
      );
    });

    it('game monetization metrics should be non-negative', () => {
      fc.assert(
        fc.property(
          genreArb,
          (genre) => {
            const game = createGame({ name: 'Test', genre, startDate: 0 });
            const monetization = game.monetization;
            return (
              monetization.dailyActiveUsers >= 0 &&
              monetization.monthlyRevenue >= 0 &&
              monetization.playerSatisfaction >= 0 &&
              monetization.playerSatisfaction <= 100
            );
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // =========================================================================
  // Probability Convergence Tests
  // =========================================================================
  
  describe('Probability Convergence', () => {
    it('rarity distribution should converge to expected rates over many pulls', () => {
      const { itemMap, itemIds } = createItemPool({
        legendary: 10,
        epic: 10,
        rare: 10,
        uncommon: 10,
        common: 10,
      });
      
      const expectedRates: GachaRates = {
        common: 0.60,
        uncommon: 0.25,
        rare: 0.10,
        epic: 0.04,
        legendary: 0.01,
      };

      const banner = new BannerBuilder()
        .withItemPool(itemIds)
        .withRates(expectedRates)
        .withPityCounter(1000) // High pity to avoid affecting stats
        .build();

      const rarityCount: Record<Rarity, number> = {
        common: 0,
        uncommon: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
      };

      const totalPulls = 5000;
      
      for (let i = 0; i < totalPulls; i++) {
        const rng = new SeededRNG(i);
        const result = simulatePull(banner, itemMap, 0, new Set(), rng);
        const rarity = result.result.item.rarity;
        rarityCount[rarity]++;
      }

      // Check rates are within 5% tolerance
      const tolerance = 0.05;
      
      const commonRate = rarityCount.common / totalPulls;
      expect(commonRate).toBeGreaterThan(expectedRates.common - tolerance);
      expect(commonRate).toBeLessThan(expectedRates.common + tolerance);

      const uncommonRate = rarityCount.uncommon / totalPulls;
      expect(uncommonRate).toBeGreaterThan(expectedRates.uncommon - tolerance);
      expect(uncommonRate).toBeLessThan(expectedRates.uncommon + tolerance);
    });
  });

  // =========================================================================
  // State Invariants
  // =========================================================================
  
  describe('State Invariants', () => {
    it('company should maintain valid state after any sequence of operations', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: -100000, max: 100000 }), { maxLength: 20 }),
          (fundChanges) => {
            let company = createCompany({ name: 'Test', foundedDate: 0 });
            
            for (const change of fundChanges) {
              company = updateCompanyFunds(company, change);
              
              // Invariants that should always hold
              if (company.funds < 0) return false;
              if (!Number.isFinite(company.funds)) return false;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('reputation should maintain valid state after any sequence of changes', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: -100, max: 100 }), { maxLength: 50 }),
          (reputationChanges) => {
            let company = createCompany({ name: 'Test', foundedDate: 0 });
            
            for (const change of reputationChanges) {
              company = updateCompanyReputation(company, change);
              
              // Invariants
              if (company.reputation < 0 || company.reputation > 100) return false;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
