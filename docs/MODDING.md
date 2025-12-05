# Modding Guide

This guide explains how to create content packs for Gacha Game Company Simulator.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Mod Pack Structure](#mod-pack-structure)
- [Content Types](#content-types)
  - [Events](#events)
  - [Gacha Items](#gacha-items)
  - [Banners](#banners)
  - [Achievements](#achievements)
  - [Research Nodes](#research-nodes)
  - [Balance Overrides](#balance-overrides)
  - [Translations](#translations)
- [Validation](#validation)
- [Best Practices](#best-practices)
- [Example Mods](#example-mods)

---

## Getting Started

### What Can Be Modded?

- **Events**: Random occurrences with player choices
- **Gacha Items**: Characters, weapons, artifacts, costumes
- **Banners**: Themed gacha events
- **Achievements**: Milestones and rewards
- **Research**: Tech tree nodes
- **Balance**: Tweak game economy and rates
- **Translations**: Add language support

### Creating Your First Mod

1. Create a JSON file with your mod content
2. Test with the in-game mod loader
3. Share with the community

---

## Mod Pack Structure

A mod pack is a JSON file with this structure:

```json
{
  "manifest": {
    "id": "my-cool-mod",
    "name": "My Cool Mod",
    "version": "1.0.0",
    "author": "Your Name",
    "description": "Adds cool new events and items",
    "gameVersion": "1.0.0",
    "dependencies": [],
    "conflicts": []
  },
  "events": [...],
  "items": [...],
  "banners": [...],
  "achievements": [...],
  "research": [...],
  "balanceOverrides": [...],
  "translations": [...]
}
```

### Manifest (Required)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier (alphanumeric, underscores, hyphens) |
| `name` | string | ✅ | Display name |
| `version` | string | ✅ | Semantic version (e.g., "1.0.0") |
| `author` | string | ✅ | Creator name |
| `description` | string | ✅ | Short description |
| `gameVersion` | string | ✅ | Compatible game version |
| `dependencies` | string[] | ❌ | Required mod IDs |
| `conflicts` | string[] | ❌ | Incompatible mod IDs |
| `homepage` | string | ❌ | URL to mod page |
| `license` | string | ❌ | License identifier |

---

## Content Types

### Events

Events are random occurrences that present the player with choices.

```json
{
  "events": [
    {
      "id": "mod_investor_visit",
      "title": "Unexpected Investor",
      "description": "A wealthy investor has shown interest in your company. They want to discuss a potential partnership.",
      "category": "random",
      "severity": "major",
      "choices": [
        {
          "id": "accept_investment",
          "text": "Accept their investment offer",
          "effects": [
            { "type": "money", "value": 100000 },
            { "type": "reputation", "value": -5 }
          ],
          "ethicalScore": -10
        },
        {
          "id": "decline_politely",
          "text": "Decline politely and stay independent",
          "effects": [
            { "type": "reputation", "value": 5 },
            { "type": "employee_morale", "value": 10 }
          ],
          "ethicalScore": 20
        }
      ],
      "triggerConditions": [
        { "type": "reputation_above", "value": 60 },
        { "type": "money_below", "value": 50000 },
        { "type": "random", "probability": 0.1 }
      ],
      "cooldownDays": 90,
      "isUnique": false,
      "weight": 1.0
    }
  ]
}
```

#### Event Categories

| Category | Description |
|----------|-------------|
| `random` | General random events |
| `ethical_dilemma` | Moral choices with consequences |
| `market` | Industry/market events |
| `employee` | Employee-related events |
| `regulatory` | Government/legal events |
| `viral` | Viral marketing/PR events |
| `disaster` | Negative events |

#### Event Severities

| Severity | Impact Level |
|----------|--------------|
| `minor` | Small effects |
| `moderate` | Medium effects |
| `major` | Large effects |
| `critical` | Game-changing |

#### Effect Types

| Type | Description |
|------|-------------|
| `reputation` | Change company reputation |
| `money` | Add/remove funds |
| `employee_morale` | Affect all employee morale |
| `player_count` | Change game player count |
| `revenue_modifier` | Temporary revenue multiplier |
| `cost_modifier` | Temporary cost multiplier |

#### Trigger Conditions

| Type | Parameters | Description |
|------|------------|-------------|
| `reputation_above` | `value` | Reputation must be above value |
| `reputation_below` | `value` | Reputation must be below value |
| `money_above` | `value` | Funds must be above value |
| `money_below` | `value` | Funds must be below value |
| `employee_count` | `min`, `max?` | Employee count in range |
| `game_count` | `min`, `max?` | Game count in range |
| `genre_active` | `genre` | Currently developing genre |
| `day_of_year` | `day` | Specific day (1-365) |
| `random` | `probability` | Random chance (0-1) |
| `previous_choice` | `eventId`, `choiceId` | After specific choice |
| `never` | - | Never triggers (disabled) |

---

### Gacha Items

Items that can be obtained from gacha pulls.

```json
{
  "items": [
    {
      "id": "mod_summer_hero",
      "name": "Summer Hero",
      "rarity": "legendary",
      "type": "character",
      "description": "A legendary hero in summer attire.",
      "artCost": 20000,
      "designCost": 10000
    },
    {
      "id": "mod_beach_sword",
      "name": "Beach Blade",
      "rarity": "epic",
      "type": "weapon",
      "description": "A sword made from enchanted driftwood."
    }
  ]
}
```

#### Rarities

| Rarity | Color | Typical Rate |
|--------|-------|--------------|
| `common` | Gray | 60% |
| `uncommon` | Green | 25% |
| `rare` | Blue | 10% |
| `epic` | Purple | 4% |
| `legendary` | Gold | 1% |

#### Item Types

| Type | Description |
|------|-------------|
| `character` | Playable characters |
| `weapon` | Equipment |
| `artifact` | Stat boosters |
| `costume` | Cosmetic skins |

---

### Banners

Themed gacha events with specific items.

```json
{
  "banners": [
    {
      "id": "mod_summer_banner",
      "name": "Summer Splash Festival",
      "featuredItems": ["mod_summer_hero"],
      "itemPool": ["mod_summer_hero", "mod_beach_sword"],
      "duration": 336,
      "rates": {
        "common": 0.55,
        "uncommon": 0.25,
        "rare": 0.12,
        "epic": 0.05,
        "legendary": 0.03
      },
      "rateUpMultiplier": 2.5,
      "pullCost": { "gems": 300, "tickets": 1 },
      "pityCounter": 80,
      "isLimited": true
    }
  ]
}
```

> **Note**: Duration is in game ticks (default: 1 tick = 1 day). 336 ticks = 2 weeks.

---

### Achievements

Milestones that reward players.

```json
{
  "achievements": [
    {
      "id": "mod_gacha_master",
      "name": "Gacha Master",
      "description": "Pull 1000 items from gacha banners",
      "icon": "🎰",
      "category": "gacha",
      "rarity": "epic",
      "hidden": false,
      "condition": {
        "type": "total_pulls",
        "value": 1000
      },
      "rewards": {
        "prestigePoints": 50,
        "unlocks": ["gacha_master_title"]
      }
    }
  ]
}
```

#### Achievement Categories

`wealth`, `games`, `employees`, `reputation`, `gacha`, `research`, `special`

---

### Research Nodes

Tech tree unlocks.

```json
{
  "research": [
    {
      "id": "mod_advanced_analytics",
      "name": "Advanced Player Analytics",
      "description": "Unlock detailed player behavior tracking.",
      "category": "technology",
      "tier": 3,
      "cost": {
        "researchPoints": 300,
        "money": 25000
      },
      "prerequisites": ["basic_analytics"],
      "duration": 14,
      "effects": [
        { "type": "unlock_feature", "feature": "heatmaps" },
        { "type": "modifier", "stat": "retention_bonus", "value": 0.05 }
      ]
    }
  ]
}
```

---

### Balance Overrides

Modify game economy values.

```json
{
  "balanceOverrides": [
    {
      "path": "economy.baseArpu",
      "value": 3.00,
      "operation": "set"
    },
    {
      "path": "gacha.defaultPityCounter",
      "value": -10,
      "operation": "add"
    },
    {
      "path": "economy.marketingEfficiency",
      "value": 1.2,
      "operation": "multiply"
    }
  ]
}
```

#### Operations

| Operation | Description |
|-----------|-------------|
| `set` | Replace value (default) |
| `add` | Add to current value |
| `multiply` | Multiply current value |

#### Allowed Paths

| Path | Description |
|------|-------------|
| `economy.baseArpu` | Base ARPU value |
| `economy.serverCostPer1kUsers` | Server cost per 1000 users |
| `economy.marketingEfficiency` | Marketing effectiveness |
| `gacha.defaultPityCounter` | Default pity threshold |
| `gacha.softPityStart` | Soft pity start point |
| `gacha.rateUpMultiplier` | Featured rate boost |
| `reputation.maxReputation` | Maximum reputation |
| `reputation.minReputation` | Minimum reputation |
| `employee.moraleDecayRate` | Morale decay speed |
| `employee.skillGrowthRate` | Skill growth speed |

---

### Translations

Add or override text in different languages.

```json
{
  "translations": [
    {
      "locale": "es",
      "strings": {
        "ui.menu.start": "Comenzar",
        "event.mod_investor_visit.title": "Inversor Inesperado",
        "event.mod_investor_visit.description": "Un inversor adinerado..."
      }
    }
  ]
}
```

---

## Validation

### Using the Validator

The game validates mods before loading:

```
✅ Valid mod pack
⚠️ 2 warnings:
   - manifest: description is recommended
   - events[0]: Large reputation changes (>50) may unbalance the game
```

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "id is required" | Missing ID field | Add unique ID |
| "Invalid category" | Unknown category | Use valid category |
| "Duplicate id" | Same ID used twice | Use unique IDs |
| "Path is not modifiable" | Forbidden balance path | Use allowed path |

### Testing Your Mod

1. Open the game's debug console (Shift+`)
2. Use `loadmod <path>` to test
3. Check for validation errors
4. Test in-game effects

---

## Best Practices

### Naming Conventions

- **IDs**: Use lowercase with underscores: `mod_my_event`
- **Prefix with mod name**: `coolmod_summer_hero`
- **Be descriptive**: `winter_festival_banner` not `banner1`

### Balance Guidelines

1. **Test extensively** before releasing
2. **Small changes first**: ±10% adjustments
3. **Consider difficulty modes**: Your mod affects all modes
4. **Document changes**: Explain what your mod changes

### Compatibility

1. **Declare dependencies** if you rely on other mods
2. **Declare conflicts** if incompatible with other mods
3. **Use unique IDs** with your mod name prefix
4. **Don't override base game IDs** unless intentional

### Content Quality

1. **Proofread text** for spelling/grammar
2. **Balance rewards and costs** realistically
3. **Write engaging event descriptions**
4. **Consider ethical implications** of choices

---

## Example Mods

### Simple Event Pack

```json
{
  "manifest": {
    "id": "holiday-events",
    "name": "Holiday Events Pack",
    "version": "1.0.0",
    "author": "ModAuthor",
    "description": "Adds seasonal holiday events",
    "gameVersion": "1.0.0"
  },
  "events": [
    {
      "id": "holiday_christmas_bonus",
      "title": "Holiday Spirit",
      "description": "The holiday season brings joy to your employees. They're expecting a Christmas bonus.",
      "category": "employee",
      "severity": "moderate",
      "choices": [
        {
          "id": "generous_bonus",
          "text": "Give a generous bonus to everyone",
          "effects": [
            { "type": "money", "value": -50000 },
            { "type": "employee_morale", "value": 30 },
            { "type": "reputation", "value": 5 }
          ],
          "ethicalScore": 40
        },
        {
          "id": "modest_bonus",
          "text": "Give a modest bonus",
          "effects": [
            { "type": "money", "value": -20000 },
            { "type": "employee_morale", "value": 10 }
          ],
          "ethicalScore": 10
        },
        {
          "id": "no_bonus",
          "text": "Skip bonuses this year",
          "effects": [
            { "type": "employee_morale", "value": -20 },
            { "type": "reputation", "value": -5 }
          ],
          "ethicalScore": -30
        }
      ],
      "triggerConditions": [
        { "type": "day_of_year", "day": 355 },
        { "type": "employee_count", "min": 5 }
      ],
      "cooldownDays": 365,
      "isUnique": false,
      "weight": 1.0
    }
  ]
}
```

### Gacha Content Pack

```json
{
  "manifest": {
    "id": "mythical-heroes",
    "name": "Mythical Heroes Collection",
    "version": "1.0.0",
    "author": "ModAuthor",
    "description": "Adds legendary heroes from mythology",
    "gameVersion": "1.0.0"
  },
  "items": [
    {
      "id": "myth_zeus",
      "name": "Zeus, King of Gods",
      "rarity": "legendary",
      "type": "character",
      "description": "The mighty ruler of Mount Olympus."
    },
    {
      "id": "myth_thor",
      "name": "Thor, God of Thunder",
      "rarity": "legendary",
      "type": "character",
      "description": "The Norse god wielding Mjolnir."
    },
    {
      "id": "myth_mjolnir",
      "name": "Mjolnir",
      "rarity": "epic",
      "type": "weapon",
      "description": "Thor's legendary hammer."
    }
  ],
  "banners": [
    {
      "id": "myth_norse_banner",
      "name": "Norse Legends",
      "featuredItems": ["myth_thor"],
      "itemPool": ["myth_thor", "myth_mjolnir"],
      "duration": 168,
      "rateUpMultiplier": 2.0,
      "pityCounter": 90,
      "isLimited": true
    }
  ]
}
```

### Difficulty Mod

```json
{
  "manifest": {
    "id": "hardcore-mode",
    "name": "Hardcore Mode",
    "version": "1.0.0",
    "author": "ModAuthor",
    "description": "Makes the game significantly harder",
    "gameVersion": "1.0.0"
  },
  "balanceOverrides": [
    { "path": "economy.baseArpu", "value": 0.7, "operation": "multiply" },
    { "path": "economy.serverCostPer1kUsers", "value": 1.5, "operation": "multiply" },
    { "path": "employee.moraleDecayRate", "value": 1.3, "operation": "multiply" },
    { "path": "gacha.defaultPityCounter", "value": 20, "operation": "add" }
  ]
}
```

---

## Support

- **Bug Reports**: Open an issue on GitHub
- **Questions**: Check the FAQ or community forums
- **Showcase**: Share your mods in the community gallery

Happy modding! 🎮
