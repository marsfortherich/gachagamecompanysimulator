/**
 * Test Utilities - Mocks
 * 
 * Mock implementations for testing.
 * These provide controllable versions of external dependencies.
 */

import { IRNGProvider, SeededRNG } from '@domain/shared';

// ============================================================================
// Mock RNG Provider
// ============================================================================

/**
 * A controllable mock RNG for testing specific scenarios.
 * Allows you to predetermine the sequence of random values.
 */
export class MockRNG implements IRNGProvider {
  private values: number[];
  private index: number = 0;
  private defaultValue: number = 0.5;
  
  /**
   * Create a MockRNG with predetermined values.
   * @param values Array of values to return in sequence (0-1 range)
   * @param defaultValue Value to return when sequence is exhausted
   */
  constructor(values: number[] = [], defaultValue: number = 0.5) {
    this.values = values;
    this.defaultValue = defaultValue;
  }

  random(): number {
    if (this.index < this.values.length) {
      return this.values[this.index++];
    }
    return this.defaultValue;
  }

  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min)) + min;
  }

  pick<T>(array: readonly T[]): T | undefined {
    if (array.length === 0) return undefined;
    const index = this.randomInt(0, array.length);
    return array[index];
  }

  shuffle<T>(array: readonly T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Reset the mock to start from the beginning
   */
  reset(): void {
    this.index = 0;
  }

  /**
   * Add more values to the sequence
   */
  addValues(values: number[]): void {
    this.values.push(...values);
  }

  /**
   * Set all future values to a specific value
   */
  setAllValues(value: number): void {
    this.values = [];
    this.defaultValue = value;
    this.index = 0;
  }

  /**
   * Get how many values have been consumed
   */
  getCallCount(): number {
    return this.index;
  }
}

/**
 * Creates an RNG that always returns a specific value
 */
export function createFixedRNG(value: number): IRNGProvider {
  return new MockRNG([], value);
}

/**
 * Creates an RNG that returns values in a repeating sequence
 */
export function createCyclingRNG(values: number[]): IRNGProvider {
  let index = 0;
  return {
    random(): number {
      const value = values[index % values.length];
      index++;
      return value;
    },
    randomInt(min: number, max: number): number {
      return Math.floor(this.random() * (max - min)) + min;
    },
    pick<T>(array: readonly T[]): T | undefined {
      if (array.length === 0) return undefined;
      const idx = this.randomInt(0, array.length);
      return array[idx];
    },
    shuffle<T>(array: readonly T[]): T[] {
      const result = [...array];
      for (let i = result.length - 1; i > 0; i--) {
        const j = this.randomInt(0, i + 1);
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    },
  };
}

/**
 * Creates an RNG that always returns low values (for testing worst case)
 */
export function createLowRNG(): IRNGProvider {
  return createFixedRNG(0.001);
}

/**
 * Creates an RNG that always returns high values (for testing best case)
 */
export function createHighRNG(): IRNGProvider {
  return createFixedRNG(0.999);
}

/**
 * Creates a deterministic RNG with a specific seed for reproducible tests
 */
export function createSeededRNG(seed: number = 12345): SeededRNG {
  return new SeededRNG(seed);
}

// ============================================================================
// Mock Clock
// ============================================================================

/**
 * A mock clock for controlling time in tests.
 * Useful for testing time-based game mechanics.
 */
export class MockClock {
  private _currentTick: number = 0;

  get currentTick(): number {
    return this._currentTick;
  }

  /**
   * Advance the clock by a specified number of ticks
   */
  advance(ticks: number): void {
    this._currentTick += ticks;
  }

  /**
   * Set the clock to a specific tick
   */
  setTick(tick: number): void {
    this._currentTick = tick;
  }

  /**
   * Reset the clock to tick 0
   */
  reset(): void {
    this._currentTick = 0;
  }

  /**
   * Advance by one day (assuming 1 tick = 1 day)
   */
  advanceDay(): void {
    this.advance(1);
  }

  /**
   * Advance by one week
   */
  advanceWeek(): void {
    this.advance(7);
  }

  /**
   * Advance by one month (30 days)
   */
  advanceMonth(): void {
    this.advance(30);
  }
}

// ============================================================================
// Spy Utilities
// ============================================================================

/**
 * Creates a simple spy function that tracks calls
 */
export function createSpy<T extends (...args: unknown[]) => unknown>(
  implementation?: T
): T & { calls: Parameters<T>[] } {
  const calls: Parameters<T>[] = [];
  
  const spy = ((...args: Parameters<T>) => {
    calls.push(args);
    if (implementation) {
      return implementation(...args);
    }
    return undefined;
  }) as T & { calls: Parameters<T>[] };
  
  spy.calls = calls;
  return spy;
}

// ============================================================================
// Test Environment Helpers
// ============================================================================

/**
 * Creates an isolated test environment with common mocks
 */
export function createTestEnvironment(seed: number = 12345) {
  const rng = createSeededRNG(seed);
  const clock = new MockClock();
  
  return {
    rng,
    clock,
    
    /**
     * Reset all mocks to initial state
     */
    reset(): void {
      clock.reset();
    },
    
    /**
     * Get current game tick
     */
    get currentTick(): number {
      return clock.currentTick;
    },
  };
}

/**
 * Runs a function multiple times and returns all results
 * Useful for statistical testing
 */
export function runMultipleTimes<T>(
  count: number,
  fn: (iteration: number) => T
): T[] {
  const results: T[] = [];
  for (let i = 0; i < count; i++) {
    results.push(fn(i));
  }
  return results;
}

/**
 * Measures the distribution of values in an array
 */
export function measureDistribution<T>(
  items: T[],
  keyFn: (item: T) => string = String
): Map<string, number> {
  const counts = new Map<string, number>();
  
  for (const item of items) {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  
  return counts;
}

/**
 * Converts distribution counts to percentages
 */
export function toPercentages(distribution: Map<string, number>): Map<string, number> {
  const total = Array.from(distribution.values()).reduce((a, b) => a + b, 0);
  const percentages = new Map<string, number>();
  
  for (const [key, count] of distribution) {
    percentages.set(key, count / total);
  }
  
  return percentages;
}
