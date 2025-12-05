/**
 * ErrorBus - Centralized error handling and logging infrastructure
 * Provides consistent error handling, logging, and notification across the application
 */

import {
  AppError,
  ErrorSeverity,
  ErrorCategory,
  formatErrorForLog,
  getUserFriendlyMessage,
  wrapError,
} from '../../domain/errors';

// ============================================================================
// Types
// ============================================================================

/**
 * Error handler callback type
 */
export type ErrorHandler = (error: AppError) => void;

/**
 * Error filter predicate
 */
export type ErrorFilter = (error: AppError) => boolean;

/**
 * Logging configuration
 */
export interface LoggingConfig {
  /** Enable verbose logging (development mode) */
  verbose: boolean;
  /** Minimum severity to log */
  minSeverity: ErrorSeverity;
  /** Enable console logging */
  consoleEnabled: boolean;
  /** Enable remote logging (for production) */
  remoteEnabled: boolean;
  /** Maximum errors to keep in history */
  maxHistorySize: number;
}

/**
 * Error statistics
 */
export interface ErrorStats {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  recentErrors: number;
  lastError: AppError | null;
}

// ============================================================================
// ErrorBus Implementation
// ============================================================================

/**
 * Centralized error bus for application-wide error handling
 */
export class ErrorBus {
  private handlers: Map<string, Set<ErrorHandler>> = new Map();
  private history: AppError[] = [];
  private config: LoggingConfig;
  private stats: ErrorStats = {
    totalErrors: 0,
    errorsByCategory: {
      domain: 0,
      persistence: 0,
      simulation: 0,
      ui: 0,
      network: 0,
    },
    errorsBySeverity: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    },
    recentErrors: 0,
    lastError: null,
  };
  private recentErrorWindow = 60000; // 1 minute
  private recentErrorTimestamps: number[] = [];

  constructor(config: Partial<LoggingConfig> = {}) {
    // Check for development mode using Vite's import.meta.env
    const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV === true;
    
    this.config = {
      verbose: config.verbose ?? isDev,
      minSeverity: config.minSeverity ?? 'low',
      consoleEnabled: config.consoleEnabled ?? true,
      remoteEnabled: config.remoteEnabled ?? false,
      maxHistorySize: config.maxHistorySize ?? 100,
    };
  }

  /**
   * Report an error to the bus
   */
  report(error: AppError): void {
    // Update statistics
    this.updateStats(error);
    
    // Add to history
    this.history.push(error);
    if (this.history.length > this.config.maxHistorySize) {
      this.history = this.history.slice(-this.config.maxHistorySize);
    }

    // Log the error
    this.logError(error);

    // Notify handlers
    this.notifyHandlers(error);
  }

  /**
   * Report a native Error by wrapping it
   */
  reportNative(
    error: Error,
    category: ErrorCategory = 'domain',
    severity: ErrorSeverity = 'medium'
  ): void {
    this.report(wrapError(error, category, severity));
  }

  /**
   * Subscribe to errors (all or filtered by category/severity)
   */
  subscribe(
    handler: ErrorHandler,
    filter?: ErrorFilter | ErrorCategory
  ): () => void {
    const filterKey = typeof filter === 'string' ? filter : '*';
    
    if (!this.handlers.has(filterKey)) {
      this.handlers.set(filterKey, new Set());
    }

    const wrappedHandler: ErrorHandler = (error) => {
      if (typeof filter === 'function') {
        if (filter(error)) {
          handler(error);
        }
      } else if (typeof filter === 'string') {
        if (error.category === filter) {
          handler(error);
        }
      } else {
        handler(error);
      }
    };

    this.handlers.get(filterKey)!.add(wrappedHandler);

    return () => {
      this.handlers.get(filterKey)?.delete(wrappedHandler);
    };
  }

  /**
   * Subscribe to critical errors only
   */
  subscribeCritical(handler: ErrorHandler): () => void {
    return this.subscribe(handler, (error) => error.severity === 'critical');
  }

  /**
   * Get error history
   */
  getHistory(filter?: ErrorFilter): readonly AppError[] {
    if (filter) {
      return this.history.filter(filter);
    }
    return [...this.history];
  }

  /**
   * Get recent errors within the time window
   */
  getRecentErrors(): readonly AppError[] {
    const cutoff = Date.now() - this.recentErrorWindow;
    return this.history.filter((e) => e.timestamp > cutoff);
  }

  /**
   * Get error statistics
   */
  getStats(): ErrorStats {
    return { ...this.stats };
  }

  /**
   * Clear error history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalErrors: 0,
      errorsByCategory: {
        domain: 0,
        persistence: 0,
        simulation: 0,
        ui: 0,
        network: 0,
      },
      errorsBySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
      recentErrors: 0,
      lastError: null,
    };
    this.recentErrorTimestamps = [];
  }

  /**
   * Update configuration
   */
  configure(config: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get user-friendly message for an error
   */
  getUserMessage(error: AppError): string {
    return getUserFriendlyMessage(error);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private updateStats(error: AppError): void {
    this.stats.totalErrors++;
    this.stats.errorsByCategory[error.category]++;
    this.stats.errorsBySeverity[error.severity]++;
    this.stats.lastError = error;

    // Update recent error count
    const now = Date.now();
    this.recentErrorTimestamps.push(now);
    const cutoff = now - this.recentErrorWindow;
    this.recentErrorTimestamps = this.recentErrorTimestamps.filter((t) => t > cutoff);
    this.stats.recentErrors = this.recentErrorTimestamps.length;
  }

  private logError(error: AppError): void {
    if (!this.config.consoleEnabled) return;
    if (!this.shouldLog(error.severity)) return;

    const message = this.config.verbose
      ? formatErrorForLog(error)
      : `[${error.category}] ${error.code}: ${error.message}`;

    switch (error.severity) {
      case 'critical':
        console.error('🚨 CRITICAL:', message);
        break;
      case 'high':
        console.error('❌ ERROR:', message);
        break;
      case 'medium':
        console.warn('⚠️ WARNING:', message);
        break;
      case 'low':
        if (this.config.verbose) {
          console.info('ℹ️ INFO:', message);
        }
        break;
    }

    if (this.config.verbose && error.stack) {
      console.debug('Stack trace:', error.stack);
    }

    if (this.config.verbose && error.context) {
      console.debug('Context:', error.context);
    }
  }

  private shouldLog(severity: ErrorSeverity): boolean {
    const severityOrder: ErrorSeverity[] = ['low', 'medium', 'high', 'critical'];
    const minIndex = severityOrder.indexOf(this.config.minSeverity);
    const errorIndex = severityOrder.indexOf(severity);
    return errorIndex >= minIndex;
  }

  private notifyHandlers(error: AppError): void {
    // Notify category-specific handlers
    const categoryHandlers = this.handlers.get(error.category);
    if (categoryHandlers) {
      for (const handler of categoryHandlers) {
        try {
          handler(error);
        } catch (e) {
          console.error('Error in error handler:', e);
        }
      }
    }

    // Notify wildcard handlers
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        try {
          handler(error);
        } catch (e) {
          console.error('Error in error handler:', e);
        }
      }
    }
  }
}

