/**
 * Game Progress Components - Prompt 5.6: Game Development Progress UI
 * 
 * Visual representation of game development with:
 * - Phase timeline
 * - Progress indicators
 * - Quality metrics
 * - Team assignment
 */

import React from 'react';
import { useGameDetails, useGamesByStatus } from '@presentation/hooks/useGames';
import { GameViewModel, PhaseInfo, MonetizationDisplay, TeamMember } from '@presentation/viewmodels/GameViewModel';
import { GameStatus } from '@domain/game';
import { Icon, IconName } from '@presentation/components/common/Icon';
import { useI18n } from '@infrastructure/i18n';

// =============================================================================
// Phase Timeline Component
// =============================================================================

export interface PhaseTimelineProps {
  currentPhase: PhaseInfo;
  onPhaseClick?: (phase: GameStatus) => void;
}

const PHASE_ORDER: GameStatus[] = [
  'planning',
  'development',
  'testing',
  'soft_launch',
  'live',
];

const PHASE_ICONS: Record<GameStatus, IconName> = {
  planning: 'document',
  development: 'programmer',
  testing: 'flask',
  soft_launch: 'rocket',
  live: 'games',
  maintenance: 'settings',
  shutdown: 'blocked',
};

export const PhaseTimeline: React.FC<PhaseTimelineProps> = ({ 
  currentPhase,
  onPhaseClick 
}) => {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase.current);

  return (
    <div className="w-full">
      {/* Timeline track */}
      <div className="relative flex items-center justify-between">
        {/* Background line */}
        <div className="absolute left-0 right-0 h-1 bg-gray-200 top-1/2 -translate-y-1/2" />
        
        {/* Progress line */}
        <div 
          className="absolute left-0 h-1 bg-blue-500 top-1/2 -translate-y-1/2 transition-all duration-500"
          style={{ 
            width: `${currentIndex >= 0 ? (currentIndex / (PHASE_ORDER.length - 1)) * 100 : 0}%` 
          }}
        />

        {/* Phase nodes */}
        {PHASE_ORDER.map((phase, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;

          return (
            <div
              key={phase}
              className="relative z-10 flex flex-col items-center"
              onClick={() => onPhaseClick?.(phase)}
            >
              {/* Node */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  transition-all duration-300 cursor-pointer
                  ${isComplete ? 'bg-blue-500 text-white' : ''}
                  ${isCurrent ? 'bg-blue-500 text-white ring-4 ring-blue-200 scale-110' : ''}
                  ${isFuture ? 'bg-gray-100 text-gray-400' : ''}
                `}
              >
                {isComplete ? <Icon name="check" size="sm" /> : <Icon name={PHASE_ICONS[phase]} size="sm" />}
              </div>

              {/* Label */}
              <span className={`
                mt-2 text-xs font-medium capitalize
                ${isCurrent ? 'text-blue-600' : 'text-gray-500'}
              `}>
                {phase.replace('_', ' ')}
              </span>

              {/* Progress indicator for current phase */}
              {isCurrent && currentPhase.progress > 0 && (
                <div className="mt-1 w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${currentPhase.progress}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// Game Card Component
// =============================================================================

export interface GameCardProps {
  game: GameViewModel;
  onSelect?: (game: GameViewModel) => void;
  onLaunch?: (gameId: string) => void;
  isSelected?: boolean;
  compact?: boolean;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  onSelect,
  onLaunch,
  isSelected = false,
  compact = false,
}) => {
  const { t } = useI18n();
  
  return (
    <div
      className={`
        bg-white rounded-xl border-2 shadow-sm transition-all duration-200
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}
        ${onSelect ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''}
        ${compact ? 'p-3' : 'p-4'}
      `}
      onClick={() => onSelect?.(game)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{game.genreIcon}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{game.name}</h3>
            <span className="text-sm text-gray-500">{game.genreLabel}</span>
          </div>
        </div>
        
        {/* Status badge */}
        <span
          className="px-2 py-1 text-xs font-medium rounded-full"
          style={{
            backgroundColor: game.statusColor + '20',
            color: game.statusColor,
          }}
        >
          {game.statusLabel}
        </span>
      </div>

      {/* Phase timeline (if in development) */}
      {game.isDevelopment && !compact && (
        <div className="mb-4">
          <PhaseTimeline currentPhase={game.phase} />
        </div>
      )}

      {/* Quality metrics */}
      {!compact && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {game.quality.metrics.slice(0, 3).map((metric) => (
            <div key={metric.name} className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold" style={{ color: metric.color }}>
                {metric.value}
              </div>
              <div className="text-xs text-gray-500">{metric.name}</div>
            </div>
          ))}
        </div>
      )}

      {/* Team */}
      {!compact && game.team.length > 0 && (
        <div className="flex items-center gap-1 mb-3">
          <span className="text-sm text-gray-500 mr-2">{t.gameProgressLabels.team}:</span>
          <TeamAvatars members={game.team} max={5} />
        </div>
      )}

      {/* Live game monetization */}
      {game.isLive && game.monetization && !compact && (
        <MonetizationSummary monetization={game.monetization} />
      )}

      {/* Actions */}
      {game.canLaunch && onLaunch && (
        <button
          className="w-full mt-3 py-2 bg-green-500 hover:bg-green-600 text-white 
                     rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          onClick={(e) => {
            e.stopPropagation();
            onLaunch(game.id);
          }}
        >
          <Icon name="rocket" size="sm" /> {t.games.launchGame}
        </button>
      )}

      {/* Footer info */}
      <div className="flex justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
        <span>{t.gameProgressLabels.started} {game.startDateFormatted}</span>
        {game.launchDateFormatted && (
          <span>{t.gameProgressLabels.launched} {game.launchDateFormatted}</span>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// Team Avatars Component
// =============================================================================

interface TeamAvatarsProps {
  members: TeamMember[];
  max?: number;
}

export const TeamAvatars: React.FC<TeamAvatarsProps> = ({ members, max = 5 }) => {
  const shown = members.slice(0, max);
  const remaining = members.length - max;

  return (
    <div className="flex -space-x-2">
      {shown.map((member) => (
        <div
          key={member.id}
          className="w-7 h-7 rounded-full flex items-center justify-center 
                     text-xs font-medium text-white border-2 border-white"
          style={{ backgroundColor: member.color }}
          title={`${member.name} (${member.role})`}
        >
          {member.initials}
        </div>
      ))}
      {remaining > 0 && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center 
                       text-xs font-medium bg-gray-300 text-gray-600 border-2 border-white">
          +{remaining}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Monetization Summary Component
// =============================================================================

interface MonetizationSummaryProps {
  monetization: MonetizationDisplay;
}

export const MonetizationSummary: React.FC<MonetizationSummaryProps> = ({ monetization }) => {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-2 gap-2 p-3 bg-green-50 rounded-lg">
      <div>
        <div className="text-lg font-bold text-green-600">
          {monetization.revenueFormatted}
        </div>
        <div className="text-xs text-green-600/70">{t.phaseInfo.monthlyRevenue}</div>
      </div>
      <div>
        <div className="text-lg font-bold text-blue-600">
          {monetization.dauFormatted}
        </div>
        <div className="text-xs text-blue-600/70">{t.metrics.dau}</div>
      </div>
    </div>
  );
};

// =============================================================================
// Progress Ring Component
// =============================================================================

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 80,
  strokeWidth = 6,
  color = '#3B82F6',
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500"
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (
          <span className="text-lg font-bold" style={{ color }}>
            {Math.round(progress)}%
          </span>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// Games Pipeline View
// =============================================================================

export interface GamesPipelineViewProps {
  onGameSelect?: (game: GameViewModel) => void;
}

export const GamesPipelineView: React.FC<GamesPipelineViewProps> = ({ onGameSelect }) => {
  const gamesByStatus = useGamesByStatus();
  const { t } = useI18n();

  // Pipeline phases with translations
  const pipelinePhases: { status: GameStatus; label: string; color: string }[] = [
    { status: 'planning', label: t.phases.planning.name, color: '#6B7280' },
    { status: 'development', label: t.phases.development.name, color: '#3B82F6' },
    { status: 'testing', label: t.phases.testing.name, color: '#F59E0B' },
    { status: 'soft_launch', label: t.phases.softLaunch.name, color: '#8B5CF6' },
    { status: 'live', label: t.phases.live.name, color: '#10B981' },
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {pipelinePhases.map(({ status, label, color }) => (
        <div key={status} className="flex-shrink-0 w-72">
          {/* Column header */}
          <div 
            className="flex items-center justify-between p-3 rounded-t-lg"
            style={{ backgroundColor: color + '20' }}
          >
            <h3 className="font-semibold" style={{ color }}>{label}</h3>
            <span 
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: color, color: 'white' }}
            >
              {gamesByStatus[status]?.length || 0}
            </span>
          </div>

          {/* Column content */}
          <div className="bg-gray-50 rounded-b-lg p-2 min-h-[200px] space-y-2">
            {gamesByStatus[status]?.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onSelect={onGameSelect}
                compact
              />
            ))}
            {(!gamesByStatus[status] || gamesByStatus[status].length === 0) && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No games
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// =============================================================================
// Games List View
// =============================================================================

export interface GamesListViewProps {
  games: GameViewModel[];
  onSelect?: (game: GameViewModel) => void;
  onLaunch?: (gameId: string) => void;
  selectedId?: string;
  emptyMessage?: string;
}

export const GamesListView: React.FC<GamesListViewProps> = ({
  games,
  onSelect,
  onLaunch,
  selectedId,
  emptyMessage = 'No games found',
}) => {
  if (games.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {games.map((game) => (
        <GameCard
          key={game.id}
          game={game}
          onSelect={onSelect}
          onLaunch={onLaunch}
          isSelected={game.id === selectedId}
        />
      ))}
    </div>
  );
};

// =============================================================================
// Game Detail Panel
// =============================================================================

export interface GameDetailPanelProps {
  gameId: string;
  onClose?: () => void;
  onLaunch?: (gameId: string) => void;
}

export const GameDetailPanel: React.FC<GameDetailPanelProps> = ({
  gameId,
  onClose,
  onLaunch,
}) => {
  const { t } = useI18n();
  const game = useGameDetails(gameId);

  if (!game) {
    return (
      <div className="p-6 text-center text-gray-500">
        Game not found
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div 
        className="p-6"
        style={{ backgroundColor: game.statusColor + '10' }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{game.genreIcon}</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{game.name}</h2>
              <p className="text-gray-600">{game.genreLabel} • {game.statusLabel}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icon name="close" size="md" className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      {game.isDevelopment && (
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-3">{t.phaseInfo.developmentProgress}</h3>
          <PhaseTimeline currentPhase={game.phase} />
        </div>
      )}

      {/* Quality */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-500 mb-3">{t.phaseInfo.qualityMetrics}</h3>
        <div className="flex justify-center gap-8">
          <ProgressRing progress={game.quality.overall} size={100}>
            <div className="text-center">
              <div className="text-xl font-bold">{game.quality.overall}</div>
              <div className="text-xs text-gray-500">{t.gameProgressLabels.overall}</div>
            </div>
          </ProgressRing>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {game.quality.metrics.map((metric) => (
            <div key={metric.name} className="text-center">
              <div className="text-lg font-semibold" style={{ color: metric.color }}>
                {metric.value}
              </div>
              <div className="text-xs text-gray-500">{metric.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-500 mb-3">
          Team ({game.teamSize} members)
        </h3>
        <div className="flex flex-wrap gap-2">
          {game.team.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center 
                           text-xs font-medium text-white"
                style={{ backgroundColor: member.color }}
              >
                {member.initials}
              </div>
              <div>
                <div className="text-sm font-medium">{member.name}</div>
                <div className="text-xs text-gray-500">{member.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monetization (if live) */}
      {game.isLive && game.monetization && (
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-3">{t.gameProgressLabels.performance}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">
                {game.monetization.revenueFormatted}
              </div>
              <div className="text-xs text-green-600/70">{t.phaseInfo.monthlyRevenue}</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">
                {game.monetization.dauFormatted}
              </div>
              <div className="text-xs text-blue-600/70">{t.metrics.dau}</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-xl font-bold text-purple-600">
                {game.monetization.arpuFormatted}
              </div>
              <div className="text-xs text-purple-600/70">{t.gameProgressLabels.arpu}</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-xl font-bold text-yellow-600">
                {game.monetization.playerSatisfaction}%
              </div>
              <div className="text-xs text-yellow-600/70">{t.gameProgressLabels.satisfaction}</div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-4 flex gap-3">
        {game.canLaunch && onLaunch && (
          <button
            className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white 
                       rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            onClick={() => onLaunch(game.id)}
          >
            <Icon name="rocket" size="sm" /> {t.games.launchGame}
          </button>
        )}
        {game.canShutdown && (
          <button
            className="flex-1 py-3 bg-red-100 hover:bg-red-200 text-red-600 
                       rounded-lg font-medium transition-colors"
          >
            {t.games.shutdown}
          </button>
        )}
      </div>
    </div>
  );
};

export default GamesPipelineView;
