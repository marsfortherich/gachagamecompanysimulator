/**
 * Data Transfer Objects (DTOs) - Prompt 6.2
 * 
 * DTOs provide a clean separation between domain models and serialized data.
 * They are used for:
 * - Save/Load operations
 * - API communication
 * - State snapshots
 */

import { GameGenre, GameStatus } from '@domain/game/Game';
import { EmployeeRole, SkillType } from '@domain/employee/Employee';
import { Rarity } from '@domain/gacha/Gacha';

// Development phase type for DTOs (may not exist in domain yet)
export type DevelopmentPhase = 
  | 'concept'
  | 'pre-production'
  | 'production'
  | 'alpha'
  | 'beta'
  | 'polish'
  | 'release';

// =============================================================================
// Employee DTOs
// =============================================================================

export interface SkillDTO {
  id: string;
  name: string;
  type: SkillType;
  level: number;
  experience: number;
  experienceToNextLevel: number;
}

export interface EmployeeDTO {
  id: string;
  name: string;
  role: EmployeeRole;
  rarity: Rarity;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  salary: number;
  morale: number;
  skills: SkillDTO[];
  assignedGameId: string | null;
  hireDate: number; // timestamp
  lastPromotionDate: number | null;
  stats: {
    productivity: number;
    creativity: number;
    technical: number;
  };
}

// =============================================================================
// Game DTOs
// =============================================================================

export interface GameProgressDTO {
  design: number;
  art: number;
  programming: number;
  sound: number;
  testing: number;
}

export interface GameStatsDTO {
  downloads: number;
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  revenue: number;
  rating: number;
  reviews: number;
  bugs: number;
}

export interface GameDTO {
  id: string;
  name: string;
  genre: GameGenre;
  status: GameStatus;
  developmentPhase: DevelopmentPhase;
  progress: GameProgressDTO;
  quality: number;
  monetization: 'free' | 'premium' | 'freemium';
  budget: number;
  spentBudget: number;
  startDate: number;
  releaseDate: number | null;
  assignedEmployees: string[];
  stats: GameStatsDTO;
  features: string[];
  version: string;
  lastUpdateDate: number | null;
}

// =============================================================================
// Company DTOs
// =============================================================================

export interface CompanyDTO {
  id: string;
  name: string;
  funds: number;
  reputation: number;
  officeLevel: number;
  maxEmployees: number;
  foundedDate: number;
  totalRevenue: number;
  totalExpenses: number;
  researchPoints: number;
  unlockedGenres: GameGenre[];
  unlockedFeatures: string[];
}

// =============================================================================
// Gacha DTOs
// =============================================================================

export interface GachaBannerDTO {
  id: string;
  name: string;
  description: string;
  cost: number;
  guaranteedRarity: Rarity | null;
  rateUps: string[]; // employee IDs with increased rates
  startDate: number;
  endDate: number | null;
  pullCount: number;
  pityCounter: number;
  pityThreshold: number;
  active: boolean;
}

export interface GachaPullResultDTO {
  id: string;
  bannerId: string;
  employeeId: string;
  rarity: Rarity;
  isNew: boolean;
  isPity: boolean;
  timestamp: number;
}

// =============================================================================
// Analytics DTOs
// =============================================================================

export interface AnalyticsEventDTO {
  id: string;
  type: string;
  category: string;
  timestamp: number;
  data: Record<string, unknown>;
}

export interface DailyStatsDTO {
  date: string; // ISO date string
  revenue: number;
  expenses: number;
  profit: number;
  gamesReleased: number;
  employeesHired: number;
  gachaPulls: number;
}

export interface StatisticsDTO {
  totalPlaytime: number; // seconds
  gamesCreated: number;
  gamesReleased: number;
  totalRevenue: number;
  totalExpenses: number;
  employeesHired: number;
  employeesFired: number;
  gachaPulls: number;
  ssrObtained: number;
  highestFunds: number;
  longestGame: string | null;
  dailyStats: DailyStatsDTO[];
}

