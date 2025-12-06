/**
 * Multi-Phase Game Launch System
 * 
 * Implements a staged release process:
 * Alpha → Beta → Soft Launch → Global Launch
 * 
 * Each phase has distinct characteristics, feedback systems, and requirements.
 */

import { EntityId } from '../shared';

/**
 * Launch phases (subset of GameStatus focused on pre-launch)
 */
export type LaunchPhase = 
  | 'alpha'
  | 'beta'
  | 'soft_launch'
  | 'global_launch';

/**
 * Feedback types players can generate during testing phases
 */
export type FeedbackType =
  | 'bug_report'
  | 'balance_issue'
  | 'ui_suggestion'
  | 'content_request'
  | 'performance_issue'
  | 'monetization_concern'
  | 'positive_feedback';

/**
 * Player feedback item
 */
export interface PlayerFeedback {
  readonly id: EntityId;
  readonly gameId: EntityId;
  readonly phase: LaunchPhase;
  readonly type: FeedbackType;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly description: string;
  readonly resolved: boolean;
  readonly tickCreated: number;
  readonly tickResolved: number | null;
}

/**
 * Configuration for each launch phase
 */
export interface LaunchPhaseConfig {
  readonly phase: LaunchPhase;
  readonly name: string;
  readonly description: string;
  readonly minDurationDays: number;
  readonly recommendedDurationDays: number;
  readonly maxDurationDays: number;
  readonly playerMultiplier: number;      // Fraction of potential players (e.g., 0.01 = 1%)
  readonly revenueMultiplier: number;     // Revenue compared to full launch
  readonly feedbackRate: number;          // Feedback items per day per 1000 players
  readonly criticalBugChance: number;     // Chance of critical bug per day
  readonly previousPhaseRequired: LaunchPhase | null;
  readonly qualityRequirement: number;    // Minimum overall quality to proceed
}

export const LAUNCH_PHASE_CONFIGS: Record<LaunchPhase, LaunchPhaseConfig> = {
  alpha: {
    phase: 'alpha',
    name: 'Alpha Release',
    description: 'Internal testing with limited features. Focus on core mechanics and stability.',
    minDurationDays: 7,
    recommendedDurationDays: 14,
    maxDurationDays: 30,
    playerMultiplier: 0.005,  // 0.5% of potential players
    revenueMultiplier: 0,     // No revenue in alpha
    feedbackRate: 5.0,        // High feedback rate
    criticalBugChance: 0.15,
    previousPhaseRequired: null,
    qualityRequirement: 30,
  },
  beta: {
    phase: 'beta',
    name: 'Beta Release',
    description: 'Wider testing with most features. Gather player feedback and fix bugs.',
    minDurationDays: 14,
    recommendedDurationDays: 21,
    maxDurationDays: 45,
    playerMultiplier: 0.05,   // 5% of potential players
    revenueMultiplier: 0.1,   // 10% revenue (optional purchases)
    feedbackRate: 3.0,
    criticalBugChance: 0.08,
    previousPhaseRequired: 'alpha',
    qualityRequirement: 50,
  },
  soft_launch: {
    phase: 'soft_launch',
    name: 'Soft Launch',
    description: 'Regional release to test monetization and server capacity.',
    minDurationDays: 14,
    recommendedDurationDays: 30,
    maxDurationDays: 60,
    playerMultiplier: 0.2,    // 20% of potential players
    revenueMultiplier: 0.5,   // 50% revenue
    feedbackRate: 1.5,
    criticalBugChance: 0.03,
    previousPhaseRequired: 'beta',
    qualityRequirement: 65,
  },
  global_launch: {
    phase: 'global_launch',
    name: 'Global Launch',
    description: 'Full worldwide release with all features and monetization.',
    minDurationDays: 0,       // Infinite
    recommendedDurationDays: 0,
    maxDurationDays: 0,
    playerMultiplier: 1.0,    // 100% of potential players
    revenueMultiplier: 1.0,   // Full revenue
    feedbackRate: 0.5,
    criticalBugChance: 0.01,
    previousPhaseRequired: 'soft_launch',
    qualityRequirement: 70,
  },
};

/**
 * State of a game's launch process
 */
export interface LaunchState {
  readonly gameId: EntityId;
  readonly currentPhase: LaunchPhase;
  readonly phaseStartTick: number;
  readonly extendedDays: number;         // Additional days added to phase
  readonly shortenedDays: number;        // Days removed from phase
  readonly resolvedFeedbackCount: number;
  readonly totalFeedbackCount: number;
  readonly criticalBugsFound: number;
  readonly criticalBugsFixed: number;
  readonly phaseHistory: LaunchPhaseHistory[];
}

/**
 * History of completed launch phases
 */
