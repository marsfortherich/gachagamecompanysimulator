/**
 * Mod Validator - Prompt 11.2
 * 
 * Validates third-party content packs for structure, safety, and compatibility.
 */

import {
  ModPack,
  ModPackManifest,
  ModEventDefinition,
  ModGachaItem,
  ModBanner,
  ModBalanceOverride,
  ModValidationResult,
  ModValidationError,
  ModAchievement,
  ModResearchNode,
} from './ModTypes';

// =============================================================================
// Allowed Values
// =============================================================================

const VALID_EVENT_CATEGORIES = ['random', 'ethical_dilemma', 'market', 'employee', 'regulatory', 'viral', 'disaster'];
const VALID_EVENT_SEVERITIES = ['minor', 'moderate', 'major', 'critical'];
const VALID_EFFECT_TYPES = ['reputation', 'money', 'employee_morale', 'player_count', 'revenue_modifier', 'cost_modifier'];
const VALID_TRIGGER_TYPES = ['reputation_above', 'reputation_below', 'money_above', 'money_below', 'employee_count', 'game_count', 'genre_active', 'day_of_year', 'random', 'previous_choice', 'never'];
const VALID_RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const VALID_ITEM_TYPES = ['character', 'weapon', 'artifact', 'costume'];
const VALID_GENRES = ['rpg', 'action', 'puzzle', 'strategy', 'idle', 'card', 'rhythm'];
const VALID_ACHIEVEMENT_CATEGORIES = ['wealth', 'games', 'employees', 'reputation', 'gacha', 'research', 'special'];

// Paths that mods can override in balance config
const ALLOWED_BALANCE_PATHS = [
  'economy.baseArpu',
  'economy.serverCostPer1kUsers',
  'economy.marketingEfficiency',
  'gacha.defaultPityCounter',
  'gacha.softPityStart',
  'gacha.rateUpMultiplier',
  'reputation.maxReputation',
  'reputation.minReputation',
  'employee.moraleDecayRate',
  'employee.skillGrowthRate',
];

// =============================================================================
// Validator Class
// =============================================================================

export class ModValidator {
  private errors: ModValidationError[] = [];
  private warnings: ModValidationError[] = [];

  /**
   * Validate a complete mod pack
   */
  validate(pack: ModPack): ModValidationResult {
    this.errors = [];
    this.warnings = [];

    // Validate manifest (required)
    this.validateManifest(pack.manifest);

    // Validate content sections
    if (pack.events) {
      this.validateEvents(pack.events);
    }
    if (pack.items) {
      this.validateItems(pack.items);
    }
    if (pack.banners) {
      this.validateBanners(pack.banners, pack.items ?? []);
    }
    if (pack.achievements) {
      this.validateAchievements(pack.achievements);
    }
    if (pack.research) {
      this.validateResearch(pack.research);
    }
    if (pack.balanceOverrides) {
      this.validateBalanceOverrides(pack.balanceOverrides);
    }

    return {
      valid: this.errors.length === 0,
      errors: [...this.errors],
      warnings: [...this.warnings],
    };
  }

  // ===========================================================================
  // Manifest Validation
  // ===========================================================================

  private validateManifest(manifest: ModPackManifest): void {
    const path = 'manifest';

    // Required fields
    if (!manifest.id || typeof manifest.id !== 'string') {
      this.addError(path, 'id is required and must be a string');
    } else if (!/^[a-z0-9_-]+$/i.test(manifest.id)) {
      this.addError(path, 'id must contain only alphanumeric characters, underscores, and hyphens');
    }

    if (!manifest.name || typeof manifest.name !== 'string') {
      this.addError(path, 'name is required and must be a string');
    }

    if (!manifest.version || typeof manifest.version !== 'string') {
      this.addError(path, 'version is required and must be a string');
    } else if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
      this.addWarning(path, 'version should follow semantic versioning (e.g., 1.0.0)');
    }

    if (!manifest.author || typeof manifest.author !== 'string') {
      this.addError(path, 'author is required and must be a string');
    }

    if (!manifest.description || typeof manifest.description !== 'string') {
      this.addWarning(path, 'description is recommended');
    }