// ============================================================================
// Global Instance and Helpers
// ============================================================================

/**
 * Global error bus instance
 */
export const errorBus = new ErrorBus();

/**
 * Report an error to the global bus
 */
export function reportError(error: AppError): void {
  errorBus.report(error);
}

/**
 * Report a native error to the global bus
 */
export function reportNativeError(
  error: Error,
  category: ErrorCategory = 'domain',
  severity: ErrorSeverity = 'medium'
): void {
  errorBus.reportNative(error, category, severity);
}

/**
 * Try/catch wrapper that reports errors
 */
export function tryCatch<T>(
  fn: () => T,
  category: ErrorCategory = 'domain',
  severity: ErrorSeverity = 'medium'
): T | undefined {
  try {
    return fn();
  } catch (error) {
    if (error instanceof Error) {
      reportNativeError(error, category, severity);
    }
    return undefined;
  }
}

/**
 * Async try/catch wrapper that reports errors
 */
export async function tryCatchAsync<T>(
  fn: () => Promise<T>,
  category: ErrorCategory = 'domain',
  severity: ErrorSeverity = 'medium'
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof Error) {
      reportNativeError(error, category, severity);
    }
    return undefined;
  }
}

/**
 * Creates an error boundary handler for React components
 */
export function createComponentErrorHandler(componentName: string): (error: Error) => void {
  return (error: Error) => {
    // Import dynamically to avoid circular dependency
    import('../../domain/errors').then(({ uiError }) => {
      errorBus.report(
        uiError('COMPONENT_CRASHED', `Component ${componentName} crashed: ${error.message}`, {
          componentName,
          originalError: error,
          severity: 'high',
        })
      );
    });
  };
}
