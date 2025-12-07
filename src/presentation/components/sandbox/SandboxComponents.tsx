import React, { createContext, useContext, useReducer, useCallback, ReactNode, useMemo } from 'react';
import { Icon } from '../common/Icon';
import { useI18n, type Translations } from '../../../infrastructure/i18n';
import {
  SandboxFlags,
  SandboxManager,
  getSandboxManager,
  DEFAULT_SANDBOX_FLAGS,
} from '../../../domain/sandbox/Sandbox';

// ============================================================================
// Context Types
// ============================================================================

interface SandboxState {
  isActive: boolean;
  flags: SandboxFlags;
  commandHistory: string[];
}

type SandboxAction =
  | { type: 'ENABLE_SANDBOX' }
  | { type: 'DISABLE_SANDBOX' }
  | { type: 'TOGGLE_FLAG'; flag: keyof SandboxFlags }
  | { type: 'SET_FLAGS'; flags: Partial<SandboxFlags> }
  | { type: 'EXECUTE_CHEAT'; cheat: string }
  | { type: 'CLEAR_HISTORY' };

interface SandboxContextValue {
  state: SandboxState;
  manager: SandboxManager;
  enableSandbox: () => void;
  disableSandbox: () => void;
  toggleFlag: (flag: keyof SandboxFlags) => void;
  executeCheat: (cheat: string) => void;
}

// ============================================================================
// Reducer
// ============================================================================

function sandboxReducer(state: SandboxState, action: SandboxAction): SandboxState {
  switch (action.type) {
    case 'ENABLE_SANDBOX':
      return { ...state, isActive: true };
    case 'DISABLE_SANDBOX':
      return { ...state, isActive: false, flags: DEFAULT_SANDBOX_FLAGS };
    case 'TOGGLE_FLAG': {
      const currentValue = state.flags[action.flag];
      if (typeof currentValue === 'boolean') {
        return {
          ...state,
          flags: { ...state.flags, [action.flag]: !currentValue },
        };
      }
      return state;
    }
    case 'SET_FLAGS':
      return { ...state, flags: { ...state.flags, ...action.flags } };
    case 'EXECUTE_CHEAT':
      return {
        ...state,
        commandHistory: [...state.commandHistory.slice(-49), action.cheat],
      };
    case 'CLEAR_HISTORY':
      return { ...state, commandHistory: [] };
    default:
      return state;
  }
}

const initialState: SandboxState = {
  isActive: false,
  flags: DEFAULT_SANDBOX_FLAGS,
  commandHistory: [],
};

// ============================================================================
// Context
// ============================================================================

const SandboxContext = createContext<SandboxContextValue | null>(null);

export function useSandbox(): SandboxContextValue {
  const context = useContext(SandboxContext);
  if (!context) {
    throw new Error('useSandbox must be used within a SandboxProvider');
  }
  return context;
}

// ============================================================================
// Provider
// ============================================================================

interface SandboxProviderProps {
  children: ReactNode;
}

export function SandboxProvider({ children }: SandboxProviderProps) {
  const [state, dispatch] = useReducer(sandboxReducer, initialState);
  const manager = getSandboxManager();

  const enableSandbox = useCallback(() => {
    manager.enable();
    dispatch({ type: 'ENABLE_SANDBOX' });
  }, [manager]);

  const disableSandbox = useCallback(() => {
    manager.disableAllFlags();
    manager.disable();
    dispatch({ type: 'DISABLE_SANDBOX' });
  }, [manager]);

  const toggleFlag = useCallback(
    (flag: keyof SandboxFlags) => {
      manager.toggleFlag(flag);
      dispatch({ type: 'TOGGLE_FLAG', flag });
    },
    [manager]
  );

  const executeCheat = useCallback(
    (cheat: string) => {
      dispatch({ type: 'EXECUTE_CHEAT', cheat });
    },
    []
  );

  const value: SandboxContextValue = {
    state,
    manager,
    enableSandbox,
    disableSandbox,
    toggleFlag,
    executeCheat,
  };

  return <SandboxContext.Provider value={value}>{children}</SandboxContext.Provider>;
}

// ============================================================================
// Cheat Flag Descriptions - Updated to match actual SandboxFlags
// ============================================================================

type BooleanSandboxFlags = {
  [K in keyof SandboxFlags]: SandboxFlags[K] extends boolean ? K : never;
}[keyof SandboxFlags];

interface CheatInfo {
  key: BooleanSandboxFlags;
  name: string;
  description: string;
  iconName: 'money' | 'users' | 'settings' | 'star' | 'trophy' | 'happy' | 'handshake' | 'graduation' | 'bolt' | 'bug' | 'gem' | 'research' | 'flask' | 'sparkles' | 'casino' | 'flag' | 'chart-up' | 'dice' | 'clover' | 'eye';
  category: 'resources' | 'development' | 'company' | 'gacha' | 'debug';
}

