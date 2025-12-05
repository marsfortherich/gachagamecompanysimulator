/**
 * Performance Utilities Tests
 * Tests for PerformanceMonitor and memoization
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PerformanceMonitor,
  benchmark,
  runBenchmarks,
  formatBenchmarkResult,
} from '../../infrastructure/performance/PerformanceMetrics';
import {
  memoize,
  memoizeMulti,
  memoizeWithDeps,
  createSelector,
  Lazy,
  lazy,
  computed,
  shallowEqual,
} from '../../infrastructure/performance/memoization';

// ============================================================================
// PerformanceMonitor Tests
// ============================================================================

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  describe('recordSample', () => {
    it('should record a sample', () => {
      monitor.recordSample('test', 10);
      
      const stats = monitor.getStats('test');
      expect(stats).not.toBeNull();
      expect(stats!.sampleCount).toBe(1);
      expect(stats!.averageTime).toBe(10);
    });

    it('should calculate average correctly', () => {
      monitor.recordSample('test', 10);
      monitor.recordSample('test', 20);
      monitor.recordSample('test', 30);
      
      const stats = monitor.getStats('test');
      expect(stats!.averageTime).toBe(20);
    });

    it('should track min and max', () => {
      monitor.recordSample('test', 5);
      monitor.recordSample('test', 15);
      monitor.recordSample('test', 10);
      
      const stats = monitor.getStats('test');
      expect(stats!.minTime).toBe(5);
      expect(stats!.maxTime).toBe(15);
    });
  });

  describe('startTimer/stopTimer', () => {
    it('should measure elapsed time', () => {
      monitor.startTimer('test');
      // Simulate some work
      const start = performance.now();
      while (performance.now() - start < 5) {
        // Wait
      }
      const duration = monitor.stopTimer('test');
      
      expect(duration).toBeGreaterThan(0);
      
      const stats = monitor.getStats('test');
      expect(stats!.sampleCount).toBe(1);
    });

    it('should return 0 for non-existent timer', () => {
      const duration = monitor.stopTimer('nonexistent');
      expect(duration).toBe(0);
    });
  });

  describe('measure', () => {
    it('should measure synchronous function', () => {
      const result = monitor.measure('test', () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      });
      
      expect(result).toBe(499500);
      
      const stats = monitor.getStats('test');
      expect(stats!.sampleCount).toBe(1);
    });
  });

  describe('measureAsync', () => {
    it('should measure async function', async () => {
      const result = await monitor.measureAsync('test', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 42;
      });
      
      expect(result).toBe(42);
      
      const stats = monitor.getStats('test');
      expect(stats!.sampleCount).toBe(1);
      // Use slightly lower threshold due to timer precision variance in CI environments
      expect(stats!.averageTime).toBeGreaterThanOrEqual(8);
    });
  });

  describe('recordFrame', () => {
    it('should record frame timing', () => {
      monitor.recordFrame();
      monitor.recordFrame();
      monitor.recordFrame();
      
      const frameStats = monitor.getFrameStats();
      expect(frameStats.totalFrames).toBe(3);
    });

    it('should calculate FPS', () => {
      // Simulate frames at roughly 60fps
      for (let i = 0; i < 10; i++) {
        monitor.recordFrame();
      }
      
      const frameStats = monitor.getFrameStats();
      expect(frameStats.averageFps).toBeGreaterThan(0);
    });
  });

  describe('generateReport', () => {
    it('should generate a complete report', () => {
      monitor.recordSample('operation1', 10);
      monitor.recordSample('operation2', 20);
      monitor.recordFrame();
      
      const report = monitor.generateReport();
      
      expect(report.generatedAt).toBeDefined();
      expect(report.uptime).toBeGreaterThanOrEqual(0);
      expect(report.stats).toHaveProperty('operation1');
      expect(report.stats).toHaveProperty('operation2');
      expect(report.frameTiming.totalFrames).toBe(1);
    });
  });

  describe('reset', () => {
    it('should clear all data', () => {
      monitor.recordSample('test', 10);
      monitor.recordFrame();
      
      monitor.reset();
      
      expect(monitor.getStats('test')).toBeNull();
      expect(monitor.getFrameStats().totalFrames).toBe(0);
    });
  });

  describe('getLabels', () => {
    it('should return all tracked labels', () => {
      monitor.recordSample('label1', 10);
      monitor.recordSample('label2', 20);
      monitor.recordSample('label3', 30);
      
      const labels = monitor.getLabels();
      expect(labels).toContain('label1');
      expect(labels).toContain('label2');
      expect(labels).toContain('label3');
    });
  });
});

// ============================================================================
// Benchmark Tests
// ============================================================================

describe('Benchmarking', () => {
  describe('benchmark', () => {
    it('should run benchmark and return results', () => {
      const result = benchmark('test', () => {
        let sum = 0;
        for (let i = 0; i < 100; i++) {
          sum += i;
        }
        return sum;
      }, 100);
      
      expect(result.name).toBe('test');
      expect(result.iterations).toBe(100);
      expect(result.totalTime).toBeGreaterThan(0);
      expect(result.averageTime).toBeGreaterThan(0);
      expect(result.opsPerSecond).toBeGreaterThan(0);
    });
  });

  describe('runBenchmarks', () => {
    it('should run multiple benchmarks', () => {
      const results = runBenchmarks([
        { name: 'addition', fn: () => 1 + 1, iterations: 50 },
        { name: 'multiplication', fn: () => 2 * 2, iterations: 50 },
      ]);
      
      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('addition');
      expect(results[1].name).toBe('multiplication');
    });
  });

  describe('formatBenchmarkResult', () => {
    it('should format result as string', () => {
      const result = benchmark('test', () => 1 + 1, 10);
      const formatted = formatBenchmarkResult(result);
      
      expect(formatted).toContain('test');
      expect(formatted).toContain('Iterations: 10');
      expect(formatted).toContain('Ops/sec');
    });
  });
});

// ============================================================================
// Memoization Tests
// ============================================================================

describe('Memoization', () => {
  describe('memoize', () => {
    it('should cache results', () => {
      let callCount = 0;
      const expensive = memoize((n: number) => {
        callCount++;
        return n * 2;
      });
      
      expect(expensive(5)).toBe(10);
      expect(expensive(5)).toBe(10);
      expect(expensive(5)).toBe(10);
      
      expect(callCount).toBe(1);
    });

    it('should cache different arguments separately', () => {
      let callCount = 0;
      const expensive = memoize((n: number) => {
        callCount++;
        return n * 2;
      });
      
      expect(expensive(5)).toBe(10);
      expect(expensive(10)).toBe(20);
      expect(expensive(5)).toBe(10);
      
      expect(callCount).toBe(2);
    });

    it('should track cache statistics', () => {
      const fn = memoize((n: number) => n * 2);
      
      fn(1);
      fn(1);
      fn(2);
      fn(1);
      
      expect(fn.stats.hits).toBe(2);
      expect(fn.stats.misses).toBe(2);
      expect(fn.stats.hitRate).toBe(0.5);
    });

    it('should respect maxSize', () => {
      const fn = memoize((n: number) => n * 2, { maxSize: 2 });
      
      fn(1);
      fn(2);
      fn(3); // Should evict 1
      
      expect(fn.cache.size).toBe(2);
    });

    it('should clear cache', () => {
      const fn = memoize((n: number) => n * 2);
      
      fn(1);
      fn(2);
      
      fn.clear();
      
      expect(fn.cache.size).toBe(0);
    });
  });

  describe('memoizeMulti', () => {
    it('should cache multi-argument functions', () => {
      let callCount = 0;
      const add = memoizeMulti((a: number, b: number) => {
        callCount++;
        return a + b;
      });
      
      expect(add(1, 2)).toBe(3);
      expect(add(1, 2)).toBe(3);
      expect(add(2, 1)).toBe(3);
      
      expect(callCount).toBe(2); // Different argument order = different cache key
    });
  });

  describe('memoizeWithDeps', () => {
    it('should invalidate when dependencies change', () => {
      let callCount = 0;
      let version = 1;
      
      const fn = memoizeWithDeps(
        (id: string) => {
          callCount++;
          return `${id}-v${version}`;
        },
        () => version
      );
      
      expect(fn('test')).toBe('test-v1');
      expect(fn('test')).toBe('test-v1'); // Cached
      expect(callCount).toBe(1);
      
      version = 2; // Change dependency
      
      expect(fn('test')).toBe('test-v2'); // Recomputed
      expect(callCount).toBe(2);
    });

    it('should support manual invalidation', () => {
      let callCount = 0;
      const fn = memoizeWithDeps(
        (id: string) => {
          callCount++;
          return `computed-${id}`;
        },
        () => 'static'
      );
      
      fn('test');
      fn('test');
      expect(callCount).toBe(1);
      
      fn.invalidate('test');
      fn('test');
      expect(callCount).toBe(2);
    });
  });

  describe('createSelector', () => {
    it('should memoize derived values', () => {
      let computeCount = 0;
      
      interface State {
        items: number[];
        multiplier: number;
      }
      
      const selectItems = (state: State) => state.items;
      const selectMultiplier = (state: State) => state.multiplier;
      
      const selectTotal = createSelector(
        selectItems,
        selectMultiplier,
        (items, multiplier) => {
          computeCount++;
          return items.reduce((a, b) => a + b, 0) * multiplier;
        }
      );
      
      const state1: State = { items: [1, 2, 3], multiplier: 2 };
      
      expect(selectTotal(state1)).toBe(12);
      expect(selectTotal(state1)).toBe(12);
      expect(computeCount).toBe(1);
      
      // Same reference = no recompute
      expect(selectTotal(state1)).toBe(12);
      expect(computeCount).toBe(1);
      
      // New reference = recompute
      const state2: State = { items: [1, 2, 3], multiplier: 2 };
      expect(selectTotal(state2)).toBe(12);
      expect(computeCount).toBe(2);
    });
  });
});

// ============================================================================
// Lazy Evaluation Tests
// ============================================================================

describe('Lazy', () => {
  describe('Lazy class', () => {
    it('should not compute until get() is called', () => {
      let computed = false;
      const lazyValue = new Lazy(() => {
        computed = true;
        return 42;
      });
      
      expect(computed).toBe(false);
      expect(lazyValue.isComputed()).toBe(false);
      
      expect(lazyValue.get()).toBe(42);
      expect(computed).toBe(true);
      expect(lazyValue.isComputed()).toBe(true);
    });

    it('should only compute once', () => {
      let computeCount = 0;
      const lazyValue = new Lazy(() => {
        computeCount++;
        return computeCount;
      });
      
      expect(lazyValue.get()).toBe(1);
      expect(lazyValue.get()).toBe(1);
      expect(lazyValue.get()).toBe(1);
      expect(computeCount).toBe(1);
    });

    it('should recompute after reset', () => {
      let computeCount = 0;
      const lazyValue = new Lazy(() => {
        computeCount++;
        return computeCount;
      });
      
      expect(lazyValue.get()).toBe(1);
      
      lazyValue.reset();
      
      expect(lazyValue.isComputed()).toBe(false);
      expect(lazyValue.get()).toBe(2);
    });
  });

  describe('lazy function', () => {
    it('should create a Lazy instance', () => {
      const lazyValue = lazy(() => 42);
      
      expect(lazyValue).toBeInstanceOf(Lazy);
      expect(lazyValue.get()).toBe(42);
    });
  });

  describe('computed', () => {
    it('should cache based on dependencies', () => {
      let computeCount = 0;
      let dep = 1;
      
      const comp = computed(
        () => {
          computeCount++;
          return dep * 2;
        },
        () => dep
      );
      
      expect(comp.get()).toBe(2);
      expect(comp.get()).toBe(2);
      expect(computeCount).toBe(1);
      
      dep = 5;
      
      expect(comp.get()).toBe(10);
      expect(computeCount).toBe(2);
    });

    it('should support invalidation', () => {
      let computeCount = 0;
      const comp = computed(
        () => {
          computeCount++;
          return 42;
        },
        () => 'static'
      );
      
      comp.get();
      comp.get();
      expect(computeCount).toBe(1);
      
      comp.invalidate();
      comp.get();
      expect(computeCount).toBe(2);
    });
  });
});

// ============================================================================
// Utility Tests
// ============================================================================

describe('Utility Functions', () => {
  describe('shallowEqual', () => {
    it('should return true for identical references', () => {
      const obj = { a: 1, b: 2 };
      expect(shallowEqual(obj, obj)).toBe(true);
    });

    it('should return true for objects with same properties', () => {
      expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    });

    it('should return false for objects with different values', () => {
      expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false);
    });

    it('should return false for objects with different keys', () => {
      expect(shallowEqual({ a: 1 }, { b: 1 })).toBe(false);
    });

    it('should not deep compare', () => {
      const nested1 = { a: { b: 1 } };
      const nested2 = { a: { b: 1 } };
      expect(shallowEqual(nested1, nested2)).toBe(false); // Different reference for nested
    });
  });
});
