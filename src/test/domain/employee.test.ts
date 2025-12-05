import { describe, it, expect } from 'vitest';
import {
  createEmployee,
  getPrimarySkill,
  calculateEffectiveness,
  updateMorale,
  setAvailability,
  generateRandomEmployee,
  startTraining,
  completeTraining,
  isInTraining,
  calculateTeamSynergy,
  TRAINING_CONFIGS,
} from '../../domain/employee';
import { SeededRNG } from '../../domain/shared';

describe('Employee', () => {
  describe('createEmployee', () => {
    it('should create an employee with provided skills', () => {
      const employee = createEmployee({
        name: 'Test Developer',
        role: 'Programmer',
        skills: { programming: 80 },
        salary: 5000,
        hiredDate: 0,
      });

      expect(employee.name).toBe('Test Developer');
      expect(employee.role).toBe('Programmer');
      expect(employee.skills.programming).toBe(80);
      expect(employee.salary).toBe(5000);
      expect(employee.morale).toBe(75);
      expect(employee.isAvailable).toBe(true);
      expect(employee.trainingEndDate).toBeNull();
    });

    it('should default unspecified skills to 0', () => {
      const employee = createEmployee({
        name: 'Artist',
        role: 'Artist',
        skills: { art: 90 },
        salary: 4000,
        hiredDate: 0,
      });

      expect(employee.skills.art).toBe(90);
      expect(employee.skills.programming).toBe(0);
      expect(employee.skills.sound).toBe(0);
    });
  });

  describe('getPrimarySkill', () => {
    it('should return the highest skill', () => {
      const employee = createEmployee({
        name: 'Multi-skill',
        role: 'Artist',
        skills: {
          programming: 50,
          art: 80,
          game_design: 30,
        },
        salary: 5000,
        hiredDate: 0,
      });

      expect(getPrimarySkill(employee)).toBe('art');
    });
  });

  describe('calculateEffectiveness', () => {
    it('should calculate effectiveness based on skill and morale', () => {
      const employee = createEmployee({
        name: 'Developer',
        role: 'Programmer',
        skills: { programming: 80 },
        salary: 5000,
        hiredDate: 0,
      });

      // Morale is 75 by default, multiplier = 0.5 + 75/200 = 0.875
      const effectiveness = calculateEffectiveness(employee, 'programming');
      expect(effectiveness).toBeCloseTo(80 * 0.875, 2);
    });

    it('should return low effectiveness for low morale', () => {
      let employee = createEmployee({
        name: 'Developer',
        role: 'Programmer',
        skills: { programming: 100 },
        salary: 5000,
        hiredDate: 0,
      });
      
      employee = updateMorale(employee, -75); // Morale = 0
      const effectiveness = calculateEffectiveness(employee, 'programming');
      
      expect(effectiveness).toBeCloseTo(100 * 0.5, 2);
    });
  });

  describe('updateMorale', () => {
    it('should increase morale', () => {
      const employee = createEmployee({
        name: 'Test',
        role: 'Programmer',
        skills: {},
        salary: 3000,
        hiredDate: 0,
      });
      
      const updated = updateMorale(employee, 10);
      expect(updated.morale).toBe(85);
    });

    it('should clamp morale to 0-100', () => {
      const employee = createEmployee({
        name: 'Test',
        role: 'Programmer',
        skills: {},
        salary: 3000,
        hiredDate: 0,
      });
      
      const high = updateMorale(employee, 50);
      expect(high.morale).toBe(100);
      
      const low = updateMorale(employee, -100);
      expect(low.morale).toBe(0);
    });
  });

  describe('setAvailability', () => {
    it('should update availability status', () => {
      const employee = createEmployee({
        name: 'Test',
        role: 'Programmer',
        skills: {},
        salary: 3000,
        hiredDate: 0,
      });
      
      expect(employee.isAvailable).toBe(true);
      
      const assigned = setAvailability(employee, false);
      expect(assigned.isAvailable).toBe(false);
      
      const available = setAvailability(assigned, true);
      expect(available.isAvailable).toBe(true);
    });
  });

  describe('generateRandomEmployee', () => {
    it('should generate deterministic employee with seeded RNG', () => {
      const rng = new SeededRNG(12345);
      const emp1 = generateRandomEmployee(0, rng);
      
      const rng2 = new SeededRNG(12345);
      const emp2 = generateRandomEmployee(0, rng2);
      
      expect(emp1.name).toBe(emp2.name);
      expect(emp1.role).toBe(emp2.role);
      expect(emp1.salary).toBe(emp2.salary);
    });

    it('should generate employees with valid roles', () => {
      const rng = new SeededRNG(42);
      for (let i = 0; i < 10; i++) {
        const emp = generateRandomEmployee(i, rng);
        expect(['Programmer', 'Artist', 'Designer', 'Marketer', 'Producer']).toContain(emp.role);
      }
    });
  });

  describe('training', () => {
    it('should start training and mark employee unavailable', () => {
      const employee = createEmployee({
        name: 'Trainee',
        role: 'Programmer',
        skills: { programming: 50 },
        salary: 4000,
        hiredDate: 0,
      });
      
      const training = startTraining(employee, 'technical_workshop', 100);
      
      expect(training.isAvailable).toBe(false);
      expect(isInTraining(training)).toBe(true);
      expect(training.trainingEndDate).toBe(100 + TRAINING_CONFIGS.technical_workshop.durationDays * 24);
    });

    it('should complete training and improve skills', () => {
      const employee = createEmployee({
        name: 'Trainee',
        role: 'Programmer',
        skills: { programming: 50 },
        salary: 4000,
        hiredDate: 0,
      });
      
      const trained = completeTraining(employee, 'technical_workshop');
      
      expect(trained.isAvailable).toBe(true);
      expect(isInTraining(trained)).toBe(false);
      expect(trained.skills.programming).toBe(55); // +5 from workshop
      expect(trained.morale).toBe(80); // +5 from workshop
    });
  });

  describe('team synergy', () => {
    it('should return 0 for single employee', () => {
      const employee = createEmployee({
        name: 'Solo',
        role: 'Programmer',
        skills: { programming: 80 },
        salary: 5000,
        hiredDate: 0,
      });
      
      expect(calculateTeamSynergy([employee])).toBe(0);
    });

    it('should give bonus for balanced team', () => {
      const programmer = createEmployee({ name: 'P', role: 'Programmer', skills: {}, salary: 5000, hiredDate: 0 });
      const artist = createEmployee({ name: 'A', role: 'Artist', skills: {}, salary: 5000, hiredDate: 0 });
      const designer = createEmployee({ name: 'D', role: 'Designer', skills: {}, salary: 5000, hiredDate: 0 });
      
      const synergy = calculateTeamSynergy([programmer, artist, designer]);
      
      expect(synergy).toBeGreaterThan(0);
      expect(synergy).toBe(0.15 + 0.09); // Core team bonus + 3 roles * 0.03
    });

    it('should give producer bonus for larger teams', () => {
      const createEmp = (role: 'Programmer' | 'Artist' | 'Designer' | 'Marketer' | 'Producer', idx: number) =>
        createEmployee({ name: `E${idx}`, role, skills: {}, salary: 5000, hiredDate: 0 });
      
      const team = [
        createEmp('Programmer', 1),
        createEmp('Artist', 2),
        createEmp('Designer', 3),
        createEmp('Marketer', 4),
        createEmp('Producer', 5),
      ];
      
      const synergy = calculateTeamSynergy(team);
      
      // Core (0.15) + 5 roles (0.15) + producer bonus (0.10) = 0.40
      expect(synergy).toBe(0.4);
    });
  });
});