// Cheat configuration with just non-translatable data
interface CheatConfig {
  key: BooleanSandboxFlags;
  iconName: CheatInfo['iconName'];
  category: CheatInfo['category'];
}

const CHEAT_CONFIG: CheatConfig[] = [
  // Resources
  { key: 'infiniteMoney', iconName: 'money', category: 'resources' },
  { key: 'freeHiring', iconName: 'users', category: 'resources' },
  { key: 'noSalaries', iconName: 'money', category: 'resources' },
  { key: 'noServerCosts', iconName: 'settings', category: 'resources' },
  // Company
  { key: 'noReputationDecay', iconName: 'star', category: 'company' },
  { key: 'maxReputation', iconName: 'trophy', category: 'company' },
  { key: 'noMoraleDecay', iconName: 'happy', category: 'company' },
  { key: 'noEmployeeQuit', iconName: 'handshake', category: 'company' },
  { key: 'maxEmployeeSkills', iconName: 'graduation', category: 'company' },
  // Development
  { key: 'instantDevelopment', iconName: 'bolt', category: 'development' },
  { key: 'noBugs', iconName: 'bug', category: 'development' },
  { key: 'maxQuality', iconName: 'gem', category: 'development' },
  { key: 'instantResearch', iconName: 'research', category: 'development' },
  { key: 'freeResearch', iconName: 'flask', category: 'development' },
  // Gacha
  { key: 'guaranteedLegendary', iconName: 'sparkles', category: 'gacha' },
  { key: 'freePulls', iconName: 'casino', category: 'gacha' },
  // Debug
  { key: 'noCompetitors', iconName: 'flag', category: 'debug' },
  { key: 'manipulateMarket', iconName: 'chart-up', category: 'debug' },
  { key: 'forceEvents', iconName: 'dice', category: 'debug' },
  { key: 'noNegativeEvents', iconName: 'clover', category: 'debug' },
  { key: 'revealHiddenAchievements', iconName: 'eye', category: 'debug' },
];

/**
 * Get translated cheat info
 */
function getCheatInfo(t: Translations): CheatInfo[] {
  return CHEAT_CONFIG.map(config => {
    const translation = t.sandboxCheats[config.key as keyof typeof t.sandboxCheats] as { name: string; description: string } | undefined;
    return {
      ...config,
      name: translation?.name ?? config.key,
      description: translation?.description ?? '',
    };
  });
}

/**
 * Get translated category labels
 */
function getCategoryLabels(t: Translations): Record<string, string> {
  return t.sandboxCheats.categories;
}

const CATEGORY_ICONS: Record<string, 'money' | 'settings' | 'dashboard' | 'casino' | 'bug'> = {
  resources: 'money',
  development: 'settings',
  company: 'dashboard',
  gacha: 'casino',
  debug: 'bug',
};

// ============================================================================
// CheatToggle Component
// ============================================================================

