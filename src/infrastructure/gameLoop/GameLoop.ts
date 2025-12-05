import { GameSpeed, SPEED_MULTIPLIERS } from '../../application/state';

/**
 * Interface for time provider - allows injecting deterministic time for testing
 */
export interface ITimeProvider {
  now(): number;
  requestFrame(callback: (time: number) => void): number;
  cancelFrame(id: number): void;
}

/**
 * Default time provider using browser APIs
 */
export class BrowserTimeProvider implements ITimeProvider {
  now(): number {
    return performance.now();
  }
  
  requestFrame(callback: (time: number) => void): number {
    return requestAnimationFrame(callback);
  }
  
  cancelFrame(id: number): void {
    cancelAnimationFrame(id);
  }
}

/**
 * Deterministic time provider for testing
 */
export class DeterministicTimeProvider implements ITimeProvider {
  private currentTime: number = 0;
  private pendingCallbacks: Map<number, (time: number) => void> = new Map();
  private nextId: number = 1;
  
  now(): number {
    return this.currentTime;
  }
  
  requestFrame(callback: (time: number) => void): number {
    const id = this.nextId++;
    this.pendingCallbacks.set(id, callback);
    return id;
  }
  
  cancelFrame(id: number): void {
    this.pendingCallbacks.delete(id);
  }
  
  /**
   * Advance time and trigger any pending frame callbacks
   */
  advanceTime(ms: number): void {
    this.currentTime += ms;
    const callbacks = new Map(this.pendingCallbacks);
    this.pendingCallbacks.clear();
    for (const callback of callbacks.values()) {
      callback(this.currentTime);
    }
  }
  
  /**
   * Reset time to zero
   */
  reset(): void {
    this.currentTime = 0;
    this.pendingCallbacks.clear();
    this.nextId = 1;
  }
}

/**
 * Scheduled event for the game loop
 */
export interface ScheduledEvent {
  readonly id: string;
  readonly triggerTick: number;
  readonly callback: () => void;
  readonly recurring: boolean;
  readonly intervalTicks?: number;
}

/**
 * Interface for game loop callbacks
 */
export interface GameLoopCallbacks {
  onTick: (deltaTime: number) => void;
  onAutoSave?: () => void;
}

/**
 * Game loop manager - handles the simulation timing
 * Uses requestAnimationFrame for smooth updates
 */
export class GameLoop {
  private isRunning = false;
  private lastTime = 0;
  private accumulatedTime = 0;
  private ticksPerSecond = 1;  // 1 tick = 1 game day, 1 second real time = 1 day
  private autoSaveInterval = 60000;  // Auto-save every 60 seconds
  private lastAutoSave = 0;
  private animationFrameId: number | null = null;
  private callbacks: GameLoopCallbacks | null = null;
  private speed: GameSpeed = 'normal';
  private timeProvider: ITimeProvider;
  
  // Event scheduling
  private scheduledEvents: Map<string, ScheduledEvent> = new Map();
  private currentTick = 0;
  
  constructor(timeProvider: ITimeProvider = new BrowserTimeProvider()) {
    this.timeProvider = timeProvider;
  }

  /**
   * Start the game loop
   */
  start(callbacks: GameLoopCallbacks): void {
    if (this.isRunning) return;
    
    this.callbacks = callbacks;
    this.isRunning = true;
    this.lastTime = this.timeProvider.now();
    this.lastAutoSave = this.lastTime;
    this.loop(this.lastTime);
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      this.timeProvider.cancelFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Pause the game loop (maintains state but stops ticking)
   */
  pause(): void {
    this.isRunning = false;
  }

  /**
   * Resume the game loop
   */
  resume(): void {
    if (this.isRunning || !this.callbacks) return;
    this.isRunning = true;
    this.lastTime = this.timeProvider.now();
    this.loop(this.lastTime);
  }

  /**
   * Set game speed
   */
  setSpeed(speed: GameSpeed): void {
    this.speed = speed;
  }

  /**
   * Get current speed
   */
  getSpeed(): GameSpeed {
    return this.speed;
  }

  /**
   * Check if loop is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }
  
  /**
   * Get current tick count
   */
  getCurrentTick(): number {
    return this.currentTick;
  }
  
  /**
   * Set current tick (for loading saved games)
   */
  setCurrentTick(tick: number): void {
    this.currentTick = tick;
  }

  /**
   * Schedule an event to trigger at a specific tick
   */
  scheduleEvent(
    id: string,
    triggerTick: number,
    callback: () => void,
    recurring: boolean = false,
    intervalTicks?: number
  ): void {
    this.scheduledEvents.set(id, {
      id,
      triggerTick,
      callback,
      recurring,
      intervalTicks,
    });
  }
  
  /**
   * Cancel a scheduled event
   */
  cancelEvent(id: string): void {
    this.scheduledEvents.delete(id);
  }
  
  /**
   * Process scheduled events for current tick
   */
  private processScheduledEvents(): void {
    const toRemove: string[] = [];
    const toReschedule: ScheduledEvent[] = [];
    
    for (const [id, event] of this.scheduledEvents) {
      if (event.triggerTick <= this.currentTick) {
        event.callback();
        
        if (event.recurring && event.intervalTicks) {
          toReschedule.push({
            ...event,
            triggerTick: this.currentTick + event.intervalTicks,
          });
        } else {
          toRemove.push(id);
        }
      }
    }
    
    for (const id of toRemove) {
      this.scheduledEvents.delete(id);
    }
    
    for (const event of toReschedule) {
      this.scheduledEvents.set(event.id, event);
    }
  }

  /**
   * Main loop function
   */
  private loop = (currentTime: number): void => {
    if (!this.isRunning || !this.callbacks) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Accumulate time
    const speedMultiplier = SPEED_MULTIPLIERS[this.speed];
    this.accumulatedTime += deltaTime * speedMultiplier;

    // Process ticks based on accumulated time
    const tickInterval = 1000 / this.ticksPerSecond;
    while (this.accumulatedTime >= tickInterval) {
      this.currentTick++;
      this.processScheduledEvents();
      this.callbacks.onTick(1);
      this.accumulatedTime -= tickInterval;
    }

    // Check for auto-save
    if (this.callbacks.onAutoSave && currentTime - this.lastAutoSave >= this.autoSaveInterval) {
      this.callbacks.onAutoSave();
      this.lastAutoSave = currentTime;
    }

    // Schedule next frame
    this.animationFrameId = this.timeProvider.requestFrame(this.loop);
  };

  /**
   * Set ticks per second (game speed in terms of game days per real second)
   */
  setTicksPerSecond(tps: number): void {
    this.ticksPerSecond = Math.max(0.1, Math.min(10, tps));
  }

  /**
   * Set auto-save interval in milliseconds
   */
  setAutoSaveInterval(interval: number): void {
    this.autoSaveInterval = interval;
  }
  
  /**
   * Manually advance one tick (for testing)
   */
  manualTick(): void {
    if (!this.callbacks) return;
    this.currentTick++;
    this.processScheduledEvents();
    this.callbacks.onTick(1);
  }
}

/**
 * Singleton game loop instance for production use
 */
export const gameLoop = new GameLoop();
