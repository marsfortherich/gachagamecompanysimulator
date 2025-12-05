import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from '../../infrastructure/events';
import { DomainEvent } from '../../domain/events';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  describe('publish and subscribe', () => {
    it('should notify subscribers when event is published', () => {
      const handler = vi.fn();
      eventBus.subscribe('TEST_EVENT', handler);

      const event: DomainEvent = {
        type: 'TEST_EVENT',
        timestamp: Date.now(),
        aggregateId: 'test-123',
        payload: { data: 'test' },
      };

      eventBus.publish(event);

      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should not notify unsubscribed handlers', () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.subscribe('TEST_EVENT', handler);

      unsubscribe();

      const event: DomainEvent = {
        type: 'TEST_EVENT',
        timestamp: Date.now(),
        aggregateId: 'test-123',
        payload: {},
      };

      eventBus.publish(event);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should only notify handlers for matching event type', () => {
      const handlerA = vi.fn();
      const handlerB = vi.fn();

      eventBus.subscribe('EVENT_A', handlerA);
      eventBus.subscribe('EVENT_B', handlerB);

      const eventA: DomainEvent = {
        type: 'EVENT_A',
        timestamp: Date.now(),
        aggregateId: 'test-123',
        payload: {},
      };

      eventBus.publish(eventA);

      expect(handlerA).toHaveBeenCalled();
      expect(handlerB).not.toHaveBeenCalled();
    });

    it('should notify wildcard handlers for all events', () => {
      const wildcardHandler = vi.fn();
      eventBus.subscribe('*', wildcardHandler);

      const eventA: DomainEvent = {
        type: 'EVENT_A',
        timestamp: Date.now(),
        aggregateId: 'test-123',
        payload: {},
      };

      const eventB: DomainEvent = {
        type: 'EVENT_B',
        timestamp: Date.now(),
        aggregateId: 'test-456',
        payload: {},
      };

      eventBus.publish(eventA);
      eventBus.publish(eventB);

      expect(wildcardHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe('history', () => {
    it('should store published events in history', () => {
      const event: DomainEvent = {
        type: 'TEST_EVENT',
        timestamp: Date.now(),
        aggregateId: 'test-123',
        payload: { data: 'test' },
      };

      eventBus.publish(event);

      const history = eventBus.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(event);
    });

    it('should clear history', () => {
      const event: DomainEvent = {
        type: 'TEST_EVENT',
        timestamp: Date.now(),
        aggregateId: 'test-123',
        payload: {},
      };

      eventBus.publish(event);
      eventBus.clearHistory();

      expect(eventBus.getHistory()).toHaveLength(0);
    });

    it('should filter events by type', () => {
      const eventA: DomainEvent = {
        type: 'EVENT_A',
        timestamp: Date.now(),
        aggregateId: 'test-123',
        payload: {},
      };

      const eventB: DomainEvent = {
        type: 'EVENT_B',
        timestamp: Date.now(),
        aggregateId: 'test-456',
        payload: {},
      };

      eventBus.publish(eventA);
      eventBus.publish(eventB);
      eventBus.publish(eventA);

      const typeAEvents = eventBus.getEventsByType('EVENT_A');
      expect(typeAEvents).toHaveLength(2);
    });

    it('should filter events by aggregate', () => {
      const event1: DomainEvent = {
        type: 'EVENT_A',
        timestamp: Date.now(),
        aggregateId: 'aggregate-1',
        payload: {},
      };

      const event2: DomainEvent = {
        type: 'EVENT_B',
        timestamp: Date.now(),
        aggregateId: 'aggregate-2',
        payload: {},
      };

      eventBus.publish(event1);
      eventBus.publish(event2);
      eventBus.publish(event1);

      const aggregate1Events = eventBus.getEventsByAggregate('aggregate-1');
      expect(aggregate1Events).toHaveLength(2);
    });
  });
});
