/**
 * Feature Roadmap System
 * 
 * Allows players to plan and schedule future features, content updates, 
 * DLCs, and seasonal events for their games.
 */

import { EntityId, generateId } from '../shared';

/**
 * Types of scheduled features/content
 */
export type FeatureType =
  | 'content_update'      // New story, levels, characters
  | 'seasonal_event'      // Limited-time event (holiday, anniversary)
  | 'dlc_expansion'       // Major expansion pack
  | 'quality_of_life'     // QoL improvements, bug fixes
  | 'monetization_update' // New monetization features
  | 'collaboration'       // Collab with other IP
  | 'anniversary'         // Anniversary celebration
  | 'balance_patch';      // Balance adjustments

/**
 * Status of a scheduled feature
 */
export type FeatureStatus =
  | 'planned'      // Scheduled but not started
  | 'in_progress'  // Currently being developed
  | 'ready'        // Development complete, awaiting release
  | 'released'     // Live in game
  | 'cancelled';   // Cancelled

/**
 * Configuration for feature types
 */
export interface FeatureTypeConfig {
  readonly type: FeatureType;
  readonly name: string;
  readonly description: string;
  readonly baseDevelopmentDays: number;
  readonly baseCost: number;
  readonly satisfactionBoost: number;    // Boost to player satisfaction on release
  readonly revenueMultiplier: number;    // Temporary revenue boost (e.g., 1.2 = 20% boost)
  readonly revenueBoostDays: number;     // How long the revenue boost lasts
  readonly retentionBoost: number;       // Boost to retention rate (e.g., 0.02 = +2%)
  readonly requiredTeamSize: number;     // Minimum team size to develop
}

export const FEATURE_TYPE_CONFIGS: Record<FeatureType, FeatureTypeConfig> = {
  content_update: {
    type: 'content_update',
    name: 'Content Update',
    description: 'Add new story chapters, characters, or gameplay content.',
    baseDevelopmentDays: 14,
    baseCost: 10000,
    satisfactionBoost: 15,
    revenueMultiplier: 1.15,
    revenueBoostDays: 7,
    retentionBoost: 0.02,
    requiredTeamSize: 2,
  },
  seasonal_event: {
    type: 'seasonal_event',
    name: 'Seasonal Event',
    description: 'Limited-time holiday or special event with exclusive rewards.',
    baseDevelopmentDays: 21,
    baseCost: 25000,
    satisfactionBoost: 25,
    revenueMultiplier: 1.4,
    revenueBoostDays: 14,
    retentionBoost: 0.05,
    requiredTeamSize: 3,
  },
  dlc_expansion: {
    type: 'dlc_expansion',
    name: 'DLC Expansion',
    description: 'Major content expansion with new features and systems.',
    baseDevelopmentDays: 45,
    baseCost: 75000,
    satisfactionBoost: 40,
    revenueMultiplier: 1.6,
    revenueBoostDays: 30,
    retentionBoost: 0.08,
    requiredTeamSize: 5,
  },
  quality_of_life: {
    type: 'quality_of_life',
    name: 'QoL Update',
    description: 'Quality of life improvements and bug fixes.',
    baseDevelopmentDays: 7,
    baseCost: 5000,
    satisfactionBoost: 10,
    revenueMultiplier: 1.0,
    revenueBoostDays: 0,
    retentionBoost: 0.03,
    requiredTeamSize: 1,
  },
  monetization_update: {
    type: 'monetization_update',
    name: 'Monetization Update',
    description: 'New shop items, bundles, or purchasing options.',
    baseDevelopmentDays: 10,
    baseCost: 8000,
    satisfactionBoost: -5, // Players don't love monetization pushes
    revenueMultiplier: 1.25,
    revenueBoostDays: 14,
    retentionBoost: -0.01,
    requiredTeamSize: 2,
  },
  collaboration: {
    type: 'collaboration',
    name: 'Collaboration Event',
    description: 'Crossover event with another IP or brand.',
    baseDevelopmentDays: 30,
    baseCost: 100000,
    satisfactionBoost: 35,
    revenueMultiplier: 1.8,
    revenueBoostDays: 14,
    retentionBoost: 0.06,
    requiredTeamSize: 4,
  },
  anniversary: {
    type: 'anniversary',
    name: 'Anniversary Event',
    description: 'Celebrate game milestones with special rewards and content.',
    baseDevelopmentDays: 21,
    baseCost: 30000,
    satisfactionBoost: 30,
    revenueMultiplier: 1.5,
    revenueBoostDays: 14,
    retentionBoost: 0.04,
    requiredTeamSize: 3,
  },
  balance_patch: {
    type: 'balance_patch',
    name: 'Balance Patch',
    description: 'Balance adjustments and meta changes.',
    baseDevelopmentDays: 5,
    baseCost: 3000,
    satisfactionBoost: 5,
    revenueMultiplier: 1.0,
    revenueBoostDays: 0,
    retentionBoost: 0.01,
    requiredTeamSize: 1,
  },
};

/**
 * A scheduled feature on the roadmap
 */
