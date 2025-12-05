/**
 * Memoization Utilities - Caching for derived values
 * Optimizes recalculation of expensive derived data
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Cache entry with value and metadata
 */
export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
  computeTime: number;
}

/**
 * Memoization options
 */
export interface MemoizeOptions {
  /** Maximum cache entries (0 = unlimited) */
  maxSize?: number;
  /** TTL in milliseconds (0 = no expiry) */
  ttl?: number;
  /** Custom key generator */
  keyGenerator?: (...args: unknown[]) => string;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  totalComputeTime: number;
  totalTimeSaved: number;
}

// ============================================================================
// Memoization Implementations
// ============================================================================

/**
 * Simple memoization for single-argument functions
 */
export function memoize<A, R>(
  fn: (arg: A) => R,
  options: MemoizeOptions = {}
): ((arg: A) => R) & { cache: Map<string, CacheEntry<R>>; stats: CacheStats; clear: () => void } {
  const { maxSize = 100, ttl = 0, keyGenerator } = options;
  const cache = new Map<string, CacheEntry<R>>();
  let stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    size: 0,
    totalComputeTime: 0,
    totalTimeSaved: 0,
  };

  const memoized = (arg: A): R => {
    const key = keyGenerator ? keyGenerator(arg) : JSON.stringify(arg);
    const now = Date.now();

    // Check cache
    const cached = cache.get(key);
    if (cached) {
      // Check TTL
      if (ttl === 0 || now - cached.timestamp < ttl) {
        stats.hits++;
        cached.hits++;
        stats.totalTimeSaved += cached.computeTime;
        updateHitRate();
        return cached.value;
      }
      // Expired, remove
      cache.delete(key);
    }

    // Compute value
    stats.misses++;
    const start = performance.now();
    const value = fn(arg);
    const computeTime = performance.now() - start;

    // Store in cache
    cache.set(key, {
      value,
      timestamp: now,
      hits: 0,
      computeTime,
    });
    stats.totalComputeTime += computeTime;
    stats.size = cache.size;

    // Evict if necessary
    if (maxSize > 0 && cache.size > maxSize) {
      evictLRU(cache);
      stats.size = cache.size;
    }

    updateHitRate();
    return value;
  };

  const updateHitRate = () => {
    const total = stats.hits + stats.misses;
    stats.hitRate = total > 0 ? stats.hits / total : 0;
  };

  const clear = () => {
    cache.clear();
    stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
      totalComputeTime: 0,
      totalTimeSaved: 0,
    };
  };

  // Attach cache and methods to function
  (memoized as unknown as { cache: Map<string, CacheEntry<R>>; stats: CacheStats; clear: () => void }).cache = cache;
  Object.defineProperty(memoized, 'stats', { get: () => stats });
  (memoized as unknown as { clear: () => void }).clear = clear;

  return memoized as ((arg: A) => R) & { cache: Map<string, CacheEntry<R>>; stats: CacheStats; clear: () => void };
}

/**
 * Memoization for multi-argument functions
 */
export function memoizeMulti<A extends unknown[], R>(
  fn: (...args: A) => R,
  options: MemoizeOptions = {}
): ((...args: A) => R) & { cache: Map<string, CacheEntry<R>>; stats: CacheStats; clear: () => void } {
  const wrapper = (args: A): R => fn(...args);
  const keyGen = options.keyGenerator ?? ((...args: unknown[]) => JSON.stringify(args));
  
  const memoized = memoize(wrapper, {
    ...options,
    keyGenerator: (args) => keyGen(...(args as unknown[])),
  });

  const multiMemoized = (...args: A): R => memoized(args);
  
  (multiMemoized as unknown as { cache: Map<string, CacheEntry<R>>; stats: CacheStats; clear: () => void }).cache = memoized.cache;
  Object.defineProperty(multiMemoized, 'stats', { get: () => memoized.stats });
  (multiMemoized as unknown as { clear: () => void }).clear = memoized.clear;

  return multiMemoized as ((...args: A) => R) & { cache: Map<string, CacheEntry<R>>; stats: CacheStats; clear: () => void };
}

/**
 * Memoization with dependency tracking
 * Invalidates cache when dependencies change
 */
export function memoizeWithDeps<D, A, R>(
  fn: (arg: A) => R,
  getDeps: (arg: A) => D,
  options: MemoizeOptions = {}
): ((arg: A) => R) & { invalidate: (arg: A) => void; clear: () => void } {
  const cache = new Map<string, { value: R; deps: D }>();
  const { keyGenerator } = options;

  const memoized = (arg: A): R => {
    const key = keyGenerator ? keyGenerator(arg) : JSON.stringify(arg);
    const currentDeps = getDeps(arg);
    const cached = cache.get(key);

    if (cached && deepEqual(cached.deps, currentDeps)) {
      return cached.value;
    }

    const value = fn(arg);
    cache.set(key, { value, deps: currentDeps });
    return value;
  };

  (memoized as unknown as { invalidate: (arg: A) => void; clear: () => void }).invalidate = (arg: A) => {
    const key = keyGenerator ? keyGenerator(arg) : JSON.stringify(arg);
    cache.delete(key);
  };

  (memoized as unknown as { clear: () => void }).clear = () => {
    cache.clear();
  };

  return memoized as ((arg: A) => R) & { invalidate: (arg: A) => void; clear: () => void };
}

