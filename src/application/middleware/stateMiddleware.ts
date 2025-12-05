/**
 * State Middleware - Part of Prompt 5.2: State Management
 * 
 * Middleware functions that wrap the reducer to add cross-cutting concerns:
 * - Logging: Track all state changes for debugging
 * - Persistence: Auto-save state to localStorage
 * - Validation: Ensure state invariants
 * - Performance: Track reducer execution time
 */

import { GameState } from '../state';
import { GameAction } from '../actions';

// =============================================================================
// Types
// =============================================================================

export type Reducer<S, A> = (state: S, action: A) => S;

export type Middleware<S, A> = (
  reducer: Reducer<S, A>
) => Reducer<S, A>;

export interface LogEntry {
  timestamp: number;
  actionType: string;
  prevState: Partial<GameState>;
  nextState: Partial<GameState>;
  duration: number;
}

export interface MiddlewareConfig {
  enableLogging?: boolean;
  enablePersistence?: boolean;
  enableValidation?: boolean;
  enablePerformance?: boolean;
  logLevel?: 'minimal' | 'normal' | 'verbose';
  persistenceKey?: string;
  onError?: (error: Error, action: GameAction) => void;
}

// =============================================================================
// Logging Middleware
// =============================================================================

const actionHistory: LogEntry[] = [];
const MAX_HISTORY_SIZE = 100;

/**
 * Creates a logging middleware that tracks all state changes
 */
export function createLoggingMiddleware(
  logLevel: 'minimal' | 'normal' | 'verbose' = 'normal'
): Middleware<GameState, GameAction> {
  return (reducer) => (state, action) => {
    const startTime = performance.now();
    const prevState = state;
    const nextState = reducer(state, action);
    const duration = performance.now() - startTime;

    // Create log entry
    const entry: LogEntry = {
      timestamp: Date.now(),
      actionType: action.type,
      prevState: extractStateSnapshot(prevState, logLevel),
      nextState: extractStateSnapshot(nextState, logLevel),
      duration,
    };

    // Add to history
    actionHistory.push(entry);
    if (actionHistory.length > MAX_HISTORY_SIZE) {
      actionHistory.shift();
    }

    // Console logging based on log level
    if (logLevel === 'verbose') {
      console.group(`🎮 Action: ${action.type}`);
      console.log('Payload:', 'payload' in action ? action.payload : 'none');
      console.log('Duration:', `${duration.toFixed(2)}ms`);
      console.log('Prev State:', prevState);
      console.log('Next State:', nextState);
      console.groupEnd();
    } else if (logLevel === 'normal') {
      console.log(
        `🎮 ${action.type}`,
        `(${duration.toFixed(2)}ms)`,
        hasStateChanged(prevState, nextState) ? '✓ changed' : '○ unchanged'
      );
    }
    // 'minimal' logs nothing to console

    return nextState;
  };
}

/**
 * Extract a simplified snapshot of state for logging
 */
function extractStateSnapshot(
  state: GameState,
  level: 'minimal' | 'normal' | 'verbose'
): Partial<GameState> {
  if (level === 'minimal') {
    return {
      currentTick: state.currentTick,
      isPaused: state.isPaused,
    };
  }
  
  if (level === 'normal') {
    return {
      currentTick: state.currentTick,
      isPaused: state.isPaused,
      gameSpeed: state.gameSpeed,
      employees: { length: state.employees.length } as any,
      games: { length: state.games.length } as any,
    };
  }
  
  // verbose
  return state;
}

/**
 * Check if state has changed
 */
function hasStateChanged(prev: GameState, next: GameState): boolean {
  return prev !== next;
}

/**
 * Get action history for debugging
 */
export function getActionHistory(): readonly LogEntry[] {
  return [...actionHistory];
}

/**
 * Clear action history
 */
export function clearActionHistory(): void {
  actionHistory.length = 0;
}

// =============================================================================
// Persistence Middleware
// =============================================================================

const DEFAULT_PERSISTENCE_KEY = 'gacha_game_state';
const DEBOUNCE_DELAY = 1000; // 1 second

let persistenceTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Creates a persistence middleware that auto-saves state
 */
export function createPersistenceMiddleware(
  key: string = DEFAULT_PERSISTENCE_KEY,
  debounceMs: number = DEBOUNCE_DELAY
): Middleware<GameState, GameAction> {
  return (reducer) => (state, action) => {
    const nextState = reducer(state, action);

    // Skip persistence for certain actions
    const skipPersistence = ['TICK'].includes(action.type);
    
    if (!skipPersistence && hasStateChanged(state, nextState)) {
      // Debounce persistence
      if (persistenceTimeout) {
        clearTimeout(persistenceTimeout);
      }
      
      persistenceTimeout = setTimeout(() => {
        try {
          const serialized = JSON.stringify(nextState);
          localStorage.setItem(key, serialized);
          console.log('💾 State persisted');
        } catch (error) {
          console.error('Failed to persist state:', error);
        }
      }, debounceMs);
    }

    return nextState;
  };
}

/**
 * Load persisted state
 */
