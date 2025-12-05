/**
 * Event System - JSON-driven events with ethical choices
 * Provides random events, ethical dilemmas, and chain event support
 */

import { Entity, IRNGProvider, defaultRNG } from '../shared';
import { GameGenre } from '../game';

// ============================================================================
// EVENT TYPES
// ============================================================================

export type EventCategory = 
  | 'random'
  | 'ethical_dilemma'
  | 'market'
  | 'employee'
  | 'regulatory'
  | 'viral'
  | 'disaster';

export type EventSeverity = 'minor' | 'moderate' | 'major' | 'critical';

export type TriggerCondition = 
  | { type: 'reputation_above'; value: number }
  | { type: 'reputation_below'; value: number }
  | { type: 'money_above'; value: number }
  | { type: 'money_below'; value: number }
  | { type: 'employee_count'; min: number; max?: number }
  | { type: 'game_count'; min: number; max?: number }
  | { type: 'genre_active'; genre: GameGenre }
  | { type: 'day_of_year'; day: number }
  | { type: 'random'; probability: number }
  | { type: 'previous_choice'; eventId: string; choiceId: string }
  | { type: 'never' };

// ============================================================================
// EVENT STRUCTURE
// ============================================================================

export interface EventChoice {
  readonly id: string;
  readonly text: string;
  readonly effects: EventEffect[];
  readonly ethicalScore: number;  // -100 to +100 (negative = unethical)
  readonly chainEventId?: string;  // Triggers follow-up event
  readonly requiredMoney?: number;  // Choice costs money
}

export interface EventEffect {
  readonly type: 'reputation' | 'money' | 'employee_morale' | 'player_count' | 'revenue_modifier' | 'cost_modifier';
  readonly value: number;
  readonly duration?: number;  // In game ticks (undefined = permanent)
  readonly delayed?: number;   // Ticks before effect applies
}

export interface GameEvent extends Entity {
  readonly title: string;
  readonly description: string;
  readonly category: EventCategory;
  readonly severity: EventSeverity;
  readonly choices: EventChoice[];
  readonly triggerConditions: TriggerCondition[];
  readonly cooldownDays: number;  // Min days before can trigger again
  readonly isUnique: boolean;     // Can only happen once
  readonly weight: number;        // Relative probability
}

// ============================================================================
// EVENT DEFINITIONS (JSON-style)
// ============================================================================

