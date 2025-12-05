/**
 * Company ViewModel - UI-friendly company representation
 */

import { Company, OfficeLevel } from '@domain/company';
import { Employee } from '@domain/employee';
import { Game } from '@domain/game';

// =============================================================================
// Types
// =============================================================================

export interface FinancialSummary {
  readonly totalFunds: number;
  readonly fundsFormatted: string;
  readonly monthlyRevenue: number;
  readonly monthlyRevenueFormatted: string;
  readonly monthlyExpenses: number;
  readonly monthlyExpensesFormatted: string;
  readonly netIncome: number;
  readonly netIncomeFormatted: string;
  readonly isProfit: boolean;
  readonly runwayMonths: number | null; // null if profitable
  readonly runwayLabel: string;
}

export interface ReputationDisplay {
  readonly value: number;
  readonly maxValue: number;
  readonly percentage: number;
  readonly tier: 'terrible' | 'poor' | 'average' | 'good' | 'excellent';
  readonly tierLabel: string;
  readonly color: string;
  readonly icon: string;
}

export interface OfficeDisplay {
  readonly level: OfficeLevel;
  readonly label: string;
  readonly capacity: number;
  readonly currentEmployees: number;
  readonly utilizationPercent: number;
  readonly canUpgrade: boolean;
  readonly upgradeCost: number | null;
}

export interface CompanyViewModel {
  readonly id: string;
  readonly name: string;
  readonly headquarters: string;
  readonly foundedDate: number;
  readonly foundedLabel: string;
  readonly reputation: ReputationDisplay;
  readonly financials: FinancialSummary;
  readonly office: OfficeDisplay;
  readonly employeeCount: number;
  readonly gameCount: number;
  readonly liveGameCount: number;
  readonly researchPoints: number;
  readonly researchPointsFormatted: string;
}

// =============================================================================
// Constants
// =============================================================================

const OFFICE_LABELS: Record<OfficeLevel, string> = {
  1: 'Garage Startup',
  2: 'Small Office',
  3: 'Medium Office',
  4: 'Large Office',
  5: 'Corporate Campus',
};

const OFFICE_CAPACITY: Record<OfficeLevel, number> = {
  1: 5,
  2: 15,
  3: 50,
  4: 150,
  5: 500,
};

const OFFICE_UPGRADE_COST: Record<OfficeLevel, number | null> = {
  1: 50000,
  2: 200000,
  3: 1000000,
  4: 5000000,
  5: null, // Max level
};

// =============================================================================
// Transformation Functions
// =============================================================================

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  
  if (absAmount >= 1000000000) {
    return `${sign}$${(absAmount / 1000000000).toFixed(1)}B`;
  }
  if (absAmount >= 1000000) {
    return `${sign}$${(absAmount / 1000000).toFixed(1)}M`;
  }
  if (absAmount >= 1000) {
    return `${sign}$${(absAmount / 1000).toFixed(0)}K`;
  }
  return `${sign}$${absAmount.toFixed(0)}`;
}

/**
 * Calculate reputation tier and display
 */
function toReputationDisplay(reputation: number): ReputationDisplay {
  let tier: ReputationDisplay['tier'];
  let tierLabel: string;
  let color: string;
  let icon: string;

  if (reputation < 20) {
    tier = 'terrible';
    tierLabel = 'Terrible';
    color = '#EF4444';
    icon = '💀';
  } else if (reputation < 40) {
    tier = 'poor';
    tierLabel = 'Poor';
    color = '#F59E0B';
    icon = '😟';
  } else if (reputation < 60) {
    tier = 'average';
    tierLabel = 'Average';
    color = '#6B7280';
    icon = '😐';
  } else if (reputation < 80) {
    tier = 'good';
    tierLabel = 'Good';
    color = '#22C55E';
    icon = '😊';
  } else {
    tier = 'excellent';
    tierLabel = 'Excellent';
    color = '#10B981';
    icon = '🌟';
  }

  return {
    value: reputation,
    maxValue: 100,
    percentage: Math.min(100, Math.max(0, reputation)),
    tier,
    tierLabel,
    color,
    icon,
  };
}

/**
 * Calculate office display info
 */
