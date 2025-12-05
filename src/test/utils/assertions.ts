/**
 * Test Utilities - Assertions
 * 
 * Custom assertion helpers for common test patterns.
 * These make tests more readable and provide better error messages.
 */

import { expect } from 'vitest';
import { Result, Option, isSome } from '@domain/shared';
import { Currency } from '@domain/shared';
import { Company } from '@domain/company';
import { Employee } from '@domain/employee';
import { Game, GachaRates } from '@domain/game';

// ============================================================================
// Result Assertions
// ============================================================================

/**
 * Asserts that a Result is Ok and returns the unwrapped value.
 * Provides better error messages than manual checks.
 */
export function assertResultSuccess<T, E>(result: Result<T, E>): T {
  if (!result.success) {
    const errorMsg = 'error' in result 
      ? JSON.stringify(result.error, null, 2)
      : 'Unknown error';
    throw new Error(`Expected Result to be Ok, but was Err: ${errorMsg}`);
  }
  return result.value;
}

/**
 * Asserts that a Result is Err and optionally checks the error.
 * Returns the error for further inspection.
 */
export function assertResultFailure<T, E>(
  result: Result<T, E>,
  expectedError?: Partial<E>
): E {
  if (result.success) {
    throw new Error(
      `Expected Result to be Err, but was Ok with value: ${JSON.stringify(result.value, null, 2)}`
    );
  }
  
  if (expectedError !== undefined) {
    expect(result.error).toMatchObject(expectedError);
  }
  
  return result.error;
}

/**
 * Asserts that a Result is Err with a specific error type
 */
export function assertResultErrorType<T, E extends { type: string }>(
  result: Result<T, E>,
  expectedType: string
): E {
  const error = assertResultFailure(result);
  expect((error as E).type).toBe(expectedType);
  return error;
}

// ============================================================================
// Option Assertions
// ============================================================================

/**
 * Asserts that an Option is Some and returns the unwrapped value.
 */
export function assertOptionSome<T>(option: Option<T>): T {
  if (!isSome(option)) {
    throw new Error('Expected Option to be Some, but was None');
  }
  return option.value;
}

/**
 * Asserts that an Option is None.
 */
export function assertOptionNone<T>(option: Option<T>): void {
  if (isSome(option)) {
    throw new Error(
      `Expected Option to be None, but was Some with value: ${JSON.stringify(option.value, null, 2)}`
    );
  }
}

// ============================================================================
// Currency Assertions
// ============================================================================

/**
 * Asserts that a Currency object has valid values (non-negative, finite)
 */
export function assertValidCurrency(currency: Currency): void {
  expect(currency.gems).toBeGreaterThanOrEqual(0);
  expect(currency.gold).toBeGreaterThanOrEqual(0);
  expect(currency.tickets).toBeGreaterThanOrEqual(0);
  
  expect(Number.isFinite(currency.gems)).toBe(true);
  expect(Number.isFinite(currency.gold)).toBe(true);
  expect(Number.isFinite(currency.tickets)).toBe(true);
}

/**
 * Asserts that a currency has at least the specified amounts
 */
export function assertCurrencyAtLeast(
  currency: Currency,
  minimums: Partial<Currency>
): void {
  if (minimums.gems !== undefined) {
    expect(currency.gems).toBeGreaterThanOrEqual(minimums.gems);
  }
  if (minimums.gold !== undefined) {
    expect(currency.gold).toBeGreaterThanOrEqual(minimums.gold);
  }
  if (minimums.tickets !== undefined) {
    expect(currency.tickets).toBeGreaterThanOrEqual(minimums.tickets);
  }
}

// ============================================================================
// Company Assertions
// ============================================================================

/**
 * Asserts that a Company is in a valid state
 */
export function assertValidCompany(company: Company): void {
  expect(company.id).toBeTruthy();
  expect(company.name).toBeTruthy();
  expect(company.funds).toBeGreaterThanOrEqual(0);
  expect(company.reputation).toBeGreaterThanOrEqual(0);
  expect(company.reputation).toBeLessThanOrEqual(100);
  expect(company.officeLevel).toBeGreaterThanOrEqual(1);
  expect(company.officeLevel).toBeLessThanOrEqual(5);
  expect(company.researchPoints).toBeGreaterThanOrEqual(0);
  expect(company.monthlyExpenses).toBeGreaterThanOrEqual(0);
}

/**
 * Asserts that a company can afford an expense
 */
export function assertCanAfford(company: Company, amount: number): void {
  expect(company.funds).toBeGreaterThanOrEqual(amount);
}

/**
 * Asserts that a company cannot afford an expense
 */
export function assertCannotAfford(company: Company, amount: number): void {
  expect(company.funds).toBeLessThan(amount);
}

// ============================================================================
// Employee Assertions
// ============================================================================

/**
 * Asserts that an Employee is in a valid state
 */
export function assertValidEmployee(employee: Employee): void {
  expect(employee.id).toBeTruthy();
  expect(employee.name).toBeTruthy();
  expect(employee.salary).toBeGreaterThan(0);
  expect(employee.morale).toBeGreaterThanOrEqual(0);
  expect(employee.morale).toBeLessThanOrEqual(100);
  expect(employee.experience).toBeGreaterThanOrEqual(0);
  
  // All skills should be 0-100
  const skills = employee.skills;
  Object.values(skills).forEach(skillValue => {
    expect(skillValue).toBeGreaterThanOrEqual(0);
    expect(skillValue).toBeLessThanOrEqual(100);
  });
}

