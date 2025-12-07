import { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { GameState, createInitialState } from '../../application/state';
import { GameAction, GameActions } from '../../application/actions';
import { gameReducer } from '../../application/reducers';
import { gameLoop, storageService } from '../../infrastructure';
import { FounderSpecialization, FounderExperience } from '../../domain';

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  startGame: (companyName: string, founderName: string, specialization: FounderSpecialization, experience: FounderExperience, headquarters?: string) => void;
  saveGame: () => Promise<void>;
  loadGame: () => Promise<boolean>;
  resetGame: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, createInitialState());

  // Handle game tick
  const handleTick = useCallback((deltaTime: number) => {
    dispatch(GameActions.tick(deltaTime));
  }, []);

  // Handle auto-save
  const handleAutoSave = useCallback(async () => {
    try {
      await storageService.save(state);
      console.log('Auto-saved');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [state]);

  // Set up game loop
  useEffect(() => {
    if (!state.isPaused && state.company) {
      gameLoop.setSpeed(state.gameSpeed);
      gameLoop.start({
        onTick: handleTick,
        onAutoSave: handleAutoSave,
      });
    } else {
      gameLoop.pause();
    }

    return () => {
      gameLoop.stop();
    };
  }, [state.isPaused, state.company, state.gameSpeed, handleTick, handleAutoSave]);

  // Update game loop speed when speed changes
  useEffect(() => {
    gameLoop.setSpeed(state.gameSpeed);
  }, [state.gameSpeed]);

  // Start a new game
  const startGame = useCallback((companyName: string, founderName: string, specialization: FounderSpecialization, experience: FounderExperience, headquarters?: string) => {
    dispatch(GameActions.initializeCompany(companyName, founderName, specialization, experience, headquarters));
  }, []);

  // Save game
  const saveGame = useCallback(async () => {
    await storageService.save(state);
  }, [state]);

  // Load game
  const loadGame = useCallback(async () => {
    const savedState = await storageService.load();
    if (savedState) {
      dispatch(GameActions.loadState(savedState));
      return true;
    }
    return false;
  }, []);

  // Reset game
  const resetGame = useCallback(() => {
    gameLoop.stop();
    dispatch(GameActions.resetState());
    storageService.clear();
  }, []);

  const value: GameContextValue = {
    state,
    dispatch,
    startGame,
    saveGame,
    loadGame,
    resetGame,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
