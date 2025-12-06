/**
 * Game Development Manager
 * Handles the state machine and business logic for game development phases
 */

import { Game, GameStatus, GameQuality, updateProgress, updateGameStatus, updateQuality } from './Game';
import { Employee, calculateEffectiveness, SkillType, calculateTeamSynergy } from '../employee';
import { Result, ok, err, IRNGProvider, defaultRNG } from '../shared';
import { getLocationBonuses } from '../company/Location';

/**
 * Development phase configuration
 */
export interface PhaseConfig {
  readonly phase: GameStatus;
  readonly requiredProgress: number;  // Progress needed to complete phase
  readonly nextPhase: GameStatus | null;
  readonly primarySkills: readonly SkillType[];
  readonly qualityImpact: readonly (keyof GameQuality)[];
}

export const DEVELOPMENT_PHASES: Record<GameStatus, PhaseConfig> = {
  planning: {
    phase: 'planning',
    requiredProgress: 100,
    nextPhase: 'development',
    primarySkills: ['game_design', 'management'],
    qualityImpact: ['gameplay', 'story'],
  },
  development: {
    phase: 'development',
    requiredProgress: 100,
    nextPhase: 'testing',
    primarySkills: ['programming', 'art', 'sound'],
    qualityImpact: ['graphics', 'sound', 'gameplay'],
  },
  testing: {
    phase: 'testing',
    requiredProgress: 100,
    nextPhase: 'soft_launch',
    primarySkills: ['programming', 'game_design'],
    qualityImpact: ['polish'],
  },
  soft_launch: {
    phase: 'soft_launch',
    requiredProgress: 100,
    nextPhase: 'live',
    primarySkills: ['marketing', 'management'],
    qualityImpact: ['polish'],
  },
  live: {
    phase: 'live',
    requiredProgress: 0,  // No progress needed, ongoing
    nextPhase: null,
    primarySkills: ['marketing', 'programming', 'game_design'],
    qualityImpact: [],
  },
  maintenance: {
    phase: 'maintenance',
    requiredProgress: 0,
    nextPhase: null,
    primarySkills: ['programming'],
    qualityImpact: [],
  },
  shutdown: {
    phase: 'shutdown',
    requiredProgress: 0,
    nextPhase: null,
    primarySkills: [],
    qualityImpact: [],
  },
};

/**
 * Error types for development operations
 */
export type DevelopmentError =
  | { type: 'INVALID_TRANSITION'; from: GameStatus; to: GameStatus }
  | { type: 'ALREADY_COMPLETED'; phase: GameStatus }
  | { type: 'NO_EMPLOYEES_ASSIGNED' }
  | { type: 'GAME_SHUTDOWN' };

/**
 * Development tick result
 */
export interface DevelopmentTickResult {
  readonly game: Game;
  readonly progressMade: number;
  readonly qualityGained: Partial<GameQuality>;
  readonly phaseCompleted: boolean;
}

/**
 * Validates if a status transition is allowed
 */
export function canTransition(from: GameStatus, to: GameStatus): boolean {
  const phase = DEVELOPMENT_PHASES[from];
  if (phase.nextPhase === to) return true;
  
  // Special transitions
  if (to === 'shutdown') return from !== 'shutdown';
  if (to === 'maintenance' && from === 'live') return true;
  if (to === 'live' && from === 'maintenance') return true;
  
  return false;
}

/**
 * Transitions game to next phase
 */
export function transitionPhase(
  game: Game,
  targetPhase: GameStatus,
  currentTick: number
): Result<Game, DevelopmentError> {
  if (game.status === 'shutdown') {
    return err({ type: 'GAME_SHUTDOWN' });
  }
  
  if (!canTransition(game.status, targetPhase)) {
    return err({ type: 'INVALID_TRANSITION', from: game.status, to: targetPhase });
  }
  
  // Reset progress for new phase and update status
  const updatedGame = updateGameStatus(
    { ...game, developmentProgress: 0 },
    targetPhase,
    currentTick
  );
  
  return ok(updatedGame);
}

/**
 * Calculates development progress for one tick
 */
export function calculateTickProgress(
  game: Game,
  employees: readonly Employee[],
  rng: IRNGProvider = defaultRNG,
  headquarters: string = 'Tokyo'
): number {
  if (employees.length === 0) return 0;
  
  const phase = DEVELOPMENT_PHASES[game.status];
  if (phase.requiredProgress === 0) return 0;  // No progress needed for this phase
  
  // Calculate effectiveness from employees
  let totalEffectiveness = 0;
  for (const emp of employees) {
    for (const skill of phase.primarySkills) {
      totalEffectiveness += calculateEffectiveness(emp, skill);
    }
  }
  
  // Average effectiveness per skill
  const avgEffectiveness = totalEffectiveness / (employees.length * phase.primarySkills.length);
  
  // Apply team synergy
  const synergy = calculateTeamSynergy(employees);
  const synergyMultiplier = 1 + synergy;
  
  // Base progress: 1-2% per tick with good team
  const baseProgress = 0.5 + (avgEffectiveness / 100) * 1.5;
  
  // Add some variance
  const variance = 0.8 + rng.random() * 0.4;  // 0.8 to 1.2
  
  // Apply location development speed bonus
  const locationBonuses = getLocationBonuses(headquarters);
  const locationMultiplier = 1 + locationBonuses.developmentSpeedBonus;
  
  return baseProgress * synergyMultiplier * variance * locationMultiplier;
}

