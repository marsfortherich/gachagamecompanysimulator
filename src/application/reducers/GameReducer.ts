import { 
  createCompany, 
  createGame, 
  updateProgress,
  updateGameStatus,
  updateQuality,
  assignEmployees,
  removeEmployees,
  calculateEffectiveness,
  setAvailability,
  updateCompanyFunds,
  GameGenre,
  Employee,
  simulateLiveGameTick,
  initializeLiveGame,
  createCampaign,
  updateCampaignStatus,
  getCombinedCampaignEffects,
  Campaign,
  generateTieredEmployee,
  getHiringCost,
  GENRE_CONFIGS,
  calculateTeamSynergy,
  createGachaBanner,
  OFFICE_TIERS,
  OfficeLevel,
  getLocationBonuses,
  // Founder imports
  createFounder,
  getFounderStartingFunds,
  founderAsEmployee,
  startFounderTraining,
  completeFounderTraining,
  processFounderDailyTraining,
  workFounder,
  restFounder,
  recordGameCompleted,
  FOUNDER_TRAINING_CONFIGS,
} from '../../domain';
import { calculateMaintenanceEffect, IMPROVEMENT_TASKS, getImprovementPriority, calculateImprovementSpeed } from '../../domain/game/LiveGameImprovement';
import { 
  createScheduledFeature, 
  startFeatureDevelopment, 
  updateFeatureProgress, 
  releaseFeature, 
  cancelFeature, 
  createFeatureBoost,
  FEATURE_TYPE_CONFIGS,
  calculateCombinedBoosts,
} from '../../domain/game/FeatureRoadmap';
import { 
  OFFICE_UPGRADES, 
  canPurchaseUpgrade, 
} from '../../domain/company/OfficeUpgrades';
import { 
  createCrowdfundingCampaign as createCrowdfund, 
  launchCampaign as launchCrowdfund,
  simulateDailyPledges,
  finalizeCampaign,
  completeMilestone,
} from '../../domain/economy/Crowdfunding';
import { 
  createGameAdConfig, 
  enableAdType, 
  disableAdType, 
  calculateDailyAdEffects,
  acceptSponsorship,
  rejectSponsorship,
  AD_TYPE_CONFIGS,
} from '../../domain/economy/Advertising';
import { 
  createDefaultMonetizationSetup, 
  startMonetizationImplementation,
  completeMonetizationImplementation,
  upgradeMonetizationLevel,
  calculateDailyMonetizationRevenue,
  processBattlePassTick,
  MONETIZATION_CONFIGS,
} from '../../domain/economy/Monetization';
import { LAUNCH_PHASE_CONFIGS, createLaunchState } from '../../domain/game/LaunchPhases';
import { GameState, createInitialState, EmployeeTraining } from '../state';
import { GameAction } from '../actions';
import { TRAINING_CONFIGS, completeTraining } from '../../domain';

