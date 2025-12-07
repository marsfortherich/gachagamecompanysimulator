/**
 * useCompany Hook - Company domain data access
 * Part of Prompt 5.1 & 5.3: Mobile Dashboard
 * 
 * Provides:
 * - Transformed company data via ViewModels
 * - Financial summary and metrics
 * - Company actions
 */

import { useMemo, useCallback } from 'react';
import { useGame } from '@presentation/context';
import { GameActions } from '@application/actions';
import {
  CompanyViewModel,
  toCompanyViewModel,
  toCompanySummary,
  CompanySummary,
  FinancialSummary,
  ReputationDisplay,
} from '@presentation/viewmodels/CompanyViewModel';

export interface UseCompanyReturn {
  // Data
  company: CompanyViewModel | null;
  summary: CompanySummary | null;
  isInitialized: boolean;
  
  // Metrics
  funds: number;
  fundsFormatted: string;
  reputation: ReputationDisplay | null;
  financials: FinancialSummary | null;
  
  // Actions
  canUpgradeOffice: boolean;
  upgradeOffice: () => void;
}

/**
 * Hook for managing company data and actions
 */
export function useCompany(): UseCompanyReturn {
  const { state, dispatch } = useGame();

  // Transform company to ViewModel
  const company = useMemo((): CompanyViewModel | null => {
    if (!state.company) return null;
    return toCompanyViewModel(state.company, state.employees, state.games);
  }, [state.company, state.employees, state.games]);

  // Get summary
  const summary = useMemo((): CompanySummary | null => {
    if (!state.company) return null;
    return toCompanySummary(state.company, state.employees, state.games);
  }, [state.company, state.employees, state.games]);

  // Is game initialized
  const isInitialized = useMemo(() => {
    return state.company !== null;
  }, [state.company]);

  // Funds
  const funds = useMemo(() => {
    return state.company?.funds ?? 0;
  }, [state.company]);

  // Formatted funds
  const fundsFormatted = useMemo(() => {
    return company?.financials.fundsFormatted ?? '$0';
  }, [company]);

  // Reputation
  const reputation = useMemo((): ReputationDisplay | null => {
    return company?.reputation ?? null;
  }, [company]);

  // Financials
  const financials = useMemo((): FinancialSummary | null => {
    return company?.financials ?? null;
  }, [company]);

  // Can upgrade office
  const canUpgradeOffice = useMemo(() => {
    if (!company) return false;
    return company.office.canUpgrade && funds >= (company.office.upgradeCost ?? 0);
  }, [company, funds]);

  // Upgrade office
  const upgradeOffice = useCallback(() => {
    if (canUpgradeOffice) {
      dispatch(GameActions.upgradeOffice());
    }
  }, [canUpgradeOffice, dispatch]);

  return {
    company,
    summary,
    isInitialized,
    funds,
    fundsFormatted,
    reputation,
    financials,
    canUpgradeOffice,
    upgradeOffice,
  };
}

/**
 * Hook for quick access to company funds
 */
export function useFunds(): { funds: number; formatted: string } {
  const { state } = useGame();

  return useMemo(() => ({
    funds: state.company?.funds ?? 0,
    formatted: state.company
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
        }).format(state.company.funds)
      : '$0',
  }), [state.company]);
}

/**
 * Hook for game time/tick
 */
export function useGameTime(): { currentTick: number; formattedDate: string } {
  const { state } = useGame();

  return useMemo(() => {
    const tick = state.currentTick;
    const day = (tick % 30) + 1;
    const month = Math.floor((tick / 30) % 12) + 1;
    const year = Math.floor(tick / 360) + 1;

    return {
      currentTick: tick,
      formattedDate: `Year ${year}, Month ${month}, Day ${day}`,
    };
  }, [state.currentTick]);
}
