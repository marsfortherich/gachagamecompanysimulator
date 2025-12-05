/**
 * SimulationScheduler Tests
 * Tests for batch processing and idle tick optimization
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  SimulationScheduler,
  type SimulationState,
  EXTENDED_SPEED_MULTIPLIERS,
  calculateTicksForSpeed,
  createThrottledUpdate,
} from '../../infrastructure/simulation';

// ============================================================================
// Test State Type
// ============================================================================

interface TestState extends SimulationState {
  tick: number;
  isPaused: boolean;
  speed: number;
  value: number;
}

const createTestState = (overrides?: Partial<TestState>): TestState => ({
  tick: 0,
  isPaused: false,
  speed: 1,
  value: 0,
  ...overrides,
});

// ============================================================================
// SimulationScheduler Tests
// ============================================================================

describe('SimulationScheduler', () => {
  let scheduler: SimulationScheduler<TestState>;

  beforeEach(() => {
    scheduler = new SimulationScheduler<TestState>({
      maxBatchSize: 100,
      frameBudget: 12,
      enableMetrics: true,
    });
  });

  describe('processTicks', () => {
    it('should process ticks and update state', () => {
      scheduler.setTickProcessor((state, count) => ({
        ...state,
        tick: state.tick + count,
        value: state.value + count,
      }));

      const initialState = createTestState();
      const { state, ticksProcessed } = scheduler.processTicks(initialState, 10);

      expect(ticksProcessed).toBe(10);
      expect(state.tick).toBe(10);
      expect(state.value).toBe(10);
    });

    it('should respect maxBatchSize', () => {
      scheduler = new SimulationScheduler<TestState>({ maxBatchSize: 5 });
      scheduler.setTickProcessor((state, count) => ({
        ...state,
        tick: state.tick + count,
      }));

      const { ticksProcessed } = scheduler.processTicks(createTestState(), 100);

      expect(ticksProcessed).toBeLessThanOrEqual(5);
    });

    it('should return unchanged state if no processor set', () => {
      const initialState = createTestState({ value: 42 });
      const { state, ticksProcessed } = scheduler.processTicks(initialState, 10);

      expect(ticksProcessed).toBe(0);
      expect(state.value).toBe(42);
    });

    it('should track time spent', () => {
      scheduler.setTickProcessor((state, count) => ({
        ...state,
        tick: state.tick + count,
      }));

      const { timeSpent } = scheduler.processTicks(createTestState(), 10);

      expect(timeSpent).toBeGreaterThanOrEqual(0);
    });
  });

  describe('idle detection', () => {
    it('should skip idle ticks when detector is set', () => {
      scheduler.setTickProcessor((state, count) => {
        return {
          ...state,
          tick: state.tick + count,
        };
      });

      scheduler.setIdleDetector(() => ({
        isIdle: true,
        skipCount: 5,
        reason: 'No activity',
      }));

      const { ticksProcessed } = scheduler.processTicks(createTestState(), 10);

      // Should have skipped some ticks via fast-forward
      expect(ticksProcessed).toBeGreaterThan(0);
    });

    it('should not skip when not idle', () => {
      let processCount = 0;
      
      scheduler.setTickProcessor((state, count) => {
        processCount++;
        return {
          ...state,
          tick: state.tick + count,
        };
      });

      scheduler.setIdleDetector(() => ({
        isIdle: false,
        skipCount: 0,
      }));

      scheduler.processTicks(createTestState(), 10);

      expect(processCount).toBeGreaterThan(0);
    });
  });

  describe('metrics', () => {
    it('should track total ticks processed', () => {
      scheduler.setTickProcessor((state, count) => ({
        ...state,
        tick: state.tick + count,
      }));

      scheduler.processTicks(createTestState(), 10);
      scheduler.processTicks(createTestState(), 5);

      const metrics = scheduler.getMetrics();
      expect(metrics.totalTicksProcessed).toBe(15);
    });

    it('should track total batches', () => {
      scheduler.setTickProcessor((state, count) => ({
        ...state,
        tick: state.tick + count,
      }));

      scheduler.processTicks(createTestState(), 10);
      scheduler.processTicks(createTestState(), 5);
      scheduler.processTicks(createTestState(), 3);

      const metrics = scheduler.getMetrics();
      expect(metrics.totalBatches).toBe(3);
    });

    it('should reset metrics', () => {
      scheduler.setTickProcessor((state, count) => ({
        ...state,
        tick: state.tick + count,
      }));

      scheduler.processTicks(createTestState(), 10);
      scheduler.resetMetrics();

      const metrics = scheduler.getMetrics();
      expect(metrics.totalTicksProcessed).toBe(0);
      expect(metrics.totalBatches).toBe(0);
    });
  });

  describe('calculateOptimalBatchSize', () => {
    it('should return maxBatchSize when no history', () => {
      const optimal = scheduler.calculateOptimalBatchSize();
      expect(optimal).toBe(100);
    });

    it('should calculate based on performance history', () => {
      scheduler.setTickProcessor((state, count) => ({
        ...state,
        tick: state.tick + count,
      }));

      // Build up some history
      for (let i = 0; i < 15; i++) {
        scheduler.processTicks(createTestState(), 10);
      }

      const optimal = scheduler.calculateOptimalBatchSize();
      expect(optimal).toBeGreaterThan(0);
      expect(optimal).toBeLessThanOrEqual(100);
    });
  });

  describe('configuration', () => {
    it('should allow updating configuration', () => {
      scheduler.configure({ maxBatchSize: 50 });

      const config = scheduler.getConfig();
      expect(config.maxBatchSize).toBe(50);
    });

    it('should preserve other config options', () => {
      const initialConfig = scheduler.getConfig();
      scheduler.configure({ maxBatchSize: 50 });

      const config = scheduler.getConfig();
      expect(config.frameBudget).toBe(initialConfig.frameBudget);
    });
  });
});

// ============================================================================
// Speed Multiplier Tests
// ============================================================================

describe('EXTENDED_SPEED_MULTIPLIERS', () => {
  it('should have expected speed values', () => {
    expect(EXTENDED_SPEED_MULTIPLIERS.paused).toBe(0);
    expect(EXTENDED_SPEED_MULTIPLIERS.normal).toBe(1);
    expect(EXTENDED_SPEED_MULTIPLIERS.fast).toBe(2);
    expect(EXTENDED_SPEED_MULTIPLIERS.maximum).toBe(100);
  });
});

describe('calculateTicksForSpeed', () => {
  it('should return 0 for paused', () => {
    const ticks = calculateTicksForSpeed('paused', 1000);
    expect(ticks).toBe(0);
  });

  it('should return correct ticks for normal speed', () => {
    // At 1 tick/sec (1000ms per tick), 1000ms = 1 tick
    const ticks = calculateTicksForSpeed('normal', 1000, 1);
    expect(ticks).toBe(1);
  });

  it('should scale ticks by multiplier', () => {
    const normalTicks = calculateTicksForSpeed('normal', 1000, 1);
    const fastTicks = calculateTicksForSpeed('fast', 1000, 1);
    
    expect(fastTicks).toBe(normalTicks * 2);
  });

  it('should handle maximum speed', () => {
    const maxTicks = calculateTicksForSpeed('maximum', 1000, 1);
    expect(maxTicks).toBe(100);
  });
});

// ============================================================================
// Throttled Update Tests
// ============================================================================

describe('createThrottledUpdate', () => {
  let mockTime: number;

  beforeEach(() => {
    vi.useFakeTimers();
    // Start at time 1000 to ensure first call is after the initial lastUpdate=0
    mockTime = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => mockTime);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should call update immediately on first call', () => {
    const updateFn = vi.fn();
    const throttled = createThrottledUpdate(updateFn, 100);

    throttled(42);

    expect(updateFn).toHaveBeenCalledWith(42);
  });

  it('should throttle rapid calls', () => {
    const updateFn = vi.fn();
    const throttled = createThrottledUpdate(updateFn, 100);

    throttled(1);
    expect(updateFn).toHaveBeenCalledTimes(1);

    // Immediate second call (within throttle window) should be throttled
    mockTime = 1010; // Only 10ms later
    throttled(2);
    expect(updateFn).toHaveBeenCalledTimes(1);

    // Third call still throttled
    mockTime = 1050;
    throttled(3);
    expect(updateFn).toHaveBeenCalledTimes(1);
  });

  it('should update with latest value after throttle period', () => {
    const updateFn = vi.fn();
    const throttled = createThrottledUpdate(updateFn, 100);

    throttled(1);
    expect(updateFn).toHaveBeenCalledWith(1);
    expect(updateFn).toHaveBeenCalledTimes(1);
    
    mockTime = 1200; // After throttle period (200ms later)
    throttled(2);

    expect(updateFn).toHaveBeenCalledWith(2);
    expect(updateFn).toHaveBeenCalledTimes(2);
  });
});