/**
 * Main reducer for game state
 * Handles all state transitions in an immutable way
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  // Block actions if game is over (except reset)
  if (state.isGameOver && action.type !== 'RESET_STATE') {
    return state;
  }

  switch (action.type) {
    case 'INITIALIZE_COMPANY': {
      // Create founder first to get starting funds based on experience
      const founder = createFounder({
        name: action.payload.founderName,
        specialization: action.payload.specialization,
        experience: action.payload.experience,
      });
      
      const startingFunds = getFounderStartingFunds(action.payload.experience);
      
      const company = createCompany({
        name: action.payload.name,
        headquarters: action.payload.headquarters,
        foundedDate: state.currentTick,
        startingFunds,  // Based on founder's experience level
      });
      
      return {
        ...state,
        company,
        founder,
        // Game starts paused - player must click play to begin
      };
    }

    case 'TICK': {
      if (state.isPaused || !state.company) {
        return state;
      }

      // Process one game tick
      let newState = {
        ...state,
        currentTick: state.currentTick + 1,
      };

      // Update all games in development
      newState = processGameDevelopment(newState);
      
      // Process live games (revenue, players, etc.)
      newState = processLiveGames(newState);
      
      // Process active campaigns
      newState = processCampaigns(newState);
      
      // Process employee training
      newState = processTraining(newState);
      
      // Process scheduled features
      newState = processScheduledFeatures(newState);
      
      // Process crowdfunding campaigns
      newState = processCrowdfunding(newState);
      
      // Process monetization implementations
      newState = processMonetizationImplementations(newState);
      
      // Process monthly expenses (salary, etc.)
      if (newState.currentTick % 30 === 0) {
        newState = processMonthlyExpenses(newState);
      }

      return newState;
    }

    case 'SET_GAME_SPEED': {
      return {
        ...state,
        gameSpeed: action.payload.speed,
      };
    }

    case 'TOGGLE_PAUSE': {
      return {
        ...state,
        isPaused: !state.isPaused,
      };
    }

    case 'HIRE_EMPLOYEE': {
      if (!state.company) return state;
      
      const { tier, role } = action.payload;
      const hiringCost = getHiringCost(tier);
      
      // Check if company can afford the hiring cost
      if (state.company.funds < hiringCost) {
        return state;
      }
      
      // Generate new employee with unique name
      const newEmployee = generateTieredEmployee({
        tier,
        role,
        currentTick: state.currentTick,
        existingNames: state.usedNames,
      });
      
      // Deduct hiring cost
      const updatedCompany = updateCompanyFunds(state.company, -hiringCost);
      
      // Add name to used names
      const updatedUsedNames = new Set(state.usedNames);
      updatedUsedNames.add(newEmployee.name);
      
      return {
        ...state,
        company: updatedCompany,
        employees: [...state.employees, newEmployee],
        usedNames: updatedUsedNames,
      };
    }

    case 'FIRE_EMPLOYEE': {
      const { employeeId } = action.payload;
      
      // Remove from all games
      const updatedGames = state.games.map(game => 
        removeEmployees(game, [employeeId])
      );
      
      return {
        ...state,
        employees: state.employees.filter(e => e.id !== employeeId),
        games: updatedGames,
        employeeTraining: state.employeeTraining.filter(t => t.employeeId !== employeeId),
      };
    }

    // Founder Actions
    case 'START_FOUNDER_TRAINING': {
      if (!state.company || !state.founder) return state;
      
      const { trainingType, targetSkill } = action.payload;
      const config = FOUNDER_TRAINING_CONFIGS[trainingType];
      
      // Check if training requires payment
      const totalCost = config.costPerDay * config.durationDays;
      if (state.company.funds < totalCost) {
        return state;
      }
      
      // Deduct cost and start training
      const updatedCompany = updateCompanyFunds(state.company, -totalCost);
      const updatedFounder = startFounderTraining(
        state.founder, 
        trainingType, 
        targetSkill, 
        state.currentTick
      );
      
      return {
        ...state,
        company: updatedCompany,
        founder: updatedFounder,
      };
    }

    case 'CANCEL_FOUNDER_TRAINING': {
      if (!state.founder) return state;
      
      return {
        ...state,
        founder: {
          ...state.founder,
          currentTraining: null,
          trainingTargetSkill: null,
          trainingStartTick: null,
          trainingEndTick: null,
        },
      };
    }

    case 'ASSIGN_FOUNDER_TO_PROJECT': {
      if (!state.founder) return state;
      
      const { gameId } = action.payload;
      const game = state.games.find(g => g.id === gameId);
      if (!game) return state;
      
      // Add founder ID to game's assigned employees
      const updatedGame = assignEmployees(game, [state.founder.id]);
      
      return {
        ...state,
        games: state.games.map(g => g.id === gameId ? updatedGame : g),
      };
    }

    case 'UNASSIGN_FOUNDER_FROM_PROJECT': {
      if (!state.founder) return state;
      
      const { gameId } = action.payload;
      const game = state.games.find(g => g.id === gameId);
      if (!game) return state;
      
      // Remove founder ID from game's assigned employees
      const updatedGame = removeEmployees(game, [state.founder.id]);
      
      return {
        ...state,
        games: state.games.map(g => g.id === gameId ? updatedGame : g),
      };
    }

    case 'START_TRAINING': {
      if (!state.company) return state;
      
      const { employeeId, trainingType } = action.payload;
      const program = TRAINING_CONFIGS[trainingType];
      
      // Check if company can afford training
      if (state.company.funds < program.cost) {
        return state;
      }
      
      // Find employee and check if available
      const employee = state.employees.find(e => e.id === employeeId);
      if (!employee || !employee.isAvailable) {
        return state;
      }
      
      // Mark employee as unavailable during training
      const updatedEmployees = state.employees.map(emp =>
        emp.id === employeeId ? setAvailability(emp, false) : emp
      );
      
      // Create training record
      const newTraining: EmployeeTraining = {
        employeeId,
        trainingType,
        startTick: state.currentTick,
        endTick: state.currentTick + program.durationDays,
      };
      
      return {
        ...state,
        company: updateCompanyFunds(state.company, -program.cost),
        employees: updatedEmployees,
        employeeTraining: [...state.employeeTraining, newTraining],
      };
    }

    case 'CANCEL_TRAINING': {
      const { employeeId } = action.payload;
      
      // Find the training
      const training = state.employeeTraining.find(t => t.employeeId === employeeId);
      if (!training) {
        return state;
      }
      
      // Mark employee as available again
      const updatedEmployees = state.employees.map(emp =>
        emp.id === employeeId ? setAvailability(emp, true) : emp
      );
      
      return {
        ...state,
        employees: updatedEmployees,
        employeeTraining: state.employeeTraining.filter(t => t.employeeId !== employeeId),
      };
    }

    case 'START_GAME_PROJECT': {
      if (!state.company) return state;

      const newGame = createGame({
        name: action.payload.name,
        genre: action.payload.genre as GameGenre,
        startDate: state.currentTick,
      });

      return {
        ...state,
        games: [...state.games, newGame],
      };
    }

    case 'UNLOCK_GENRE': {
      if (!state.company) return state;
      
      const { genre } = action.payload;
      const config = GENRE_CONFIGS[genre];
      
      // Check if already unlocked or if it's a starter genre
      if (state.unlockedGenres.has(genre) || config.tier === 'starter') {
        return state;
      }
      
      // Check if company can afford it
      if (state.company.funds < config.unlockCost) {
        return state;
      }
      
      const newUnlockedGenres = new Set(state.unlockedGenres);
      newUnlockedGenres.add(genre);
      
      return {
        ...state,
        company: updateCompanyFunds(state.company, -config.unlockCost),
        unlockedGenres: newUnlockedGenres,
      };
    }

    case 'ASSIGN_TO_PROJECT': {
      const { employeeId, gameId } = action.payload;
      
      // Update employee availability
      const updatedEmployees = state.employees.map(emp =>
        emp.id === employeeId ? setAvailability(emp, false) : emp
      );

      // Add to game
      const updatedGames = state.games.map(game =>
        game.id === gameId ? assignEmployees(game, [employeeId]) : game
      );

      return {
        ...state,
        employees: updatedEmployees,
        games: updatedGames,
      };
    }

    case 'LAUNCH_GAME': {
      const { gameId } = action.payload;
      
      const game = state.games.find(g => g.id === gameId);
      if (!game || game.developmentProgress < 100) return state;
      
      const updatedGames = state.games.map(g => {
        if (g.id === gameId) {
          return updateGameStatus(g, 'live', state.currentTick);
        }
        return g;
      });

      // Check if founder was assigned to this game and increment their games completed
      let updatedFounder = state.founder;
      if (updatedFounder && game.assignedEmployees.includes(updatedFounder.id)) {
        updatedFounder = recordGameCompleted(updatedFounder);
      }

      return {
        ...state,
        games: updatedGames,
        founder: updatedFounder,
      };
    }

    case 'SHUTDOWN_GAME': {
      const { gameId } = action.payload;
      
      // Find the game and its assigned employees
      const gameToShutdown = state.games.find(g => g.id === gameId);
      if (!gameToShutdown) return state;

      // Update game status to shutdown
      const updatedGames = state.games.map(game => {
        if (game.id === gameId) {
          return {
            ...game,
            status: 'shutdown' as const,
            assignedEmployees: [], // Clear assigned employees
          };
        }
        return game;
      });

      // Release all assigned employees back to available
      const updatedEmployees = state.employees.map(emp => {
        if (gameToShutdown.assignedEmployees.includes(emp.id)) {
          return {
            ...emp,
            isAvailable: true,
            currentProject: undefined,
          };
        }
        return emp;
      });

      return {
        ...state,
        games: updatedGames,
        employees: updatedEmployees,
      };
    }

    case 'DELETE_GAME': {
      const { gameId } = action.payload;
      
      // Find the game
      const gameToDelete = state.games.find(g => g.id === gameId);
      if (!gameToDelete || gameToDelete.status !== 'shutdown') return state;

      // Remove the game from the list
      const updatedGames = state.games.filter(g => g.id !== gameId);

      return {
        ...state,
        games: updatedGames,
      };
    }

    case 'RELAUNCH_GAME': {
      const { gameId } = action.payload;
      
      // Find the game
      const gameToRelaunch = state.games.find(g => g.id === gameId);
      if (!gameToRelaunch || gameToRelaunch.status !== 'shutdown') return state;

      // Relaunch the game as live with reset stats
      const updatedGames = state.games.map(game => {
        if (game.id === gameId) {
          return {
            ...game,
            status: 'live' as const,
            assignedEmployees: [],
            monetization: {
              ...game.monetization,
              dailyActiveUsers: Math.floor(game.monetization.dailyActiveUsers * 0.3), // 30% of previous DAU
              playerSatisfaction: 60, // Reset to base satisfaction
            },
          };
        }
        return game;
      });

      return {
        ...state,
        games: updatedGames,
      };
    }

    case 'UNASSIGN_FROM_PROJECT': {
      const { employeeId, gameId } = action.payload;
      
      const updatedGames = state.games.map(game => {
        if (game.id === gameId) {
          return {
            ...game,
            assignedEmployees: game.assignedEmployees.filter(id => id !== employeeId),
          };
        }
        return game;
      });

      const updatedEmployees = state.employees.map(emp => {
        if (emp.id === employeeId) {
          return {
            ...emp,
            isAvailable: true,
            currentProject: undefined,
          };
        }
        return emp;
      });

      return {
        ...state,
        games: updatedGames,
        employees: updatedEmployees,
      };
    }

    case 'UPDATE_GACHA_RATES': {
      const { gameId, rates } = action.payload;
      
      const updatedGames = state.games.map(game => {
        if (game.id === gameId) {
          return {
            ...game,
            monetization: {
              ...game.monetization,
              gachaRates: {
                common: rates.common ?? game.monetization.gachaRates.common,
                uncommon: rates.uncommon ?? game.monetization.gachaRates.uncommon,
                rare: rates.rare ?? game.monetization.gachaRates.rare,
                epic: rates.epic ?? game.monetization.gachaRates.epic,
                legendary: rates.legendary ?? game.monetization.gachaRates.legendary,
              },
            },
          };
        }
        return game;
      });

      return {
        ...state,
        games: updatedGames,
      };
    }

    case 'CREATE_BANNER': {
      const { gameId, name, duration } = action.payload;
      
      // Find the game
      const game = state.games.find(g => g.id === gameId);
      if (!game || game.status !== 'live') return state;
      
      // Create a new banner with default settings
      const banner = createGachaBanner({
        name,
        gameId,
        featuredItems: [],  // Player can customize later
        itemPool: [],
        startDate: state.currentTick,
        duration,
        rates: game.monetization.gachaRates,  // Use game's current rates
        isLimited: true,  // Banner events are typically limited
      });
      
      return {
        ...state,
        gachaBanners: [...state.gachaBanners, banner],
      };
    }

    case 'START_CAMPAIGN': {
      if (!state.company) return state;
      
      const { gameId, campaignType } = action.payload;
      
      // Find the game
      const game = state.games.find(g => g.id === gameId);
      if (!game || game.status !== 'live') return state;
      
      // Create the campaign
      const campaign = createCampaign({
        type: campaignType,
        gameId,
        currentTick: state.currentTick,
        gameDau: game.monetization.dailyActiveUsers,
      });
      
      // Check if company can afford it
      if (state.company.funds < campaign.cost) return state;
      
      // Deduct cost and add campaign
      const updatedCompany = updateCompanyFunds(state.company, -campaign.cost);
      
      return {
        ...state,
        company: updatedCompany,
        campaigns: [...state.campaigns, campaign],
      };
    }

    case 'CANCEL_CAMPAIGN': {
      const { campaignId } = action.payload;
      
      // Find and cancel the campaign
      const updatedCampaigns = state.campaigns.map(campaign => {
        if (campaign.id === campaignId && campaign.status === 'active') {
          return { ...campaign, status: 'cancelled' as const };
        }
        return campaign;
      });
      
      return {
        ...state,
        campaigns: updatedCampaigns,
      };
    }

    case 'LOAD_STATE': {
      const loadedState = action.payload.state;
      
      // Helper to reconstruct Set from serialized data
      const reconstructSet = <T>(data: unknown): Set<T> => {
        if (data instanceof Set) return data;
        if (Array.isArray(data)) return new Set(data);
        if (data && typeof data === 'object') return new Set(Object.values(data) as T[]);
        return new Set();
      };
      
      // Reconstruct ad configs with Set types
      const reconstructAdConfigs = (configs: typeof loadedState.gameAdConfigs) => {
        const result: typeof configs = {};
        for (const [gameId, config] of Object.entries(configs)) {
          result[gameId] = {
            ...config,
            enabledAdTypes: reconstructSet(config.enabledAdTypes),
          };
        }
        return result;
      };
      
      // Reconstruct monetization setups with Set types
      const reconstructMonetizationSetups = (setups: typeof loadedState.monetizationSetups) => {
        const result: typeof setups = {};
        for (const [gameId, setup] of Object.entries(setups)) {
          result[gameId] = {
            ...setup,
            enabledStrategies: reconstructSet(setup.enabledStrategies),
          };
        }
        return result;
      };
      
      return {
        ...loadedState,
        unlockedGenres: reconstructSet<GameGenre>(loadedState.unlockedGenres),
        usedNames: reconstructSet<string>(loadedState.usedNames),
        officeUpgrades: reconstructSet(loadedState.officeUpgrades),
        gameAdConfigs: reconstructAdConfigs(loadedState.gameAdConfigs),
        monetizationSetups: reconstructMonetizationSetups(loadedState.monetizationSetups),
      };
    }

    case 'RESET_STATE': {
      return createInitialState();
    }

    // ========== Feature Roadmap Actions ==========
    case 'SCHEDULE_FEATURE': {
      const { gameId, type, name, scheduledStartTick } = action.payload;
      const feature = createScheduledFeature({ gameId, type, name, scheduledStartTick });
      return {
        ...state,
        scheduledFeatures: [...state.scheduledFeatures, feature],
      };
    }

    case 'START_FEATURE_DEVELOPMENT': {
      if (!state.company) return state;
      const { featureId } = action.payload;
      const feature = state.scheduledFeatures.find(f => f.id === featureId);
      if (!feature || feature.status !== 'planned') return state;
      
      const config = FEATURE_TYPE_CONFIGS[feature.type];
      if (state.company.funds < config.baseCost) return state;
      
      const updatedFeatures = state.scheduledFeatures.map(f =>
        f.id === featureId 
          ? startFeatureDevelopment(f, state.currentTick)
          : f
      );
      
      return {
        ...state,
        company: updateCompanyFunds(state.company, -config.baseCost),
        scheduledFeatures: updatedFeatures,
      };
    }

    case 'RELEASE_FEATURE': {
      const { featureId } = action.payload;
      const feature = state.scheduledFeatures.find(f => f.id === featureId);
      if (!feature || feature.status !== 'ready') return state;
      
      const releasedFeature = releaseFeature(feature, state.currentTick);
      const boost = createFeatureBoost(releasedFeature, state.currentTick);
      
      return {
        ...state,
        scheduledFeatures: state.scheduledFeatures.map(f =>
          f.id === featureId ? releasedFeature : f
        ),
        featureBoosts: boost ? [...state.featureBoosts, boost] : state.featureBoosts,
      };
    }

    case 'CANCEL_FEATURE': {
      const { featureId } = action.payload;
      return {
        ...state,
        scheduledFeatures: state.scheduledFeatures.map(f =>
          f.id === featureId ? cancelFeature(f) : f
        ),
      };
    }

    // ========== Office Upgrade Actions ==========
    case 'PURCHASE_OFFICE_UPGRADE': {
      if (!state.company) return state;
      const { upgradeType } = action.payload;
      
      const result = canPurchaseUpgrade(
        upgradeType,
        state.company.officeLevel,
        state.company.funds,
        state.officeUpgrades
      );
      
      if (!result.canPurchase) return state;
      
      const config = OFFICE_UPGRADES[upgradeType];
      const newUpgrades = new Set(state.officeUpgrades);
      newUpgrades.add(upgradeType);
      
      return {
        ...state,
        company: updateCompanyFunds(state.company, -config.cost),
        officeUpgrades: newUpgrades,
      };
    }

    case 'UPGRADE_OFFICE': {
      if (!state.company) return state;
      const currentLevel = state.company.officeLevel;
      if (currentLevel >= 5) return state;
      
      const nextLevel = (currentLevel + 1) as OfficeLevel;
      const tier = OFFICE_TIERS[nextLevel];
      
      if (state.company.funds < tier.upgradeCost) return state;
      
      return {
        ...state,
        company: {
          ...updateCompanyFunds(state.company, -tier.upgradeCost),
          officeLevel: nextLevel,
          monthlyExpenses: tier.monthlyCost,
        },
      };
    }

    // ========== Crowdfunding Actions ==========
    case 'CREATE_CROWDFUNDING_CAMPAIGN': {
      const { name, description, genre, fundingGoal, durationDays } = action.payload;
      const campaign = createCrowdfund({
        name,
        description,
        genre,
        fundingGoal,
        campaignDurationDays: durationDays,
        currentTick: state.currentTick,
      });
      return {
        ...state,
        crowdfundingCampaigns: [...state.crowdfundingCampaigns, campaign],
      };
    }

    case 'LAUNCH_CROWDFUNDING_CAMPAIGN': {
      const { campaignId } = action.payload;
      const campaign = state.crowdfundingCampaigns.find(c => c.id === campaignId);
      if (!campaign) return state;
      
      const launchedCampaign = launchCrowdfund(campaign, state.currentTick);
      
      return {
        ...state,
        crowdfundingCampaigns: state.crowdfundingCampaigns.map(c =>
          c.id === campaignId ? launchedCampaign : c
        ),
      };
    }

    case 'COMPLETE_CROWDFUNDING_MILESTONE': {
      const { campaignId, milestoneId } = action.payload;
      const campaign = state.crowdfundingCampaigns.find(c => c.id === campaignId);
      if (!campaign || campaign.status !== 'funded') return state;
      
      const updatedCampaign = completeMilestone(campaign, milestoneId, state.currentTick);
      const fundsReleased = updatedCampaign.totalFundsReceived - campaign.totalFundsReceived;
      
      return {
        ...state,
        crowdfundingCampaigns: state.crowdfundingCampaigns.map(c =>
          c.id === campaignId ? updatedCampaign : c
        ),
        company: state.company 
          ? updateCompanyFunds(state.company, fundsReleased)
          : state.company,
      };
    }

    // ========== Advertising Actions ==========
    case 'ENABLE_AD_TYPE': {
      if (!state.company) return state;
      const { gameId, adType } = action.payload;
      const config = AD_TYPE_CONFIGS[adType];
      
      if (state.company.funds < config.setupCost) return state;
      
      const currentConfig = state.gameAdConfigs[gameId] ?? createGameAdConfig(gameId);
      const updatedConfig = enableAdType(currentConfig, adType);
      
      return {
        ...state,
        company: updateCompanyFunds(state.company, -config.setupCost),
        gameAdConfigs: {
          ...state.gameAdConfigs,
          [gameId]: updatedConfig,
        },
      };
    }

    case 'DISABLE_AD_TYPE': {
      const { gameId, adType } = action.payload;
      const currentConfig = state.gameAdConfigs[gameId];
      if (!currentConfig) return state;
      
      return {
        ...state,
        gameAdConfigs: {
          ...state.gameAdConfigs,
          [gameId]: disableAdType(currentConfig, adType),
        },
      };
    }

    case 'SET_AD_FREQUENCY': {
      const { gameId, frequency } = action.payload;
      const currentConfig = state.gameAdConfigs[gameId];
      if (!currentConfig) return state;
      
      return {
        ...state,
        gameAdConfigs: {
          ...state.gameAdConfigs,
          [gameId]: { ...currentConfig, adFrequency: Math.max(0.5, Math.min(2.0, frequency)) },
        },
      };
    }

    case 'ACCEPT_SPONSORSHIP': {
      const { dealId } = action.payload;
      const deal = state.sponsorshipDeals.find(d => d.id === dealId);
      if (!deal || deal.status !== 'offered') return state;
      
      const acceptedDeal = acceptSponsorship(deal, state.currentTick);
      const upfrontPayout = acceptedDeal.payoutSchedule === 'upfront' ? acceptedDeal.totalPayout : 0;
      
      return {
        ...state,
        sponsorshipDeals: state.sponsorshipDeals.map(d =>
          d.id === dealId ? acceptedDeal : d
        ),
        company: state.company && upfrontPayout > 0
          ? updateCompanyFunds(state.company, upfrontPayout)
          : state.company,
      };
    }

    case 'REJECT_SPONSORSHIP': {
      const { dealId } = action.payload;
      return {
        ...state,
        sponsorshipDeals: state.sponsorshipDeals.map(d =>
          d.id === dealId ? rejectSponsorship(d) : d
        ),
      };
    }

    // ========== Monetization Actions ==========
    case 'IMPLEMENT_MONETIZATION': {
      if (!state.company) return state;
      const { gameId, strategy } = action.payload;
      const config = MONETIZATION_CONFIGS[strategy];
      
      if (state.company.funds < config.implementationCost) return state;
      
      const implementation = startMonetizationImplementation(gameId, strategy, state.currentTick);
      
      return {
        ...state,
        company: updateCompanyFunds(state.company, -config.implementationCost),
        monetizationImplementations: [...state.monetizationImplementations, implementation],
      };
    }

    case 'UPGRADE_MONETIZATION': {
      if (!state.company) return state;
      const { gameId, strategy } = action.payload;
      
      const currentSetup = state.monetizationSetups[gameId];
      if (!currentSetup || !currentSetup.enabledStrategies.has(strategy)) return state;
      
      const upgradedSetup = upgradeMonetizationLevel(currentSetup, strategy);
      
      // Calculate upgrade cost based on level difference
      const currentLevel = currentSetup.strategyLevels[strategy];
      if (currentLevel >= 3) return state;
      
      const upgradeCost = currentLevel === 1 ? 25000 : 75000;
      if (state.company.funds < upgradeCost) return state;
      
      return {
        ...state,
        company: updateCompanyFunds(state.company, -upgradeCost),
        monetizationSetups: {
          ...state.monetizationSetups,
          [gameId]: upgradedSetup,
        },
      };
    }

    // ========== Launch Phase Actions ==========
    case 'START_PHASED_LAUNCH': {
      const { gameId } = action.payload;
      const game = state.games.find(g => g.id === gameId);
      if (!game || game.developmentProgress < 100) return state;
      
      // Create initial launch state for testing phase (alpha)
      const alphaConfig = LAUNCH_PHASE_CONFIGS.alpha;
      const newLaunchState = createLaunchState(gameId, state.currentTick);
      
      // Calculate initial test users based on playerMultiplier
      const initialTestUsers = Math.floor(1000 * alphaConfig.playerMultiplier);
      
      return {
        ...state,
        games: state.games.map(g =>
          g.id === gameId
            ? {
                ...g,
                status: 'testing' as const,  // Use valid GameStatus
                // Start with minimal players for alpha testing
                monetization: {
                  ...g.monetization,
                  dailyActiveUsers: initialTestUsers,
                  totalDownloads: initialTestUsers,
                },
              }
            : g
        ),
        launchStates: {
          ...state.launchStates,
          [gameId]: newLaunchState,
        },
      };
    }

    case 'ADVANCE_LAUNCH_PHASE': {
      // Launch phase advancement handled in game development process
      // This action is for manual advancement if needed
      return state;
    }

    case 'EXTEND_LAUNCH_PHASE': {
      const { gameId, days } = action.payload;
      const launchState = state.launchStates[gameId];
      if (!launchState) return state;
      
      return {
        ...state,
        launchStates: {
          ...state.launchStates,
          [gameId]: {
            ...launchState,
            extendedDays: launchState.extendedDays + days,
          },
        },
      };
    }

    case 'RESOLVE_FEEDBACK': {
      const { feedbackId } = action.payload;
      return {
        ...state,
        playerFeedback: state.playerFeedback.map(f =>
          f.id === feedbackId 
            ? { ...f, resolved: true, tickResolved: state.currentTick }
            : f
        ),
      };
    }

    default:
      return state;
  }
}

/**
 * Process game development for all games in development
 * Uses proper team effectiveness formula:
 * - Skill average: 40% weight
 * - Team size (capped at 5): 20% weight  
 * - Average morale: 20% weight
 * - Role coverage: 20% weight
 * Plus team synergy bonuses (Producer, balanced team)
 */
