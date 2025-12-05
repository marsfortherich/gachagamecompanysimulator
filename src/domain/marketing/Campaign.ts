import { Entity, generateId } from '../shared';

/**
 * Types of marketing campaigns
 */
export type CampaignType =
  | 'social_media'
  | 'collaboration'
  | 'livestream'
  | 'ad_campaign'
  | 'influencer_short'
  | 'influencer_long';

/**
 * Campaign status
 */
export type CampaignStatus = 'active' | 'completed' | 'cancelled';

/**
 * Campaign definition with costs and effects
 */
export interface CampaignDefinition {
  readonly type: CampaignType;
  readonly name: string;
  readonly icon: string;
  readonly description: string;
  readonly baseCost: number;
  readonly costScaling: number;      // How much cost scales with DAU
  readonly dauBoost: number;         // Percentage DAU boost (0.10 = 10%)
  readonly retentionBoost: number;   // Percentage retention boost
  readonly revenueBoost: number;     // Percentage revenue boost
  readonly duration: number;         // Duration in days (ticks)
  readonly cooldown: number;         // Days before can run again
}

/**
 * All available campaign definitions
 */
export const CAMPAIGN_DEFINITIONS: Record<CampaignType, CampaignDefinition> = {
  social_media: {
    type: 'social_media',
    name: 'Social Media Campaign',
    icon: '📱',
    description: 'Boost visibility through targeted social media ads and viral content',
    baseCost: 5000,
    costScaling: 0.5,
    dauBoost: 0.15,
    retentionBoost: 0,
    revenueBoost: 0,
    duration: 7,
    cooldown: 3,
  },
  collaboration: {
    type: 'collaboration',
    name: 'Game Collaboration',
    icon: '🤝',
    description: 'Cross-promotion event with another popular game',
    baseCost: 15000,
    costScaling: 1.0,
    dauBoost: 0.25,
    retentionBoost: 0.05,
    revenueBoost: 0.10,
    duration: 14,
    cooldown: 30,
  },
  livestream: {
    type: 'livestream',
    name: 'Livestream Event',
    icon: '🎬',
    description: 'Live developer stream with giveaways and exclusive reveals',
    baseCost: 2000,
    costScaling: 0.2,
    dauBoost: 0.08,
    retentionBoost: 0.10,
    revenueBoost: 0,
    duration: 1,
    cooldown: 7,
  },
  ad_campaign: {
    type: 'ad_campaign',
    name: 'Ad Campaign',
    icon: '📺',
    description: 'Traditional advertising across platforms and app stores',
    baseCost: 25000,
    costScaling: 1.5,
    dauBoost: 0.30,
    retentionBoost: 0,
    revenueBoost: 0,
    duration: 30,
    cooldown: 14,
  },
  influencer_short: {
    type: 'influencer_short',
    name: 'Influencer Deal (Short)',
    icon: '⭐',
    description: 'One-time sponsored content from popular streamers and content creators',
    baseCost: 8000,
    costScaling: 0.8,
    dauBoost: 0.20,
    retentionBoost: 0,
    revenueBoost: 0.05,
    duration: 3,
    cooldown: 7,
  },
  influencer_long: {
    type: 'influencer_long',
    name: 'Influencer Partnership',
    icon: '🌟',
    description: 'Long-term partnership with influencers for ongoing content and promotion',
    baseCost: 50000,
    costScaling: 2.0,
    dauBoost: 0.15,        // Lower daily boost but sustained
    retentionBoost: 0.15,  // Better retention from authentic content
    revenueBoost: 0.10,    // Revenue boost from affiliate codes
    duration: 60,          // 2 months
    cooldown: 30,
  },
};

/**
 * An active or completed marketing campaign
 */
export interface Campaign extends Entity {
  readonly type: CampaignType;
  readonly gameId: string;
  readonly status: CampaignStatus;
  readonly startTick: number;
  readonly endTick: number;
  readonly cost: number;
  readonly effects: CampaignEffects;
}

/**
 * The active effects of a campaign
 */
export interface CampaignEffects {
  readonly dauBoost: number;
  readonly retentionBoost: number;
  readonly revenueBoost: number;
}

/**
 * Parameters for creating a new campaign
 */
