/**
 * Difficulty System - Prompt 8.2
 * 
 * Difficulty modes affecting game balance and challenge.
 */

// =============================================================================
// Types
// =============================================================================

export type DifficultyMode = 'casual' | 'standard' | 'hardcore' | 'sandbox';

export interface DifficultyModifiers {
  // Starting conditions
  startingMoney: number;           // Multiplier (1.0 = 100%)
  startingReputation: number;      // Multiplier
  
  // Economy
  salaryGrowthRate: number;        // Multiplier for salary increases
  marketCompetition: number;       // Multiplier for competitor strength
  revenuMultiplier: number;        // Multiplier for all revenue
  costMultiplier: number;          // Multiplier for all costs
  
  // Reputation
  reputationGainMultiplier: number;  // Multiplier for rep gains
  reputationLossMultiplier: number;  // Multiplier for rep losses
  reputationVolatility: number;      // How much rep swings
  
  // Risk & Recovery
  bankruptcyTolerance: number;     // Days in debt before game over
  debtInterestRate: number;        // Interest on negative funds
  recoverySpeed: number;           // How fast you recover from setbacks
  
  // RNG
  rngVariance: number;             // How much RNG affects outcomes (0-1)
  criticalEventChance: number;     // Multiplier for random events
  
  // Gacha
  gachaRateBonus: number;          // Bonus to gacha rates
  pityReduction: number;           // Reduction to pity counter
  
  // Employee
  employeeMoraleDecay: number;     // Multiplier for morale loss
  employeeQuitChance: number;      // Multiplier for quit probability
  skillGrowthRate: number;         // Multiplier for skill gains
  
  // Game Development
  developmentSpeed: number;        // Multiplier for dev speed
  bugChance: number;               // Multiplier for bug occurrence
  qualityVariance: number;         // How much quality varies
}

export interface DifficultyConfig {
  id: DifficultyMode;
  name: string;
  description: string;
  icon: string;
  color: string;
  modifiers: DifficultyModifiers;
  features: {
    canFail: boolean;              // Can you go bankrupt?
    achievementsEnabled: boolean;  // Do achievements work?
    leaderboardEnabled: boolean;   // Can submit to leaderboards?
    tutorialForced: boolean;       // Must complete tutorial?
  };
}

// =============================================================================
// Default Modifiers (Standard = 1.0 for everything)
// =============================================================================

const DEFAULT_MODIFIERS: DifficultyModifiers = {
  startingMoney: 1.0,
  startingReputation: 1.0,
  salaryGrowthRate: 1.0,
  marketCompetition: 1.0,
  revenuMultiplier: 1.0,
  costMultiplier: 1.0,
  reputationGainMultiplier: 1.0,
  reputationLossMultiplier: 1.0,
  reputationVolatility: 1.0,
  bankruptcyTolerance: 1.0,
  debtInterestRate: 1.0,
  recoverySpeed: 1.0,
  rngVariance: 1.0,
  criticalEventChance: 1.0,
  gachaRateBonus: 0,
  pityReduction: 0,
  employeeMoraleDecay: 1.0,
  employeeQuitChance: 1.0,
  skillGrowthRate: 1.0,
  developmentSpeed: 1.0,
  bugChance: 1.0,
  qualityVariance: 1.0,
};

// =============================================================================
// Difficulty Configurations
// =============================================================================

