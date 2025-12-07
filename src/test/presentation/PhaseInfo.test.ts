/**
 * Phase Info Tests
 * 
 * Tests for the phase info help system including:
 * - getPhaseInfo and getAllPhaseInfo functions
 * - Team effectiveness calculations
 * - Phase progress calculations
 */

import { describe, it, expect } from 'vitest';
import {
  getPhaseInfo,
  getAllPhaseInfo,
  calculateTeamEffectivenessBreakdown,
  TeamMemberForCalculation,
} from '@presentation/components/games/PhaseInfo';
import { en } from '@infrastructure/i18n/translations/en';

// Use English translations for testing
const t = en;

// Helper to get all phase info as a record for easier testing
function getPhaseInfoRecord() {
  const phases = getAllPhaseInfo(t);
  return Object.fromEntries(phases.map(p => [p.id, p]));
}

// =============================================================================
// Phase Info Function Tests
// =============================================================================

describe('getPhaseInfo', () => {
  it('returns phase info for valid phase id', () => {
    const planning = getPhaseInfo('planning', t);
    expect(planning).not.toBeNull();
    expect(planning!.id).toBe('planning');
    expect(planning!.name).toBeTruthy();
  });

  it('returns null for invalid phase id', () => {
    const invalid = getPhaseInfo('invalid_phase', t);
    expect(invalid).toBeNull();
  });

  it('returns correct numerical data', () => {
    const testing = getPhaseInfo('testing', t);
    expect(testing!.baseProgressPerTick).toBe(1.5);
    expect(testing!.qualityMultiplier).toBe(0.6);
  });
});

describe('getAllPhaseInfo', () => {
  it('contains all development phases', () => {
    const PHASE_INFO = getPhaseInfoRecord();
    expect(PHASE_INFO).toHaveProperty('planning');
    expect(PHASE_INFO).toHaveProperty('development');
    expect(PHASE_INFO).toHaveProperty('testing');
    expect(PHASE_INFO).toHaveProperty('soft_launch');
    expect(PHASE_INFO).toHaveProperty('live');
    expect(PHASE_INFO).toHaveProperty('maintenance');
  });

  it('testing phase has correct base progress', () => {
    const PHASE_INFO = getPhaseInfoRecord();
    const testing = PHASE_INFO.testing;
    expect(testing.baseProgressPerTick).toBe(1.5);
    expect(testing.qualityMultiplier).toBe(0.6);
  });

  it('all phases have required fields', () => {
    const PHASE_INFO = getPhaseInfoRecord();
    for (const [id, phase] of Object.entries(PHASE_INFO)) {
      expect(phase.id).toBe(id);
      expect(phase.name).toBeTruthy();
      expect(phase.description).toBeTruthy();
      expect(phase.requirements.length).toBeGreaterThan(0);
      expect(phase.tips.length).toBeGreaterThan(0);
    }
  });

  it('testing phase explains requirements clearly', () => {
    const testing = getPhaseInfo('testing', t);
    expect(testing!.requirements.some(r => r.toLowerCase().includes('100%'))).toBe(true);
    expect(testing!.description.toLowerCase()).toContain('qa');
  });

  it('development phase is the main production phase', () => {
    const dev = getPhaseInfo('development', t);
    expect(dev!.qualityMultiplier).toBe(1.0); // Highest quality gain
    expect(dev!.baseProgressPerTick).toBe(1.0); // Base speed
  });

  it('planning is the fastest phase', () => {
    const planning = getPhaseInfo('planning', t);
    const testing = getPhaseInfo('testing', t);
    expect(planning!.baseProgressPerTick).toBe(2.0);
    expect(planning!.baseProgressPerTick).toBeGreaterThan(testing!.baseProgressPerTick);
  });

  it('live and maintenance phases have zero progress rate', () => {
    const live = getPhaseInfo('live', t);
    const maintenance = getPhaseInfo('maintenance', t);
    expect(live!.baseProgressPerTick).toBe(0);
    expect(maintenance!.baseProgressPerTick).toBe(0);
  });
});

// =============================================================================
// Team Effectiveness Calculation Tests
// =============================================================================

