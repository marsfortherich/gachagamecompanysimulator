/**
 * Prestige Calculator Service - Prompt 7.3
 * 
 * Calculates Legacy Points and manages prestige mechanics.
 */

import {
  PrestigeState,
  PrestigeRun,
  PrestigeMilestone,
  PrestigeUpgrade,
  PRESTIGE_MILESTONES,
  PRESTIGE_UPGRADES,
  createInitialPrestigeState,
  getUpgradeById,
  getUpgradeCost,
  getUpgradeLevel,
  canPurchaseUpgrade,
  getAllEffects,
  type PrestigeEffectType,
} from './Prestige';

// =============================================================================
// Legacy Point Calculation
// =============================================================================

export interface LegacyPointBreakdown {
  basePoints: number;
  revenuePoints: number;
  reputationPoints: number;
  gamesPoints: number;
  employeesPoints: number;
  achievementsPoints: number;
  milestonePoints: number;
  speedBonus: number;
  totalPoints: number;
  milestones: PrestigeMilestone[];
}

export interface RunSummary {
  daysPlayed: number;
  totalRevenue: number;
  maxReputation: number;
  gamesLaunched: number;
  peakEmployees: number;
  achievementsUnlocked: number;
}

/**
 * Calculate Legacy Points earned from a run
 */
export function calculateLegacyPoints(summary: RunSummary): LegacyPointBreakdown {
  const milestones: PrestigeMilestone[] = [];
  let milestonePoints = 0;

  // Check milestones
  for (const milestone of PRESTIGE_MILESTONES) {
    if (milestone.condition({
      daysPlayed: summary.daysPlayed,
      maxRevenue: summary.totalRevenue,
      maxReputation: summary.maxReputation,
      gamesLaunched: summary.gamesLaunched,
      peakEmployees: summary.peakEmployees,
      achievementsUnlocked: summary.achievementsUnlocked,
    })) {
      milestones.push({
        id: milestone.id,
        name: milestone.name,
        description: milestone.description,
        reachedAt: summary.daysPlayed, // Approximate
      });
      milestonePoints += milestone.legacyPointBonus;
    }
  }

  // Base points - everyone gets something
  const basePoints = 10;

  // Revenue points (logarithmic scaling)
  // $1k = 5, $10k = 10, $100k = 15, $1M = 20, $10M = 25, etc.
  const revenuePoints = summary.totalRevenue > 0 
    ? Math.floor(5 * Math.log10(summary.totalRevenue + 1))
    : 0;

  // Reputation points (linear, capped)
  const reputationPoints = Math.min(50, Math.floor(summary.maxReputation * 0.5));

  // Games launched points
  const gamesPoints = Math.min(50, summary.gamesLaunched * 5);

  // Employee points (peak)
  const employeesPoints = Math.min(25, Math.floor(summary.peakEmployees * 0.5));

  // Achievement points
  const achievementsPoints = summary.achievementsUnlocked * 2;

  // Speed bonus (more points for faster runs)
  // Days 1-30: 2x bonus, 31-60: 1.5x, 61-100: 1.25x, 100+: 1x
  let speedMultiplier = 1;
  if (summary.daysPlayed <= 30) {
    speedMultiplier = 2;
  } else if (summary.daysPlayed <= 60) {
    speedMultiplier = 1.5;
  } else if (summary.daysPlayed <= 100) {
    speedMultiplier = 1.25;
  }

  const subtotal = basePoints + revenuePoints + reputationPoints + 
                   gamesPoints + employeesPoints + achievementsPoints + milestonePoints;
  
  const speedBonus = Math.floor(subtotal * (speedMultiplier - 1));
  const totalPoints = subtotal + speedBonus;

  return {
    basePoints,
    revenuePoints,
    reputationPoints,
    gamesPoints,
    employeesPoints,
    achievementsPoints,
    milestonePoints,
    speedBonus,
    totalPoints,
    milestones,
  };
}

// =============================================================================
// Prestige Calculator Class
// =============================================================================

export class PrestigeCalculator {
  private state: PrestigeState;
  private onStateChange?: (state: PrestigeState) => void;