export const GAME_EVENTS: GameEvent[] = [
  // ETHICAL DILEMMAS
  {
    id: 'event_manipulative_monetization',
    title: 'Monetization Strategy Decision',
    description: 'Your analytics team has discovered that showing "limited time" offers right after a player loses creates 3x more purchases. They want to implement this feature.',
    category: 'ethical_dilemma',
    severity: 'major',
    choices: [
      {
        id: 'implement_dark_pattern',
        text: 'Implement the dark pattern - profits are profits',
        effects: [
          { type: 'money', value: 50000 },
          { type: 'reputation', value: -15 },
          { type: 'revenue_modifier', value: 0.15, duration: 90 },
        ],
        ethicalScore: -50,
        chainEventId: 'event_player_backlash',
      },
      {
        id: 'refuse_dark_pattern',
        text: 'Refuse - this is manipulative and wrong',
        effects: [
          { type: 'reputation', value: 5 },
          { type: 'employee_morale', value: 10 },
        ],
        ethicalScore: 50,
      },
      {
        id: 'compromise_timing',
        text: 'Compromise - show offers, but not after losses',
        effects: [
          { type: 'money', value: 20000 },
          { type: 'reputation', value: -3 },
          { type: 'revenue_modifier', value: 0.05, duration: 60 },
        ],
        ethicalScore: 0,
      },
    ],
    triggerConditions: [
      { type: 'game_count', min: 1 },
      { type: 'random', probability: 0.02 },
    ],
    cooldownDays: 180,
    isUnique: false,
    weight: 10,
  },
  {
    id: 'event_child_spending',
    title: 'Underage Spending Incident',
    description: 'A parent contacts you claiming their child spent $3,000 on your game using saved credit card info. They\'re threatening to go to the media.',
    category: 'ethical_dilemma',
    severity: 'critical',
    choices: [
      {
        id: 'full_refund',
        text: 'Issue a full refund and implement spending limits for new accounts',
        effects: [
          { type: 'money', value: -5000 },
          { type: 'reputation', value: 15 },
          { type: 'revenue_modifier', value: -0.03, duration: 90 },
        ],
        ethicalScore: 80,
        requiredMoney: 5000,
      },
      {
        id: 'partial_refund',
        text: 'Offer 50% refund as a "goodwill gesture"',
        effects: [
          { type: 'money', value: -1500 },
          { type: 'reputation', value: -5 },
        ],
        ethicalScore: 0,
        requiredMoney: 1500,
      },
      {
        id: 'refuse_refund',
        text: 'Refuse - their ToS agreed purchases are final',
        effects: [
          { type: 'reputation', value: -25, delayed: 7 },
        ],
        ethicalScore: -60,
        chainEventId: 'event_media_scandal',
      },
    ],
    triggerConditions: [
      { type: 'game_count', min: 1 },
      { type: 'random', probability: 0.01 },
    ],
    cooldownDays: 365,
    isUnique: false,
    weight: 5,
  },
  {
    id: 'event_gambling_regulation',
    title: 'Loot Box Regulation Incoming',
    description: 'New regulations requiring disclosure of gacha rates are coming. You can comply ahead of time, wait until required, or lobby against them.',
    category: 'regulatory',
    severity: 'major',
    choices: [
      {
        id: 'early_compliance',
        text: 'Comply early and publicly announce transparency commitment',
        effects: [
          { type: 'reputation', value: 20 },
          { type: 'money', value: -10000 },
          { type: 'revenue_modifier', value: -0.05, duration: 30 },
        ],
        ethicalScore: 60,
        requiredMoney: 10000,
      },
      {
        id: 'wait_compliance',
        text: 'Wait until regulations are mandatory',
        effects: [
          { type: 'money', value: -5000, delayed: 60 },
        ],
        ethicalScore: 0,
      },
      {
        id: 'lobby_against',
        text: 'Lobby against the regulations',
        effects: [
          { type: 'money', value: -50000 },
          { type: 'reputation', value: -10, delayed: 30 },
        ],
        ethicalScore: -40,
        requiredMoney: 50000,
        chainEventId: 'event_lobby_backfire',
      },
    ],
    triggerConditions: [
      { type: 'money_above', value: 100000 },
      { type: 'random', probability: 0.02 },
    ],
    cooldownDays: 365,
    isUnique: true,
    weight: 8,
  },
  
  // RANDOM EVENTS
  {
    id: 'event_viral_content',
    title: 'Viral Content Creator Coverage',
    description: 'A popular content creator with 5 million followers is featuring your game in a positive review. Player acquisition is spiking!',
    category: 'viral',
    severity: 'major',
    choices: [
      {
        id: 'gift_creator',
        text: 'Send the creator a gift package and in-game rewards',
        effects: [
          { type: 'player_count', value: 10000 },
          { type: 'reputation', value: 5 },
          { type: 'money', value: -2000 },
        ],
        ethicalScore: 30,
        requiredMoney: 2000,
      },
      {
        id: 'offer_sponsorship',
        text: 'Offer them a paid sponsorship deal',
        effects: [
          { type: 'player_count', value: 25000 },
          { type: 'money', value: -20000 },
        ],
        ethicalScore: 10,
        requiredMoney: 20000,
      },
      {
        id: 'do_nothing',
        text: 'Let the organic coverage play out naturally',
        effects: [
          { type: 'player_count', value: 5000 },
        ],
        ethicalScore: 20,
      },
    ],
    triggerConditions: [
      { type: 'game_count', min: 1 },
      { type: 'reputation_above', value: 50 },
      { type: 'random', probability: 0.015 },
    ],
    cooldownDays: 60,
    isUnique: false,
    weight: 10,
  },
  {
    id: 'event_server_outage',
    title: 'Critical Server Outage',
    description: 'Your game servers have been down for 4 hours during peak time. Players are furious and demanding compensation.',
    category: 'disaster',
    severity: 'critical',
    choices: [
      {
        id: 'generous_compensation',
        text: 'Give generous compensation (premium currency + rare items)',
        effects: [
          { type: 'money', value: -30000 },
          { type: 'reputation', value: 10 },
          { type: 'player_count', value: -500 },
        ],
        ethicalScore: 60,
        requiredMoney: 30000,
      },
      {
        id: 'minimal_compensation',
        text: 'Minimal compensation (small amount of in-game resources)',
        effects: [
          { type: 'money', value: -5000 },
          { type: 'reputation', value: -10 },
          { type: 'player_count', value: -2000 },
        ],
        ethicalScore: 10,
        requiredMoney: 5000,
      },
      {
        id: 'no_compensation',
        text: 'Just apologize, no compensation',
        effects: [
          { type: 'reputation', value: -20 },
          { type: 'player_count', value: -5000 },
        ],
        ethicalScore: -20,
      },
    ],
    triggerConditions: [
      { type: 'game_count', min: 1 },
      { type: 'random', probability: 0.01 },
    ],
    cooldownDays: 30,
    isUnique: false,
    weight: 8,
  },
  {
    id: 'event_employee_burnout',
    title: 'Team Burnout Crisis',
    description: 'After a crunch period, several key developers are showing signs of burnout. Team morale is at an all-time low.',
    category: 'employee',
    severity: 'major',
    choices: [
      {
        id: 'mandatory_vacation',
        text: 'Mandate a week off for the team (delays current project)',
        effects: [
          { type: 'employee_morale', value: 30 },
          { type: 'cost_modifier', value: 0.1, duration: 7 },
        ],
        ethicalScore: 70,
      },
      {
        id: 'bonuses',
        text: 'Offer retention bonuses to prevent people from leaving',
        effects: [
          { type: 'money', value: -25000 },
          { type: 'employee_morale', value: 15 },
        ],
        ethicalScore: 30,
        requiredMoney: 25000,
      },
      {
        id: 'ignore_burnout',
        text: 'Push through - the project is too important to slow down',
        effects: [
          { type: 'employee_morale', value: -20 },
        ],
        ethicalScore: -50,
        chainEventId: 'event_mass_resignation',
      },
    ],
    triggerConditions: [
      { type: 'employee_count', min: 5 },
      { type: 'random', probability: 0.02 },
    ],
    cooldownDays: 120,
    isUnique: false,
    weight: 12,
  },
  
  // CHAIN EVENTS (triggered by other events)
  {
    id: 'event_player_backlash',
    title: 'Community Backlash',
    description: 'Players have discovered your manipulative monetization tactics. Social media is flooded with negative posts.',
    category: 'market',
    severity: 'major',
    choices: [
      {
        id: 'apologize_remove',
        text: 'Apologize and remove the controversial feature',
        effects: [
          { type: 'reputation', value: 5 },
          { type: 'revenue_modifier', value: -0.1, duration: 30 },
        ],
        ethicalScore: 50,
      },
      {
        id: 'stay_silent',
        text: 'Stay silent and hope it blows over',
        effects: [
          { type: 'reputation', value: -10 },
          { type: 'player_count', value: -3000 },
        ],
        ethicalScore: -20,
      },
    ],
    triggerConditions: [
      { type: 'previous_choice', eventId: 'event_manipulative_monetization', choiceId: 'implement_dark_pattern' },
    ],
    cooldownDays: 0,
    isUnique: false,
    weight: 0,  // Only triggered by chain
  },
  {
    id: 'event_media_scandal',
    title: 'Media Scandal Erupts',
    description: 'The parent went to gaming media. Multiple outlets are running stories about your company\'s refusal to refund a child\'s purchases.',
    category: 'disaster',
    severity: 'critical',
    choices: [
      {
        id: 'full_reverse',
        text: 'Issue full refund, public apology, and new policies',
        effects: [
          { type: 'money', value: -10000 },
          { type: 'reputation', value: -15 },
        ],
        ethicalScore: 40,
        requiredMoney: 10000,
      },
      {
        id: 'stay_course',
        text: 'Stand by original decision',
        effects: [
          { type: 'reputation', value: -30 },
          { type: 'player_count', value: -8000 },
        ],
        ethicalScore: -50,
      },
    ],
    triggerConditions: [
      { type: 'previous_choice', eventId: 'event_child_spending', choiceId: 'refuse_refund' },
    ],
    cooldownDays: 0,
    isUnique: false,
    weight: 0,
  },
  {
    id: 'event_lobby_backfire',
    title: 'Lobbying Exposed',
    description: 'Your lobbying efforts against gacha regulation have been leaked to the press. The gaming community is outraged.',
    category: 'disaster',
    severity: 'critical',
    choices: [
      {
        id: 'reverse_stance',
        text: 'Publicly reverse stance and embrace transparency',
        effects: [
          { type: 'reputation', value: -5 },
          { type: 'money', value: -20000 },
        ],
        ethicalScore: 30,
        requiredMoney: 20000,
      },
      {
        id: 'double_down',
        text: 'Defend the lobbying as protecting player choice',
        effects: [
          { type: 'reputation', value: -25 },
          { type: 'player_count', value: -10000 },
        ],
        ethicalScore: -60,
      },
    ],
    triggerConditions: [
      { type: 'previous_choice', eventId: 'event_gambling_regulation', choiceId: 'lobby_against' },
    ],
    cooldownDays: 0,
    isUnique: false,
    weight: 0,
  },
  {
    id: 'event_mass_resignation',
    title: 'Key Developers Resign',
    description: 'Three of your senior developers have handed in their resignation, citing burnout and poor work-life balance.',
    category: 'employee',
    severity: 'critical',
    choices: [
      {
        id: 'counter_offer',
        text: 'Make generous counter-offers to retain them',
        effects: [
          { type: 'money', value: -50000 },
          { type: 'employee_morale', value: 10 },
        ],
        ethicalScore: 40,
        requiredMoney: 50000,
      },
      {
        id: 'let_go',
        text: 'Let them go and start hiring replacements',
        effects: [
          { type: 'money', value: -20000 },
          { type: 'employee_morale', value: -15 },
          { type: 'cost_modifier', value: 0.2, duration: 60 },
        ],
        ethicalScore: 0,
        requiredMoney: 20000,
      },
    ],
    triggerConditions: [
      { type: 'previous_choice', eventId: 'event_employee_burnout', choiceId: 'ignore_burnout' },
    ],
    cooldownDays: 0,
    isUnique: false,
    weight: 0,
  },
];

