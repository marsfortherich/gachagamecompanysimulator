import { GameState } from '../state';
import { CampaignType, EmployeeTier, EmployeeRole, GameGenre, TrainingType, FounderSpecialization, FounderExperience, FounderTrainingType, SkillType } from '../../domain';
import { ImprovementFocus } from '../../domain/game/LiveGameImprovement';
import { FeatureType } from '../../domain/game/FeatureRoadmap';
import { OfficeUpgradeType } from '../../domain/company/OfficeUpgrades';
import { AdType } from '../../domain/economy/Advertising';
import { MonetizationStrategy } from '../../domain/economy/Monetization';

/**
 * Action types for state management
 * Following Redux-like pattern for predictable state updates
 */
export type GameAction =
  | { type: 'INITIALIZE_COMPANY'; payload: { name: string; headquarters?: string; founderName: string; specialization: FounderSpecialization; experience: FounderExperience } }
  | { type: 'TICK'; payload: { deltaTime: number } }
  | { type: 'SET_GAME_SPEED'; payload: { speed: GameState['gameSpeed'] } }
  | { type: 'TOGGLE_PAUSE' }
  // Founder Actions
  | { type: 'START_FOUNDER_TRAINING'; payload: { trainingType: FounderTrainingType; targetSkill: SkillType } }
  | { type: 'CANCEL_FOUNDER_TRAINING' }
  | { type: 'ASSIGN_FOUNDER_TO_PROJECT'; payload: { gameId: string } }
  | { type: 'UNASSIGN_FOUNDER_FROM_PROJECT'; payload: { gameId: string } }
  // Employee Actions
  | { type: 'HIRE_EMPLOYEE'; payload: { tier: EmployeeTier; role: EmployeeRole } }
  | { type: 'FIRE_EMPLOYEE'; payload: { employeeId: string } }
  | { type: 'START_TRAINING'; payload: { employeeId: string; trainingType: TrainingType } }
  | { type: 'CANCEL_TRAINING'; payload: { employeeId: string } }
  | { type: 'START_GAME_PROJECT'; payload: { name: string; genre: string; secondaryGenres?: string[] } }
  | { type: 'ASSIGN_TO_PROJECT'; payload: { employeeId: string; gameId: string } }
  | { type: 'UNASSIGN_FROM_PROJECT'; payload: { employeeId: string; gameId: string } }
  | { type: 'START_GAME_IMPROVEMENT'; payload: { gameId: string; focus: ImprovementFocus } }
  | { type: 'LAUNCH_GAME'; payload: { gameId: string } }
  | { type: 'SHUTDOWN_GAME'; payload: { gameId: string } }
  | { type: 'UNLOCK_GENRE'; payload: { genre: GameGenre } }
  | { type: 'CREATE_BANNER'; payload: { gameId: string; name: string; duration: number } }
  | { type: 'UPDATE_GACHA_RATES'; payload: { gameId: string; rates: Record<string, number> } }
  | { type: 'START_CAMPAIGN'; payload: { gameId: string; campaignType: CampaignType } }
  | { type: 'CANCEL_CAMPAIGN'; payload: { campaignId: string } }
  | { type: 'LOAD_STATE'; payload: { state: GameState } }
  | { type: 'RESET_STATE' }
  // Feature Roadmap Actions
  | { type: 'SCHEDULE_FEATURE'; payload: { gameId: string; type: FeatureType; name: string; scheduledStartTick: number } }
  | { type: 'START_FEATURE_DEVELOPMENT'; payload: { featureId: string } }
  | { type: 'RELEASE_FEATURE'; payload: { featureId: string } }
  | { type: 'CANCEL_FEATURE'; payload: { featureId: string } }
  // Office Upgrade Actions
  | { type: 'PURCHASE_OFFICE_UPGRADE'; payload: { upgradeType: OfficeUpgradeType } }
  | { type: 'UPGRADE_OFFICE'; payload: Record<string, never> }
  // Crowdfunding Actions
  | { type: 'CREATE_CROWDFUNDING_CAMPAIGN'; payload: { name: string; description: string; genre: GameGenre; fundingGoal: number; durationDays: number } }
  | { type: 'LAUNCH_CROWDFUNDING_CAMPAIGN'; payload: { campaignId: string } }
  | { type: 'COMPLETE_CROWDFUNDING_MILESTONE'; payload: { campaignId: string; milestoneId: string } }
  // Advertising Actions
  | { type: 'ENABLE_AD_TYPE'; payload: { gameId: string; adType: AdType } }
  | { type: 'DISABLE_AD_TYPE'; payload: { gameId: string; adType: AdType } }
  | { type: 'SET_AD_FREQUENCY'; payload: { gameId: string; frequency: number } }
  | { type: 'ACCEPT_SPONSORSHIP'; payload: { dealId: string } }
  | { type: 'REJECT_SPONSORSHIP'; payload: { dealId: string } }
  // Monetization Actions
  | { type: 'IMPLEMENT_MONETIZATION'; payload: { gameId: string; strategy: MonetizationStrategy } }
  | { type: 'UPGRADE_MONETIZATION'; payload: { gameId: string; strategy: MonetizationStrategy } }
  // Launch Phase Actions
  | { type: 'START_PHASED_LAUNCH'; payload: { gameId: string } }
  | { type: 'ADVANCE_LAUNCH_PHASE'; payload: { gameId: string } }
  | { type: 'EXTEND_LAUNCH_PHASE'; payload: { gameId: string; days: number } }
  | { type: 'RESOLVE_FEEDBACK'; payload: { feedbackId: string } };