interface CheatToggleProps {
  cheat: CheatInfo;
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

function CheatToggle({ cheat, enabled, onToggle, disabled }: CheatToggleProps) {
  return (
    <div
      className={`
        p-4 rounded-lg border transition-all duration-200
        ${enabled
          ? 'bg-purple-900/30 border-purple-500 shadow-lg shadow-purple-500/20'
          : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onClick={() => !disabled && onToggle()}
    >
      <div className="flex items-start gap-3">
        <Icon name={cheat.iconName} size="md" className="text-purple-400" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-white">{cheat.name}</h4>
            <div
              className={`
                w-12 h-6 rounded-full p-1 transition-colors duration-200
                ${enabled ? 'bg-purple-500' : 'bg-gray-600'}
              `}
            >
              <div
                className={`
                  w-4 h-4 rounded-full bg-white transition-transform duration-200
                  ${enabled ? 'translate-x-6' : 'translate-x-0'}
                `}
              />
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-1">{cheat.description}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SandboxPanel Component
// ============================================================================

interface SandboxPanelProps {
  className?: string;
}

export function SandboxPanel({ className = '' }: SandboxPanelProps) {
  const { state, toggleFlag, enableSandbox, disableSandbox } = useSandbox();
  const { t } = useI18n();

  // Get translated cheat info
  const cheatInfo = useMemo(() => getCheatInfo(t), [t]);
  const categoryLabels = useMemo(() => getCategoryLabels(t), [t]);

  const cheatsByCategory = useMemo(() => {
    return cheatInfo.reduce((acc, cheat) => {
      if (!acc[cheat.category]) {
        acc[cheat.category] = [];
      }
      acc[cheat.category].push(cheat);
      return acc;
    }, {} as Record<string, CheatInfo[]>);
  }, [cheatInfo]);

  return (
    <div className={`bg-gray-900 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Icon name="games" size="md" className="text-purple-400" /> {t.sandbox.sandboxMode}
          </h2>
          <p className="text-gray-400 mt-1">
            {t.difficulty.noAchievements}
          </p>
        </div>
        <button
          className={`
            px-6 py-3 rounded-lg font-semibold transition-all duration-200
            ${state.isActive
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
            }
          `}
          onClick={() => state.isActive ? disableSandbox() : enableSandbox()}
        >
          {state.isActive ? <><Icon name="lock" size="sm" className="inline mr-1" /> {t.sandbox.disableSandbox}</> : <><Icon name="unlock" size="sm" className="inline mr-1" /> {t.sandbox.enableSandbox}</>}
        </button>
      </div>

      {/* Warning Banner */}
      {state.isActive && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-yellow-500">
            <Icon name="warning" size="md" className="text-yellow-500" />
            <span className="font-semibold">{t.sandbox.sandboxModeActive}</span>
          </div>
          <p className="text-yellow-200/80 text-sm mt-1">
            {t.difficulty.noAchievements}
          </p>
        </div>
      )}

      {/* Cheat Categories */}
      {state.isActive && (
        <div className="space-y-6">
          {Object.entries(cheatsByCategory).map(([category, cheats]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <Icon name={CATEGORY_ICONS[category] || 'settings'} size="sm" /> {categoryLabels[category] || category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cheats.map((cheat) => (
                  <CheatToggle
                    key={cheat.key}
                    cheat={cheat}
                    enabled={state.flags[cheat.key] as boolean}
                    onToggle={() => toggleFlag(cheat.key)}
                    disabled={!state.isActive}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inactive State */}
      {!state.isActive && (
        <div className="text-center py-12">
          <Icon name="lock" size="lg" className="text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            {t.sandbox.sandboxMode}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {t.sandbox.enableSandbox}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SandboxIndicator Component (for HUD)
// ============================================================================

export function SandboxIndicator() {
  const { state } = useSandbox();
  const { t } = useI18n();

  if (!state.isActive) return null;

  const activeCount = Object.entries(state.flags).filter(
    ([key, value]) => key !== 'speedMultiplier' && value === true
  ).length;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-purple-600/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2 text-white">
          <Icon name="games" size="sm" className="text-white" />
          <span className="font-semibold">{t.sandbox.sandbox}</span>
          {activeCount > 0 && (
            <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">
              {activeCount} active
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// QuickCheats Component (compact version for sidebar)
// ============================================================================

interface QuickCheatsProps {
  className?: string;
}

export function QuickCheats({ className = '' }: QuickCheatsProps) {
  const { state, toggleFlag, enableSandbox } = useSandbox();
  const { t } = useI18n();

  // Get translated cheat info
  const cheatInfo = useMemo(() => getCheatInfo(t), [t]);

  const quickCheats: BooleanSandboxFlags[] = [
    'infiniteMoney',
    'instantDevelopment',
    'noReputationDecay',
    'noBugs',
  ];

  if (!state.isActive) {
    return (
      <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-gray-400 flex items-center gap-2"><Icon name="games" size="sm" /> {t.sandbox.sandboxMode}</span>
          <button
            className="text-purple-400 hover:text-purple-300 text-sm"
            onClick={enableSandbox}
          >
            {t.sandbox.enableSandbox}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <h4 className="text-sm font-semibold text-gray-300 mb-3">{t.sandbox.quickCheats}</h4>
      <div className="space-y-2">
        {quickCheats.map((key) => {
          const cheat = cheatInfo.find((c) => c.key === key);
          if (!cheat) return null;
          return (
            <div
              key={key}
              className="flex items-center justify-between cursor-pointer hover:bg-gray-700/50 rounded p-2 transition-colors"
              onClick={() => toggleFlag(key)}
            >
              <div className="flex items-center gap-2">
                <Icon name={cheat.iconName} size="sm" />
                <span className="text-sm text-gray-300">{cheat.name}</span>
              </div>
              <div
                className={`w-8 h-4 rounded-full p-0.5 transition-colors ${
                  state.flags[key] ? 'bg-purple-500' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white transition-transform ${
                    state.flags[key] ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// DebugConsole Component
// ============================================================================

interface DebugConsoleProps {
  className?: string;
}

export function DebugConsole({ className = '' }: DebugConsoleProps) {
  const { state, executeCheat } = useSandbox();
  const [input, setInput] = React.useState('');
  const { t } = useI18n();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      executeCheat(input.trim());
      setInput('');
    }
  };

  if (!state.isActive) return null;

  return (
    <div className={`bg-gray-900 rounded-lg p-4 ${className}`}>
      <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
        <Icon name="bug" size="sm" /> Debug Console
      </h4>
      
      {/* Command History */}
      <div className="bg-black rounded-lg p-3 mb-3 h-32 overflow-y-auto font-mono text-xs">
        {state.commandHistory.length === 0 ? (
          <div className="text-gray-600">{t.sandbox.noCommandsYet}</div>
        ) : (
          state.commandHistory.map((cmd, i) => (
            <div key={i} className="text-green-400">
              <span className="text-gray-500">&gt;</span> {cmd}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.sandbox.enterCommand}
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
          >
            Run
          </button>
        </div>
      </form>
    </div>
  );
}