// ============================================================================
// EVENT MANAGER
// ============================================================================

export interface EventState {
  readonly pastEvents: Array<{
    readonly eventId: string;
    readonly choiceId: string;
    readonly dayOccurred: number;
  }>;
  readonly activeEffects: Array<{
    readonly effect: EventEffect;
    readonly startDay: number;
    readonly sourceEventId: string;
  }>;
  readonly triggeredUniqueEvents: string[];
  readonly lastTriggerDay: Record<string, number>;  // eventId -> last trigger day
}

export interface CompanyState {
  readonly reputation: number;
  readonly money: number;
  readonly employeeCount: number;
  readonly gameCount: number;
  readonly activeGenres: GameGenre[];
}

/**
 * Creates initial event state
 */
export function createInitialEventState(): EventState {
  return {
    pastEvents: [],
    activeEffects: [],
    triggeredUniqueEvents: [],
    lastTriggerDay: {},
  };
}

/**
 * Checks if a trigger condition is met
 */
export function checkTriggerCondition(
  condition: TriggerCondition,
  companyState: CompanyState,
  eventState: EventState,
  currentDay: number,
  rng: IRNGProvider = defaultRNG
): boolean {
  switch (condition.type) {
    case 'reputation_above':
      return companyState.reputation > condition.value;
    case 'reputation_below':
      return companyState.reputation < condition.value;
    case 'money_above':
      return companyState.money > condition.value;
    case 'money_below':
      return companyState.money < condition.value;
    case 'employee_count':
      return companyState.employeeCount >= condition.min && 
        (condition.max === undefined || companyState.employeeCount <= condition.max);
    case 'game_count':
      return companyState.gameCount >= condition.min &&
        (condition.max === undefined || companyState.gameCount <= condition.max);
    case 'genre_active':
      return companyState.activeGenres.includes(condition.genre);
    case 'day_of_year':
      return (currentDay % 365) === condition.day;
    case 'random':
      return rng.random() < condition.probability;
    case 'previous_choice':
      return eventState.pastEvents.some(
        pe => pe.eventId === condition.eventId && pe.choiceId === condition.choiceId
      );
    case 'never':
      return false;
  }
}

