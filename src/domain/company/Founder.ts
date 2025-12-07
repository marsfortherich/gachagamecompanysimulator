/**
 * Founder System
 * 
 * The player starts as the sole founder/developer of their company.
 * The founder has trainable skills and works on games like an employee.
 * As the company grows, the player can hire additional staff.
 */

import { Entity, generateId } from '../shared';
import { SkillSet, SkillType, EmployeeRole } from '../employee';

/**
 * Founder specialization determines starting skill distribution
 */
export type FounderSpecialization = 
  | 'programmer'    // Strong programming, decent game design
  | 'artist'        // Strong art, decent writing
  | 'designer'      // Strong game design, decent marketing
  | 'generalist';   // Balanced but lower skills

/**
 * Experience level for the founder
 */
export type FounderExperience = 
  | 'student'       // Just graduated, lowest skills
  | 'junior'        // Few years experience
  | 'experienced'   // Several years in industry
  | 'veteran';      // Industry veteran with high skills

/**
 * Configuration for founder specializations
 */
export interface SpecializationConfig {
  readonly name: string;
  readonly description: string;
  readonly primarySkill: SkillType;
  readonly secondarySkill: SkillType;
  readonly primaryBonus: number;
  readonly secondaryBonus: number;
  readonly equivalentRole: EmployeeRole;  // Acts like this role for synergy
}

export const SPECIALIZATION_CONFIGS: Record<FounderSpecialization, SpecializationConfig> = {
  programmer: {
    name: 'Programmer',
    description: 'Strong coding skills with game design knowledge',
    primarySkill: 'programming',
    secondarySkill: 'game_design',
    primaryBonus: 25,
    secondaryBonus: 10,
    equivalentRole: 'Programmer',
  },
  artist: {
    name: 'Artist',
    description: 'Creative visuals with narrative sensibility',
    primarySkill: 'art',
    secondarySkill: 'writing',
    primaryBonus: 25,
    secondaryBonus: 10,
    equivalentRole: 'Artist',
  },
  designer: {
    name: 'Game Designer',
    description: 'Game mechanics expert with marketing awareness',
    primarySkill: 'game_design',
    secondarySkill: 'marketing',
    primaryBonus: 25,
    secondaryBonus: 10,
    equivalentRole: 'Designer',
  },
  generalist: {
    name: 'Generalist',
    description: 'Jack of all trades, master of none - but very flexible',
    primarySkill: 'game_design',
    secondarySkill: 'programming',
    primaryBonus: 10,
    secondaryBonus: 10,
    equivalentRole: 'Designer',
  },
};

/**
 * Configuration for founder experience levels
 */
export interface ExperienceConfig {
  readonly name: string;
  readonly description: string;
  readonly baseSkillLevel: number;
  readonly startingFunds: number;       // How much money you start with
  readonly learningSpeedMultiplier: number;  // How fast you learn new skills
}

export const EXPERIENCE_CONFIGS: Record<FounderExperience, ExperienceConfig> = {
  student: {
    name: 'Fresh Graduate',
    description: 'Just finished school with big dreams and small savings',
    baseSkillLevel: 15,
    startingFunds: 5000,          // Very low - forces solo start
    learningSpeedMultiplier: 1.5, // Learns fastest
  },
  junior: {
    name: 'Junior Developer',
    description: 'A few years of industry experience under your belt',
    baseSkillLevel: 25,
    startingFunds: 15000,         // Low - can hire 1 entry-level employee eventually
    learningSpeedMultiplier: 1.25,
  },
  experienced: {
    name: 'Experienced Developer',
    description: 'Solid track record in the gaming industry',
    baseSkillLevel: 40,
    startingFunds: 50000,         // Medium - can build small team
    learningSpeedMultiplier: 1.0,
  },
  veteran: {
    name: 'Industry Veteran',
    description: 'Well-known figure with connections and savings',
    baseSkillLevel: 55,
    startingFunds: 150000,        // High - traditional start
    learningSpeedMultiplier: 0.75, // Learns slowest (already knows a lot)
  },
};

/**
 * Training activity the founder can do
 */
export type FounderTrainingType =
  | 'self_study'          // Free but slow
  | 'online_course'       // Cheap and decent
  | 'workshop'            // Moderate cost, good results
  | 'mentorship'          // Expensive, best results
  | 'hands_on_practice';  // Free, requires active game development

