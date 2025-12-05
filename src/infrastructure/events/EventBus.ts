import { DomainEvent, EventHandler, IEventBus } from '../../domain/events';

/**
 * In-memory implementation of the event bus
 * Provides pub/sub for domain events within the application
 */
export class EventBus implements IEventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private history: DomainEvent[] = [];
  private maxHistorySize = 1000;

  /**
   * Publish an event to all registered handlers
   */
  publish(event: DomainEvent): void {
    // Add to history
    this.history.push(event);
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }

    // Notify handlers
    const eventHandlers = this.handlers.get(event.type);
    if (eventHandlers) {
      for (const handler of eventHandlers) {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error);
        }
      }
    }

    // Also notify wildcard handlers (subscribed to '*')
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in wildcard event handler:`, error);
        }
      }
    }
  }

  /**
   * Subscribe to events of a specific type
   * Returns an unsubscribe function
   */
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    const handlers = this.handlers.get(eventType)!;
    handlers.add(handler as EventHandler);

    // Return unsubscribe function
    return () => {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    };
  }

  /**
   * Get the event history
   */
  getHistory(): readonly DomainEvent[] {
    return [...this.history];
  }

  /**
   * Clear the event history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Get events of a specific type from history
   */
  getEventsByType(type: string): readonly DomainEvent[] {
    return this.history.filter(e => e.type === type);
  }

  /**
   * Get events for a specific aggregate from history
   */
  getEventsByAggregate(aggregateId: string): readonly DomainEvent[] {
    return this.history.filter(e => e.aggregateId === aggregateId);
  }
}

/**
 * Singleton event bus instance
 */
export const eventBus = new EventBus();
