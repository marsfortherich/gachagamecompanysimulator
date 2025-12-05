import { GameState } from '../state';
import { CampaignType, EmployeeTier, EmployeeRole, GameGenre, TrainingType } from '../../domain';
import { ImprovementFocus } from '../../domain/game/LiveGameImprovement';

/**
 * Action types for state management
 * Following Redux-like pattern for predictable state updates
 */
export type GameAction =
  | { type: 'INITIALIZE_COMPANY'; payload: { name: string; headquarters?: string } }
  | { type: 'TICK'; payload: { deltaTime: number } }
  | { type: 'SET_GAME_SPEED'; payload: { speed: GameState['gameSpeed'] } }
  | { type: 'TOGGLE_PAUSE' }
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
  | { type: 'RESET_STATE' };

/**
 * Action creators - factory functions for type-safe action creation
 */
export const GameActions = {
  initializeCompany: (name: string, headquarters?: string): GameAction => ({
    type: 'INITIALIZE_COMPANY',
    payload: { name, headquarters },
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
};