describe('calculateTeamEffectivenessBreakdown', () => {
  it('returns zero effectiveness for empty team', () => {
    const breakdown = calculateTeamEffectivenessBreakdown([]);
    
    expect(breakdown.skillScore).toBe(0);
    expect(breakdown.sizeScore).toBe(0);
    expect(breakdown.moraleScore).toBe(0);
    expect(breakdown.coverageScore).toBe(0);
    expect(breakdown.total).toBe(0);
  });

  it('calculates skill score correctly for max skills', () => {
    const team: TeamMemberForCalculation[] = [
      { skills: { programming: 100, art: 100 }, morale: 100, role: 'Programmer' },
    ];
    
    const breakdown = calculateTeamEffectivenessBreakdown(team);
    
    // Max skill (100) = 1.0 normalized, × 0.4 weight = 0.4
    expect(breakdown.skillScore).toBeCloseTo(0.4, 2);
  });

  it('calculates skill score correctly for mid-level skills', () => {
    const team: TeamMemberForCalculation[] = [
      { skills: { programming: 50, art: 50 }, morale: 100, role: 'Programmer' },
    ];
    
    const breakdown = calculateTeamEffectivenessBreakdown(team);
    
    // Avg skill 50 = 0.5 normalized, × 0.4 weight = 0.2
    expect(breakdown.skillScore).toBeCloseTo(0.2, 2);
  });

  it('calculates size score correctly for small team', () => {
    // 1 employee = 1/5 = 0.2, × 0.2 weight = 0.04
    const smallTeam: TeamMemberForCalculation[] = [
      { skills: { programming: 50 }, morale: 50, role: 'Programmer' },
    ];
    expect(calculateTeamEffectivenessBreakdown(smallTeam).sizeScore).toBeCloseTo(0.04, 2);
  });

  it('calculates size score correctly for optimal team', () => {
    // 5 employees = 5/5 = 1.0, × 0.2 weight = 0.2
    const optimalTeam: TeamMemberForCalculation[] = Array(5).fill(null).map((_, i) => ({
      skills: { programming: 50 },
      morale: 50,
      role: `Role${i}`,
    }));
    expect(calculateTeamEffectivenessBreakdown(optimalTeam).sizeScore).toBe(0.2);
  });

  it('caps size score at 0.2 for large teams', () => {
    // 10 employees still caps at 0.2
    const largeTeam: TeamMemberForCalculation[] = Array(10).fill(null).map((_, i) => ({
      skills: { programming: 50 },
      morale: 50,
      role: `Role${i}`,
    }));
    expect(calculateTeamEffectivenessBreakdown(largeTeam).sizeScore).toBe(0.2);
  });

  it('calculates morale score correctly for high morale', () => {
    const highMoraleTeam: TeamMemberForCalculation[] = [
      { skills: { programming: 50 }, morale: 100, role: 'Programmer' },
    ];
    // 100 morale = 1.0, × 0.2 weight = 0.2
    expect(calculateTeamEffectivenessBreakdown(highMoraleTeam).moraleScore).toBe(0.2);
  });

  it('calculates morale score correctly for low morale', () => {
    const lowMoraleTeam: TeamMemberForCalculation[] = [
      { skills: { programming: 50 }, morale: 50, role: 'Programmer' },
    ];
    // 50 morale = 0.5, × 0.2 weight = 0.1
    expect(calculateTeamEffectivenessBreakdown(lowMoraleTeam).moraleScore).toBe(0.1);
  });

  it('calculates role coverage score for single role', () => {
    // 1 unique role = 1/5 = 0.2, × 0.2 weight = 0.04
    const singleRoleTeam: TeamMemberForCalculation[] = [
      { skills: { programming: 50 }, morale: 50, role: 'Programmer' },
      { skills: { programming: 50 }, morale: 50, role: 'Programmer' },
    ];
    expect(calculateTeamEffectivenessBreakdown(singleRoleTeam).coverageScore).toBeCloseTo(0.04, 2);
  });

  it('calculates role coverage score for diverse team', () => {
    // 5 unique roles = 5/5 = 1.0, × 0.2 weight = 0.2
    const diverseTeam: TeamMemberForCalculation[] = [
      { skills: { programming: 50 }, morale: 50, role: 'Programmer' },
      { skills: { art: 50 }, morale: 50, role: 'Artist' },
      { skills: { design: 50 }, morale: 50, role: 'Designer' },
      { skills: { marketing: 50 }, morale: 50, role: 'Marketer' },
      { skills: { management: 50 }, morale: 50, role: 'Producer' },
    ];
    expect(calculateTeamEffectivenessBreakdown(diverseTeam).coverageScore).toBe(0.2);
  });

  it('calculates total effectiveness correctly for perfect team', () => {
    const team: TeamMemberForCalculation[] = [
      { skills: { programming: 100 }, morale: 100, role: 'Programmer' },
      { skills: { art: 100 }, morale: 100, role: 'Artist' },
      { skills: { design: 100 }, morale: 100, role: 'Designer' },
      { skills: { marketing: 100 }, morale: 100, role: 'Marketer' },
      { skills: { management: 100 }, morale: 100, role: 'Producer' },
    ];
    
    const breakdown = calculateTeamEffectivenessBreakdown(team);
    
    // Perfect team should have 1.0 effectiveness
    expect(breakdown.total).toBeCloseTo(1.0, 1);
    expect(breakdown.skillScore).toBeCloseTo(0.4, 2);
    expect(breakdown.sizeScore).toBe(0.2);
    expect(breakdown.moraleScore).toBe(0.2);
    expect(breakdown.coverageScore).toBe(0.2);
  });

  it('handles mixed skill employees', () => {
    const team: TeamMemberForCalculation[] = [
      { skills: { programming: 80, art: 20 }, morale: 75, role: 'Programmer' },
      { skills: { art: 70, design: 30 }, morale: 80, role: 'Artist' },
    ];
    
    const breakdown = calculateTeamEffectivenessBreakdown(team);
    
    // Average skill = ((80+20)/2 + (70+30)/2) / 2 = (50 + 50) / 2 = 50
    // 50/100 = 0.5, × 0.4 = 0.2
    expect(breakdown.skillScore).toBeCloseTo(0.2, 2);
    
    // 2 employees / 5 = 0.4, × 0.2 = 0.08
    expect(breakdown.sizeScore).toBeCloseTo(0.08, 2);
    
    // Average morale = (75 + 80) / 2 = 77.5, / 100 = 0.775, × 0.2 = 0.155
    expect(breakdown.moraleScore).toBeCloseTo(0.155, 2);
    
    // 2 unique roles / 5 = 0.4, × 0.2 = 0.08
    expect(breakdown.coverageScore).toBeCloseTo(0.08, 2);
    
    // Total ≈ 0.2 + 0.08 + 0.155 + 0.08 = 0.515
    expect(breakdown.total).toBeCloseTo(0.515, 2);
  });

  it('handles employees with empty skills object', () => {
    const team: TeamMemberForCalculation[] = [
      { skills: {}, morale: 50, role: 'Intern' },
    ];
    
    const breakdown = calculateTeamEffectivenessBreakdown(team);
    
    // Empty skills = 0 average
    expect(breakdown.skillScore).toBe(0);
    expect(breakdown.total).toBeGreaterThan(0); // Still has size, morale, coverage
  });

  it('averages morale across team', () => {
    const team: TeamMemberForCalculation[] = [
      { skills: { programming: 50 }, morale: 100, role: 'A' },
      { skills: { programming: 50 }, morale: 0, role: 'B' },
    ];
    
    const breakdown = calculateTeamEffectivenessBreakdown(team);
    
    // Average morale = (100 + 0) / 2 = 50, / 100 = 0.5, × 0.2 = 0.1
    expect(breakdown.moraleScore).toBe(0.1);
  });
});

