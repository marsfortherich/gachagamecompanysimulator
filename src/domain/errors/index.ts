/**
 * Domain Errors Index
 * Exports all error types and utilities
 */

export {
  // Base types
  type ErrorSeverity,
  type ErrorCategory,
  type AppError,
  createError,
  
  // Domain errors
  type DomainErrorCode,
  type DomainError,
  domainError,
  
  // Persistence errors
  type PersistenceErrorCode,
  type PersistenceError,
  persistenceError,
  
  // Simulation errors
  type SimulationErrorCode,
  type SimulationError,
  simulationError,
  
  // UI errors
  type UIErrorCode,
  type UIError,
  uiError,
  
  // Type guards
  isDomainError,
  isPersistenceError,
  isSimulationError,
  isUIError,
  
  // Utilities
  wrapError,
  getUserFriendlyMessage,
  formatErrorForLog,
} from './ErrorTypes';
