/**
 * Live Game Improvement System
 * 
 * Allows staff to work on live games to continuously improve their quality,
 * add content, and maintain player satisfaction.
 */

import { Game, GameQuality, updateQuality } from './Game';
import { Employee, SkillSet } from '../employee/Employee';
import { GENRE_CONFIGS } from './GenreTiers';

export type ImprovementFocus = 
  | 'graphics_update'
  | 'gameplay_polish'
  | 'story_content'
  | 'sound_update'
  | 'bug_fixes'
  | 'new_features'
  | 'event_content';

export interface ImprovementTask {
  readonly focus: ImprovementFocus;
  readonly name: string;
  readonly description: string;
  readonly qualityBoosts: Partial<GameQuality>;
  readonly satisfactionBoost: number;
  readonly durationDays: number;
  readonly requiredSkills: Partial<SkillSet>;
}

export const IMPROVEMENT_TASKS: Record<ImprovementFocus, ImprovementTask> = {
  graphics_update: {
    focus: 'graphics_update',
    name: 'Graphics Update',
    description: 'Improve visual quality with new art assets and effects.',
    qualityBoosts: { graphics: 5, polish: 2 },
    satisfactionBoost: 8,
    durationDays: 14,
    requiredSkills: { art: 50, programming: 30 },
  },
  
  gameplay_polish: {
    focus: 'gameplay_polish',
    name: 'Gameplay Polish',
    description: 'Refine game mechanics and improve user experience.',
    qualityBoosts: { gameplay: 5, polish: 3 },
    satisfactionBoost: 10,
    durationDays: 10,
    requiredSkills: { game_design: 50, programming: 40 },
  },
  
  story_content: {
    focus: 'story_content',
    name: 'Story Content Update',
    description: 'Add new story chapters and narrative content.',
    qualityBoosts: { story: 8, gameplay: 2 },
    satisfactionBoost: 15,
    durationDays: 21,
    requiredSkills: { writing: 40, game_design: 40, art: 30 },
  },
  
  sound_update: {
    focus: 'sound_update',
    name: 'Audio Enhancement',
    description: 'New music tracks and improved sound effects.',
    qualityBoosts: { sound: 8, polish: 2 },
    satisfactionBoost: 6,
    durationDays: 7,
    requiredSkills: { sound: 50 },
  },
  
  bug_fixes: {
    focus: 'bug_fixes',
    name: 'Bug Fix Patch',
    description: 'Fix issues and improve stability.',
    qualityBoosts: { polish: 5 },
    satisfactionBoost: 5,
    durationDays: 5,
    requiredSkills: { programming: 45 },
  },
  
  new_features: {
    focus: 'new_features',
    name: 'New Features',
    description: 'Add new game features and systems.',
    qualityBoosts: { gameplay: 6, story: 2, polish: 2 },
    satisfactionBoost: 12,
    durationDays: 28,
    requiredSkills: { programming: 55, game_design: 50, art: 40 },
  },
  
  event_content: {
    focus: 'event_content',
    name: 'Limited Event',
    description: 'Create a time-limited event with special rewards.',
    qualityBoosts: { gameplay: 2 },
    satisfactionBoost: 20,
    durationDays: 14,
    requiredSkills: { game_design: 45, art: 40, programming: 35 },
  },
};

/**
 * Track ongoing improvement work on a game
 */
export interface GameImprovementWork {
  readonly gameId: string;
  readonly focus: ImprovementFocus;
  readonly startTick: number;
  readonly endTick: number;
  readonly assignedEmployees: string[];
  readonly progress: number;  // 0-100
}

/**
 * Calculate improvement speed based on assigned team
 */