function processGameDevelopment(state: GameState): GameState {
  const employeeMap = new Map(state.employees.map(e => [e.id, e]));
  
  // Convert founder to employee-like object if they exist
  const founderEmployee = state.founder ? founderAsEmployee(state.founder) : null;
  if (founderEmployee) {
    employeeMap.set(founderEmployee.id, founderEmployee as Employee);
  }
  
  // Track if founder is working on any project (for training purposes)
  let founderIsWorking = false;
  
  const updatedGames = state.games.map(game => {
    // Skip live, maintenance, and shutdown games
    if (game.status === 'live' || game.status === 'maintenance' || game.status === 'shutdown') {
      return game;
    }

    // Move from planning to development if employees assigned
    let updatedGame = game;
    if (game.status === 'planning' && game.assignedEmployees.length > 0) {
      updatedGame = updateGameStatus(game, 'development');
    }

    // Calculate development progress based on assigned employees (including founder)
    const assignedEmployees = game.assignedEmployees
      .map(id => employeeMap.get(id))
      .filter((e): e is Employee => e !== undefined);
    
    // Check if founder is assigned to this game
    if (state.founder && game.assignedEmployees.includes(state.founder.id)) {
      founderIsWorking = true;
    }

    if (assignedEmployees.length === 0) {
      return updatedGame;
    }

    // === Calculate Team Effectiveness using the tooltip formula ===
    
    // 1. Average skill score (40% weight)
    // Calculate average of primary skills per employee, then average across team
    let totalSkillScore = 0;
    for (const emp of assignedEmployees) {
      const progSkill = emp.skills.programming ?? 0;
      const designSkill = emp.skills.game_design ?? 0;
      const artSkill = emp.skills.art ?? 0;
      const avgSkill = (progSkill + designSkill + artSkill) / 3;
      totalSkillScore += avgSkill;
    }
    const avgSkillScore = (totalSkillScore / assignedEmployees.length) / 100; // Normalize to 0-1
    const skillComponent = avgSkillScore * 0.4;
    
    // 2. Team size score (20% weight) - capped at 5 employees
    const effectiveTeamSize = Math.min(assignedEmployees.length, 5);
    const sizeComponent = (effectiveTeamSize / 5) * 0.2;
    
    // 3. Average morale score (20% weight)
    const avgMorale = assignedEmployees.reduce((sum, e) => sum + e.morale, 0) / assignedEmployees.length;
    const moraleComponent = (avgMorale / 100) * 0.2;
    
    // 4. Role coverage score (20% weight) - unique roles out of 5 possible
    const uniqueRoles = new Set(assignedEmployees.map(e => e.role)).size;
    const coverageComponent = (uniqueRoles / 5) * 0.2;
    
    // Team effectiveness (0 to 1)
    const teamEffectiveness = skillComponent + sizeComponent + moraleComponent + coverageComponent;
    
    // Apply team synergy bonus (Producer bonus, balanced team bonus)
    const synergy = calculateTeamSynergy(assignedEmployees);
    const synergyMultiplier = 1 + synergy;
    
    // Phase-specific progress multipliers
    const phaseMultipliers: Record<string, number> = {
      planning: 2.0,      // Planning is fast
      development: 1.0,   // Development is the baseline
      testing: 1.5,       // Testing is faster than dev
      soft_launch: 1.2,   // Soft launch is fairly quick
      live: 0,            // No progress needed
      maintenance: 0,     // No progress needed
      shutdown: 0,        // No progress needed
    };
    const phaseMultiplier = phaseMultipliers[updatedGame.status] ?? 1.0;

    // Get location bonuses for headquarters
    const locationBonuses = getLocationBonuses(state.company?.headquarters ?? 'Tokyo');
    const locationSpeedMultiplier = 1 + locationBonuses.developmentSpeedBonus;
    const locationQualityMultiplier = 1 + locationBonuses.gameQualityBonus + locationBonuses.gamePolishBonus;

    // Base daily progress: 1-3% based on team effectiveness
    // teamEffectiveness ranges from 0 to 1, so progress ranges from 0.5 to 3.5
    const baseProgress = 0.5 + (teamEffectiveness * 3);
    const dailyProgress = baseProgress * synergyMultiplier * phaseMultiplier * locationSpeedMultiplier;

    // Calculate quality gains based on individual skills, modified by location bonus
    const qualityGain = { graphics: 0, gameplay: 0, story: 0, sound: 0, polish: 0 };
    for (const employee of assignedEmployees) {
      qualityGain.graphics += calculateEffectiveness(employee, 'art') * 0.1 * locationQualityMultiplier;
      qualityGain.gameplay += calculateEffectiveness(employee, 'game_design') * 0.1 * locationQualityMultiplier;
      qualityGain.story += calculateEffectiveness(employee, 'writing') * 0.1 * locationQualityMultiplier;
      qualityGain.sound += calculateEffectiveness(employee, 'sound') * 0.1 * locationQualityMultiplier;
      qualityGain.polish += calculateEffectiveness(employee, 'programming') * 0.05 * locationQualityMultiplier;
    }

    updatedGame = updateProgress(updatedGame, dailyProgress);
    updatedGame = updateQuality(updatedGame, qualityGain);

    // Auto-transition to next phase at 100% progress
    if (updatedGame.developmentProgress >= 100) {
      // Reset progress for next phase and transition
      updatedGame = { ...updatedGame, developmentProgress: 0 };
      
      if (updatedGame.status === 'development') {
        updatedGame = updateGameStatus(updatedGame, 'testing');
      } else if (updatedGame.status === 'testing') {
        updatedGame = updateGameStatus(updatedGame, 'soft_launch');
      } else if (updatedGame.status === 'soft_launch') {
        updatedGame = updateGameStatus(updatedGame, 'live', state.currentTick);
      }
    }

    return updatedGame;
  });

  // Process founder work - reduce energy if working, apply hands-on training
  let updatedFounder = state.founder;
  if (updatedFounder && founderIsWorking) {
    // Founder loses energy from working
    updatedFounder = workFounder(updatedFounder);
    
    // If founder is doing hands-on training while working, apply skill gain
    if (updatedFounder.currentTraining === 'hands_on_practice') {
      updatedFounder = processFounderDailyTraining(updatedFounder, true);
    }
  } else if (updatedFounder && !founderIsWorking && !updatedFounder.currentTraining) {
    // Founder is idle (not working, not training) - recover energy
    updatedFounder = restFounder(updatedFounder);
  }
  
  // Process founder training completion for non-hands-on training
  if (updatedFounder && updatedFounder.trainingEndTick && state.currentTick >= updatedFounder.trainingEndTick) {
    updatedFounder = completeFounderTraining(updatedFounder);
  }

  return { 
    ...state, 
    games: updatedGames,
    founder: updatedFounder,
  };
}