/**
 * Action creators - factory functions for type-safe action creation
 */
export const GameActions = {
  initializeCompany: (
    name: string, 
    founderName: string,
    specialization: FounderSpecialization,
    experience: FounderExperience,
    headquarters?: string
  ): GameAction => ({
    type: 'INITIALIZE_COMPANY',
    payload: { name, headquarters, founderName, specialization, experience },
  }),

  tick: (deltaTime: number): GameAction => ({
    type: 'TICK',
    payload: { deltaTime },
  }),

  setGameSpeed: (speed: GameState['gameSpeed']): GameAction => ({
    type: 'SET_GAME_SPEED',
    payload: { speed },
  }),

  togglePause: (): GameAction => ({
    type: 'TOGGLE_PAUSE',
  }),

  // Founder actions
  startFounderTraining: (trainingType: FounderTrainingType, targetSkill: SkillType): GameAction => ({
    type: 'START_FOUNDER_TRAINING',
    payload: { trainingType, targetSkill },
  }),

  cancelFounderTraining: (): GameAction => ({
    type: 'CANCEL_FOUNDER_TRAINING',
  }),

  assignFounderToProject: (gameId: string): GameAction => ({
    type: 'ASSIGN_FOUNDER_TO_PROJECT',
    payload: { gameId },
  }),

  unassignFounderFromProject: (gameId: string): GameAction => ({
    type: 'UNASSIGN_FOUNDER_FROM_PROJECT',
    payload: { gameId },
  }),

  hireEmployee: (tier: EmployeeTier, role: EmployeeRole): GameAction => ({
    type: 'HIRE_EMPLOYEE',
    payload: { tier, role },
  }),

  fireEmployee: (employeeId: string): GameAction => ({
    type: 'FIRE_EMPLOYEE',
    payload: { employeeId },
  }),

  startTraining: (employeeId: string, trainingType: TrainingType): GameAction => ({
    type: 'START_TRAINING',
    payload: { employeeId, trainingType },
  }),

  cancelTraining: (employeeId: string): GameAction => ({
    type: 'CANCEL_TRAINING',
    payload: { employeeId },
  }),

  startGameProject: (name: string, genre: string, secondaryGenres?: string[]): GameAction => ({
    type: 'START_GAME_PROJECT',
    payload: { name, genre, secondaryGenres },
  }),

  assignToProject: (employeeId: string, gameId: string): GameAction => ({
    type: 'ASSIGN_TO_PROJECT',
    payload: { employeeId, gameId },
  }),

  unassignFromProject: (employeeId: string, gameId: string): GameAction => ({
    type: 'UNASSIGN_FROM_PROJECT',
    payload: { employeeId, gameId },
  }),

  startGameImprovement: (gameId: string, focus: ImprovementFocus): GameAction => ({
    type: 'START_GAME_IMPROVEMENT',
    payload: { gameId, focus },
  }),

  launchGame: (gameId: string): GameAction => ({
    type: 'LAUNCH_GAME',
    payload: { gameId },
  }),

  shutdownGame: (gameId: string): GameAction => ({
    type: 'SHUTDOWN_GAME',
    payload: { gameId },
  }),

  unlockGenre: (genre: GameGenre): GameAction => ({
    type: 'UNLOCK_GENRE',
    payload: { genre },
  }),

  createBanner: (gameId: string, name: string, duration: number): GameAction => ({
    type: 'CREATE_BANNER',
    payload: { gameId, name, duration },
  }),

  updateGachaRates: (gameId: string, rates: Record<string, number>): GameAction => ({
    type: 'UPDATE_GACHA_RATES',
    payload: { gameId, rates },
  }),

  startCampaign: (gameId: string, campaignType: CampaignType): GameAction => ({
    type: 'START_CAMPAIGN',
    payload: { gameId, campaignType },
  }),

  cancelCampaign: (campaignId: string): GameAction => ({
    type: 'CANCEL_CAMPAIGN',
    payload: { campaignId },
  }),

  loadState: (state: GameState): GameAction => ({
    type: 'LOAD_STATE',
    payload: { state },
  }),

  resetState: (): GameAction => ({
    type: 'RESET_STATE',
  }),

  // Feature Roadmap
  scheduleFeature: (gameId: string, type: FeatureType, name: string, scheduledStartTick: number): GameAction => ({
    type: 'SCHEDULE_FEATURE',
    payload: { gameId, type, name, scheduledStartTick },
  }),

  startFeatureDevelopment: (featureId: string): GameAction => ({
    type: 'START_FEATURE_DEVELOPMENT',
    payload: { featureId },
  }),

  releaseFeature: (featureId: string): GameAction => ({
    type: 'RELEASE_FEATURE',
    payload: { featureId },
  }),

  cancelFeature: (featureId: string): GameAction => ({
    type: 'CANCEL_FEATURE',
    payload: { featureId },
  }),

  // Office Upgrades
  purchaseOfficeUpgrade: (upgradeType: OfficeUpgradeType): GameAction => ({
    type: 'PURCHASE_OFFICE_UPGRADE',
    payload: { upgradeType },
  }),

  upgradeOffice: (): GameAction => ({
    type: 'UPGRADE_OFFICE',
    payload: {},
  }),

  // Crowdfunding
  createCrowdfundingCampaign: (name: string, description: string, genre: GameGenre, fundingGoal: number, durationDays: number): GameAction => ({
    type: 'CREATE_CROWDFUNDING_CAMPAIGN',
    payload: { name, description, genre, fundingGoal, durationDays },
  }),

  launchCrowdfundingCampaign: (campaignId: string): GameAction => ({
    type: 'LAUNCH_CROWDFUNDING_CAMPAIGN',
    payload: { campaignId },
  }),

  completeCrowdfundingMilestone: (campaignId: string, milestoneId: string): GameAction => ({
    type: 'COMPLETE_CROWDFUNDING_MILESTONE',
    payload: { campaignId, milestoneId },
  }),

  // Advertising
  enableAdType: (gameId: string, adType: AdType): GameAction => ({
    type: 'ENABLE_AD_TYPE',
    payload: { gameId, adType },
  }),

  disableAdType: (gameId: string, adType: AdType): GameAction => ({
    type: 'DISABLE_AD_TYPE',
    payload: { gameId, adType },
  }),

  setAdFrequency: (gameId: string, frequency: number): GameAction => ({
    type: 'SET_AD_FREQUENCY',
    payload: { gameId, frequency },
  }),

  acceptSponsorship: (dealId: string): GameAction => ({
    type: 'ACCEPT_SPONSORSHIP',
    payload: { dealId },
  }),

  rejectSponsorship: (dealId: string): GameAction => ({
    type: 'REJECT_SPONSORSHIP',
    payload: { dealId },
  }),

  // Monetization
  implementMonetization: (gameId: string, strategy: MonetizationStrategy): GameAction => ({
    type: 'IMPLEMENT_MONETIZATION',
    payload: { gameId, strategy },
  }),

  upgradeMonetization: (gameId: string, strategy: MonetizationStrategy): GameAction => ({
    type: 'UPGRADE_MONETIZATION',
    payload: { gameId, strategy },
  }),

  // Launch Phases
  startPhasedLaunch: (gameId: string): GameAction => ({
    type: 'START_PHASED_LAUNCH',
    payload: { gameId },
  }),

  advanceLaunchPhase: (gameId: string): GameAction => ({
    type: 'ADVANCE_LAUNCH_PHASE',
    payload: { gameId },
  }),

  extendLaunchPhase: (gameId: string, days: number): GameAction => ({
    type: 'EXTEND_LAUNCH_PHASE',
    payload: { gameId, days },
  }),

  resolveFeedback: (feedbackId: string): GameAction => ({
    type: 'RESOLVE_FEEDBACK',
    payload: { feedbackId },
  }),
};
