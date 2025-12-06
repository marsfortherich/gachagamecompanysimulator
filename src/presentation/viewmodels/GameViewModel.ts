/**
 * Game ViewModel - UI-friendly game project representation
 */

import { Game, GameStatus, GameGenre, GameQuality, DEVELOPMENT_PHASES } from '@domain/game';
import { Employee } from '@domain/employee';

// =============================================================================
// Types
// =============================================================================

export interface QualityMetric {
  readonly name: string;
  readonly key: keyof GameQuality;
  readonly value: number;
  readonly maxValue: number;
  readonly percentage: number;
  readonly color: string;
  readonly icon: string;
}

export interface PhaseInfo {
  readonly current: GameStatus;
  readonly label: string;
  readonly icon: string;
  readonly color: string;
  readonly progress: number;
  readonly isComplete: boolean;
  readonly canAdvance: boolean;
  readonly nextPhase: GameStatus | null;
}

export interface MonetizationDisplay {
  readonly dailyActiveUsers: number;
  readonly dauFormatted: string;
  readonly monthlyRevenue: number;
  readonly revenueFormatted: string;
  readonly playerSatisfaction: number;
  readonly satisfactionStatus: 'critical' | 'low' | 'normal' | 'high';
  readonly arpu: number;
  readonly arpuFormatted: string;
}

export interface TeamMember {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly role: string;
  readonly color: string;
}

export interface GameViewModel {
  readonly id: string;
  readonly name: string;
  readonly genre: GameGenre;
  readonly genreLabel: string;
  readonly genreIcon: string;
  readonly status: GameStatus;
  readonly statusLabel: string;
  readonly statusColor: string;
  readonly phase: PhaseInfo;
  readonly quality: {
    overall: number;
    overallLabel: string;
    metrics: QualityMetric[];
  };
  readonly monetization: MonetizationDisplay | null;
  readonly team: TeamMember[];
  readonly teamSize: number;
  readonly startDate: number;
  readonly startDateFormatted: string;
  readonly launchDate: number | null;
  readonly launchDateFormatted: string | null;
  readonly isLive: boolean;
  readonly isDevelopment: boolean;
  readonly canLaunch: boolean;
  readonly canShutdown: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const GENRE_LABELS: Record<GameGenre, string> = {
  rpg: 'RPG',
  action: 'Action',
  puzzle: 'Puzzle',
  strategy: 'Strategy',
  idle: 'Idle',
  card: 'Card Game',
  rhythm: 'Rhythm',
};

const GENRE_ICONS: Record<GameGenre, string> = {
  rpg: 'rpg',
  action: 'action',
  puzzle: 'puzzle',
  strategy: 'strategy',
  idle: 'idle',
  card: 'card',
  rhythm: 'rhythm',
};

const STATUS_LABELS: Record<GameStatus, string> = {
  planning: 'Planning',
  development: 'In Development',
  testing: 'Testing',
  soft_launch: 'Soft Launch',
  live: 'Live',
  maintenance: 'Maintenance',
  shutdown: 'Shutdown',
};

const STATUS_COLORS: Record<GameStatus, string> = {
  planning: '#6B7280',
  development: '#3B82F6',
  testing: '#F59E0B',
  soft_launch: '#8B5CF6',
  live: '#22C55E',
  maintenance: '#F97316',
  shutdown: '#EF4444',
};

const PHASE_ICONS: Record<GameStatus, string> = {
  planning: 'planning',
  development: 'development',
  testing: 'testing',
  soft_launch: 'launch',
  live: 'live',
  maintenance: 'maintenance',
  shutdown: 'shutdown',
};

const QUALITY_METRICS: { key: keyof GameQuality; name: string; icon: string; color: string }[] = [
  { key: 'graphics', name: 'Graphics', icon: 'graphics', color: '#A855F7' },
  { key: 'gameplay', name: 'Gameplay', icon: 'gameplay', color: '#22C55E' },
  { key: 'story', name: 'Story', icon: 'story', color: '#3B82F6' },
  { key: 'sound', name: 'Sound', icon: 'sound', color: '#06B6D4' },
  { key: 'polish', name: 'Polish', icon: 'polish', color: '#F59E0B' },
];

const ROLE_COLORS: Record<string, string> = {
  Programmer: '#3B82F6',
  Artist: '#A855F7',
  Designer: '#22C55E',
  Marketer: '#F59E0B',
  Producer: '#EF4444',
};

// =============================================================================
// Transformation Functions
// =============================================================================

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

function formatDate(tick: number): string {
  const startDate = new Date(2020, 0, 1);
  const date = new Date(startDate.getTime() + tick * 24 * 60 * 60 * 1000);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short',
    day: 'numeric'
  });
}

function toPhaseInfo(game: Game): PhaseInfo {
  const phase = DEVELOPMENT_PHASES[game.status];
  const isComplete = game.developmentProgress >= 100;
  
  return {
    current: game.status,
    label: STATUS_LABELS[game.status],
    icon: PHASE_ICONS[game.status],
    color: STATUS_COLORS[game.status],
    progress: game.developmentProgress,
    isComplete,
    canAdvance: isComplete && phase.nextPhase !== null,
    nextPhase: phase.nextPhase ?? null,
  };
}

function toQualityMetrics(quality: GameQuality): QualityMetric[] {
  return QUALITY_METRICS.map(({ key, name, icon, color }) => ({
    name,
    key,
    value: quality[key],
    maxValue: 100,
    percentage: Math.min(100, Math.max(0, quality[key])),
    color,
    icon,
  }));
}

