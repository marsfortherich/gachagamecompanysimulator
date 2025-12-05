/**
 * PerformanceMetrics - Performance monitoring and benchmarking utilities
 * Tracks simulation performance and identifies bottlenecks
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Performance sample data
 */
export interface PerformanceSample {
  timestamp: number;
  duration: number;
  label: string;
  metadata?: Record<string, unknown>;
}

/**
 * Aggregated performance statistics
 */
export interface PerformanceStats {
  label: string;
  sampleCount: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  percentile95: number;
  percentile99: number;
  samplesPerSecond: number;
}

/**
 * Frame timing information
 */
export interface FrameTiming {
  frameNumber: number;
  timestamp: number;
  deltaTime: number;
  fps: number;
  jank: boolean;
}

/**
 * Performance report
 */
export interface PerformanceReport {
  generatedAt: number;
  uptime: number;
  stats: Record<string, PerformanceStats>;
  frameTiming: {
    averageFps: number;
    minFps: number;
    maxFps: number;
    jankFrames: number;
    totalFrames: number;
  };
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

// ============================================================================
// PerformanceMonitor Implementation
// ============================================================================

/**
 * Performance monitoring class for tracking simulation metrics
 */
export class PerformanceMonitor {
  private samples: Map<string, PerformanceSample[]> = new Map();
  private frameTimings: FrameTiming[] = [];
  private startTime: number = performance.now();
  private frameNumber = 0;
  private lastFrameTime = 0;
  private maxSamplesPerLabel = 1000;
  private maxFrameTimings = 300; // 5 seconds at 60fps
  private activeTimers: Map<string, number> = new Map();

  constructor() {
    this.reset();
  }

  /**
   * Start timing an operation
   */
  startTimer(label: string): void {
    this.activeTimers.set(label, performance.now());
  }

