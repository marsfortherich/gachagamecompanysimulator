/**
 * SimulationWorker - Web Worker for background simulation processing
 * Offloads heavy simulation calculations from the main thread
 */

import { simulationError, SimulationError } from '../../domain/errors';
import { errorBus } from '../errors/ErrorBus';

// ============================================================================
// Message Types
// ============================================================================

/**
 * Commands sent to the worker
 */
export type WorkerCommand =
  | { type: 'INIT'; payload: { config: WorkerConfig } }
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'SET_SPEED'; payload: { speed: number } }
  | { type: 'PROCESS_TICKS'; payload: { state: unknown; tickCount: number } }
  | { type: 'UPDATE_STATE'; payload: { state: unknown } }
  | { type: 'GET_METRICS' };

/**
 * Responses from the worker
 */
export type WorkerResponse =
  | { type: 'INITIALIZED' }
  | { type: 'STARTED' }
  | { type: 'STOPPED' }
  | { type: 'PAUSED' }
  | { type: 'RESUMED' }
  | { type: 'SPEED_UPDATED'; payload: { speed: number } }
  | { type: 'TICKS_PROCESSED'; payload: { state: unknown; ticksProcessed: number; duration: number } }
  | { type: 'STATE_UPDATED' }
  | { type: 'METRICS'; payload: WorkerMetrics }
  | { type: 'ERROR'; payload: { error: SimulationError } }
  | { type: 'TICK'; payload: { state: unknown; tick: number } };

/**
 * Worker configuration
 */
export interface WorkerConfig {
  tickRate: number;
  maxBatchSize: number;
  enableMetrics: boolean;
}

/**
 * Worker performance metrics
 */
export interface WorkerMetrics {
  totalTicks: number;
  totalBatches: number;
  averageTickTime: number;
  maxTickTime: number;
  uptime: number;
  isRunning: boolean;
}

// ============================================================================
// SimulationWorkerManager
// ============================================================================

/**
 * Manager for the simulation web worker
 * Handles worker lifecycle and communication
 */
