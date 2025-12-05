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
} from '../../domain';
import { calculateMaintenanceEffect } from '../../domain/game/LiveGameImprovement';
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
      const company = createCompany({
        name: action.payload.name,
        headquarters: action.payload.headquarters,
        foundedDate: state.currentTick,
        startingFunds: 200000,  // Increased from 100k to give more runway
      });
      return {
        ...state,
        company,
        isPaused: false,
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
      
      const updatedGames = state.games.map(game => {
        if (game.id === gameId && game.developmentProgress >= 100) {
          return updateGameStatus(game, 'live', state.currentTick);
        }
        return game;
      });

      return {
        ...state,
        games: updatedGames,
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
      return action.payload.state;
    }

    case 'RESET_STATE': {
      return createInitialState();
    }

    default:
      return state;
  }
}

/**
 * Process game development for all games in development
 */
function processGameDevelopment(state: GameState): GameState {
  const employeeMap = new Map(state.employees.map(e => [e.id, e]));
  
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

    // Calculate development progress based on assigned employees
    const assignedEmployees = game.assignedEmployees
      .map(id => employeeMap.get(id))
      .filter((e): e is Employee => e !== undefined);

    if (assignedEmployees.length === 0) {
      return updatedGame;
    }

    // Calculate daily progress - different phases have different speeds
    let dailyProgress = 0;
    const qualityGain = { graphics: 0, gameplay: 0, story: 0, sound: 0, polish: 0 };
    
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

    for (const employee of assignedEmployees) {
      // Each employee contributes based on their skills
      // Increased base multipliers for faster progress (0.05 -> 0.15, 0.03 -> 0.10)
      dailyProgress += calculateEffectiveness(employee, 'programming') * 0.15;
      dailyProgress += calculateEffectiveness(employee, 'game_design') * 0.10;
      
      qualityGain.graphics += calculateEffectiveness(employee, 'art') * 0.1;
      qualityGain.gameplay += calculateEffectiveness(employee, 'game_design') * 0.1;
      qualityGain.story += calculateEffectiveness(employee, 'writing') * 0.1;
      qualityGain.sound += calculateEffectiveness(employee, 'sound') * 0.1;
      qualityGain.polish += calculateEffectiveness(employee, 'programming') * 0.05;
    }
    
    // Apply phase multiplier
    dailyProgress *= phaseMultiplier;

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

  return { ...state, games: updatedGames };
}

/**
 * Process live games - revenue, player counts, user growth, etc.
 * Uses comprehensive simulation considering quality, reputation, genre, etc.
 */
function processLiveGames(state: GameState): GameState {
  if (!state.company) return state;

  let totalRevenue = 0;
  const employeeMap = new Map(state.employees.map(e => [e.id, e]));
  
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
    });

    // Apply maintenance effect from assigned staff (other than marketers)
    // Having developers on a live game helps maintain satisfaction
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
    }

    totalRevenue += result.dailyRevenue;
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
    
    const effects = getCombinedCampaignEffects(game.id, updatedCampaigns);
    
    // Only apply if there are active effects
    if (effects.dauBoost > 0 || effects.retentionBoost > 0 || effects.revenueBoost > 0) {
      updatedGames = updatedGames.map(g => {
        if (g.id !== game.id) return g;
        
        // Apply DAU boost
        const dauMultiplier = 1 + effects.dauBoost;
        const newDau = Math.round(g.monetization.dailyActiveUsers * dauMultiplier);
        
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