// =============================================================================
// Full Game State DTO
// =============================================================================

export interface GameStateDTO {
  version: number;
  savedAt: number;
  company: CompanyDTO | null;
  employees: EmployeeDTO[];
  games: GameDTO[];
  gachaBanners: GachaBannerDTO[];
  pullHistory: GachaPullResultDTO[];
  statistics: StatisticsDTO;
  currentTick: number;
  gameSpeed: number;
  settings: SettingsDTO;
}

export interface SettingsDTO {
  musicVolume: number;
  sfxVolume: number;
  autoSave: boolean;
  autoSaveInterval: number; // seconds
  showTutorial: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
}

// =============================================================================
// Mapper Functions
// =============================================================================

/**
 * Creates a deep clone suitable for DTO creation
 */
export function toDTO<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Validates a DTO has required fields
 */
export function validateDTO<T>(
  dto: unknown,
  requiredFields: (keyof T)[]
): dto is T {
  if (!dto || typeof dto !== 'object') {
    return false;
  }
  
  const obj = dto as Record<string, unknown>;
  return requiredFields.every(field => field in obj);
}

/**
 * Creates an employee DTO from domain data
 */
export function createEmployeeDTO(
  id: string,
  name: string,
  role: EmployeeRole,
  rarity: Rarity,
  data: Partial<EmployeeDTO>
): EmployeeDTO {
  return {
    id,
    name,
    role,
    rarity,
    level: data.level ?? 1,
    experience: data.experience ?? 0,
    experienceToNextLevel: data.experienceToNextLevel ?? 100,
    salary: data.salary ?? 1000,
    morale: data.morale ?? 100,
    skills: data.skills ?? [],
    assignedGameId: data.assignedGameId ?? null,
    hireDate: data.hireDate ?? Date.now(),
    lastPromotionDate: data.lastPromotionDate ?? null,
    stats: data.stats ?? {
      productivity: 50,
      creativity: 50,
      technical: 50,
    },
  };
}

/**
 * Creates a game DTO from domain data
 */
export function createGameDTO(
  id: string,
  name: string,
  genre: GameGenre,
  data: Partial<GameDTO>
): GameDTO {
  return {
    id,
    name,
    genre,
    status: data.status ?? 'development',
    developmentPhase: data.developmentPhase ?? 'concept',
    progress: data.progress ?? {
      design: 0,
      art: 0,
      programming: 0,
      sound: 0,
      testing: 0,
    },
    quality: data.quality ?? 0,
    monetization: data.monetization ?? 'freemium',
    budget: data.budget ?? 10000,
    spentBudget: data.spentBudget ?? 0,
    startDate: data.startDate ?? Date.now(),
    releaseDate: data.releaseDate ?? null,
    assignedEmployees: data.assignedEmployees ?? [],
    stats: data.stats ?? {
      downloads: 0,
      dailyActiveUsers: 0,
      monthlyActiveUsers: 0,
      revenue: 0,
      rating: 0,
      reviews: 0,
      bugs: 0,
    },
    features: data.features ?? [],
    version: data.version ?? '0.1.0',
    lastUpdateDate: data.lastUpdateDate ?? null,
  };
}

/**
 * Creates default settings DTO
 */
export function createDefaultSettingsDTO(): SettingsDTO {
  return {
    musicVolume: 0.7,
    sfxVolume: 0.8,
    autoSave: true,
    autoSaveInterval: 30,
    showTutorial: true,
    theme: 'system',
    language: 'en',
  };
}

/**
 * Creates empty statistics DTO
 */
export function createEmptyStatisticsDTO(): StatisticsDTO {
  return {
    totalPlaytime: 0,
    gamesCreated: 0,
    gamesReleased: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    employeesHired: 0,
    employeesFired: 0,
    gachaPulls: 0,
    ssrObtained: 0,
    highestFunds: 0,
    longestGame: null,
    dailyStats: [],
  };
}