export interface FounderTrainingConfig {
  readonly type: FounderTrainingType;
  readonly name: string;
  readonly description: string;
  readonly costPerDay: number;
  readonly skillGainPerDay: number;  // Points gained in target skill
  readonly durationDays: number;
  readonly requiresActiveProject: boolean;  // Must be working on a game
}

export const FOUNDER_TRAINING_CONFIGS: Record<FounderTrainingType, FounderTrainingConfig> = {
  self_study: {
    type: 'self_study',
    name: 'Self Study',
    description: 'Learn from books and free online resources',
    costPerDay: 0,
    skillGainPerDay: 0.1,
    durationDays: 7,
    requiresActiveProject: false,
  },
  online_course: {
    type: 'online_course',
    name: 'Online Course',
    description: 'Take structured online courses',
    costPerDay: 10,
    skillGainPerDay: 0.2,
    durationDays: 14,
    requiresActiveProject: false,
  },
  workshop: {
    type: 'workshop',
    name: 'Professional Workshop',
    description: 'Attend intensive professional workshops',
    costPerDay: 50,
    skillGainPerDay: 0.5,
    durationDays: 5,
    requiresActiveProject: false,
  },
  mentorship: {
    type: 'mentorship',
    name: 'Industry Mentorship',
    description: 'Learn directly from industry veterans',
    costPerDay: 100,
    skillGainPerDay: 0.8,
    durationDays: 30,
    requiresActiveProject: false,
  },
  hands_on_practice: {
    type: 'hands_on_practice',
    name: 'Learning by Doing',
    description: 'Gain experience while working on your game',
    costPerDay: 0,
    skillGainPerDay: 0.15,
    durationDays: 0,  // Continuous while working
    requiresActiveProject: true,
  },
};

/**
 * Represents the player's founder character
 */
export interface Founder extends Entity {
  readonly name: string;
  readonly specialization: FounderSpecialization;
  readonly experience: FounderExperience;
  readonly skills: SkillSet;
  readonly energy: number;              // 0-100, affects work efficiency
  readonly currentTraining: FounderTrainingType | null;
  readonly trainingTargetSkill: SkillType | null;
  readonly trainingStartTick: number | null;
  readonly trainingEndTick: number | null;
  readonly totalDaysWorked: number;     // Track experience
  readonly gamesCompleted: number;      // Track accomplishments
  readonly learningMultiplier: number;  // From experience level
}

/**
 * Parameters for creating a new founder
 */
export interface CreateFounderParams {
  name: string;
  specialization: FounderSpecialization;
  experience: FounderExperience;
}

/**
 * Creates a new founder with skills based on specialization and experience
 */
export function createFounder(params: CreateFounderParams): Founder {
  const specConfig = SPECIALIZATION_CONFIGS[params.specialization];
  const expConfig = EXPERIENCE_CONFIGS[params.experience];
  
  // Generate base skills
  const baseLevel = expConfig.baseSkillLevel;
  const skills: SkillSet = {
    programming: baseLevel,
    art: baseLevel,
    game_design: baseLevel,
    marketing: Math.max(5, baseLevel - 10),  // Marketing is usually lower for solo devs
    management: Math.max(5, baseLevel - 15), // Management comes with experience
    sound: Math.max(5, baseLevel - 5),
    writing: baseLevel,
  };
  
  // Apply specialization bonuses
  skills[specConfig.primarySkill] = Math.min(100, skills[specConfig.primarySkill] + specConfig.primaryBonus);
  skills[specConfig.secondarySkill] = Math.min(100, skills[specConfig.secondarySkill] + specConfig.secondaryBonus);
  
  return {
    id: generateId(),
    name: params.name,
    specialization: params.specialization,
    experience: params.experience,
    skills,
    energy: 100,
    currentTraining: null,
    trainingTargetSkill: null,
    trainingStartTick: null,
    trainingEndTick: null,
    totalDaysWorked: 0,
    gamesCompleted: 0,
    learningMultiplier: expConfig.learningSpeedMultiplier,
  };
}

/**
 * Updates founder skills (for training)
 */
export function updateFounderSkills(
  founder: Founder,
  skillUpdates: Partial<SkillSet>
): Founder {
  const newSkills = { ...founder.skills };
  for (const [skill, value] of Object.entries(skillUpdates)) {
    if (value !== undefined) {
      newSkills[skill as SkillType] = Math.min(100, Math.max(0, 
        (newSkills[skill as SkillType] || 0) + value
      ));
    }
  }
  return { ...founder, skills: newSkills };
}