/**
 * Process live games - revenue, player counts, user growth, etc.
 * Uses comprehensive simulation considering quality, reputation, genre, etc.
 */
function processLiveGames(state: GameState): GameState {
  if (!state.company) return state;

  let totalRevenue = 0;
  const employeeMap = new Map(state.employees.map(e => [e.id, e]));
  
  // Add founder to employee map so they can maintain live games too
  const founderEmployee = state.founder ? founderAsEmployee(state.founder) : null;
  if (founderEmployee) {
    employeeMap.set(founderEmployee.id, founderEmployee as Employee);
  }
  
  const updatedGames = state.games.map(game => {
    if (game.status !== 'live') return game;

    // Check if this is a newly launched game (DAU = 0)
    let currentGame = game;
    if (game.monetization.dailyActiveUsers === 0) {
      // Initialize the game with starting DAU
      currentGame = initializeLiveGame(game, state.company!.reputation);
    }

    // Check if there's a marketer assigned to this game
    const assignedEmployees = game.assignedEmployees
      .map(id => employeeMap.get(id))
      .filter((e): e is Employee => e !== undefined);
    const hasMarketer = assignedEmployees.some(e => e.role === 'Marketer');

    // Calculate days since launch
    const daysSinceLaunch = currentGame.launchDate 
      ? state.currentTick - currentGame.launchDate 
      : 0;

    // Simulate one day of live operations
    const result = simulateLiveGameTick(currentGame, {
      companyReputation: state.company!.reputation,
      hasMarketer,
      daysSinceLaunch,
      headquarters: state.company?.headquarters,
    });

    // Apply maintenance effect from assigned staff (other than marketers)
    // Having developers on a live game helps maintain satisfaction AND improve quality
    let finalGame = result.game;
    const maintenanceStaff = assignedEmployees.filter(e => e.role !== 'Marketer');
    if (maintenanceStaff.length > 0) {
      const maintenanceEffect = calculateMaintenanceEffect(finalGame, maintenanceStaff);
      const newSatisfaction = Math.max(0, Math.min(100, 
        finalGame.monetization.playerSatisfaction + maintenanceEffect
      ));
      finalGame = {
        ...finalGame,
        monetization: {
          ...finalGame.monetization,
          playerSatisfaction: newSatisfaction,
        },
      };

      // Apply gradual quality improvements based on team working on the game
      // Get the highest priority improvement for this game
      const priorities = getImprovementPriority(finalGame);
      if (priorities.length > 0) {
        const currentFocus = priorities[0];
        const task = IMPROVEMENT_TASKS[currentFocus];
        
        // Calculate improvement speed based on team skills
        const speed = calculateImprovementSpeed(task, maintenanceStaff);
        
        // Progress = 100% / durationDays * speed modifier
        // Apply a fraction of the quality boosts each day
        const dailyProgress = (1 / task.durationDays) * speed;
        
        // Apply scaled quality improvements
        const qualityUpdates: Record<string, number> = {};
        for (const [key, boost] of Object.entries(task.qualityBoosts)) {
          const qualityKey = key as keyof typeof finalGame.quality;
          const dailyBoost = (boost as number) * dailyProgress;
          // Cap quality at 100
          qualityUpdates[key] = Math.min(100, 
            finalGame.quality[qualityKey] + dailyBoost
          );
        }
        
        finalGame = updateQuality(finalGame, qualityUpdates);
      }
    }

    totalRevenue += result.dailyRevenue;
    
    // Add advertising revenue
    const adConfig = state.gameAdConfigs[game.id];
    if (adConfig && adConfig.enabledAdTypes.size > 0) {
      const adEffects = calculateDailyAdEffects(adConfig, finalGame.monetization.dailyActiveUsers);
      totalRevenue += adEffects.revenue;
      
      // Apply ad satisfaction impact
      const newSat = Math.max(0, Math.min(100,
        finalGame.monetization.playerSatisfaction + adEffects.satisfactionChange
      ));
      finalGame = {
        ...finalGame,
        monetization: { ...finalGame.monetization, playerSatisfaction: newSat },
      };
    }
    
    // Add monetization revenue (beyond base gacha)
    const monetizationSetup = state.monetizationSetups[game.id];
    if (monetizationSetup) {
      const monetizationResult = calculateDailyMonetizationRevenue(
        monetizationSetup,
        finalGame.monetization.dailyActiveUsers,
        result.newUsers
      );
      totalRevenue += monetizationResult.totalRevenue;
      
      // Process battle pass tick
      const updatedSetup = processBattlePassTick(monetizationSetup);
      if (updatedSetup !== monetizationSetup) {
        // Would need to update state.monetizationSetups - handled separately
      }
    }
    
    // Apply feature boost effects
    const boostEffects = calculateCombinedBoosts(game.id, state.featureBoosts, state.currentTick);
    if (boostEffects.revenueMultiplier > 1) {
      totalRevenue *= boostEffects.revenueMultiplier;
    }
    
    return finalGame;
  });

  // Update company funds with revenue
  const updatedCompany = updateCompanyFunds(state.company, totalRevenue);

  return {
    ...state,
    games: updatedGames,
    company: updatedCompany,
  };
}

