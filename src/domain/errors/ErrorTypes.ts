/**
 * Error Types - Categorized error system for the Gacha Game Company Simulator
 * Provides structured error handling with categories and severity levels
 */

// ============================================================================
// Base Error Types
// ============================================================================

/**
 * Severity levels for errors
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error categories for classification
 */
export type ErrorCategory = 'domain' | 'persistence' | 'simulation' | 'ui' | 'network';

/**
 * Base error interface for all application errors
 */
export interface AppError {
  readonly code: string;
  readonly message: string;
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly timestamp: number;
  readonly context?: Record<string, unknown>;
  readonly stack?: string;
  readonly recoverable: boolean;
}

/**
 * Creates a base error object
 */
export function createError(
  code: string,
  message: string,
  category: ErrorCategory,
  severity: ErrorSeverity,
  options: {
    context?: Record<string, unknown>;
    recoverable?: boolean;
    originalError?: Error;
  } = {}
): AppError {
  return {
    code,
    message,
    category,
    severity,
    timestamp: Date.now(),
    context: options.context,
    stack: options.originalError?.stack,
    recoverable: options.recoverable ?? severity !== 'critical',
  };
}

// ============================================================================
// Domain Errors
// ============================================================================

/**
 * Domain-specific error codes
 */
export type DomainErrorCode =
  | 'INVALID_GAME_STATE'
  | 'INSUFFICIENT_FUNDS'
  | 'INSUFFICIENT_RESOURCES'
  | 'INVALID_OPERATION'
  | 'CONSTRAINT_VIOLATION'
  | 'ENTITY_NOT_FOUND'
  | 'DUPLICATE_ENTITY'
  | 'VALIDATION_FAILED'
  | 'BUSINESS_RULE_VIOLATION'
  | 'GACHA_ROLL_FAILED'
  | 'DEVELOPMENT_FAILED'
  | 'EMPLOYEE_ERROR'
  | 'RESEARCH_ERROR'
  | 'PRESTIGE_ERROR';

/**
 * Domain error type
 */
export interface DomainError extends AppError {
  readonly category: 'domain';
  readonly code: DomainErrorCode;
  readonly entityId?: string;
  readonly entityType?: string;
}

/**
 * Creates a domain error
 */
export function domainError(
  code: DomainErrorCode,
  message: string,
  options: {
    severity?: ErrorSeverity;
    context?: Record<string, unknown>;
    entityId?: string;
    entityType?: string;
    recoverable?: boolean;
  } = {}
): DomainError {
  return {
    ...createError(code, message, 'domain', options.severity ?? 'medium', {
      context: options.context,
      recoverable: options.recoverable,
    }),
    category: 'domain',
    code,
    entityId: options.entityId,
    entityType: options.entityType,
  } as DomainError;
}

// ============================================================================
// Persistence Errors
// ============================================================================

/**
 * Persistence-specific error codes
 */
export type PersistenceErrorCode =
  | 'SAVE_FAILED'
  | 'LOAD_FAILED'
  | 'STORAGE_FULL'
  | 'STORAGE_UNAVAILABLE'
  | 'CORRUPTION_DETECTED'
  | 'VERSION_MISMATCH'
  | 'MIGRATION_FAILED'
  | 'EXPORT_FAILED'
  | 'IMPORT_FAILED'
  | 'BACKUP_FAILED'
  | 'QUOTA_EXCEEDED';

/**
 * Persistence error type
 */
export interface PersistenceError extends AppError {
  readonly category: 'persistence';
  readonly code: PersistenceErrorCode;
  readonly storageType?: 'localStorage' | 'indexedDB' | 'file';
  readonly dataSize?: number;
}

/**
 * Creates a persistence error
 */
export function persistenceError(
  code: PersistenceErrorCode,
  message: string,
  options: {
    severity?: ErrorSeverity;
    context?: Record<string, unknown>;
    storageType?: 'localStorage' | 'indexedDB' | 'file';
    dataSize?: number;
    originalError?: Error;
    recoverable?: boolean;
  } = {}
): PersistenceError {
  return {
    ...createError(code, message, 'persistence', options.severity ?? 'high', {
      context: options.context,
      originalError: options.originalError,
      recoverable: options.recoverable,
    }),
    category: 'persistence',
    code,
    storageType: options.storageType,
    dataSize: options.dataSize,
  } as PersistenceError;
}

// ============================================================================
// Simulation Errors
// ============================================================================

/**
 * Simulation-specific error codes
 */
export type SimulationErrorCode =
  | 'TICK_OVERFLOW'
  | 'INFINITE_LOOP_DETECTED'
  | 'STATE_DESYNC'
  | 'WORKER_CRASHED'
  | 'WORKER_TIMEOUT'
  | 'BATCH_PROCESSING_FAILED'
  | 'SCHEDULER_ERROR'
  | 'PERFORMANCE_DEGRADATION'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'CALCULATION_ERROR';

/**
 * Simulation error type
 */
export interface SimulationError extends AppError {
  readonly category: 'simulation';
  readonly code: SimulationErrorCode;
  readonly tickNumber?: number;
  readonly batchSize?: number;
  readonly performanceMetrics?: {
    tickDuration?: number;
    memoryUsage?: number;
    queueSize?: number;
  };
}

/**
 * Creates a simulation error
 */
