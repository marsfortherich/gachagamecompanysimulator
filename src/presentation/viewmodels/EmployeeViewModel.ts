/**
 * Employee ViewModel - UI-friendly employee representation
 */

import { Employee, EmployeeRole, SkillType, getPrimarySkill } from '@domain/employee';

// =============================================================================
// Types
// =============================================================================

export interface SkillDisplay {
  readonly name: string;
  readonly key: SkillType;
  readonly value: number;
  readonly maxValue: number;
  readonly percentage: number;
  readonly color: string;
  readonly icon: string;
}

export interface MoraleDisplay {
  readonly value: number;
  readonly status: 'critical' | 'low' | 'normal' | 'high' | 'excellent';
  readonly color: string;
  readonly icon: string;
  readonly label: string;
}

export interface EmployeeViewModel {
  readonly id: string;
  readonly displayName: string;
  readonly avatarInitials: string;
  readonly role: EmployeeRole;
  readonly roleLabel: string;
  readonly roleIcon: string;
  readonly level: number;
  readonly levelBadge: { text: string; color: string };
  readonly primarySkill: SkillDisplay;
  readonly allSkills: SkillDisplay[];
  readonly topSkills: SkillDisplay[];
  readonly salary: number;
  readonly salaryFormatted: string;
  readonly morale: MoraleDisplay;
  readonly experience: number;
  readonly experienceLabel: string;
  readonly isAvailable: boolean;
  readonly hiredDate: number;
  readonly actions: {
    canFire: boolean;
    canTrain: boolean;
    canAssign: boolean;
  };
}

// =============================================================================
// Constants
// =============================================================================

const SKILL_COLORS: Record<SkillType, string> = {
  programming: '#3B82F6',   // blue
  art: '#A855F7',           // purple
  game_design: '#22C55E',   // green
  marketing: '#F59E0B',     // amber
  management: '#EF4444',    // red
  sound: '#06B6D4',         // cyan
  writing: '#EC4899',       // pink
};

const SKILL_ICONS: Record<SkillType, string> = {
  programming: 'programmer',
  art: 'artist',
  game_design: 'games',
  marketing: 'megaphone',
  management: 'document',
  sound: 'sound',
  writing: 'edit',
};

const SKILL_LABELS: Record<SkillType, string> = {
  programming: 'Programming',
  art: 'Art & Design',
  game_design: 'Game Design',
  marketing: 'Marketing',
  management: 'Management',
  sound: 'Sound & Music',
  writing: 'Writing',
};

const ROLE_LABELS: Record<EmployeeRole, string> = {
  Programmer: 'Programmer',
  Artist: 'Artist',
  Designer: 'Game Designer',
  Producer: 'Producer',
  Marketer: 'Marketer',
};

const ROLE_ICONS: Record<EmployeeRole, string> = {
  Programmer: 'programmer',
  Artist: 'artist',
  Designer: 'games',
  Producer: 'document',
  Marketer: 'megaphone',
};

// =============================================================================
// Transformation Functions
// =============================================================================

/**
 * Transform skill value to UI display
 */
function toSkillDisplay(key: SkillType, value: number): SkillDisplay {
  return {
    name: SKILL_LABELS[key],
    key,
    value,
    maxValue: 100,
    percentage: Math.min(100, Math.max(0, value)),
    color: SKILL_COLORS[key],
    icon: SKILL_ICONS[key],
  };
}

/**
 * Calculate morale status and display
 */
function toMoraleDisplay(morale: number): MoraleDisplay {
  let status: MoraleDisplay['status'];
  let color: string;
  let icon: string;
  let label: string;

  if (morale < 20) {
    status = 'critical';
    color = '#EF4444';
    icon = 'depressed';
    label = 'Critical';
  } else if (morale < 40) {
    status = 'low';
    color = '#F59E0B';
    icon = 'sad';
    label = 'Low';
  } else if (morale < 70) {
    status = 'normal';
    color = '#6B7280';
    icon = 'neutral';
    label = 'Normal';
  } else if (morale < 90) {
    status = 'high';
    color = '#22C55E';
    icon = 'happy';
    label = 'High';
  } else {
    status = 'excellent';
    color = '#10B981';
    icon = 'ecstatic';
    label = 'Excellent';
  }

  return { value: morale, status, color, icon, label };
}

/**
 * Get experience label from years
 */
function toExperienceLabel(years: number): string {
  if (years < 1) return 'Fresh Graduate';
  if (years < 3) return 'Junior';
  if (years < 5) return 'Mid-Level';
  if (years < 8) return 'Senior';
  if (years < 12) return 'Lead';
  return 'Veteran';
}

/**
 * Get level badge display
 */
