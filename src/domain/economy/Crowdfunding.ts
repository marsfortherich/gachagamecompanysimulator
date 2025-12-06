/**
 * Kickstarter Crowdfunding System
 * 
 * Alternative to starting capital where players create campaigns
 * with funding goals, monthly payouts, and milestone requirements.
 */

import { EntityId, generateId } from '../shared';
import { GameGenre } from '../game/Game';

/**
 * Campaign status
 */
export type CrowdfundingStatus =
  | 'planning'        // Setting up campaign
  | 'active'          // Campaign is live, collecting pledges
  | 'funded'          // Successfully funded, development in progress
  | 'completed'       // All milestones met, rewards delivered
  | 'failed'          // Didn't reach goal or missed critical milestones
  | 'cancelled';      // Player cancelled the campaign

/**
 * Milestone types for crowdfunding campaigns
 */
export type MilestoneType =
  | 'alpha_release'
  | 'beta_release'
  | 'soft_launch'
  | 'global_launch'
  | 'content_update'
  | 'dlc_release';

/**
 * A milestone that backers expect
 */
export interface CampaignMilestone {
  readonly id: EntityId;
  readonly type: MilestoneType;
  readonly name: string;
  readonly description: string;
  readonly targetTick: number;         // Deadline
  readonly completed: boolean;
  readonly completedTick: number | null;
  readonly fundingPercentage: number;  // % of funds released on completion
}

/**
 * Backer reward tier
 */
export interface RewardTier {
  readonly id: EntityId;
  readonly name: string;
  readonly description: string;
  readonly pledgeAmount: number;
  readonly backerCount: number;
  readonly rewards: string[];          // List of rewards
  readonly estimatedDelivery: number;  // Ticks from campaign end
}

/**
 * Crowdfunding campaign
 */
export interface CrowdfundingCampaign {
  readonly id: EntityId;
  readonly gameId: EntityId | null;    // Linked game (null until created)
  readonly name: string;
  readonly description: string;
  readonly genre: GameGenre;
  readonly status: CrowdfundingStatus;
  
  // Funding
  readonly fundingGoal: number;
  readonly currentPledges: number;
  readonly stretchGoals: StretchGoal[];
  readonly rewardTiers: RewardTier[];
  
  // Timeline
  readonly campaignStartTick: number;
  readonly campaignDurationDays: number;
  readonly campaignEndTick: number;
  
  // Milestones
  readonly milestones: CampaignMilestone[];
  readonly missedMilestones: number;
  readonly maxMissedMilestones: number;  // Fail if exceeded
  
  // Payouts
  readonly totalFundsReceived: number;
  readonly pendingFunds: number;         // Funds not yet released
  readonly monthlyPayout: number;        // Monthly funds from backers
  
  // Backer happiness
  readonly backerConfidence: number;     // 0-100, drops on missed milestones
  readonly backerCount: number;
}

/**
 * Stretch goal for additional funding
 */
export interface StretchGoal {
  readonly id: EntityId;
  readonly name: string;
  readonly description: string;
  readonly fundingTarget: number;
  readonly reached: boolean;
  readonly reward: string;
}

/**
 * Parameters for creating a new crowdfunding campaign
 */
export interface CreateCampaignParams {
  name: string;
  description: string;
  genre: GameGenre;
  fundingGoal: number;
  campaignDurationDays: number;
  currentTick: number;
}

/**
 * Default reward tiers
 */
export function createDefaultRewardTiers(): RewardTier[] {
  return [
    {
      id: generateId(),
      name: 'Supporter',
      description: 'Show your support!',
      pledgeAmount: 5,
      backerCount: 0,
      rewards: ['Digital thank you card', 'Backer badge in-game'],
      estimatedDelivery: 0,
    },
    {
      id: generateId(),
      name: 'Early Bird',
      description: 'Get the game at launch!',
      pledgeAmount: 15,
      backerCount: 0,
      rewards: ['Digital copy of game', 'Exclusive backer items', 'Beta access'],
      estimatedDelivery: 0,
    },
    {
      id: generateId(),
      name: 'Founder',
      description: 'Be a founding member!',
      pledgeAmount: 30,
      backerCount: 0,
      rewards: ['All previous rewards', 'Alpha access', 'Founder\'s pack items', 'Name in credits'],
      estimatedDelivery: 0,
    },
    {
      id: generateId(),
      name: 'Patron',
      description: 'Maximum support!',
      pledgeAmount: 75,
      backerCount: 0,
      rewards: ['All previous rewards', 'Design an NPC', 'Private Discord channel', 'Monthly dev updates'],
      estimatedDelivery: 0,
    },
    {
      id: generateId(),
      name: 'Executive Producer',
      description: 'Become part of the team!',
      pledgeAmount: 250,
      backerCount: 0,
      rewards: ['All previous rewards', 'Design a character', 'Producer credit', 'Signed concept art'],
      estimatedDelivery: 0,
    },
  ];
}

