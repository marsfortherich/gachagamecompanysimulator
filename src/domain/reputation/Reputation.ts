/**
 * Reputation and Player Backlash System
 * Handles reputation mechanics, backlash events, and social media simulation
 */

import { IRNGProvider, defaultRNG } from '../shared';

// ============================================================================
// REPUTATION TIERS
// ============================================================================

export type ReputationTier = 
  | 'beloved'      // 90-100: Industry darling
  | 'respected'    // 70-89: Well-regarded
  | 'neutral'      // 50-69: Average perception
  | 'questionable' // 30-49: Some concerns
  | 'disliked'     // 10-29: Poor reputation
  | 'reviled';     // 0-9: Industry pariah

export interface ReputationTierInfo {
  readonly tier: ReputationTier;
  readonly minReputation: number;
  readonly maxReputation: number;
  readonly acquisitionModifier: number;
  readonly revenueModifier: number;
  readonly employeeRecruitModifier: number;
  readonly mediaAttentionMultiplier: number;
}

export const REPUTATION_TIERS: ReputationTierInfo[] = [
  {
    tier: 'beloved',
    minReputation: 90,
    maxReputation: 100,
    acquisitionModifier: 1.5,
    revenueModifier: 1.3,
    employeeRecruitModifier: 1.5,
    mediaAttentionMultiplier: 2.0,  // More coverage, but positive
  },
  {
    tier: 'respected',
    minReputation: 70,
    maxReputation: 89,
    acquisitionModifier: 1.2,
    revenueModifier: 1.1,
    employeeRecruitModifier: 1.2,
    mediaAttentionMultiplier: 1.3,
  },
  {
    tier: 'neutral',
    minReputation: 50,
    maxReputation: 69,
    acquisitionModifier: 1.0,
    revenueModifier: 1.0,
    employeeRecruitModifier: 1.0,
    mediaAttentionMultiplier: 1.0,
  },
  {
    tier: 'questionable',
    minReputation: 30,
    maxReputation: 49,
    acquisitionModifier: 0.8,
    revenueModifier: 0.9,
    employeeRecruitModifier: 0.7,
    mediaAttentionMultiplier: 1.5,  // More coverage, negative
  },
  {
    tier: 'disliked',
    minReputation: 10,
    maxReputation: 29,
    acquisitionModifier: 0.5,
    revenueModifier: 0.7,
    employeeRecruitModifier: 0.4,
    mediaAttentionMultiplier: 2.0,
  },
  {
    tier: 'reviled',
    minReputation: 0,
    maxReputation: 9,
    acquisitionModifier: 0.2,
    revenueModifier: 0.5,
    employeeRecruitModifier: 0.1,
    mediaAttentionMultiplier: 3.0,  // Maximum scrutiny
  },
];

/**
 * Gets the reputation tier for a given reputation value
 */
export function getReputationTier(reputation: number): ReputationTierInfo {
  const clampedRep = Math.max(0, Math.min(100, reputation));
  return REPUTATION_TIERS.find(
    t => clampedRep >= t.minReputation && clampedRep <= t.maxReputation
  ) ?? REPUTATION_TIERS[2];  // Default to neutral
}

// ============================================================================
// BACKLASH MECHANICS
// ============================================================================

export type BacklashSeverity = 'minor' | 'moderate' | 'severe' | 'catastrophic';

export interface BacklashEvent {
  readonly id: string;
  readonly severity: BacklashSeverity;
  readonly cause: string;
  readonly description: string;
  readonly startDay: number;
  readonly duration: number;
  readonly effects: {
    readonly dailyReputationLoss: number;
    readonly dailyPlayerLoss: number;
    readonly revenueModifier: number;
  };
  readonly resolutionOptions: BacklashResolution[];
}

export interface BacklashResolution {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly cost: number;
  readonly reputationRecovery: number;
  readonly durationReduction: number;  // Days to reduce backlash
  readonly effectiveness: number;  // 0-1, how likely to work
}

