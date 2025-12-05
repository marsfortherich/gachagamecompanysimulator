/**
 * Infrastructure Performance Index
 * Exports performance monitoring and memoization utilities
 */

export {
  // Performance Monitor
  PerformanceMonitor,
  performanceMonitor,
  measurePerformance,
  measurePerformanceAsync,
  
  // Types
  type PerformanceSample,
  type PerformanceStats,
  type FrameTiming,
  type PerformanceReport,
  
  // Benchmarking
  benchmark,
  runBenchmarks,
  formatBenchmarkResult,
  type BenchmarkResult,
} from './PerformanceMetrics';

export {
  // Memoization
  memoize,
  memoizeMulti,
  memoizeWithDeps,
  createSelector,
  
  // Lazy evaluation
  Lazy,
  lazy,
  computed,
  
  // Types
  type CacheEntry,
  type MemoizeOptions,
  type CacheStats,
  
  // Utilities
  shallowEqual,
  shallowStable,
} from './memoization';