function calculateOverallQuality(quality: GameQuality): { value: number; label: string } {
  const values = Object.values(quality);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  
  let label: string;
  if (avg < 20) label = 'Poor';
  else if (avg < 40) label = 'Below Average';
  else if (avg < 60) label = 'Average';
  else if (avg < 80) label = 'Good';
  else label = 'Excellent';
  
  return { value: Math.round(avg), label };
}

function toMonetizationDisplay(game: Game): MonetizationDisplay | null {
  if (game.status !== 'live' && game.status !== 'soft_launch') {
    return null;
  }
  
  const { dailyActiveUsers, monthlyRevenue, playerSatisfaction } = game.monetization;
  const arpu = dailyActiveUsers > 0 
    ? monthlyRevenue / dailyActiveUsers 
    : 0;
  
  let satisfactionStatus: MonetizationDisplay['satisfactionStatus'];
  if (playerSatisfaction < 30) satisfactionStatus = 'critical';
  else if (playerSatisfaction < 50) satisfactionStatus = 'low';
  else if (playerSatisfaction < 75) satisfactionStatus = 'normal';
  else satisfactionStatus = 'high';
  
  return {
    dailyActiveUsers,
    dauFormatted: formatNumber(dailyActiveUsers),
    monthlyRevenue,
    revenueFormatted: formatCurrency(monthlyRevenue),
    playerSatisfaction,
    satisfactionStatus,
    arpu,
    arpuFormatted: `$${arpu.toFixed(2)}`,
  };
}

function toTeamMembers(
  game: Game, 
  employees: Employee[]
): TeamMember[] {
  return game.assignedEmployees
    .map(id => employees.find(e => e.id === id))
    .filter((e): e is Employee => e !== undefined)
    .map(e => ({
      id: e.id,
      name: e.name,
      initials: e.name.split(' ').map(p => p[0]).join('').slice(0, 2),
      role: e.role,
      color: ROLE_COLORS[e.role] || '#6B7280',
    }));
}

// =============================================================================
// Main Transformer
// =============================================================================

export function toGameViewModel(
  game: Game,
  employees: Employee[] = []
): GameViewModel {
  const overallQuality = calculateOverallQuality(game.quality);
  const team = toTeamMembers(game, employees);
  
  const isDevelopment = ['planning', 'development', 'testing'].includes(game.status);
  const isLive = game.status === 'live' || game.status === 'soft_launch';
  
  return {
    id: game.id,
    name: game.name,
    genre: game.genre,
    genreLabel: GENRE_LABELS[game.genre],
    genreIcon: GENRE_ICONS[game.genre],
    status: game.status,
    statusLabel: STATUS_LABELS[game.status],
    statusColor: STATUS_COLORS[game.status],
    phase: toPhaseInfo(game),
    quality: {
      overall: overallQuality.value,
      overallLabel: overallQuality.label,
      metrics: toQualityMetrics(game.quality),
    },
    monetization: toMonetizationDisplay(game),
    team,
    teamSize: team.length,
    startDate: game.startDate,
    startDateFormatted: formatDate(game.startDate),
    launchDate: game.launchDate,
    launchDateFormatted: game.launchDate ? formatDate(game.launchDate) : null,
    isLive,
    isDevelopment,
    canLaunch: game.status === 'soft_launch' && game.developmentProgress >= 100,
    canShutdown: game.status !== 'shutdown',
  };
}

/**
 * Filter and sort games
 */
export function filterGames(
  games: GameViewModel[],
  options: {
    status?: GameStatus;
    genre?: GameGenre;
    searchTerm?: string;
    sortBy?: 'name' | 'status' | 'quality' | 'revenue';
    sortOrder?: 'asc' | 'desc';
  }
): GameViewModel[] {
  let filtered = [...games];
  
  if (options.status) {
    filtered = filtered.filter(g => g.status === options.status);
  }
  
  if (options.genre) {
    filtered = filtered.filter(g => g.genre === options.genre);
  }
  
  if (options.searchTerm) {
    const term = options.searchTerm.toLowerCase();
    filtered = filtered.filter(g => 
      g.name.toLowerCase().includes(term) ||
      g.genreLabel.toLowerCase().includes(term)
    );
  }
  
  if (options.sortBy) {
    const order = options.sortOrder === 'desc' ? -1 : 1;
    filtered.sort((a, b) => {
      switch (options.sortBy) {
        case 'name':
          return order * a.name.localeCompare(b.name);
        case 'quality':
          return order * (a.quality.overall - b.quality.overall);
        case 'revenue':
          return order * ((a.monetization?.monthlyRevenue ?? 0) - (b.monetization?.monthlyRevenue ?? 0));
        default:
          return 0;
      }
    });
  }
  
  return filtered;
}

/**
 * Get game development phases for timeline display
 */
export const PHASE_ORDER: GameStatus[] = [
  'planning',
  'development', 
  'testing',
  'soft_launch',
  'live',
];

export function getPhaseTimeline(game: GameViewModel): Array<{
  phase: GameStatus;
  label: string;
  icon: string;
  status: 'completed' | 'current' | 'upcoming';
  color: string;
}> {
  const currentIndex = PHASE_ORDER.indexOf(game.status);
  
  return PHASE_ORDER.map((phase, index) => ({
    phase,
    label: STATUS_LABELS[phase],
    icon: PHASE_ICONS[phase],
    status: index < currentIndex ? 'completed' 
          : index === currentIndex ? 'current' 
          : 'upcoming',
    color: index <= currentIndex ? STATUS_COLORS[phase] : '#4B5563',
  }));
}
