/**
 * Infrastructure Errors Index
 * Exports error handling utilities
 */

export {
  // ErrorBus
  ErrorBus,
  errorBus,
  
  // Types
  type ErrorHandler,
  type ErrorFilter,
  type LoggingConfig,
  type ErrorStats,
  
  // Helper functions
  reportError,
  reportNativeError,
  tryCatch,
  tryCatchAsync,
  createComponentErrorHandler,
} from './ErrorBus';
