import { describe, it, expect } from 'vitest';
import {
  createCompany,
  updateCompanyFunds,
  updateCompanyReputation,
  canAfford,
  hireEmployee,
  fireEmployee,
  upgradeOffice,
  addResearchPoints,
  spendResearchPoints,
  getMaxEmployees,
  OFFICE_TIERS,
} from '../../domain/company';
import { createEmployee } from '../../domain/employee';

describe('Company', () => {
  describe('createCompany', () => {
    it('should create a company with default values', () => {
      const company = createCompany({
        name: 'Gacha Studios',
        foundedDate: 0,
      });

      expect(company.name).toBe('Gacha Studios');
      expect(company.funds).toBe(200000);  // Increased for better balance
      expect(company.reputation).toBe(50);
      expect(company.headquarters).toBe('Tokyo');
      expect(company.id).toBeDefined();
    });

    it('should create a company with custom values', () => {
      const company = createCompany({
        name: 'Custom Studios',
        startingFunds: 500000,
        headquarters: 'Seoul',
        foundedDate: 100,
      });

      expect(company.name).toBe('Custom Studios');
      expect(company.funds).toBe(500000);
      expect(company.headquarters).toBe('Seoul');
      expect(company.foundedDate).toBe(100);
    });
  });

  describe('updateCompanyFunds', () => {
    it('should add funds', () => {
      const company = createCompany({ name: 'Test', foundedDate: 0 });
      const updated = updateCompanyFunds(company, 50000);

      expect(updated.funds).toBe(250000);
    });

    it('should subtract funds', () => {
      const company = createCompany({ name: 'Test', foundedDate: 0 });
      const updated = updateCompanyFunds(company, -30000);

      expect(updated.funds).toBe(170000);
    });

    it('should not go below zero', () => {
      const company = createCompany({ name: 'Test', foundedDate: 0, startingFunds: 1000 });
      const updated = updateCompanyFunds(company, -5000);

      expect(updated.funds).toBe(0);
    });
  });

  describe('updateCompanyReputation', () => {
    it('should increase reputation', () => {
      const company = createCompany({ name: 'Test', foundedDate: 0 });
      const updated = updateCompanyReputation(company, 10);

      expect(updated.reputation).toBe(60);
    });

    it('should decrease reputation', () => {
      const company = createCompany({ name: 'Test', foundedDate: 0 });
      const updated = updateCompanyReputation(company, -20);

      expect(updated.reputation).toBe(30);
    });

    it('should clamp reputation to 0-100', () => {
      const company = createCompany({ name: 'Test', foundedDate: 0 });
      
      const tooHigh = updateCompanyReputation(company, 100);
      expect(tooHigh.reputation).toBe(100);
      
      const tooLow = updateCompanyReputation(company, -100);
      expect(tooLow.reputation).toBe(0);
    });
  });

  describe('canAfford', () => {
    it('should return true when company can afford', () => {
      const company = createCompany({ name: 'Test', foundedDate: 0 });
      expect(canAfford(company, 50000)).toBe(true);
    });

    it('should return false when company cannot afford', () => {
      const company = createCompany({ name: 'Test', foundedDate: 0 });
      expect(canAfford(company, 300000)).toBe(false);
    });

    it('should return true for exact amount', () => {
      const company = createCompany({ name: 'Test', foundedDate: 0 });
      expect(canAfford(company, 200000)).toBe(true);
    });
  });

  describe('office levels', () => {
    it('should start at level 0 (basement)', () => {
      const company = createCompany({ name: 'Test', foundedDate: 0 });
      expect(company.officeLevel).toBe(0);
      expect(getMaxEmployees(company)).toBe(0); // Basement has no employee capacity
    });

    it('should upgrade office when funds available', () => {
      const company = createCompany({ name: 'Test', foundedDate: 0, startingFunds: 100000 });
      const result = upgradeOffice(company);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.officeLevel).toBe(1); // Upgraded from basement to garage
        expect(result.value.funds).toBe(100000 - OFFICE_TIERS[1].upgradeCost);
      }
    });;

    it('should fail to upgrade without funds', () => {
      const company = createCompany({ name: 'Test', foundedDate: 0, startingFunds: 1000 });
      const result = upgradeOffice(company);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INSUFFICIENT_FUNDS');
      }
    });

    it('should fail to upgrade past max level', () => {
      let company = createCompany({ name: 'Test', foundedDate: 0, startingFunds: 10000000 });
      
      // Upgrade to max (from level 0 to level 5 = 5 upgrades)
      for (let i = 0; i < 5; i++) {
        const result = upgradeOffice(company);
        if (result.success) company = result.value;
      }
      
      expect(company.officeLevel).toBe(5);
      const result = upgradeOffice(company);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('MAX_OFFICE_LEVEL');
      }
    });
  });

  describe('employee management', () => {
    it('should hire an employee', () => {
      // First upgrade from basement to garage so we can hire
      let company = createCompany({ name: 'Test', foundedDate: 0 });
      const upgradeResult = upgradeOffice(company);
      if (upgradeResult.success) company = upgradeResult.value;
      
      const employee = createEmployee({
        name: 'John',
        role: 'Programmer',
        skills: { programming: 80 },
        salary: 5000,
        hiredDate: 0,
      });
      
      const result = hireEmployee(company, employee, 1000);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.employeeIds).toContain(employee.id);
      }
    });

    it('should fail to hire when at max capacity', () => {
      // First upgrade from basement to garage (5 employee max)
      let company = createCompany({ name: 'Test', foundedDate: 0 });
      const upgradeResult = upgradeOffice(company);
      if (upgradeResult.success) company = upgradeResult.value;
      
      // Hire 5 employees (max for level 1 garage)
      for (let i = 0; i < 5; i++) {
        const emp = createEmployee({
          name: `Employee ${i}`,
          role: 'Programmer',
          skills: { programming: 50 },
          salary: 3000,
          hiredDate: 0,
        });
        const result = hireEmployee(company, emp, 0);
        if (result.success) company = result.value;
      }
      
      const newEmp = createEmployee({
        name: 'New Employee',
        role: 'Artist',
        skills: { art: 50 },
        salary: 3000,
        hiredDate: 0,
      });
      
      const result = hireEmployee(company, newEmp, 0);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('MAX_EMPLOYEES_REACHED');
      }
    });

    it('should fire an employee', () => {
      // First upgrade from basement to garage so we can hire
      let company = createCompany({ name: 'Test', foundedDate: 0 });
      const upgradeResult = upgradeOffice(company);
      if (upgradeResult.success) company = upgradeResult.value;
      
      const employee = createEmployee({
        name: 'John',
        role: 'Programmer',
        skills: { programming: 80 },
        salary: 5000,
        hiredDate: 0,
      });
      
      const hireResult = hireEmployee(company, employee, 0);
      expect(hireResult.success).toBe(true);
      if (!hireResult.success) return;
      
      const fireResult = fireEmployee(hireResult.value, employee.id, 1000);
      expect(fireResult.success).toBe(true);
      if (fireResult.success) {
        expect(fireResult.value.employeeIds).not.toContain(employee.id);
      }
    });
  });

  describe('research points', () => {
    it('should add research points', () => {
      const company = createCompany({ name: 'Test', foundedDate: 0 });
      const updated = addResearchPoints(company, 100);
      expect(updated.researchPoints).toBe(100);
    });

    it('should spend research points when available', () => {
      let company = createCompany({ name: 'Test', foundedDate: 0 });
      company = addResearchPoints(company, 100);
      
      const result = spendResearchPoints(company, 50);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.researchPoints).toBe(50);
      }
    });

    it('should fail to spend more than available', () => {
      const company = createCompany({ name: 'Test', foundedDate: 0 });
      const result = spendResearchPoints(company, 100);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_OPERATION');
      }
    });
  });
});
