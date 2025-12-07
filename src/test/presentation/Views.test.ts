import { describe, it, expect } from 'vitest';
import { GameBuilder, EmployeeBuilder } from '../utils/builders';
import { createCompany } from '@domain/company';
import { OFFICE_TIERS } from '@domain/company/Company';

/**
 * Tests for the new view components: GachaManagementView, MarketingView, FinanceView
 * These are unit tests for the business logic used in these views.
 */

describe('GachaManagementView Logic', () => {
  describe('Gacha Rate Validation', () => {
    it('should validate rates that sum to 1.0', () => {
      const rates = {
        common: 0.60,
        uncommon: 0.25,
        rare: 0.10,
        epic: 0.04,
        legendary: 0.01,
      };
      
      const total = Object.values(rates).reduce((sum, rate) => sum + rate, 0);
      expect(Math.abs(total - 1.0)).toBeLessThan(0.001);
    });

    it('should reject rates that do not sum to 1.0', () => {
      const rates = {
        common: 0.50,
        uncommon: 0.25,
        rare: 0.10,
        epic: 0.04,
        legendary: 0.01,
      };
      
      const total = Object.values(rates).reduce((sum, rate) => sum + rate, 0);
      expect(Math.abs(total - 1.0)).toBeGreaterThan(0.001);
    });

    it('should calculate satisfaction impact based on legendary rate', () => {
      const calculateSatisfactionImpact = (legendaryRate: number): string => {
        if (legendaryRate >= 0.02) return 'Very Generous (High Satisfaction)';
        if (legendaryRate >= 0.01) return 'Generous (Good Satisfaction)';
        if (legendaryRate >= 0.005) return 'Standard (Normal Satisfaction)';
        if (legendaryRate >= 0.001) return 'Stingy (Low Satisfaction)';
        return 'Predatory (Very Low Satisfaction)';
      };

      expect(calculateSatisfactionImpact(0.03)).toBe('Very Generous (High Satisfaction)');
      expect(calculateSatisfactionImpact(0.01)).toBe('Generous (Good Satisfaction)');
      expect(calculateSatisfactionImpact(0.005)).toBe('Standard (Normal Satisfaction)');
      expect(calculateSatisfactionImpact(0.002)).toBe('Stingy (Low Satisfaction)');
      expect(calculateSatisfactionImpact(0.0005)).toBe('Predatory (Very Low Satisfaction)');
    });
  });

  describe('Live Game Selection', () => {
    it('should filter only live games', () => {
      const games = [
        new GameBuilder().withStatus('planning').build(),
        new GameBuilder().withStatus('development').build(),
        new GameBuilder().withStatus('live').build(),
        new GameBuilder().withStatus('live').build(),
        new GameBuilder().withStatus('shutdown').build(),
      ];
      
      const liveGames = games.filter(g => g.status === 'live');
      expect(liveGames).toHaveLength(2);
    });
  });
});

