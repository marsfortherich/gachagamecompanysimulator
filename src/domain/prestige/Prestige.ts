/**
 * Prestige System Domain - Prompt 7.3
 * 
 * New Game+ / Prestige system with Legacy Points and permanent upgrades.
 */

// =============================================================================
// Types
// =============================================================================

export type PrestigeUpgradeId = string & { readonly brand: unique symbol };

export type PrestigeUpgradeCategory =
  | 'production'   // Game development boosts
  | 'financial'    // Revenue/cost modifiers
  | 'employees'    // Employee stats
  | 'gacha'        // Gacha rates
  | 'research'     // Research speed
  | 'reputation'   // Reputation gains
  | 'starting';    // Starting bonuses

export interface PrestigeUpgrade {
  id: PrestigeUpgradeId;
  name: string;
  description: string;
  icon: string;
  category: PrestigeUpgradeCategory;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number; // Cost = baseCost * (costMultiplier ^ currentLevel)
  effect: PrestigeEffect;
  prerequisite?: PrestigeUpgradeId;
  order: number;
}

export interface PrestigeEffect {
  type: PrestigeEffectType;
  baseValue: number;
  perLevel: number;
  isPercentage: boolean;
}

export type PrestigeEffectType =
  | 'startingMoney'
  | 'startingReputation'
  | 'devSpeedBonus'
  | 'gameQualityBonus'
  | 'revenueMultiplier'
  | 'costReduction'
  | 'employeeSkillBonus'
  | 'employeeMoraleBonus'
  | 'hiringCostReduction'
  | 'gachaRateBonus'
  | 'pityReduction'
  | 'researchSpeedBonus'
  | 'researchCostReduction'
  | 'reputationGainBonus'
  | 'marketShareBonus'
  | 'criticalSuccessChance';

export interface PrestigeRun {
  runNumber: number;
  startedAt: number;
  endedAt: number;
  daysPlayed: number;
  legacyPointsEarned: number;
  maxRevenue: number;
  maxReputation: number;
  gamesLaunched: number;
  peakEmployees: number;
  achievementsUnlocked: number;
  milestones: PrestigeMilestone[];
}

export interface PrestigeMilestone {
  id: string;
  name: string;
  description: string;
  reachedAt: number; // Day number when reached
}

export interface PrestigeState {
  totalLegacyPoints: number;
  availableLegacyPoints: number;
  lifetimeLegacyPointsEarned: number;
  upgrades: Record<string, number>; // upgradeId -> level
  currentRun: number;
  runHistory: PrestigeRun[];
  totalPrestigeCount: number;
  firstPrestigeDate: number | null;
  lastPrestigeDate: number | null;
  unlockedMilestones: string[];
}

// =============================================================================
// Prestige Upgrade Definitions
// =============================================================================

function createUpgradeId(id: string): PrestigeUpgradeId {
  return id as PrestigeUpgradeId;
}

