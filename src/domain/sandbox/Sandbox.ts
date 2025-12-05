/**
 * Sandbox System - Prompt 8.3
 * 
 * Creative mode with toggleable cheats and debug tools.
 */

// =============================================================================
// Types
// =============================================================================

export interface SandboxFlags {
  // Economy
  infiniteMoney: boolean;
  freeHiring: boolean;
  noSalaries: boolean;
  noServerCosts: boolean;
  
  // Reputation
  noReputationDecay: boolean;
  maxReputation: boolean;
  
  // Development
  instantDevelopment: boolean;
  noBugs: boolean;
  maxQuality: boolean;
  
  // Employees
  maxEmployeeSkills: boolean;
  noMoraleDecay: boolean;
  noEmployeeQuit: boolean;
  
  // Gacha
  guaranteedLegendary: boolean;
  freePulls: boolean;
  
  // Market
  manipulateMarket: boolean;
  noCompetitors: boolean;
  
  // Events
  forceEvents: boolean;
  noNegativeEvents: boolean;
  
  // Research
  instantResearch: boolean;
  freeResearch: boolean;
  
  // Meta
  revealHiddenAchievements: boolean;
  speedMultiplier: number; // 1, 2, 5, 10, etc.
}

export interface SandboxState {
  enabled: boolean;
  flags: SandboxFlags;
  activatedAt: number | null;
  isMarkedAsSandbox: boolean;
  forcedEventQueue: string[];
  manipulatedTrends: Record<string, number>;
}

// =============================================================================
// Default Configuration
// =============================================================================

export const DEFAULT_SANDBOX_FLAGS: SandboxFlags = {
  infiniteMoney: false,
  freeHiring: false,
  noSalaries: false,
  noServerCosts: false,
  noReputationDecay: false,
  maxReputation: false,
  instantDevelopment: false,
  noBugs: false,
  maxQuality: false,
  maxEmployeeSkills: false,
  noMoraleDecay: false,
  noEmployeeQuit: false,
  guaranteedLegendary: false,
  freePulls: false,
  manipulateMarket: false,
  noCompetitors: false,
  forceEvents: false,
  noNegativeEvents: false,
  instantResearch: false,
  freeResearch: false,
  revealHiddenAchievements: false,
  speedMultiplier: 1,
};

export function createInitialSandboxState(): SandboxState {
  return {
    enabled: false,
    flags: { ...DEFAULT_SANDBOX_FLAGS },
    activatedAt: null,
    isMarkedAsSandbox: false,
    forcedEventQueue: [],
    manipulatedTrends: {},
  };
}

// =============================================================================
// Sandbox Manager
// =============================================================================

export type SandboxEventCallback = (flag: keyof SandboxFlags, value: boolean | number) => void;

export class SandboxManager {
  private state: SandboxState;
  private onFlagChange: SandboxEventCallback | null = null;
  private onStateChange: ((state: SandboxState) => void) | null = null;