export const DIFFICULTY_CONFIGS: Record<DifficultyMode, DifficultyConfig> = {
  casual: {
    id: 'casual',
    name: 'Casual',
    description: 'A relaxed experience with generous bonuses and forgiving mechanics. Perfect for learning.',
    icon: '🌴',
    color: 'green',
    modifiers: {
      ...DEFAULT_MODIFIERS,
      startingMoney: 1.5,
      startingReputation: 1.25,
      salaryGrowthRate: 0.75,
      marketCompetition: 0.5,
      revenuMultiplier: 1.25,
      costMultiplier: 0.8,
      reputationGainMultiplier: 1.5,
      reputationLossMultiplier: 0.5,
      reputationVolatility: 0.5,
      bankruptcyTolerance: 2.0,
      debtInterestRate: 0.5,
      recoverySpeed: 1.5,
      rngVariance: 0.5,
      criticalEventChance: 0.5,
      gachaRateBonus: 20,
      pityReduction: 20,
      employeeMoraleDecay: 0.5,
      employeeQuitChance: 0.25,
      skillGrowthRate: 1.5,
      developmentSpeed: 1.25,
      bugChance: 0.5,
      qualityVariance: 0.5,
    },
    features: {
      canFail: true,
      achievementsEnabled: true,
      leaderboardEnabled: false,
      tutorialForced: true,
    },
  },

  standard: {
    id: 'standard',
    name: 'Standard',
    description: 'The intended experience with balanced challenge and progression.',
    icon: '⚖️',
    color: 'blue',
    modifiers: { ...DEFAULT_MODIFIERS },
    features: {
      canFail: true,
      achievementsEnabled: true,
      leaderboardEnabled: true,
      tutorialForced: false,
    },
  },

  hardcore: {
    id: 'hardcore',
    name: 'Hardcore',
    description: 'Punishing difficulty for experienced players. Every decision matters.',
    icon: '💀',
    color: 'red',
    modifiers: {
      ...DEFAULT_MODIFIERS,
      startingMoney: 0.75,
      startingReputation: 0.75,
      salaryGrowthRate: 1.5,
      marketCompetition: 1.5,
      revenuMultiplier: 0.8,
      costMultiplier: 1.25,
      reputationGainMultiplier: 0.75,
      reputationLossMultiplier: 1.5,
      reputationVolatility: 1.5,
      bankruptcyTolerance: 0.5,
      debtInterestRate: 2.0,
      recoverySpeed: 0.75,
      rngVariance: 1.25,
      criticalEventChance: 1.5,
      gachaRateBonus: -10,
      pityReduction: -10,
      employeeMoraleDecay: 1.5,
      employeeQuitChance: 1.5,
      skillGrowthRate: 0.75,
      developmentSpeed: 0.9,
      bugChance: 1.5,
      qualityVariance: 1.5,
    },
    features: {
      canFail: true,
      achievementsEnabled: true,
      leaderboardEnabled: true,
      tutorialForced: false,
    },
  },

  sandbox: {
    id: 'sandbox',
    name: 'Sandbox',
    description: 'Unlimited resources and no failure. Experiment freely!',
    icon: '🏖️',
    color: 'yellow',
    modifiers: {
      ...DEFAULT_MODIFIERS,
      startingMoney: 100.0,
      startingReputation: 2.0,
      salaryGrowthRate: 0,
      marketCompetition: 0,
      revenuMultiplier: 10.0,
      costMultiplier: 0.1,
      reputationGainMultiplier: 5.0,
      reputationLossMultiplier: 0,
      reputationVolatility: 0,
      bankruptcyTolerance: 999999,
      debtInterestRate: 0,
      recoverySpeed: 100,
      rngVariance: 0,
      criticalEventChance: 0,
      gachaRateBonus: 100,
      pityReduction: 50,
      employeeMoraleDecay: 0,
      employeeQuitChance: 0,
      skillGrowthRate: 10,
      developmentSpeed: 5.0,
      bugChance: 0,
      qualityVariance: 0,
    },
    features: {
      canFail: false,
      achievementsEnabled: false,
      leaderboardEnabled: false,
      tutorialForced: false,
    },
  },
};

// =============================================================================
// Difficulty Manager
// =============================================================================

export interface DifficultyState {
  currentMode: DifficultyMode;
  selectedAt: number;
  modifiedSettings: Partial<DifficultyModifiers>;
}

export class DifficultyManager {
  private state: DifficultyState;
  private onStateChange: ((state: DifficultyState) => void) | null = null;