export const BACKLASH_SEVERITY_CONFIG: Record<BacklashSeverity, {
  baseReputationLoss: number;
  basePlayerLoss: number;
  baseRevenueModifier: number;
  baseDuration: number;
}> = {
  minor: {
    baseReputationLoss: 0.5,
    basePlayerLoss: 50,
    baseRevenueModifier: -0.05,
    baseDuration: 7,
  },
  moderate: {
    baseReputationLoss: 1,
    basePlayerLoss: 200,
    baseRevenueModifier: -0.10,
    baseDuration: 14,
  },
  severe: {
    baseReputationLoss: 2,
    basePlayerLoss: 500,
    baseRevenueModifier: -0.20,
    baseDuration: 30,
  },
  catastrophic: {
    baseReputationLoss: 5,
    basePlayerLoss: 2000,
    baseRevenueModifier: -0.40,
    baseDuration: 60,
  },
};

/**
 * Creates a backlash event based on severity
 */
export function createBacklashEvent(
  severity: BacklashSeverity,
  cause: string,
  description: string,
  currentDay: number,
  rng: IRNGProvider = defaultRNG
): BacklashEvent {
  const config = BACKLASH_SEVERITY_CONFIG[severity];
  
  // Add some variance
  const variance = 0.8 + rng.random() * 0.4;
  
  return {
    id: `backlash_${currentDay}_${rng.randomInt(1000, 9999)}`,
    severity,
    cause,
    description,
    startDay: currentDay,
    duration: Math.round(config.baseDuration * variance),
    effects: {
      dailyReputationLoss: config.baseReputationLoss * variance,
      dailyPlayerLoss: Math.round(config.basePlayerLoss * variance),
      revenueModifier: config.baseRevenueModifier * variance,
    },
    resolutionOptions: generateResolutionOptions(severity),
  };
}

function generateResolutionOptions(severity: BacklashSeverity): BacklashResolution[] {
  const baseCost = {
    minor: 5000,
    moderate: 20000,
    severe: 50000,
    catastrophic: 100000,
  }[severity];
  
  return [
    {
      id: 'public_apology',
      name: 'Public Apology',
      description: 'Issue a sincere public apology acknowledging mistakes',
      cost: 0,
      reputationRecovery: severity === 'minor' ? 3 : 1,
      durationReduction: Math.round(BACKLASH_SEVERITY_CONFIG[severity].baseDuration * 0.2),
      effectiveness: 0.6,
    },
    {
      id: 'compensation',
      name: 'Player Compensation',
      description: 'Offer in-game compensation to affected players',
      cost: baseCost,
      reputationRecovery: 5,
      durationReduction: Math.round(BACKLASH_SEVERITY_CONFIG[severity].baseDuration * 0.4),
      effectiveness: 0.75,
    },
    {
      id: 'policy_change',
      name: 'Policy Change',
      description: 'Announce and implement concrete policy changes',
      cost: baseCost * 2,
      reputationRecovery: 10,
      durationReduction: Math.round(BACKLASH_SEVERITY_CONFIG[severity].baseDuration * 0.6),
      effectiveness: 0.85,
    },
    {
      id: 'charity_donation',
      name: 'Charity Donation',
      description: 'Make a substantial donation to relevant causes',
      cost: baseCost * 1.5,
      reputationRecovery: 7,
      durationReduction: Math.round(BACKLASH_SEVERITY_CONFIG[severity].baseDuration * 0.3),
      effectiveness: 0.5,  // Can backfire as seeming insincere
    },
  ];
}

// ============================================================================
// SOCIAL MEDIA SIMULATION
// ============================================================================

export type SocialMediaSentiment = 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';

