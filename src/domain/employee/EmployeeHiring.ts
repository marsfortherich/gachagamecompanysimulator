import { Employee, createEmployee, EmployeeRole } from './Employee';

/**
 * Employee tier levels with different skill ranges and costs
 */
export type EmployeeTier = 'junior' | 'mid' | 'senior';

/**
 * Configuration for each employee tier
 */
export interface TierConfig {
  readonly tier: EmployeeTier;
  readonly label: string;
  readonly description: string;
  readonly hiringCost: number;
  readonly salaryRange: { min: number; max: number };
  readonly skillRange: { min: number; max: number };
  readonly experienceRange: { min: number; max: number };
  readonly primarySkillBonus: { min: number; max: number };
}

/**
 * Tier configurations
 */
export const TIER_CONFIGS: Record<EmployeeTier, TierConfig> = {
  junior: {
    tier: 'junior',
    label: 'Junior',
    description: 'Fresh talent with potential to grow',
    hiringCost: 2000,
    salaryRange: { min: 2000, max: 3500 },
    skillRange: { min: 20, max: 40 },
    experienceRange: { min: 0, max: 2 },
    primarySkillBonus: { min: 15, max: 30 },
  },
  mid: {
    tier: 'mid',
    label: 'Mid-Level',
    description: 'Experienced professional with solid skills',
    hiringCost: 5000,
    salaryRange: { min: 4000, max: 6000 },
    skillRange: { min: 35, max: 55 },
    experienceRange: { min: 3, max: 6 },
    primarySkillBonus: { min: 25, max: 40 },
  },
  senior: {
    tier: 'senior',
    label: 'Senior',
    description: 'Expert with top-tier abilities',
    hiringCost: 12000,
    salaryRange: { min: 6500, max: 10000 },
    skillRange: { min: 50, max: 75 },
    experienceRange: { min: 7, max: 15 },
    primarySkillBonus: { min: 35, max: 50 },
  },
};

/**
 * Available employee names pool - first names and last names separate for more combinations
 */
const FIRST_NAMES = [
  'Alex', 'Yuki', 'Sam', 'Maria', 'Jin', 'Emma', 'Raj', 'Lisa',
  'Tom', 'Sakura', 'Chris', 'Anna', 'David', 'Mei', 'Jordan',
  'Sofia', 'Kenji', 'Olivia', 'Omar', 'Hana', 'Marcus', 'Luna',
  'Wei', 'Elena', 'Kai', 'Zara', 'Leo', 'Mia', 'Noah', 'Aria',
  'Ethan', 'Chloe', 'Lucas', 'Ivy', 'Ryan', 'Jade', 'Tyler', 'Rose',
  'Dylan', 'Lily', 'Jason', 'Maya', 'Kevin', 'Nina', 'Brandon', 'Sara',
];

const LAST_NAMES = [
  'Chen', 'Tanaka', 'Williams', 'Garcia', 'Park', 'Johnson', 'Patel', 'Kim',
  'Brown', 'Yamamoto', 'Lee', 'Mueller', 'Singh', 'Nguyen', 'Martinez',
  'Anderson', 'Taylor', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin',
  'Thompson', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Hill', 'Green', 'Adams', 'Baker',
  'Gonzalez', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner',
];

const ROLES: EmployeeRole[] = ['Programmer', 'Artist', 'Designer', 'Marketer', 'Producer'];

const ROLE_SKILL_MAP: Record<EmployeeRole, string> = {
  'Programmer': 'programming',
  'Artist': 'art',
  'Designer': 'game_design',
  'Marketer': 'marketing',
  'Producer': 'management',
};

/**
 * Generate a unique name that isn't already in use
 */
export function generateUniqueName(existingNames: Set<string>, rng?: () => number): string {
  const random = rng || Math.random;
  const maxAttempts = 100;
  
  for (let i = 0; i < maxAttempts; i++) {
    const firstName = FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(random() * LAST_NAMES.length)];
    const fullName = `${firstName} ${lastName}`;
    
    if (!existingNames.has(fullName)) {
      return fullName;
    }
  }
  
  // If we exhausted attempts, add a suffix
  const firstName = FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(random() * LAST_NAMES.length)];
  const suffix = Math.floor(random() * 1000);
  return `${firstName} ${lastName} ${suffix}`;
}

/**
 * Generate a random number within a range
 */
function randomInRange(min: number, max: number, rng?: () => number): number {
  const random = rng || Math.random;
  return min + random() * (max - min);
}

/**
 * Parameters for generating a tiered employee
 */
export interface GenerateTieredEmployeeParams {
  tier: EmployeeTier;
  role: EmployeeRole;
  currentTick: number;
  existingNames: Set<string>;
  rng?: () => number;
}

/**
 * Generate an employee with specific tier and role
 */
export function generateTieredEmployee(params: GenerateTieredEmployeeParams): Employee {
  const { tier, role, currentTick, existingNames, rng } = params;
  const config = TIER_CONFIGS[tier];
  const random = rng || Math.random;
  
  const name = generateUniqueName(existingNames, rng);
  const experience = Math.round(randomInRange(config.experienceRange.min, config.experienceRange.max, random));
  const salary = Math.round(randomInRange(config.salaryRange.min, config.salaryRange.max, random));
  
  // Generate base skills
  const skills: Record<string, number> = {
    programming: Math.round(randomInRange(config.skillRange.min, config.skillRange.max, random)),
    art: Math.round(randomInRange(config.skillRange.min, config.skillRange.max, random)),
    game_design: Math.round(randomInRange(config.skillRange.min, config.skillRange.max, random)),
    marketing: Math.round(randomInRange(config.skillRange.min, config.skillRange.max, random)),
    management: Math.round(randomInRange(config.skillRange.min, config.skillRange.max, random)),
    sound: Math.round(randomInRange(config.skillRange.min, config.skillRange.max, random)),
    writing: Math.round(randomInRange(config.skillRange.min, config.skillRange.max, random)),
  };
  
  // Boost primary skill based on role
  const primarySkillName = ROLE_SKILL_MAP[role];
  const bonus = Math.round(randomInRange(config.primarySkillBonus.min, config.primarySkillBonus.max, random));
  skills[primarySkillName] = Math.min(100, skills[primarySkillName] + bonus);
  
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
 * Get all available tiers
 */
export function getAvailableTiers(): TierConfig[] {
  return Object.values(TIER_CONFIGS);
}

/**
 * Get all available roles
 */
export function getAvailableRoles(): EmployeeRole[] {
  return [...ROLES];
}

/**
 * Calculate the total cost to hire an employee (hiring cost only, salary is ongoing)
 */
export function getHiringCost(tier: EmployeeTier): number {
  return TIER_CONFIGS[tier].hiringCost;
}
