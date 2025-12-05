/**
 * useEmployees Hook - Employee domain data access
 * Part of Prompt 5.1 & 5.5: Employee Management
 * 
 * Provides:
 * - Transformed employee data via ViewModels
 * - Employee filtering and sorting
 * - Hire/fire actions
 * - Employee statistics
 */

import { useMemo, useCallback, useState } from 'react';
import { useGame } from '@presentation/context';
import { GameActions } from '@application/actions';
import { EmployeeRole, EmployeeTier } from '@domain/employee';
import {
  EmployeeViewModel,
  toEmployeeViewModel,
  filterEmployees,
  groupEmployeesByRole,
} from '@presentation/viewmodels/EmployeeViewModel';

/**
 * Filter options for employees
 */
export interface EmployeeFilters {
  role?: EmployeeRole;
  minLevel?: number;
  maxLevel?: number;
  searchTerm?: string;
  sortBy?: 'name' | 'level' | 'salary' | 'morale';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Team statistics summary
 */
export interface TeamStats {
  totalEmployees: number;
  totalSalary: number;
  averageMorale: number;
  averageLevel: number;
  byRole: Record<EmployeeRole, number>;
}

export interface UseEmployeesReturn {
  // Data
  employees: EmployeeViewModel[];
  teamStats: TeamStats;
  employeesByRole: Record<string, EmployeeViewModel[]>;
  
  // Filters
  filters: EmployeeFilters;
  setFilters: (filters: EmployeeFilters) => void;
  clearFilters: () => void;
  
  // Actions
  hireEmployee: (tier: EmployeeTier, role: EmployeeRole) => void;
  fireEmployee: (employeeId: string) => void;
  
  // Utilities
  getEmployeeById: (id: string) => EmployeeViewModel | undefined;
  canHire: boolean;
  hiringBudget: number;
}

const DEFAULT_FILTERS: EmployeeFilters = {
  sortBy: 'name',
};

/**
 * Hook for managing employee data and actions
 */
export function useEmployees(): UseEmployeesReturn {
  const { state, dispatch } = useGame();
  const [filters, setFiltersState] = useState<EmployeeFilters>(DEFAULT_FILTERS);

  // Transform employees to ViewModels
  const allEmployeeViewModels = useMemo(() => {
    return state.employees.map(toEmployeeViewModel);
  }, [state.employees]);

  // Apply filters to ViewModels
  const employees = useMemo(() => {
    return filterEmployees(allEmployeeViewModels, filters);
  }, [allEmployeeViewModels, filters]);

  // Group employees by role
  const employeesByRole = useMemo(() => {
    return groupEmployeesByRole(allEmployeeViewModels);
  }, [allEmployeeViewModels]);

  // Calculate team statistics
  const teamStats = useMemo((): TeamStats => {
    const viewModels: EmployeeViewModel[] = allEmployeeViewModels;
    const totalEmployees = viewModels.length;
    const totalSalary = viewModels.reduce((sum: number, e: EmployeeViewModel) => sum + e.salary, 0);
    const averageMorale = totalEmployees > 0
      ? viewModels.reduce((sum: number, e: EmployeeViewModel) => sum + e.morale.value, 0) / totalEmployees
      : 0;
    const averageLevel = totalEmployees > 0
      ? viewModels.reduce((sum: number, e: EmployeeViewModel) => sum + e.level, 0) / totalEmployees
      : 0;
    
    const byRole: Record<EmployeeRole, number> = {
      Programmer: 0,
      Artist: 0,
      Designer: 0,
      Marketer: 0,
      Producer: 0,
    };
    viewModels.forEach((e: EmployeeViewModel) => {
      const role = e.role as EmployeeRole;
      byRole[role]++;
    });

    return { totalEmployees, totalSalary, averageMorale, averageLevel, byRole };
  }, [allEmployeeViewModels]);

  // Check if company can afford to hire
  const canHire = useMemo(() => {
    if (!state.company) return false;
    // Hiring requires sufficient funds (simplified check)
    return state.company.funds >= 10000;
  }, [state.company]);

  // Available hiring budget
  const hiringBudget = useMemo(() => {
    if (!state.company) return 0;
    // Reserve some funds for operations
    return Math.max(0, state.company.funds - 50000);
  }, [state.company]);

  // Set filters
  const setFilters = useCallback((newFilters: EmployeeFilters) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  // Hire an employee
  const hireEmployee = useCallback((tier: EmployeeTier, role: EmployeeRole) => {
    dispatch(GameActions.hireEmployee(tier, role));
  }, [dispatch]);

  // Fire an employee
  const fireEmployee = useCallback((employeeId: string) => {
    dispatch(GameActions.fireEmployee(employeeId));
  }, [dispatch]);

  // Get employee by ID
  const getEmployeeById = useCallback((id: string): EmployeeViewModel | undefined => {
    const employee = state.employees.find(e => e.id === id);
    return employee ? toEmployeeViewModel(employee) : undefined;
  }, [state.employees]);

  return {
    employees,
    teamStats,
    employeesByRole,
    filters,
    setFilters,
    clearFilters,
    hireEmployee,
    fireEmployee,
    getEmployeeById,
    canHire,
    hiringBudget,
  };
}

/**
 * Hook for a single employee
 */
export function useEmployee(employeeId: string): EmployeeViewModel | null {
  const { state } = useGame();

  return useMemo(() => {
    const employee = state.employees.find(e => e.id === employeeId);
    return employee ? toEmployeeViewModel(employee) : null;
  }, [state.employees, employeeId]);
}

/**
 * Hook for employee role counts (for quick dashboard display)
 */
export function useEmployeeRoleCounts(): Record<EmployeeRole, number> {
  const { state } = useGame();

  return useMemo(() => {
    const counts: Record<EmployeeRole, number> = {
      Programmer: 0,
      Artist: 0,
      Designer: 0,
      Marketer: 0,
      Producer: 0,
    };

    state.employees.forEach(employee => {
      counts[employee.role]++;
    });

    return counts;
  }, [state.employees]);
}