/**
 * Gets all events that can currently trigger
 */
export function getEligibleEvents(
  events: GameEvent[],
  companyState: CompanyState,
  eventState: EventState,
  currentDay: number,
  rng: IRNGProvider = defaultRNG
): GameEvent[] {
  return events.filter(event => {
    // Check if unique event already triggered
    if (event.isUnique && eventState.triggeredUniqueEvents.includes(event.id)) {
      return false;
    }
    
    // Check cooldown
    const lastTrigger = eventState.lastTriggerDay[event.id];
    if (lastTrigger !== undefined && (currentDay - lastTrigger) < event.cooldownDays) {
      return false;
    }
    
    // Check all trigger conditions
    return event.triggerConditions.every(cond =>
      checkTriggerCondition(cond, companyState, eventState, currentDay, rng)
    );
  });
}

/**
 * Selects an event to trigger based on weights
 */
export function selectEvent(
  eligibleEvents: GameEvent[],
  rng: IRNGProvider = defaultRNG
): GameEvent | null {
  if (eligibleEvents.length === 0) return null;
  
  const totalWeight = eligibleEvents.reduce((sum, e) => sum + e.weight, 0);
  if (totalWeight === 0) return null;
  
  let roll = rng.random() * totalWeight;
  
  for (const event of eligibleEvents) {
    roll -= event.weight;
    if (roll <= 0) {
      return event;
    }
  }
  
  return eligibleEvents[0];
}

