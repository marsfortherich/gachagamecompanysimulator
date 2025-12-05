/**
 * useGacha Hook - Gacha domain data access
 * Part of Prompt 5.1 & 5.4: Gacha Animation
 * 
 * Provides:
 * - Transformed gacha data via ViewModels
 * - Banner management
 * - Pull animation state
 * - Revenue tracking
 */

import { useMemo, useCallback, useState, useReducer } from 'react';
import { useGame } from '@presentation/context';
import { GameActions } from '@application/actions';
import { Rarity } from '@domain/gacha';
import {
  GachaItemViewModel,
  GachaBannerViewModel,
  PullAnimationState,
  PullResultViewModel,
  toGachaItemViewModel,
  toGachaBannerViewModel,
  filterGachaItems,
  filterBanners,
  createInitialAnimationState,
  advanceReveal,
  completeAnimation,
  GachaItemFilters,
  BannerFilters,
} from '@presentation/viewmodels/GachaViewModel';

export interface UseGachaReturn {
  // Data
  items: GachaItemViewModel[];
  banners: GachaBannerViewModel[];
  activeBanners: GachaBannerViewModel[];
  
  // Filters
  itemFilters: GachaItemFilters;
  setItemFilters: (filters: Partial<GachaItemFilters>) => void;
  bannerFilters: BannerFilters;
  setBannerFilters: (filters: Partial<BannerFilters>) => void;
  
  // Actions
  createBanner: (gameId: string, name: string, duration: number) => void;
  
  // Utilities
  getItemById: (id: string) => GachaItemViewModel | undefined;
  getBannerById: (id: string) => GachaBannerViewModel | undefined;
}

/**
 * Hook for managing gacha data and actions
 */
export function useGacha(): UseGachaReturn {
  const { state, dispatch } = useGame();
  const [itemFilters, setItemFiltersState] = useState<GachaItemFilters>({});
  const [bannerFilters, setBannerFiltersState] = useState<BannerFilters>({});

  // Transform items to ViewModels with filtering
  const items = useMemo(() => {
    return filterGachaItems(state.gachaItems, itemFilters);
  }, [state.gachaItems, itemFilters]);

  // Transform banners to ViewModels with filtering
  const banners = useMemo(() => {
    return filterBanners(state.gachaBanners, state.currentTick, bannerFilters);
  }, [state.gachaBanners, state.currentTick, bannerFilters]);

  // Get active banners only
  const activeBanners = useMemo(() => {
    return banners.filter(b => b.isActive);
  }, [banners]);

  // Set item filters
  const setItemFilters = useCallback((newFilters: Partial<GachaItemFilters>) => {
    setItemFiltersState((prev: GachaItemFilters) => ({ ...prev, ...newFilters }));
  }, []);

  // Set banner filters
  const setBannerFilters = useCallback((newFilters: Partial<BannerFilters>) => {
    setBannerFiltersState((prev: BannerFilters) => ({ ...prev, ...newFilters }));
  }, []);

  // Create a new banner
  const createBanner = useCallback((gameId: string, name: string, duration: number) => {
    dispatch(GameActions.createBanner(gameId, name, duration));
  }, [dispatch]);

  // Get item by ID
  const getItemById = useCallback((id: string): GachaItemViewModel | undefined => {
    const item = state.gachaItems.find(i => i.id === id);
    return item ? toGachaItemViewModel(item) : undefined;
  }, [state.gachaItems]);

  // Get banner by ID
  const getBannerById = useCallback((id: string): GachaBannerViewModel | undefined => {
    const banner = state.gachaBanners.find(b => b.id === id);
    return banner ? toGachaBannerViewModel(banner, state.currentTick) : undefined;
  }, [state.gachaBanners, state.currentTick]);

  return {
    items,
    banners,
    activeBanners,
    itemFilters,
    setItemFilters,
    bannerFilters,
    setBannerFilters,
    createBanner,
    getItemById,
    getBannerById,
  };
}

// =============================================================================
// Animation Hook
// =============================================================================

type AnimationAction =
  | { type: 'START'; results: PullResultViewModel[] }
  | { type: 'ADVANCE' }
  | { type: 'COMPLETE' }
  | { type: 'RESET' };

function animationReducer(
  state: PullAnimationState,
  action: AnimationAction
): PullAnimationState {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        isAnimating: true,
        currentPhase: 'pulling',
        results: action.results,
        revealIndex: -1,
      };
    case 'ADVANCE':
      return advanceReveal(state);
    case 'COMPLETE':
      return completeAnimation(state);
    case 'RESET':
      return createInitialAnimationState();
    default:
      return state;
  }
}

export interface UsePullAnimationReturn {
  // State
  animationState: PullAnimationState;
  isAnimating: boolean;
  currentResult: PullResultViewModel | null;
  
  // Actions
  startAnimation: (results: PullResultViewModel[]) => void;
  advanceToNext: () => void;
  skipAnimation: () => void;
  resetAnimation: () => void;
  
  // Computed
  hasMoreResults: boolean;
  revealedCount: number;
  totalCount: number;
}

/**
 * Hook for managing pull animation state
 */
export function usePullAnimation(): UsePullAnimationReturn {
  const [animationState, dispatch] = useReducer(
    animationReducer,
    createInitialAnimationState()
  );

  const isAnimating = animationState.isAnimating;
  
  const currentResult = useMemo(() => {
    if (animationState.revealIndex < 0) return null;
    return animationState.results[animationState.revealIndex] ?? null;
  }, [animationState.results, animationState.revealIndex]);

  const hasMoreResults = useMemo(() => {
    return animationState.revealIndex < animationState.results.length - 1;
  }, [animationState.revealIndex, animationState.results.length]);

  const revealedCount = Math.max(0, animationState.revealIndex + 1);
  const totalCount = animationState.results.length;

  const startAnimation = useCallback((results: PullResultViewModel[]) => {
    dispatch({ type: 'START', results });
  }, []);

  const advanceToNext = useCallback(() => {
    dispatch({ type: 'ADVANCE' });
  }, []);

  const skipAnimation = useCallback(() => {
    dispatch({ type: 'COMPLETE' });
  }, []);

  const resetAnimation = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    animationState,
    isAnimating,
    currentResult,
    startAnimation,
    advanceToNext,
    skipAnimation,
    resetAnimation,
    hasMoreResults,
    revealedCount,
    totalCount,
  };
}

/**
 * Hook for gacha items by rarity (for collection display)
 */
export function useGachaItemsByRarity(): Record<Rarity, GachaItemViewModel[]> {
  const { state } = useGame();

  return useMemo(() => {
    const byRarity: Record<Rarity, GachaItemViewModel[]> = {
      common: [],
      uncommon: [],
      rare: [],
      epic: [],
      legendary: [],
    };

    state.gachaItems.forEach(item => {
      const vm = toGachaItemViewModel(item);
      byRarity[item.rarity].push(vm);
    });

    return byRarity;
  }, [state.gachaItems]);
}

/**
 * Hook for banner statistics
 */
export function useBannerStats(bannerId: string): {
  totalPulls: number;
  estimatedRevenue: number;
  isActive: boolean;
} | null {
  const { state } = useGame();

  return useMemo(() => {
    const banner = state.gachaBanners.find(b => b.id === bannerId);
    if (!banner) return null;

    const isActive = state.currentTick >= banner.startDate && 
                     state.currentTick < banner.endDate;

    // Placeholder stats - would be tracked in actual implementation
    return {
      totalPulls: 0,
      estimatedRevenue: 0,
      isActive,
    };
  }, [state.gachaBanners, state.currentTick, bannerId]);
}
