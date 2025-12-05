/**
 * Difficulty Selection UI - Prompt 8.2
 */

import { useState } from 'react';
import { Icon } from '../common/Icon';
import {
  DifficultyMode,
  DifficultyConfig,
  DIFFICULTY_CONFIGS,
  getDifficultyManager,
} from '../../../domain/difficulty/Difficulty';

// =============================================================================
// Difficulty Selection Screen
// =============================================================================

interface DifficultySelectProps {
  onSelect: (mode: DifficultyMode) => void;
  currentMode?: DifficultyMode;
}

export function DifficultySelect({ onSelect, currentMode = 'standard' }: DifficultySelectProps) {
  const [selected, setSelected] = useState<DifficultyMode>(currentMode);
  const [showDetails, setShowDetails] = useState<DifficultyMode | null>(null);

  const modes: DifficultyMode[] = ['casual', 'standard', 'hardcore', 'sandbox'];

  const handleConfirm = () => {
    const manager = getDifficultyManager();
    manager.setMode(selected);
    onSelect(selected);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-white text-center mb-2">Select Difficulty</h2>
      <p className="text-gray-400 text-center mb-8">
        Choose how challenging you want your experience to be
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {modes.map(mode => {
          const config = DIFFICULTY_CONFIGS[mode];
          return (
            <DifficultyCard
              key={mode}
              config={config}
              isSelected={selected === mode}
              onSelect={() => setSelected(mode)}
              onShowDetails={() => setShowDetails(mode)}
            />
          );
        })}
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleConfirm}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
        >
          Start Game with {DIFFICULTY_CONFIGS[selected].name}
        </button>
      </div>

      {/* Details Modal */}
      {showDetails && (
        <DifficultyDetailsModal
          config={DIFFICULTY_CONFIGS[showDetails]}
          onClose={() => setShowDetails(null)}
        />
      )}
    </div>
  );
}

// =============================================================================
// Difficulty Card
// =============================================================================

interface DifficultyCardProps {
  config: DifficultyConfig;
  isSelected: boolean;
  onSelect: () => void;
  onShowDetails: () => void;
}

