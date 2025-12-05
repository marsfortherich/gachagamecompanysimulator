# Test Strategy Document

## Overview

This document outlines the testing strategy for the Gacha Game Company Simulator project. Our testing approach follows clean architecture principles, emphasizing isolation of domain logic and comprehensive coverage of business rules.

## Testing Layers

### 1. Unit Tests (Domain Layer)
**Location**: `src/test/domain/`

The domain layer contains pure business logic and should have the highest test coverage. Tests should be:
- **Deterministic**: Use `SeededRNG` for all randomness
- **Isolated**: No external dependencies
- **Fast**: Execution in milliseconds
- **Focused**: One concept per test

#### Coverage Goal: >90%

**Files covered**:
- `company.test.ts` - Company creation, budget management, employee operations
- `employee.test.ts` - Employee creation, skill calculations, experience
- `game.test.ts` - Game creation, development phases, monetization
- `gacha.test.ts` - Gacha pulls, pity system, rate calculations
- `currency.test.ts` - Currency operations, validation
- `economy.test.ts` - Economic calculations, income/expense tracking
- `reputation.test.ts` - Reputation scoring, backlash calculation
- `shared.test.ts` - Shared utilities, Result/Option types

### 2. Service/Application Tests
**Location**: `src/test/domain/` (application services)

Tests for orchestration logic and state management.

#### Coverage Goal: >80%

**Files covered**:
- `gameDevelopment.test.ts` - Game development workflow
- `eventManager.test.ts` - Event system and triggers
- `playerBehavior.test.ts` - Player simulation and retention
- `marketSimulator.test.ts` - Market dynamics and competition
- `market.test.ts` - Market conditions and trends

### 3. Integration Tests
**Location**: `src/test/integration/`

Tests that verify multiple components working together.

#### Coverage Goal: >70%

**Scenarios covered**:
- Complete game development workflow
- Multi-week simulation cycles
- Event chains and consequences
- Market response to player actions

### 4. Property-Based Tests
**Location**: `src/test/property/`

Statistical tests using `fast-check` for invariant verification.

**Properties tested**:
- Probability convergence (gacha rates match specification)
- State invariants (no negative currencies, valid percentages)
- Idempotency (repeated operations yield consistent results)

## Naming Conventions

### Test File Naming
- Unit tests: `<module>.test.ts`
- Integration tests: `<workflow>.test.ts`
- Property tests: `<module>.property.test.ts`

### Test Case Naming
Use descriptive "should" statements:

```typescript
describe('Company', () => {
  describe('hirEmployee', () => {
    it('should add employee to roster when budget is sufficient', () => {});
    it('should return failure when budget is insufficient', () => {});
    it('should update employee count after successful hire', () => {});
  });
});
```

### Test Organization
```
describe('<ComponentName>', () => {
  describe('<methodName>', () => {
    // Happy path tests first
    it('should succeed when...', () => {});
    
    // Edge cases
    it('should handle edge case...', () => {});
    
    // Error cases last
    it('should fail when...', () => {});
  });
});
```

## Test Utilities

### Builders (Fluent Interface)
Located in `src/test/utils/builders/`

```typescript
// Example usage
const company = new CompanyBuilder()
  .withName('Test Studios')
  .withBudget(100000)
  .withEmployee(new EmployeeBuilder().withRole('developer').build())
  .build();
```

### Fixtures
Located in `src/test/utils/fixtures/`

Pre-configured test data for common scenarios:
- `defaultCompany` - Standard company for most tests
- `largeCompany` - Company with many employees
- `bankruptCompany` - Company with zero budget

### Assertions
Located in `src/test/utils/assertions/`

Custom assertion helpers:
- `assertResultSuccess<T>()` - Unwrap and assert Result.Ok
- `assertResultFailure()` - Assert Result.Err with message
- `assertValidCurrency()` - Validate currency constraints

### Mocks
Located in `src/test/utils/mocks/`

Injectable mock implementations:
- `MockRNG` - Controllable random number generator
- `MockClock` - Time manipulation for tick-based tests

## Coverage Goals Summary

| Layer | Target Coverage | Priority |
|-------|----------------|----------|
| Domain (entities, value objects) | >90% | Critical |
| Application (services, managers) | >80% | High |
| Integration (workflows) | >70% | Medium |
| Presentation (components) | >60% | Low |
| **Overall** | **>70%** | - |

## Best Practices

### 1. Deterministic Testing
Always inject `SeededRNG` for reproducible results:

```typescript
const rng = new SeededRNG(12345);
const result = simulatePull(banner, items, pity, owned, rng);
// Result is always the same for seed 12345
```

### 2. Arrange-Act-Assert Pattern
```typescript
it('should calculate correct revenue', () => {
  // Arrange
  const banner = createBanner({ pullCost: { gems: 300 } });
  const users = 1000;
  
  // Act
  const revenue = calculateBannerRevenue(banner, 10, users, 0.01);
  
  // Assert
  expect(revenue).toBe(30000);
});
```

### 3. Test Edge Cases
- Zero values
- Negative inputs (should be rejected)
- Maximum/overflow values
- Empty collections
- Null/undefined (TypeScript should prevent, but test boundaries)

### 4. Property-Based Testing Guidelines
```typescript
import { fc } from 'fast-check';

it('should always maintain valid currency state', () => {
  fc.assert(
    fc.property(fc.integer({ min: 0, max: 1000000 }), (amount) => {
      const currency = createCurrency({ gems: amount });
      return currency.gems >= 0 && Number.isFinite(currency.gems);
    })
  );
});
```

### 5. Integration Test Isolation
Each integration test should:
- Create its own state
- Not depend on other tests
- Clean up after itself (if needed)

## Continuous Integration

Tests run automatically on:
- Every push to main branch
- Every pull request
- Nightly full coverage report

### Commands
```bash
npm test           # Watch mode for development
npm run test:run   # Single run for CI
npm run test:coverage  # Generate coverage report
```

## Updating This Document

This strategy document should be updated when:
- New testing patterns are adopted
- Coverage goals change
- New test categories are added
- Significant architectural changes occur

---

*Last updated: Document creation*
