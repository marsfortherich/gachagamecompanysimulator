/**
 * Prestige UI Components - Prompt 7.3
 * 
 * UI for prestige flow, upgrade shop, and legacy management.
 */

import { useState, createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import { Icon } from '../common/Icon';
import {
  PrestigeState,
  PrestigeUpgrade,
  PrestigeUpgradeCategory,
  getUpgradesByCategory,
  getUpgradeLevel,
  getUpgradeCost,
  canPurchaseUpgrade,
  getAllEffects,
  type PrestigeEffectType,
} from '../../../domain/prestige/Prestige';
import {
  PrestigeCalculator,
  getPrestigeCalculator,
  calculateLegacyPoints,
  type RunSummary,
} from '../../../domain/prestige/PrestigeCalculator';

// =============================================================================
// Prestige Context
// =============================================================================

interface PrestigeContextState {
  calculator: PrestigeCalculator;
  state: PrestigeState;
  showPrestigeModal: boolean;
  showUpgradeShop: boolean;
}

type PrestigeAction =
  | { type: 'UPDATE_STATE'; state: PrestigeState }
  | { type: 'SHOW_PRESTIGE_MODAL' }
  | { type: 'HIDE_PRESTIGE_MODAL' }
  | { type: 'SHOW_UPGRADE_SHOP' }
  | { type: 'HIDE_UPGRADE_SHOP' };

const PrestigeContext = createContext<{
  state: PrestigeContextState;
  dispatch: React.Dispatch<PrestigeAction>;
} | null>(null);

function prestigeReducer(
  state: PrestigeContextState,
  action: PrestigeAction
): PrestigeContextState {
  switch (action.type) {
    case 'UPDATE_STATE':
      return { ...state, state: action.state };
    case 'SHOW_PRESTIGE_MODAL':
      return { ...state, showPrestigeModal: true };
    case 'HIDE_PRESTIGE_MODAL':
      return { ...state, showPrestigeModal: false };
    case 'SHOW_UPGRADE_SHOP':
      return { ...state, showUpgradeShop: true };
    case 'HIDE_UPGRADE_SHOP':
      return { ...state, showUpgradeShop: false };
    default:
      return state;
  }
}

export function PrestigeProvider({ children }: { children: ReactNode }) {
  const calculator = getPrestigeCalculator();
  
  const [state, dispatch] = useReducer(prestigeReducer, {
    calculator,
    state: calculator.getState(),
    showPrestigeModal: false,
    showUpgradeShop: false,
  });

  useEffect(() => {
    calculator.setOnStateChange((newState: PrestigeState) => {
      dispatch({ type: 'UPDATE_STATE', state: newState });
    });
  }, [calculator]);

  return (
    <PrestigeContext.Provider value={{ state, dispatch }}>
      {children}
    </PrestigeContext.Provider>
  );
}

export function usePrestige() {
  const context = useContext(PrestigeContext);
  if (!context) {
    throw new Error('usePrestige must be used within PrestigeProvider');
  }
  return context;
}

// =============================================================================
// Prestige Summary Screen
// =============================================================================

interface PrestigeSummaryProps {
  runSummary: RunSummary;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PrestigeSummary({ runSummary, onConfirm, onCancel }: PrestigeSummaryProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const breakdown = calculateLegacyPoints(runSummary);

  const handleConfirm = () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={onCancel} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-purple-900 to-gray-900 rounded-xl shadow-2xl overflow-hidden">
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent animate-pulse" />

        {/* Header */}
        <div className="relative p-6 text-center border-b border-purple-700">
          <h2 className="text-3xl font-bold text-purple-200 flex items-center justify-center gap-2"><Icon name="sparkles" size="md" className="text-purple-300" /> Prestige <Icon name="sparkles" size="md" className="text-purple-300" /></h2>
          <p className="text-purple-400 mt-2">
            Reset your progress to gain permanent Legacy Points
          </p>
        </div>

        {/* Run Summary */}
        <div className="p-6 grid grid-cols-2 gap-4">
          <StatBox label="Days Played" value={runSummary.daysPlayed} icon={<Icon name="calendar" size="md" />} />
          <StatBox label="Total Revenue" value={`$${formatNumber(runSummary.totalRevenue)}`} icon={<Icon name="money" size="md" />} />
          <StatBox label="Max Reputation" value={runSummary.maxReputation} icon={<Icon name="star" size="md" />} />
          <StatBox label="Games Launched" value={runSummary.gamesLaunched} icon={<Icon name="games" size="md" />} />
          <StatBox label="Peak Employees" value={runSummary.peakEmployees} icon={<Icon name="users" size="md" />} />
          <StatBox label="Achievements" value={runSummary.achievementsUnlocked} icon={<Icon name="trophy" size="md" />} />
        </div>

        {/* Legacy Points Breakdown */}
        <div className="p-6 bg-black/30">
          <h3 className="text-lg font-bold text-purple-200 mb-4">Legacy Points Earned</h3>
          
          <div className="space-y-2 text-sm">
            <BreakdownRow label="Base Points" value={breakdown.basePoints} />
            <BreakdownRow label="Revenue Bonus" value={breakdown.revenuePoints} />
            <BreakdownRow label="Reputation Bonus" value={breakdown.reputationPoints} />
            <BreakdownRow label="Games Bonus" value={breakdown.gamesPoints} />
            <BreakdownRow label="Employees Bonus" value={breakdown.employeesPoints} />
            <BreakdownRow label="Achievements Bonus" value={breakdown.achievementsPoints} />
            {breakdown.milestonePoints > 0 && (
              <BreakdownRow label="Milestones" value={breakdown.milestonePoints} highlight />
            )}
            {breakdown.speedBonus > 0 && (
              <BreakdownRow label="Speed Bonus" value={breakdown.speedBonus} highlight />
            )}
            <div className="border-t border-purple-700 pt-2 mt-2">
              <BreakdownRow label="Total" value={breakdown.totalPoints} isTotal />
            </div>
          </div>
        </div>

        {/* Milestones */}
        {breakdown.milestones.length > 0 && (
          <div className="p-6 border-t border-purple-700">
            <h3 className="text-lg font-bold text-purple-200 mb-3">Milestones Reached</h3>
            <div className="flex flex-wrap gap-2">
              {breakdown.milestones.map((m: { id: string; name: string }) => (
                <span 
                  key={m.id}
                  className="px-3 py-1 bg-purple-800/50 rounded-full text-sm text-purple-200"
                >
                  {m.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 flex gap-4 border-t border-purple-700">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`
              flex-1 px-4 py-3 rounded-lg font-bold transition-all
              ${isConfirming 
                ? 'bg-red-600 hover:bg-red-500 animate-pulse' 
                : 'bg-purple-600 hover:bg-purple-500'
              }
              text-white
            `}
          >
            {isConfirming ? <><Icon name="warning" size="sm" className="inline mr-1" /> Click Again to Confirm</> : `Prestige for ${breakdown.totalPoints} LP`}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-black/30 rounded-lg p-3 flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <div className="text-xs text-gray-400">{label}</div>
        <div className="text-lg font-bold text-white">{value}</div>
      </div>
    </div>
  );
}

function BreakdownRow({ 
  label, 
  value, 
  highlight = false, 
  isTotal = false 
}: { 
  label: string; 
  value: number; 
  highlight?: boolean; 
  isTotal?: boolean;
}) {
  return (
    <div className={`flex justify-between ${isTotal ? 'text-lg font-bold' : ''}`}>
      <span className={highlight ? 'text-yellow-400' : 'text-gray-400'}>{label}</span>
      <span className={`
        ${isTotal ? 'text-purple-300' : ''}
        ${highlight ? 'text-yellow-400' : 'text-white'}
      `}>
        +{value}
      </span>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
}

// =============================================================================
// Upgrade Shop
// =============================================================================

interface UpgradeShopProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeShop({ isOpen, onClose }: UpgradeShopProps) {
  const { state: contextState } = usePrestige();
  const [selectedCategory, setSelectedCategory] = useState<PrestigeUpgradeCategory>('starting');
  const { calculator, state } = contextState;

  const categories: { id: PrestigeUpgradeCategory; label: string; iconName: 'gift' | 'settings' | 'money' | 'users' | 'casino' | 'research' | 'star' }[] = [
    { id: 'starting', label: 'Starting', iconName: 'gift' },
    { id: 'production', label: 'Production', iconName: 'settings' },
    { id: 'financial', label: 'Financial', iconName: 'money' },
    { id: 'employees', label: 'Employees', iconName: 'users' },
    { id: 'gacha', label: 'Gacha', iconName: 'casino' },
    { id: 'research', label: 'Research', iconName: 'research' },
    { id: 'reputation', label: 'Reputation', iconName: 'star' },
  ];

  const upgrades = getUpgradesByCategory(selectedCategory);

  const handlePurchase = (upgradeId: string) => {
    calculator.purchaseUpgrade(upgradeId);
  };

  const handleRefundAll = () => {
    if (confirm('Refund all upgrades? Your Legacy Points will be restored.')) {
      calculator.refundAllUpgrades();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-purple-900 to-gray-900 border-b border-purple-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Icon name="shop" size="md" /> Upgrade Shop</h2>
            <p className="text-sm text-gray-400">Spend Legacy Points on permanent upgrades</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-purple-300 font-bold text-lg">
                {state.availableLegacyPoints} LP
              </div>
              <div className="text-xs text-gray-500">Available</div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex border-b border-gray-800 bg-gray-850 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`
                px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors
                ${selectedCategory === cat.id
                  ? 'text-purple-300 border-b-2 border-purple-500 bg-purple-900/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }
              `}
            >
              <Icon name={cat.iconName} size="sm" className="inline mr-1" /> {cat.label}
            </button>
          ))}
        </div>

        {/* Upgrades */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upgrades.map((upgrade: PrestigeUpgrade) => (
              <UpgradeCard
                key={upgrade.id as string}
                upgrade={upgrade}
                currentLevel={getUpgradeLevel(state, upgrade.id as string)}
                availablePoints={state.availableLegacyPoints}
                onPurchase={() => handlePurchase(upgrade.id as string)}
                state={state}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex justify-between items-center">
          <button
            onClick={handleRefundAll}
            className="px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Refund All Upgrades
          </button>
          <div className="text-sm text-gray-500">
            Total spent: {state.lifetimeLegacyPointsEarned - state.availableLegacyPoints} LP
          </div>
        </div>
      </div>
    </div>
  );
}

interface UpgradeCardProps {
  upgrade: PrestigeUpgrade;
  currentLevel: number;
  availablePoints: number;
  onPurchase: () => void;
  state: PrestigeState;
}

function UpgradeCard({ upgrade, currentLevel, onPurchase, state }: UpgradeCardProps) {
  const isMaxed = currentLevel >= upgrade.maxLevel;
  const cost = isMaxed ? 0 : getUpgradeCost(upgrade, currentLevel);
  const { canPurchase, reason } = canPurchaseUpgrade(state, upgrade);

  const effectValue = upgrade.effect.baseValue + (upgrade.effect.perLevel * (currentLevel + 1));
  const currentEffectValue = upgrade.effect.baseValue + (upgrade.effect.perLevel * currentLevel);

  return (
    <div className={`
      rounded-lg border-2 overflow-hidden transition-all
      ${isMaxed 
        ? 'border-yellow-600 bg-yellow-900/20' 
        : canPurchase 
          ? 'border-purple-600 bg-purple-900/20 hover:border-purple-400' 
          : 'border-gray-700 bg-gray-800/50'
      }
    `}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{upgrade.icon}</span>
            <div>
              <h4 className="font-bold text-white">{upgrade.name}</h4>
              <span className="text-xs text-gray-400">
                Level {currentLevel}/{upgrade.maxLevel}
              </span>
            </div>
          </div>
          {isMaxed && (
            <span className="px-2 py-1 bg-yellow-600 text-yellow-100 text-xs rounded font-bold">
              MAX
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-400 mb-3">{upgrade.description}</p>

        {/* Effect preview */}
        <div className="bg-black/30 rounded p-2 mb-3">
          {currentLevel > 0 && (
            <div className="text-xs text-gray-500">
              Current: {formatEffect(upgrade.effect, currentEffectValue)}
            </div>
          )}
          {!isMaxed && (
            <div className="text-sm text-green-400">
              {currentLevel > 0 ? 'Next: ' : ''}
              {formatEffect(upgrade.effect, effectValue)}
            </div>
          )}
        </div>

        {/* Level progress */}
        <div className="h-1 bg-gray-700 rounded-full mb-3 overflow-hidden">
          <div
            className={`h-full ${isMaxed ? 'bg-yellow-500' : 'bg-purple-500'}`}
            style={{ width: `${(currentLevel / upgrade.maxLevel) * 100}%` }}
          />
        </div>

        {/* Purchase button */}
        {!isMaxed && (
          <button
            onClick={onPurchase}
            disabled={!canPurchase}
            className={`
              w-full py-2 rounded font-bold text-sm transition-colors
              ${canPurchase
                ? 'bg-purple-600 hover:bg-purple-500 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {canPurchase ? `Buy for ${cost} LP` : reason}
          </button>
        )}
      </div>
    </div>
  );
}

function formatEffect(effect: { type: PrestigeEffectType; isPercentage: boolean }, value: number): string {
  const suffix = effect.isPercentage ? '%' : '';
  const prefix = value > 0 ? '+' : '';
  
  const labels: Record<PrestigeEffectType, string> = {
    startingMoney: 'Starting Money',
    startingReputation: 'Starting Reputation',
    devSpeedBonus: 'Dev Speed',
    gameQualityBonus: 'Game Quality',
    revenueMultiplier: 'Revenue',
    costReduction: 'Cost Reduction',
    employeeSkillBonus: 'Employee Skill',
    employeeMoraleBonus: 'Employee Morale',
    hiringCostReduction: 'Hiring Cost',
    gachaRateBonus: 'Gacha Rates',
    pityReduction: 'Pity Reduction',
    researchSpeedBonus: 'Research Speed',
    researchCostReduction: 'Research Cost',
    reputationGainBonus: 'Reputation Gain',
    marketShareBonus: 'Market Share',
    criticalSuccessChance: 'Crit Chance',
  };

  return `${labels[effect.type]}: ${prefix}${value}${suffix}`;
}

// =============================================================================
// Legacy Widget
// =============================================================================

interface LegacyWidgetProps {
  onClick: () => void;
}

export function LegacyWidget({ onClick }: LegacyWidgetProps) {
  const { state: contextState } = usePrestige();
  const { state } = contextState;

  return (
    <button
      onClick={onClick}
      className="
        flex items-center gap-3 px-4 py-2 
        bg-gradient-to-r from-purple-900 to-gray-800 
        hover:from-purple-800 hover:to-gray-700
        rounded-lg border border-purple-700
        transition-all
      "
    >
      <Icon name="sparkles" size="md" className="text-purple-300" />
      <div className="text-left">
        <div className="text-sm font-bold text-purple-200">
          {state.availableLegacyPoints} LP
        </div>
        <div className="text-xs text-gray-400">
          Run #{state.currentRun}
        </div>
      </div>
    </button>
  );
}

// =============================================================================
// Active Effects Display
// =============================================================================

export function ActiveEffectsDisplay() {
  const { state: contextState } = usePrestige();
  const effects = getAllEffects(contextState.state);
  
  const activeEffects = Object.entries(effects)
    .filter(([_, value]) => value > 0)
    .map(([type, value]) => ({ type: type as PrestigeEffectType, value }));

  if (activeEffects.length === 0) {
    return null;
  }

  const effectLabels: Record<PrestigeEffectType, { label: string; iconName: 'money' | 'star' | 'bolt' | 'sparkles' | 'chart-up' | 'expense' | 'book' | 'happy' | 'handshake' | 'clover' | 'casino' | 'research' | 'document' | 'megaphone' | 'trophy' | 'target' }> = {
    startingMoney: { label: 'Starting $', iconName: 'money' },
    startingReputation: { label: 'Starting Rep', iconName: 'star' },
    devSpeedBonus: { label: 'Dev Speed', iconName: 'bolt' },
    gameQualityBonus: { label: 'Quality', iconName: 'sparkles' },
    revenueMultiplier: { label: 'Revenue', iconName: 'chart-up' },
    costReduction: { label: 'Cost -', iconName: 'expense' },
    employeeSkillBonus: { label: 'Skill', iconName: 'book' },
    employeeMoraleBonus: { label: 'Morale', iconName: 'happy' },
    hiringCostReduction: { label: 'Hire -', iconName: 'handshake' },
    gachaRateBonus: { label: 'Gacha', iconName: 'clover' },
    pityReduction: { label: 'Pity -', iconName: 'casino' },
    researchSpeedBonus: { label: 'Research', iconName: 'research' },
    researchCostReduction: { label: 'R&D -', iconName: 'document' },
    reputationGainBonus: { label: 'Rep +', iconName: 'megaphone' },
    marketShareBonus: { label: 'Market', iconName: 'trophy' },
    criticalSuccessChance: { label: 'Crit', iconName: 'target' },
  };

  return (
    <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-3">
      <h4 className="text-xs text-purple-400 font-bold uppercase mb-2">Active Legacy Bonuses</h4>
      <div className="flex flex-wrap gap-2">
        {activeEffects.map(({ type, value }) => {
          const config = effectLabels[type];
          return (
            <span
              key={type}
              className="px-2 py-1 bg-purple-800/50 rounded text-xs text-purple-200"
              title={config.label}
            >
              <Icon name={config.iconName} size="sm" className="inline mr-1" /> +{value}%
            </span>
          );
        })}
      </div>
    </div>
  );
}
