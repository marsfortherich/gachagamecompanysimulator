/**
 * Unique identifier type for domain entities
 */
export type EntityId = string;

/**
 * Base interface for all domain entities
 * Ensures every entity has a unique identifier
 */
export interface Entity {
  readonly id: EntityId;
}

/**
 * Generates a unique ID for entities
 */
export function generateId(): EntityId {
  return crypto.randomUUID();
}