// =============================================================================
// Phase Progress Calculations Tests
// =============================================================================

describe('Phase Progress Calculations', () => {
  it('calculates days to complete testing phase with full effectiveness', () => {
    const testingPhase = getPhaseInfo('testing', t)!;
    const baseProgress = testingPhase.baseProgressPerTick;
    
    // With 100% effectiveness
    const fullEffectiveness = 1.0;
    const progressPerDay = baseProgress * fullEffectiveness;
    const daysToComplete = 100 / progressPerDay;
    
    expect(progressPerDay).toBe(1.5);
    expect(daysToComplete).toBeCloseTo(66.67, 1);
  });

  it('calculates days with low effectiveness team', () => {
    const testingPhase = getPhaseInfo('testing', t)!;
    const baseProgress = testingPhase.baseProgressPerTick;
    
    // With 50% effectiveness
    const lowEffectiveness = 0.5;
    const progressPerDay = baseProgress * lowEffectiveness;
    const daysToComplete = 100 / progressPerDay;
    
    expect(progressPerDay).toBe(0.75);
    expect(daysToComplete).toBeCloseTo(133.33, 1);
  });

  it('development phase is slower than testing', () => {
    const development = getPhaseInfo('development', t)!;
    const testing = getPhaseInfo('testing', t)!;
    expect(development.baseProgressPerTick).toBeLessThan(testing.baseProgressPerTick);
  });

  it('calculates correct days for each phase at full effectiveness', () => {
    const phases = ['planning', 'development', 'testing', 'soft_launch'] as const;
    const expectedDays: Record<string, number> = {
      planning: 50,      // 100 / 2.0
      development: 100,  // 100 / 1.0
      testing: 67,       // 100 / 1.5 ≈ 66.67
      soft_launch: 84,   // 100 / 1.2 ≈ 83.33
    };
    
    for (const phase of phases) {
      const phaseInfo = getPhaseInfo(phase, t)!;
      const baseProgress = phaseInfo.baseProgressPerTick;
      const daysToComplete = Math.ceil(100 / baseProgress);
      expect(daysToComplete).toBeCloseTo(expectedDays[phase], 0);
    }
  });

  it('quality multipliers are ordered correctly', () => {
    const development = getPhaseInfo('development', t)!;
    const testing = getPhaseInfo('testing', t)!;
    const planning = getPhaseInfo('planning', t)!;
    
    // Development should have highest quality multiplier
    expect(development.qualityMultiplier).toBe(1.0);
    
    // Testing should have moderate quality multiplier
    expect(testing.qualityMultiplier).toBe(0.6);
    expect(testing.qualityMultiplier).toBeLessThan(development.qualityMultiplier);
    
    // Planning should have low quality multiplier
    expect(planning.qualityMultiplier).toBe(0.3);
  });
});

