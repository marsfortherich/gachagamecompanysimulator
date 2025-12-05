import { Entity, generateId, IRNGProvider, defaultRNG } from '../shared';

/**
 * Employee roles determine their primary function
 */
export type EmployeeRole = 
  | 'Programmer'
  | 'Artist'
  | 'Designer'
  | 'Marketer'
  | 'Producer';

/**
 * Role to primary skill mapping
 */
export const ROLE_PRIMARY_SKILLS: Record<EmployeeRole, SkillType> = {
  Programmer: 'programming',
  Artist: 'art',
  Designer: 'game_design',
  Marketer: 'marketing',
  Producer: 'management',
};

/**
 * Training types available for employees
 */
export type TrainingType = 
  | 'technical_workshop'
  | 'creative_seminar'
  | 'leadership_course'
  | 'team_building';

export interface TrainingConfig {
  readonly type: TrainingType;
  readonly cost: number;
  readonly durationDays: number;
  readonly skillBoosts: Partial<SkillSet>;
  readonly moraleBoost: number;
}

export const TRAINING_CONFIGS: Record<TrainingType, TrainingConfig> = {
  technical_workshop: {
    type: 'technical_workshop',
    cost: 2000,
    durationDays: 3,
    skillBoosts: { programming: 5, sound: 3 },
    moraleBoost: 5,
  },
  creative_seminar: {
    type: 'creative_seminar',
    cost: 1500,
    durationDays: 2,
    skillBoosts: { art: 5, game_design: 4, writing: 3 },
    moraleBoost: 10,
  },
  leadership_course: {
    type: 'leadership_course',
    cost: 3000,
    durationDays: 5,
    skillBoosts: { management: 8, marketing: 3 },
    moraleBoost: 5,
  },
  team_building: {
    type: 'team_building',
    cost: 500,
    durationDays: 1,
    skillBoosts: {},
    moraleBoost: 20,
  },
};

/**
 * Skill types for employees
 */
export type SkillType = 
  | 'programming'
  | 'art'
  | 'game_design'
  | 'marketing'
  | 'management'
  | 'sound'
  | 'writing';

/**
 * Employee skill ratings (0-100)
 */
export type SkillSet = Record<SkillType, number>;

/**
 * Represents an employee in the company
 */
export interface Employee extends Entity {
  readonly name: string;
  readonly role: EmployeeRole;
  readonly skills: SkillSet;
  readonly salary: number;           // Monthly salary
  readonly morale: number;           // 0-100
  readonly experience: number;       // Years of experience
  readonly hiredDate: number;        // Game tick when hired
  readonly isAvailable: boolean;     // Not assigned to a project
  readonly trainingEndDate: number | null;  // Game tick when training ends
}

/**
 * Parameters for creating a new employee
 */
export interface CreateEmployeeParams {
  name: string;
  role: EmployeeRole;
  skills: Partial<SkillSet>;
  salary: number;
  experience?: number;
  hiredDate: number;
}

/**
 * Creates default skill set with all skills at 0
 */
export function createDefaultSkillSet(): SkillSet {
  return {
    programming: 0,
    art: 0,
    game_design: 0,
    marketing: 0,
    management: 0,
    sound: 0,
    writing: 0,
  };
}

/**
 * Creates a new employee
 */
export function createEmployee(params: CreateEmployeeParams): Employee {
  return {
    id: generateId(),
    name: params.name,
    role: params.role,
    skills: { ...createDefaultSkillSet(), ...params.skills },
    salary: params.salary,
    morale: 75, // Start with good morale
    experience: params.experience ?? 0,
    hiredDate: params.hiredDate,
    isAvailable: true,
    trainingEndDate: null,
  };
}

/**
 * Generates a random employee for hiring
 */