export function calculateImprovementSpeed(
  task: ImprovementTask,
  assignedEmployees: Employee[]
): number {
  if (assignedEmployees.length === 0) return 0;
  
  // Calculate average skill match
  const requirements = task.requiredSkills;
  let totalSkillMatch = 0;
  let skillCount = 0;
  
  for (const [skill, required] of Object.entries(requirements)) {
    if (required) {
      const skillKey = skill as keyof SkillSet;
      // Get best skill among assigned employees
      const bestSkill = Math.max(...assignedEmployees.map(e => e.skills[skillKey] || 0));
      totalSkillMatch += Math.min(1.5, bestSkill / required);
      skillCount++;
    }
  }
  
  const avgSkillMatch = skillCount > 0 ? totalSkillMatch / skillCount : 1;
  
  // Team size bonus (diminishing returns)
  const teamSizeBonus = 1 + (assignedEmployees.length - 1) * 0.3;
  
  // Base progress is 100% over durationDays
  // Speed modifier affects how fast we complete
  const speedModifier = avgSkillMatch * Math.min(2, teamSizeBonus);
  
  return speedModifier;
}

/**
 * Apply completed improvement to a game
 */
export function applyImprovement(
  game: Game,
  focus: ImprovementFocus,
  teamEffectiveness: number = 1.0
): Game {
  const task = IMPROVEMENT_TASKS[focus];
  
  // Apply quality boosts scaled by team effectiveness
  const qualityUpdates: Record<string, number> = {};
  for (const [key, boost] of Object.entries(task.qualityBoosts)) {
    qualityUpdates[key] = 
      game.quality[key as keyof GameQuality] + Math.round(boost * teamEffectiveness);
  }
  
  let updatedGame = updateQuality(game, qualityUpdates as Partial<GameQuality>);
  
  // Apply satisfaction boost
  const newSatisfaction = Math.min(100, 
    updatedGame.monetization.playerSatisfaction + Math.round(task.satisfactionBoost * teamEffectiveness)
  );
  
  updatedGame = {
    ...updatedGame,
    monetization: {
      ...updatedGame.monetization,
      playerSatisfaction: newSatisfaction,
    },
  };
  
  return updatedGame;
}

/**
 * Calculate how much a game needs improvement based on its genre and current state
 */
export function getImprovementPriority(game: Game): ImprovementFocus[] {
  const priorities: Array<{ focus: ImprovementFocus; score: number }> = [];
  const config = GENRE_CONFIGS[game.genre];
  
  // Low satisfaction = need event content
  if (game.monetization.playerSatisfaction < 50) {
    priorities.push({ focus: 'event_content', score: 100 - game.monetization.playerSatisfaction });
  }
  
  // Check each quality metric
  if (game.quality.graphics < 50) {
    priorities.push({ focus: 'graphics_update', score: 60 - game.quality.graphics });
  }
  if (game.quality.gameplay < 50) {
    priorities.push({ focus: 'gameplay_polish', score: 70 - game.quality.gameplay });
  }
  if (game.quality.story < 40 && config.contentDemand > 0.6) {
    priorities.push({ focus: 'story_content', score: 50 - game.quality.story });
  }
  if (game.quality.sound < 40) {
    priorities.push({ focus: 'sound_update', score: 40 - game.quality.sound });
  }
  if (game.quality.polish < 60) {
    priorities.push({ focus: 'bug_fixes', score: 60 - game.quality.polish });
  }
  
  // Sort by score (highest priority first)
  priorities.sort((a, b) => b.score - a.score);
  
  return priorities.map(p => p.focus);
}

/**
 * Calculate daily satisfaction maintenance from having team on game
 */
export function calculateMaintenanceEffect(
  game: Game,
  assignedEmployees: Employee[]
): number {
  if (assignedEmployees.length === 0) return 0;
  
  const config = GENRE_CONFIGS[game.genre];
  
  // Calculate team's average relevant skill
  const avgSkill = assignedEmployees.reduce((sum, emp) => {
    return sum + (emp.skills.game_design + emp.skills.programming + emp.skills.art) / 3;
  }, 0) / assignedEmployees.length;
  
  // Maintenance effect counters satisfaction decay
  // More demanding genres need better teams
  // With good team, can maintain or even improve
  const maintenanceStrength = (avgSkill / 50) * assignedEmployees.length * 0.5;
  
  // Return how much satisfaction is preserved (positive = gaining)
  // Factor in content demand - high demand games need more work
  return maintenanceStrength - (config.satisfactionDecay * config.contentDemand);
}
