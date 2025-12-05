# Domain Glossary

This glossary defines game-specific terms and concepts used throughout the codebase.

---

## Table of Contents

- [Core Concepts](#core-concepts)
- [Company Terms](#company-terms)
- [Employee Terms](#employee-terms)
- [Game Development Terms](#game-development-terms)
- [Gacha Terms](#gacha-terms)
- [Economy Terms](#economy-terms)
- [Technical Terms](#technical-terms)

---

## Core Concepts

### Company
The player's game development studio. Has funds, reputation, employees, and games.

### Game Tick
The fundamental unit of time in the simulation. One tick represents a configurable amount of real time (default: 1 day = 1 tick at normal speed).

### Reputation
A score (0-100) representing the company's public image. Affects hiring, revenue, and player trust.

### Prestige
A meta-progression system. Players can reset with bonuses based on achievements.

---

## Company Terms

### Funds
The company's available money (in dollars). Used for salaries, development, marketing.

### Office Level
Tier (1-5) of the company's headquarters. Higher levels unlock more employee slots.

| Level | Name | Capacity | Monthly Cost |
|-------|------|----------|--------------|
| 1 | Garage | 5 | $1,000 |
| 2 | Small Office | 15 | $5,000 |
| 3 | Studio | 30 | $15,000 |
| 4 | Campus | 50 | $40,000 |
| 5 | Headquarters | 100 | $100,000 |

### Research Points (RP)
Currency earned through game operations, spent on tech tree upgrades.

### Bankruptcy
Occurs when funds drop below negative threshold. Triggers game over or recovery mechanics.

---

## Employee Terms

### Role
An employee's job function. Determines primary skill and tasks.

| Role | Primary Skill | Description |
|------|--------------|-------------|
| Programmer | programming | Writes code, fixes bugs |
| Artist | art | Creates visual assets |
| Designer | game_design | Designs mechanics, balance |
| Marketer | marketing | Handles promotion, UA |
| Producer | management | Manages projects, teams |

### Skills
Numerical ratings (0-100) for each skill type:

- **programming**: Code quality, bug reduction
- **art**: Visual quality
- **game_design**: Gameplay quality
- **marketing**: Campaign effectiveness
- **management**: Team coordination
- **sound**: Audio quality
- **writing**: Story quality

### Morale
Employee happiness (0-100). Low morale reduces productivity and increases quit risk.

### Experience
Years of industry experience. Affects skill caps and salary expectations.

### Training
Temporary activity to boost skills. Types:
- **technical_workshop**: Programming, sound
- **creative_seminar**: Art, design, writing
- **leadership_course**: Management, marketing
- **team_building**: Morale boost

---

## Game Development Terms

### Genre
The type of game being developed:

| Genre | Description | Development Focus |
|-------|-------------|-------------------|
| rpg | Role-playing games | Story, progression |
| action | Action games | Gameplay, polish |
| puzzle | Puzzle games | Design, accessibility |
| strategy | Strategy games | Depth, balance |
| idle | Idle/clicker games | Monetization |
| card | Card games | Collection, meta |
| rhythm | Rhythm games | Sound, polish |

### Game Status
The current phase of a game's lifecycle:

```
planning → development → testing → soft_launch → live → maintenance → shutdown
```

| Status | Description |
|--------|-------------|
| planning | Pre-production, gathering team |
| development | Active creation |
| testing | QA and bug fixing |
| soft_launch | Limited release for metrics |
| live | Fully launched, generating revenue |
| maintenance | Minimal updates, declining |
| shutdown | No longer operational |

### Quality Metrics
Five aspects of game quality (each 0-100):

- **graphics**: Visual fidelity and style
- **gameplay**: Fun factor and mechanics
- **story**: Narrative quality
- **sound**: Audio and music
- **polish**: Stability and UX

### Development Progress
Percentage (0-100) of development completion.

---

## Gacha Terms

### Gacha (ガチャ)
A randomized prize system where players spend currency for a chance at rewards.

### Banner
A themed gacha event with specific items and rates:

- **Standard Banner**: Always available, standard rates
- **Limited Banner**: Time-limited, exclusive items
- **Rate-Up Banner**: Increased odds for featured items

### Pull
A single gacha attempt. Can be single or multi (usually 10).

### Rarity
Item quality tier affecting drop rates:

| Rarity | Typical Rate | Color |
|--------|--------------|-------|
| common | 60% | Gray |
| uncommon | 25% | Green |
| rare | 10% | Blue |
| epic | 4% | Purple |
| legendary | 1% | Gold |

### Pity System
A guaranteed drop mechanic. After X pulls without rare items, the next pull guarantees one.

- **Hard Pity**: Guaranteed at X pulls
- **Soft Pity**: Increasing rates starting at X pulls

### Rate-Up
Increased probability for featured items within their rarity tier.

### Item Types
Categories of gacha rewards:

- **character**: Playable characters
- **weapon**: Equipment
- **artifact**: Stat boosters
- **costume**: Cosmetic skins

---

## Economy Terms

### ARPU (Average Revenue Per User)
Revenue generated per active player. Base calculation:

```
ARPU = BaseARPU × QualityMultiplier × MonetizationMultiplier × (1 - Saturation)
```

### DAU (Daily Active Users)
Players who log in on a given day. Key metric for revenue.

### MAU (Monthly Active Users)
Unique players in a month. Typically ~1.5× DAU.

### Retention
Percentage of players who return after initial play:
- **D1**: Day 1 retention
- **D7**: Week 1 retention
- **D30**: Month 1 retention

### Monetization Strategy
How aggressively the game monetizes:

| Strategy | ARPU Mult | Retention Mult | Description |
|----------|-----------|----------------|-------------|
| generous | 0.6× | 1.3× | Player-friendly, low revenue |
| balanced | 1.0× | 1.0× | Standard approach |
| aggressive | 1.5× | 0.7× | Heavy monetization |
| predatory | 2.5× | 0.3× | Exploitative, high churn |

### Market Saturation
Competition level in a genre (0-1). Higher = harder to acquire players.

### Update Frequency
How often the game receives new content:

| Frequency | Revenue Bonus |
|-----------|---------------|
| weekly | +30% |
| biweekly | +20% |
| monthly | +10% |
| sporadic | 0% |
| none | -20% |

### Server Costs
Operating costs based on player count. ~$5 per 1000 DAU/month.

---

## Technical Terms

### Entity
A domain object with a unique identity (ID). Examples: Company, Employee, Game.

### Value Object
An immutable object without identity. Examples: SkillSet, GameQuality, GachaRates.

### Domain Event
A record of something that happened in the game. Used for reactions and history.

### Event Bus
A pub/sub system for domain events. Decouples event producers from consumers.

### Configuration Bundle
Collection of all game balance settings. Supports per-difficulty overrides.

### Difficulty Mode
Preset modifiers affecting game balance:

| Mode | Starting Money | Revenue | Costs |
|------|----------------|---------|-------|
| casual | +50% | +25% | -20% |
| standard | 0% | 0% | 0% |
| challenging | -25% | -10% | +20% |
| nightmare | -50% | -25% | +50% |

### RNG Provider
Interface for random number generation. Allows deterministic testing via injection.

---

## Formulas Reference

### Quality Score
```typescript
overallQuality = (graphics + gameplay + story + sound + polish) / 5
```

### Employee Contribution
```typescript
contribution = skillLevel × (morale / 100) × roleMultiplier
```

### Revenue Calculation
```typescript
dailyRevenue = DAU × ARPU × (1 + updateBonus) × (1 - saturation)
monthlyRevenue = dailyRevenue × 30
```

### Reputation Change
```typescript
newReputation = clamp(0, 100, reputation + change × volatilityMod)
```

### Development Progress
```typescript
dailyProgress = teamContribution × speedModifier / totalRequired
```

---

## Abbreviations

| Abbr | Full Term |
|------|-----------|
| ARPU | Average Revenue Per User |
| DAU | Daily Active Users |
| MAU | Monthly Active Users |
| RP | Research Points |
| RNG | Random Number Generator |
| UA | User Acquisition |
| UX | User Experience |
| QA | Quality Assurance |
