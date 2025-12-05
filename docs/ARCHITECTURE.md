# Architecture Overview

This document describes the software architecture of Gacha Game Company Simulator.

## Table of Contents

- [Design Philosophy](#design-philosophy)
- [Layered Architecture](#layered-architecture)
- [Directory Structure](#directory-structure)
- [Domain Model](#domain-model)
- [State Management](#state-management)
- [Event System](#event-system)
- [Data Flow](#data-flow)
- [Key Design Patterns](#key-design-patterns)

---

## Design Philosophy

The architecture follows these core principles:

1. **Domain-Driven Design (DDD)**: Business logic lives in the domain layer, isolated from UI and infrastructure concerns.

2. **Clean Architecture**: Dependencies flow inward. Domain has no dependencies on infrastructure.

3. **Immutability**: All domain entities are immutable. State changes create new objects.

4. **Testability**: Pure functions enable easy unit testing. Side effects are isolated.

5. **Type Safety**: TypeScript strict mode catches errors at compile time.

---

## Layered Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                            │
│  React Components, Hooks, UI State                              │
│  src/presentation/                                               │
├─────────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                             │
│  State Management, Use Cases, Orchestration                     │
│  src/application/                                                │
├─────────────────────────────────────────────────────────────────┤
│                    DOMAIN LAYER                                  │
│  Entities, Value Objects, Business Logic, Events                │
│  src/domain/                                                     │
├─────────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE LAYER                          │
│  Storage, Game Loop, Analytics, External Services               │
│  src/infrastructure/                                             │
└─────────────────────────────────────────────────────────────────┘
```

### Dependency Rule

```
Presentation → Application → Domain ← Infrastructure
                    ↓
              Infrastructure
```

- **Domain** has NO external dependencies
- **Application** depends on Domain
- **Infrastructure** depends on Domain (implements interfaces)
- **Presentation** depends on Application

---

## Directory Structure

```
src/
├── domain/                 # Core business logic
│   ├── achievements/       # Achievement system
│   ├── company/           # Company entity & operations
│   ├── config/            # Balance configuration types
│   ├── difficulty/        # Difficulty modifiers
│   ├── economy/           # Revenue, costs, ARPU calculations
│   ├── employee/          # Employee entities & skills
│   ├── errors/            # Domain-specific errors
│   ├── events/            # Game events & ethical dilemmas
│   ├── gacha/             # Gacha mechanics & banners
│   ├── game/              # Game entity & development
│   ├── market/            # Market simulation
│   ├── player/            # Player progress & state
│   ├── prestige/          # Prestige/reset mechanics
│   ├── reputation/        # Reputation calculations
│   ├── research/          # Tech tree & research
│   ├── sandbox/           # Sandbox mode
│   └── shared/            # Shared utilities & types
│
├── application/           # Application orchestration
│   ├── hooks/             # React hooks for game state
│   ├── state/             # Game state management
│   └── useCases/          # Application use cases
│
├── infrastructure/        # External concerns
│   ├── analytics/         # Game analytics tracking
│   ├── config/            # Config loading & validation
│   ├── debug/             # Developer console
│   ├── errors/            # Error handling & recovery
│   ├── events/            # Event bus implementation
│   ├── gameLoop/          # Game tick management
│   ├── performance/       # Performance monitoring
│   ├── pwa/               # PWA utilities
│   ├── simulation/        # Simulation runners
│   └── storage/           # Save/load (localStorage)
│
├── presentation/          # UI Layer
│   ├── components/        # React components
│   ├── hooks/             # UI-specific hooks
│   ├── layouts/           # Page layouts
│   ├── pages/             # Route pages
│   └── styles/            # CSS/Tailwind
│
└── test/                  # Test files (mirrors src/)
```

---

## Domain Model

### Core Entities

```
┌──────────────────────────────────────────────────────────────┐
│                         COMPANY                               │
│  - funds: number                                              │
│  - reputation: number                                         │
│  - employees: Employee[]                                      │
│  - games: Game[]                                              │
│  - researchPoints: number                                     │
└───────────────────────────┬──────────────────────────────────┘
                            │ owns
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   EMPLOYEE    │   │     GAME      │   │   RESEARCH    │
│               │   │               │   │               │
│ - name        │   │ - name        │   │ - id          │
│ - role        │   │ - genre       │   │ - name        │
│ - skills      │   │ - status      │   │ - effects     │
│ - salary      │   │ - quality     │   │ - cost        │
│ - morale      │   │ - monetization│   │ - prereqs     │
└───────────────┘   └───────┬───────┘   └───────────────┘
                            │ has
                ┌───────────┴───────────┐
                ▼                       ▼
        ┌───────────────┐       ┌───────────────┐
        │ GACHA BANNER  │       │  GACHA ITEM   │
        │               │       │               │
        │ - name        │       │ - name        │
        │ - rates       │       │ - rarity      │
        │ - itemPool    │       │ - type        │
        │ - pity        │       │ - costs       │
        └───────────────┘       └───────────────┘
```

### Value Objects

```typescript
// Immutable value objects (no identity)
type GameQuality = {
  readonly graphics: number;    // 0-100
  readonly gameplay: number;    // 0-100
  readonly story: number;       // 0-100
  readonly sound: number;       // 0-100
  readonly polish: number;      // 0-100
};

type SkillSet = Record<SkillType, number>;  // 0-100 per skill

type GachaRates = {
  readonly common: number;      // 0-1 probability
  readonly uncommon: number;
  readonly rare: number;
  readonly epic: number;
  readonly legendary: number;
};
```

### Entity Lifecycle

```
Game Lifecycle:
  planning → development → testing → soft_launch → live → maintenance → shutdown

Employee Lifecycle:
  hired → working/training → promoted/quit/fired
```

---

## State Management

### Game State Structure

```typescript
interface GameState {
  // Core state
  readonly company: Company;
  readonly employees: Map<EntityId, Employee>;
  readonly games: Map<EntityId, Game>;
  
  // Progress
  readonly currentTick: number;
  readonly currentDate: GameDate;
  readonly achievements: Set<string>;
  readonly completedResearch: Set<string>;
  
  // Configuration
  readonly difficulty: DifficultyMode;
  readonly config: ConfigBundle;
  
  // Runtime
  readonly activeEvents: GameEvent[];
  readonly notifications: Notification[];
}
```

### State Updates

All state updates are immutable:

```typescript
// ❌ Never mutate
company.funds += 1000;

// ✅ Create new state
const updated = updateCompanyFunds(company, company.funds + 1000);
```

### Reducer Pattern

```typescript
type GameAction =
  | { type: 'TICK'; payload: { delta: number } }
  | { type: 'HIRE_EMPLOYEE'; payload: { employee: Employee } }
  | { type: 'START_GAME_DEVELOPMENT'; payload: { game: Game } }
  | { type: 'APPLY_EVENT_CHOICE'; payload: { eventId: string; choiceId: string } };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TICK':
      return processTick(state, action.payload.delta);
    // ... other cases
  }
}
```

---

## Event System

### Domain Events

Domain events represent things that happened in the game:

```typescript
interface DomainEvent {
  readonly type: string;
  readonly aggregateId: string;
  readonly timestamp: number;
  readonly payload: unknown;
}

// Examples
type EmployeeHiredEvent = DomainEvent & {
  type: 'employee.hired';
  payload: { employee: Employee };
};

type GameLaunchedEvent = DomainEvent & {
  type: 'game.launched';
  payload: { gameId: string; launchDate: number };
};
```

### Event Bus

```typescript
// Subscribe to events
eventBus.subscribe('employee.hired', (event) => {
  // Update achievements
  // Send notification
  // Track analytics
});

// Publish events
eventBus.publish({
  type: 'employee.hired',
  aggregateId: employee.id,
  timestamp: Date.now(),
  payload: { employee },
});
```

### Game Events (Random Events)

Random events with choices and consequences:

```
┌─────────────────────────────────────────────────────────────┐
│                       GAME EVENT                             │
│  "Monetization Strategy Decision"                           │
├─────────────────────────────────────────────────────────────┤
│  Your analytics team discovered that showing "limited time" │
│  offers right after a player loses creates 3x purchases...  │
├─────────────────────────────────────────────────────────────┤
│  CHOICES:                                                    │
│                                                              │
│  [A] Implement dark pattern      [B] Refuse - it's wrong   │
│      💰 +$50,000                     ⭐ +5 reputation        │
│      ⭐ -15 reputation               😊 +10 morale          │
│      📈 +15% revenue (90 days)                              │
│      ⚠️  May trigger backlash                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Game Loop Flow

```
┌──────────────────────────────────────────────────────────────┐
│                        GAME LOOP                              │
│                                                               │
│    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐ │
│    │  Input  │ →  │ Update  │ →  │  State  │ →  │ Render  │ │
│    │  Phase  │    │  Phase  │    │  Sync   │    │  Phase  │ │
│    └─────────┘    └─────────┘    └─────────┘    └─────────┘ │
│                                                               │
│    ┌─────────────────────────────────────────────────────┐   │
│    │                    UPDATE PHASE                      │   │
│    │  1. Process game tick                               │   │
│    │  2. Update employee morale/skills                   │   │
│    │  3. Process game development                        │   │
│    │  4. Calculate revenue/costs                         │   │
│    │  5. Check random events                             │   │
│    │  6. Update achievements                             │   │
│    │  7. Emit domain events                              │   │
│    └─────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Save/Load Flow

```
┌──────────┐     ┌───────────┐     ┌────────────┐
│  State   │ →   │ Serialize │ →   │ localStorage│
│          │     │   (JSON)  │     │            │
└──────────┘     └───────────┘     └────────────┘

┌────────────┐     ┌─────────────┐     ┌──────────┐
│localStorage│ →   │ Deserialize │ →   │  State   │
│            │     │ & Validate  │     │          │
└────────────┘     └─────────────┘     └──────────┘
```

---

## Key Design Patterns

### Factory Pattern

All entities are created through factory functions:

```typescript
// ✅ Use factory
const employee = createEmployee({
  name: 'Jane',
  role: 'Programmer',
  salary: 5000,
  skills: defaultSkills,
  hiredDate: currentTick,
});

// ❌ Don't construct directly
const employee = { id: '...', name: 'Jane', ... };
```

### Strategy Pattern

Calculations use configurable strategies:

```typescript
// Monetization strategies affect ARPU
type MonetizationStrategy = 'generous' | 'balanced' | 'aggressive' | 'predatory';

const multipliers = {
  generous:   { arpu: 0.6, retention: 1.3 },
  balanced:   { arpu: 1.0, retention: 1.0 },
  aggressive: { arpu: 1.5, retention: 0.7 },
  predatory:  { arpu: 2.5, retention: 0.3 },
};
```

### Command Pattern

Debug console uses commands:

```typescript
const registry = new CommandRegistry();

registry.register({
  name: 'givemoney',
  description: 'Add money to company funds',
  execute: (args, state) => {
    const amount = parseInt(args[0], 10);
    return updateCompanyFunds(state.company, state.company.funds + amount);
  },
});
```

### Observer Pattern

Event bus implements pub/sub:

```typescript
// Publisher doesn't know about subscribers
eventBus.publish(event);

// Multiple subscribers can react
eventBus.subscribe('game.launched', handleLaunchAchievements);
eventBus.subscribe('game.launched', sendLaunchNotification);
eventBus.subscribe('game.launched', trackLaunchAnalytics);
```

### Singleton Pattern (Infrastructure)

Infrastructure services use singletons:

```typescript
// Config loader singleton
const configLoader = ConfigLoader.getInstance();

// Event bus singleton
const eventBus = EventBus.getInstance();
```

---

## Testing Strategy

### Test Pyramid

```
        ┌───────────────┐
        │   E2E Tests   │  ← Few, slow, high confidence
        │  (Playwright) │
        ├───────────────┤
        │  Integration  │  ← Some, medium speed
        │    Tests      │
        ├───────────────┤
        │  Unit Tests   │  ← Many, fast, focused
        │  (Vitest)     │
        └───────────────┘
```

### Test Organization

```
src/test/
├── domain/           # Pure function tests
├── infrastructure/   # Integration tests
├── presentation/     # Component tests
├── integration/      # Cross-layer tests
└── build/           # Build verification
```

### Testing Principles

1. **Domain tests are pure** - no mocks, no side effects
2. **Infrastructure tests use mocks** - localStorage, timers
3. **Component tests use Testing Library** - user-centric
4. **Property-based tests** for complex calculations

---

## Extension Points

### Adding New Features

1. **New Entity**: Add to `src/domain/{entity}/`
2. **New Calculation**: Add pure function to domain
3. **New Event**: Add to `src/domain/events/EventManager.ts`
4. **New Achievement**: Add to `src/domain/achievements/`
5. **New Research**: Add to `src/domain/research/Research.ts`
6. **New Config**: Add to `src/domain/config/ConfigTypes.ts`

### Modding Support

See [MODDING.md](./MODDING.md) for details on:
- JSON content packs
- Custom events
- Balance modifications
- Validation schemas
