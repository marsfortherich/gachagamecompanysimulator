/**
 * Interface for Random Number Generator
 * Allows injection of deterministic RNG for testing
 */
export interface IRNGProvider {
  /**
   * Returns a random number between 0 (inclusive) and 1 (exclusive)
   */
  random(): number;
  
  /**
   * Returns a random integer between min (inclusive) and max (exclusive)
   */
  randomInt(min: number, max: number): number;
  
  /**
   * Picks a random element from an array
   */
  pick<T>(array: readonly T[]): T | undefined;
  
  /**
   * Shuffles an array (returns new array)
   */
  shuffle<T>(array: readonly T[]): T[];
}

/**
 * Seeded RNG for deterministic testing
 * Uses a simple linear congruential generator
 */
export class SeededRNG implements IRNGProvider {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  random(): number {
    // LCG parameters (same as glibc)
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }
  
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min)) + min;
  }
  
  pick<T>(array: readonly T[]): T | undefined {
    if (array.length === 0) return undefined;
    return array[this.randomInt(0, array.length)];
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
   * Reset to initial seed
   */
  reset(seed: number): void {
    this.seed = seed;
  }
}

/**
 * Production RNG using Math.random (or crypto if available)
 */
export class DefaultRNG implements IRNGProvider {
  random(): number {
    return Math.random();
  }
  
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min)) + min;
  }
  
  pick<T>(array: readonly T[]): T | undefined {
    if (array.length === 0) return undefined;
    return array[this.randomInt(0, array.length)];
  }
  
  shuffle<T>(array: readonly T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

/**
 * Default RNG instance for production use
 */
export const defaultRNG = new DefaultRNG();