/**
 * Process monthly expenses (salaries, etc.)
 * Returns game over state if company goes bankrupt
 */
function processMonthlyExpenses(state: GameState): GameState {
  if (!state.company) return state;

  // Calculate total salaries
  const totalSalaries = state.employees.reduce((sum, emp) => sum + emp.salary, 0);
  
  // Check if company will go bankrupt
  const newFunds = state.company.funds - totalSalaries;
  
  if (newFunds < 0) {
    // Game Over - Bankruptcy
    return {
      ...state,
      company: updateCompanyFunds(state.company, -totalSalaries),
      isGameOver: true,
      gameOverReason: `Your company went bankrupt! You couldn't afford the monthly salaries of $${totalSalaries.toLocaleString()}.`,
      isPaused: true,
    };
  }
  
  // Deduct from company funds
  const updatedCompany = updateCompanyFunds(state.company, -totalSalaries);

  return {
    ...state,
    company: updatedCompany,
  };
}

/**
 * Process active campaigns - update status and apply effects
 */
function processCampaigns(state: GameState): GameState {
  if (state.campaigns.length === 0) return state;

  // Update campaign statuses
  const updatedCampaigns: Campaign[] = state.campaigns.map(campaign =>
    updateCampaignStatus(campaign, state.currentTick)
  );

  // Apply campaign effects to games
  let updatedGames = state.games;
  
  for (const game of state.games) {
    if (game.status !== 'live') continue;
    
    const effects = getCombinedCampaignEffects(game.id, updatedCampaigns, state.company?.headquarters);
    
    // Only apply if there are active effects
    if (effects.dauBoost > 0 || effects.retentionBoost > 0 || effects.revenueBoost > 0) {
      updatedGames = updatedGames.map(g => {
        if (g.id !== game.id) return g;
        
        // Apply DAU boost, but cap at genre's maxDAU
        const dauMultiplier = 1 + effects.dauBoost;
        const genreConfig = GENRE_CONFIGS[g.genre];
        const maxDAU = genreConfig?.maxDAU ?? 1000000;
        const newDau = Math.min(maxDAU, Math.round(g.monetization.dailyActiveUsers * dauMultiplier));
        
        return {
          ...g,
          monetization: {
            ...g.monetization,
            dailyActiveUsers: Math.max(g.monetization.dailyActiveUsers, newDau),
          },
        };
      });
    }
  }

  return {
    ...state,
    campaigns: updatedCampaigns,
    games: updatedGames,
  };
}