export const PRESTIGE_UPGRADES: PrestigeUpgrade[] = [
  // =========================================================================
  // STARTING BONUSES
  // =========================================================================
  {
    id: createUpgradeId('starting_funds'),
    name: 'Trust Fund',
    description: 'Start with additional money',
    icon: '💰',
    category: 'starting',
    maxLevel: 10,
    baseCost: 100,
    costMultiplier: 1.8,
    effect: {
      type: 'startingMoney',
      baseValue: 0,
      perLevel: 5000,
      isPercentage: false,
    },
    order: 1,
  },
  {
    id: createUpgradeId('starting_rep'),
    name: 'Industry Connections',
    description: 'Start with higher reputation',
    icon: '🌟',
    category: 'starting',
    maxLevel: 5,
    baseCost: 150,
    costMultiplier: 2.0,
    effect: {
      type: 'startingReputation',
      baseValue: 0,
      perLevel: 10,
      isPercentage: false,
    },
    order: 2,
  },

  // =========================================================================
  // PRODUCTION UPGRADES
  // =========================================================================
  {
    id: createUpgradeId('dev_speed'),
    name: 'Efficient Workflows',
    description: 'Increase development speed',
    icon: '⚡',
    category: 'production',
    maxLevel: 10,
    baseCost: 75,
    costMultiplier: 1.6,
    effect: {
      type: 'devSpeedBonus',
      baseValue: 0,
      perLevel: 5,
      isPercentage: true,
    },
    order: 1,
  },
  {
    id: createUpgradeId('quality_boost'),
    name: 'Quality Standards',
    description: 'Increase base game quality',
    icon: '✨',
    category: 'production',
    maxLevel: 10,
    baseCost: 100,
    costMultiplier: 1.7,
    effect: {
      type: 'gameQualityBonus',
      baseValue: 0,
      perLevel: 3,
      isPercentage: true,
    },
    order: 2,
  },
  {
    id: createUpgradeId('critical_success'),
    name: 'Lightning in a Bottle',
    description: 'Chance for games to be critical successes',
    icon: '🎯',
    category: 'production',
    maxLevel: 5,
    baseCost: 500,
    costMultiplier: 2.5,
    effect: {
      type: 'criticalSuccessChance',
      baseValue: 0,
      perLevel: 2,
      isPercentage: true,
    },
    prerequisite: createUpgradeId('quality_boost'),
    order: 3,
  },

  // =========================================================================
  // FINANCIAL UPGRADES
  // =========================================================================
  {
    id: createUpgradeId('revenue_boost'),
    name: 'Market Leverage',
    description: 'Increase all revenue',
    icon: '📈',
    category: 'financial',
    maxLevel: 10,
    baseCost: 100,
    costMultiplier: 1.8,
    effect: {
      type: 'revenueMultiplier',
      baseValue: 0,
      perLevel: 5,
      isPercentage: true,
    },
    order: 1,
  },
  {
    id: createUpgradeId('cost_reduction'),
    name: 'Lean Operations',
    description: 'Reduce all costs',
    icon: '💸',
    category: 'financial',
    maxLevel: 10,
    baseCost: 100,
    costMultiplier: 1.7,
    effect: {
      type: 'costReduction',
      baseValue: 0,
      perLevel: 3,
      isPercentage: true,
    },
    order: 2,
  },

  // =========================================================================
  // EMPLOYEE UPGRADES
  // =========================================================================
  {
    id: createUpgradeId('employee_skill'),
    name: 'Training Programs',
    description: 'Employees start with higher skills',
    icon: '📚',
    category: 'employees',
    maxLevel: 10,
    baseCost: 80,
    costMultiplier: 1.6,
    effect: {
      type: 'employeeSkillBonus',
      baseValue: 0,
      perLevel: 5,
      isPercentage: true,
    },
    order: 1,
  },
  {
    id: createUpgradeId('employee_morale'),
    name: 'Company Culture',
    description: 'Employees have higher base morale',
    icon: '😊',
    category: 'employees',
    maxLevel: 5,
    baseCost: 100,
    costMultiplier: 1.8,
    effect: {
      type: 'employeeMoraleBonus',
      baseValue: 0,
      perLevel: 5,
      isPercentage: true,
    },
    order: 2,
  },
  {
    id: createUpgradeId('hiring_discount'),
    name: 'Recruiting Network',
    description: 'Reduce hiring costs',
    icon: '🤝',
    category: 'employees',
    maxLevel: 5,
    baseCost: 120,
    costMultiplier: 1.9,
    effect: {
      type: 'hiringCostReduction',
      baseValue: 0,
      perLevel: 10,
      isPercentage: true,
    },
    order: 3,
  },

  // =========================================================================
  // GACHA UPGRADES
  // =========================================================================
  {
    id: createUpgradeId('gacha_luck'),
    name: 'Lucky Stars',
    description: 'Increase gacha rare rates',
    icon: '🍀',
    category: 'gacha',
    maxLevel: 10,
    baseCost: 150,
    costMultiplier: 1.9,
    effect: {
      type: 'gachaRateBonus',
      baseValue: 0,
      perLevel: 2,
      isPercentage: true,
    },
    order: 1,
  },
  {
    id: createUpgradeId('pity_reduction'),
    name: 'Guaranteed Fortune',
    description: 'Reduce pity counter requirement',
    icon: '🎰',
    category: 'gacha',
    maxLevel: 5,
    baseCost: 300,
    costMultiplier: 2.2,
    effect: {
      type: 'pityReduction',
      baseValue: 0,
      perLevel: 5,
      isPercentage: true,
    },
    prerequisite: createUpgradeId('gacha_luck'),
    order: 2,
  },

  // =========================================================================
  // RESEARCH UPGRADES
  // =========================================================================
  {
    id: createUpgradeId('research_speed'),
    name: 'R&D Department',
    description: 'Increase research speed',
    icon: '🔬',
    category: 'research',
    maxLevel: 10,
    baseCost: 100,
    costMultiplier: 1.7,
    effect: {
      type: 'researchSpeedBonus',
      baseValue: 0,
      perLevel: 5,
      isPercentage: true,
    },
    order: 1,
  },
  {
    id: createUpgradeId('research_discount'),
    name: 'Knowledge Base',
    description: 'Reduce research costs',
    icon: '📖',
    category: 'research',
    maxLevel: 5,
    baseCost: 150,
    costMultiplier: 2.0,
    effect: {
      type: 'researchCostReduction',
      baseValue: 0,
      perLevel: 8,
      isPercentage: true,
    },
    order: 2,
  },

  // =========================================================================
  // REPUTATION UPGRADES
  // =========================================================================
  {
    id: createUpgradeId('rep_gain'),
    name: 'Brand Recognition',
    description: 'Increase reputation gains',
    icon: '📣',
    category: 'reputation',
    maxLevel: 10,
    baseCost: 80,
    costMultiplier: 1.6,
    effect: {
      type: 'reputationGainBonus',
      baseValue: 0,
      perLevel: 5,
      isPercentage: true,
    },
    order: 1,
  },
  {
    id: createUpgradeId('market_dominance'),
    name: 'Market Dominance',
    description: 'Increase market share gains',
    icon: '🏆',
    category: 'reputation',
    maxLevel: 5,
    baseCost: 200,
    costMultiplier: 2.0,
    effect: {
      type: 'marketShareBonus',
      baseValue: 0,
      perLevel: 5,
      isPercentage: true,
    },
    prerequisite: createUpgradeId('rep_gain'),
    order: 2,
  },
];