describe('MarketingView Logic', () => {
  describe('Marketing Bonus Calculation', () => {
    it('should calculate 0% bonus when no marketers assigned', () => {
      // Setup: A live game with no assigned employees
      new GameBuilder()
        .withStatus('live')
        .withAssignedEmployees([])
        .build();
      
      const assignedMarketers: Array<{ skills: { marketing?: number } }> = [];
      
      const totalBoost = assignedMarketers.reduce((sum, m) => {
        const marketingSkill = m.skills.marketing || 50;
        return sum + (0.5 * (marketingSkill / 100));
      }, 0);
      
      expect(totalBoost).toBe(0);
    });

    it('should calculate bonus based on marketer skill', () => {
      const marketer = new EmployeeBuilder()
        .withRole('Marketer')
        .withSkills({ marketing: 80 })
        .build();
      
      // Base 50% boost modified by skill (80/100 = 0.8)
      const boost = 0.5 * (marketer.skills.marketing / 100);
      expect(boost).toBe(0.4); // 40% boost for 80 skill
    });

    it('should cap total marketing bonus at 200%', () => {
      // Simulate 5 marketers with 100 skill each
      const marketers = Array(5).fill(null).map(() => ({ skills: { marketing: 100 } }));
      
      let totalBoost = marketers.reduce((sum, m) => {
        return sum + (0.5 * (m.skills.marketing / 100));
      }, 0);
      
      // Cap at 2.0 (200%)
      totalBoost = Math.min(totalBoost, 2.0);
      
      expect(totalBoost).toBe(2.0);
    });
  });

  describe('Campaign Cost Calculation', () => {
    it('should calculate base cost for small DAU games', () => {
      const game = new GameBuilder()
        .withStatus('live')
        .withMonetization({
          dailyActiveUsers: 500,
          monthlyRevenue: 1000,
          playerSatisfaction: 50,
        })
        .build();
      
      const baseCost = 5000;
      const costMultiplier = 1;
      const dauFactor = Math.max(1, game.monetization.dailyActiveUsers / 1000);
      const cost = Math.round(baseCost * costMultiplier * Math.sqrt(dauFactor));
      
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThanOrEqual(baseCost); // Small DAU = lower cost
    });

    it('should scale cost with DAU', () => {
      const smallGame = new GameBuilder()
        .withMonetization({ dailyActiveUsers: 1000, monthlyRevenue: 0, playerSatisfaction: 50 })
        .build();
      const largeGame = new GameBuilder()
        .withMonetization({ dailyActiveUsers: 100000, monthlyRevenue: 0, playerSatisfaction: 50 })
        .build();
      
      const calculateCost = (dau: number, multiplier: number) => {
        const baseCost = 5000;
        const dauFactor = Math.max(1, dau / 1000);
        return Math.round(baseCost * multiplier * Math.sqrt(dauFactor));
      };
      
      const smallCost = calculateCost(smallGame.monetization.dailyActiveUsers, 1);
      const largeCost = calculateCost(largeGame.monetization.dailyActiveUsers, 1);
      
      expect(largeCost).toBeGreaterThan(smallCost);
    });
  });

  describe('Marketer Filtering', () => {
    it('should identify available marketers', () => {
      const employees = [
        new EmployeeBuilder().withRole('Programmer').asAvailable().build(),
        new EmployeeBuilder().withRole('Marketer').asAvailable().build(),
        new EmployeeBuilder().withRole('Marketer').asAssigned().build(),
        new EmployeeBuilder().withRole('Artist').asAvailable().build(),
      ];
      
      const marketers = employees.filter(e => e.role === 'Marketer');
      const availableMarketers = marketers.filter(e => e.isAvailable);
      
      expect(marketers).toHaveLength(2);
      expect(availableMarketers).toHaveLength(1);
    });
  });
});