    if (!manifest.gameVersion || typeof manifest.gameVersion !== 'string') {
      this.addError(path, 'gameVersion is required to ensure compatibility');
    }
  }

  // ===========================================================================
  // Event Validation
  // ===========================================================================

  private validateEvents(events: ModEventDefinition[]): void {
    const seenIds = new Set<string>();

    events.forEach((event, index) => {
      const path = `events[${index}]`;

      // Check for duplicate IDs
      if (seenIds.has(event.id)) {
        this.addError(path, `Duplicate event id: ${event.id}`);
      }
      seenIds.add(event.id);

      // Required fields
      if (!event.id) this.addError(path, 'id is required');
      if (!event.title) this.addError(path, 'title is required');
      if (!event.description) this.addError(path, 'description is required');

      // Validate category
      if (!VALID_EVENT_CATEGORIES.includes(event.category)) {
        this.addError(path, `Invalid category: ${event.category}. Valid: ${VALID_EVENT_CATEGORIES.join(', ')}`);
      }

      // Validate severity
      if (!VALID_EVENT_SEVERITIES.includes(event.severity)) {
        this.addError(path, `Invalid severity: ${event.severity}. Valid: ${VALID_EVENT_SEVERITIES.join(', ')}`);
      }

      // Validate choices
      if (!event.choices || event.choices.length === 0) {
        this.addError(path, 'At least one choice is required');
      } else {
        event.choices.forEach((choice, choiceIndex) => {
          this.validateEventChoice(choice, `${path}.choices[${choiceIndex}]`);
        });
      }

      // Validate trigger conditions
      if (event.triggerConditions) {
        event.triggerConditions.forEach((condition, condIndex) => {
          this.validateTriggerCondition(condition, `${path}.triggerConditions[${condIndex}]`);
        });
      }

      // Validate numeric ranges
      if (event.cooldownDays < 0) {
        this.addError(path, 'cooldownDays must be non-negative');
      }
      if (event.weight <= 0) {
        this.addError(path, 'weight must be positive');
      }
    });
  }

  private validateEventChoice(choice: { id: string; text: string; effects: Array<{ type: string; value: number }>; ethicalScore: number }, path: string): void {
    if (!choice.id) this.addError(path, 'choice id is required');
    if (!choice.text) this.addError(path, 'choice text is required');

    if (choice.ethicalScore < -100 || choice.ethicalScore > 100) {
      this.addWarning(path, 'ethicalScore should be between -100 and 100');
    }

    if (choice.effects) {
      choice.effects.forEach((effect, effectIndex) => {
        this.validateEffect(effect, `${path}.effects[${effectIndex}]`);
      });
    }
  }

  private validateEffect(effect: { type: string; value: number; duration?: number; delayed?: number }, path: string): void {
    if (!VALID_EFFECT_TYPES.includes(effect.type)) {
      this.addError(path, `Invalid effect type: ${effect.type}. Valid: ${VALID_EFFECT_TYPES.join(', ')}`);
    }

    if (typeof effect.value !== 'number') {
      this.addError(path, 'effect value must be a number');
    }

    // Validate reasonable ranges for effects
    if (effect.type === 'reputation' && Math.abs(effect.value) > 50) {
      this.addWarning(path, 'Large reputation changes (>50) may unbalance the game');
    }
    if (effect.type === 'money' && Math.abs(effect.value) > 500000) {
      this.addWarning(path, 'Large money changes (>$500,000) may unbalance the game');
    }

    if (effect.duration !== undefined && effect.duration < 0) {
      this.addError(path, 'duration must be non-negative');
    }
    if (effect.delayed !== undefined && effect.delayed < 0) {
      this.addError(path, 'delayed must be non-negative');
    }
  }

  private validateTriggerCondition(condition: { type: string; value?: number; probability?: number; genre?: string }, path: string): void {
    if (!VALID_TRIGGER_TYPES.includes(condition.type)) {
      this.addError(path, `Invalid trigger type: ${condition.type}. Valid: ${VALID_TRIGGER_TYPES.join(', ')}`);
    }

    if (condition.type === 'random' && condition.probability !== undefined) {
      if (condition.probability < 0 || condition.probability > 1) {
        this.addError(path, 'probability must be between 0 and 1');
      }
    }

    if (condition.type === 'genre_active' && condition.genre) {
      if (!VALID_GENRES.includes(condition.genre)) {
        this.addError(path, `Invalid genre: ${condition.genre}. Valid: ${VALID_GENRES.join(', ')}`);
      }
    }
  }

  // ===========================================================================
  // Item Validation
  // ===========================================================================

  private validateItems(items: ModGachaItem[]): void {
    const seenIds = new Set<string>();

    items.forEach((item, index) => {
      const path = `items[${index}]`;

      if (seenIds.has(item.id)) {
        this.addError(path, `Duplicate item id: ${item.id}`);
      }
      seenIds.add(item.id);

      if (!item.id) this.addError(path, 'id is required');
      if (!item.name) this.addError(path, 'name is required');

      if (!VALID_RARITIES.includes(item.rarity)) {
        this.addError(path, `Invalid rarity: ${item.rarity}. Valid: ${VALID_RARITIES.join(', ')}`);
      }

      if (!VALID_ITEM_TYPES.includes(item.type)) {
        this.addError(path, `Invalid item type: ${item.type}. Valid: ${VALID_ITEM_TYPES.join(', ')}`);
      }

      if (item.artCost !== undefined && item.artCost < 0) {
        this.addError(path, 'artCost must be non-negative');
      }
      if (item.designCost !== undefined && item.designCost < 0) {
        this.addError(path, 'designCost must be non-negative');
      }
    });
  }

  // ===========================================================================
  // Banner Validation
  // ===========================================================================

  private validateBanners(banners: ModBanner[], items: ModGachaItem[]): void {
    const itemIds = new Set(items.map(i => i.id));
    const seenIds = new Set<string>();

    banners.forEach((banner, index) => {
      const path = `banners[${index}]`;

      if (seenIds.has(banner.id)) {
        this.addError(path, `Duplicate banner id: ${banner.id}`);
      }
      seenIds.add(banner.id);

      if (!banner.id) this.addError(path, 'id is required');
      if (!banner.name) this.addError(path, 'name is required');

      // Check item references
      banner.featuredItems.forEach(itemId => {
        if (!itemIds.has(itemId)) {
          this.addWarning(path, `Featured item "${itemId}" not found in mod items. It must exist in base game or another mod.`);
        }
      });

      banner.itemPool.forEach(itemId => {
        if (!itemIds.has(itemId)) {
          this.addWarning(path, `Pool item "${itemId}" not found in mod items. It must exist in base game or another mod.`);
        }
      });

      if (banner.duration <= 0) {
        this.addError(path, 'duration must be positive');
      }

      if (banner.rates) {
        const totalRate = Object.values(banner.rates).reduce((sum, rate) => sum + rate, 0);
        if (Math.abs(totalRate - 1.0) > 0.001) {
          this.addWarning(path, `Rates sum to ${totalRate}, expected 1.0`);
        }
      }

      if (banner.pityCounter !== undefined && banner.pityCounter < 1) {
        this.addError(path, 'pityCounter must be at least 1');
      }
    });
  }

  // ===========================================================================
  // Achievement Validation
  // ===========================================================================

  private validateAchievements(achievements: ModAchievement[]): void {
    const seenIds = new Set<string>();

    achievements.forEach((achievement, index) => {
      const path = `achievements[${index}]`;

      if (seenIds.has(achievement.id)) {
        this.addError(path, `Duplicate achievement id: ${achievement.id}`);
      }
      seenIds.add(achievement.id);

      if (!achievement.id) this.addError(path, 'id is required');
      if (!achievement.name) this.addError(path, 'name is required');

      if (!VALID_ACHIEVEMENT_CATEGORIES.includes(achievement.category)) {
        this.addWarning(path, `Unknown category: ${achievement.category}. Standard: ${VALID_ACHIEVEMENT_CATEGORIES.join(', ')}`);
      }

      if (!VALID_RARITIES.includes(achievement.rarity)) {
        this.addError(path, `Invalid rarity: ${achievement.rarity}. Valid: ${VALID_RARITIES.join(', ')}`);
      }

      if (!achievement.condition || !achievement.condition.type) {
        this.addError(path, 'condition with type is required');
      }
    });
  }

  // ===========================================================================
  // Research Validation
  // ===========================================================================

  private validateResearch(research: ModResearchNode[]): void {
    const seenIds = new Set<string>();
    const allIds = new Set(research.map(r => r.id));

    research.forEach((node, index) => {
      const path = `research[${index}]`;

      if (seenIds.has(node.id)) {
        this.addError(path, `Duplicate research id: ${node.id}`);
      }
      seenIds.add(node.id);

      if (!node.id) this.addError(path, 'id is required');
      if (!node.name) this.addError(path, 'name is required');

      if (node.tier < 1 || node.tier > 10) {
        this.addWarning(path, 'tier should typically be between 1 and 10');
      }

      if (node.cost.researchPoints <= 0) {
        this.addError(path, 'researchPoints cost must be positive');
      }

      // Check prerequisites exist (either in mod or warn about base game)
      node.prerequisites.forEach(prereq => {
        if (!allIds.has(prereq)) {
          this.addWarning(path, `Prerequisite "${prereq}" not in mod. It must exist in base game.`);
        }
      });

      // Check for circular dependencies
      if (node.prerequisites.includes(node.id)) {
        this.addError(path, 'Research node cannot be its own prerequisite');
      }
    });
  }

  // ===========================================================================
  // Balance Override Validation
  // ===========================================================================

  private validateBalanceOverrides(overrides: ModBalanceOverride[]): void {
    overrides.forEach((override, index) => {
      const path = `balanceOverrides[${index}]`;

      if (!override.path) {
        this.addError(path, 'path is required');
        return;
      }

      // Check if path is allowed
      if (!ALLOWED_BALANCE_PATHS.includes(override.path)) {
        this.addError(path, `Path "${override.path}" is not modifiable. Allowed paths: ${ALLOWED_BALANCE_PATHS.join(', ')}`);
      }

      // Validate operation
      const validOps = ['set', 'add', 'multiply'];
      if (override.operation && !validOps.includes(override.operation)) {
        this.addError(path, `Invalid operation: ${override.operation}. Valid: ${validOps.join(', ')}`);
      }

      // Check for extreme values
      if (typeof override.value === 'number') {
        if (override.operation === 'multiply' && (override.value < 0.1 || override.value > 10)) {
          this.addWarning(path, 'Extreme multiplier values may unbalance the game');
        }
      }
    });
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  private addError(path: string, message: string): void {
    this.errors.push({ path, message, severity: 'error' });
  }

  private addWarning(path: string, message: string): void {
    this.warnings.push({ path, message, severity: 'warning' });
  }
}

// =============================================================================
// Convenience Function
// =============================================================================

export function validateModPack(pack: ModPack): ModValidationResult {
  const validator = new ModValidator();
  return validator.validate(pack);
}