export function loadPersistedState(key: string = DEFAULT_PERSISTENCE_KEY): GameState | null {
  try {
    const serialized = localStorage.getItem(key);
    if (serialized) {
      return JSON.parse(serialized);
    }
  } catch (error) {
    console.error('Failed to load persisted state:', error);
  }
  return null;
}

/**
 * Clear persisted state
 */
export function clearPersistedState(key: string = DEFAULT_PERSISTENCE_KEY): void {
  localStorage.removeItem(key);
}

// =============================================================================
// Validation Middleware
// =============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Creates a validation middleware that ensures state invariants
 */
export function createValidationMiddleware(
  onInvalid?: (errors: string[], state: GameState) => void
): Middleware<GameState, GameAction> {
  return (reducer) => (state, action) => {
    const nextState = reducer(state, action);
    
    const validation = validateState(nextState);
    
    if (!validation.isValid) {
      console.warn('⚠️ State validation failed:', validation.errors);
      onInvalid?.(validation.errors, nextState);
    }

    return nextState;
  };
}

/**
 * Validate game state invariants
 */
function validateState(state: GameState): ValidationResult {
  const errors: string[] = [];

  // Check company funds
  if (state.company && state.company.funds < 0) {
    errors.push('Company funds cannot be negative');
  }

  // Check employee count vs office capacity
  if (state.company) {
    const capacity = getOfficeCapacity(state.company.officeLevel);
    if (state.employees.length > capacity) {
      errors.push(`Too many employees (${state.employees.length}) for office level ${state.company.officeLevel} (max: ${capacity})`);
    }
  }

  // Check employee morale range
  for (const employee of state.employees) {
    if (employee.morale < 0 || employee.morale > 100) {
      errors.push(`Employee ${employee.name} has invalid morale: ${employee.morale}`);
    }
  }

  // Check game progress range
  for (const game of state.games) {
    if (game.developmentProgress < 0 || game.developmentProgress > 100) {
      errors.push(`Game ${game.name} has invalid progress: ${game.developmentProgress}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get office capacity by level
 */
function getOfficeCapacity(level: number): number {
  const capacities: Record<number, number> = {
    1: 5,
    2: 15,
    3: 30,
    4: 50,
    5: 100,
  };
  return capacities[level] ?? 5;
}

// =============================================================================
// Performance Middleware
// =============================================================================

export interface PerformanceMetrics {
  totalActions: number;
  totalDuration: number;
  averageDuration: number;
  slowestAction: { type: string; duration: number } | null;
  actionCounts: Record<string, number>;
}

const performanceMetrics: PerformanceMetrics = {
  totalActions: 0,
  totalDuration: 0,
  averageDuration: 0,
  slowestAction: null,
  actionCounts: {},
};

/**
 * Creates a performance tracking middleware
 */
export function createPerformanceMiddleware(
  slowThresholdMs: number = 16
): Middleware<GameState, GameAction> {
  return (reducer) => (state, action) => {
    const startTime = performance.now();
    const nextState = reducer(state, action);
    const duration = performance.now() - startTime;

    // Update metrics
    performanceMetrics.totalActions++;
    performanceMetrics.totalDuration += duration;
    performanceMetrics.averageDuration = 
      performanceMetrics.totalDuration / performanceMetrics.totalActions;
    
    performanceMetrics.actionCounts[action.type] = 
      (performanceMetrics.actionCounts[action.type] ?? 0) + 1;

    if (!performanceMetrics.slowestAction || duration > performanceMetrics.slowestAction.duration) {
      performanceMetrics.slowestAction = { type: action.type, duration };
    }

    // Warn about slow actions
    if (duration > slowThresholdMs) {
      console.warn(`🐌 Slow action: ${action.type} took ${duration.toFixed(2)}ms`);
    }

    return nextState;
  };
}

/**
 * Get performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  return { ...performanceMetrics };
}

/**
 * Reset performance metrics
 */
export function resetPerformanceMetrics(): void {
  performanceMetrics.totalActions = 0;
  performanceMetrics.totalDuration = 0;
  performanceMetrics.averageDuration = 0;
  performanceMetrics.slowestAction = null;
  performanceMetrics.actionCounts = {};
}

// =============================================================================
// Compose Middleware
// =============================================================================

/**
 * Compose multiple middleware functions into one
 */
export function composeMiddleware<S, A>(
  ...middlewares: Middleware<S, A>[]
): Middleware<S, A> {
  return (reducer) => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      reducer
    );
  };
}

/**
 * Create a configured middleware stack
 */
export function createMiddlewareStack(
  config: MiddlewareConfig = {}
): Middleware<GameState, GameAction> {
  const middlewares: Middleware<GameState, GameAction>[] = [];

  if (config.enablePerformance) {
    middlewares.push(createPerformanceMiddleware());
  }

  if (config.enableLogging) {
    middlewares.push(createLoggingMiddleware(config.logLevel));
  }

  if (config.enableValidation) {
    middlewares.push(createValidationMiddleware());
  }

  if (config.enablePersistence) {
    middlewares.push(createPersistenceMiddleware(config.persistenceKey));
  }

  return composeMiddleware(...middlewares);
}