export function simulationError(
  code: SimulationErrorCode,
  message: string,
  options: {
    severity?: ErrorSeverity;
    context?: Record<string, unknown>;
    tickNumber?: number;
    batchSize?: number;
    performanceMetrics?: SimulationError['performanceMetrics'];
    originalError?: Error;
    recoverable?: boolean;
  } = {}
): SimulationError {
  return {
    ...createError(code, message, 'simulation', options.severity ?? 'high', {
      context: options.context,
      originalError: options.originalError,
      recoverable: options.recoverable,
    }),
    category: 'simulation',
    code,
    tickNumber: options.tickNumber,
    batchSize: options.batchSize,
    performanceMetrics: options.performanceMetrics,
  } as SimulationError;
}

// ============================================================================
// UI Errors
// ============================================================================

/**
 * UI-specific error codes
 */
export type UIErrorCode =
  | 'RENDER_FAILED'
  | 'STATE_SYNC_FAILED'
  | 'COMPONENT_CRASHED'
  | 'ANIMATION_FAILED'
  | 'INPUT_VALIDATION_FAILED'
  | 'NAVIGATION_FAILED'
  | 'MODAL_ERROR'
  | 'NOTIFICATION_FAILED'
  | 'THEME_ERROR'
  | 'ACCESSIBILITY_ERROR';

/**
 * UI error type
 */
export interface UIError extends AppError {
  readonly category: 'ui';
  readonly code: UIErrorCode;
  readonly componentName?: string;
  readonly viewId?: string;
}

/**
 * Creates a UI error
 */
export function uiError(
  code: UIErrorCode,
  message: string,
  options: {
    severity?: ErrorSeverity;
    context?: Record<string, unknown>;
    componentName?: string;
    viewId?: string;
    originalError?: Error;
    recoverable?: boolean;
  } = {}
): UIError {
  return {
    ...createError(code, message, 'ui', options.severity ?? 'low', {
      context: options.context,
      originalError: options.originalError,
      recoverable: options.recoverable,
    }),
    category: 'ui',
    code,
    componentName: options.componentName,
    viewId: options.viewId,
  } as UIError;
}

// ============================================================================
// Error Type Guards
// ============================================================================

/**
 * Type guard for domain errors
 */
export function isDomainError(error: AppError): error is DomainError {
  return error.category === 'domain';
}

/**
 * Type guard for persistence errors
 */
export function isPersistenceError(error: AppError): error is PersistenceError {
  return error.category === 'persistence';
}

/**
 * Type guard for simulation errors
 */
export function isSimulationError(error: AppError): error is SimulationError {
  return error.category === 'simulation';
}

/**
 * Type guard for UI errors
 */
export function isUIError(error: AppError): error is UIError {
  return error.category === 'ui';
}

// ============================================================================
// Error Utilities
// ============================================================================

/**
 * Wraps a native Error into an AppError
 */
export function wrapError(
  error: Error,
  category: ErrorCategory = 'domain',
  severity: ErrorSeverity = 'medium'
): AppError {
  return createError(
    'UNKNOWN_ERROR',
    error.message,
    category,
    severity,
    {
      originalError: error,
      context: { name: error.name },
      recoverable: severity !== 'critical',
    }
  );
}

/**
 * Creates a user-friendly error message
 */
export function getUserFriendlyMessage(error: AppError): string {
  const messages: Record<ErrorCategory, Record<string, string>> = {
    domain: {
      INSUFFICIENT_FUNDS: 'You don\'t have enough money for this action.',
      INSUFFICIENT_RESOURCES: 'You don\'t have enough resources.',
      INVALID_OPERATION: 'This action cannot be performed right now.',
      ENTITY_NOT_FOUND: 'The requested item was not found.',
      GACHA_ROLL_FAILED: 'The gacha roll failed. Please try again.',
      default: 'An error occurred. Please try again.',
    },
    persistence: {
      SAVE_FAILED: 'Failed to save your game. Please try again.',
      LOAD_FAILED: 'Failed to load your game. The save may be corrupted.',
      STORAGE_FULL: 'Storage is full. Please clear some space.',
      CORRUPTION_DETECTED: 'Save data corruption detected.',
      default: 'A save/load error occurred.',
    },
    simulation: {
      WORKER_CRASHED: 'The simulation encountered an error. Restarting...',
      PERFORMANCE_DEGRADATION: 'Game performance is degraded. Try reducing speed.',
      default: 'A simulation error occurred.',
    },
    ui: {
      RENDER_FAILED: 'Failed to display this content.',
      COMPONENT_CRASHED: 'A UI component crashed. Please refresh.',
      default: 'A display error occurred.',
    },
    network: {
      default: 'A network error occurred. Please check your connection.',
    },
  };

  const categoryMessages = messages[error.category];
  return categoryMessages[error.code] ?? categoryMessages['default'];
}

/**
 * Formats error for logging
 */
export function formatErrorForLog(error: AppError): string {
  const parts = [
    `[${error.severity.toUpperCase()}]`,
    `[${error.category}]`,
    `${error.code}: ${error.message}`,
  ];
  
  if (error.context) {
    parts.push(`Context: ${JSON.stringify(error.context)}`);
  }
  
  if (error.stack) {
    parts.push(`Stack: ${error.stack}`);
  }
  
  return parts.join(' ');
}