export interface SocialMediaState {
  readonly overallSentiment: SocialMediaSentiment;
  readonly sentimentScore: number;  // -100 to +100
  readonly trendingTopics: string[];
  readonly viralMoments: Array<{
    readonly topic: string;
    readonly isPositive: boolean;
    readonly strength: number;  // 1-10
    readonly dayStarted: number;
    readonly duration: number;
  }>;
  readonly influencerOpinions: Array<{
    readonly name: string;
    readonly followers: number;
    readonly sentiment: SocialMediaSentiment;
    readonly recentPost?: string;
  }>;
}

/**
 * Converts reputation to sentiment score
 */
export function reputationToSentiment(reputation: number): number {
  // Reputation 0-100 maps to sentiment -100 to +100
  return (reputation - 50) * 2;
}

/**
 * Gets sentiment category from score
 */
export function getSentimentCategory(sentimentScore: number): SocialMediaSentiment {
  if (sentimentScore >= 60) return 'very_positive';
  if (sentimentScore >= 20) return 'positive';
  if (sentimentScore >= -20) return 'neutral';
  if (sentimentScore >= -60) return 'negative';
  return 'very_negative';
}

/**
 * Creates initial social media state
 */
export function createInitialSocialMediaState(reputation: number): SocialMediaState {
  const sentimentScore = reputationToSentiment(reputation);
  
  return {
    overallSentiment: getSentimentCategory(sentimentScore),
    sentimentScore,
    trendingTopics: [],
    viralMoments: [],
    influencerOpinions: generateRandomInfluencers(5, reputation),
  };
}

function generateRandomInfluencers(
  count: number,
  baseReputation: number,
  rng: IRNGProvider = defaultRNG
): SocialMediaState['influencerOpinions'] {
  const names = [
    'GachaGamer', 'MobileGameReviewer', 'F2PAdvocate', 'WhaleWatcher',
    'GamingTrends', 'PixelCritic', 'SpendingReport', 'GachaNews',
    'CasinoGaming', 'EthicalGaming', 'GameDesignPro', 'MoneyInGames'
  ];
  
  return Array.from({ length: count }, (_, i) => {
    const baseFollowers = [10000, 50000, 100000, 500000, 1000000];
    const followers = baseFollowers[rng.randomInt(0, baseFollowers.length - 1)] * (0.5 + rng.random());
    
    // Sentiment loosely based on reputation with variance
    const variance = (rng.random() - 0.5) * 40;
    const influencerSentiment = reputationToSentiment(baseReputation) + variance;
    
    return {
      name: names[i % names.length],
      followers: Math.round(followers),
      sentiment: getSentimentCategory(influencerSentiment),
    };
  });
}

/**
 * Simulates social media changes for one day
 */
export function simulateSocialMediaTick(
  state: SocialMediaState,
  reputation: number,
  activeBacklash: BacklashEvent[],
  currentDay: number,
  rng: IRNGProvider = defaultRNG
): SocialMediaState {
  // Base sentiment from reputation
  let baseSentiment = reputationToSentiment(reputation);
  
  // Apply backlash effects
  for (const backlash of activeBacklash) {
    const dayIntoBacklash = currentDay - backlash.startDay;
    if (dayIntoBacklash >= 0 && dayIntoBacklash < backlash.duration) {
      const severityImpact = {
        minor: -10,
        moderate: -25,
        severe: -50,
        catastrophic: -80,
      }[backlash.severity];
      baseSentiment += severityImpact;
    }
  }
  
  // Add daily noise
  const noise = (rng.random() - 0.5) * 10;
  const newSentimentScore = Math.max(-100, Math.min(100, baseSentiment + noise));
  
  // Update viral moments (decay old ones)
  const updatedViralMoments = state.viralMoments.filter(
    vm => currentDay < vm.dayStarted + vm.duration
  );
  
  // Chance for new viral moment
  if (rng.random() < 0.02) {
    const isPositive = rng.random() < (reputation / 100);
    updatedViralMoments.push({
      topic: isPositive ? 'Generous event praised!' : 'Players criticize monetization',
      isPositive,
      strength: rng.randomInt(3, 8),
      dayStarted: currentDay,
      duration: rng.randomInt(2, 7),
    });
  }
  
  // Update influencer opinions (slow drift toward actual sentiment)
  const updatedInfluencers = state.influencerOpinions.map(inf => {
    if (rng.random() < 0.1) {
      // 10% chance to update opinion
      const drift = (newSentimentScore - reputationToSentiment(reputation)) * 0.5;
      const newInfluencerSentiment = reputationToSentiment(reputation) + drift + (rng.random() - 0.5) * 20;
      return {
        ...inf,
        sentiment: getSentimentCategory(newInfluencerSentiment),
      };
    }
    return inf;
  });
  
  return {
    overallSentiment: getSentimentCategory(newSentimentScore),
    sentimentScore: newSentimentScore,
    trendingTopics: generateTrendingTopics(activeBacklash, updatedViralMoments, rng),
    viralMoments: updatedViralMoments,
    influencerOpinions: updatedInfluencers,
  };
}