export function generateRandomEmployee(
  currentTick: number,
  rng: IRNGProvider = defaultRNG
): Employee {
  const roles: EmployeeRole[] = ['Programmer', 'Artist', 'Designer', 'Marketer', 'Producer'];
  const role = rng.pick(roles) ?? 'Programmer';
  const primarySkill = ROLE_PRIMARY_SKILLS[role];
  
  const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery'];
  const lastNames = ['Smith', 'Johnson', 'Chen', 'Garcia', 'Williams', 'Brown', 'Kim', 'Tanaka'];
  
  const name = `${rng.pick(firstNames)} ${rng.pick(lastNames)}`;
  const experience = rng.randomInt(0, 15);
  const baseSkill = 20 + experience * 3 + rng.randomInt(0, 20);
  
  const skills: Partial<SkillSet> = {
    [primarySkill]: Math.min(100, baseSkill),
  };
  
  // Add some secondary skills
  const allSkills: SkillType[] = ['programming', 'art', 'game_design', 'marketing', 'management', 'sound', 'writing'];
  for (const skill of allSkills) {
    if (skill !== primarySkill) {
      skills[skill] = rng.randomInt(5, 40);
    }
  }
  
  const baseSalary = 3000 + experience * 500 + baseSkill * 20;
  const salary = Math.round(baseSalary / 100) * 100; // Round to nearest 100
  
  return createEmployee({
    name,
    role,
    skills,
    salary,
    experience,
    hiredDate: currentTick,
  });
}

/**
 * Gets the primary skill of an employee (highest rated)
 */
export function getPrimarySkill(employee: Employee): SkillType {
  const skills = employee.skills;
  let maxSkill: SkillType = 'programming';
  let maxValue = 0;

  for (const [skill, value] of Object.entries(skills)) {
    if (value > maxValue) {
      maxValue = value;
      maxSkill = skill as SkillType;
    }
  }

  return maxSkill;
}

/**
 * Calculates employee effectiveness (based on morale and skills)
 */
export function calculateEffectiveness(employee: Employee, skill: SkillType): number {
  const skillValue = employee.skills[skill];
  const moraleMultiplier = 0.5 + (employee.morale / 200); // 0.5 to 1.0
  return skillValue * moraleMultiplier;
}

/**
 * Updates employee morale (clamped 0-100)
 */
export function updateMorale(employee: Employee, change: number): Employee {
  return {
    ...employee,
    morale: Math.max(0, Math.min(100, employee.morale + change)),
  };
}

/**
 * Sets employee availability
 */
export function setAvailability(employee: Employee, available: boolean): Employee {
  return {
    ...employee,
    isAvailable: available,
  };
}

/**
 * Starts training for an employee
 */
export function startTraining(
  employee: Employee,
  training: TrainingType,
  currentTick: number,
  ticksPerDay: number = 24
): Employee {
  const config = TRAINING_CONFIGS[training];
  const endTick = currentTick + config.durationDays * ticksPerDay;
  
  return {
    ...employee,
    isAvailable: false,
    trainingEndDate: endTick,
  };
}

/**
 * Completes training and applies skill boosts
 */
export function completeTraining(
  employee: Employee,
  training: TrainingType
): Employee {
  const config = TRAINING_CONFIGS[training];
  
  const newSkills = { ...employee.skills };
  for (const [skill, boost] of Object.entries(config.skillBoosts)) {
    const skillKey = skill as SkillType;
    newSkills[skillKey] = Math.min(100, newSkills[skillKey] + boost);
  }
  
  return {
    ...employee,
    skills: newSkills,
    morale: Math.min(100, employee.morale + config.moraleBoost),
    isAvailable: true,
    trainingEndDate: null,
  };
}

/**
 * Checks if employee is currently in training
 */
export function isInTraining(employee: Employee): boolean {
  return employee.trainingEndDate !== null;
}

/**
 * Calculate team synergy bonus based on employee roles
 */
export function calculateTeamSynergy(employees: readonly Employee[]): number {
  if (employees.length <= 1) return 0;
  
  const roleCount: Record<EmployeeRole, number> = {
    Programmer: 0,
    Artist: 0,
    Designer: 0,
    Marketer: 0,
    Producer: 0,
  };
  
  for (const emp of employees) {
    roleCount[emp.role]++;
  }
  
  // Balanced teams get synergy bonus
  const filledRoles = Object.values(roleCount).filter(c => c > 0).length;
  const hasProgrammer = roleCount.Programmer > 0;
  const hasArtist = roleCount.Artist > 0;
  const hasDesigner = roleCount.Designer > 0;
  
  let synergy = 0;
  
  // Core team bonus (programmer + artist + designer)
  if (hasProgrammer && hasArtist && hasDesigner) {
    synergy += 0.15;
  }
  
  // Diversity bonus
  synergy += filledRoles * 0.03;
  
  // Producer coordination bonus
  if (roleCount.Producer > 0 && employees.length >= 5) {
    synergy += 0.10;
  }
  
  return Math.min(0.5, synergy); // Cap at 50% bonus
}