export interface LaunchPhaseHistory {
  readonly phase: LaunchPhase;
  readonly startTick: number;
  readonly endTick: number;
  readonly feedbackResolved: number;
  readonly feedbackTotal: number;
  readonly qualityAtEnd: number;
}

/**
 * Create initial launch state when entering testing
 */
export function createLaunchState(gameId: EntityId, currentTick: number): LaunchState {
  return {
    gameId,
    currentPhase: 'alpha',
    phaseStartTick: currentTick,
    extendedDays: 0,
    shortenedDays: 0,
    resolvedFeedbackCount: 0,
    totalFeedbackCount: 0,
    criticalBugsFound: 0,
    criticalBugsFixed: 0,
    phaseHistory: [],
  };
}

/**
 * Check if a game can proceed to next launch phase
 */
export function canProceedToNextPhase(
  launchState: LaunchState,
  currentTick: number,
  overallQuality: number,
  unresolvedCriticalBugs: number
): { canProceed: boolean; reason?: string } {
  const config = LAUNCH_PHASE_CONFIGS[launchState.currentPhase];
  const daysInPhase = currentTick - launchState.phaseStartTick;
  const adjustedMinDays = config.minDurationDays - launchState.shortenedDays + launchState.extendedDays;
  
  if (launchState.currentPhase === 'global_launch') {
    return { canProceed: false, reason: 'Already at global launch' };
  }
  
  if (daysInPhase < adjustedMinDays) {
    return { 
      canProceed: false, 
      reason: `Minimum ${adjustedMinDays - daysInPhase} more days required` 
    };
  }
  
  // Get next phase config for quality requirement
  const phases: LaunchPhase[] = ['alpha', 'beta', 'soft_launch', 'global_launch'];
  const currentIndex = phases.indexOf(launchState.currentPhase);
  const nextPhase = phases[currentIndex + 1];
  const nextConfig = LAUNCH_PHASE_CONFIGS[nextPhase];
  
  if (overallQuality < nextConfig.qualityRequirement) {
    return { 
      canProceed: false, 
      reason: `Quality ${Math.round(overallQuality)} below ${nextConfig.qualityRequirement} requirement` 
    };
  }
  
  if (unresolvedCriticalBugs > 0) {
    return { 
      canProceed: false, 
      reason: `${unresolvedCriticalBugs} critical bugs must be fixed` 
    };
  }
  
  return { canProceed: true };
}

/**
 * Advance to next launch phase
 */
export function advanceToNextPhase(
  launchState: LaunchState,
  currentTick: number,
  overallQuality: number
): LaunchState {
  const phases: LaunchPhase[] = ['alpha', 'beta', 'soft_launch', 'global_launch'];
  const currentIndex = phases.indexOf(launchState.currentPhase);
  
  if (currentIndex >= phases.length - 1) {
    return launchState; // Already at global launch
  }
  
  const history: LaunchPhaseHistory = {
    phase: launchState.currentPhase,
    startTick: launchState.phaseStartTick,
    endTick: currentTick,
    feedbackResolved: launchState.resolvedFeedbackCount,
    feedbackTotal: launchState.totalFeedbackCount,
    qualityAtEnd: overallQuality,
  };
  
  return {
    ...launchState,
    currentPhase: phases[currentIndex + 1],
    phaseStartTick: currentTick,
    extendedDays: 0,
    shortenedDays: 0,
    resolvedFeedbackCount: 0,
    totalFeedbackCount: 0,
    phaseHistory: [...launchState.phaseHistory, history],
  };
}

/**
 * Extend current phase duration
 */
export function extendPhase(launchState: LaunchState, days: number): LaunchState {
  return {
    ...launchState,
    extendedDays: launchState.extendedDays + days,
  };
}

/**
 * Shorten current phase duration (if progress is good)
 */
export function shortenPhase(launchState: LaunchState, days: number): LaunchState {
  const config = LAUNCH_PHASE_CONFIGS[launchState.currentPhase];
  const maxShorten = Math.floor(config.minDurationDays * 0.3); // Can shorten by up to 30%
  const actualShorten = Math.min(days, maxShorten - launchState.shortenedDays);
  
  return {
    ...launchState,
    shortenedDays: launchState.shortenedDays + actualShorten,
  };
}

/**
 * Generate feedback based on current phase
 */
