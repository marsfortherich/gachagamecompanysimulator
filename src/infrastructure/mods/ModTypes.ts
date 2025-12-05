/**
 * Mod Pack Types - Prompt 11.2
 * 
 * Type definitions for third-party content packs.
 * Supports custom events, items, balance tweaks, and translations.
 */

// =============================================================================
// Mod Pack Manifest
// =============================================================================

export interface ModPackManifest {
  readonly id: string;                    // Unique mod identifier
  readonly name: string;                  // Display name
  readonly version: string;               // Semantic version
  readonly author: string;                // Creator name
  readonly description: string;           // Short description
  readonly gameVersion: string;           // Compatible game version
  readonly dependencies?: string[];       // Required mod IDs
  readonly conflicts?: string[];          // Incompatible mod IDs
  readonly homepage?: string;             // URL to mod page
  readonly license?: string;              // License identifier
}

// =============================================================================
// Content Types
// =============================================================================

export interface ModEventDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly severity: string;
  readonly choices: ModEventChoice[];
  readonly triggerConditions: ModTriggerCondition[];
  readonly cooldownDays: number;
  readonly isUnique: boolean;
  readonly weight: number;
}

export interface ModEventChoice {
  readonly id: string;
  readonly text: string;
  readonly effects: ModEffect[];
  readonly ethicalScore: number;
  readonly chainEventId?: string;
  readonly requiredMoney?: number;
}

export interface ModEffect {
  readonly type: string;
  readonly value: number;
  readonly duration?: number;
  readonly delayed?: number;
}

export interface ModTriggerCondition {
  readonly type: string;
  readonly value?: number;
  readonly min?: number;
  readonly max?: number;
  readonly genre?: string;
  readonly eventId?: string;
  readonly choiceId?: string;
  readonly probability?: number;
}

export interface ModGachaItem {
  readonly id: string;
  readonly name: string;
  readonly rarity: string;
  readonly type: string;
  readonly description: string;
  readonly artCost?: number;
  readonly designCost?: number;
}

export interface ModBanner {
  readonly id: string;
  readonly name: string;
  readonly featuredItems: string[];
  readonly itemPool: string[];
  readonly duration: number;
  readonly rates?: Record<string, number>;
  readonly rateUpMultiplier?: number;
  readonly pullCost?: { gems: number; tickets: number };
  readonly pityCounter?: number;
  readonly isLimited?: boolean;
}

export interface ModBalanceOverride {
  readonly path: string;           // Dot notation path (e.g., "economy.baseArpu")
  readonly value: number | string | boolean;
  readonly operation?: 'set' | 'add' | 'multiply';
}

export interface ModAchievement {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly category: string;
  readonly rarity: string;
  readonly hidden: boolean;
  readonly condition: {
    readonly type: string;
    readonly value: number;
  };
  readonly rewards?: {
    readonly prestigePoints?: number;
    readonly unlocks?: string[];
  };
}

export interface ModResearchNode {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly tier: number;
  readonly cost: {
    readonly researchPoints: number;
    readonly money?: number;
  };
  readonly prerequisites: string[];
  readonly duration: number;
  readonly effects: Array<{
    readonly type: string;
    readonly [key: string]: unknown;
  }>;
}

export interface ModTranslation {
  readonly locale: string;
  readonly strings: Record<string, string>;
}

// =============================================================================
// Complete Mod Pack Structure
// =============================================================================

export interface ModPack {
  readonly manifest: ModPackManifest;
  readonly events?: ModEventDefinition[];
  readonly items?: ModGachaItem[];
  readonly banners?: ModBanner[];
  readonly achievements?: ModAchievement[];
  readonly research?: ModResearchNode[];
  readonly balanceOverrides?: ModBalanceOverride[];
  readonly translations?: ModTranslation[];
}

// =============================================================================
// Validation Result
// =============================================================================

export interface ModValidationError {
  readonly path: string;
  readonly message: string;
  readonly severity: 'error' | 'warning';
}

export interface ModValidationResult {
  readonly valid: boolean;
  readonly errors: ModValidationError[];
  readonly warnings: ModValidationError[];
}

// =============================================================================
// Loader State
// =============================================================================

export interface LoadedMod {
  readonly pack: ModPack;
  readonly enabled: boolean;
  readonly loadOrder: number;
  readonly loadedAt: number;
}

export interface ModLoaderState {
  readonly mods: Map<string, LoadedMod>;
  readonly loadOrder: string[];
  readonly conflicts: Array<{ modA: string; modB: string; reason: string }>;
}