  /**
   * Stop timing an operation and record the sample
   */
  stopTimer(label: string, metadata?: Record<string, unknown>): number {
    const startTime = this.activeTimers.get(label);
    if (startTime === undefined) {
      console.warn(`No active timer found for label: ${label}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.activeTimers.delete(label);
    this.recordSample(label, duration, metadata);
    return duration;
  }

  /**
   * Record a performance sample directly
   */
  recordSample(label: string, duration: number, metadata?: Record<string, unknown>): void {
    if (!this.samples.has(label)) {
      this.samples.set(label, []);
    }

    const samples = this.samples.get(label)!;
    samples.push({
      timestamp: performance.now(),
      duration,
      label,
      metadata,
    });

    // Trim old samples
    if (samples.length > this.maxSamplesPerLabel) {
      this.samples.set(label, samples.slice(-this.maxSamplesPerLabel));
    }
  }

  /**
   * Measure a synchronous function
   */
  measure<T>(label: string, fn: () => T, metadata?: Record<string, unknown>): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    this.recordSample(label, duration, metadata);
    return result;
  }

  /**
   * Measure an async function
   */
  async measureAsync<T>(
    label: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    this.recordSample(label, duration, metadata);
    return result;
  }

  /**
   * Record a frame timing
   */
  recordFrame(): void {
    const now = performance.now();
    const deltaTime = this.lastFrameTime > 0 ? now - this.lastFrameTime : 16.67;
    const fps = 1000 / deltaTime;

    this.frameTimings.push({
      frameNumber: this.frameNumber++,
      timestamp: now,
      deltaTime,
      fps,
      jank: deltaTime > 50, // Jank if frame takes more than 50ms
    });

    this.lastFrameTime = now;

    // Trim old frame timings
    if (this.frameTimings.length > this.maxFrameTimings) {
      this.frameTimings = this.frameTimings.slice(-this.maxFrameTimings);
    }
  }

  /**
   * Get statistics for a specific label
   */
  getStats(label: string): PerformanceStats | null {
    const samples = this.samples.get(label);
    if (!samples || samples.length === 0) {
      return null;
    }

    const durations = samples.map((s) => s.duration).sort((a, b) => a - b);
    const totalTime = durations.reduce((a, b) => a + b, 0);
    const timeRange = (samples[samples.length - 1].timestamp - samples[0].timestamp) / 1000;

    return {
      label,
      sampleCount: samples.length,
      totalTime,
      averageTime: totalTime / samples.length,
      minTime: durations[0],
      maxTime: durations[durations.length - 1],
      percentile95: this.percentile(durations, 95),
      percentile99: this.percentile(durations, 99),
      samplesPerSecond: timeRange > 0 ? samples.length / timeRange : 0,
    };
  }

  /**
   * Get all labels being tracked
   */
  getLabels(): string[] {
    return Array.from(this.samples.keys());
  }

  /**
   * Get frame timing statistics
   */
  getFrameStats(): PerformanceReport['frameTiming'] {
    if (this.frameTimings.length === 0) {
      return {
        averageFps: 0,
        minFps: 0,
        maxFps: 0,
        jankFrames: 0,
        totalFrames: 0,
      };
    }

    const fpsValues = this.frameTimings.map((f) => f.fps);
    const jankFrames = this.frameTimings.filter((f) => f.jank).length;

    return {
      averageFps: fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length,
      minFps: Math.min(...fpsValues),
      maxFps: Math.max(...fpsValues),
      jankFrames,
      totalFrames: this.frameTimings.length,
    };
  }

  /**
   * Generate a complete performance report
   */
  generateReport(): PerformanceReport {
    const stats: Record<string, PerformanceStats> = {};
    for (const label of this.samples.keys()) {
      const labelStats = this.getStats(label);
      if (labelStats) {
        stats[label] = labelStats;
      }
    }

    const report: PerformanceReport = {
      generatedAt: Date.now(),
      uptime: performance.now() - this.startTime,
      stats,
      frameTiming: this.getFrameStats(),
    };

    // Add memory info if available
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as Performance & { memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      } }).memory;
      if (memory) {
        report.memory = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        };
      }
    }

    return report;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.samples.clear();
    this.frameTimings = [];
    this.startTime = performance.now();
    this.frameNumber = 0;
    this.lastFrameTime = 0;
    this.activeTimers.clear();
  }

  /**
   * Clear samples for a specific label
   */
  clearLabel(label: string): void {
    this.samples.delete(label);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil((p / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }
}

// ============================================================================
// Benchmark Utilities
// ============================================================================

/**
 * Benchmark result
 */
export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  opsPerSecond: number;
  minTime: number;
  maxTime: number;
}

/**
 * Run a benchmark
 */
export function benchmark(
  name: string,
  fn: () => void,
  iterations: number = 1000
): BenchmarkResult {
  const times: number[] = [];

  // Warm up
  for (let i = 0; i < Math.min(100, iterations / 10); i++) {
    fn();
  }

  // Measure
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
  }

  const totalTime = times.reduce((a, b) => a + b, 0);
  const averageTime = totalTime / iterations;

  return {
    name,
    iterations,
    totalTime,
    averageTime,
    opsPerSecond: 1000 / averageTime,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
  };
}

/**
 * Run multiple benchmarks and return results
 */
export function runBenchmarks(
  benchmarks: { name: string; fn: () => void; iterations?: number }[]
): BenchmarkResult[] {
  return benchmarks.map(({ name, fn, iterations }) =>
    benchmark(name, fn, iterations)
  );
}

/**
 * Format benchmark result for logging
 */
export function formatBenchmarkResult(result: BenchmarkResult): string {
  return [
    `${result.name}:`,
    `  Iterations: ${result.iterations}`,
    `  Total: ${result.totalTime.toFixed(2)}ms`,
    `  Average: ${result.averageTime.toFixed(4)}ms`,
    `  Ops/sec: ${result.opsPerSecond.toFixed(2)}`,
    `  Min: ${result.minTime.toFixed(4)}ms`,
    `  Max: ${result.maxTime.toFixed(4)}ms`,
  ].join('\n');
}

// ============================================================================
// Global Instance
// ============================================================================

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Convenience function to measure a synchronous operation
 */
export function measurePerformance<T>(label: string, fn: () => T): T {
  return performanceMonitor.measure(label, fn);
}

/**
 * Convenience function to measure an async operation
 */
export function measurePerformanceAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  return performanceMonitor.measureAsync(label, fn);
}