/**
 * Create default milestones based on expected development time
 */
export function createDefaultMilestones(
  startTick: number,
  developmentDays: number
): CampaignMilestone[] {
  const alphaTarget = startTick + Math.floor(developmentDays * 0.3);
  const betaTarget = startTick + Math.floor(developmentDays * 0.6);
  const softLaunchTarget = startTick + Math.floor(developmentDays * 0.85);
  const launchTarget = startTick + developmentDays;
  
  return [
    {
      id: generateId(),
      type: 'alpha_release',
      name: 'Alpha Release',
      description: 'First playable version for founders',
      targetTick: alphaTarget,
      completed: false,
      completedTick: null,
      fundingPercentage: 20,
    },
    {
      id: generateId(),
      type: 'beta_release',
      name: 'Beta Release',
      description: 'Feature-complete beta for all backers',
      targetTick: betaTarget,
      completed: false,
      completedTick: null,
      fundingPercentage: 25,
    },
    {
      id: generateId(),
      type: 'soft_launch',
      name: 'Soft Launch',
      description: 'Early access release',
      targetTick: softLaunchTarget,
      completed: false,
      completedTick: null,
      fundingPercentage: 25,
    },
    {
      id: generateId(),
      type: 'global_launch',
      name: 'Global Launch',
      description: 'Full worldwide release',
      targetTick: launchTarget,
      completed: false,
      completedTick: null,
      fundingPercentage: 30,
    },
  ];
}

/**
 * Create a new crowdfunding campaign
 */
export function createCrowdfundingCampaign(params: CreateCampaignParams): CrowdfundingCampaign {
  const campaignEndTick = params.currentTick + params.campaignDurationDays;
  const estimatedDevTime = 120; // ~4 months development
  
  return {
    id: generateId(),
    gameId: null,
    name: params.name,
    description: params.description,
    genre: params.genre,
    status: 'planning',
    
    fundingGoal: params.fundingGoal,
    currentPledges: 0,
    stretchGoals: [],
    rewardTiers: createDefaultRewardTiers(),
    
    campaignStartTick: params.currentTick,
    campaignDurationDays: params.campaignDurationDays,
    campaignEndTick,
    
    milestones: createDefaultMilestones(campaignEndTick, estimatedDevTime),
    missedMilestones: 0,
    maxMissedMilestones: 2,
    
    totalFundsReceived: 0,
    pendingFunds: 0,
    monthlyPayout: 0,
    
    backerConfidence: 100,
    backerCount: 0,
  };
}

/**
 * Launch a campaign (make it active)
 */
export function launchCampaign(
  campaign: CrowdfundingCampaign,
  currentTick: number
): CrowdfundingCampaign {
  if (campaign.status !== 'planning') return campaign;
  
  return {
    ...campaign,
    status: 'active',
    campaignStartTick: currentTick,
    campaignEndTick: currentTick + campaign.campaignDurationDays,
  };
}

/**
 * Simulate daily pledge activity
 * Returns updated campaign with new pledges
 */
export function simulateDailyPledges(
  campaign: CrowdfundingCampaign,
  companyReputation: number,
  dayOfCampaign: number
): CrowdfundingCampaign {
  if (campaign.status !== 'active') return campaign;
  
  // Pledge activity varies throughout campaign
  // Higher at start and end (launch and final push)
  const campaignProgress = dayOfCampaign / campaign.campaignDurationDays;
  let activityMultiplier = 1.0;
  
  if (campaignProgress < 0.1) {
    activityMultiplier = 2.0; // Launch boost
  } else if (campaignProgress > 0.85) {
    activityMultiplier = 1.8; // Final push
  } else {
    activityMultiplier = 0.6 + (Math.random() * 0.4); // Mid-campaign lull
  }
  
  // Base pledges affected by reputation
  const reputationFactor = 0.5 + (companyReputation / 200);
  const basePledges = 10 + (campaign.fundingGoal / 10000);
  
  // Calculate new backers
  const newBackers = Math.floor(basePledges * activityMultiplier * reputationFactor * Math.random() * 2);
  
  // Distribute backers across tiers (weighted toward lower tiers)
  let totalNewPledges = 0;
  const updatedTiers = campaign.rewardTiers.map((tier, index) => {
    // Higher index = higher tier = fewer backers
    const tierWeight = Math.pow(0.5, index);
    const tierBackers = Math.floor(newBackers * tierWeight * Math.random());
    totalNewPledges += tierBackers * tier.pledgeAmount;
    
    return {
      ...tier,
      backerCount: tier.backerCount + tierBackers,
    };
  });
  
  return {
    ...campaign,
    currentPledges: campaign.currentPledges + totalNewPledges,
    backerCount: campaign.backerCount + newBackers,
    rewardTiers: updatedTiers,
  };
}

/**
 * Check and update campaign status at end of campaign period
 */