  constructor(mode: DifficultyMode = 'standard') {
    this.state = {
      currentMode: mode,
      selectedAt: Date.now(),
      modifiedSettings: {},
    };
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  /**
   * Set state change callback
   */
  setOnStateChange(callback: (state: DifficultyState) => void): void {
    this.onStateChange = callback;
  }

  /**
   * Get current state
   */
  getState(): DifficultyState {
    return { ...this.state };
  }

  /**
   * Load state
   */
  loadState(state: DifficultyState): void {
    this.state = { ...state };
    this.notifyStateChange();
  }

  /**
   * Get current difficulty mode
   */
  getMode(): DifficultyMode {
    return this.state.currentMode;
  }

  /**
   * Get current config
   */
  getConfig(): DifficultyConfig {
    return DIFFICULTY_CONFIGS[this.state.currentMode];
  }

  /**
   * Get effective modifiers (base + custom modifications)
   */
  getModifiers(): DifficultyModifiers {
    const base = DIFFICULTY_CONFIGS[this.state.currentMode].modifiers;
    return { ...base, ...this.state.modifiedSettings };
  }

  /**
   * Get a specific modifier value
   */
  getModifier<K extends keyof DifficultyModifiers>(key: K): DifficultyModifiers[K] {
    return this.getModifiers()[key];
  }

  /**
   * Set difficulty mode (only allowed at game start)
   */
  setMode(mode: DifficultyMode): void {
    this.state.currentMode = mode;
    this.state.selectedAt = Date.now();
    this.state.modifiedSettings = {};
    this.notifyStateChange();
  }

  /**
   * Override a specific modifier (for custom difficulty)
   */
  setModifier<K extends keyof DifficultyModifiers>(key: K, value: DifficultyModifiers[K]): void {
    this.state.modifiedSettings[key] = value;
    this.notifyStateChange();
  }

  /**
   * Check if mode allows failure (bankruptcy)
   */
  canFail(): boolean {
    return this.getConfig().features.canFail;
  }

  /**
   * Check if achievements are enabled
   */
  achievementsEnabled(): boolean {
    return this.getConfig().features.achievementsEnabled;
  }

  /**
   * Check if leaderboard submissions are enabled
   */
  leaderboardEnabled(): boolean {
    return this.getConfig().features.leaderboardEnabled;
  }

  /**
   * Check if tutorial is forced
   */
  tutorialForced(): boolean {
    return this.getConfig().features.tutorialForced;
  }

  /**
   * Check if this is sandbox mode
   */
  isSandbox(): boolean {
    return this.state.currentMode === 'sandbox';
  }

  // ===========================================================================
  // Modifier Application Helpers
  // ===========================================================================

  /**
   * Apply starting money modifier
   */
  getStartingMoney(baseAmount: number): number {
    return Math.floor(baseAmount * this.getModifier('startingMoney'));
  }

  /**
   * Apply revenue modifier
   */
  applyRevenueModifier(revenue: number): number {
    return revenue * this.getModifier('revenuMultiplier');
  }

  /**
   * Apply cost modifier
   */
  applyCostModifier(cost: number): number {
    return cost * this.getModifier('costMultiplier');
  }

  /**
   * Apply reputation gain modifier
   */
  applyReputationGain(gain: number): number {
    return gain * this.getModifier('reputationGainMultiplier');
  }

  /**
   * Apply reputation loss modifier
   */
  applyReputationLoss(loss: number): number {
    return loss * this.getModifier('reputationLossMultiplier');
  }

  /**
   * Apply development speed modifier
   */
  applyDevSpeed(speed: number): number {
    return speed * this.getModifier('developmentSpeed');
  }

  /**
   * Apply employee morale decay modifier
   */
  applyMoraleDecay(decay: number): number {
    return decay * this.getModifier('employeeMoraleDecay');
  }

  /**
   * Apply skill growth modifier
   */
  applySkillGrowth(growth: number): number {
    return growth * this.getModifier('skillGrowthRate');
  }

  /**
   * Apply gacha rate bonus
   */
  applyGachaRateBonus(rate: number): number {
    const bonus = this.getModifier('gachaRateBonus');
    return rate * (1 + bonus / 100);
  }

  /**
   * Get bankruptcy tolerance in days
   */
  getBankruptcyTolerance(baseDays: number): number {
    return Math.floor(baseDays * this.getModifier('bankruptcyTolerance'));
  }

  /**
   * Apply RNG variance to a value
   */
  applyRngVariance(baseValue: number, randomFactor: number): number {
    const variance = this.getModifier('rngVariance');
    const deviation = (randomFactor - 0.5) * 2 * variance;
    return baseValue * (1 + deviation * 0.3); // Max 30% deviation
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private notifyStateChange(): void {
    this.onStateChange?.(this.getState());
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let difficultyManagerInstance: DifficultyManager | null = null;

export function getDifficultyManager(): DifficultyManager {
  if (!difficultyManagerInstance) {
    difficultyManagerInstance = new DifficultyManager();
  }
  return difficultyManagerInstance;
}

export function resetDifficultyManager(): void {
  difficultyManagerInstance = null;
}

export function setDifficultyManager(manager: DifficultyManager): void {
  difficultyManagerInstance = manager;
}
