/**
 * Phase Info Components - In-game help system for development phases
 * 
 * Provides tooltips, breakdowns, and help modals explaining:
 * - How each development phase works
 * - What affects progress speed
 * - Team effectiveness formula
 */

import React, { useState, useMemo } from 'react';
import { Icon } from '../common/Icon';

// =============================================================================
// Phase Configuration Data
// =============================================================================

/**
 * Phase configuration with requirements and tips
 * This data is derived from GameDevelopmentManager.ts DEVELOPMENT_PHASES
 */
export interface PhaseInfoData {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly requirements: readonly string[];
  readonly tips: readonly string[];
  readonly baseProgressPerTick: number;
  readonly qualityMultiplier: number;
}

export const PHASE_INFO: Record<string, PhaseInfoData> = {
  planning: {
    id: 'planning',
    name: 'Planning',
    description: 'Define the game concept, target audience, and core mechanics.',
    requirements: [
      'Reach 100% progress to complete',
      'Progress speed depends on team effectiveness',
    ],
    tips: [
      'Assign employees with high game_design skills',
      'A Producer can help coordinate the team',
      'Higher team morale = faster progress',
    ],
    baseProgressPerTick: 2.0,
    qualityMultiplier: 0.3,
  },
  development: {
    id: 'development',
    name: 'Development',
    description: 'Build the game - programming, art, and content creation.',
    requirements: [
      'Reach 100% progress to complete',
      'This is the longest phase',
      'Quality improvements are highest here',
    ],
    tips: [
      'Balance your team: Programmers, Artists, and Designers',
      'More employees = faster progress (up to 5)',
      'Diverse roles give a coverage bonus',
    ],
    baseProgressPerTick: 1.0,
    qualityMultiplier: 1.0,
  },
  testing: {
    id: 'testing',
    name: 'Testing',
    description: 'QA, bug fixing, and polish. Find and fix issues before launch.',
    requirements: [
      'Reach 100% progress to complete',
      'No minimum quality requirement',
      'Faster than development phase',
    ],
    tips: [
      'Programmers help fix bugs faster',
      'Designers ensure gameplay feels right',
      "Don't rush - quality improvements still happen",
      'Team effectiveness = skill avg × 0.4 + team size × 0.2 + morale × 0.2 + role coverage × 0.2',
    ],
    baseProgressPerTick: 1.5,
    qualityMultiplier: 0.6,
  },
  soft_launch: {
    id: 'soft_launch',
    name: 'Soft Launch',
    description: 'Limited release to gather feedback and metrics.',
    requirements: [
      'Reach 100% progress to complete',
      'Players start joining (limited)',
      'Revenue begins flowing',
    ],
    tips: [
      'Monitor player feedback',
      'Marketers help with player acquisition',
      'Good time to adjust monetization',
    ],
    baseProgressPerTick: 1.2,
    qualityMultiplier: 0.4,
  },
  live: {
    id: 'live',
    name: 'Live',
    description: 'Game is fully launched and operating.',
    requirements: [
      'No progress requirement - game is live!',
      'Focus shifts to content updates',
      'Revenue is maximized',
    ],
    tips: [
      'Regular content updates retain players',
      'Watch for player churn',
      'Consider new banners and events',
    ],
    baseProgressPerTick: 0,
    qualityMultiplier: 0.2,
  },
  maintenance: {
    id: 'maintenance',
    name: 'Maintenance',
    description: 'Minimal updates, game is winding down.',
    requirements: [
      'Reduced revenue',
      'Minimal team needed',
    ],
    tips: [
      'Consider sunsetting or reviving with major update',
      'Reallocate team to new projects',
    ],
    baseProgressPerTick: 0,
    qualityMultiplier: 0,
  },
};

// =============================================================================
// Team Effectiveness Calculation
// =============================================================================

/**
 * Breakdown of team effectiveness factors
 */