// =============================================================================
// Milestone Definitions
// =============================================================================

export interface PrestigeMilestoneDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  legacyPointBonus: number;
  condition: (run: Partial<PrestigeRun>) => boolean;
}

export const PRESTIGE_MILESTONES: PrestigeMilestoneDefinition[] = [
  {
    id: 'first_game',
    name: 'Game Developer',
    description: 'Launch your first game',
    icon: '🎮',
    legacyPointBonus: 10,
    condition: (run) => (run.gamesLaunched ?? 0) >= 1,
  },
  {
    id: 'prolific_dev',
    name: 'Prolific Developer',
    description: 'Launch 10 games',
    icon: '🎮',
    legacyPointBonus: 50,
    condition: (run) => (run.gamesLaunched ?? 0) >= 10,
  },
  {
    id: 'small_team',
    name: 'Growing Team',
    description: 'Have 10 employees at once',
    icon: '👥',
    legacyPointBonus: 25,
    condition: (run) => (run.peakEmployees ?? 0) >= 10,
  },
  {
    id: 'big_team',
    name: 'Large Studio',
    description: 'Have 50 employees at once',
    icon: '🏢',
    legacyPointBonus: 100,
    condition: (run) => (run.peakEmployees ?? 0) >= 50,
  },
  {
    id: 'first_million',
    name: 'Millionaire',
    description: 'Earn $1,000,000 revenue',
    icon: '💰',
    legacyPointBonus: 75,
    condition: (run) => (run.maxRevenue ?? 0) >= 1000000,
  },
  {
    id: 'first_billion',
    name: 'Billionaire',
    description: 'Earn $1,000,000,000 revenue',
    icon: '💎',
    legacyPointBonus: 500,
    condition: (run) => (run.maxRevenue ?? 0) >= 1000000000,
  },
  {
    id: 'max_reputation',
    name: 'Industry Legend',
    description: 'Reach 100 reputation',
    icon: '⭐',
    legacyPointBonus: 150,
    condition: (run) => (run.maxReputation ?? 0) >= 100,
  },
  {
    id: 'speedrun_30',
    name: 'Speedrunner',
    description: 'Prestige in under 30 days',
    icon: '⚡',
    legacyPointBonus: 200,
    condition: (run) => (run.daysPlayed ?? 999) <= 30,
  },
  {
    id: 'achievement_hunter',
    name: 'Achievement Hunter',
    description: 'Unlock 25 achievements',
    icon: '🏆',
    legacyPointBonus: 100,
    condition: (run) => (run.achievementsUnlocked ?? 0) >= 25,
  },
];

// =============================================================================
// Helper Functions
// =============================================================================

export function createInitialPrestigeState(): PrestigeState {
  return {
    totalLegacyPoints: 0,
    availableLegacyPoints: 0,
    lifetimeLegacyPointsEarned: 0,
    upgrades: {},
    currentRun: 1,
    runHistory: [],
    totalPrestigeCount: 0,
    firstPrestigeDate: null,
    lastPrestigeDate: null,
    unlockedMilestones: [],
  };
}

export function getUpgradeById(id: string): PrestigeUpgrade | undefined {
  return PRESTIGE_UPGRADES.find(u => u.id === id);
}

export function getUpgradesByCategory(category: PrestigeUpgradeCategory): PrestigeUpgrade[] {
  return PRESTIGE_UPGRADES.filter(u => u.category === category);
}

