/**
 * Research UI Components - Prompt 8.1
 * 
 * Tech tree visualization and research management UI.
 */

import { useState, useEffect, createContext, useContext, useReducer, type ReactNode } from 'react';
import { Icon } from '../common/Icon';
import {
  ResearchNode,
  ResearchState,
  ResearchCategory,
  RESEARCH_CATEGORIES,
  getResearchByCategory,
  getResearchById,
  canStartResearch,
  isResearchCompleted,
  arePrerequisitesMet,
  isMutuallyExclusiveBlocked,
} from '../../../domain/research/Research';
import {
  ResearchManager,
  getResearchManager,
} from '../../../domain/research/ResearchManager';

// =============================================================================
// Research Context
// =============================================================================

interface ResearchContextState {
  manager: ResearchManager;
  state: ResearchState;
}

type ResearchAction =
  | { type: 'UPDATE_STATE'; state: ResearchState };

const ResearchContext = createContext<{
  state: ResearchContextState;
  dispatch: React.Dispatch<ResearchAction>;
} | null>(null);

function researchReducer(
  state: ResearchContextState,
  action: ResearchAction
): ResearchContextState {
  switch (action.type) {
    case 'UPDATE_STATE':
      return { ...state, state: action.state };
    default:
      return state;
  }
}

export function ResearchProvider({ children }: { children: ReactNode }) {
  const manager = getResearchManager();
  
  const [state, dispatch] = useReducer(researchReducer, {
    manager,
    state: manager.getState(),
  });

  useEffect(() => {
    manager.setOnStateChange((newState: ResearchState) => {
      dispatch({ type: 'UPDATE_STATE', state: newState });
    });
  }, [manager]);

  return (
    <ResearchContext.Provider value={{ state, dispatch }}>
      {children}
    </ResearchContext.Provider>
  );
}

export function useResearch() {
  const context = useContext(ResearchContext);
  if (!context) {
    throw new Error('useResearch must be used within ResearchProvider');
  }
  return context;
}

// =============================================================================
// Research Panel
// =============================================================================

interface ResearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentMoney: number;
  onDeductMoney: (amount: number) => boolean;
}