export interface ScheduledFeature {
  readonly id: EntityId;
  readonly gameId: EntityId;
  readonly type: FeatureType;
  readonly name: string;
  readonly description: string;
  readonly status: FeatureStatus;
  readonly scheduledStartTick: number;    // When development should start
  readonly scheduledReleaseTick: number;  // When it should be released
  readonly actualStartTick: number | null;
  readonly actualReleaseTick: number | null;
  readonly developmentProgress: number;   // 0-100
  readonly assignedEmployees: EntityId[];
  readonly cost: number;
  readonly costPaid: boolean;
}

/**
 * Active boost from a released feature
 */
export interface FeatureBoost {
  readonly featureId: EntityId;
  readonly gameId: EntityId;
  readonly revenueMultiplier: number;
  readonly retentionBoost: number;
  readonly expiresAtTick: number;
}

/**
 * Create a new scheduled feature
 */
export interface CreateScheduledFeatureParams {
  gameId: EntityId;
  type: FeatureType;
  name: string;
  description?: string;
  scheduledStartTick: number;
}

export function createScheduledFeature(params: CreateScheduledFeatureParams): ScheduledFeature {
  const config = FEATURE_TYPE_CONFIGS[params.type];
  const scheduledReleaseTick = params.scheduledStartTick + config.baseDevelopmentDays;
  
  return {
    id: generateId(),
    gameId: params.gameId,
    type: params.type,
    name: params.name,
    description: params.description ?? config.description,
    status: 'planned',
    scheduledStartTick: params.scheduledStartTick,
    scheduledReleaseTick,
    actualStartTick: null,
    actualReleaseTick: null,
    developmentProgress: 0,
    assignedEmployees: [],
    cost: config.baseCost,
    costPaid: false,
  };
}

/**
 * Start development on a feature
 */
export function startFeatureDevelopment(
  feature: ScheduledFeature,
  currentTick: number
): ScheduledFeature {
  if (feature.status !== 'planned') return feature;
  
  return {
    ...feature,
    status: 'in_progress',
    actualStartTick: currentTick,
  };
}

/**
 * Update feature development progress
 */
export function updateFeatureProgress(
  feature: ScheduledFeature,
  progressAmount: number
): ScheduledFeature {
  if (feature.status !== 'in_progress') return feature;
  
  const newProgress = Math.min(100, feature.developmentProgress + progressAmount);
  const newStatus = newProgress >= 100 ? 'ready' : 'in_progress';
  
  return {
    ...feature,
    developmentProgress: newProgress,
    status: newStatus,
  };
}

/**
 * Release a completed feature
 */
export function releaseFeature(
  feature: ScheduledFeature,
  currentTick: number
): ScheduledFeature {
  if (feature.status !== 'ready') return feature;
  
  return {
    ...feature,
    status: 'released',
    actualReleaseTick: currentTick,
  };
}

/**
 * Cancel a planned or in-progress feature
 */
export function cancelFeature(feature: ScheduledFeature): ScheduledFeature {
  if (feature.status === 'released') return feature;
  
  return {
    ...feature,
    status: 'cancelled',
  };
}

/**
 * Create a boost effect from a released feature
 */
export function createFeatureBoost(
  feature: ScheduledFeature,
  currentTick: number
): FeatureBoost | null {
  if (feature.status !== 'released') return null;
  
  const config = FEATURE_TYPE_CONFIGS[feature.type];
  if (config.revenueBoostDays === 0 && config.retentionBoost === 0) {
    return null; // No boost effect
  }
  
  return {
    featureId: feature.id,
    gameId: feature.gameId,
    revenueMultiplier: config.revenueMultiplier,
    retentionBoost: config.retentionBoost,
    expiresAtTick: currentTick + config.revenueBoostDays,
  };
}

/**
 * Calculate combined boost effects for a game
 */
export function calculateCombinedBoosts(
  gameId: EntityId,
  boosts: FeatureBoost[],
  currentTick: number
): { revenueMultiplier: number; retentionBoost: number } {
  const activeBoosts = boosts.filter(
    b => b.gameId === gameId && b.expiresAtTick > currentTick
  );
  
  // Combine multipliers (multiplicative for revenue, additive for retention)
  let revenueMultiplier = 1.0;
  let retentionBoost = 0;
  
  for (const boost of activeBoosts) {
    revenueMultiplier *= boost.revenueMultiplier;
    retentionBoost += boost.retentionBoost;
  }
  
  return { revenueMultiplier, retentionBoost };
}

/**
 * Get upcoming features for a game within a time window
 */
export function getUpcomingFeatures(
  features: ScheduledFeature[],
  gameId: EntityId,
  currentTick: number,
  windowDays: number = 90
): ScheduledFeature[] {
  const windowEnd = currentTick + windowDays;
  
  return features.filter(
    f => f.gameId === gameId &&
         (f.status === 'planned' || f.status === 'in_progress' || f.status === 'ready') &&
         f.scheduledReleaseTick <= windowEnd
  ).sort((a, b) => a.scheduledReleaseTick - b.scheduledReleaseTick);
}