/**
 * Calculates quality improvement for one tick
 */
export function calculateQualityImprovement(
  game: Game,
  employees: readonly Employee[],
  rng: IRNGProvider = defaultRNG,
  headquarters: string = 'Tokyo'
): Partial<Record<keyof GameQuality, number>> {
  const phase = DEVELOPMENT_PHASES[game.status];
  const improvements: Record<string, number> = {};
  
  if (phase.qualityImpact.length === 0) return improvements;
  
  // Get location quality bonuses
  const locationBonuses = getLocationBonuses(headquarters);
  const qualityMultiplier = 1 + locationBonuses.gameQualityBonus + locationBonuses.gamePolishBonus;
  
  for (const qualityAttr of phase.qualityImpact) {
    // Find relevant skill for this quality attribute
    const skill = getSkillForQuality(qualityAttr);
    
    // Calculate team contribution to this quality
    let totalContribution = 0;
    for (const emp of employees) {
      totalContribution += calculateEffectiveness(emp, skill);
    }
    
    const avgContribution = employees.length > 0 
      ? totalContribution / employees.length 
      : 0;
    
    // Diminishing returns: harder to improve as quality increases
    const currentQuality = game.quality[qualityAttr];
    const diminishingFactor = 1 - (currentQuality / 100) * 0.5;
    
    // Quality improvement: 0.1-0.5 per tick, modified by location bonuses
    const improvement = (avgContribution / 100) * 0.4 * diminishingFactor;
    const variance = 0.8 + rng.random() * 0.4;
    
    improvements[qualityAttr] = improvement * variance * qualityMultiplier;
  }
  
  return improvements;
}

/**
 * Maps quality attributes to skills
 */
function getSkillForQuality(quality: keyof GameQuality): SkillType {
  const mapping: Record<keyof GameQuality, SkillType> = {
    graphics: 'art',
    gameplay: 'game_design',
    story: 'writing',
    sound: 'sound',
    polish: 'programming',
  };
  return mapping[quality];
}

/**
 * Processes one development tick
 */
export function processDevelopmentTick(
  game: Game,
  employees: readonly Employee[],
  currentTick: number,
  rng: IRNGProvider = defaultRNG,
  headquarters: string = 'Tokyo'
): Result<DevelopmentTickResult, DevelopmentError> {
  if (game.status === 'shutdown') {
    return err({ type: 'GAME_SHUTDOWN' });
  }
  
  const phase = DEVELOPMENT_PHASES[game.status];
  
  // Calculate progress
  const progressMade = calculateTickProgress(game, employees, rng, headquarters);
  let updatedGame = updateProgress(game, progressMade);
  
  // Calculate quality improvements
  const qualityGained = calculateQualityImprovement(game, employees, rng, headquarters);
  for (const [attr, value] of Object.entries(qualityGained)) {
    if (value !== undefined) {
      updatedGame = updateQuality(updatedGame, { [attr]: game.quality[attr as keyof GameQuality] + value });
    }
  }
  
  // Check for phase completion
  const phaseCompleted = phase.requiredProgress > 0 && 
    updatedGame.developmentProgress >= phase.requiredProgress;
  
  if (phaseCompleted && phase.nextPhase) {
    // Auto-transition to next phase
    const transitionResult = transitionPhase(updatedGame, phase.nextPhase, currentTick);
    if (transitionResult.success) {
      updatedGame = transitionResult.value;
    }
  }
  
  return ok({
    game: updatedGame,
    progressMade,
    qualityGained,
    phaseCompleted,
  });
}

/**
 * Estimates time to complete current phase
 */
export function estimatePhaseCompletion(
  game: Game,
  employees: readonly Employee[],
  ticksPerDay: number = 24,
  headquarters: string = 'Tokyo'
): number | null {
  const phase = DEVELOPMENT_PHASES[game.status];
  if (phase.requiredProgress === 0) return null;
  
  const remainingProgress = phase.requiredProgress - game.developmentProgress;
  if (remainingProgress <= 0) return 0;
  
  // Estimate average progress per tick (use undefined for rng to use default)
  const avgProgress = calculateTickProgress(game, employees, undefined, headquarters);
  if (avgProgress <= 0) return null;
  
  const ticksNeeded = remainingProgress / avgProgress;
  return Math.ceil(ticksNeeded / ticksPerDay);  // Return days
}

/**
 * Calculates budget for a development phase
 */
export interface PhaseBudget {
  readonly salaries: number;
  readonly overhead: number;
  readonly total: number;
  readonly estimatedDays: number;
}

export function calculatePhaseBudget(
  game: Game,
  employees: readonly Employee[],
  ticksPerDay: number = 24
): PhaseBudget {
  const estimatedDays = estimatePhaseCompletion(game, employees, ticksPerDay) ?? 30;
  
  const dailySalaries = employees.reduce((sum, e) => sum + e.salary / 30, 0);
  const salaries = dailySalaries * estimatedDays;
  
  // 20% overhead
  const overhead = salaries * 0.2;
  
  return {
    salaries: Math.round(salaries),
    overhead: Math.round(overhead),
    total: Math.round(salaries + overhead),
    estimatedDays,
  };
}
