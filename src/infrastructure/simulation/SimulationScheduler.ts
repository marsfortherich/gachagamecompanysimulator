/**
 * SimulationScheduler - Advanced tick scheduling with batch processing
 * Optimizes simulation performance for high-speed modes
 */

import { simulationError } from '../../domain/errors';
import { errorBus } from '../errors/ErrorBus';

// ============================================================================
// Types
// ============================================================================

/**
 * Simulation state that can be processed
 */
export interface SimulationState {
  tick: number;
  isPaused: boolean;
  speed: number;
  [key: string]: unknown;
}

/**
 * Tick processor function type
 */
export type TickProcessor<T extends SimulationState> = (
  state: T,
  tickCount: number
) => T;

/**
 * Scheduler configuration
 */
export interface SchedulerConfig {
  /** Maximum ticks to process in a single batch */
  maxBatchSize: number;
  /** Target frame time in milliseconds */
  targetFrameTime: number;
  /** Enable idle tick detection and skipping */
  enableIdleSkipping: boolean;
  /** Minimum active threshold for idle detection */
  idleThreshold: number;
  /** Enable performance monitoring */
  enableMetrics: boolean;
  /** Maximum time budget per frame in ms */
  frameBudget: number;
}

/**
 * Performance metrics for the scheduler
 */
export interface SchedulerMetrics {
  totalTicksProcessed: number;
  totalBatches: number;
  averageBatchSize: number;
  averageTickDuration: number;
  maxTickDuration: number;
  idleTicksSkipped: number;
  budgetOverruns: number;
  lastBatchTime: number;
}

/**
 * Idle detection result
 */
export interface IdleDetection {
  isIdle: boolean;
  skipCount: number;
  reason?: string;
}

// ============================================================================
// SimulationScheduler Implementation
// ============================================================================

/**
 * Simulation scheduler with batch processing and idle tick optimization
 */
export class SimulationScheduler<T extends SimulationState> {
  private config: SchedulerConfig;
  private metrics: SchedulerMetrics;
  private tickProcessor: TickProcessor<T> | null = null;
  private idleDetector: ((state: T) => IdleDetection) | null = null;
  private batchSizeHistory: number[] = [];
  private tickDurationHistory: number[] = [];
  private readonly maxHistorySize = 100;

  constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = {
      maxBatchSize: config.maxBatchSize ?? 100,
      targetFrameTime: config.targetFrameTime ?? 16.67, // 60fps
      enableIdleSkipping: config.enableIdleSkipping ?? true,
      idleThreshold: config.idleThreshold ?? 0.1,
      enableMetrics: config.enableMetrics ?? true,
      frameBudget: config.frameBudget ?? 12, // Leave headroom for rendering
    };

