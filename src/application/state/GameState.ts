import { Company, Game, Employee, GachaBanner, GachaItem, Campaign, GameGenre, TrainingType, Founder } from '../../domain';
import { GameImprovementWork } from '../../domain/game/LiveGameImprovement';
import { ScheduledFeature, FeatureBoost } from '../../domain/game/FeatureRoadmap';
import { LaunchState, PlayerFeedback } from '../../domain/game/LaunchPhases';
import { OfficeUpgradeType } from '../../domain/company/OfficeUpgrades';
import { CrowdfundingCampaign } from '../../domain/economy/Crowdfunding';
import { GameAdConfig, SponsorshipDeal } from '../../domain/economy/Advertising';
import { GameMonetizationSetup, MonetizationImplementation } from '../../domain/economy/Monetization';

/**
 * Track employee training
 */
export interface EmployeeTraining {
  readonly employeeId: string;
  readonly trainingType: TrainingType;
  readonly startTick: number;
  readonly endTick: number;
}

/**
 * Complete game state containing all simulation data
 */
export interface GameState {
  readonly company: Company | null;
  readonly founder: Founder | null;    // The player character
  readonly employees: Employee[];
  readonly games: Game[];
  readonly gachaItems: GachaItem[];
  readonly gachaBanners: GachaBanner[];
  readonly campaigns: Campaign[];       // Marketing campaigns
  readonly usedNames: Set<string>;      // Track used employee names
  readonly unlockedGenres: Set<GameGenre>;  // Genres the company has unlocked
  readonly employeeTraining: EmployeeTraining[];  // Active training
  readonly gameImprovements: GameImprovementWork[];  // Active improvement work
  
  // Feature Roadmap System
  readonly scheduledFeatures: ScheduledFeature[];
  readonly featureBoosts: FeatureBoost[];
  
  // Multi-Phase Launch System
  readonly launchStates: Record<string, LaunchState>;  // gameId -> LaunchState
  readonly playerFeedback: PlayerFeedback[];
  
  // Office Upgrades
  readonly officeUpgrades: Set<OfficeUpgradeType>;
  
  // Crowdfunding
  readonly crowdfundingCampaigns: CrowdfundingCampaign[];
  
  // Advertising & Sponsorships
  readonly gameAdConfigs: Record<string, GameAdConfig>;  // gameId -> AdConfig
  readonly sponsorshipDeals: SponsorshipDeal[];
  
  // F2P Monetization
  readonly monetizationSetups: Record<string, GameMonetizationSetup>;  // gameId -> setup
  readonly monetizationImplementations: MonetizationImplementation[];
  
  readonly currentTick: number;         // Current game time (1 tick = 1 day)
  readonly gameSpeed: GameSpeed;
  readonly isPaused: boolean;
  readonly isGameOver: boolean;         // True when company goes bankrupt
  readonly gameOverReason: string | null; // Reason for game over
}

/**
 * Game simulation speed
 */
export type GameSpeed = 'slow' | 'normal' | 'fast' | 'ultra';

/**
 * Speed multipliers for different game speeds
 */
export const SPEED_MULTIPLIERS: Record<GameSpeed, number> = {
  slow: 0.5,
  normal: 1.0,
  fast: 2.0,
  ultra: 4.0,
};

/**
 * Creates initial empty game state
 */
export function createInitialState(): GameState {
  return {
    company: null,
    founder: null,
    employees: [],
    games: [],
    gachaItems: [],
    gachaBanners: [],
    campaigns: [],
    usedNames: new Set<string>(),
    unlockedGenres: new Set<GameGenre>(),
    employeeTraining: [],
    gameImprovements: [],
    
    // Feature Roadmap
    scheduledFeatures: [],
    featureBoosts: [],
    
    // Launch System
    launchStates: {},
    playerFeedback: [],
    
    // Office Upgrades
    officeUpgrades: new Set<OfficeUpgradeType>(),
    
    // Crowdfunding
    crowdfundingCampaigns: [],
    
    // Advertising
    gameAdConfigs: {},
    sponsorshipDeals: [],
    
    // Monetization
    monetizationSetups: {},
    monetizationImplementations: [],
    
    currentTick: 0,
    gameSpeed: 'normal',
    isPaused: true,
    isGameOver: false,
    gameOverReason: null,
  };
}

/**
 * State update helper - immutably updates specific parts of state
 */
export function updateState<K extends keyof GameState>(
  state: GameState,
  updates: Pick<GameState, K>
): GameState {
  return { ...state, ...updates };
}