export interface TeamEffectivenessBreakdown {
  readonly skillScore: number;      // 40% weight
  readonly sizeScore: number;       // 20% weight
  readonly moraleScore: number;     // 20% weight
  readonly coverageScore: number;   // 20% weight
  readonly total: number;
}

export interface TeamMemberForCalculation {
  readonly skills: Record<string, number>;
  readonly morale: number;
  readonly role: string;
}

/**
 * Calculate team effectiveness breakdown for display
 */
export function calculateTeamEffectivenessBreakdown(
  employees: readonly TeamMemberForCalculation[]
): TeamEffectivenessBreakdown {
  if (employees.length === 0) {
    return { skillScore: 0, sizeScore: 0, moraleScore: 0, coverageScore: 0, total: 0 };
  }

  // Average skill (average of all skills per employee, then average across team)
  const avgSkill = employees.reduce((sum, emp) => {
    const skills = Object.values(emp.skills);
    const empAvg = skills.length > 0 
      ? skills.reduce((s, v) => s + v, 0) / skills.length 
      : 0;
    return sum + empAvg;
  }, 0) / employees.length;

  // Average morale
  const avgMorale = employees.reduce((sum, emp) => sum + emp.morale, 0) / employees.length;

  // Unique roles
  const uniqueRoles = new Set(employees.map(e => e.role)).size;

  // Calculate scores (skills are typically 0-100, normalize to 0-1)
  const normalizedSkill = Math.min(avgSkill / 100, 1);
  const skillScore = normalizedSkill * 0.4;
  const sizeScore = Math.min(employees.length / 5, 1) * 0.2;
  const moraleScore = (avgMorale / 100) * 0.2;
  const coverageScore = Math.min(uniqueRoles / 5, 1) * 0.2;

  return {
    skillScore,
    sizeScore,
    moraleScore,
    coverageScore,
    total: skillScore + sizeScore + moraleScore + coverageScore,
  };
}

// =============================================================================
// Phase Info Tooltip Component
// =============================================================================

export interface PhaseInfoTooltipProps {
  phaseId: string;
  children: React.ReactNode;
}

/**
 * Tooltip that shows phase information on hover
 */