    this.metrics = this.createEmptyMetrics();
  }

  /**
   * Set the tick processor function
   */
  setTickProcessor(processor: TickProcessor<T>): void {
    this.tickProcessor = processor;
  }

  /**
   * Set idle detection function
   */
  setIdleDetector(detector: (state: T) => IdleDetection): void {
    this.idleDetector = detector;
  }

  /**
   * Process ticks for the current frame
   * Returns the updated state and number of ticks processed
   */
  processTicks(
    state: T,
    requestedTicks: number
  ): { state: T; ticksProcessed: number; timeSpent: number } {
    if (!this.tickProcessor) {
      errorBus.report(
        simulationError('SCHEDULER_ERROR', 'No tick processor set')
      );
      return { state, ticksProcessed: 0, timeSpent: 0 };
    }

    const startTime = performance.now();
    let currentState = state;
    let ticksProcessed = 0;
    const maxTicks = Math.min(requestedTicks, this.config.maxBatchSize);

    try {
      // Check for idle skip opportunity
      if (this.config.enableIdleSkipping && this.idleDetector) {
        const idleResult = this.idleDetector(currentState);
        if (idleResult.isIdle && idleResult.skipCount > 0) {
          const skipCount = Math.min(idleResult.skipCount, maxTicks);
          currentState = this.fastForwardTicks(currentState, skipCount);
          ticksProcessed += skipCount;
          this.metrics.idleTicksSkipped += skipCount;
        }
      }

      // Process remaining ticks with budget management
      while (ticksProcessed < maxTicks) {
        const elapsed = performance.now() - startTime;
        
        // Check frame budget
        if (elapsed >= this.config.frameBudget) {
          this.metrics.budgetOverruns++;
          break;
        }

        const tickStart = performance.now();
        currentState = this.tickProcessor(currentState, 1);
        const tickDuration = performance.now() - tickStart;
        
        ticksProcessed++;
        this.recordTickDuration(tickDuration);
      }
    } catch (error) {
      errorBus.report(
        simulationError('BATCH_PROCESSING_FAILED', 'Batch processing failed', {
          originalError: error instanceof Error ? error : new Error(String(error)),
          tickNumber: currentState.tick,
          batchSize: ticksProcessed,
          severity: 'high',
        })
      );
    }

    const timeSpent = performance.now() - startTime;
    this.recordBatch(ticksProcessed, timeSpent);

    return { state: currentState, ticksProcessed, timeSpent };
  }

  /**
   * Calculate optimal batch size based on performance history
   */
  calculateOptimalBatchSize(): number {
    if (this.tickDurationHistory.length < 10) {
      return this.config.maxBatchSize;
    }

    const avgTickDuration = this.getAverageTickDuration();
    const ticksPerBudget = Math.floor(this.config.frameBudget / avgTickDuration);
    
    // Apply safety margin (80% of theoretical max)
    const safeBatchSize = Math.floor(ticksPerBudget * 0.8);
    
    return Math.max(1, Math.min(safeBatchSize, this.config.maxBatchSize));
  }

  /**
   * Get scheduler metrics
   */
  getMetrics(): SchedulerMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = this.createEmptyMetrics();
    this.batchSizeHistory = [];
    this.tickDurationHistory = [];
  }

  /**
   * Update configuration
   */
  configure(config: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): SchedulerConfig {
    return { ...this.config };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private fastForwardTicks(state: T, count: number): T {
    // Fast forward by incrementing tick counter
    // Subclasses can override for more sophisticated fast-forwarding
    return {
      ...state,
      tick: state.tick + count,
    };
  }

  private recordTickDuration(duration: number): void {
    if (!this.config.enableMetrics) return;

    this.tickDurationHistory.push(duration);
    if (this.tickDurationHistory.length > this.maxHistorySize) {
      this.tickDurationHistory.shift();
    }

    this.metrics.maxTickDuration = Math.max(this.metrics.maxTickDuration, duration);
  }

  private recordBatch(tickCount: number, duration: number): void {
    if (!this.config.enableMetrics) return;

    this.metrics.totalTicksProcessed += tickCount;
    this.metrics.totalBatches++;
    this.metrics.lastBatchTime = duration;

    this.batchSizeHistory.push(tickCount);
    if (this.batchSizeHistory.length > this.maxHistorySize) {
      this.batchSizeHistory.shift();
    }

    this.metrics.averageBatchSize = this.calculateAverage(this.batchSizeHistory);
    this.metrics.averageTickDuration = this.getAverageTickDuration();
  }

  private getAverageTickDuration(): number {
    return this.calculateAverage(this.tickDurationHistory);
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private createEmptyMetrics(): SchedulerMetrics {
    return {
      totalTicksProcessed: 0,
      totalBatches: 0,
      averageBatchSize: 0,
      averageTickDuration: 0,
      maxTickDuration: 0,
      idleTicksSkipped: 0,
      budgetOverruns: 0,
      lastBatchTime: 0,
    };
  }
}

// ============================================================================
// Speed Multiplier Utilities
// ============================================================================

/**
 * Extended speed multipliers including ultra-fast modes
 */
export const EXTENDED_SPEED_MULTIPLIERS = {
  paused: 0,
  slow: 0.5,
  normal: 1,
  fast: 2,
  faster: 5,
  ultrafast: 10,
  maximum: 100,
} as const;

export type ExtendedGameSpeed = keyof typeof EXTENDED_SPEED_MULTIPLIERS;

/**
 * Calculate ticks needed for a given speed and delta time
 */
export function calculateTicksForSpeed(
  speed: ExtendedGameSpeed,
  deltaTimeMs: number,
  tickRateHz: number = 1
): number {
  const multiplier = EXTENDED_SPEED_MULTIPLIERS[speed];
  const msPerTick = 1000 / tickRateHz;
  return Math.floor((deltaTimeMs * multiplier) / msPerTick);
}

// ============================================================================
// Throttled Update Utility
// ============================================================================

/**
 * Creates a throttled update function for UI updates
 */
export function createThrottledUpdate<T>(
  updateFn: (value: T) => void,
  minIntervalMs: number = 16.67
): (value: T) => void {
  let lastUpdate = 0;
  let pendingValue: T | undefined;
  let scheduled = false;

  return (value: T) => {
    const now = performance.now();
    
    if (now - lastUpdate >= minIntervalMs) {
      lastUpdate = now;
      updateFn(value);
    } else {
      pendingValue = value;
      
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(() => {
          scheduled = false;
          if (pendingValue !== undefined) {
            lastUpdate = performance.now();
            updateFn(pendingValue);
            pendingValue = undefined;
          }
        });
      }
    }
  };
}
