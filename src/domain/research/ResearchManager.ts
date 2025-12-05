/**
 * Research Manager Service - Prompt 8.1
 * 
 * Manages research progress, unlocks, and active research tracking.
 */

import {
  ResearchNode,
  ResearchState,
  ResearchProgress,
  ResearchEffectType,
  ResearchCategory,
  RESEARCH_NODES,
  createInitialResearchState,
  getResearchById,
  canStartResearch,
  isResearchCompleted,
  calculateTotalEffect,
  getCategoryCompletion,
} from './Research';

// =============================================================================
// Research Manager
// =============================================================================

export type ResearchEventType = 'started' | 'completed' | 'cancelled';
export type ResearchEventCallback = (type: ResearchEventType, node: ResearchNode) => void;

export class ResearchManager {
  private state: ResearchState;
  private onEvent: ResearchEventCallback | null = null;
  private onStateChange: ((state: ResearchState) => void) | null = null;

  constructor(initialState?: Partial<ResearchState>) {
    this.state = {
      ...createInitialResearchState(),
      ...initialState,
    };
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  /**
   * Set event callback
   */
  setOnEvent(callback: ResearchEventCallback): void {
    this.onEvent = callback;
  }

  /**
   * Set state change callback
   */
  setOnStateChange(callback: (state: ResearchState) => void): void {
    this.onStateChange = callback;
  }

  /**
   * Get current state
   */
  getState(): ResearchState {
    return { ...this.state };
  }

  /**
   * Load state
   */
  loadState(state: ResearchState): void {
    this.state = { ...state };
    this.notifyStateChange();
  }

  /**
   * Reset state
   */
  reset(): void {
    this.state = createInitialResearchState();
    this.notifyStateChange();
  }

  /**
   * Add research points
   */
  addResearchPoints(amount: number): void {
    this.state.researchPoints += amount;
    this.notifyStateChange();
  }

  /**
   * Get current research points
   */
  getResearchPoints(): number {
    return this.state.researchPoints;
  }

  /**
   * Start researching a node
   */
  startResearch(
    nodeId: string,
    currentMoney: number,
    deductMoney: (amount: number) => boolean
  ): { success: boolean; reason?: string } {
    const node = getResearchById(nodeId);
    if (!node) {
      return { success: false, reason: 'Research not found' };
    }

    const canStart = canStartResearch(this.state, node, currentMoney);
    if (!canStart.canStart) {
      return { success: false, reason: canStart.reason };
    }

    // Deduct costs
    if (!deductMoney(node.cost.money)) {
      return { success: false, reason: 'Failed to deduct money' };
    }
    this.state.researchPoints -= node.cost.researchPoints;

    // Start research
    this.state.active = {
      nodeId: node.id,
      startedAt: Date.now(),
      daysRemaining: node.researchTime,
      totalDays: node.researchTime,
    };

    this.onEvent?.('started', node);
    this.notifyStateChange();

    return { success: true };
  }

  /**
   * Cancel active research (no refund)
   */
  cancelResearch(): boolean {
    if (!this.state.active) {
      return false;
    }

    const node = getResearchById(this.state.active.nodeId as string);
    this.state.active = null;

    if (node) {
      this.onEvent?.('cancelled', node);
    }
    this.notifyStateChange();

    return true;
  }

  /**
   * Tick research progress (call each game day)
   */
  tick(): ResearchNode | null {
    if (!this.state.active) {
      return null;
    }

    this.state.active.daysRemaining -= 1;

    if (this.state.active.daysRemaining <= 0) {
      return this.completeResearch();
    }

    this.notifyStateChange();
    return null;
  }

  /**
   * Complete active research
   */
  private completeResearch(): ResearchNode | null {
    if (!this.state.active) {
      return null;
    }

    const node = getResearchById(this.state.active.nodeId as string);
    if (!node) {
      this.state.active = null;
      return null;
    }

    // Mark as completed
    this.state.completed[node.id as string] = Date.now();
    this.state.totalResearchCompleted += 1;
    this.state.categoryProgress[node.category] += 1;
    this.state.active = null;

    this.onEvent?.('completed', node);
    this.notifyStateChange();

    return node;
  }

  /**
   * Check if a research is completed
   */
  isCompleted(nodeId: string): boolean {
    return isResearchCompleted(this.state, nodeId);
  }

  /**
   * Get active research progress
   */
  getActiveResearch(): ResearchProgress | null {
    return this.state.active ? { ...this.state.active } : null;
  }

  /**
   * Get all completed research
   */
  getCompletedResearch(): ResearchNode[] {
    return Object.keys(this.state.completed)
      .map(id => getResearchById(id))
      .filter((n): n is ResearchNode => n !== undefined);
  }

  /**
   * Get total effect value for a type
   */
  getEffect(effectType: ResearchEffectType): number {
    return calculateTotalEffect(this.state, effectType);
  }

  /**
   * Get all active effects
   */
  getAllEffects(): Record<ResearchEffectType, number> {
    const effectTypes: ResearchEffectType[] = [
      'devSpeedBonus', 'baseQualityBonus', 'bugReductionBonus', 'featureValueBonus',
      'conversionRateBonus', 'arppuBonus', 'retentionBonus',
      'ethicalMonetizationUnlock', 'predatoryMonetizationUnlock',
      'playerAcquisitionBonus', 'viralCoefficientBonus', 'brandAwarenessBonus', 'adEfficiencyBonus',
      'serverCostReduction', 'scalingBonus', 'uptimeBonus', 'maxPlayersBonus',
      'moraleDecayReduction', 'skillGrowthBonus', 'salaryEfficiencyBonus',
      'hiringSpeedBonus', 'trainingEfficiencyBonus',
    ];

    const effects: Record<ResearchEffectType, number> = {} as Record<ResearchEffectType, number>;
    for (const type of effectTypes) {
      effects[type] = this.getEffect(type);
    }
    return effects;
  }

  /**
   * Get category completion stats
   */
  getCategoryStats(category: ResearchCategory): ReturnType<typeof getCategoryCompletion> {
    return getCategoryCompletion(this.state, category);
  }

  /**
   * Get overall completion stats
   */
  getOverallStats(): {
    completed: number;
    total: number;
    percentage: number;
    researchPoints: number;
  } {
    return {
      completed: this.state.totalResearchCompleted,
      total: RESEARCH_NODES.length,
      percentage: (this.state.totalResearchCompleted / RESEARCH_NODES.length) * 100,
      researchPoints: this.state.researchPoints,
    };
  }

  /**
   * Check if ethical path is locked
   */
  isEthicalPathLocked(): boolean {
    return this.isCompleted('mon_whale_hunting');
  }

  /**
   * Check if predatory path is locked
   */
  isPredatoryPathLocked(): boolean {
    return this.isCompleted('mon_fair_pricing');
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

let researchManagerInstance: ResearchManager | null = null;

export function getResearchManager(): ResearchManager {
  if (!researchManagerInstance) {
    researchManagerInstance = new ResearchManager();
  }
  return researchManagerInstance;
}

export function resetResearchManager(): void {
  researchManagerInstance = null;
}

// =============================================================================
// Effect Appliers
// =============================================================================

export function applyDevSpeedBonus(baseSpeed: number, manager: ResearchManager): number {
  const bonus = manager.getEffect('devSpeedBonus');
  return baseSpeed * (1 + bonus / 100);
}

export function applyQualityBonus(baseQuality: number, manager: ResearchManager): number {
  const bonus = manager.getEffect('baseQualityBonus');
  return baseQuality * (1 + bonus / 100);
}

export function applyBugReduction(baseBugs: number, manager: ResearchManager): number {
  const reduction = manager.getEffect('bugReductionBonus');
  return baseBugs * (1 - reduction / 100);
}

export function applyServerCostReduction(baseCost: number, manager: ResearchManager): number {
  const reduction = manager.getEffect('serverCostReduction');
  return baseCost * (1 - reduction / 100);
}

export function applyMoraleDecayReduction(baseDecay: number, manager: ResearchManager): number {
  const reduction = manager.getEffect('moraleDecayReduction');
  return baseDecay * (1 - reduction / 100);
}

export function applySkillGrowthBonus(baseGrowth: number, manager: ResearchManager): number {
  const bonus = manager.getEffect('skillGrowthBonus');
  return baseGrowth * (1 + bonus / 100);
}

export function applyPlayerAcquisitionBonus(baseAcquisition: number, manager: ResearchManager): number {
  const bonus = manager.getEffect('playerAcquisitionBonus');
  return baseAcquisition * (1 + bonus / 100);
}

export function applyConversionRateBonus(baseRate: number, manager: ResearchManager): number {
  const bonus = manager.getEffect('conversionRateBonus');
  return baseRate * (1 + bonus / 100);
}