export function finalizeCampaign(
  campaign: CrowdfundingCampaign,
  currentTick: number
): CrowdfundingCampaign {
  if (campaign.status !== 'active') return campaign;
  if (currentTick < campaign.campaignEndTick) return campaign;
  
  const isFunded = campaign.currentPledges >= campaign.fundingGoal;
  
  if (isFunded) {
    // Calculate monthly payout based on pledges and milestone schedule
    const monthlyPayout = Math.floor(campaign.currentPledges / 6); // Distribute over ~6 months
    
    return {
      ...campaign,
      status: 'funded',
      pendingFunds: campaign.currentPledges,
      monthlyPayout,
    };
  } else {
    return {
      ...campaign,
      status: 'failed',
    };
  }
}

/**
 * Complete a milestone and release funds
 */
export function completeMilestone(
  campaign: CrowdfundingCampaign,
  milestoneId: EntityId,
  currentTick: number
): CrowdfundingCampaign {
  if (campaign.status !== 'funded') return campaign;
  
  const milestoneIndex = campaign.milestones.findIndex(m => m.id === milestoneId);
  if (milestoneIndex === -1) return campaign;
  
  const milestone = campaign.milestones[milestoneIndex];
  if (milestone.completed) return campaign;
  
  // Calculate funds to release
  const fundsToRelease = Math.floor(campaign.currentPledges * (milestone.fundingPercentage / 100));
  
  // Check if milestone is late
  const isLate = currentTick > milestone.targetTick;
  const confidenceChange = isLate ? -10 : 5;
  
  const updatedMilestones = campaign.milestones.map((m, i) => 
    i === milestoneIndex 
      ? { ...m, completed: true, completedTick: currentTick }
      : m
  );
  
  return {
    ...campaign,
    milestones: updatedMilestones,
    totalFundsReceived: campaign.totalFundsReceived + fundsToRelease,
    pendingFunds: campaign.pendingFunds - fundsToRelease,
    backerConfidence: Math.max(0, Math.min(100, campaign.backerConfidence + confidenceChange)),
  };
}

/**
 * Process missed milestone
 */
export function processMissedMilestone(
  campaign: CrowdfundingCampaign,
  milestoneId: EntityId,
  currentTick: number
): CrowdfundingCampaign {
  if (campaign.status !== 'funded') return campaign;
  
  const milestoneIndex = campaign.milestones.findIndex(m => m.id === milestoneId);
  if (milestoneIndex === -1) return campaign;
  
  const milestone = campaign.milestones[milestoneIndex];
  if (milestone.completed) return campaign;
  if (currentTick <= milestone.targetTick) return campaign;
  
  // Milestone is past due
  const newMissedCount = campaign.missedMilestones + 1;
  const confidenceLoss = 20;
  
  // Calculate backer refunds (some backers request refunds)
  const refundRate = 0.05 * newMissedCount; // 5% per missed milestone
  const refundAmount = Math.floor(campaign.pendingFunds * refundRate);
  
  // Check if campaign failed
  const isFailed = newMissedCount > campaign.maxMissedMilestones;
  
  return {
    ...campaign,
    status: isFailed ? 'failed' : campaign.status,
    missedMilestones: newMissedCount,
    backerConfidence: Math.max(0, campaign.backerConfidence - confidenceLoss),
    pendingFunds: campaign.pendingFunds - refundAmount,
    backerCount: Math.floor(campaign.backerCount * (1 - refundRate)),
  };
}

/**
 * Add a stretch goal
 */
export function addStretchGoal(
  campaign: CrowdfundingCampaign,
  name: string,
  description: string,
  fundingTarget: number,
  reward: string
): CrowdfundingCampaign {
  const newStretchGoal: StretchGoal = {
    id: generateId(),
    name,
    description,
    fundingTarget,
    reached: false,
    reward,
  };
  
  return {
    ...campaign,
    stretchGoals: [...campaign.stretchGoals, newStretchGoal].sort((a, b) => a.fundingTarget - b.fundingTarget),
  };
}

/**
 * Check and update stretch goal status
 */
export function updateStretchGoals(campaign: CrowdfundingCampaign): CrowdfundingCampaign {
  const updatedGoals = campaign.stretchGoals.map(goal => ({
    ...goal,
    reached: campaign.currentPledges >= goal.fundingTarget,
  }));
  
  return {
    ...campaign,
    stretchGoals: updatedGoals,
  };
}

/**
 * Calculate funding percentage
 */
export function getFundingPercentage(campaign: CrowdfundingCampaign): number {
  if (campaign.fundingGoal === 0) return 0;
  return Math.min(1000, (campaign.currentPledges / campaign.fundingGoal) * 100);
}

/**
 * Get days remaining in campaign
 */
export function getDaysRemaining(campaign: CrowdfundingCampaign, currentTick: number): number {
  if (campaign.status !== 'active') return 0;
  return Math.max(0, campaign.campaignEndTick - currentTick);
}
