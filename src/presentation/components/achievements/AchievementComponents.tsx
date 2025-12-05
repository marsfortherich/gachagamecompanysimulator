/**
 * Achievement UI Components - Prompt 7.2
 * 
 * UI for displaying achievements, progress, and notifications.
 */

import { useState, useEffect, useCallback, createContext, useContext, useReducer, type ReactNode } from 'react';
import { Icon } from '../common/Icon';
import type { Achievement, AchievementCategory, AchievementRarity, AchievementProgress } from '../../../domain/achievements/Achievement';
import {
  ACHIEVEMENTS,
  calculateAchievementPoints,
  ACHIEVEMENT_RARITY_CONFIG,
} from '../../../domain/achievements/Achievement';
import { AchievementManager, getAchievementManager } from '../../../domain/achievements/AchievementManager';

// =============================================================================
// Achievement Context
// =============================================================================

interface AchievementContextState {
  manager: AchievementManager;
  unlockedIds: Set<string>;
  recentUnlocks: Achievement[];
  showNotification: Achievement | null;
}

type AchievementAction =
  | { type: 'UNLOCK'; achievement: Achievement }
  | { type: 'DISMISS_NOTIFICATION' }
  | { type: 'LOAD_STATE'; unlockedIds: string[] };

const AchievementContext = createContext<{
  state: AchievementContextState;
  dispatch: React.Dispatch<AchievementAction>;
} | null>(null);

function achievementReducer(
  state: AchievementContextState,
  action: AchievementAction
): AchievementContextState {
  switch (action.type) {
    case 'UNLOCK': {
      const newUnlockedIds = new Set(state.unlockedIds);
      newUnlockedIds.add(action.achievement.id);
      return {
        ...state,
        unlockedIds: newUnlockedIds,
        recentUnlocks: [action.achievement, ...state.recentUnlocks].slice(0, 10),
        showNotification: action.achievement,
      };
    }
    case 'DISMISS_NOTIFICATION':
      return {
        ...state,
        showNotification: null,
      };
    case 'LOAD_STATE': {
      return {
        ...state,
        unlockedIds: new Set(action.unlockedIds),
      };
    }
    default:
      return state;
  }
}

export function AchievementProvider({ children }: { children: ReactNode }) {
  const manager = getAchievementManager();
  
  const [state, dispatch] = useReducer(achievementReducer, {
    manager,
    unlockedIds: new Set(Object.keys(manager.getState().unlocked)),
    recentUnlocks: [],
    showNotification: null,
  });

  // Set up unlock callback
  useEffect(() => {
    manager.setOnUnlock((achievement: Achievement) => {
      dispatch({ type: 'UNLOCK', achievement });
    });
  }, [manager]);

  return (
    <AchievementContext.Provider value={{ state, dispatch }}>
      {children}
    </AchievementContext.Provider>
  );
}

export function useAchievements() {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements must be used within AchievementProvider');
  }
  return context;
}

// =============================================================================
// Achievement Toast Notification
// =============================================================================

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
  duration?: number;
}

