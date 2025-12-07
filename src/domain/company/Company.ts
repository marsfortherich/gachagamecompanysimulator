import { Entity, generateId, Result, ok, err } from '../shared';
import { Employee } from '../employee';

/**
 * Office levels with associated costs and employee capacity
 * Level 0 = Parents' Basement (starting point, no employees allowed)
 */
export type OfficeLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface OfficeTier {
  readonly level: OfficeLevel;
  readonly name: string;
  readonly maxEmployees: number;
  readonly monthlyCost: number;
  readonly upgradeCost: number;
}

export const OFFICE_TIERS: Record<OfficeLevel, OfficeTier> = {
  0: { level: 0, name: "Parents' Basement", maxEmployees: 0, monthlyCost: 0, upgradeCost: 0 },
  1: { level: 1, name: 'Garage Startup', maxEmployees: 5, monthlyCost: 1000, upgradeCost: 5000 },
  2: { level: 2, name: 'Small Office', maxEmployees: 15, monthlyCost: 5000, upgradeCost: 50000 },
  3: { level: 3, name: 'Medium Office', maxEmployees: 30, monthlyCost: 15000, upgradeCost: 200000 },
  4: { level: 4, name: 'Large Studio', maxEmployees: 60, monthlyCost: 40000, upgradeCost: 500000 },
  5: { level: 5, name: 'Corporate HQ', maxEmployees: 100, monthlyCost: 100000, upgradeCost: 1500000 },
};

/**
 * Company error types
 */
export type CompanyError =
  | { type: 'INSUFFICIENT_FUNDS'; required: number; available: number }
  | { type: 'MAX_EMPLOYEES_REACHED'; max: number }
  | { type: 'EMPLOYEE_NOT_FOUND'; employeeId: string }
  | { type: 'MAX_OFFICE_LEVEL' }
  | { type: 'INVALID_OPERATION'; message: string };

/**
 * Represents a game development company
 */
export interface Company extends Entity {
  readonly name: string;
  readonly funds: number;           // Available money in dollars
  readonly reputation: number;      // 0-100 scale
  readonly foundedDate: number;     // Game tick when founded
  readonly headquarters: string;    // Location name
  readonly officeLevel: OfficeLevel;
  readonly researchPoints: number;  // Used for unlocking features
  readonly employeeIds: readonly string[];
  readonly monthlyExpenses: number; // Cached monthly costs
}

/**
 * Parameters for creating a new company
 */
export interface CreateCompanyParams {
  name: string;
  startingFunds?: number;
  headquarters?: string;
  foundedDate: number;
}

/**
 * Creates a new company entity
 */
export function createCompany(params: CreateCompanyParams): Company {
  const officeLevel: OfficeLevel = 0; // Start in parents' basement
  return {
    id: generateId(),
    name: params.name,
    funds: params.startingFunds ?? 200000,  // Increased from 100k for better balance
    reputation: 50, // Start with neutral reputation
    foundedDate: params.foundedDate,
    headquarters: params.headquarters ?? 'Tokyo',
    officeLevel,
    researchPoints: 0,
    employeeIds: [],
    monthlyExpenses: OFFICE_TIERS[officeLevel].monthlyCost,
  };
}

/**
 * Updates company funds
 */
export function updateCompanyFunds(company: Company, amount: number): Company {
  return {
    ...company,
    funds: Math.max(0, company.funds + amount),
  };
}

/**
 * Updates company reputation (clamped 0-100)
 */
export function updateCompanyReputation(company: Company, change: number): Company {
  return {
    ...company,
    reputation: Math.max(0, Math.min(100, company.reputation + change)),
  };
}

/**
 * Checks if company can afford an expense
 */
export function canAfford(company: Company, amount: number): boolean {
  return company.funds >= amount;
}

/**
 * Gets maximum employee count for current office
 */
export function getMaxEmployees(company: Company): number {
  return OFFICE_TIERS[company.officeLevel].maxEmployees;
}

/**
 * Checks if company can hire more employees
 */
export function canHireEmployee(company: Company): boolean {
  return company.employeeIds.length < getMaxEmployees(company);
}

/**
 * Hires an employee (adds to company roster)
 */
export function hireEmployee(
  company: Company,
  employee: Employee,
  hiringCost: number
): Result<Company, CompanyError> {
  if (!canAfford(company, hiringCost)) {
    return err({
      type: 'INSUFFICIENT_FUNDS',
      required: hiringCost,
      available: company.funds,
    });
  }

  if (!canHireEmployee(company)) {
    return err({
      type: 'MAX_EMPLOYEES_REACHED',
      max: getMaxEmployees(company),
    });
  }

  return ok({
    ...company,
    funds: company.funds - hiringCost,
    employeeIds: [...company.employeeIds, employee.id],
  });
}

/**
 * Fires an employee (removes from company roster)
 */
export function fireEmployee(
  company: Company,
  employeeId: string,
  severancePay: number
): Result<Company, CompanyError> {
  if (!company.employeeIds.includes(employeeId)) {
    return err({ type: 'EMPLOYEE_NOT_FOUND', employeeId });
  }

  if (!canAfford(company, severancePay)) {
    return err({
      type: 'INSUFFICIENT_FUNDS',
      required: severancePay,
      available: company.funds,
    });
  }

  return ok({
    ...company,
    funds: company.funds - severancePay,
    employeeIds: company.employeeIds.filter((id) => id !== employeeId),
  });
}

/**
 * Upgrades company office to the next level
 */
export function upgradeOffice(company: Company): Result<Company, CompanyError> {
  if (company.officeLevel >= 5) {
    return err({ type: 'MAX_OFFICE_LEVEL' });
  }

  const nextLevel = (company.officeLevel + 1) as OfficeLevel;
  const upgradeCost = OFFICE_TIERS[nextLevel].upgradeCost;

  if (!canAfford(company, upgradeCost)) {
    return err({
      type: 'INSUFFICIENT_FUNDS',
      required: upgradeCost,
      available: company.funds,
    });
  }

  return ok({
    ...company,
    funds: company.funds - upgradeCost,
    officeLevel: nextLevel,
    monthlyExpenses: OFFICE_TIERS[nextLevel].monthlyCost,
  });
}

/**
 * Adds research points to company
 */
export function addResearchPoints(company: Company, points: number): Company {
  return {
    ...company,
    researchPoints: company.researchPoints + points,
  };
}

/**
 * Spends research points
 */
export function spendResearchPoints(
  company: Company,
  points: number
): Result<Company, CompanyError> {
  if (company.researchPoints < points) {
    return err({
      type: 'INVALID_OPERATION',
      message: `Not enough research points. Have ${company.researchPoints}, need ${points}`,
    });
  }

  return ok({
    ...company,
    researchPoints: company.researchPoints - points,
  });
}

/**
 * Calculates monthly salary expenses for employees
 */
export function calculateSalaryExpenses(
  company: Company,
  employees: readonly Employee[]
): number {
  return employees
    .filter((e) => company.employeeIds.includes(e.id))
    .reduce((sum, e) => sum + e.salary, 0);
}

/**
 * Processes monthly expenses (office + salaries)
 */
export function processMonthlyExpenses(
  company: Company,
  employees: readonly Employee[]
): Result<Company, CompanyError> {
  const salaries = calculateSalaryExpenses(company, employees);
  const totalExpenses = company.monthlyExpenses + salaries;

  if (!canAfford(company, totalExpenses)) {
    return err({
      type: 'INSUFFICIENT_FUNDS',
      required: totalExpenses,
      available: company.funds,
    });
  }

  return ok(updateCompanyFunds(company, -totalExpenses));
}