  constructor(initialState?: Partial<SandboxState>) {
    this.state = {
      ...createInitialSandboxState(),
      ...initialState,
    };
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  /**
   * Set flag change callback
   */
  setOnFlagChange(callback: SandboxEventCallback): void {
    this.onFlagChange = callback;
  }

  /**
   * Set state change callback
   */
  setOnStateChange(callback: (state: SandboxState) => void): void {
    this.onStateChange = callback;
  }

  /**
   * Get current state
   */
  getState(): SandboxState {
    return { ...this.state, flags: { ...this.state.flags } };
  }

  /**
   * Load state
   */
  loadState(state: SandboxState): void {
    this.state = { ...state, flags: { ...state.flags } };
    this.notifyStateChange();
  }

  /**
   * Reset state
   */
  reset(): void {
    this.state = createInitialSandboxState();
    this.notifyStateChange();
  }

  /**
   * Enable sandbox mode
   */
  enable(): void {
    if (this.state.enabled) return;
    
    this.state.enabled = true;
    this.state.activatedAt = Date.now();
    this.state.isMarkedAsSandbox = true; // Permanent flag
    this.notifyStateChange();
  }

  /**
   * Disable sandbox mode (flags remain, just not active)
   */
  disable(): void {
    this.state.enabled = false;
    this.notifyStateChange();
  }

  /**
   * Check if sandbox is enabled
   */
  isEnabled(): boolean {
    return this.state.enabled;
  }

  /**
   * Check if save is marked as sandbox (even if currently disabled)
   */
  isMarkedAsSandbox(): boolean {
    return this.state.isMarkedAsSandbox;
  }

  /**
   * Get a specific flag value
   */
  getFlag<K extends keyof SandboxFlags>(flag: K): SandboxFlags[K] {
    return this.state.flags[flag];
  }

  /**
   * Set a specific flag
   */
  setFlag<K extends keyof SandboxFlags>(flag: K, value: SandboxFlags[K]): void {
    if (!this.state.enabled) {
      console.warn('Cannot set sandbox flags when sandbox is disabled');
      return;
    }

    this.state.flags[flag] = value;
    this.onFlagChange?.(flag, value as boolean | number);
    this.notifyStateChange();
  }

  /**
   * Toggle a boolean flag
   */
  toggleFlag(flag: keyof SandboxFlags): void {
    const currentValue = this.state.flags[flag];
    if (typeof currentValue === 'boolean') {
      this.setFlag(flag, !currentValue);
    }
  }

  /**
   * Enable all flags
   */
  enableAllFlags(): void {
    if (!this.state.enabled) return;

    this.state.flags = {
      infiniteMoney: true,
      freeHiring: true,
      noSalaries: true,
      noServerCosts: true,
      noReputationDecay: true,
      maxReputation: true,
      instantDevelopment: true,
      noBugs: true,
      maxQuality: true,
      maxEmployeeSkills: true,
      noMoraleDecay: true,
      noEmployeeQuit: true,
      guaranteedLegendary: true,
      freePulls: true,
      manipulateMarket: true,
      noCompetitors: true,
      forceEvents: true,
      noNegativeEvents: true,
      instantResearch: true,
      freeResearch: true,
      revealHiddenAchievements: true,
      speedMultiplier: 10,
    };
    this.notifyStateChange();
  }

  /**
   * Disable all flags
   */
  disableAllFlags(): void {
    this.state.flags = { ...DEFAULT_SANDBOX_FLAGS };
    this.notifyStateChange();
  }

  /**
   * Add event to forced queue
   */
  queueForcedEvent(eventId: string): void {
    if (!this.state.enabled) return;
    this.state.forcedEventQueue.push(eventId);
    this.notifyStateChange();
  }

  /**
   * Get and remove next forced event
   */
  dequeueForceEvent(): string | null {
    if (!this.state.enabled || this.state.forcedEventQueue.length === 0) {
      return null;
    }
    const event = this.state.forcedEventQueue.shift()!;
    this.notifyStateChange();
    return event;
  }

  /**
   * Set market trend manipulation
   */
  setMarketTrend(genreOrCategory: string, value: number): void {
    if (!this.state.enabled) return;
    this.state.manipulatedTrends[genreOrCategory] = value;
    this.notifyStateChange();
  }

  /**
   * Get manipulated trend value
   */
  getManipulatedTrend(genreOrCategory: string): number | null {
    if (!this.state.enabled || !this.state.flags.manipulateMarket) {
      return null;
    }
    return this.state.manipulatedTrends[genreOrCategory] ?? null;
  }

  /**
   * Clear all market manipulations
   */
  clearMarketManipulations(): void {
    this.state.manipulatedTrends = {};
    this.notifyStateChange();
  }

  /**
   * Set speed multiplier
   */
  setSpeedMultiplier(multiplier: number): void {
    if (!this.state.enabled) return;
    this.state.flags.speedMultiplier = Math.max(1, Math.min(100, multiplier));
    this.notifyStateChange();
  }

  // ===========================================================================
  // Guard Functions (for use in game logic)
  // ===========================================================================

  /**
   * Should bypass money check?
   */
  shouldBypassMoney(): boolean {
    return this.state.enabled && this.state.flags.infiniteMoney;
  }

  /**
   * Should bypass hiring costs?
   */
  shouldBypassHiringCost(): boolean {
    return this.state.enabled && this.state.flags.freeHiring;
  }

  /**
   * Should skip salary payments?
   */
  shouldSkipSalaries(): boolean {
    return this.state.enabled && this.state.flags.noSalaries;
  }

  /**
   * Should skip server costs?
   */
  shouldSkipServerCosts(): boolean {
    return this.state.enabled && this.state.flags.noServerCosts;
  }

  /**
   * Should prevent reputation decay?
   */
  shouldPreventReputationDecay(): boolean {
    return this.state.enabled && this.state.flags.noReputationDecay;
  }

  /**
   * Should force max reputation?
   */
  shouldForceMaxReputation(): boolean {
    return this.state.enabled && this.state.flags.maxReputation;
  }

  /**
   * Should complete development instantly?
   */
  shouldInstantDevelopment(): boolean {
    return this.state.enabled && this.state.flags.instantDevelopment;
  }

  /**
   * Should prevent bugs?
   */
  shouldPreventBugs(): boolean {
    return this.state.enabled && this.state.flags.noBugs;
  }

  /**
   * Should force max quality?
   */
  shouldForceMaxQuality(): boolean {
    return this.state.enabled && this.state.flags.maxQuality;
  }

  /**
   * Should force max employee skills?
   */
  shouldForceMaxSkills(): boolean {
    return this.state.enabled && this.state.flags.maxEmployeeSkills;
  }

  /**
   * Should prevent morale decay?
   */
  shouldPreventMoraleDecay(): boolean {
    return this.state.enabled && this.state.flags.noMoraleDecay;
  }

  /**
   * Should prevent employee quitting?
   */
  shouldPreventQuit(): boolean {
    return this.state.enabled && this.state.flags.noEmployeeQuit;
  }

  /**
   * Should guarantee legendary gacha?
   */
  shouldGuaranteeLegendary(): boolean {
    return this.state.enabled && this.state.flags.guaranteedLegendary;
  }

  /**
   * Should make gacha pulls free?
   */
  shouldFreePulls(): boolean {
    return this.state.enabled && this.state.flags.freePulls;
  }

  /**
   * Should disable competitors?
   */
  shouldDisableCompetitors(): boolean {
    return this.state.enabled && this.state.flags.noCompetitors;
  }

  /**
   * Should filter out negative events?
   */
  shouldFilterNegativeEvents(): boolean {
    return this.state.enabled && this.state.flags.noNegativeEvents;
  }

  /**
   * Should complete research instantly?
   */
  shouldInstantResearch(): boolean {
    return this.state.enabled && this.state.flags.instantResearch;
  }

  /**
   * Should make research free?
   */
  shouldFreeResearch(): boolean {
    return this.state.enabled && this.state.flags.freeResearch;
  }

  /**
   * Should reveal hidden achievements?
   */
  shouldRevealHiddenAchievements(): boolean {
    return this.state.enabled && this.state.flags.revealHiddenAchievements;
  }

  /**
   * Get current speed multiplier
   */
  getSpeedMultiplier(): number {
    return this.state.enabled ? this.state.flags.speedMultiplier : 1;
  }

  /**
   * Should block achievement unlock? (Sandbox saves don't earn achievements)
   */
  shouldBlockAchievements(): boolean {
    return this.state.isMarkedAsSandbox;
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

let sandboxManagerInstance: SandboxManager | null = null;

export function getSandboxManager(): SandboxManager {
  if (!sandboxManagerInstance) {
    sandboxManagerInstance = new SandboxManager();
  }
  return sandboxManagerInstance;
}

export function resetSandboxManager(): void {
  sandboxManagerInstance = null;
}

// =============================================================================
// Guard Helper (for inline use)
// =============================================================================

/**
 * Inline guard for sandbox checks
 */
export function sandbox(): SandboxManager {
  return getSandboxManager();
}