export interface CreateCampaignParams {
  type: CampaignType;
  gameId: string;
  currentTick: number;
  gameDau: number;
}

/**
 * Creates a new campaign instance
 */
export function createCampaign(params: CreateCampaignParams): Campaign {
  const definition = CAMPAIGN_DEFINITIONS[params.type];
  
  // Calculate cost based on DAU
  const dauFactor = Math.max(1, params.gameDau / 1000);
  const cost = Math.round(definition.baseCost + (definition.costScaling * Math.sqrt(dauFactor) * 1000));

  return {
    id: generateId(),
    type: params.type,
    gameId: params.gameId,
    status: 'active',
    startTick: params.currentTick,
    endTick: params.currentTick + definition.duration,
    cost,
    effects: {
      dauBoost: definition.dauBoost,
      retentionBoost: definition.retentionBoost,
      revenueBoost: definition.revenueBoost,
    },
  };
}

/**
 * Calculate the cost of a campaign for a specific game
 */
export function calculateCampaignCost(type: CampaignType, gameDau: number): number {
  const definition = CAMPAIGN_DEFINITIONS[type];
  const dauFactor = Math.max(1, gameDau / 1000);
  return Math.round(definition.baseCost + (definition.costScaling * Math.sqrt(dauFactor) * 1000));
}

/**
 * Check if a campaign type is on cooldown for a game
 */
export function isCampaignOnCooldown(
  type: CampaignType,
  gameId: string,
  campaigns: readonly Campaign[],
  currentTick: number
): boolean {
  const definition = CAMPAIGN_DEFINITIONS[type];
  
  // Find the most recent campaign of this type for this game
  const recentCampaign = campaigns
    .filter(c => c.type === type && c.gameId === gameId)
    .sort((a, b) => b.endTick - a.endTick)[0];
  
  if (!recentCampaign) return false;
  
  // Check if cooldown has passed
  const cooldownEnd = recentCampaign.endTick + definition.cooldown;
  return currentTick < cooldownEnd;
}

/**
 * Get remaining cooldown days for a campaign type
 */
export function getCampaignCooldownRemaining(
  type: CampaignType,
  gameId: string,
  campaigns: readonly Campaign[],
  currentTick: number
): number {
  const definition = CAMPAIGN_DEFINITIONS[type];
  
  const recentCampaign = campaigns
    .filter(c => c.type === type && c.gameId === gameId)
    .sort((a, b) => b.endTick - a.endTick)[0];
  
  if (!recentCampaign) return 0;
  
  const cooldownEnd = recentCampaign.endTick + definition.cooldown;
  return Math.max(0, cooldownEnd - currentTick);
}

/**
 * Check if a campaign type is currently active for a game
 */
export function isCampaignActive(
  type: CampaignType,
  gameId: string,
  campaigns: readonly Campaign[]
): boolean {
  return campaigns.some(
    c => c.type === type && c.gameId === gameId && c.status === 'active'
  );
}

/**
 * Get all active campaigns for a game
 */
export function getActiveCampaigns(
  gameId: string,
  campaigns: readonly Campaign[]
): Campaign[] {
  return campaigns.filter(c => c.gameId === gameId && c.status === 'active');
}

/**
 * Calculate combined effects from all active campaigns for a game
 */
export function getCombinedCampaignEffects(
  gameId: string,
  campaigns: readonly Campaign[]
): CampaignEffects {
  const activeCampaigns = getActiveCampaigns(gameId, campaigns);
  
  return activeCampaigns.reduce(
    (combined, campaign) => ({
      dauBoost: combined.dauBoost + campaign.effects.dauBoost,
      retentionBoost: combined.retentionBoost + campaign.effects.retentionBoost,
      revenueBoost: combined.revenueBoost + campaign.effects.revenueBoost,
    }),
    { dauBoost: 0, retentionBoost: 0, revenueBoost: 0 }
  );
}

/**
 * Update campaign status based on current tick
 */
export function updateCampaignStatus(campaign: Campaign, currentTick: number): Campaign {
  if (campaign.status === 'active' && currentTick >= campaign.endTick) {
    return { ...campaign, status: 'completed' };
  }
  return campaign;
}
