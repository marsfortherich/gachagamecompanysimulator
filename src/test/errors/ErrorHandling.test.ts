/**
 * Error Handling Tests
 * Tests for ErrorTypes and ErrorBus
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  // Error types
  domainError,
  persistenceError,
  simulationError,
  uiError,
  createError,
  wrapError,
  
  // Type guards
  isDomainError,
  isPersistenceError,
  isSimulationError,
  isUIError,
  
  // Utilities
  getUserFriendlyMessage,
  formatErrorForLog,
} from '../../domain/errors';

import {
  ErrorBus,
  tryCatch,
  tryCatchAsync,
} from '../../infrastructure/errors';

// ============================================================================
// ErrorTypes Tests
// ============================================================================

describe('ErrorTypes', () => {
  describe('createError', () => {
    it('should create an error with all required fields', () => {
      const error = createError('TEST_ERROR', 'Test message', 'domain', 'medium');
      
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test message');
      expect(error.category).toBe('domain');
      expect(error.severity).toBe('medium');
      expect(error.timestamp).toBeDefined();
      expect(error.recoverable).toBe(true);
    });

    it('should mark critical errors as non-recoverable by default', () => {
      const error = createError('CRITICAL_ERROR', 'Critical', 'domain', 'critical');
      
      expect(error.recoverable).toBe(false);
    });

    it('should allow overriding recoverable', () => {
      const error = createError('TEST_ERROR', 'Test', 'domain', 'critical', {
        recoverable: true,
      });
      
      expect(error.recoverable).toBe(true);
    });

    it('should include context when provided', () => {
      const error = createError('TEST_ERROR', 'Test', 'domain', 'medium', {
        context: { userId: '123', action: 'test' },
      });
      
      expect(error.context).toEqual({ userId: '123', action: 'test' });
    });

    it('should include stack trace from original error', () => {
      const original = new Error('Original');
      const error = createError('WRAPPED', 'Wrapped', 'domain', 'medium', {
        originalError: original,
      });
      
      expect(error.stack).toBe(original.stack);
    });
  });

  describe('domainError', () => {
    it('should create a domain error', () => {
      const error = domainError('INSUFFICIENT_FUNDS', 'Not enough money');
      
      expect(error.category).toBe('domain');
      expect(error.code).toBe('INSUFFICIENT_FUNDS');
      expect(error.message).toBe('Not enough money');
    });

    it('should include entity information', () => {
      const error = domainError('ENTITY_NOT_FOUND', 'Game not found', {
        entityId: 'game-123',
        entityType: 'Game',
      });
      
      expect(error.entityId).toBe('game-123');
      expect(error.entityType).toBe('Game');
    });
  });

  describe('persistenceError', () => {
    it('should create a persistence error', () => {
      const error = persistenceError('SAVE_FAILED', 'Failed to save game');
      
      expect(error.category).toBe('persistence');
      expect(error.code).toBe('SAVE_FAILED');
    });

    it('should include storage information', () => {
      const error = persistenceError('STORAGE_FULL', 'Storage quota exceeded', {
        storageType: 'localStorage',
        dataSize: 5000000,
      });
      
      expect(error.storageType).toBe('localStorage');
      expect(error.dataSize).toBe(5000000);
    });
  });

  describe('simulationError', () => {
    it('should create a simulation error', () => {
      const error = simulationError('TICK_OVERFLOW', 'Too many ticks');
      
      expect(error.category).toBe('simulation');
      expect(error.code).toBe('TICK_OVERFLOW');
    });

    it('should include performance metrics', () => {
      const error = simulationError('PERFORMANCE_DEGRADATION', 'Slow', {
        tickNumber: 1000,
        performanceMetrics: {
          tickDuration: 100,
          memoryUsage: 500000000,
        },
      });
      
      expect(error.tickNumber).toBe(1000);
      expect(error.performanceMetrics?.tickDuration).toBe(100);
    });
  });

  describe('uiError', () => {
    it('should create a UI error', () => {
      const error = uiError('RENDER_FAILED', 'Component failed to render');
      
      expect(error.category).toBe('ui');
      expect(error.code).toBe('RENDER_FAILED');
      expect(error.severity).toBe('low'); // Default severity for UI errors
    });

    it('should include component information', () => {
      const error = uiError('COMPONENT_CRASHED', 'Dashboard crashed', {
        componentName: 'Dashboard',
        viewId: 'main-view',
      });
      
      expect(error.componentName).toBe('Dashboard');
      expect(error.viewId).toBe('main-view');
    });
  });

  describe('Type Guards', () => {
    it('isDomainError should correctly identify domain errors', () => {
      const domain = domainError('INVALID_OPERATION', 'Invalid');
      const persistence = persistenceError('SAVE_FAILED', 'Failed');
      
      expect(isDomainError(domain)).toBe(true);
      expect(isDomainError(persistence)).toBe(false);
    });

    it('isPersistenceError should correctly identify persistence errors', () => {
      const persistence = persistenceError('LOAD_FAILED', 'Failed');
      const simulation = simulationError('TICK_OVERFLOW', 'Overflow');
      
      expect(isPersistenceError(persistence)).toBe(true);
      expect(isPersistenceError(simulation)).toBe(false);
    });

    it('isSimulationError should correctly identify simulation errors', () => {
      const simulation = simulationError('WORKER_CRASHED', 'Crashed');
      const ui = uiError('RENDER_FAILED', 'Failed');
      
      expect(isSimulationError(simulation)).toBe(true);
      expect(isSimulationError(ui)).toBe(false);
    });

    it('isUIError should correctly identify UI errors', () => {
      const ui = uiError('COMPONENT_CRASHED', 'Crashed');
      const domain = domainError('INVALID_OPERATION', 'Invalid');
      
      expect(isUIError(ui)).toBe(true);
      expect(isUIError(domain)).toBe(false);
    });
  });

  describe('wrapError', () => {
    it('should wrap a native Error', () => {
      const native = new Error('Something went wrong');
      const wrapped = wrapError(native);
      
      expect(wrapped.message).toBe('Something went wrong');
      expect(wrapped.code).toBe('UNKNOWN_ERROR');
      expect(wrapped.stack).toBe(native.stack);
    });

    it('should allow specifying category and severity', () => {
      const native = new Error('Failed');
      const wrapped = wrapError(native, 'persistence', 'high');
      
      expect(wrapped.category).toBe('persistence');
      expect(wrapped.severity).toBe('high');
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return friendly message for known error codes', () => {
      const error = domainError('INSUFFICIENT_FUNDS', 'Technical: balance < cost');
      const friendly = getUserFriendlyMessage(error);
      
      expect(friendly).toBe("You don't have enough money for this action.");
    });

    it('should return default message for unknown codes', () => {
      const error = domainError('SOME_UNKNOWN_CODE' as never, 'Technical message');
      const friendly = getUserFriendlyMessage(error);
      
      expect(friendly).toBe('An error occurred. Please try again.');
    });
  });

  describe('formatErrorForLog', () => {
    it('should format error for logging', () => {
      const error = domainError('INVALID_OPERATION', 'Cannot do this', {
        severity: 'high',
        context: { action: 'test' },
      });
      
      const formatted = formatErrorForLog(error);
      
      expect(formatted).toContain('[HIGH]');
      expect(formatted).toContain('[domain]');
      expect(formatted).toContain('INVALID_OPERATION');
      expect(formatted).toContain('Cannot do this');
      expect(formatted).toContain('Context:');
    });
  });
});

// ============================================================================
// ErrorBus Tests
// ============================================================================

describe('ErrorBus', () => {
  let errorBus: ErrorBus;

  beforeEach(() => {
    errorBus = new ErrorBus({ verbose: false, consoleEnabled: false });
  });

  describe('report', () => {
    it('should add error to history', () => {
      const error = domainError('INVALID_OPERATION', 'Test');
      errorBus.report(error);
      
      const history = errorBus.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toBe(error);
    });

    it('should update statistics', () => {
      errorBus.report(domainError('INVALID_OPERATION', 'Test 1'));
      errorBus.report(persistenceError('SAVE_FAILED', 'Test 2'));
      errorBus.report(domainError('ENTITY_NOT_FOUND', 'Test 3', { severity: 'high' }));
      
      const stats = errorBus.getStats();
      
      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByCategory.domain).toBe(2);
      expect(stats.errorsByCategory.persistence).toBe(1);
    });

    it('should notify subscribers', () => {
      const handler = vi.fn();
      errorBus.subscribe(handler);
      
      const error = domainError('VALIDATION_FAILED', 'Test');
      errorBus.report(error);
      
      expect(handler).toHaveBeenCalledWith(error);
    });
  });

  describe('subscribe', () => {
    it('should filter by category', () => {
      const domainHandler = vi.fn();
      const persistenceHandler = vi.fn();
      
      errorBus.subscribe(domainHandler, 'domain');
      errorBus.subscribe(persistenceHandler, 'persistence');
      
      errorBus.report(domainError('INVALID_OPERATION', 'Test'));
      
      expect(domainHandler).toHaveBeenCalled();
      expect(persistenceHandler).not.toHaveBeenCalled();
    });

    it('should support custom filter functions', () => {
      const criticalHandler = vi.fn();
      
      errorBus.subscribe(criticalHandler, (error) => error.severity === 'critical');
      
      errorBus.report(domainError('INVALID_OPERATION', 'Test', { severity: 'low' }));
      errorBus.report(domainError('INVALID_GAME_STATE', 'Test', { severity: 'critical' }));
      
      expect(criticalHandler).toHaveBeenCalledTimes(1);
    });

    it('should return unsubscribe function', () => {
      const handler = vi.fn();
      const unsubscribe = errorBus.subscribe(handler);
      
      errorBus.report(domainError('INVALID_OPERATION', 'Test'));
      expect(handler).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      
      errorBus.report(domainError('ENTITY_NOT_FOUND', 'Test'));
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscribeCritical', () => {
    it('should only receive critical errors', () => {
      const handler = vi.fn();
      errorBus.subscribeCritical(handler);
      
      errorBus.report(domainError('INVALID_OPERATION', 'Low', { severity: 'low' }));
      errorBus.report(domainError('ENTITY_NOT_FOUND', 'High', { severity: 'high' }));
      errorBus.report(domainError('INVALID_GAME_STATE', 'Critical', { severity: 'critical' }));
      
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'critical' })
      );
    });
  });

  describe('getHistory', () => {
    it('should return all errors', () => {
      errorBus.report(domainError('INVALID_OPERATION', 'Test 1'));
      errorBus.report(domainError('ENTITY_NOT_FOUND', 'Test 2'));
      
      expect(errorBus.getHistory()).toHaveLength(2);
    });

    it('should support filtering', () => {
      errorBus.report(domainError('INVALID_OPERATION', 'Test 1'));
      errorBus.report(persistenceError('SAVE_FAILED', 'Test 2'));
      
      const domainErrors = errorBus.getHistory((e) => e.category === 'domain');
      expect(domainErrors).toHaveLength(1);
    });
  });

  describe('clearHistory', () => {
    it('should clear all history', () => {
      errorBus.report(domainError('INVALID_OPERATION', 'Test'));
      expect(errorBus.getHistory()).toHaveLength(1);
      
      errorBus.clearHistory();
      expect(errorBus.getHistory()).toHaveLength(0);
    });
  });

  describe('resetStats', () => {
    it('should reset all statistics', () => {
      errorBus.report(domainError('INVALID_OPERATION', 'Test'));
      
      errorBus.resetStats();
      const stats = errorBus.getStats();
      
      expect(stats.totalErrors).toBe(0);
      expect(stats.errorsByCategory.domain).toBe(0);
    });
  });
});

// ============================================================================
// Helper Function Tests
// ============================================================================

describe('Error Helper Functions', () => {
  describe('tryCatch', () => {
    it('should return value on success', () => {
      const result = tryCatch(() => 42);
      expect(result).toBe(42);
    });

    it('should return undefined on error', () => {
      const result = tryCatch(() => {
        throw new Error('Failed');
      });
      expect(result).toBeUndefined();
    });
  });

  describe('tryCatchAsync', () => {
    it('should return value on success', async () => {
      const result = await tryCatchAsync(async () => 42);
      expect(result).toBe(42);
    });

    it('should return undefined on error', async () => {
      const result = await tryCatchAsync(async () => {
        throw new Error('Failed');
      });
      expect(result).toBeUndefined();
    });
  });
});