function generateTrendingTopics(
  backlash: BacklashEvent[],
  viralMoments: SocialMediaState['viralMoments'],
  rng: IRNGProvider
): string[] {
  const topics: string[] = [];
  
  // Add backlash-related topics
  for (const b of backlash) {
    if (rng.random() < 0.5) {
      topics.push(b.cause);
    }
  }
  
  // Add viral moment topics
  for (const vm of viralMoments) {
    if (rng.random() < vm.strength / 10) {
      topics.push(vm.topic);
    }
  }
  
  return topics.slice(0, 5);  // Max 5 trending topics
}

// ============================================================================
// REPUTATION DECAY AND RECOVERY
// ============================================================================

export interface ReputationChange {
  readonly amount: number;
  readonly source: string;
  readonly day: number;
}

/**
 * Calculates natural reputation decay/recovery toward neutral
 */
export function calculateReputationDecay(
  currentReputation: number,
  daysAtCurrentLevel: number
): number {
  const NEUTRAL = 50;
  const DECAY_RATE = 0.001;  // Slow decay
  
  if (currentReputation > NEUTRAL) {
    // High reputation slowly decays (returns negative value)
    const decayAmount = (currentReputation - NEUTRAL) * DECAY_RATE * Math.sqrt(daysAtCurrentLevel);
    return -decayAmount;  // Negative = reputation loss
  } else if (currentReputation < NEUTRAL) {
    // Low reputation slowly recovers
    const recoveryAmount = (NEUTRAL - currentReputation) * DECAY_RATE * Math.sqrt(daysAtCurrentLevel);
    return Math.min(5, recoveryAmount);  // Cap daily recovery
  }
  
  return 0;
}

/**
 * Calculates reputation change from ethical choices
 */
export function calculateEthicalReputationImpact(
  ethicalScore: number,
  publicAwareness: number  // 0-1, how visible the action was
): number {
  // Ethical score: -100 to +100
  // Impact scaled by how public the action was
  const baseImpact = ethicalScore * 0.1;
  return baseImpact * (0.3 + publicAwareness * 0.7);
}

// ============================================================================
// REPUTATION MANAGER
// ============================================================================

export interface ReputationState {
  readonly currentReputation: number;
  readonly reputationHistory: ReputationChange[];
  readonly activeBacklash: BacklashEvent[];
  readonly socialMedia: SocialMediaState;
  readonly daysAtCurrentTier: number;
}

/**
 * Creates initial reputation state
 */
export function createInitialReputationState(reputation: number): ReputationState {
  return {
    currentReputation: reputation,
    reputationHistory: [],
    activeBacklash: [],
    socialMedia: createInitialSocialMediaState(reputation),
    daysAtCurrentTier: 0,
  };
}

/**
 * Applies a reputation change
 */
export function applyReputationChange(
  state: ReputationState,
  change: ReputationChange
): ReputationState {
  const newReputation = Math.max(0, Math.min(100, state.currentReputation + change.amount));
  const currentTier = getReputationTier(state.currentReputation);
  const newTier = getReputationTier(newReputation);
  
  return {
    ...state,
    currentReputation: newReputation,
    reputationHistory: [...state.reputationHistory.slice(-99), change],  // Keep last 100
    daysAtCurrentTier: currentTier.tier === newTier.tier ? state.daysAtCurrentTier + 1 : 0,
  };
}