function DifficultyCard({ config, isSelected, onSelect, onShowDetails }: DifficultyCardProps) {
  const colorClasses: Record<string, string> = {
    green: 'border-green-500 bg-green-900/20',
    blue: 'border-blue-500 bg-blue-900/20',
    red: 'border-red-500 bg-red-900/20',
    yellow: 'border-yellow-500 bg-yellow-900/20',
  };

  const selectedClass = isSelected 
    ? colorClasses[config.color] 
    : 'border-gray-700 bg-gray-800 hover:border-gray-600';

  return (
    <div
      className={`
        relative p-6 rounded-xl border-2 cursor-pointer transition-all
        ${selectedClass}
        ${isSelected ? 'ring-2 ring-offset-2 ring-offset-gray-900' : ''}
      `}
      onClick={onSelect}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center">
          <Icon name="check" size="sm" className="text-green-600" />
        </div>
      )}

      {/* Icon and Name */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-4xl">{config.icon}</span>
        <h3 className="text-xl font-bold text-white">{config.name}</h3>
      </div>

      {/* Description */}
      <p className="text-gray-400 text-sm mb-4">{config.description}</p>

      {/* Quick Stats */}
      <div className="flex flex-wrap gap-2 mb-3">
        {!config.features.canFail && (
          <span className="px-2 py-1 bg-green-900/50 text-green-300 text-xs rounded">No Failure</span>
        )}
        {!config.features.achievementsEnabled && (
          <span className="px-2 py-1 bg-yellow-900/50 text-yellow-300 text-xs rounded">No Achievements</span>
        )}
        {config.features.leaderboardEnabled && (
          <span className="px-2 py-1 bg-blue-900/50 text-blue-300 text-xs rounded">Leaderboard</span>
        )}
      </div>

      {/* Details button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onShowDetails();
        }}
        className="text-sm text-blue-400 hover:text-blue-300"
      >
        View Details →
      </button>
    </div>
  );
}

// =============================================================================
// Difficulty Details Modal
// =============================================================================

interface DifficultyDetailsModalProps {
  config: DifficultyConfig;
  onClose: () => void;
}

function DifficultyDetailsModal({ config, onClose }: DifficultyDetailsModalProps) {
  const { modifiers } = config;

  const formatModifier = (value: number, isMultiplier = true): string => {
    if (isMultiplier) {
      if (value === 1) return '100%';
      return `${Math.round(value * 100)}%`;
    }
    return value > 0 ? `+${value}%` : `${value}%`;
  };

  const getModifierColor = (value: number, higherIsBetter = true): string => {
    if (value === 1 || value === 0) return 'text-gray-400';
    if (higherIsBetter) {
      return value > 1 || value > 0 ? 'text-green-400' : 'text-red-400';
    }
    return value < 1 || value < 0 ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{config.icon}</span>
            <div>
              <h3 className="text-xl font-bold text-white">{config.name}</h3>
              <p className="text-sm text-gray-400">{config.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        {/* Modifiers */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <h4 className="text-lg font-bold text-white mb-4">Modifiers</h4>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Economy */}
            <ModifierSection title="Economy">
              <ModifierRow label="Starting Money" value={formatModifier(modifiers.startingMoney)} color={getModifierColor(modifiers.startingMoney)} />
              <ModifierRow label="Revenue" value={formatModifier(modifiers.revenuMultiplier)} color={getModifierColor(modifiers.revenuMultiplier)} />
              <ModifierRow label="Costs" value={formatModifier(modifiers.costMultiplier)} color={getModifierColor(modifiers.costMultiplier, false)} />
              <ModifierRow label="Salary Growth" value={formatModifier(modifiers.salaryGrowthRate)} color={getModifierColor(modifiers.salaryGrowthRate, false)} />
            </ModifierSection>

            {/* Reputation */}
            <ModifierSection title="Reputation">
              <ModifierRow label="Starting Rep" value={formatModifier(modifiers.startingReputation)} color={getModifierColor(modifiers.startingReputation)} />
              <ModifierRow label="Rep Gains" value={formatModifier(modifiers.reputationGainMultiplier)} color={getModifierColor(modifiers.reputationGainMultiplier)} />
              <ModifierRow label="Rep Losses" value={formatModifier(modifiers.reputationLossMultiplier)} color={getModifierColor(modifiers.reputationLossMultiplier, false)} />
              <ModifierRow label="Volatility" value={formatModifier(modifiers.reputationVolatility)} color={getModifierColor(modifiers.reputationVolatility, false)} />
            </ModifierSection>

            {/* Development */}
            <ModifierSection title="Development">
              <ModifierRow label="Dev Speed" value={formatModifier(modifiers.developmentSpeed)} color={getModifierColor(modifiers.developmentSpeed)} />
              <ModifierRow label="Bug Chance" value={formatModifier(modifiers.bugChance)} color={getModifierColor(modifiers.bugChance, false)} />
              <ModifierRow label="Quality Variance" value={formatModifier(modifiers.qualityVariance)} color={getModifierColor(modifiers.qualityVariance, false)} />
            </ModifierSection>

            {/* Employees */}
            <ModifierSection title="Employees">
              <ModifierRow label="Skill Growth" value={formatModifier(modifiers.skillGrowthRate)} color={getModifierColor(modifiers.skillGrowthRate)} />
              <ModifierRow label="Morale Decay" value={formatModifier(modifiers.employeeMoraleDecay)} color={getModifierColor(modifiers.employeeMoraleDecay, false)} />
              <ModifierRow label="Quit Chance" value={formatModifier(modifiers.employeeQuitChance)} color={getModifierColor(modifiers.employeeQuitChance, false)} />
            </ModifierSection>

            {/* Gacha */}
            <ModifierSection title="Gacha">
              <ModifierRow label="Rate Bonus" value={formatModifier(modifiers.gachaRateBonus, false)} color={getModifierColor(modifiers.gachaRateBonus)} />
              <ModifierRow label="Pity Reduction" value={formatModifier(modifiers.pityReduction, false)} color={getModifierColor(modifiers.pityReduction)} />
            </ModifierSection>

            {/* Risk */}
            <ModifierSection title="Risk & Recovery">
              <ModifierRow label="Bankruptcy Time" value={formatModifier(modifiers.bankruptcyTolerance)} color={getModifierColor(modifiers.bankruptcyTolerance)} />
              <ModifierRow label="Debt Interest" value={formatModifier(modifiers.debtInterestRate)} color={getModifierColor(modifiers.debtInterestRate, false)} />
              <ModifierRow label="Recovery Speed" value={formatModifier(modifiers.recoverySpeed)} color={getModifierColor(modifiers.recoverySpeed)} />
            </ModifierSection>
          </div>

          {/* Features */}
          <h4 className="text-lg font-bold text-white mt-6 mb-4">Features</h4>
          <div className="grid grid-cols-2 gap-2">
            <FeatureRow label="Can Fail" enabled={config.features.canFail} />
            <FeatureRow label="Achievements" enabled={config.features.achievementsEnabled} />
            <FeatureRow label="Leaderboards" enabled={config.features.leaderboardEnabled} />
            <FeatureRow label="Forced Tutorial" enabled={config.features.tutorialForced} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ModifierSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <h5 className="text-sm font-bold text-gray-400 mb-2">{title}</h5>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function ModifierRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className={color}>{value}</span>
    </div>
  );
}

function FeatureRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={enabled ? 'text-green-400' : 'text-red-400'}>
        {enabled ? <Icon name="check" size="sm" /> : <Icon name="close" size="sm" />}
      </span>
      <span className="text-gray-400">{label}</span>
    </div>
  );
}

// =============================================================================
// Difficulty Badge (for display in game)
// =============================================================================

export function DifficultyBadge() {
  const manager = getDifficultyManager();
  const config = manager.getConfig();

  const colorClasses: Record<string, string> = {
    green: 'bg-green-900/50 text-green-300 border-green-700',
    blue: 'bg-blue-900/50 text-blue-300 border-blue-700',
    red: 'bg-red-900/50 text-red-300 border-red-700',
    yellow: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  };

  return (
    <span className={`
      px-2 py-1 rounded text-xs font-bold border
      ${colorClasses[config.color]}
    `}>
      {config.icon} {config.name}
    </span>
  );
}
