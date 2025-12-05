# How-To Guides

This document provides step-by-step guides for extending the game.

---

## Table of Contents

- [Gameplay Tips - Getting Started](#gameplay-tips---getting-started)
- [How to Add New Events](#how-to-add-new-events)
- [How to Tune Balance](#how-to-tune-balance)
- [How to Add Employee Roles](#how-to-add-employee-roles)
- [How to Add Gacha Banners](#how-to-add-gacha-banners)
- [How to Add Achievements](#how-to-add-achievements)
- [How to Add Research Nodes](#how-to-add-research-nodes)

---

## Gameplay Tips - Getting Started

New to the game? Here's how to successfully complete your first game project.

### Starting Budget Strategy

You start with **$200,000**. Here's how to manage it wisely:

| Cost Type | Typical Amount | Notes |
|-----------|---------------|-------|
| Office (Level 1) | $1,000/month | Minimal overhead |
| Junior Employee | $3,000-4,000/month | Best value for startups |
| Mid-level Employee | $5,000-7,000/month | Better skills, higher cost |
| Senior Employee | $8,000-12,000/month | Avoid early unless rich |

### Tip 1: Start with 1-2 Cheap Employees

- Hire **junior employees** (lower experience = lower salary)
- Look for employees with 0-2 years experience (~$3,000-4,000/month)
- A single Programmer + Designer combo can complete your first game

### Tip 2: Keep Costs Under Control

With $200,000 starting funds:
- Monthly burn: ~$1,000 (office) + ~$6,000 (2 junior employees) = **$7,000/month**
- You have roughly **28 months** of runway
- Development takes 2-4 months with a small team (was much longer, now fixed!)

### Tip 3: Assign Employees Immediately

- Go to **Game Projects** → Create a new game
- **Assign your employees** to the project right away
- Progress only happens when employees are assigned!
- Check the progress breakdown (❓ icon) to see if your team is working

### Tip 4: Understand the Development Phases

Each game goes through 4 phases before launch:
1. **Planning** (fastest) - Game design skills help
2. **Development** (slowest) - Programming, art, sound skills help
3. **Testing** - Programming and design skills help
4. **Soft Launch** - Marketing and management help

### Tip 5: Choose an Easy Genre

Some genres are easier for small teams:
- **Idle** 💤 - Simple mechanics, forgiving quality
- **Puzzle** 🧩 - Focus on one core mechanic
- **Card** 🃏 - Less art/graphics required

### Tip 6: Consider Casual Difficulty

If you're running out of money, try **Casual difficulty** which gives you:
- 150% starting money ($150,000)
- Faster development speed
- Lower salary growth

Access it from the **Settings** or when starting a new game.

### Quick Start Checklist

1. ✅ Hire 1-2 junior employees (Programmer + Designer recommended)
2. ✅ Start a game project (pick Idle or Puzzle for easier start)
3. ✅ Assign all employees to the project
4. ✅ Wait for development to complete (~1 month)
5. ✅ Launch your game when progress hits 100%
6. ✅ Revenue starts flowing - hire more staff!

---

## Understanding Live Game Revenue

Once your game goes live, it starts generating revenue based on several factors.

### Revenue Formula

```
Daily Revenue = DAU × ARPDAU × Quality Factor × Satisfaction Factor
```

Where:
- **DAU** (Daily Active Users) - How many players are playing your game
- **ARPDAU** (Average Revenue Per Daily Active User) - Base is $0.03-0.12 depending on genre
- **Quality Factor** - Games with higher quality earn more per user
- **Satisfaction Factor** - Happy players spend more money

### What Affects Daily Active Users (DAU)

| Factor | Effect |
|--------|--------|
| Game Quality | Higher quality = more organic growth |
| Company Reputation | Better rep = more visibility |
| Genre | Idle games attract more casual players |
| Days Since Launch | Big boost in first 30 days |
| Marketer Assigned | +50% new user acquisition |
| Player Satisfaction | Happy players bring friends |

### What Affects Revenue Per User

| Factor | Effect |
|--------|--------|
| Game Quality | High quality = players spend more |
| Player Satisfaction | Happy players = 40-140% spending |
| Gacha Generosity | More generous rates = less per-user revenue |
| Genre | RPGs earn more per user than Idle games |

### Genre Comparison

| Genre | Base DAU | Growth | Retention | ARPDAU |
|-------|----------|--------|-----------|--------|
| Idle | 500 | High | 95% | $0.03 |
| Puzzle | 400 | Good | 92% | $0.04 |
| Card | 300 | Medium | 90% | $0.08 |
| Action | 250 | Good | 87% | $0.06 |
| RPG | 200 | Slow | 88% | $0.10 |
| Rhythm | 180 | Medium | 89% | $0.07 |
| Strategy | 150 | Slow | 85% | $0.12 |

### Keeping Players Happy

Player satisfaction naturally decays over time. To maintain it:
- **High quality** slows the decay
- **Content updates** (future feature) will boost satisfaction
- **Genres differ** - Idle games decay slower, Action games faster

### Revenue Tips

1. **Assign a Marketer** to boost user acquisition by 50%
2. **Focus on quality** during development - it pays dividends forever
3. **Choose your genre wisely** - Idle = easy growth, RPG = high revenue per user
4. **Launch quickly** - The first 30 days have a launch boost
5. **Watch player satisfaction** - When it drops, revenue follows

---

## How to Add New Events

Game events are random occurrences with choices and consequences.

### Location
`src/domain/events/EventManager.ts`

### Event Structure

```typescript
interface GameEvent {
  id: string;              // Unique identifier
  title: string;           // Display title
  description: string;     // Event text
  category: EventCategory; // Type classification
  severity: EventSeverity; // Impact level
  choices: EventChoice[];  // Player options
  triggerConditions: TriggerCondition[];  // When to trigger
  cooldownDays: number;    // Minimum days between occurrences
  isUnique: boolean;       // Can only happen once?
  weight: number;          // Relative probability
}
```

### Step 1: Define the Event

Add to the `GAME_EVENTS` array:

```typescript
{
  id: 'event_industry_conference',
  title: 'Industry Conference Invitation',
  description: 'You\'ve been invited to speak at a major gaming conference. This could boost your reputation but will take time away from development.',
  category: 'random',
  severity: 'moderate',
  choices: [
    {
      id: 'attend_conference',
      text: 'Accept the invitation and attend',
      effects: [
        { type: 'reputation', value: 10 },
        { type: 'money', value: -5000 },  // Travel costs
      ],
      ethicalScore: 0,  // Neutral choice
    },
    {
      id: 'decline_conference',
      text: 'Politely decline to focus on work',
      effects: [
        { type: 'reputation', value: -2 },
      ],
      ethicalScore: 0,
    },
    {
      id: 'send_employee',
      text: 'Send a senior employee instead',
      effects: [
        { type: 'money', value: -3000 },
        { type: 'reputation', value: 5 },
        { type: 'employee_morale', value: 10 },  // They feel trusted
      ],
      ethicalScore: 10,
      requiredMoney: 3000,
    },
  ],
  triggerConditions: [
    { type: 'reputation_above', value: 40 },
    { type: 'employee_count', min: 10 },
    { type: 'random', probability: 0.1 },
  ],
  cooldownDays: 180,  // At most twice a year
  isUnique: false,
  weight: 1.0,
}
```

### Step 2: Add Trigger Conditions

Conditions determine when events can fire:

```typescript
// Player must have reputation above 40
{ type: 'reputation_above', value: 40 }

// Player must have funds below $10,000
{ type: 'money_below', value: 10000 }

// Must have between 5-20 employees
{ type: 'employee_count', min: 5, max: 20 }

// Must have at least 2 games
{ type: 'game_count', min: 2 }

// Must be developing an RPG
{ type: 'genre_active', genre: 'rpg' }

// Only on day 100 of the year (special events)
{ type: 'day_of_year', day: 100 }

// 10% chance per eligible tick
{ type: 'random', probability: 0.1 }

// Only if player chose 'accept' in previous event
{ type: 'previous_choice', eventId: 'event_partnership', choiceId: 'accept' }
```

### Step 3: Define Effects

Effects modify game state:

```typescript
// Immediate effects
{ type: 'reputation', value: 10 }      // Add 10 reputation
{ type: 'money', value: -5000 }        // Subtract $5,000
{ type: 'employee_morale', value: 15 } // Add 15 to all employee morale
{ type: 'player_count', value: 1000 }  // Add 1000 players

// Temporary effects (duration in game ticks)
{ type: 'revenue_modifier', value: 0.2, duration: 30 }  // +20% revenue for 30 days
{ type: 'cost_modifier', value: -0.1, duration: 60 }    // -10% costs for 60 days

// Delayed effects
{ type: 'reputation', value: -20, delayed: 30 }  // -20 reputation after 30 days
```

### Step 4: Chain Events (Optional)

Create follow-up events:

```typescript
{
  id: 'implement_dark_pattern',
  text: 'Implement the dark pattern',
  effects: [...],
  ethicalScore: -50,
  chainEventId: 'event_player_backlash',  // Triggers this event later
}
```

### Step 5: Add Tests

Create tests in `src/test/events/`:

```typescript
describe('Industry Conference Event', () => {
  it('triggers when reputation is above 40', () => {
    const event = GAME_EVENTS.find(e => e.id === 'event_industry_conference');
    const context = { reputation: 50, employeeCount: 15, ... };
    expect(canTriggerEvent(event, context)).toBe(true);
  });

  it('applies reputation boost when attending', () => {
    const choice = event.choices.find(c => c.id === 'attend_conference');
    const effect = choice.effects.find(e => e.type === 'reputation');
    expect(effect.value).toBe(10);
  });
});
```

---

## How to Tune Balance

Game balance is controlled through configuration objects.

### Location
- Types: `src/domain/config/ConfigTypes.ts`
- Defaults: `src/domain/config/ConfigDefaults.ts`

### Configuration Categories

1. **Economy Config**: Revenue, costs, ARPU
2. **Gacha Rates Config**: Drop rates, pity
3. **Market Config**: Competition, saturation
4. **Reputation Config**: Growth, decay
5. **Employee Config**: Salaries, skills, morale
6. **Research Config**: Costs, effects

### Step 1: Identify the Setting

Find the relevant config in `ConfigTypes.ts`:

```typescript
export interface EconomyConfig extends BaseConfig {
  readonly baseArpu: number;  // ← This controls base ARPU
  readonly monetizationMultipliers: {
    readonly generous: { arpu: number; retention: number };
    // ...
  };
  // ...
}
```

### Step 2: Modify Defaults

Edit `ConfigDefaults.ts`:

```typescript
export const DEFAULT_ECONOMY_CONFIG: EconomyConfig = {
  version: '1.0.0',
  lastModified: new Date().toISOString(),
  
  baseArpu: 2.50,  // ← Change this value
  // ...
};
```

### Step 3: Add Difficulty Overrides

For difficulty-specific balance:

```typescript
const DIFFICULTY_OVERRIDES: Record<DifficultyMode, Partial<ConfigBundle>> = {
  casual: {
    economy: {
      baseArpu: 3.00,              // Higher ARPU on casual
      costMultiplier: 0.8,          // Lower costs
    },
  },
  challenging: {
    economy: {
      baseArpu: 2.00,              // Lower ARPU
      costMultiplier: 1.2,          // Higher costs
    },
  },
  // ...
};
```

### Step 4: Use Runtime Config

In game code, always access through the config system:

```typescript
// ✅ Correct - uses config
const arpu = calculateARPU(quality, config.economy, saturation);

// ❌ Wrong - hardcoded values
const arpu = quality * 2.50;
```

### Step 5: Validate Changes

Run balance tests:

```bash
npm run test:run -- --grep "balance"
```

Check for regression:

```typescript
import { checkBalanceRegression } from '@infrastructure/config';

const issues = checkBalanceRegression(oldConfig, newConfig);
if (issues.length > 0) {
  console.warn('Balance changes detected:', issues);
}
```

### Balance Tuning Tips

1. **Small Changes**: Adjust by 5-10% at a time
2. **Test Multiple Difficulties**: Ensure all modes remain playable
3. **Monitor Key Metrics**: ARPU, retention, progression speed
4. **Consider Interactions**: Changes cascade through systems
5. **Document Reasoning**: Add comments explaining why

---

## How to Add Employee Roles

Roles define an employee's job function and primary skill.

### Location
`src/domain/employee/Employee.ts`

### Step 1: Add Role Type

Extend the `EmployeeRole` type:

```typescript
export type EmployeeRole = 
  | 'Programmer'
  | 'Artist'
  | 'Designer'
  | 'Marketer'
  | 'Producer'
  | 'SoundDesigner'   // ← New role
  | 'Writer';         // ← New role
```

### Step 2: Map Primary Skill

Add to `ROLE_PRIMARY_SKILLS`:

```typescript
export const ROLE_PRIMARY_SKILLS: Record<EmployeeRole, SkillType> = {
  Programmer: 'programming',
  Artist: 'art',
  Designer: 'game_design',
  Marketer: 'marketing',
  Producer: 'management',
  SoundDesigner: 'sound',     // ← New mapping
  Writer: 'writing',          // ← New mapping
};
```

### Step 3: Define Salary Ranges

Add to employee generation config:

```typescript
const ROLE_SALARY_RANGES: Record<EmployeeRole, { min: number; max: number }> = {
  Programmer: { min: 4000, max: 12000 },
  Artist: { min: 3500, max: 10000 },
  Designer: { min: 3500, max: 9000 },
  Marketer: { min: 3000, max: 8000 },
  Producer: { min: 5000, max: 15000 },
  SoundDesigner: { min: 3000, max: 8000 },   // ← New range
  Writer: { min: 2500, max: 7000 },          // ← New range
};
```

### Step 4: Update Game Logic

Ensure the role contributes to relevant quality metrics:

```typescript
function calculateQualityContribution(employee: Employee, game: Game): Partial<GameQuality> {
  switch (employee.role) {
    case 'SoundDesigner':
      return { sound: employee.skills.sound * 0.8 };
    case 'Writer':
      return { story: employee.skills.writing * 0.7 };
    // ...
  }
}
```

### Step 5: Add Role-Specific Events (Optional)

```typescript
{
  id: 'event_writer_block',
  title: 'Writer\'s Block',
  description: 'Your lead writer is struggling with the story...',
  triggerConditions: [
    { type: 'has_role', role: 'Writer' },  // Only if you have a writer
  ],
  // ...
}
```

### Step 6: Update Tests

```typescript
describe('SoundDesigner role', () => {
  it('has sound as primary skill', () => {
    expect(ROLE_PRIMARY_SKILLS.SoundDesigner).toBe('sound');
  });

  it('contributes to sound quality', () => {
    const soundDesigner = createEmployee({
      name: 'Test',
      role: 'SoundDesigner',
      skills: { sound: 80, ... },
      ...
    });
    const contribution = calculateQualityContribution(soundDesigner);
    expect(contribution.sound).toBeGreaterThan(0);
  });
});
```

---

## How to Add Gacha Banners

Banners are themed gacha events with specific items and rates.

### Location
`src/domain/gacha/Gacha.ts`

### Step 1: Create Items

First, create the items that will be in the banner:

```typescript
const summerCharacter = createGachaItem({
  name: 'Summer Sakura',
  rarity: 'legendary',
  type: 'character',
  description: 'A limited summer variant with beach attire.',
  artCost: 20000,    // Higher cost for legendary
  designCost: 10000,
});

const summerWeapon = createGachaItem({
  name: 'Beach Parasol',
  rarity: 'epic',
  type: 'weapon',
  description: 'A festive weapon that deals water damage.',
});
```

### Step 2: Create the Banner

```typescript
const summerBanner = createGachaBanner({
  name: 'Summer Splash Festival',
  gameId: 'your-game-id',
  featuredItems: [summerCharacter.id],  // Rate-up items
  itemPool: [
    summerCharacter.id,
    summerWeapon.id,
    // ... other items available
  ],
  startDate: currentTick,
  duration: 14 * TICKS_PER_DAY,  // 2 weeks
  rates: {
    common: 0.55,
    uncommon: 0.25,
    rare: 0.12,
    epic: 0.05,
    legendary: 0.03,  // Boosted legendary rate!
  },
  rateUpMultiplier: 2.5,  // Featured items 2.5x more likely
  pullCost: { gems: 300, tickets: 1 },
  pityCounter: 80,  // Guaranteed at 80 pulls
  isLimited: true,  // Not available after banner ends
});
```

### Step 3: Register the Banner

Add to your game's active banners:

```typescript
function addBannerToGame(game: Game, banner: GachaBanner): Game {
  return {
    ...game,
    activeBanners: [...game.activeBanners, banner.id],
  };
}
```

### Step 4: Handle Banner Expiration

In the game loop, check for expired banners:

```typescript
function processGameTick(game: Game, currentTick: number): Game {
  const activeBanners = game.activeBanners.filter(bannerId => {
    const banner = getBanner(bannerId);
    return banner.endDate > currentTick;
  });
  
  return { ...game, activeBanners };
}
```

### Step 5: Banner Event (Optional)

Create an announcement event:

```typescript
{
  id: 'event_summer_banner',
  title: 'Summer Splash Festival Begins!',
  description: 'A new limited-time banner has started with exclusive summer characters.',
  category: 'market',
  choices: [
    {
      id: 'promote_banner',
      text: 'Run a marketing campaign for the banner',
      effects: [
        { type: 'money', value: -10000 },
        { type: 'player_count', value: 5000 },
        { type: 'revenue_modifier', value: 0.3, duration: 14 },
      ],
    },
    {
      id: 'standard_release',
      text: 'Release without extra promotion',
      effects: [],
    },
  ],
  // ...
}
```

---

## How to Add Achievements

Achievements track player milestones and unlock rewards.

### Location
`src/domain/achievements/Achievement.ts`

### Step 1: Define the Achievement

```typescript
export const ACHIEVEMENTS: Achievement[] = [
  // ... existing achievements
  
  {
    id: 'first_million',
    name: 'Millionaire',
    description: 'Accumulate $1,000,000 in company funds',
    icon: '💰',
    category: 'wealth',
    rarity: 'rare',
    hidden: false,
    condition: {
      type: 'money_threshold',
      value: 1000000,
    },
    rewards: {
      prestigePoints: 100,
      unlocks: ['golden_office_theme'],
    },
  },
];
```

### Step 2: Add Condition Type

If using a new condition type, add to the evaluator:

```typescript
function checkAchievementCondition(
  achievement: Achievement,
  state: GameState
): boolean {
  switch (achievement.condition.type) {
    case 'money_threshold':
      return state.company.funds >= achievement.condition.value;
      
    case 'employee_count':
      return state.employees.size >= achievement.condition.value;
      
    case 'game_launched':
      return state.games.filter(g => g.status === 'live').length >= achievement.condition.value;
      
    // Add new condition types here
    case 'legendary_pull':
      return state.stats.legendaryPulls >= achievement.condition.value;
  }
}
```

### Step 3: Trigger Check

Achievements are checked after relevant state changes:

```typescript
function processAchievements(
  state: GameState,
  context: AchievementContext
): Set<string> {
  const newAchievements = new Set<string>();
  
  for (const achievement of ACHIEVEMENTS) {
    if (!state.unlockedAchievements.has(achievement.id)) {
      if (checkAchievementCondition(achievement, state, context)) {
        newAchievements.add(achievement.id);
      }
    }
  }
  
  return newAchievements;
}
```

### Step 4: Add Notifications

Show achievement popup:

```typescript
eventBus.subscribe('achievement.unlocked', (event) => {
  showNotification({
    type: 'achievement',
    title: `Achievement Unlocked: ${event.achievement.name}`,
    icon: event.achievement.icon,
  });
});
```

---

## How to Add Research Nodes

Research nodes unlock new capabilities and bonuses.

### Location
`src/domain/research/Research.ts`

### Step 1: Define the Research Node

```typescript
export const RESEARCH_NODES: ResearchNode[] = [
  // ... existing nodes
  
  {
    id: 'advanced_gacha',
    name: 'Advanced Gacha Systems',
    description: 'Unlock pity system customization and rate-up mechanics.',
    category: 'monetization',
    tier: 3,
    cost: {
      researchPoints: 500,
      money: 50000,
    },
    prerequisites: ['basic_monetization', 'player_analytics'],
    duration: 30,  // Days to research
    effects: [
      { type: 'unlock_feature', feature: 'custom_pity' },
      { type: 'modifier', stat: 'gacha_revenue', value: 0.15 },
    ],
  },
];
```

### Step 2: Define Prerequisites

Research nodes can require other nodes:

```
                 ┌─────────────────┐
                 │  Game Design 1  │
                 └────────┬────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌───────────┐   ┌───────────┐   ┌───────────┐
    │ Balance   │   │   Meta    │   │   Live    │
    │  Design   │   │  Systems  │   │    Ops    │
    └───────────┘   └───────────┘   └───────────┘
```

### Step 3: Apply Research Effects

When research completes:

```typescript
function applyResearchEffects(
  state: GameState,
  node: ResearchNode
): GameState {
  let newState = state;
  
  for (const effect of node.effects) {
    switch (effect.type) {
      case 'unlock_feature':
        newState = unlockFeature(newState, effect.feature);
        break;
        
      case 'modifier':
        newState = addModifier(newState, effect.stat, effect.value);
        break;
        
      case 'unlock_genre':
        newState = unlockGenre(newState, effect.genre);
        break;
    }
  }
  
  return newState;
}
```

### Step 4: Add to Tech Tree UI

The research tree visualization needs the node:

```typescript
const TECH_TREE_LAYOUT = {
  monetization: {
    nodes: ['basic_monetization', 'player_analytics', 'advanced_gacha'],
    connections: [
      ['basic_monetization', 'advanced_gacha'],
      ['player_analytics', 'advanced_gacha'],
    ],
  },
};
```

### Step 5: Add Tests

```typescript
describe('Advanced Gacha research', () => {
  it('requires prerequisites', () => {
    const node = RESEARCH_NODES.find(n => n.id === 'advanced_gacha');
    expect(node.prerequisites).toContain('basic_monetization');
    expect(node.prerequisites).toContain('player_analytics');
  });

  it('unlocks custom pity feature', () => {
    const node = RESEARCH_NODES.find(n => n.id === 'advanced_gacha');
    const effect = node.effects.find(e => e.type === 'unlock_feature');
    expect(effect.feature).toBe('custom_pity');
  });
});
```