/**
 * Adds a backlash event
 */
export function addBacklashEvent(
  state: ReputationState,
  backlash: BacklashEvent
): ReputationState {
  return {
    ...state,
    activeBacklash: [...state.activeBacklash, backlash],
  };
}

/**
 * Attempts to resolve a backlash event
 */
export function resolveBacklash(
  state: ReputationState,
  backlashId: string,
  resolutionId: string,
  currentDay: number,
  rng: IRNGProvider = defaultRNG
): {
  newState: ReputationState;
  success: boolean;
  cost: number;
  message: string;
} {
  const backlashIndex = state.activeBacklash.findIndex(b => b.id === backlashId);
  if (backlashIndex === -1) {
    return {
      newState: state,
      success: false,
      cost: 0,
      message: 'Backlash event not found',
    };
  }
  
  const backlash = state.activeBacklash[backlashIndex];
  const resolution = backlash.resolutionOptions.find(r => r.id === resolutionId);
  
  if (!resolution) {
    return {
      newState: state,
      success: false,
      cost: 0,
      message: 'Resolution option not found',
    };
  }
  
  const success = rng.random() < resolution.effectiveness;
  
  if (success) {
    const updatedBacklash: BacklashEvent = {
      ...backlash,
      duration: Math.max(1, backlash.duration - resolution.durationReduction),
    };
    
    const updatedActiveBacklash = [...state.activeBacklash];
    updatedActiveBacklash[backlashIndex] = updatedBacklash;
    
    const newState = applyReputationChange(
      {
        ...state,
        activeBacklash: updatedActiveBacklash,
      },
      {
        amount: resolution.reputationRecovery,
        source: `Resolved: ${resolution.name}`,
        day: currentDay,
      }
    );
    
    return {
      newState,
      success: true,
      cost: resolution.cost,
      message: `${resolution.name} was effective! Reputation improved.`,
    };
  } else {
    return {
      newState: state,
      success: false,
      cost: resolution.cost,
      message: `${resolution.name} failed to improve the situation.`,
    };
  }
}

/**
 * Cleans up expired backlash events
 */
export function cleanupExpiredBacklash(
  state: ReputationState,
  currentDay: number
): ReputationState {
  const activeBacklash = state.activeBacklash.filter(
    b => currentDay < b.startDay + b.duration
  );
  
  return { ...state, activeBacklash };
}

/**
 * Simulates one day of reputation changes
 */
export function simulateReputationTick(
  state: ReputationState,
  currentDay: number,
  rng: IRNGProvider = defaultRNG
): ReputationState {
  let newState = state;
  
  // Apply backlash effects
  for (const backlash of state.activeBacklash) {
    const dayIntoBacklash = currentDay - backlash.startDay;
    if (dayIntoBacklash >= 0 && dayIntoBacklash < backlash.duration) {
      newState = applyReputationChange(newState, {
        amount: -backlash.effects.dailyReputationLoss,
        source: backlash.cause,
        day: currentDay,
      });
    }
  }
  
  // Apply natural decay/recovery
  const decay = calculateReputationDecay(newState.currentReputation, newState.daysAtCurrentTier);
  if (Math.abs(decay) > 0.01) {
    newState = applyReputationChange(newState, {
      amount: decay,
      source: 'Natural drift',
      day: currentDay,
    });
  }
  
  // Clean up expired backlash
  newState = cleanupExpiredBacklash(newState, currentDay);
  
  // Update social media
  newState = {
    ...newState,
    socialMedia: simulateSocialMediaTick(
      newState.socialMedia,
      newState.currentReputation,
      newState.activeBacklash,
      currentDay,
      rng
    ),
  };
  
  return newState;
}