/**
 * Process employee training - complete training and apply skill boosts
 */
function processTraining(state: GameState): GameState {
  const currentTick = state.currentTick;
  
  // Find completed training
  const completedTraining = state.employeeTraining.filter(t => t.endTick <= currentTick);
  const ongoingTraining = state.employeeTraining.filter(t => t.endTick > currentTick);
  
  if (completedTraining.length === 0) {
    return state;
  }
  
  // Apply training results to employees
  let updatedEmployees = [...state.employees];
  
  for (const training of completedTraining) {
    const employeeIndex = updatedEmployees.findIndex(e => e.id === training.employeeId);
    if (employeeIndex === -1) continue;
    
    const employee = updatedEmployees[employeeIndex];
    const trainedEmployee = completeTraining(employee, training.trainingType);
    
    updatedEmployees[employeeIndex] = trainedEmployee;
  }
  
  return {
    ...state,
    employees: updatedEmployees,
    employeeTraining: ongoingTraining,
  };
}

/**
 * Process scheduled features - development progress, auto-start, release effects
 */
function processScheduledFeatures(state: GameState): GameState {
  if (state.scheduledFeatures.length === 0) return state;
  
  const currentTick = state.currentTick;
  const employeeMap = new Map(state.employees.map(e => [e.id, e]));
  
  // Update feature development progress
  const updatedFeatures = state.scheduledFeatures.map(feature => {
    // Auto-start features that are scheduled to start now
    if (feature.status === 'planned' && feature.scheduledStartTick <= currentTick) {
      return startFeatureDevelopment(feature, currentTick);
    }
    
    // Progress in-development features
    if (feature.status === 'in_progress') {
      const game = state.games.find(g => g.id === feature.gameId);
      if (!game) return feature;
      
      // Get team assigned to the game
      const team = game.assignedEmployees
        .map(id => employeeMap.get(id))
        .filter((e): e is Employee => e !== undefined);
      
      if (team.length === 0) return feature;
      
      // Calculate progress based on team
      const config = FEATURE_TYPE_CONFIGS[feature.type];
      const baseProgress = 100 / config.baseDevelopmentDays;
      const teamSkill = team.reduce((sum, e) => sum + e.skills.programming + e.skills.game_design, 0) / (team.length * 2);
      const skillMultiplier = 0.7 + (teamSkill / 100) * 0.6;
      
      return updateFeatureProgress(feature, baseProgress * skillMultiplier);
    }
    
    return feature;
  });
  
  // Clean up expired feature boosts
  const activeBoosts = state.featureBoosts.filter(b => b.expiresAtTick > currentTick);
  
  return {
    ...state,
    scheduledFeatures: updatedFeatures,
    featureBoosts: activeBoosts,
  };
}