/**
 * Updates founder energy
 */
export function updateFounderEnergy(founder: Founder, change: number): Founder {
  return {
    ...founder,
    energy: Math.max(0, Math.min(100, founder.energy + change)),
  };
}

/**
 * Starts a training session for the founder
 */
export function startFounderTraining(
  founder: Founder,
  trainingType: FounderTrainingType,
  targetSkill: SkillType,
  currentTick: number
): Founder {
  const config = FOUNDER_TRAINING_CONFIGS[trainingType];
  
  return {
    ...founder,
    currentTraining: trainingType,
    trainingTargetSkill: targetSkill,
    trainingStartTick: currentTick,
    trainingEndTick: config.durationDays > 0 ? currentTick + config.durationDays : null,
  };
}

/**
 * Completes training and applies skill gains
 */
export function completeFounderTraining(founder: Founder): Founder {
  if (!founder.currentTraining || !founder.trainingTargetSkill) {
    return founder;
  }
  
  const config = FOUNDER_TRAINING_CONFIGS[founder.currentTraining];
  const skillGain = config.skillGainPerDay * config.durationDays * founder.learningMultiplier;
  
  const updatedFounder = updateFounderSkills(founder, {
    [founder.trainingTargetSkill]: skillGain,
  });
  
  return {
    ...updatedFounder,
    currentTraining: null,
    trainingTargetSkill: null,
    trainingStartTick: null,
    trainingEndTick: null,
  };
}

/**
 * Processes daily training progress (for continuous training like hands_on_practice)
 */
export function processFounderDailyTraining(
  founder: Founder,
  isWorkingOnGame: boolean
): Founder {
  if (!founder.currentTraining || !founder.trainingTargetSkill) {
    return founder;
  }
  
  const config = FOUNDER_TRAINING_CONFIGS[founder.currentTraining];
  
  // Check if training requires active project
  if (config.requiresActiveProject && !isWorkingOnGame) {
    return founder;
  }
  
  // Apply daily skill gain
  const dailyGain = config.skillGainPerDay * founder.learningMultiplier;
  return updateFounderSkills(founder, {
    [founder.trainingTargetSkill]: dailyGain,
  });
}

/**
 * Converts founder to employee-like object for use in game development calculations
 * This allows the founder to be treated as an employee in existing systems
 */
export function founderAsEmployee(founder: Founder): {
  id: string;
  name: string;
  role: EmployeeRole;
  skills: SkillSet;
  salary: number;
  morale: number;
  experience: number;
  hiredDate: number;
  isAvailable: boolean;
} {
  const specConfig = SPECIALIZATION_CONFIGS[founder.specialization];
  
  return {
    id: founder.id,
    name: founder.name,
    role: specConfig.equivalentRole,
    skills: founder.skills,
    salary: 0,  // Founder doesn't pay themselves
    morale: Math.round(founder.energy * 0.8 + 20),  // Energy affects morale-like behavior
    experience: Math.floor(founder.totalDaysWorked / 365),  // Convert days to years
    hiredDate: 0,
    isAvailable: true,
  };
}

/**
 * Gets the starting funds based on founder experience
 */
export function getFounderStartingFunds(experience: FounderExperience): number {
  return EXPERIENCE_CONFIGS[experience].startingFunds;
}

/**
 * Calculates founder work efficiency based on energy
 */
export function getFounderEfficiency(founder: Founder): number {
  // Energy affects work output: 0-50 energy = 50-75% efficiency, 50-100 = 75-100%
  if (founder.energy <= 50) {
    return 0.5 + (founder.energy / 50) * 0.25;
  }
  return 0.75 + ((founder.energy - 50) / 50) * 0.25;
}

/**
 * Recovers founder energy (called when not working/resting)
 */
export function restFounder(founder: Founder): Founder {
  return updateFounderEnergy(founder, 10);  // Recover 10 energy per rest day
}

/**
 * Reduces founder energy from work
 */
export function workFounder(founder: Founder, intensity: number = 1): Founder {
  // Base energy cost is 5 per day, modified by intensity
  const energyCost = 5 * intensity;
  
  return {
    ...updateFounderEnergy(founder, -energyCost),
    totalDaysWorked: founder.totalDaysWorked + 1,
  };
}

/**
 * Increments games completed count
 */
export function recordGameCompleted(founder: Founder): Founder {
  return {
    ...founder,
    gamesCompleted: founder.gamesCompleted + 1,
  };
}