// =============================================================================
// Integration Scenario Tests
// =============================================================================

describe('Team Effectiveness Scenarios', () => {
  it('solo developer has limited effectiveness', () => {
    const soloDev: TeamMemberForCalculation[] = [
      { skills: { programming: 80 }, morale: 70, role: 'Programmer' },
    ];
    
    const breakdown = calculateTeamEffectivenessBreakdown(soloDev);
    
    // Limited by team size and role coverage
    expect(breakdown.total).toBeLessThan(0.6); // Solo dev can still be somewhat effective
    expect(breakdown.sizeScore).toBeCloseTo(0.04, 2); // Only 1/5 team size
    expect(breakdown.coverageScore).toBeCloseTo(0.04, 2); // Only 1/5 roles
  });

  it('balanced team of 5 achieves high effectiveness', () => {
    const balancedTeam: TeamMemberForCalculation[] = [
      { skills: { programming: 70 }, morale: 80, role: 'Programmer' },
      { skills: { art: 75 }, morale: 85, role: 'Artist' },
      { skills: { design: 65 }, morale: 75, role: 'Designer' },
      { skills: { sound: 60 }, morale: 70, role: 'Sound Designer' },
      { skills: { writing: 70 }, morale: 80, role: 'Writer' },
    ];
    
    const breakdown = calculateTeamEffectivenessBreakdown(balancedTeam);
    
    // Good team should be above 0.7 effectiveness
    expect(breakdown.total).toBeGreaterThan(0.7);
    expect(breakdown.sizeScore).toBe(0.2); // Full size bonus
    expect(breakdown.coverageScore).toBe(0.2); // Full coverage bonus
  });

  it('low morale team is less effective', () => {
    const lowMoraleTeam: TeamMemberForCalculation[] = Array(5).fill(null).map((_, i) => ({
      skills: { programming: 80 },
      morale: 20, // Low morale
      role: `Role${i}`,
    }));
    
    const highMoraleTeam: TeamMemberForCalculation[] = Array(5).fill(null).map((_, i) => ({
      skills: { programming: 80 },
      morale: 90, // High morale
      role: `Role${i}`,
    }));
    
    const lowBreakdown = calculateTeamEffectivenessBreakdown(lowMoraleTeam);
    const highBreakdown = calculateTeamEffectivenessBreakdown(highMoraleTeam);
    
    expect(highBreakdown.total).toBeGreaterThan(lowBreakdown.total);
    expect(highBreakdown.moraleScore).toBeGreaterThan(lowBreakdown.moraleScore);
  });

  it('calculates realistic project timeline', () => {
    // Simulate a typical indie team
    const indieTeam: TeamMemberForCalculation[] = [
      { skills: { programming: 60, art: 30 }, morale: 75, role: 'Programmer' },
      { skills: { art: 65, design: 40 }, morale: 80, role: 'Artist' },
      { skills: { design: 70 }, morale: 70, role: 'Designer' },
    ];
    
    const breakdown = calculateTeamEffectivenessBreakdown(indieTeam);
    
    // Calculate total development time across all phases
    const phases = ['planning', 'development', 'testing', 'soft_launch'] as const;
    let totalDays = 0;
    
    for (const phase of phases) {
      const phaseInfo = getPhaseInfo(phase, t)!;
      const baseProgress = phaseInfo.baseProgressPerTick;
      const actualProgress = baseProgress * breakdown.total;
      const daysForPhase = 100 / actualProgress;
      totalDays += daysForPhase;
    }
    
    // Indie team should take several hundred days total
    expect(totalDays).toBeGreaterThan(200);
    expect(totalDays).toBeLessThan(1000); // But not unreasonably long
  });
});