export function getUpgradeLevel(state: PrestigeState, upgradeId: string): number {
  return state.upgrades[upgradeId] ?? 0;
}

export function getUpgradeCost(upgrade: PrestigeUpgrade, currentLevel: number): number {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
}

export function canPurchaseUpgrade(
  state: PrestigeState, 
  upgrade: PrestigeUpgrade
): { canPurchase: boolean; reason?: string } {
  const currentLevel = getUpgradeLevel(state, upgrade.id as string);
  
  if (currentLevel >= upgrade.maxLevel) {
    return { canPurchase: false, reason: 'Max level reached' };
  }

  const cost = getUpgradeCost(upgrade, currentLevel);
  if (state.availableLegacyPoints < cost) {
    return { canPurchase: false, reason: `Need ${cost} Legacy Points` };
  }

  if (upgrade.prerequisite) {
    const prereqLevel = getUpgradeLevel(state, upgrade.prerequisite as string);
    if (prereqLevel === 0) {
      const prereq = getUpgradeById(upgrade.prerequisite as string);
      return { canPurchase: false, reason: `Requires ${prereq?.name}` };
    }
  }

  return { canPurchase: true };
}

export function calculateEffectValue(
  state: PrestigeState,
  effectType: PrestigeEffectType
): number {
  let totalValue = 0;

  for (const upgrade of PRESTIGE_UPGRADES) {
    if (upgrade.effect.type === effectType) {
      const level = getUpgradeLevel(state, upgrade.id as string);
      if (level > 0) {
        totalValue += upgrade.effect.baseValue + (upgrade.effect.perLevel * level);
      }
    }
  }

  return totalValue;
}

export function getAllEffects(state: PrestigeState): Record<PrestigeEffectType, number> {
  const effects: Partial<Record<PrestigeEffectType, number>> = {};

  for (const upgrade of PRESTIGE_UPGRADES) {
    const level = getUpgradeLevel(state, upgrade.id as string);
    if (level > 0) {
      const effectType = upgrade.effect.type;
      const value = upgrade.effect.baseValue + (upgrade.effect.perLevel * level);
      effects[effectType] = (effects[effectType] ?? 0) + value;
    }
  }

  // Default all effects to 0
  const allEffectTypes: PrestigeEffectType[] = [
    'startingMoney', 'startingReputation', 'devSpeedBonus', 'gameQualityBonus',
    'revenueMultiplier', 'costReduction', 'employeeSkillBonus', 'employeeMoraleBonus',
    'hiringCostReduction', 'gachaRateBonus', 'pityReduction', 'researchSpeedBonus',
    'researchCostReduction', 'reputationGainBonus', 'marketShareBonus', 'criticalSuccessChance',
  ];

  const result: Record<PrestigeEffectType, number> = {} as Record<PrestigeEffectType, number>;
  for (const type of allEffectTypes) {
    result[type] = effects[type] ?? 0;
  }

  return result;
}

export function getTotalUpgradesCost(state: PrestigeState): number {
  let total = 0;

  for (const [upgradeId, level] of Object.entries(state.upgrades)) {
    const upgrade = getUpgradeById(upgradeId);
    if (upgrade) {
      for (let i = 0; i < level; i++) {
        total += getUpgradeCost(upgrade, i);
      }
    }
  }

  return total;
}

export function getPrestigeStats(state: PrestigeState): {
  totalRuns: number;
  averageDaysPerRun: number;
  totalDaysPlayed: number;
  bestRun: PrestigeRun | null;
  totalGamesLaunched: number;
  averageLegacyPerRun: number;
} {
  if (state.runHistory.length === 0) {
    return {
      totalRuns: 0,
      averageDaysPerRun: 0,
      totalDaysPlayed: 0,
      bestRun: null,
      totalGamesLaunched: 0,
      averageLegacyPerRun: 0,
    };
  }

  const totalDays = state.runHistory.reduce((sum, run) => sum + run.daysPlayed, 0);
  const totalGames = state.runHistory.reduce((sum, run) => sum + run.gamesLaunched, 0);
  const bestRun = state.runHistory.reduce(
    (best, run) => (run.legacyPointsEarned > (best?.legacyPointsEarned ?? 0) ? run : best),
    state.runHistory[0]
  );

  return {
    totalRuns: state.runHistory.length,
    averageDaysPerRun: totalDays / state.runHistory.length,
    totalDaysPlayed: totalDays,
    bestRun,
    totalGamesLaunched: totalGames,
    averageLegacyPerRun: state.lifetimeLegacyPointsEarned / state.runHistory.length,
  };
}