export class SimulationWorkerManager {
  private worker: Worker | null = null;
  private isRunning = false;
  private messageHandlers: Map<string, ((response: WorkerResponse) => void)[]> = new Map();
  private pendingPromises: Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void }> = new Map();
  private nextRequestId = 0;
  private workerSupported: boolean;
  private tickCallback: ((state: unknown, tick: number) => void) | null = null;

  constructor() {
    this.workerSupported = typeof Worker !== 'undefined';
  }

  /**
   * Check if Web Workers are supported
   */
  isSupported(): boolean {
    return this.workerSupported;
  }

  /**
   * Initialize the worker
   */
  async initialize(config: WorkerConfig): Promise<boolean> {
    if (!this.workerSupported) {
      console.warn('Web Workers not supported, falling back to main thread');
      return false;
    }

    try {
      // Create worker from blob URL (for bundler compatibility)
      const workerCode = this.getWorkerCode();
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      
      this.worker = new Worker(workerUrl);
      this.setupMessageHandler();
      
      await this.sendCommand({ type: 'INIT', payload: { config } });
      
      URL.revokeObjectURL(workerUrl);
      return true;
    } catch (error) {
      errorBus.report(
        simulationError('WORKER_CRASHED', 'Failed to initialize worker', {
          originalError: error instanceof Error ? error : new Error(String(error)),
          severity: 'high',
        })
      );
      return false;
    }
  }

  /**
   * Start the simulation
   */
  async start(): Promise<void> {
    if (!this.worker) return;
    await this.sendCommand({ type: 'START' });
    this.isRunning = true;
  }

  /**
   * Stop the simulation
   */
  async stop(): Promise<void> {
    if (!this.worker) return;
    await this.sendCommand({ type: 'STOP' });
    this.isRunning = false;
  }

  /**
   * Pause the simulation
   */
  async pause(): Promise<void> {
    if (!this.worker) return;
    await this.sendCommand({ type: 'PAUSE' });
  }

  /**
   * Resume the simulation
   */
  async resume(): Promise<void> {
    if (!this.worker) return;
    await this.sendCommand({ type: 'RESUME' });
  }

  /**
   * Set simulation speed
   */
  async setSpeed(speed: number): Promise<void> {
    if (!this.worker) return;
    await this.sendCommand({ type: 'SET_SPEED', payload: { speed } });
  }

  /**
   * Process ticks and get updated state
   */
  async processTicks<T>(state: T, tickCount: number): Promise<{ state: T; ticksProcessed: number; duration: number }> {
    if (!this.worker) {
      return { state, ticksProcessed: 0, duration: 0 };
    }

    const response = await this.sendCommand({
      type: 'PROCESS_TICKS',
      payload: { state, tickCount },
    }) as { type: 'TICKS_PROCESSED'; payload: { state: T; ticksProcessed: number; duration: number } };

    return response.payload;
  }

  /**
   * Update worker state
   */
  async updateState(state: unknown): Promise<void> {
    if (!this.worker) return;
    await this.sendCommand({ type: 'UPDATE_STATE', payload: { state } });
  }

  /**
   * Get worker metrics
   */
  async getMetrics(): Promise<WorkerMetrics | null> {
    if (!this.worker) return null;
    
    const response = await this.sendCommand({ type: 'GET_METRICS' }) as { type: 'METRICS'; payload: WorkerMetrics };
    return response.payload;
  }

  /**
   * Set tick callback for continuous simulation mode
   */
  setTickCallback(callback: (state: unknown, tick: number) => void): void {
    this.tickCallback = callback;
  }

  /**
   * Subscribe to worker responses
   */
  onResponse(type: string, handler: (response: WorkerResponse) => void): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);

    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index >= 0) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isRunning = false;
    }
    this.messageHandlers.clear();
    this.pendingPromises.clear();
  }

  /**
   * Check if worker is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private setupMessageHandler(): void {
    if (!this.worker) return;

    this.worker.onmessage = (event: MessageEvent<WorkerResponse & { requestId?: string }>) => {
      const response = event.data;

      // Handle tick callbacks
      if (response.type === 'TICK' && this.tickCallback) {
        this.tickCallback(response.payload.state, response.payload.tick);
      }

      // Handle errors
      if (response.type === 'ERROR') {
        errorBus.report(response.payload.error);
      }

      // Resolve pending promise if this is a response to a request
      if (response.requestId && this.pendingPromises.has(response.requestId)) {
        const { resolve } = this.pendingPromises.get(response.requestId)!;
        this.pendingPromises.delete(response.requestId);
        resolve(response);
      }

      // Notify handlers
      const handlers = this.messageHandlers.get(response.type);
      if (handlers) {
        for (const handler of handlers) {
          handler(response);
        }
      }
    };

    this.worker.onerror = (error) => {
      errorBus.report(
        simulationError('WORKER_CRASHED', 'Worker error: ' + error.message, {
          severity: 'critical',
        })
      );
    };
  }

  private sendCommand(command: WorkerCommand): Promise<WorkerResponse> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const requestId = `req_${this.nextRequestId++}`;
      this.pendingPromises.set(requestId, { resolve: resolve as (value: unknown) => void, reject });

      // Set timeout for worker response
      const timeout = setTimeout(() => {
        if (this.pendingPromises.has(requestId)) {
          this.pendingPromises.delete(requestId);
          reject(new Error('Worker timeout'));
          errorBus.report(
            simulationError('WORKER_TIMEOUT', 'Worker did not respond in time', {
              severity: 'high',
            })
          );
        }
      }, 5000);

      this.worker.postMessage({ ...command, requestId });

      // Clear timeout when resolved
      const originalResolve = resolve;
      this.pendingPromises.set(requestId, {
        resolve: (value) => {
          clearTimeout(timeout);
          originalResolve(value as WorkerResponse);
        },
        reject,
      });
    });
  }

  /**
   * Generate worker code as a string (for bundler compatibility)
   */
  private getWorkerCode(): string {
    return `
// Simulation Worker
let config = { tickRate: 1, maxBatchSize: 100, enableMetrics: true };
let state = null;
let isRunning = false;
let isPaused = false;
let speed = 1;
let metrics = {
  totalTicks: 0,
  totalBatches: 0,
  tickTimes: [],
  startTime: Date.now(),
};

self.onmessage = function(event) {
  const { type, payload, requestId } = event.data;
  
  switch (type) {
    case 'INIT':
      config = payload.config;
      metrics.startTime = Date.now();
      respond({ type: 'INITIALIZED' }, requestId);
      break;
      
    case 'START':
      isRunning = true;
      isPaused = false;
      respond({ type: 'STARTED' }, requestId);
      break;
      
    case 'STOP':
      isRunning = false;
      isPaused = false;
      respond({ type: 'STOPPED' }, requestId);
      break;
      
    case 'PAUSE':
      isPaused = true;
      respond({ type: 'PAUSED' }, requestId);
      break;
      
    case 'RESUME':
      isPaused = false;
      respond({ type: 'RESUMED' }, requestId);
      break;
      
    case 'SET_SPEED':
      speed = payload.speed;
      respond({ type: 'SPEED_UPDATED', payload: { speed } }, requestId);
      break;
      
    case 'PROCESS_TICKS':
      const result = processTicks(payload.state, payload.tickCount);
      respond({ type: 'TICKS_PROCESSED', payload: result }, requestId);
      break;
      
    case 'UPDATE_STATE':
      state = payload.state;
      respond({ type: 'STATE_UPDATED' }, requestId);
      break;
      
    case 'GET_METRICS':
      respond({ type: 'METRICS', payload: getMetrics() }, requestId);
      break;
  }
};

function respond(response, requestId) {
  self.postMessage({ ...response, requestId });
}

function processTicks(currentState, tickCount) {
  const startTime = performance.now();
  const maxTicks = Math.min(tickCount, config.maxBatchSize);
  
  let processedState = { ...currentState };
  let ticksProcessed = 0;
  
  for (let i = 0; i < maxTicks; i++) {
    // Basic tick processing - increment tick counter
    // In a real implementation, this would process game logic
    processedState = {
      ...processedState,
      tick: (processedState.tick || 0) + 1,
    };
    ticksProcessed++;
  }
  
  const duration = performance.now() - startTime;
  
  // Update metrics
  metrics.totalTicks += ticksProcessed;
  metrics.totalBatches++;
  metrics.tickTimes.push(duration / ticksProcessed);
  if (metrics.tickTimes.length > 100) {
    metrics.tickTimes.shift();
  }
  
  return { state: processedState, ticksProcessed, duration };
}

function getMetrics() {
  const avgTickTime = metrics.tickTimes.length > 0
    ? metrics.tickTimes.reduce((a, b) => a + b, 0) / metrics.tickTimes.length
    : 0;
  const maxTickTime = metrics.tickTimes.length > 0
    ? Math.max(...metrics.tickTimes)
    : 0;
    
  return {
    totalTicks: metrics.totalTicks,
    totalBatches: metrics.totalBatches,
    averageTickTime: avgTickTime,
    maxTickTime: maxTickTime,
    uptime: Date.now() - metrics.startTime,
    isRunning: isRunning,
  };
}
`;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new simulation worker manager
 */
export function createSimulationWorker(): SimulationWorkerManager {
  return new SimulationWorkerManager();
}

/**
 * Global simulation worker instance (optional)
 */
export const simulationWorker = new SimulationWorkerManager();
