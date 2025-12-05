/**
 * Branded Types - Prompt 6.2
 * 
 * Provides compile-time type safety for entity IDs and other types
 * that are represented as strings/numbers at runtime but should be
 * distinct types at compile-time.
 */

// =============================================================================
// Brand Symbol
// =============================================================================

/**
 * Unique symbol used for branding types.
 * This ensures branded types cannot be accidentally mixed.
 */
declare const brand: unique symbol;

/**
 * Creates a branded type.
 * The branded type is a T with an additional phantom property.
 */
export type Brand<T, B extends string> = T & { readonly [brand]: B };

// =============================================================================
// Entity ID Types
// =============================================================================

/**
 * Employee ID - uniquely identifies an employee
 * @example const empId: EmployeeId = createEmployeeId();
 */
export type EmployeeId = Brand<string, 'EmployeeId'>;

/**
 * Game ID - uniquely identifies a game project
 * @example const gameId: GameId = createGameId();
 */
export type GameId = Brand<string, 'GameId'>;

/**
 * Company ID - uniquely identifies a company
 * @example const companyId: CompanyId = createCompanyId();
 */
export type CompanyId = Brand<string, 'CompanyId'>;

/**
 * Gacha Banner ID - uniquely identifies a gacha banner
 */
export type BannerId = Brand<string, 'BannerId'>;

/**
 * Gacha Pull ID - uniquely identifies a specific pull result
 */
export type PullId = Brand<string, 'PullId'>;

// =============================================================================
// Other Branded Types
// =============================================================================

/**
 * Currency amount - positive integer representing a single currency value
 * Note: This is distinct from the Currency interface which contains gems/gold/tickets
 */
export type CurrencyAmount = Brand<number, 'CurrencyAmount'>;

/**
 * Percentage - number between 0 and 100
 */
export type Percentage = Brand<number, 'Percentage'>;

/**
 * Game tick - represents a moment in game time
 */
export type GameTick = Brand<number, 'GameTick'>;

/**
 * Timestamp - Unix timestamp in milliseconds
 */
export type Timestamp = Brand<number, 'Timestamp'>;

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a new EmployeeId
 */
export function createEmployeeId(): EmployeeId {
  return crypto.randomUUID() as EmployeeId;
}

/**
 * Convert a string to EmployeeId (for deserialization)
 */
export function toEmployeeId(id: string): EmployeeId {
  return id as EmployeeId;
}

/**
 * Create a new GameId
 */
export function createGameId(): GameId {
  return crypto.randomUUID() as GameId;
}

/**
 * Convert a string to GameId (for deserialization)
 */
export function toGameId(id: string): GameId {
  return id as GameId;
}

/**
 * Create a new CompanyId
 */
export function createCompanyId(): CompanyId {
  return crypto.randomUUID() as CompanyId;
}

/**
 * Convert a string to CompanyId (for deserialization)
 */
export function toCompanyId(id: string): CompanyId {
  return id as CompanyId;
}

/**
 * Create a new BannerId
 */
export function createBannerId(): BannerId {
  return crypto.randomUUID() as BannerId;
}

/**
 * Convert a string to BannerId (for deserialization)
 */
export function toBannerId(id: string): BannerId {
  return id as BannerId;
}

/**
 * Create a new PullId
 */
export function createPullId(): PullId {
  return crypto.randomUUID() as PullId;
}

/**
 * Convert a string to PullId (for deserialization)
 */
export function toPullId(id: string): PullId {
  return id as PullId;
}

// =============================================================================
// Value Constructors with Validation
// =============================================================================

/**
 * Create a CurrencyAmount value (must be non-negative)
 */
export function createCurrencyAmount(amount: number): CurrencyAmount {
  if (amount < 0) {
    throw new Error('Currency cannot be negative');
  }
  return Math.floor(amount) as CurrencyAmount;
}

/**
 * Create a Percentage value (0-100)
 */
export function createPercentage(value: number): Percentage {
  if (value < 0 || value > 100) {
    throw new Error('Percentage must be between 0 and 100');
  }
  return value as Percentage;
}

/**
 * Create a GameTick (must be non-negative)
 */
export function createGameTick(tick: number): GameTick {
  if (tick < 0) {
    throw new Error('GameTick cannot be negative');
  }
  return Math.floor(tick) as GameTick;
}

/**
 * Create a Timestamp (current time if not provided)
 */
export function createTimestamp(ms?: number): Timestamp {
  return (ms ?? Date.now()) as Timestamp;
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if a value is a valid UUID format
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Safely parse a string as an EmployeeId
 */
export function parseEmployeeId(value: unknown): EmployeeId | null {
  if (typeof value === 'string' && isValidUUID(value)) {
    return value as EmployeeId;
  }
  return null;
}

/**
 * Safely parse a string as a GameId
 */
export function parseGameId(value: unknown): GameId | null {
  if (typeof value === 'string' && isValidUUID(value)) {
    return value as GameId;
  }
  return null;
}

/**
 * Safely parse a string as a CompanyId
 */
export function parseCompanyId(value: unknown): CompanyId | null {
  if (typeof value === 'string' && isValidUUID(value)) {
    return value as CompanyId;
  }
  return null;
}

// =============================================================================
// Unwrap Functions (for serialization)
// =============================================================================

/**
 * Unwrap a branded string to a plain string
 */
export function unwrapString<T extends string>(branded: Brand<T, string>): string {
  return branded as unknown as string;
}

/**
 * Unwrap a branded number to a plain number
 */
export function unwrapNumber<T extends number>(branded: Brand<T, string>): number {
  return branded as unknown as number;
}

// =============================================================================
// Migration Helpers
// =============================================================================

/**
 * Migrate an EntityId to EmployeeId
 * For gradual migration from unbranded to branded types
 */
export function migrateToEmployeeId(entityId: string): EmployeeId {
  return entityId as EmployeeId;
}

/**
 * Migrate an EntityId to GameId
 */
export function migrateToGameId(entityId: string): GameId {
  return entityId as GameId;
}

/**
 * Migrate an EntityId to CompanyId
 */
export function migrateToCompanyId(entityId: string): CompanyId {
  return entityId as CompanyId;
}
