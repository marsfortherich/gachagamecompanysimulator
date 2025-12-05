/**
 * Test Utilities
 * 
 * Centralized exports for all test utilities, builders, fixtures, assertions, and mocks.
 */

// Builders - Fluent builders for creating test entities
export {
  CompanyBuilder,
  EmployeeBuilder,
  GameBuilder,
  BannerBuilder,
  GachaItemBuilder,
  createItemPool,
} from './builders';

// Fixtures - Pre-configured test data
export {
  // Company fixtures
  defaultCompany,
  startupCompany,
  establishedCompany,
  bankruptCompany,
  reputableCompany,
  disreputableCompany,
  
  // Employee fixtures
  defaultEmployee,
  juniorDeveloper,
  seniorDeveloper,
  experiencedArtist,
  gameDesigner,
  marketer,
  demoralizedEmployee,
  motivatedEmployee,
  smallTeam,
  
  // Game fixtures
  defaultGame,
  earlyRPG,
  readyPuzzleGame,
  successfulGame,
  strugglingGame,
  idleGame,
  
  // Gacha fixtures
  standardItemPool,
  defaultBanner,
  generousBanner,
  predatoryBanner,
  limitedBanner,
  legendaryCharacter,
  commonWeapon,
  
  // Scenario fixtures
  createNewStudioScenario,
  createLiveGameScenario,
  createPityTestScenario,
} from './fixtures';

// Assertions - Custom assertion helpers
export {
  // Result assertions
  assertResultSuccess,
  assertResultFailure,
  assertResultErrorType,
  
  // Option assertions
  assertOptionSome,
  assertOptionNone,
  
  // Currency assertions
  assertValidCurrency,
  assertCurrencyAtLeast,
  
  // Company assertions
  assertValidCompany,
  assertCanAfford,
  assertCannotAfford,
  
  // Employee assertions
  assertValidEmployee,
  assertEmployeeSkills,
  
  // Game assertions
  assertValidGame,
  assertGameStatus,
  
  // Gacha rate assertions
  assertValidGachaRates,
  assertReasonableLegendaryRate,
  
  // Statistical assertions
  assertProbabilityClose,
  assertWithinPercentage,
  
  // Collection assertions
  assertNoDuplicateIds,
  assertAll,
} from './assertions';

// Mocks - Mock implementations for testing
export {
  MockRNG,
  createFixedRNG,
  createCyclingRNG,
  createLowRNG,
  createHighRNG,
  createSeededRNG,
  MockClock,
  createSpy,
  createTestEnvironment,
  runMultipleTimes,
  measureDistribution,
  toPercentages,
} from './mocks';