export function ResearchPanel({ isOpen, onClose, currentMoney, onDeductMoney }: ResearchPanelProps) {
  const { state: contextState } = useResearch();
  const { manager, state } = contextState;
  const [selectedCategory, setSelectedCategory] = useState<ResearchCategory>('game_development');
  const [selectedNode, setSelectedNode] = useState<ResearchNode | null>(null);

  if (!isOpen) return null;

  const categories = Object.values(RESEARCH_CATEGORIES);
  const categoryNodes = getResearchByCategory(selectedCategory);
  const activeResearch = manager.getActiveResearch();
  const stats = manager.getOverallStats();

  const handleStartResearch = (nodeId: string) => {
    const result = manager.startResearch(nodeId, currentMoney, onDeductMoney);
    if (!result.success) {
      console.warn('Failed to start research:', result.reason);
    }
    setSelectedNode(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-900 to-gray-900 border-b border-blue-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Icon name="research" size="md" className="text-blue-400" /> Research & Development</h2>
            <p className="text-sm text-gray-400">
              {stats.completed}/{stats.total} researched • {state.researchPoints} RP available
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        {/* Active Research Banner */}
        {activeResearch && (
          <div className="p-3 bg-blue-900/50 border-b border-blue-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="animate-pulse"><Icon name="refresh" size="sm" className="text-blue-400" /></div>
              <div>
                <span className="text-white font-medium">
                  Researching: {getResearchById(activeResearch.nodeId as string)?.name}
                </span>
                <span className="text-blue-300 ml-2">
                  ({activeResearch.daysRemaining} days remaining)
                </span>
              </div>
            </div>
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ 
                  width: `${((activeResearch.totalDays - activeResearch.daysRemaining) / activeResearch.totalDays) * 100}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex border-b border-gray-800 bg-gray-850 overflow-x-auto">
          {categories.map(cat => {
            const catStats = manager.getCategoryStats(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`
                  px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2
                  ${selectedCategory === cat.id
                    ? 'text-blue-300 border-b-2 border-blue-500 bg-blue-900/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }
                `}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span className="text-xs text-gray-500">
                  ({catStats.completed}/{catStats.total})
                </span>
              </button>
            );
          })}
        </div>

        {/* Tech Tree Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryNodes.map(node => (
              <ResearchCard
                key={node.id as string}
                node={node}
                state={state}
                currentMoney={currentMoney}
                isActive={activeResearch?.nodeId === node.id}
                onClick={() => setSelectedNode(node)}
              />
            ))}
          </div>
        </div>

        {/* Selected Node Detail */}
        {selectedNode && (
          <ResearchDetailModal
            node={selectedNode}
            state={state}
            currentMoney={currentMoney}
            isActive={activeResearch?.nodeId === selectedNode.id}
            onClose={() => setSelectedNode(null)}
            onStart={() => handleStartResearch(selectedNode.id as string)}
          />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Research Card
// =============================================================================

interface ResearchCardProps {
  node: ResearchNode;
  state: ResearchState;
  currentMoney: number;
  isActive: boolean;
  onClick: () => void;
}

function ResearchCard({ node, state, currentMoney, isActive, onClick }: ResearchCardProps) {
  const isCompleted = isResearchCompleted(state, node.id as string);
  const prereqsMet = arePrerequisitesMet(state, node);
  const isBlocked = isMutuallyExclusiveBlocked(state, node);
  const canStart = canStartResearch(state, node, currentMoney).canStart;

  const tierColors = {
    1: 'border-gray-600',
    2: 'border-green-600',
    3: 'border-blue-600',
    4: 'border-purple-600',
    5: 'border-yellow-600',
  };

  return (
    <button
      onClick={onClick}
      className={`
        relative p-4 rounded-lg border-2 text-left transition-all
        ${isCompleted 
          ? 'border-green-500 bg-green-900/20' 
          : isActive
            ? 'border-blue-500 bg-blue-900/30 animate-pulse'
            : isBlocked
              ? 'border-red-900 bg-red-900/10 opacity-50'
              : !prereqsMet
                ? 'border-gray-700 bg-gray-800/50 opacity-50'
                : canStart
                  ? `${tierColors[node.tier]} bg-gray-800 hover:bg-gray-700`
                  : 'border-gray-700 bg-gray-800'
        }
      `}
    >
      {/* Tier badge */}
      <span className="absolute top-2 right-2 text-xs font-bold text-gray-500">
        T{node.tier}
      </span>

      {/* Icon and Name */}
      <div className="flex items-start gap-3">
        <span className="text-2xl">{node.icon}</span>
        <div>
          <h4 className={`font-bold ${isCompleted ? 'text-green-300' : 'text-white'}`}>
            {node.name}
          </h4>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{node.description}</p>
        </div>
      </div>

      {/* Status */}
      <div className="mt-3 flex items-center justify-between text-xs">
        {isCompleted ? (
          <span className="text-green-400"><Icon name="check" size="sm" className="inline mr-1" /> Completed</span>
        ) : isActive ? (
          <span className="text-blue-400"><Icon name="clock" size="sm" className="inline mr-1" /> In Progress</span>
        ) : isBlocked ? (
          <span className="text-red-400"><Icon name="blocked" size="sm" className="inline mr-1" /> Blocked</span>
        ) : !prereqsMet ? (
          <span className="text-gray-500"><Icon name="lock" size="sm" className="inline mr-1" /> Locked</span>
        ) : (
          <span className="text-gray-400">{node.researchTime} days</span>
        )}
        <span className="text-gray-500">${node.cost.money.toLocaleString()}</span>
      </div>
    </button>
  );
}

// =============================================================================
// Research Detail Modal
// =============================================================================

interface ResearchDetailModalProps {
  node: ResearchNode;
  state: ResearchState;
  currentMoney: number;
  isActive: boolean;
  onClose: () => void;
  onStart: () => void;
}

function ResearchDetailModal({ 
  node, 
  state, 
  currentMoney, 
  isActive, 
  onClose, 
  onStart 
}: ResearchDetailModalProps) {
  const isCompleted = isResearchCompleted(state, node.id as string);
  const { canStart, reason } = canStartResearch(state, node, currentMoney);

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{node.icon}</span>
            <div>
              <h3 className="text-xl font-bold text-white">{node.name}</h3>
              <span className="text-xs text-gray-400">
                {RESEARCH_CATEGORIES[node.category].name} • Tier {node.tier}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">×</button>
        </div>

        {/* Description */}
        <p className="text-gray-300 mb-4">{node.description}</p>
        {node.flavorText && (
          <p className="text-sm text-gray-500 italic mb-4">"{node.flavorText}"</p>
        )}

        {/* Cost */}
        <div className="bg-gray-900 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-bold text-gray-400 mb-2">Cost</h4>
          <div className="flex gap-4">
            <span className="text-white">${node.cost.money.toLocaleString()}</span>
            <span className="text-blue-300">{node.cost.researchPoints} RP</span>
            <span className="text-gray-400">{node.researchTime} days</span>
          </div>
        </div>

        {/* Effects */}
        <div className="bg-gray-900 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-bold text-gray-400 mb-2">Effects</h4>
          <ul className="space-y-1">
            {node.effects.map((effect, i) => (
              <li key={i} className="text-green-400 text-sm">
                +{effect.value}{effect.isPercentage ? '%' : ''} {formatEffectType(effect.type)}
              </li>
            ))}
          </ul>
        </div>

        {/* Prerequisites */}
        {node.prerequisites.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-bold text-gray-400 mb-2">Prerequisites</h4>
            <ul className="space-y-1">
              {node.prerequisites.map(prereqId => {
                const prereq = getResearchById(prereqId as string);
                const isComplete = isResearchCompleted(state, prereqId as string);
                return (
                  <li key={prereqId as string} className={`text-sm flex items-center gap-1 ${isComplete ? 'text-green-400' : 'text-red-400'}`}>
                    <Icon name={isComplete ? 'check' : 'close'} size="xs" /> {prereq?.name || prereqId}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Mutually Exclusive */}
        {node.mutuallyExclusiveWith && node.mutuallyExclusiveWith.length > 0 && (
          <div className="bg-red-900/30 rounded-lg p-3 mb-4 border border-red-800">
            <h4 className="text-sm font-bold text-red-400 mb-2"><Icon name="warning" size="sm" className="inline mr-1" /> Mutually Exclusive</h4>
            <ul className="space-y-1">
              {node.mutuallyExclusiveWith.map(exId => {
                const ex = getResearchById(exId as string);
                return (
                  <li key={exId as string} className="text-sm text-red-300">
                    Cannot research with: {ex?.name || exId}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={onStart}
          disabled={!canStart || isCompleted || isActive}
          className={`
            w-full py-3 rounded-lg font-bold transition-colors
            ${isCompleted
              ? 'bg-green-900 text-green-300 cursor-default'
              : isActive
                ? 'bg-blue-900 text-blue-300 cursor-default'
                : canStart
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isCompleted 
            ? <><Icon name="check" size="sm" className="inline mr-1" /> Completed</>
            : isActive 
              ? <><Icon name="clock" size="sm" className="inline mr-1" /> In Progress</>
              : canStart 
                ? 'Start Research' 
                : reason || 'Cannot Research'
          }
        </button>
      </div>
    </div>
  );
}

function formatEffectType(type: string): string {
  const labels: Record<string, string> = {
    devSpeedBonus: 'Development Speed',
    baseQualityBonus: 'Base Quality',
    bugReductionBonus: 'Bug Reduction',
    featureValueBonus: 'Feature Value',
    conversionRateBonus: 'Conversion Rate',
    arppuBonus: 'ARPPU',
    retentionBonus: 'Player Retention',
    ethicalMonetizationUnlock: 'Ethical Monetization',
    predatoryMonetizationUnlock: 'Predatory Monetization',
    playerAcquisitionBonus: 'Player Acquisition',
    viralCoefficientBonus: 'Viral Coefficient',
    brandAwarenessBonus: 'Brand Awareness',
    adEfficiencyBonus: 'Ad Efficiency',
    serverCostReduction: 'Server Cost Reduction',
    scalingBonus: 'Scaling Efficiency',
    uptimeBonus: 'Uptime',
    maxPlayersBonus: 'Max Players',
    moraleDecayReduction: 'Morale Decay Reduction',
    skillGrowthBonus: 'Skill Growth',
    salaryEfficiencyBonus: 'Salary Efficiency',
    hiringSpeedBonus: 'Hiring Speed',
    trainingEfficiencyBonus: 'Training Efficiency',
  };
  return labels[type] || type;
}

// =============================================================================
// Research Widget
// =============================================================================

interface ResearchWidgetProps {
  onClick: () => void;
}

export function ResearchWidget({ onClick }: ResearchWidgetProps) {
  const { state: contextState } = useResearch();
  const { manager, state } = contextState;
  const activeResearch = manager.getActiveResearch();
  const stats = manager.getOverallStats();

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
      <Icon name="research" size="md" className="text-blue-400" />
      <div className="text-left">
        <div className="text-sm font-bold text-white">
          {activeResearch 
            ? `${activeResearch.daysRemaining}d remaining`
            : 'No Research'
          }
        </div>
        <div className="text-xs text-gray-400">
          {stats.completed}/{stats.total} • {state.researchPoints} RP
        </div>
      </div>
    </button>
  );
}