  constructor(initialState?: Partial<PrestigeState>) {
    this.state = {
      ...createInitialPrestigeState(),
      ...initialState,
    };
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  /**
   * Set state change callback
   */
  setOnStateChange(callback: (state: PrestigeState) => void): void {
    this.onStateChange = callback;
  }

  /**
   * Get current state
   */
  getState(): PrestigeState {
    return { ...this.state };
  }

  /**
   * Load state
   */
  loadState(state: PrestigeState): void {
    this.state = { ...state };
    this.notifyChange();
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.state = createInitialPrestigeState();
    this.notifyChange();
  }

  /**
   * Calculate potential Legacy Points from current run
   */
  calculatePotentialPoints(summary: RunSummary): LegacyPointBreakdown {
    return calculateLegacyPoints(summary);
  }

  /**
   * Check if prestige is available
   */
  canPrestige(summary: RunSummary): { canPrestige: boolean; reason?: string } {
    // Minimum requirements to prestige
    if (summary.daysPlayed < 1) {
      return { canPrestige: false, reason: 'Must play at least 1 day' };
    }

    if (summary.gamesLaunched < 1) {
      return { canPrestige: false, reason: 'Must launch at least 1 game' };
    }

    const breakdown = calculateLegacyPoints(summary);
    if (breakdown.totalPoints < 10) {
      return { canPrestige: false, reason: 'Would earn too few Legacy Points' };
    }

    return { canPrestige: true };
  }

  /**
   * Execute prestige
   */
  prestige(summary: RunSummary): { success: boolean; breakdown: LegacyPointBreakdown } {
    const canPrestigeResult = this.canPrestige(summary);
    if (!canPrestigeResult.canPrestige) {
      return {
        success: false,
        breakdown: calculateLegacyPoints(summary),
      };
    }

    const breakdown = calculateLegacyPoints(summary);
    const now = Date.now();

    // Create run history entry
    const run: PrestigeRun = {
      runNumber: this.state.currentRun,
      startedAt: now - (summary.daysPlayed * 24 * 60 * 60 * 1000), // Approximate
      endedAt: now,
      daysPlayed: summary.daysPlayed,
      legacyPointsEarned: breakdown.totalPoints,
      maxRevenue: summary.totalRevenue,
      maxReputation: summary.maxReputation,
      gamesLaunched: summary.gamesLaunched,
      peakEmployees: summary.peakEmployees,
      achievementsUnlocked: summary.achievementsUnlocked,
      milestones: breakdown.milestones,
    };

    // Update state
    this.state.runHistory.push(run);
    this.state.totalLegacyPoints += breakdown.totalPoints;
    this.state.availableLegacyPoints += breakdown.totalPoints;
    this.state.lifetimeLegacyPointsEarned += breakdown.totalPoints;
    this.state.currentRun += 1;
    this.state.totalPrestigeCount += 1;
    
    if (!this.state.firstPrestigeDate) {
      this.state.firstPrestigeDate = now;
    }
    this.state.lastPrestigeDate = now;

    // Update unlocked milestones
    for (const milestone of breakdown.milestones) {
      if (!this.state.unlockedMilestones.includes(milestone.id)) {
        this.state.unlockedMilestones.push(milestone.id);
      }
    }

    this.notifyChange();

    return {
      success: true,
      breakdown,
    };
  }

  /**
   * Purchase an upgrade
   */
  purchaseUpgrade(upgradeId: string): { success: boolean; reason?: string } {
    const upgrade = getUpgradeById(upgradeId);
    if (!upgrade) {
      return { success: false, reason: 'Upgrade not found' };
    }

    const canPurchase = canPurchaseUpgrade(this.state, upgrade);
    if (!canPurchase.canPurchase) {
      return { success: false, reason: canPurchase.reason };
    }

    const currentLevel = getUpgradeLevel(this.state, upgradeId);
    const cost = getUpgradeCost(upgrade, currentLevel);

    this.state.availableLegacyPoints -= cost;
    this.state.upgrades[upgradeId] = currentLevel + 1;

    this.notifyChange();

    return { success: true };
  }

  /**
   * Refund all upgrades
   */
  refundAllUpgrades(): number {
    let refundedPoints = 0;

    for (const [upgradeId, level] of Object.entries(this.state.upgrades)) {
      const upgrade = getUpgradeById(upgradeId);
      if (upgrade) {
        for (let i = 0; i < level; i++) {
          refundedPoints += getUpgradeCost(upgrade, i);
        }
      }
    }

    this.state.upgrades = {};
    this.state.availableLegacyPoints += refundedPoints;

    this.notifyChange();

    return refundedPoints;
  }

  /**
   * Get all active effects
   */
  getActiveEffects(): Record<PrestigeEffectType, number> {
    return getAllEffects(this.state);
  }

  /**
   * Get specific effect value
   */
  getEffect(effectType: PrestigeEffectType): number {
    return getAllEffects(this.state)[effectType] ?? 0;
  }

  /**
   * Get upgrade progress
   */
  getUpgradeProgress(): {
    upgrade: PrestigeUpgrade;
    currentLevel: number;
    cost: number;
    canAfford: boolean;
    isMaxed: boolean;
  }[] {
    return PRESTIGE_UPGRADES.map(upgrade => {
      const currentLevel = getUpgradeLevel(this.state, upgrade.id as string);
      const cost = getUpgradeCost(upgrade, currentLevel);
      const isMaxed = currentLevel >= upgrade.maxLevel;

      return {
        upgrade,
        currentLevel,
        cost: isMaxed ? 0 : cost,
        canAfford: this.state.availableLegacyPoints >= cost,
        isMaxed,
      };
    });
  }

  /**
   * Get run history stats
   */
  getStats(): {
    totalRuns: number;
    totalLegacyEarned: number;
    availablePoints: number;
    bestRun: PrestigeRun | null;
    averagePointsPerRun: number;
  } {
    const bestRun = this.state.runHistory.length > 0
      ? this.state.runHistory.reduce((best, run) => 
          run.legacyPointsEarned > best.legacyPointsEarned ? run : best
        )
      : null;

    return {
      totalRuns: this.state.runHistory.length,
      totalLegacyEarned: this.state.lifetimeLegacyPointsEarned,
      availablePoints: this.state.availableLegacyPoints,
      bestRun,
      averagePointsPerRun: this.state.runHistory.length > 0
        ? this.state.lifetimeLegacyPointsEarned / this.state.runHistory.length
        : 0,
    };
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private notifyChange(): void {
    this.onStateChange?.(this.getState());
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let prestigeCalculatorInstance: PrestigeCalculator | null = null;

export function getPrestigeCalculator(): PrestigeCalculator {
  if (!prestigeCalculatorInstance) {
    prestigeCalculatorInstance = new PrestigeCalculator();
  }
  return prestigeCalculatorInstance;
}

export function resetPrestigeCalculator(): void {
  prestigeCalculatorInstance = null;
}

// =============================================================================
// Effect Appliers (for use in game systems)
// =============================================================================

/**
 * Apply starting money bonus
 */
export function getStartingMoney(baseAmount: number, calculator: PrestigeCalculator): number {
  const bonus = calculator.getEffect('startingMoney');
  return baseAmount + bonus;
}

/**
 * Apply starting reputation bonus
 */
export function getStartingReputation(baseAmount: number, calculator: PrestigeCalculator): number {
  const bonus = calculator.getEffect('startingReputation');
  return baseAmount + bonus;
}

/**
 * Apply dev speed multiplier
 */
export function applyDevSpeedBonus(baseSpeed: number, calculator: PrestigeCalculator): number {
  const bonus = calculator.getEffect('devSpeedBonus');
  return baseSpeed * (1 + bonus / 100);
}

/**
 * Apply game quality bonus
 */
export function applyQualityBonus(baseQuality: number, calculator: PrestigeCalculator): number {
  const bonus = calculator.getEffect('gameQualityBonus');
  return baseQuality * (1 + bonus / 100);
}

/**
 * Apply revenue multiplier
 */
export function applyRevenueMultiplier(baseRevenue: number, calculator: PrestigeCalculator): number {
  const bonus = calculator.getEffect('revenueMultiplier');
  return baseRevenue * (1 + bonus / 100);
}

/**
 * Apply cost reduction
 */
export function applyCostReduction(baseCost: number, calculator: PrestigeCalculator): number {
  const reduction = calculator.getEffect('costReduction');
  return baseCost * (1 - reduction / 100);
}

/**
 * Apply employee skill bonus
 */
export function applyEmployeeSkillBonus(baseSkill: number, calculator: PrestigeCalculator): number {
  const bonus = calculator.getEffect('employeeSkillBonus');
  return baseSkill * (1 + bonus / 100);
}

/**
 * Apply gacha rate bonus
 */
export function applyGachaRateBonus(baseRate: number, calculator: PrestigeCalculator): number {
  const bonus = calculator.getEffect('gachaRateBonus');
  return baseRate * (1 + bonus / 100);
}

/**
 * Apply pity reduction
 */
export function applyPityReduction(basePity: number, calculator: PrestigeCalculator): number {
  const reduction = calculator.getEffect('pityReduction');
  return Math.floor(basePity * (1 - reduction / 100));
}

/**
 * Check for critical success
 */
export function rollCriticalSuccess(calculator: PrestigeCalculator): boolean {
  const chance = calculator.getEffect('criticalSuccessChance');
  return Math.random() * 100 < chance;
}