function toOfficeDisplay(
  level: OfficeLevel,
  employeeCount: number,
  funds: number
): OfficeDisplay {
  const capacity = OFFICE_CAPACITY[level];
  const upgradeCost = OFFICE_UPGRADE_COST[level];
  const canUpgrade = level < 5 && upgradeCost !== null && funds >= upgradeCost;
  
  return {
    level,
    label: OFFICE_LABELS[level],
    capacity,
    currentEmployees: employeeCount,
    utilizationPercent: Math.round((employeeCount / capacity) * 100),
    canUpgrade,
    upgradeCost,
  };
}

/**
 * Calculate financial summary
 */
function calculateFinancials(
  company: Company,
  employees: Employee[],
  games: Game[]
): FinancialSummary {
  const totalFunds = company.funds;
  
  // Calculate monthly revenue from live games
  const monthlyRevenue = games
    .filter(g => g.status === 'live')
    .reduce((sum, g) => sum + g.monetization.monthlyRevenue, 0);
  
  // Calculate monthly expenses (employee salaries + overhead)
  const salaryExpenses = employees.reduce((sum, e) => sum + e.salary, 0);
  const overhead = company.monthlyExpenses || 0;
  const monthlyExpenses = salaryExpenses + overhead;
  
  // Net income
  const netIncome = monthlyRevenue - monthlyExpenses;
  const isProfit = netIncome >= 0;
  
  // Runway calculation (months until bankruptcy)
  let runwayMonths: number | null = null;
  let runwayLabel = 'Profitable';
  
  if (!isProfit && monthlyExpenses > 0) {
    runwayMonths = Math.floor(totalFunds / monthlyExpenses);
    if (runwayMonths < 3) {
      runwayLabel = `⚠️ ${runwayMonths} months left`;
    } else if (runwayMonths < 12) {
      runwayLabel = `${runwayMonths} months runway`;
    } else {
      runwayLabel = `${Math.floor(runwayMonths / 12)}+ years runway`;
    }
  }
  
  return {
    totalFunds,
    fundsFormatted: formatCurrency(totalFunds),
    monthlyRevenue,
    monthlyRevenueFormatted: formatCurrency(monthlyRevenue),
    monthlyExpenses,
    monthlyExpensesFormatted: formatCurrency(monthlyExpenses),
    netIncome,
    netIncomeFormatted: formatCurrency(netIncome),
    isProfit,
    runwayMonths,
    runwayLabel,
  };
}

/**
 * Format date from tick number
 */
function formatFoundedDate(tick: number): string {
  // Assume game starts at Jan 1, 2020, 1 tick = 1 day
  const startDate = new Date(2020, 0, 1);
  const date = new Date(startDate.getTime() + tick * 24 * 60 * 60 * 1000);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short' 
  });
}

// =============================================================================
// Main Transformer
// =============================================================================

/**
 * Transform domain Company to CompanyViewModel
 */
export function toCompanyViewModel(
  company: Company,
  employees: Employee[],
  games: Game[]
): CompanyViewModel {
  const liveGames = games.filter(g => g.status === 'live');
  
  return {
    id: company.id,
    name: company.name,
    headquarters: company.headquarters,
    foundedDate: company.foundedDate,
    foundedLabel: formatFoundedDate(company.foundedDate),
    reputation: toReputationDisplay(company.reputation),
    financials: calculateFinancials(company, employees, games),
    office: toOfficeDisplay(company.officeLevel, employees.length, company.funds),
    employeeCount: employees.length,
    gameCount: games.length,
    liveGameCount: liveGames.length,
    researchPoints: company.researchPoints,
    researchPointsFormatted: `${company.researchPoints.toLocaleString()} RP`,
  };
}

/**
 * Create a summary for dashboard display
 */
export interface CompanySummary {
  name: string;
  funds: string;
  reputation: { value: number; color: string };
  employees: number;
  liveGames: number;
  monthlyProfit: string;
  isHealthy: boolean;
}

export function toCompanySummary(
  company: Company,
  employees: Employee[],
  games: Game[]
): CompanySummary {
  const vm = toCompanyViewModel(company, employees, games);
  
  return {
    name: vm.name,
    funds: vm.financials.fundsFormatted,
    reputation: { 
      value: vm.reputation.value, 
      color: vm.reputation.color 
    },
    employees: vm.employeeCount,
    liveGames: vm.liveGameCount,
    monthlyProfit: vm.financials.netIncomeFormatted,
    isHealthy: vm.financials.isProfit || (vm.financials.runwayMonths ?? 12) >= 6,
  };
}