/**
 * Applies a choice's effects to the company and event state
 */
export function applyEventChoice(
  event: GameEvent,
  choice: EventChoice,
  eventState: EventState,
  currentDay: number
): {
  eventState: EventState;
  immediateEffects: EventEffect[];
  delayedEffects: Array<{ effect: EventEffect; triggerDay: number }>;
  chainEventId?: string;
} {
  const immediateEffects: EventEffect[] = [];
  const delayedEffects: Array<{ effect: EventEffect; triggerDay: number }> = [];
  
  // Categorize effects
  for (const effect of choice.effects) {
    if (effect.delayed && effect.delayed > 0) {
      delayedEffects.push({
        effect,
        triggerDay: currentDay + effect.delayed,
      });
    } else {
      immediateEffects.push(effect);
    }
  }
  
  // Track active timed effects
  const newActiveEffects = [
    ...eventState.activeEffects,
    ...choice.effects
      .filter(e => e.duration !== undefined && e.duration > 0)
      .map(effect => ({
        effect,
        startDay: currentDay + (effect.delayed ?? 0),
        sourceEventId: event.id,
      })),
  ];
  
  const newEventState: EventState = {
    pastEvents: [
      ...eventState.pastEvents,
      { eventId: event.id, choiceId: choice.id, dayOccurred: currentDay },
    ],
    activeEffects: newActiveEffects,
    triggeredUniqueEvents: event.isUnique
      ? [...eventState.triggeredUniqueEvents, event.id]
      : eventState.triggeredUniqueEvents,
    lastTriggerDay: {
      ...eventState.lastTriggerDay,
      [event.id]: currentDay,
    },
  };
  
  return {
    eventState: newEventState,
    immediateEffects,
    delayedEffects,
    chainEventId: choice.chainEventId,
  };
}

/**
 * Gets active modifier effects for current day
 */
export function getActiveModifiers(
  eventState: EventState,
  currentDay: number
): { revenueModifier: number; costModifier: number } {
  let revenueModifier = 0;
  let costModifier = 0;
  
  for (const activeEffect of eventState.activeEffects) {
    const endDay = activeEffect.startDay + (activeEffect.effect.duration ?? 0);
    
    if (currentDay >= activeEffect.startDay && currentDay < endDay) {
      if (activeEffect.effect.type === 'revenue_modifier') {
        revenueModifier += activeEffect.effect.value;
      } else if (activeEffect.effect.type === 'cost_modifier') {
        costModifier += activeEffect.effect.value;
      }
    }
  }
  
  return { revenueModifier, costModifier };
}

/**
 * Cleans up expired effects
 */
export function cleanupExpiredEffects(
  eventState: EventState,
  currentDay: number
): EventState {
  const activeEffects = eventState.activeEffects.filter(ae => {
    const endDay = ae.startDay + (ae.effect.duration ?? 0);
    return currentDay < endDay;
  });
  
  return { ...eventState, activeEffects };
}

/**
 * Gets the chain event if triggered
 */
export function getChainEvent(
  chainEventId: string | undefined,
  events: GameEvent[]
): GameEvent | null {
  if (!chainEventId) return null;
  return events.find(e => e.id === chainEventId) ?? null;
}
