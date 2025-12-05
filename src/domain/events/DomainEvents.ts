import { EntityId } from '../shared';

/**
 * Base interface for all domain events
 * Events are immutable records of something that happened in the domain
 */
export interface DomainEvent {
  readonly type: string;
  readonly timestamp: number;      // Game tick when event occurred
  readonly aggregateId: EntityId;  // ID of the entity this event relates to
  readonly payload: Record<string, unknown>;
}

/**
 * Event types for the game simulation
 */
export type GameEventType =
  // Company events
  | 'COMPANY_FOUNDED'
  | 'COMPANY_FUNDS_CHANGED'
  | 'COMPANY_REPUTATION_CHANGED'
  | 'COMPANY_BANKRUPT'
  // Employee events
  | 'EMPLOYEE_HIRED'
  | 'EMPLOYEE_FIRED'
  | 'EMPLOYEE_PROMOTED'
  | 'EMPLOYEE_MORALE_CHANGED'
  // Game development events
  | 'GAME_PROJECT_STARTED'
  | 'GAME_MILESTONE_REACHED'
  | 'GAME_LAUNCHED'
  | 'GAME_SHUTDOWN'
  // Gacha events
  | 'BANNER_CREATED'
  | 'BANNER_EXPIRED'
  | 'GACHA_RATES_UPDATED'
  // Market events
  | 'MARKET_TREND_CHANGED'
  | 'COMPETITOR_ACTION'
  | 'PLAYER_SENTIMENT_CHANGED';

/**
 * Company founded event
 */
export interface CompanyFoundedEvent extends DomainEvent {
  type: 'COMPANY_FOUNDED';
  payload: {
    name: string;
    headquarters: string;
    initialFunds: number;
  };
}

/**
 * Employee hired event
 */
export interface EmployeeHiredEvent extends DomainEvent {
  type: 'EMPLOYEE_HIRED';
  payload: {
    employeeId: string;
    name: string;
    salary: number;
    primarySkill: string;
  };
}

/**
 * Game launched event
 */
export interface GameLaunchedEvent extends DomainEvent {
  type: 'GAME_LAUNCHED';
  payload: {
    gameId: string;
    name: string;
    genre: string;
    qualityScore: number;
  };
}

/**
 * Market trend changed event
 */
export interface MarketTrendChangedEvent extends DomainEvent {
  type: 'MARKET_TREND_CHANGED';
  payload: {
    previousTrend: string;
    newTrend: string;
    affectedGenres: string[];
  };
}

/**
 * Event handler function type
 */
export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => void;

/**
 * Event bus interface for publishing and subscribing to domain events
 */
export interface IEventBus {
  publish(event: DomainEvent): void;
  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): () => void;
  getHistory(): readonly DomainEvent[];
  clearHistory(): void;
}

/**
 * Creates a domain event with common fields
 */
export function createEvent<T extends DomainEvent>(
  type: T['type'],
  aggregateId: EntityId,
  payload: T['payload'],
  timestamp: number
): T {
  return {
    type,
    timestamp,
    aggregateId,
    payload,
  } as T;
}