/**
 * Asserts that an employee has minimum skill levels
 */
export function assertEmployeeSkills(
  employee: Employee,
  minimums: Partial<Record<keyof typeof employee.skills, number>>
): void {
  for (const [skill, minValue] of Object.entries(minimums)) {
    expect(employee.skills[skill as keyof typeof employee.skills])
      .toBeGreaterThanOrEqual(minValue as number);
  }
}

// ============================================================================
// Game Assertions
// ============================================================================

/**
 * Asserts that a Game is in a valid state
 */
export function assertValidGame(game: Game): void {
  expect(game.id).toBeTruthy();
  expect(game.name).toBeTruthy();
  expect(game.developmentProgress).toBeGreaterThanOrEqual(0);
  expect(game.developmentProgress).toBeLessThanOrEqual(100);
  
  // Quality metrics
  const quality = game.quality;
  expect(quality.graphics).toBeGreaterThanOrEqual(0);
  expect(quality.graphics).toBeLessThanOrEqual(100);
  expect(quality.gameplay).toBeGreaterThanOrEqual(0);
  expect(quality.gameplay).toBeLessThanOrEqual(100);
  expect(quality.story).toBeGreaterThanOrEqual(0);
  expect(quality.story).toBeLessThanOrEqual(100);
  expect(quality.sound).toBeGreaterThanOrEqual(0);
  expect(quality.sound).toBeLessThanOrEqual(100);
  expect(quality.polish).toBeGreaterThanOrEqual(0);
  expect(quality.polish).toBeLessThanOrEqual(100);
  
  // Monetization metrics
  expect(game.monetization.dailyActiveUsers).toBeGreaterThanOrEqual(0);
  expect(game.monetization.monthlyRevenue).toBeGreaterThanOrEqual(0);
  expect(game.monetization.playerSatisfaction).toBeGreaterThanOrEqual(0);
  expect(game.monetization.playerSatisfaction).toBeLessThanOrEqual(100);
}

/**
 * Asserts that a game is in a specific status
 */
export function assertGameStatus(
  game: Game,
  expectedStatus: Game['status']
): void {
  expect(game.status).toBe(expectedStatus);
}

// ============================================================================
// Gacha Rate Assertions
// ============================================================================

/**
 * Asserts that gacha rates sum to approximately 1.0
 */
export function assertValidGachaRates(rates: GachaRates): void {
  const sum = rates.common + rates.uncommon + rates.rare + rates.epic + rates.legendary;
  expect(sum).toBeCloseTo(1.0, 5);
  
  // All rates should be non-negative
  expect(rates.common).toBeGreaterThanOrEqual(0);
  expect(rates.uncommon).toBeGreaterThanOrEqual(0);
  expect(rates.rare).toBeGreaterThanOrEqual(0);
  expect(rates.epic).toBeGreaterThanOrEqual(0);
  expect(rates.legendary).toBeGreaterThanOrEqual(0);
}

/**
 * Asserts that legendary rate is within expected range (typically 0.1% - 5%)
 */
export function assertReasonableLegendaryRate(rates: GachaRates): void {
  expect(rates.legendary).toBeGreaterThanOrEqual(0.001); // At least 0.1%
  expect(rates.legendary).toBeLessThanOrEqual(0.05);     // At most 5%
}

// ============================================================================
// Statistical Assertions
// ============================================================================

/**
 * Asserts that an observed probability is close to expected within margin
 * Useful for property-based tests with random sampling
 */
export function assertProbabilityClose(
  observed: number,
  expected: number,
  margin: number = 0.05  // Default 5% margin
): void {
  expect(observed).toBeGreaterThanOrEqual(expected - margin);
  expect(observed).toBeLessThanOrEqual(expected + margin);
}

/**
 * Asserts that a value falls within a percentage range of expected
 */
export function assertWithinPercentage(
  actual: number,
  expected: number,
  percentageMargin: number = 10
): void {
  const margin = expected * (percentageMargin / 100);
  expect(actual).toBeGreaterThanOrEqual(expected - margin);
  expect(actual).toBeLessThanOrEqual(expected + margin);
}

// ============================================================================
// Collection Assertions
// ============================================================================

/**
 * Asserts that array contains no duplicates by ID
 */
export function assertNoDuplicateIds<T extends { id: string }>(items: T[]): void {
  const ids = items.map(item => item.id);
  const uniqueIds = new Set(ids);
  expect(uniqueIds.size).toBe(ids.length);
}

/**
 * Asserts that all items in array satisfy a predicate
 */
export function assertAll<T>(
  items: T[],
  predicate: (item: T) => boolean,
  message?: string
): void {
  const failingItems = items.filter(item => !predicate(item));
  if (failingItems.length > 0) {
    throw new Error(
      message ?? 
      `${failingItems.length} items failed predicate: ${JSON.stringify(failingItems.slice(0, 3))}`
    );
  }
}