export function generateFeedback(
  gameId: EntityId,
  phase: LaunchPhase,
  currentTick: number,
  playerCount: number,
  overallQuality: number
): PlayerFeedback[] {
  const config = LAUNCH_PHASE_CONFIGS[phase];
  const baseRate = config.feedbackRate * (playerCount / 1000);
  
  // Quality affects feedback - lower quality = more negative feedback
  const qualityModifier = 1 + (70 - overallQuality) / 100;
  const adjustedRate = baseRate * qualityModifier;
  
  const feedbackCount = Math.floor(adjustedRate * Math.random() * 2);
  const feedback: PlayerFeedback[] = [];
  
  const feedbackTypes: FeedbackType[] = [
    'bug_report', 'balance_issue', 'ui_suggestion', 
    'content_request', 'performance_issue', 'monetization_concern', 'positive_feedback'
  ];
  
  const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
  const severityWeights = overallQuality > 60 
    ? [0.4, 0.35, 0.2, 0.05]  // High quality = fewer critical issues
    : [0.2, 0.3, 0.35, 0.15]; // Low quality = more critical issues
  
  for (let i = 0; i < feedbackCount; i++) {
    const typeIndex = Math.floor(Math.random() * feedbackTypes.length);
    const type = feedbackTypes[typeIndex];
    
    // Weighted random severity
    const rand = Math.random();
    let cumulativeWeight = 0;
    let severityIndex = 0;
    for (let j = 0; j < severityWeights.length; j++) {
      cumulativeWeight += severityWeights[j];
      if (rand < cumulativeWeight) {
        severityIndex = j;
        break;
      }
    }
    
    feedback.push({
      id: `feedback-${currentTick}-${i}`,
      gameId,
      phase,
      type,
      severity: severities[severityIndex],
      description: generateFeedbackDescription(type, severities[severityIndex]),
      resolved: false,
      tickCreated: currentTick,
      tickResolved: null,
    });
  }
  
  return feedback;
}

/**
 * Generate a feedback description based on type and severity
 */
function generateFeedbackDescription(type: FeedbackType, severity: 'low' | 'medium' | 'high' | 'critical'): string {
  const descriptions: Record<FeedbackType, Record<string, string[]>> = {
    bug_report: {
      low: ['Minor visual glitch', 'Text typo found', 'Animation hiccup'],
      medium: ['Button sometimes unresponsive', 'Sound cuts out occasionally', 'UI element misaligned'],
      high: ['Progress not saving properly', 'Crashes on specific screens', 'Major feature broken'],
      critical: ['Game crashes on startup', 'Data corruption issue', 'Infinite loading bug'],
    },
    balance_issue: {
      low: ['Slightly overtuned ability', 'Minor stat imbalance'],
      medium: ['Character feels weak', 'Stage difficulty spike'],
      high: ['Meta too centralized', 'Progression feels too slow'],
      critical: ['Completely broken combo', 'P2W feeling too strong'],
    },
    ui_suggestion: {
      low: ['Could use better icons', 'Color scheme suggestion'],
      medium: ['Navigation is confusing', 'Need better tutorials'],
      high: ['Critical info hard to find', 'Menus too cluttered'],
      critical: ['UI unusable on some devices', 'Accessibility issues'],
    },
    content_request: {
      low: ['Want more cosmetics', 'Suggest new character'],
      medium: ['Need more story content', 'Want new game modes'],
      high: ['Content drought concern', 'End-game lacking'],
      critical: ['Game feels incomplete', 'Major features missing'],
    },
    performance_issue: {
      low: ['Slight FPS drops', 'Minor loading delays'],
      medium: ['Noticeable lag in battles', 'Loading times too long'],
      high: ['Severe frame drops', 'Memory issues'],
      critical: ['Unplayable performance', 'Device overheating'],
    },
    monetization_concern: {
      low: ['Prices seem high', 'Want more free options'],
      medium: ['Gacha rates feel low', 'Bundles not valuable'],
      high: ['Progression paywall', 'Too many limited offers'],
      critical: ['Feels exploitative', 'Predatory monetization'],
    },
    positive_feedback: {
      low: ['Graphics look nice', 'Music is pleasant'],
      medium: ['Really enjoying the story', 'Gameplay is fun'],
      high: ['Best game in the genre', 'Highly recommend'],
      critical: ['Changed my life', 'GOTY material'],
    },
  };
  
  const options = descriptions[type][severity];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Resolve a feedback item
 */
export function resolveFeedback(
  feedback: PlayerFeedback,
  currentTick: number
): PlayerFeedback {
  return {
    ...feedback,
    resolved: true,
    tickResolved: currentTick,
  };
}

/**
 * Get phase progress percentage
 */
export function getPhaseProgress(
  launchState: LaunchState,
  currentTick: number
): number {
  const config = LAUNCH_PHASE_CONFIGS[launchState.currentPhase];
  const daysInPhase = currentTick - launchState.phaseStartTick;
  const targetDays = config.recommendedDurationDays + launchState.extendedDays - launchState.shortenedDays;
  
  if (targetDays === 0) return 100; // Global launch
  return Math.min(100, (daysInPhase / targetDays) * 100);
}