/**
 * Create a cached selector (like reselect)
 */
export function createSelector<S, R1, R>(
  selector1: (state: S) => R1,
  combiner: (r1: R1) => R
): (state: S) => R;
export function createSelector<S, R1, R2, R>(
  selector1: (state: S) => R1,
  selector2: (state: S) => R2,
  combiner: (r1: R1, r2: R2) => R
): (state: S) => R;
export function createSelector<S, R1, R2, R3, R>(
  selector1: (state: S) => R1,
  selector2: (state: S) => R2,
  selector3: (state: S) => R3,
  combiner: (r1: R1, r2: R2, r3: R3) => R
): (state: S) => R;
export function createSelector<S, R1, R2, R3, R4, R>(
  selector1: (state: S) => R1,
  selector2: (state: S) => R2,
  selector3: (state: S) => R3,
  selector4: (state: S) => R4,
  combiner: (r1: R1, r2: R2, r3: R3, r4: R4) => R
): (state: S) => R;
export function createSelector<S>(...args: unknown[]): (state: S) => unknown {
  const selectors = args.slice(0, -1) as ((state: S) => unknown)[];
  const combiner = args[args.length - 1] as (...values: unknown[]) => unknown;
  
  let lastInputs: unknown[] | null = null;
  let lastResult: unknown = null;

  return (state: S): unknown => {
    const inputs = selectors.map((s) => s(state));
    
    // Check if inputs changed
    if (lastInputs && inputs.every((input, i) => input === lastInputs![i])) {
      return lastResult;
    }

    lastInputs = inputs;
    lastResult = combiner(...inputs);
    return lastResult;
  };
}

// ============================================================================
// Lazy Evaluation
// ============================================================================

/**
 * Lazy value that computes on first access
 */
export class Lazy<T> {
  private computed = false;
  private value: T | undefined;
  private readonly factory: () => T;

  constructor(factory: () => T) {
    this.factory = factory;
  }

  get(): T {
    if (!this.computed) {
      this.value = this.factory();
      this.computed = true;
    }
    return this.value!;
  }

  isComputed(): boolean {
    return this.computed;
  }

  reset(): void {
    this.computed = false;
    this.value = undefined;
  }
}

/**
 * Create a lazy value
 */
export function lazy<T>(factory: () => T): Lazy<T> {
  return new Lazy(factory);
}

// ============================================================================
// Computed Property Decorator Pattern
// ============================================================================

/**
 * Create a computed property that caches based on dependencies
 */
export function computed<T, D>(
  compute: () => T,
  getDeps: () => D
): { get: () => T; invalidate: () => void } {
  let cachedValue: T | undefined;
  let cachedDeps: D | undefined;
  let isValid = false;

  return {
    get: () => {
      const currentDeps = getDeps();
      if (!isValid || !deepEqual(cachedDeps, currentDeps)) {
        cachedValue = compute();
        cachedDeps = currentDeps;
        isValid = true;
      }
      return cachedValue!;
    },
    invalidate: () => {
      isValid = false;
      cachedValue = undefined;
      cachedDeps = undefined;
    },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Evict least recently used entry from cache
 */
function evictLRU<T>(cache: Map<string, CacheEntry<T>>): void {
  let oldest: string | null = null;
  let oldestTime = Infinity;

  for (const [key, entry] of cache) {
    // Prioritize entries with fewer hits
    const score = entry.timestamp - entry.hits * 1000;
    if (score < oldestTime) {
      oldestTime = score;
      oldest = key;
    }
  }

  if (oldest) {
    cache.delete(oldest);
  }
}

/**
 * Deep equality check
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return false;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  const aKeys = Object.keys(a as object);
  const bKeys = Object.keys(b as object);
  
  if (aKeys.length !== bKeys.length) return false;
  
  return aKeys.every((key) => 
    deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
  );
}

/**
 * Create a stable object reference for shallow comparison
 */
export function shallowStable<T extends object>(obj: T): T {
  const cache = new Map<string, T>();
  
  return new Proxy({} as T, {
    get(_target, prop: string) {
      const value = obj[prop as keyof T];
      const key = prop;
      
      if (typeof value === 'object' && value !== null) {
        const cached = cache.get(key);
        if (cached && shallowEqual(cached, value as unknown as T)) {
          return cached;
        }
        cache.set(key, value as unknown as T);
      }
      
      return value;
    },
  });
}

/**
 * Shallow equality check
 */
export function shallowEqual<T extends object>(a: T, b: T): boolean {
  if (a === b) return true;
  
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  
  if (aKeys.length !== bKeys.length) return false;
  
  return aKeys.every((key) => 
    (a as Record<string, unknown>)[key] === (b as Record<string, unknown>)[key]
  );
}
