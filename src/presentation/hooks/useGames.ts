/**
 * useGames Hook - Game domain data access
 * Part of Prompt 5.1 & 5.6: Game Development Progress UI
 * 
 * Provides:
 * - Transformed game data via ViewModels
 * - Game filtering and sorting
 * - Game development actions
 * - Progress tracking
 */

import { useMemo, useCallback, useState } from 'react';
import { useGame } from '@presentation/context';
import { GameActions } from '@application/actions';
import { GameGenre, GameStatus } from '@domain/game';
import {
  GameViewModel,
  toGameViewModel,
  filterGames,
  PhaseInfo,
} from '@presentation/viewmodels/GameViewModel';

/**
 * Filter options for games
 */
export interface GameFilters {
  status?: GameStatus;
  genre?: GameGenre;
  searchTerm?: string;
  sortBy?: 'name' | 'status' | 'quality' | 'revenue';
  sortOrder?: 'asc' | 'desc';
}

export interface UseGamesReturn {
  // Data
  games: GameViewModel[];
  liveGames: GameViewModel[];
  developingGames: GameViewModel[];
  
  // Filters
  filters: GameFilters;
  setFilters: (filters: Partial<GameFilters>) => void;
  clearFilters: () => void;
  
  // Actions
  startProject: (name: string, genre: GameGenre) => void;
  launchGame: (gameId: string) => void;
  assignEmployee: (employeeId: string, gameId: string) => void;
  
  // Utilities
  getGameById: (id: string) => GameViewModel | undefined;
  totalRevenue: number;
  totalRevenueFormatted: string;
}

const DEFAULT_FILTERS: GameFilters = {
  sortBy: 'name',
};

/**
 * Hook for managing game data and actions
 */
export function useGames(): UseGamesReturn {
  const { state, dispatch } = useGame();
  const [filters, setFiltersState] = useState<GameFilters>(DEFAULT_FILTERS);

  // Transform all games to ViewModels
  const allGameViewModels = useMemo(() => {
    return state.games.map(game => toGameViewModel(game, state.employees));
  }, [state.games, state.employees]);

  // Apply filters
  const games = useMemo(() => {
    return filterGames(allGameViewModels, filters);
  }, [allGameViewModels, filters]);

  // Get live games only
  const liveGames = useMemo(() => {
    return allGameViewModels.filter(g => g.status === 'live');
  }, [allGameViewModels]);

  // Get games in development
  const developingGames = useMemo(() => {
    return allGameViewModels.filter(g => 
      g.status === 'planning' || 
      g.status === 'development' || 
      g.status === 'testing'
    );
  }, [allGameViewModels]);

  // Calculate total revenue from monetization
  const totalRevenue = useMemo(() => {
    return liveGames.reduce((sum, g) => sum + (g.monetization?.monthlyRevenue || 0), 0);
  }, [liveGames]);

  const totalRevenueFormatted = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(totalRevenue);
  }, [totalRevenue]);

  // Set filters
  const setFilters = useCallback((newFilters: Partial<GameFilters>) => {
    setFiltersState((prev: GameFilters) => ({ ...prev, ...newFilters }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  // Start a new project
  const startProject = useCallback((name: string, genre: GameGenre) => {
    dispatch(GameActions.startGameProject(name, genre));
  }, [dispatch]);

  // Launch a game
  const launchGame = useCallback((gameId: string) => {
    dispatch(GameActions.launchGame(gameId));
  }, [dispatch]);

  // Assign employee to game
  const assignEmployee = useCallback((employeeId: string, gameId: string) => {
    dispatch(GameActions.assignToProject(employeeId, gameId));
  }, [dispatch]);

  // Get game by ID
  const getGameById = useCallback((id: string): GameViewModel | undefined => {
    return allGameViewModels.find(g => g.id === id);
  }, [allGameViewModels]);

  return {
    games,
    liveGames,
    developingGames,
    filters,
    setFilters,
    clearFilters,
    startProject,
    launchGame,
    assignEmployee,
    getGameById,
    totalRevenue,
    totalRevenueFormatted,
  };
}

/**
 * Hook for a single game
 */
export function useGameDetails(gameId: string): GameViewModel | null {
  const { state } = useGame();

  return useMemo(() => {
    const game = state.games.find(g => g.id === gameId);
    return game ? toGameViewModel(game, state.employees) : null;
  }, [state.games, state.employees, gameId]);
}

/**
 * Hook for game development progress
 */
export function useGameProgress(gameId: string): {
  phase: PhaseInfo;
  isComplete: boolean;
} | null {
  const { state } = useGame();

  return useMemo(() => {
    const game = state.games.find(g => g.id === gameId);
    if (!game) return null;

    const vm = toGameViewModel(game, state.employees);
    
    return {
      phase: vm.phase,
      isComplete: game.status === 'live' || game.status === 'shutdown',
    };
  }, [state.games, state.employees, gameId]);
}

/**
 * Hook for games by status
 */
export function useGamesByStatus(): Record<GameStatus, GameViewModel[]> {
  const { state } = useGame();

  return useMemo(() => {
    const byStatus: Record<GameStatus, GameViewModel[]> = {
      planning: [],
      development: [],
      testing: [],
      soft_launch: [],
      live: [],
      maintenance: [],
      shutdown: [],
    };

    state.games.forEach(game => {
      const vm = toGameViewModel(game, state.employees);
      byStatus[game.status].push(vm);
    });

    return byStatus;
  }, [state.games, state.employees]);
}
