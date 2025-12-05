/**
 * Result type for operations that can fail
 * Follows functional programming patterns for error handling
 */
export type Result<T, E = string> = 
  | { success: true; value: T }
  | { success: false; error: E };

/**
 * Option type for values that may or may not exist
 */
export type Option<T> = 
  | { some: true; value: T }
  | { some: false };

/**
 * Creates a successful result
 */
export function ok<T>(value: T): Result<T, never> {
  return { success: true, value };
}

/**
 * Creates a failed result
 */
export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Creates a Some option
 */
export function some<T>(value: T): Option<T> {
  return { some: true, value };
}

/**
 * Creates a None option
 */
export function none<T>(): Option<T> {
  return { some: false };
}

/**
 * Maps a Result value if successful
 */
export function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (result.success) {
    return ok(fn(result.value));
  }
  return result;
}

/**
 * Chains Result operations
 */
export function flatMapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (result.success) {
    return fn(result.value);
  }
  return result;
}

/**
 * Unwraps a Result or throws
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.success) {
    return result.value;
  }
  throw new Error('Attempted to unwrap an error Result: ' + String(result.error));
}

/**
 * Unwraps a Result with a default value
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.success) {
    return result.value;
  }
  return defaultValue;
}

/**
 * Type guard to check if Option is Some
 */
export function isSome<T>(option: Option<T>): option is { some: true; value: T } {
  return option.some === true;
}

/**
 * Type guard to check if Option is None
 */
export function isNone<T>(option: Option<T>): option is { some: false } {
  return option.some === false;
}

/**
 * Maps an Option value if Some
 */
export function mapOption<T, U>(option: Option<T>, fn: (value: T) => U): Option<U> {
  if (option.some) {
    return some(fn(option.value));
  }
  return none();
}

/**
 * Unwraps an Option or throws
 */
export function unwrapOption<T>(option: Option<T>): T {
  if (option.some) {
    return option.value;
  }
  throw new Error('Attempted to unwrap a None Option');
}

/**
 * Unwraps an Option with a default value
 */
export function unwrapOptionOr<T>(option: Option<T>, defaultValue: T): T {
  if (option.some) {
    return option.value;
  }
  return defaultValue;
}