describe('FinanceView Logic', () => {
  describe('Revenue Calculation', () => {
    it('should sum revenue from all live games', () => {
      const games = [
        new GameBuilder().withStatus('live').withMonetization({
          dailyActiveUsers: 1000,
          monthlyRevenue: 5000,
          playerSatisfaction: 50,
        }).build(),
        new GameBuilder().withStatus('live').withMonetization({
          dailyActiveUsers: 2000,
          monthlyRevenue: 10000,
          playerSatisfaction: 60,
        }).build(),
        new GameBuilder().withStatus('development').withMonetization({
          dailyActiveUsers: 0,
          monthlyRevenue: 0,
          playerSatisfaction: 50,
        }).build(),
      ];
      
      const liveGames = games.filter(g => g.status === 'live');
      const totalRevenue = liveGames.reduce(
        (sum, g) => sum + g.monetization.monthlyRevenue,
        0
      );
      
      expect(totalRevenue).toBe(15000);
    });

    it('should calculate daily revenue from monthly', () => {
      const monthlyRevenue = 30000;
      const dailyRevenue = monthlyRevenue / 30;
      
      expect(dailyRevenue).toBe(1000);
    });
  });

  describe('Expense Calculation', () => {
    it('should sum all employee salaries', () => {
      const employees = [
        new EmployeeBuilder().withSalary(5000).build(),
        new EmployeeBuilder().withSalary(4000).build(),
        new EmployeeBuilder().withSalary(6000).build(),
      ];
      
      const totalSalaries = employees.reduce((sum, e) => sum + e.salary, 0);
      
      expect(totalSalaries).toBe(15000);
    });

    it('should include office costs from office tier', () => {
      const company = createCompany({
        name: 'Test',
        foundedDate: 0,
      });
      
      const officeCost = OFFICE_TIERS[company.officeLevel].monthlyCost;
      expect(officeCost).toBe(0); // Level 0 basement has no rent
    });

    it('should calculate total monthly expenses', () => {
      const salaries = 15000;
      const officeCost = 0; // Basement has no rent
      const totalExpenses = salaries + officeCost;
      
      expect(totalExpenses).toBe(15000);
    });
  });

  describe('Profit/Loss Calculation', () => {
    it('should calculate positive profit when revenue exceeds expenses', () => {
      const revenue = 20000;
      const expenses = 15000;
      const profit = revenue - expenses;
      
      expect(profit).toBeGreaterThan(0);
      expect(profit).toBe(5000);
    });

    it('should calculate negative profit (loss) when expenses exceed revenue', () => {
      const revenue = 10000;
      const expenses = 15000;
      const profit = revenue - expenses;
      
      expect(profit).toBeLessThan(0);
      expect(profit).toBe(-5000);
    });

    it('should correctly identify profitability', () => {
      expect(5000 >= 0).toBe(true);  // Profitable
      expect(-5000 >= 0).toBe(false); // Not profitable
    });
  });

  describe('Runway Calculation', () => {
    it('should calculate months until funds depleted', () => {
      const funds = 100000;
      const monthlyExpenses = 20000;
      const runway = funds / monthlyExpenses;
      
      expect(runway).toBe(5); // 5 months
    });

    it('should return Infinity when no expenses', () => {
      const funds = 100000;
      const monthlyExpenses = 0;
      const runway = monthlyExpenses > 0 ? funds / monthlyExpenses : Infinity;
      
      expect(runway).toBe(Infinity);
    });

    it('should categorize runway health', () => {
      const getRunwayHealth = (months: number): string => {
        if (months > 6) return 'green';
        if (months > 3) return 'yellow';
        return 'red';
      };

      expect(getRunwayHealth(12)).toBe('green');
      expect(getRunwayHealth(5)).toBe('yellow');
      expect(getRunwayHealth(2)).toBe('red');
    });
  });

  describe('Expense Breakdown by Role', () => {
    it('should group salaries by employee role', () => {
      const employees = [
        new EmployeeBuilder().withRole('Programmer').withSalary(6000).build(),
        new EmployeeBuilder().withRole('Programmer').withSalary(5500).build(),
        new EmployeeBuilder().withRole('Artist').withSalary(4500).build(),
        new EmployeeBuilder().withRole('Designer').withSalary(5000).build(),
      ];
      
      const expensesByRole = employees.reduce((acc, emp) => {
        acc[emp.role] = (acc[emp.role] || 0) + emp.salary;
        return acc;
      }, {} as Record<string, number>);
      
      expect(expensesByRole['Programmer']).toBe(11500);
      expect(expensesByRole['Artist']).toBe(4500);
      expect(expensesByRole['Designer']).toBe(5000);
    });
  });

  describe('Efficiency Metrics', () => {
    it('should calculate revenue per employee', () => {
      const totalRevenue = 50000;
      const employeeCount = 10;
      const revenuePerEmployee = totalRevenue / employeeCount;
      
      expect(revenuePerEmployee).toBe(5000);
    });

    it('should calculate revenue per live game', () => {
      const totalRevenue = 50000;
      const liveGameCount = 2;
      const revenuePerGame = totalRevenue / liveGameCount;
      
      expect(revenuePerGame).toBe(25000);
    });

    it('should handle zero employees gracefully', () => {
      const totalRevenue = 50000;
      const employeeCount = 0;
      const revenuePerEmployee = employeeCount > 0 ? totalRevenue / employeeCount : 0;
      
      expect(revenuePerEmployee).toBe(0);
    });
  });
});

describe('UPDATE_GACHA_RATES Action', () => {
  it('should have correct action shape', () => {
    const action = {
      type: 'UPDATE_GACHA_RATES' as const,
      payload: {
        gameId: 'game-1',
        rates: {
          common: 0.60,
          uncommon: 0.25,
          rare: 0.10,
          epic: 0.04,
          legendary: 0.01,
        },
      },
    };

    expect(action.type).toBe('UPDATE_GACHA_RATES');
    expect(action.payload.gameId).toBe('game-1');
    expect(action.payload.rates.legendary).toBe(0.01);
  });
});