/**
 * Process crowdfunding campaigns - pledges, finalization
 */
function processCrowdfunding(state: GameState): GameState {
  if (state.crowdfundingCampaigns.length === 0) return state;
  if (!state.company) return state;
  
  const currentTick = state.currentTick;
  let updatedCompany = state.company;
  
  const updatedCampaigns = state.crowdfundingCampaigns.map(campaign => {
    // Process active campaigns
    if (campaign.status === 'active') {
      const dayOfCampaign = currentTick - campaign.campaignStartTick;
      let updated = simulateDailyPledges(campaign, updatedCompany.reputation, dayOfCampaign);
      
      // Check if campaign should end
      if (currentTick >= campaign.campaignEndTick) {
        updated = finalizeCampaign(updated, currentTick);
      }
      
      return updated;
    }
    
    return campaign;
  });
  
  return {
    ...state,
    company: updatedCompany,
    crowdfundingCampaigns: updatedCampaigns,
  };
}

/**
 * Process monetization implementations - complete and apply
 */
function processMonetizationImplementations(state: GameState): GameState {
  if (state.monetizationImplementations.length === 0) return state;
  
  const currentTick = state.currentTick;
  const completedImpls = state.monetizationImplementations.filter(i => i.endTick <= currentTick);
  const ongoingImpls = state.monetizationImplementations.filter(i => i.endTick > currentTick);
  
  if (completedImpls.length === 0) return state;
  
  // Apply completed implementations to monetization setups
  let updatedSetups = { ...state.monetizationSetups };
  
  for (const impl of completedImpls) {
    const gameId = impl.gameId;
    const currentSetup = updatedSetups[gameId] ?? createDefaultMonetizationSetup(gameId);
    updatedSetups[gameId] = completeMonetizationImplementation(currentSetup, impl.strategy);
  }
  
  return {
    ...state,
    monetizationSetups: updatedSetups,
    monetizationImplementations: ongoingImpls,
  };
}
