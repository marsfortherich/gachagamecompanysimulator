import { describe, it, expect } from 'vitest';
import {
  ok,
  err,
  some,
  none,
  mapResult,
  flatMapResult,
  unwrap,
  unwrapOr,
  isNone,
  isSome,
  Result,
} from '../../domain/shared/Result';
import { SeededRNG, DefaultRNG } from '../../domain/shared/RNG';

describe('Result', () => {
  describe('ok and err', () => {
    it('should create success result', () => {
      const result = ok(42);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(42);
      }
    });

    it('should create error result', () => {
      const result = err('Something went wrong');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Something went wrong');
      }
    });
  });

  describe('mapResult', () => {
    it('should map success value', () => {
      const result = ok(10);
      const mapped = mapResult(result, (x) => x * 2);
      
      expect(mapped.success).toBe(true);
      if (mapped.success) {
        expect(mapped.value).toBe(20);
      }
    });

    it('should pass through error', () => {
      const result: Result<number, string> = err('error');
      const mapped = mapResult(result, (x) => x * 2);
      
      expect(mapped.success).toBe(false);
      if (!mapped.success) {
        expect(mapped.error).toBe('error');
      }
    });
  });

  describe('flatMapResult', () => {
    it('should chain successful operations', () => {
      const result = ok(10);
      const chained = flatMapResult(result, (x) => 
        x > 5 ? ok(x * 2) : err('too small')
      );
      
      expect(chained.success).toBe(true);
      if (chained.success) {
        expect(chained.value).toBe(20);
      }
    });

    it('should short-circuit on error', () => {
      const result = ok(3);
      const chained = flatMapResult(result, (x) => 
        x > 5 ? ok(x * 2) : err('too small')
      );
      
      expect(chained.success).toBe(false);
      if (!chained.success) {
        expect(chained.error).toBe('too small');
      }
    });
  });

  describe('unwrap', () => {
    it('should return value for success', () => {
      const result = ok(42);
      expect(unwrap(result)).toBe(42);
    });

    it('should throw for error', () => {
      const result = err('error');
      expect(() => unwrap(result)).toThrow('Attempted to unwrap an error Result');
    });
  });

  describe('unwrapOr', () => {
    it('should return value for success', () => {
      const result = ok(42);
      expect(unwrapOr(result, 0)).toBe(42);
    });

    it('should return default for error', () => {
      const result: Result<number, string> = err('error');
      expect(unwrapOr(result, 0)).toBe(0);
    });
  });
});

describe('Option', () => {
  describe('some and none', () => {
    it('should create some with value', () => {
      const opt = some(42);
      expect(isSome(opt)).toBe(true);
      expect(isNone(opt)).toBe(false);
      if (isSome(opt)) {
        expect(opt.value).toBe(42);
      }
    });

    it('should create none', () => {
      const opt = none<number>();
      expect(isSome(opt)).toBe(false);
      expect(isNone(opt)).toBe(true);
    });
  });
});

describe('SeededRNG', () => {
  it('should produce deterministic results', () => {
    const rng1 = new SeededRNG(12345);
    const rng2 = new SeededRNG(12345);
    
    for (let i = 0; i < 10; i++) {
      expect(rng1.random()).toBe(rng2.random());
    }
  });

  it('should produce different results with different seeds', () => {
    const rng1 = new SeededRNG(12345);
    const rng2 = new SeededRNG(54321);
    
    expect(rng1.random()).not.toBe(rng2.random());
  });

  it('should generate integers in range', () => {
    const rng = new SeededRNG(42);
    
    for (let i = 0; i < 100; i++) {
      const val = rng.randomInt(0, 10);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(10);
    }
  });

  it('should pick from array', () => {
    const rng = new SeededRNG(42);
    const items = ['a', 'b', 'c'];
    
    for (let i = 0; i < 20; i++) {
      const picked = rng.pick(items);
      expect(items).toContain(picked);
    }
  });

  it('should return undefined for empty array', () => {
    const rng = new SeededRNG(42);
    expect(rng.pick([])).toBeUndefined();
  });

  it('should shuffle array', () => {
    const rng = new SeededRNG(42);
    const original = [1, 2, 3, 4, 5];
    const shuffled = rng.shuffle(original);
    
    // Should contain same elements
    expect(shuffled.sort()).toEqual(original.sort());
    
    // Original should be unchanged
    expect(original).toEqual([1, 2, 3, 4, 5]);
  });

  it('should reset to initial seed', () => {
    const rng = new SeededRNG(12345);
    const firstRandom = rng.random();
    
    rng.random();
    rng.random();
    
    rng.reset(12345);
    expect(rng.random()).toBe(firstRandom);
  });
});

describe('DefaultRNG', () => {
  it('should produce values between 0 and 1', () => {
    const rng = new DefaultRNG();
    
    for (let i = 0; i < 100; i++) {
      const val = rng.random();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('should generate integers in range', () => {
    const rng = new DefaultRNG();
    
    for (let i = 0; i < 100; i++) {
      const val = rng.randomInt(5, 15);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThan(15);
    }
  });
});