function toLevelBadge(level: number): { text: string; color: string } {
  if (level < 3) return { text: `Lv.${level}`, color: '#6B7280' };
  if (level < 5) return { text: `Lv.${level}`, color: '#22C55E' };
  if (level < 7) return { text: `Lv.${level}`, color: '#3B82F6' };
  if (level < 9) return { text: `Lv.${level}`, color: '#A855F7' };
  return { text: `Lv.${level}`, color: '#F59E0B' };
}

/**
 * Format salary for display
 */
function formatSalary(salary: number): string {
  if (salary >= 1000000) {
    return `$${(salary / 1000000).toFixed(1)}M/mo`;
  }
  if (salary >= 1000) {
    return `$${(salary / 1000).toFixed(0)}K/mo`;
  }
  return `$${salary}/mo`;
}

/**
 * Get initials from name
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// =============================================================================
// Main Transformer
// =============================================================================

/**
 * Transform domain Employee to EmployeeViewModel
 */
export function toEmployeeViewModel(employee: Employee): EmployeeViewModel {
  const skills = employee.skills;
  const skillEntries = Object.entries(skills) as [SkillType, number][];
  
  // All skills as display objects
  const allSkills = skillEntries
    .map(([key, value]) => toSkillDisplay(key, value))
    .sort((a, b) => b.value - a.value);
  
  // Top 3 skills
  const topSkills = allSkills.slice(0, 3);
  
  // Primary skill (highest)
  const primarySkillKey = getPrimarySkill(employee);
  const primarySkill = toSkillDisplay(primarySkillKey, skills[primarySkillKey]);
  
  // Calculate level based on average skill level
  const avgSkill = skillEntries.reduce((sum, [, v]) => sum + v, 0) / skillEntries.length;
  const level = Math.max(1, Math.floor(avgSkill / 10));
  
  return {
    id: employee.id,
    displayName: employee.name,
    avatarInitials: getInitials(employee.name),
    role: employee.role,
    roleLabel: ROLE_LABELS[employee.role],
    roleIcon: ROLE_ICONS[employee.role],
    level,
    levelBadge: toLevelBadge(level),
    primarySkill,
    allSkills,
    topSkills,
    salary: employee.salary,
    salaryFormatted: formatSalary(employee.salary),
    morale: toMoraleDisplay(employee.morale),
    experience: employee.experience,
    experienceLabel: toExperienceLabel(employee.experience),
    isAvailable: employee.isAvailable,
    hiredDate: employee.hiredDate,
    actions: {
      canFire: true,
      canTrain: employee.morale >= 30, // Can't train demoralized employees
      canAssign: employee.isAvailable,
    },
  };
}

/**
 * Filter and sort employees for list display
 */
export function filterEmployees(
  employees: EmployeeViewModel[],
  options: {
    role?: EmployeeRole;
    minLevel?: number;
    maxLevel?: number;
    searchTerm?: string;
    sortBy?: 'name' | 'level' | 'salary' | 'morale';
    sortOrder?: 'asc' | 'desc';
  }
): EmployeeViewModel[] {
  let filtered = [...employees];
  
  // Filter by role
  if (options.role) {
    filtered = filtered.filter(e => e.role === options.role);
  }
  
  // Filter by level range
  if (options.minLevel !== undefined) {
    filtered = filtered.filter(e => e.level >= options.minLevel!);
  }
  if (options.maxLevel !== undefined) {
    filtered = filtered.filter(e => e.level <= options.maxLevel!);
  }
  
  // Search by name or skill
  if (options.searchTerm) {
    const term = options.searchTerm.toLowerCase();
    filtered = filtered.filter(e =>
      e.displayName.toLowerCase().includes(term) ||
      e.roleLabel.toLowerCase().includes(term) ||
      e.allSkills.some(s => s.name.toLowerCase().includes(term))
    );
  }
  
  // Sort
  if (options.sortBy) {
    const order = options.sortOrder === 'desc' ? -1 : 1;
    filtered.sort((a, b) => {
      switch (options.sortBy) {
        case 'name':
          return order * a.displayName.localeCompare(b.displayName);
        case 'level':
          return order * (a.level - b.level);
        case 'salary':
          return order * (a.salary - b.salary);
        case 'morale':
          return order * (a.morale.value - b.morale.value);
        default:
          return 0;
      }
    });
  }
  
  return filtered;
}

/**
 * Group employees by role for summary display
 */
export function groupEmployeesByRole(
  employees: EmployeeViewModel[]
): Record<EmployeeRole, EmployeeViewModel[]> {
  const groups: Partial<Record<EmployeeRole, EmployeeViewModel[]>> = {};
  
  for (const emp of employees) {
    if (!groups[emp.role]) {
      groups[emp.role] = [];
    }
    groups[emp.role]!.push(emp);
  }
  
  return groups as Record<EmployeeRole, EmployeeViewModel[]>;
}