export function AchievementToast({ 
  achievement, 
  onDismiss, 
  duration = 5000 
}: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    const enterTimer = setTimeout(() => setIsVisible(true), 50);
    
    // Auto dismiss
    const dismissTimer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(onDismiss, 300);
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [duration, onDismiss]);

  const rarityConfig = ACHIEVEMENT_RARITY_CONFIG[achievement.rarity];
  const points = calculateAchievementPoints(achievement.rarity);

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm
        transform transition-all duration-300 ease-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      role="alert"
      aria-live="polite"
    >
      <div
        className={`
          rounded-lg shadow-2xl overflow-hidden
          border-2 ${rarityConfig.borderColor}
          bg-gray-900 text-white
        `}
      >
        {/* Shine effect for legendary */}
        {achievement.rarity === 'legendary' && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent animate-shine" />
        )}
        
        {/* Header */}
        <div className={`px-4 py-2 ${rarityConfig.bgColor} flex items-center justify-between`}>
          <span className="text-sm font-bold uppercase tracking-wider">
            Achievement Unlocked!
          </span>
          <button
            onClick={() => {
              setIsLeaving(true);
              setTimeout(onDismiss, 300);
            }}
            className="text-white/80 hover:text-white"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex items-start gap-4">
          {/* Icon */}
          <div className={`
            w-12 h-12 rounded-lg flex items-center justify-center text-2xl
            ${rarityConfig.bgColor} ${rarityConfig.borderColor} border-2
          `}>
            {achievement.icon}
          </div>

          {/* Text */}
          <div className="flex-1">
            <h3 className="font-bold text-lg">{achievement.name}</h3>
            <p className="text-gray-300 text-sm mt-1">{achievement.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs font-bold uppercase ${rarityConfig.color}`}>
                {achievement.rarity}
              </span>
              <span className="text-yellow-400 text-sm font-bold">
                +{points} pts
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Achievement Card
// =============================================================================

interface AchievementCardProps {
  achievement: Achievement;
  progress: AchievementProgress;
  isUnlocked: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  showHidden?: boolean;
}

export function AchievementCard({
  achievement,
  progress,
  isUnlocked,
  isFavorite,
  onToggleFavorite,
  showHidden = false,
}: AchievementCardProps) {
  const isHidden = achievement.category === 'hidden' && !isUnlocked && !showHidden;
  const rarityConfig = ACHIEVEMENT_RARITY_CONFIG[achievement.rarity];
  const points = calculateAchievementPoints(achievement.rarity);

  return (
    <div
      className={`
        relative rounded-lg border-2 overflow-hidden transition-all duration-200
        ${isUnlocked 
          ? `${rarityConfig.borderColor} bg-gray-800` 
          : 'border-gray-700 bg-gray-900 opacity-75'
        }
        hover:scale-[1.02] hover:shadow-lg
      `}
    >
      {/* Locked overlay for hidden */}
      {isHidden && (
        <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center z-10">
          <Icon name="lock" size="lg" className="text-gray-500" />
        </div>
      )}

      {/* Favorite button */}
      <button
        onClick={onToggleFavorite}
        className={`
          absolute top-2 right-2 z-20
          transition-transform hover:scale-125
          ${isFavorite ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400/50'}
        `}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Icon name="star" size="md" />
      </button>

      {/* Content */}
      <div className="p-4">
        {/* Icon and Title */}
        <div className="flex items-start gap-3">
          <div className={`
            w-10 h-10 rounded flex items-center justify-center text-xl
            ${isUnlocked ? rarityConfig.bgColor : 'bg-gray-700'}
          `}>
            {isHidden ? '?' : achievement.icon}
          </div>
          <div className="flex-1">
            <h4 className={`font-bold ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>
              {isHidden ? '???' : achievement.name}
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              {isHidden ? 'Hidden achievement' : achievement.description}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        {!isUnlocked && !isHidden && progress.targetValue > 1 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{progress.currentValue} / {progress.targetValue}</span>
              <span>{Math.round(progress.percentage)}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${rarityConfig.bgColor} transition-all duration-300`}
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-700">
          <span className={`text-xs font-bold uppercase ${rarityConfig.color}`}>
            {achievement.rarity}
          </span>
          <span className={`text-xs font-bold ${isUnlocked ? 'text-yellow-400' : 'text-gray-600'}`}>
            {points} pts
          </span>
        </div>

        {/* Unlock date */}
        {isUnlocked && progress.unlockedAt && (
          <div className="text-xs text-gray-500 mt-2">
            Unlocked: {new Date(progress.unlockedAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Achievement Panel
// =============================================================================

type SortOption = 'name' | 'rarity' | 'progress' | 'unlocked';
type FilterOption = 'all' | 'unlocked' | 'locked' | AchievementCategory;

interface AchievementPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AchievementPanel({ isOpen, onClose }: AchievementPanelProps) {
  const { state } = useAchievements();
  const [filter, setFilter] = useState<FilterOption>('all');
  const [sort, setSort] = useState<SortOption>('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHidden, setShowHidden] = useState(false);

  const stats = state.manager.getStats();

  // Filter and sort achievements
  const filteredAchievements = useCallback(() => {
    let achievements = [...ACHIEVEMENTS];

    // Apply filter
    switch (filter) {
      case 'unlocked':
        achievements = achievements.filter(a => state.unlockedIds.has(a.id));
        break;
      case 'locked':
        achievements = achievements.filter(a => !state.unlockedIds.has(a.id));
        break;
      case 'all':
        break;
      default:
        achievements = achievements.filter(a => a.category === filter);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      achievements = achievements.filter(
        a =>
          a.name.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query)
      );
    }

    // Apply sort
    switch (sort) {
      case 'name':
        achievements.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'rarity': {
        const rarityOrder: AchievementRarity[] = ['legendary', 'epic', 'rare', 'common'];
        achievements.sort(
          (a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
        );
        break;
      }
      case 'progress':
        achievements.sort((a, b) => {
          const progA = state.manager.getProgress(a.id);
          const progB = state.manager.getProgress(b.id);
          return progB.percentage - progA.percentage;
        });
        break;
      case 'unlocked':
        achievements.sort((a, b) => {
          const unlockedA = state.unlockedIds.has(a.id) ? 1 : 0;
          const unlockedB = state.unlockedIds.has(b.id) ? 1 : 0;
          return unlockedB - unlockedA;
        });
        break;
    }

    return achievements;
  }, [filter, sort, searchQuery, state.unlockedIds, state.manager]);

  if (!isOpen) return null;

  const categories: { value: FilterOption; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'unlocked', label: 'Unlocked' },
    { value: 'locked', label: 'Locked' },
    { value: 'financial', label: 'Financial' },
    { value: 'games', label: 'Games' },
    { value: 'employees', label: 'Employees' },
    { value: 'gacha', label: 'Gacha' },
    { value: 'ethical', label: 'Ethical' },
    { value: 'market', label: 'Market' },
    { value: 'hidden', label: 'Hidden' },
    { value: 'speedrun', label: 'Speedrun' },
    { value: 'challenge', label: 'Challenge' },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Icon name="trophy" size="md" className="text-yellow-400" /> Achievements</h2>
            <p className="text-sm text-gray-400">
              {stats.totalUnlocked} / {stats.totalAchievements} unlocked
              ({stats.completionPercent.toFixed(1)}%)
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-yellow-400 font-bold text-lg">
                {stats.totalPoints} pts
              </div>
              <div className="text-xs text-gray-500">
                of {stats.maxPoints} possible
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 bg-gray-850 border-b border-gray-700 flex flex-wrap gap-3 items-center">
          {/* Search */}
          <input
            type="text"
            placeholder="Search achievements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
          />

          {/* Category filter */}
          <select
            aria-label="Filter achievements by category"
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterOption)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            aria-label="Sort achievements by"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
          >
            <option value="name">Sort: Name</option>
            <option value="rarity">Sort: Rarity</option>
            <option value="progress">Sort: Progress</option>
            <option value="unlocked">Sort: Unlocked</option>
          </select>

          {/* Show hidden toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={showHidden}
              onChange={(e) => setShowHidden(e.target.checked)}
              className="rounded bg-gray-800 border-gray-700"
            />
            Show hidden
          </label>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-800">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-yellow-400 transition-all duration-500"
            style={{ width: `${stats.completionPercent}%` }}
          />
        </div>

        {/* Achievement grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements().map(achievement => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                progress={state.manager.getProgress(achievement.id)}
                isUnlocked={state.unlockedIds.has(achievement.id)}
                isFavorite={state.manager.isFavorite(achievement.id)}
                onToggleFavorite={() => state.manager.toggleFavorite(achievement.id)}
                showHidden={showHidden}
              />
            ))}
          </div>

          {filteredAchievements().length === 0 && (
            <div className="text-center text-gray-500 py-12">
              No achievements match your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Achievement Progress Widget
// =============================================================================

interface AchievementWidgetProps {
  onClick: () => void;
}

export function AchievementWidget({ onClick }: AchievementWidgetProps) {
  const { state } = useAchievements();
  const stats = state.manager.getStats();

  return (
    <button
      onClick={onClick}
      className="
        flex items-center gap-3 px-4 py-2 
        bg-gray-800 hover:bg-gray-700 
        rounded-lg border border-gray-700
        transition-colors
      "
    >
      <Icon name="trophy" size="md" className="text-yellow-400" />
      <div className="text-left">
        <div className="text-sm font-bold text-white">
          {stats.totalUnlocked}/{stats.totalAchievements}
        </div>
        <div className="text-xs text-gray-400">
          {stats.totalPoints} pts
        </div>
      </div>
      <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 transition-all duration-500"
          style={{ width: `${stats.completionPercent}%` }}
        />
      </div>
    </button>
  );
}

// =============================================================================
// Achievement Notification Manager
// =============================================================================

export function AchievementNotificationManager() {
  const { state, dispatch } = useAchievements();

  if (!state.showNotification) {
    return null;
  }

  return (
    <AchievementToast
      achievement={state.showNotification}
      onDismiss={() => dispatch({ type: 'DISMISS_NOTIFICATION' })}
    />
  );
}
