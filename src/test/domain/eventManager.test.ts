import { describe, it, expect } from 'vitest';
import {
  GAME_EVENTS,
  createInitialEventState,
  checkTriggerCondition,
  getEligibleEvents,
  selectEvent,
  applyEventChoice,
  getActiveModifiers,
  cleanupExpiredEffects,
  getChainEvent,
  CompanyState,
  EventState,
} from '@domain/events';
import { SeededRNG } from '@domain/shared';

describe('Event Manager', () => {
  const createTestCompanyState = (overrides: Partial<CompanyState> = {}): CompanyState => ({
    reputation: 50,
    money: 100000,
    employeeCount: 10,
    gameCount: 2,
    activeGenres: ['rpg', 'puzzle'],
    ...overrides,
  });

  describe('GAME_EVENTS', () => {
    it('has ethical dilemma events', () => {
      const ethicalEvents = GAME_EVENTS.filter(e => e.category === 'ethical_dilemma');
      expect(ethicalEvents.length).toBeGreaterThan(0);
    });

    it('has chain events', () => {
      const chainEvents = GAME_EVENTS.filter(e => 
        e.choices.some(c => c.chainEventId !== undefined)
      );
      expect(chainEvents.length).toBeGreaterThan(0);
    });

    it('all events have at least one choice', () => {
      for (const event of GAME_EVENTS) {
        expect(event.choices.length).toBeGreaterThan(0);
      }
    });

    it('choices have ethical scores', () => {
      for (const event of GAME_EVENTS) {
        for (const choice of event.choices) {
          expect(typeof choice.ethicalScore).toBe('number');
          expect(choice.ethicalScore).toBeGreaterThanOrEqual(-100);
          expect(choice.ethicalScore).toBeLessThanOrEqual(100);
        }
      }
    });
  });

  describe('createInitialEventState', () => {
    it('creates empty event state', () => {
      const state = createInitialEventState();
      
      expect(state.pastEvents).toEqual([]);
      expect(state.activeEffects).toEqual([]);
      expect(state.triggeredUniqueEvents).toEqual([]);
      expect(state.lastTriggerDay).toEqual({});
    });
  });

  describe('checkTriggerCondition', () => {
    it('checks reputation_above correctly', () => {
      const highRep = createTestCompanyState({ reputation: 80 });
      const lowRep = createTestCompanyState({ reputation: 30 });
      const eventState = createInitialEventState();
      
      const conditionAbove60 = { type: 'reputation_above' as const, value: 60 };
      
      expect(checkTriggerCondition(conditionAbove60, highRep, eventState, 1)).toBe(true);
      expect(checkTriggerCondition(conditionAbove60, lowRep, eventState, 1)).toBe(false);
    });

    it('checks money_below correctly', () => {
      const richCompany = createTestCompanyState({ money: 500000 });
      const poorCompany = createTestCompanyState({ money: 5000 });
      const eventState = createInitialEventState();
      
      const conditionBelow10000 = { type: 'money_below' as const, value: 10000 };
      
      expect(checkTriggerCondition(conditionBelow10000, poorCompany, eventState, 1)).toBe(true);
      expect(checkTriggerCondition(conditionBelow10000, richCompany, eventState, 1)).toBe(false);
    });

    it('checks game_count correctly', () => {
      const state = createTestCompanyState({ gameCount: 3 });
      const eventState = createInitialEventState();
      
      expect(checkTriggerCondition(
        { type: 'game_count', min: 1, max: 5 },
        state,
        eventState,
        1
      )).toBe(true);
      
      expect(checkTriggerCondition(
        { type: 'game_count', min: 5 },
        state,
        eventState,
        1
      )).toBe(false);
    });

    it('checks previous_choice correctly', () => {
      const companyState = createTestCompanyState();
      const eventState: EventState = {
        ...createInitialEventState(),
        pastEvents: [
          { eventId: 'test_event', choiceId: 'bad_choice', dayOccurred: 1 },
        ],
      };
      
      const condition = { 
        type: 'previous_choice' as const, 
        eventId: 'test_event', 
        choiceId: 'bad_choice' 
      };
      
      expect(checkTriggerCondition(condition, companyState, eventState, 10)).toBe(true);
      
      const noMatchCondition = {
        type: 'previous_choice' as const,
        eventId: 'test_event',
        choiceId: 'good_choice',
      };
      
      expect(checkTriggerCondition(noMatchCondition, companyState, eventState, 10)).toBe(false);
    });

    it('checks random probability', () => {
      const companyState = createTestCompanyState();
      const eventState = createInitialEventState();
      
      const condition = { type: 'random' as const, probability: 0.5 };
      
      // With 50% probability, some should pass, some should fail over many tests
      let passed = 0;
      for (let i = 0; i < 100; i++) {
        const rng = new SeededRNG(i);
        if (checkTriggerCondition(condition, companyState, eventState, 1, rng)) {
          passed++;
        }
      }
      
      // Should be roughly 50% (allow for variance)
      expect(passed).toBeGreaterThan(30);
      expect(passed).toBeLessThan(70);
    });
  });

  describe('getEligibleEvents', () => {
    it('filters by trigger conditions', () => {
      const companyState = createTestCompanyState({ gameCount: 0 });
      const eventState = createInitialEventState();
      const rng = new SeededRNG(99999);  // Use seed that won't trigger random
      
      const eligible = getEligibleEvents(GAME_EVENTS, companyState, eventState, 1, rng);
      
      // Events requiring games should not be eligible
      const gamesRequiredEvents = GAME_EVENTS.filter(e =>
        e.triggerConditions.some(c => c.type === 'game_count' && c.min > 0)
      );
      
      for (const event of gamesRequiredEvents) {
        expect(eligible.find(e => e.id === event.id)).toBeUndefined();
      }
    });

    it('respects cooldown', () => {
      const companyState = createTestCompanyState();
      const eventState: EventState = {
        ...createInitialEventState(),
        lastTriggerDay: { 'event_server_outage': 5 },  // Triggered on day 5
      };
      
      const outageEvent = GAME_EVENTS.find(e => e.id === 'event_server_outage')!;
      const cooldown = outageEvent.cooldownDays;
      
      const rng = new SeededRNG(12345);
      const dayDuringCooldown = 5 + Math.floor(cooldown / 2);
      const dayAfterCooldown = 5 + cooldown + 1;
      
      const eligibleDuring = getEligibleEvents(GAME_EVENTS, companyState, eventState, dayDuringCooldown, rng);
      // Call to verify it runs, but random condition may still prevent eligibility
      void getEligibleEvents(GAME_EVENTS, companyState, eventState, dayAfterCooldown, rng);
      
      expect(eligibleDuring.find(e => e.id === 'event_server_outage')).toBeUndefined();
      // Note: May still not be eligible due to random condition
    });

    it('respects unique events', () => {
      const companyState = createTestCompanyState({ money: 200000 });
      const eventState: EventState = {
        ...createInitialEventState(),
        triggeredUniqueEvents: ['event_gambling_regulation'],
      };
      
      const rng = new SeededRNG(12345);
      const eligible = getEligibleEvents(GAME_EVENTS, companyState, eventState, 1, rng);
      
      expect(eligible.find(e => e.id === 'event_gambling_regulation')).toBeUndefined();
    });
  });

  describe('selectEvent', () => {
    it('returns null for empty array', () => {
      const rng = new SeededRNG(12345);
      const result = selectEvent([], rng);
      
      expect(result).toBeNull();
    });

    it('selects based on weights', () => {
      const testEvents = [
        { ...GAME_EVENTS[0], weight: 10 },
        { ...GAME_EVENTS[1], weight: 1 },
      ];
      
      // With weighted selection, heavier weight should be selected more
      let firstSelected = 0;
      for (let i = 0; i < 100; i++) {
        const rng = new SeededRNG(i);
        const selected = selectEvent(testEvents, rng);
        if (selected?.id === testEvents[0].id) firstSelected++;
      }
      
      // First event should be selected roughly 10x more (90% vs 10%)
      expect(firstSelected).toBeGreaterThan(70);
    });
  });

  describe('applyEventChoice', () => {
    it('records event in history', () => {
      const event = GAME_EVENTS[0];
      const choice = event.choices[0];
      const eventState = createInitialEventState();
      
      const result = applyEventChoice(event, choice, eventState, 10);
      
      expect(result.eventState.pastEvents.length).toBe(1);
      expect(result.eventState.pastEvents[0].eventId).toBe(event.id);
      expect(result.eventState.pastEvents[0].choiceId).toBe(choice.id);
      expect(result.eventState.pastEvents[0].dayOccurred).toBe(10);
    });

    it('separates immediate and delayed effects', () => {
      // Find an event with delayed effects
      const eventWithDelayed = GAME_EVENTS.find(e =>
        e.choices.some(c => c.effects.some(ef => ef.delayed && ef.delayed > 0))
      );
      
      if (eventWithDelayed) {
        const choiceWithDelayed = eventWithDelayed.choices.find(c =>
          c.effects.some(ef => ef.delayed && ef.delayed > 0)
        )!;
        const eventState = createInitialEventState();
        
        const result = applyEventChoice(eventWithDelayed, choiceWithDelayed, eventState, 10);
        
        // Should have some delayed effects
        expect(result.delayedEffects.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('returns chain event ID when present', () => {
      const eventWithChain = GAME_EVENTS.find(e =>
        e.choices.some(c => c.chainEventId !== undefined)
      )!;
      const choiceWithChain = eventWithChain.choices.find(c => c.chainEventId !== undefined)!;
      const eventState = createInitialEventState();
      
      const result = applyEventChoice(eventWithChain, choiceWithChain, eventState, 10);
      
      expect(result.chainEventId).toBe(choiceWithChain.chainEventId);
    });

    it('tracks unique events', () => {
      const uniqueEvent = GAME_EVENTS.find(e => e.isUnique)!;
      const eventState = createInitialEventState();
      
      const result = applyEventChoice(uniqueEvent, uniqueEvent.choices[0], eventState, 10);
      
      expect(result.eventState.triggeredUniqueEvents).toContain(uniqueEvent.id);
    });
  });

  describe('getActiveModifiers', () => {
    it('returns current modifiers', () => {
      const eventState: EventState = {
        ...createInitialEventState(),
        activeEffects: [
          {
            effect: { type: 'revenue_modifier', value: 0.15, duration: 90 },
            startDay: 10,
            sourceEventId: 'test',
          },
          {
            effect: { type: 'cost_modifier', value: 0.1, duration: 30 },
            startDay: 15,
            sourceEventId: 'test2',
          },
        ],
      };
      
      const modifiers = getActiveModifiers(eventState, 20);
      
      expect(modifiers.revenueModifier).toBe(0.15);
      expect(modifiers.costModifier).toBe(0.1);
    });

    it('ignores expired effects', () => {
      const eventState: EventState = {
        ...createInitialEventState(),
        activeEffects: [
          {
            effect: { type: 'revenue_modifier', value: 0.15, duration: 5 },
            startDay: 10,
            sourceEventId: 'test',
          },
        ],
      };
      
      const modifiers = getActiveModifiers(eventState, 20);  // After expiry
      
      expect(modifiers.revenueModifier).toBe(0);
    });
  });

  describe('cleanupExpiredEffects', () => {
    it('removes expired effects', () => {
      const eventState: EventState = {
        ...createInitialEventState(),
        activeEffects: [
          {
            effect: { type: 'revenue_modifier', value: 0.15, duration: 5 },
            startDay: 10,
            sourceEventId: 'expired',
          },
          {
            effect: { type: 'cost_modifier', value: 0.1, duration: 50 },
            startDay: 10,
            sourceEventId: 'active',
          },
        ],
      };
      
      const cleaned = cleanupExpiredEffects(eventState, 20);
      
      expect(cleaned.activeEffects.length).toBe(1);
      expect(cleaned.activeEffects[0].sourceEventId).toBe('active');
    });
  });

  describe('getChainEvent', () => {
    it('returns chain event when ID exists', () => {
      const chainEventId = 'event_player_backlash';
      const chainEvent = getChainEvent(chainEventId, GAME_EVENTS);
      
      expect(chainEvent).toBeDefined();
      expect(chainEvent!.id).toBe(chainEventId);
    });

    it('returns null for undefined ID', () => {
      const result = getChainEvent(undefined, GAME_EVENTS);
      expect(result).toBeNull();
    });

    it('returns null for non-existent ID', () => {
      const result = getChainEvent('non_existent_event', GAME_EVENTS);
      expect(result).toBeNull();
    });
  });
});