export const PhaseInfoTooltip: React.FC<PhaseInfoTooltipProps> = ({ phaseId, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const info = PHASE_INFO[phaseId];

  if (!info) {
    return <>{children}</>;
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      tabIndex={0}
      role="button"
      aria-label={`Info about ${info.name} phase`}
    >
      {children}
      
      {isVisible && (
        <div 
          className="absolute z-50 w-72 p-4 bg-slate-800 border border-slate-600 rounded-lg shadow-xl -top-2 left-full ml-2"
          role="tooltip"
        >
          <h4 className="font-bold text-white mb-2">{info.name} Phase</h4>
          <p className="text-sm text-slate-300 mb-3">{info.description}</p>
          
          <div className="mb-3">
            <h5 className="text-xs font-semibold text-slate-400 uppercase mb-1">Requirements</h5>
            <ul className="text-sm text-slate-300 space-y-1">
              {info.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  {req}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h5 className="text-xs font-semibold text-slate-400 uppercase mb-1">Tips</h5>
            <ul className="text-sm text-green-300 space-y-1">
              {info.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Icon name="lightbulb" size="sm" className="text-green-400" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
          
          {info.baseProgressPerTick > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-600">
              <p className="text-xs text-slate-400">
                Base progress: <span className="text-white">{info.baseProgressPerTick}</span> per day
              </p>
              <p className="text-xs text-slate-400">
                Quality gain: <span className="text-white">{info.qualityMultiplier * 100}%</span> of base
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Progress Breakdown Panel Component
// =============================================================================

export interface ProgressBreakdownPanelProps {
  breakdown: TeamEffectivenessBreakdown;
  currentPhase: string;
}

/**
 * Shows detailed breakdown of what affects progress speed
 */
export const ProgressBreakdownPanel: React.FC<ProgressBreakdownPanelProps> = ({ 
  breakdown, 
  currentPhase 
}) => {
  const phaseInfo = PHASE_INFO[currentPhase];
  const baseProgress = phaseInfo?.baseProgressPerTick ?? 1;
  const actualProgress = baseProgress * breakdown.total;

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
        <Icon name="chart-up" size="sm" className="text-blue-400" />
        Progress Speed Breakdown
      </h4>
      
      <div className="space-y-2">
        <BreakdownBar 
          label="Team Skills" 
          value={breakdown.skillScore} 
          maxValue={0.4}
          color="blue"
          description="Average skill level (40% weight)"
        />
        <BreakdownBar 
          label="Team Size" 
          value={breakdown.sizeScore} 
          maxValue={0.2}
          color="green"
          description="Optimal at 5+ employees (20% weight)"
        />
        <BreakdownBar 
          label="Morale" 
          value={breakdown.moraleScore} 
          maxValue={0.2}
          color="yellow"
          description="Average team morale (20% weight)"
        />
        <BreakdownBar 
          label="Role Coverage" 
          value={breakdown.coverageScore} 
          maxValue={0.2}
          color="purple"
          description="Unique roles in team (20% weight)"
        />
      </div>
      
      <div className="mt-4 pt-3 border-t border-slate-600">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Team Effectiveness:</span>
          <span className={`font-bold ${getEffectivenessColor(breakdown.total)}`}>
            {(breakdown.total * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-slate-400">Base Progress/Day:</span>
          <span className="text-white">{baseProgress.toFixed(1)}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-slate-400">Actual Progress/Day:</span>
          <span className="text-green-400 font-bold">{actualProgress.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-slate-400">Days to Complete:</span>
          <span className="text-white">
            {actualProgress > 0 ? Math.ceil(100 / actualProgress) : '∞'}
          </span>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Breakdown Bar Component
// =============================================================================

interface BreakdownBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: 'blue' | 'green' | 'yellow' | 'purple';
  description: string;
}

const BreakdownBar: React.FC<BreakdownBarProps> = ({ 
  label, 
  value, 
  maxValue, 
  color, 
  description 
}) => {
  const percentage = (value / maxValue) * 100;
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="group relative">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">
          {(value * 100).toFixed(0)}% / {(maxValue * 100).toFixed(0)}%
        </span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClasses[color]} transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="hidden group-hover:block absolute z-10 bg-slate-900 text-xs text-slate-300 p-2 rounded mt-1 w-48">
        {description}
      </div>
    </div>
  );
};

function getEffectivenessColor(effectiveness: number): string {
  if (effectiveness >= 0.8) return 'text-green-400';
  if (effectiveness >= 0.5) return 'text-yellow-400';
  if (effectiveness >= 0.3) return 'text-orange-400';
  return 'text-red-400';
}

// =============================================================================
// Phase Help Modal Component
// =============================================================================

export interface PhaseHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Full help modal explaining all development phases
 */
export const PhaseHelpModal: React.FC<PhaseHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="phase-help-title"
    >
      <div 
        className="bg-slate-800 rounded-xl max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 id="phase-help-title" className="text-xl font-bold text-white">
            <Icon name="book" size="md" className="text-blue-400" /> Game Development Guide
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Overview */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-2">How Development Works</h3>
            <p className="text-slate-300 text-sm">
              Each game goes through several phases before launch. To complete a phase, 
              you need to reach <strong className="text-white">100% progress</strong>. 
              Progress speed depends on your team&apos;s effectiveness.
            </p>
          </section>
          
          {/* Team Effectiveness */}
          <section className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">
              <Icon name="chart-up" size="sm" className="text-purple-400 inline" /> Team Effectiveness Formula
            </h3>
            <div className="text-sm text-slate-300 space-y-2">
              <p>Your team&apos;s effectiveness determines how fast you progress:</p>
              <code className="block bg-slate-900 p-3 rounded text-green-400 text-xs">
                Effectiveness = (Skills × 0.4) + (Size × 0.2) + (Morale × 0.2) + (Coverage × 0.2)
              </code>
              <ul className="space-y-1 mt-2">
                <li><strong className="text-blue-400">Skills (40%):</strong> Average skill level of assigned employees</li>
                <li><strong className="text-green-400">Size (20%):</strong> Team size, optimal at 5+ employees</li>
                <li><strong className="text-yellow-400">Morale (20%):</strong> Average morale of the team</li>
                <li><strong className="text-purple-400">Coverage (20%):</strong> Diversity of roles (Programmer, Artist, Designer, etc.)</li>
              </ul>
            </div>
          </section>
          
          {/* Phase Details */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3">Development Phases</h3>
            <div className="space-y-4">
              {Object.values(PHASE_INFO).map(phase => (
                <PhaseCard key={phase.id} phase={phase} />
              ))}
            </div>
          </section>
          
          {/* Quick Tips */}
          <section className="bg-green-900/30 border border-green-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-400 mb-2 flex items-center gap-2"><Icon name="lightbulb" size="sm" /> Quick Tips</h3>
            <ul className="text-sm text-slate-300 space-y-2">
              <li>• <strong>Assign employees</strong> to your game project to make progress</li>
              <li>• <strong>Balance your team</strong> - mix different roles for the coverage bonus</li>
              <li>• <strong>Keep morale high</strong> - happy employees work faster</li>
              <li>• <strong>Don&apos;t rush</strong> - quality improvements happen during development</li>
              <li>• <strong>Check the breakdown</strong> - see exactly what&apos;s affecting your speed</li>
            </ul>
          </section>
        </div>
        
        <div className="sticky bottom-0 bg-slate-800 p-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Phase Card Component (for help modal)
// =============================================================================

interface PhaseCardProps {
  phase: PhaseInfoData;
}

const PhaseCard: React.FC<PhaseCardProps> = ({ phase }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const phaseIconNames: Record<string, 'planning' | 'development' | 'testing' | 'launch' | 'live' | 'maintenance'> = {
    planning: 'planning',
    development: 'development',
    testing: 'testing',
    soft_launch: 'launch',
    live: 'live',
    maintenance: 'maintenance',
  };

  return (
    <div className="border border-slate-600 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between bg-slate-700 hover:bg-slate-600 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon name={phaseIconNames[phase.id] || 'games'} size="md" className="text-blue-400" />
          <div className="text-left">
            <h4 className="font-semibold text-white">{phase.name}</h4>
            <p className="text-xs text-slate-400">{phase.description}</p>
          </div>
        </div>
        <span className="text-slate-400">{isExpanded ? '▲' : '▼'}</span>
      </button>
      
      {isExpanded && (
        <div className="p-3 bg-slate-800 space-y-3">
          <div>
            <h5 className="text-xs font-semibold text-slate-400 uppercase mb-1">Requirements</h5>
            <ul className="text-sm text-slate-300 space-y-1">
              {phase.requirements.map((req, i) => (
                <li key={i}>• {req}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <h5 className="text-xs font-semibold text-slate-400 uppercase mb-1">Tips</h5>
            <ul className="text-sm text-green-300 space-y-1">
              {phase.tips.map((tip, i) => (
                <li key={i} className="flex items-center gap-2"><Icon name="lightbulb" size="sm" className="text-green-400" /> {tip}</li>
              ))}
            </ul>
          </div>
          
          {phase.baseProgressPerTick > 0 && (
            <div className="flex gap-4 text-xs text-slate-400 pt-2 border-t border-slate-700">
              <span>Base speed: {phase.baseProgressPerTick}/day</span>
              <span>Quality gain: {phase.qualityMultiplier * 100}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Game Progress With Help Component
// =============================================================================

export interface GameProgressWithHelpProps {
  game: {
    id: string;
    name: string;
    status: string;
    developmentProgress: number;
  };
  assignedEmployees: readonly TeamMemberForCalculation[];
}

/**
 * Enhanced game progress display with help system
 */
export const GameProgressWithHelp: React.FC<GameProgressWithHelpProps> = ({
  game,
  assignedEmployees,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const breakdown = useMemo(
    () => calculateTeamEffectivenessBreakdown(assignedEmployees),
    [assignedEmployees]
  );
  
  const phaseInfo = PHASE_INFO[game.status];
  const baseProgress = phaseInfo?.baseProgressPerTick ?? 1;
  const actualProgress = baseProgress * breakdown.total;
  const daysRemaining = actualProgress > 0 
    ? Math.ceil((100 - game.developmentProgress) / actualProgress) 
    : Infinity;

  const isActivePhase = game.status !== 'live' && game.status !== 'maintenance' && game.status !== 'shutdown';

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      {/* Header with help button */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{game.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <PhaseInfoTooltip phaseId={game.status}>
              <span className="text-sm text-blue-400 cursor-help underline decoration-dotted">
                {phaseInfo?.name ?? game.status}
              </span>
            </PhaseInfoTooltip>
            <button
              onClick={() => setShowHelp(true)}
              className="text-slate-400 hover:text-white text-sm"
              aria-label="Open development guide"
            >
              <Icon name="question" size="sm" />
            </button>
          </div>
        </div>
        
        {isActivePhase && (
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded"
          >
            {showBreakdown ? 'Hide Details' : 'Show Details'}
          </button>
        )}
      </div>

      {/* Progress bar */}
      {isActivePhase && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">Progress</span>
            <span className="text-white">{game.developmentProgress.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300"
              style={{ width: `${Math.min(game.developmentProgress, 100)}%` }}
            />
          </div>
          
          {/* Time estimate */}
          <div className="flex justify-between text-xs mt-1 text-slate-400">
            <span>
              Speed: {actualProgress.toFixed(2)}/day
              {breakdown.total < 0.3 && breakdown.total > 0 && (
                <span className="text-red-400 ml-1">(slow!)</span>
              )}
            </span>
            <span>
              {daysRemaining === Infinity 
                ? 'No team assigned!' 
                : `~${daysRemaining} days remaining`}
            </span>
          </div>
        </div>
      )}

      {/* Team info */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-slate-400">Team:</span>
        {assignedEmployees.length === 0 ? (
          <span className="text-sm text-red-400 flex items-center gap-1"><Icon name="warning" size="sm" /> No employees assigned!</span>
        ) : (
          <div className="flex -space-x-2">
            {assignedEmployees.slice(0, 5).map((emp, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-slate-600 border-2 border-slate-800 flex items-center justify-center text-xs text-white"
                title={emp.role}
              >
                {emp.role.charAt(0)}
              </div>
            ))}
            {assignedEmployees.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-slate-600 border-2 border-slate-800 flex items-center justify-center text-xs text-white">
                +{assignedEmployees.length - 5}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Effectiveness breakdown (collapsible) */}
      {showBreakdown && isActivePhase && (
        <ProgressBreakdownPanel 
          breakdown={breakdown} 
          currentPhase={game.status} 
        />
      )}

      {/* Warning messages */}
      {assignedEmployees.length === 0 && isActivePhase && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mt-3">
          <p className="text-sm text-red-300">
            <strong><Icon name="warning" size="sm" className="inline mr-1" /> No Progress!</strong> Assign employees to this project to make progress.
            <button 
              onClick={() => setShowHelp(true)}
              className="ml-2 text-red-400 underline"
            >
              Learn more
            </button>
          </p>
        </div>
      )}

      {breakdown.total < 0.3 && breakdown.total > 0 && assignedEmployees.length > 0 && isActivePhase && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 mt-3">
          <p className="text-sm text-yellow-300">
            <strong><Icon name="warning" size="sm" className="inline mr-1" /> Low Effectiveness!</strong> Your team could be more productive.
            <button 
              onClick={() => setShowBreakdown(true)}
              className="ml-2 text-yellow-400 underline"
            >
              See breakdown
            </button>
          </p>
        </div>
      )}

      {/* Help Modal */}
      <PhaseHelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
};
