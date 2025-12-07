import { useState } from 'react';
import { useGame } from '../../context';
import { GameActions } from '../../../application/actions';
import { useI18n } from '../../../infrastructure/i18n';
import { Card, Button, Input, ProgressBar, Icon, IconName } from '../common';
import { GameGenre, GENRE_CONFIGS, GenreTier } from '../../../domain';
import { IMPROVEMENT_TASKS, ImprovementFocus } from '../../../domain/game/LiveGameImprovement';
import { LAUNCH_PHASE_CONFIGS } from '../../../domain/game/LaunchPhases';
import { 
  PhaseInfoTooltip, 
  ProgressBreakdownPanel, 
  PhaseHelpModal,
  calculateTeamEffectivenessBreakdown,
  TeamMemberForCalculation
} from '../games';

// Ordered by tier
const GENRES: { id: GameGenre; name: string; icon: IconName }[] = [
  // Starter
  { id: 'idle', name: 'Idle', icon: 'idle' },
  { id: 'puzzle', name: 'Puzzle', icon: 'puzzle' },
  // Intermediate
  { id: 'rhythm', name: 'Rhythm', icon: 'rhythm' },
  { id: 'card', name: 'Card', icon: 'gacha' },
  // Advanced
  { id: 'strategy', name: 'Strategy', icon: 'strategy' },
  { id: 'action', name: 'Action', icon: 'action' },
  // Premium
  { id: 'rpg', name: 'RPG', icon: 'rpg' },
];

const TIER_COLORS: Record<GenreTier, string> = {
  starter: 'text-gray-300',
  intermediate: 'text-blue-300',
  advanced: 'text-purple-300',
  premium: 'text-yellow-300',
};

const TIER_BG: Record<GenreTier, string> = {
  starter: 'border-gray-600',
  intermediate: 'border-blue-600',
  advanced: 'border-purple-600',
  premium: 'border-yellow-600',
};

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}

export function GamesView() {
  const { state, dispatch } = useGame();
  const { games, employees, company, unlockedGenres, founder } = state;
  const { t } = useI18n();
  const [showNewGame, setShowNewGame] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showLaunchModal, setShowLaunchModal] = useState<string | null>(null); // gameId or null
  const [newGameName, setNewGameName] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<GameGenre>('idle'); // Start with an unlocked genre
  const [collapsedGames, setCollapsedGames] = useState<Set<string>>(new Set());

  const toggleGameCollapse = (gameId: string) => {
    setCollapsedGames(prev => {
      const newSet = new Set(prev);
      if (newSet.has(gameId)) {
        newSet.delete(gameId);
      } else {
        newSet.add(gameId);
      }
      return newSet;
    });
  };

  const collapseAllGames = () => {
    setCollapsedGames(new Set(games.map(g => g.id)));
  };

  const expandAllGames = () => {
    setCollapsedGames(new Set());
  };

  // Auto-determine if a game needs attention (shouldn't be collapsed)
  const gameNeedsAttention = (game: typeof games[0]) => {
    // In development with no team assigned
    if (game.status !== 'live' && game.status !== 'shutdown' && game.assignedEmployees.length === 0) {
      return true;
    }
    // Low satisfaction
    if (game.status === 'live' && game.monetization.playerSatisfaction < 40) {
      return true;
    }
    // Ready to launch
    if (game.developmentProgress >= 100 && game.status !== 'live' && game.status !== 'shutdown') {
      return true;
    }
    return false;
  };

  const handleCreateGame = () => {
    if (newGameName.trim()) {
      dispatch(GameActions.startGameProject(newGameName.trim(), selectedGenre));
      setNewGameName('');
      setShowNewGame(false);
    }
  };

  const handleAssignEmployee = (gameId: string, employeeId: string) => {
    dispatch(GameActions.assignToProject(employeeId, gameId));
  };

  const handleUnassignEmployee = (gameId: string, employeeId: string) => {
    dispatch(GameActions.unassignFromProject(employeeId, gameId));
  };

  const handleAssignFounder = (gameId: string) => {
    dispatch(GameActions.assignFounderToProject(gameId));
  };

  const handleUnassignFounder = (gameId: string) => {
    dispatch(GameActions.unassignFounderFromProject(gameId));
  };

  // Check if founder is assigned to a game
  const isFounderAssignedTo = (gameId: string) => {
    if (!founder) return false;
    const game = games.find(g => g.id === gameId);
    return game?.assignedEmployees.includes(founder.id) ?? false;
  };

  // Check if founder is available (not assigned to any game)
  const isFounderAvailable = () => {
    if (!founder) return false;
    return !games.some(g => g.assignedEmployees.includes(founder.id));
  };

  const handleLaunchGame = (gameId: string) => {
    dispatch(GameActions.launchGame(gameId));
    setShowLaunchModal(null);
  };

  const handlePhasedLaunch = (gameId: string) => {
    dispatch(GameActions.startPhasedLaunch(gameId));
    setShowLaunchModal(null);
  };

  const handleShutdownGame = (gameId: string) => {
    if (confirm('Are you sure you want to shutdown this game? This will stop all revenue generation.')) {
      dispatch(GameActions.shutdownGame(gameId));
    }
  };

  const handleDeleteGame = (gameId: string) => {
    if (confirm(t.games.confirmDelete)) {
      dispatch(GameActions.deleteGame(gameId));
    }
  };

  const handleRelaunchGame = (gameId: string) => {
    if (confirm(t.games.confirmRelaunch)) {
      dispatch(GameActions.relaunchGame(gameId));
    }
  };

  // Calculate number of employees (excluding founder) for display
  const getEmployeeCount = (game: typeof games[0]) => {
    if (!founder) return game.assignedEmployees.length;
    return game.assignedEmployees.filter(id => id !== founder.id).length;
  };

  const availableEmployees = employees.filter(e => e.isAvailable);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-white">{t.games.projectTitle}</h2>
        <div className="flex gap-2 flex-wrap">
          {games.length > 1 && (
            <>
              <Button variant="secondary" size="sm" onClick={collapseAllGames}>
                <Icon name="chevronUp" size="xs" className="mr-1" /> {t.games.collapseAll}
              </Button>
              <Button variant="secondary" size="sm" onClick={expandAllGames}>
                <Icon name="chevronDown" size="xs" className="mr-1" /> {t.games.expandAll}
              </Button>
            </>
          )}
          <Button variant="secondary" onClick={() => setShowHelp(true)}>
            ? {t.games.help}
          </Button>
          <Button onClick={() => setShowNewGame(true)}>+ {t.games.newGame}</Button>
        </div>
      </div>

      {/* Help Modal */}
      <PhaseHelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* New Game Modal */}
      {showNewGame && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-lg my-8">
            <h3 className="text-xl font-bold text-white mb-4">{t.games.startNewProject}</h3>
            <div className="space-y-4">
              <Input
                label={t.games.gameName}
                placeholder={t.games.gameNamePlaceholder}
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t.games.genre} <span className="text-xs text-gray-500">{t.games.genreSelectHint}</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {GENRES.map((genre) => {
                    const config = GENRE_CONFIGS[genre.id];
                    const isUnlocked = config.tier === 'starter' || unlockedGenres.has(genre.id);
                    const canAfford = company ? company.funds >= config.unlockCost : false;
                    
                    return (
                      <div
                        key={genre.id}
                        className={`relative p-3 rounded-lg border-2 transition-all ${
                          isUnlocked
                            ? selectedGenre === genre.id
                              ? 'bg-gacha-purple/20 border-gacha-purple'
                              : `bg-gray-800 hover:bg-gray-700 cursor-pointer ${TIER_BG[config.tier]}`
                            : 'bg-gray-900/50 border-gray-700 cursor-default opacity-70'
                        }`}
                        onClick={() => isUnlocked && setSelectedGenre(genre.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Icon name={genre.icon} size="lg" className={isUnlocked ? 'text-white' : 'text-gray-500'} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                                {genre.name}
                              </span>
                              <span className={`text-xs ${TIER_COLORS[config.tier]}`}>
                                {config.tier.charAt(0).toUpperCase() + config.tier.slice(1)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                              {config.description}
                            </p>
                            {/* Genre Stats */}
                            {isUnlocked && (
                              <div className="flex gap-3 mt-2 text-xs">
                                <span className="text-gray-400">
                                  <Icon name="clock" size="xs" className="inline mr-1" />
                                  {config.baseDevelopmentTime}d
                                </span>
                                <span className="text-gray-400">
                                  <Icon name="users" size="xs" className="inline mr-1" />
                                  {config.requiredTeamSize}+
                                </span>
                                <span className="text-gacha-gold">
                                  <Icon name="money" size="xs" className="inline mr-1" />
                                  ${config.baseARPDAU.toFixed(2)}/{t.metrics.dau}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Unlock Button for locked genres */}
                        {!isUnlocked && (
                          <div className="mt-2 pt-2 border-t border-gray-700">
                            <Button
                              size="sm"
                              fullWidth
                              variant={canAfford ? 'primary' : 'secondary'}
                              disabled={!canAfford}
                              onClick={() => {
                                dispatch(GameActions.unlockGenre(genre.id));
                              }}
                            >
                              <Icon name="lock" size="xs" className="mr-1" />
                              {t.games.unlock} {formatCurrency(config.unlockCost)}
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Selected Genre Details */}
              {selectedGenre && (
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <h4 className="text-sm font-semibold text-white mb-2">
                    {GENRE_CONFIGS[selectedGenre].name} {t.games.details}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">{t.games.devTime}:</span>
                      <span className="text-white ml-1">{GENRE_CONFIGS[selectedGenre].baseDevelopmentTime} {t.common.days}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">{t.games.teamSize}:</span>
                      <span className="text-white ml-1">{GENRE_CONFIGS[selectedGenre].requiredTeamSize}+ {t.games.members}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">{t.games.maxDAU}:</span>
                      <span className="text-white ml-1">{GENRE_CONFIGS[selectedGenre].maxDAU.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">{t.games.whaleRate}:</span>
                      <span className="text-gacha-gold ml-1">{(GENRE_CONFIGS[selectedGenre].whalePercentage * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400">{t.games.retention}:</span>
                      <span className="text-green-400 ml-1">{(GENRE_CONFIGS[selectedGenre].retentionRate * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400">{t.games.contentNeed}:</span>
                      <span className={`ml-1 ${GENRE_CONFIGS[selectedGenre].contentDemand > 0.7 ? 'text-red-400' : GENRE_CONFIGS[selectedGenre].contentDemand > 0.4 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {GENRE_CONFIGS[selectedGenre].contentDemand > 0.7 ? t.games.high : GENRE_CONFIGS[selectedGenre].contentDemand > 0.4 ? t.games.medium : t.games.low}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowNewGame(false)}
                >
                  {t.common.cancel}
                </Button>
                <Button
                  fullWidth
                  onClick={handleCreateGame}
                  disabled={!newGameName.trim()}
                >
                  {t.games.createProject}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Games List */}
      {games.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <Icon name="games" size="xl" className="mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400">{t.games.noGamesYet}</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {games.map((game) => {
            // Calculate team data for breakdown - include founder if assigned
            const teamMembers: TeamMemberForCalculation[] = [];
            
            // Add founder if assigned to this game
            if (founder && game.assignedEmployees.includes(founder.id)) {
              teamMembers.push({
                skills: founder.skills,
                morale: Math.round(founder.energy * 0.8 + 20), // Energy affects morale-like behavior
                role: founder.specialization === 'programmer' ? 'Programmer' :
                      founder.specialization === 'artist' ? 'Artist' :
                      founder.specialization === 'designer' ? 'Designer' : 'Designer',
              });
            }
            
            // Add employees (excluding founder ID)
            game.assignedEmployees
              .filter(empId => !founder || empId !== founder.id)
              .map(empId => employees.find(e => e.id === empId))
              .filter((e): e is NonNullable<typeof e> => e != null)
              .forEach(emp => {
                teamMembers.push({
                  skills: emp.skills,
                  morale: emp.morale,
                  role: emp.role,
                });
              });
            
            const teamBreakdown = calculateTeamEffectivenessBreakdown(teamMembers);
            
            const isCollapsed = collapsedGames.has(game.id);
            const needsAttention = gameNeedsAttention(game);

            return (
            <Card key={game.id} className={needsAttention ? 'ring-2 ring-yellow-500/50' : ''}>
              {/* Collapsible Header */}
              <div 
                className="flex justify-between items-start cursor-pointer"
                onClick={() => toggleGameCollapse(game.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{game.name}</h3>
                    {needsAttention && (
                      <Icon name="warning" size="sm" className="text-yellow-400" />
                    )}
                  </div>
                  <div className="flex gap-2 mt-1 items-center flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300 capitalize">
                      {game.genre}
                    </span>
                    <PhaseInfoTooltip phaseId={game.status}>
                      <span className={`text-xs px-2 py-0.5 rounded capitalize cursor-help flex items-center gap-1 ${
                        game.status === 'live' 
                          ? 'bg-green-900 text-green-300'
                          : game.status === 'shutdown'
                          ? 'bg-red-900 text-red-300'
                          : 'bg-blue-900 text-blue-300'
                      }`}>
                        {game.status.replace('_', ' ')} <Icon name="question" size="xs" className="text-gray-400" />
                      </span>
                    </PhaseInfoTooltip>
                    {/* Quick stats when collapsed */}
                    {isCollapsed && game.status === 'live' && (
                      <>
                        <span className="text-xs text-gray-400">
                          {t.metrics.dau}: {game.monetization.dailyActiveUsers.toLocaleString()}
                        </span>
                        <span className="text-xs text-gacha-gold">
                          ${game.monetization.monthlyRevenue.toLocaleString()}/mo
                        </span>
                        <span className={`text-xs ${
                          game.monetization.playerSatisfaction >= 70 ? 'text-green-400' :
                          game.monetization.playerSatisfaction >= 40 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {Math.round(game.monetization.playerSatisfaction)}% {t.games.sat}
                        </span>
                      </>
                    )}
                    {isCollapsed && game.status !== 'live' && game.status !== 'shutdown' && (
                      <span className="text-xs text-purple-400">
                        {Math.round(game.developmentProgress)}% {t.games.done}
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  className="p-1 hover:bg-gray-700 rounded transition-colors ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleGameCollapse(game.id);
                  }}
                >
                  <Icon 
                    name={isCollapsed ? 'chevronDown' : 'chevronUp'} 
                    size="sm" 
                    className="text-gray-400" 
                  />
                </button>
              </div>

              {/* Collapsible Content */}
              {!isCollapsed && (
                <>
                  {/* Development Progress with Breakdown */}
                  {game.status !== 'live' && game.status !== 'shutdown' && (
                    <div className="mb-4 space-y-2 mt-3">
                      <ProgressBar
                        value={game.developmentProgress}
                        color="purple"
                        showLabel
                        label="Development"
                      />
                      <ProgressBreakdownPanel
                        breakdown={teamBreakdown}
                        currentPhase={game.status}
                      />
                    </div>
                  )}

              {/* Quality Metrics */}
              <div className="grid grid-cols-5 gap-1 mb-4">
                {[
                  { label: t.games.qualityGraphics, value: game.quality.graphics },
                  { label: t.games.qualityGameplay, value: game.quality.gameplay },
                  { label: t.games.qualityStory, value: game.quality.story },
                  { label: t.games.qualitySound, value: game.quality.sound },
                  { label: t.games.qualityPolish, value: game.quality.polish },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-xs text-gray-400">{stat.label}</div>
                    <div className="text-sm font-semibold text-white">
                      {Math.round(stat.value)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Assigned Team (including Founder) */}
              <div className="mb-4">
                {(() => {
                  const employeeCount = getEmployeeCount(game);
                  const founderAssigned = isFounderAssignedTo(game.id);
                  let teamDisplay = '';
                  
                  if (founderAssigned && employeeCount === 0) {
                    teamDisplay = t.games.onlyYou;
                  } else if (founderAssigned) {
                    teamDisplay = `${t.games.you} + ${employeeCount} ${employeeCount === 1 ? t.games.member : t.games.members}`;
                  } else {
                    teamDisplay = `${employeeCount} ${employeeCount === 1 ? t.games.member : t.games.members}`;
                  }
                  
                  return (
                    <p className="text-sm text-gray-400 mb-2">
                      {t.games.team} ({teamDisplay})
                    </p>
                  );
                })()}
                {game.assignedEmployees.length === 0 && !isFounderAssignedTo(game.id) && game.status !== 'live' && game.status !== 'shutdown' && (
                  <div className="text-sm text-yellow-400 bg-yellow-900/30 rounded-lg p-2 mb-2 flex items-center gap-2">
                    <Icon name="warning" size="sm" className="text-yellow-400" /> {t.games.noOneAssignedHire}
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  {/* Show founder first if assigned */}
                  {isFounderAssignedTo(game.id) && founder && (
                    <button
                      onClick={() => handleUnassignFounder(game.id)}
                      className="text-xs px-2 py-1 bg-gacha-purple/30 border border-gacha-purple rounded-full text-gacha-purple hover:bg-gacha-purple/50 transition-colors flex items-center gap-1"
                      title={t.games.clickToUnassignYourself}
                    >
                      <Icon name="star" size="xs" /> {t.games.you} ({founder.name.split(' ')[0]})
                    </button>
                  )}
                  {game.assignedEmployees.map((empId) => {
                    // Skip founder ID, we show them separately
                    if (founder && empId === founder.id) return null;
                    const emp = employees.find(e => e.id === empId);
                    return emp ? (
                      <button
                        key={empId}
                        onClick={() => handleUnassignEmployee(game.id, empId)}
                        className="text-xs px-2 py-1 bg-gray-700 rounded-full text-gray-300 hover:bg-red-900/30 hover:text-red-300 transition-colors"
                        title={t.games.clickToUnassign}
                      >
                        {emp.name.split(' ')[0]}
                      </button>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Actions */}
              {game.status !== 'live' && game.status !== 'shutdown' && (
                <div className="space-y-2">
                  {/* Assign Founder Button */}
                  {founder && isFounderAvailable() && (
                    <Button
                      fullWidth
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAssignFounder(game.id)}
                      className="flex items-center justify-center gap-2"
                    >
                      <Icon name="star" size="sm" /> {t.games.assignYourself}
                    </Button>
                  )}
                  {availableEmployees.length > 0 && (
                    <select
                      aria-label={t.games.assignEmployee}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAssignEmployee(game.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="">+ {t.games.assignEmployee}</option>
                      {availableEmployees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {game.developmentProgress >= 100 && (
                    <Button
                      fullWidth
                      variant="success"
                      onClick={() => setShowLaunchModal(game.id)}
                      className="flex items-center justify-center gap-2"
                    >
                      <Icon name="rocket" size="sm" className="text-white" /> {t.games.launchGame}
                    </Button>
                  )}
                </div>
              )}

              {/* Testing Phase Stats */}
              {game.status === 'testing' && state.launchStates[game.id] && (
                <div className="space-y-3 pt-3 border-t border-gray-700">
                  <div className="flex items-center gap-2">
                    <Icon name="flask" size="sm" className="text-blue-400" />
                    <span className="text-sm font-semibold text-white">
                      {state.launchStates[game.id].currentPhase.toUpperCase()} {t.games.phase}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">{t.games.testers}</p>
                      <p className="text-white">{game.monetization.dailyActiveUsers.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{t.games.feedbackResolved}</p>
                      <p className="text-white">
                        {state.launchStates[game.id].resolvedFeedbackCount} / {state.launchStates[game.id].totalFeedbackCount}
                      </p>
                    </div>
                  </div>
                  <Button
                    fullWidth
                    variant="primary"
                    disabled={state.launchStates[game.id].currentPhase === 'alpha'}
                    onClick={() => dispatch(GameActions.advanceLaunchPhase(game.id))}
                  >
                    {t.games.advanceToNextPhase}
                  </Button>
                </div>
              )}

              {/* Live Game Stats & Management */}
              {game.status === 'live' && (
                <div className="space-y-4 pt-3 border-t border-gray-700">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">{t.games.dau}</p>
                      <p className="text-lg font-semibold text-white">
                        {game.monetization.dailyActiveUsers.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{t.games.estDailyChurn}</p>
                      {(() => {
                        // Calculate estimated churn based on satisfaction and genre retention
                        const genreConfig = GENRE_CONFIGS[game.genre];
                        const baseRetention = genreConfig?.retentionRate ?? 0.95;
                        const satisfactionFactor = game.monetization.playerSatisfaction / 100;
                        const adjustedRetention = baseRetention * (0.8 + satisfactionFactor * 0.2);
                        const churnRate = 1 - adjustedRetention;
                        const estimatedChurn = Math.round(game.monetization.dailyActiveUsers * churnRate);
                        const churnPercent = (churnRate * 100).toFixed(1);
                        return (
                          <p className={`text-lg font-semibold ${churnRate > 0.1 ? 'text-red-400' : churnRate > 0.05 ? 'text-yellow-400' : 'text-gray-300'}`}>
                            -{estimatedChurn.toLocaleString()} <span className="text-xs text-gray-400">({churnPercent}%)</span>
                          </p>
                        );
                      })()}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{t.games.revenue}</p>
                      <p className="text-lg font-semibold text-gacha-gold">
                        ${game.monetization.monthlyRevenue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Player Satisfaction */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">{t.games.playerSatisfaction}</span>
                      <span className={`${
                        game.monetization.playerSatisfaction >= 70 ? 'text-green-400' :
                        game.monetization.playerSatisfaction >= 40 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {Math.round(game.monetization.playerSatisfaction)}%
                      </span>
                    </div>
                    <ProgressBar
                      value={game.monetization.playerSatisfaction}
                      color={
                        game.monetization.playerSatisfaction >= 70 ? 'green' :
                        game.monetization.playerSatisfaction >= 40 ? 'gold' : 'red'
                      }
                      size="sm"
                    />
                    {game.monetization.playerSatisfaction < 50 && (
                      <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                        <Icon name="warning" size="xs" /> {t.games.lowSatisfactionWarning}
                      </p>
                    )}
                  </div>

                  {/* Maintenance Team */}
                  <div>
                    <p className="text-xs text-gray-400 mb-2">
                      {t.games.maintenanceTeam} <span className="text-gray-500">{t.games.maintenanceTeamHint}</span>
                    </p>
                    {(game.assignedEmployees.length > 0 || isFounderAssignedTo(game.id)) ? (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {/* Show founder first if assigned */}
                        {isFounderAssignedTo(game.id) && founder && (
                          <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full border bg-gacha-purple/30 text-gacha-purple border-gacha-purple">
                            <Icon name="star" size="xs" />
                            <span>{t.games.you} ({founder.name.split(' ')[0]})</span>
                            <button
                              onClick={() => handleUnassignFounder(game.id)}
                              className="ml-1 hover:text-red-400"
                              title={t.games.clickToUnassignYourself}
                            >
                              <Icon name="close" size="xs" />
                            </button>
                          </div>
                        )}
                        {game.assignedEmployees.map((empId) => {
                          // Skip founder ID, we show them separately
                          if (founder && empId === founder.id) return null;
                          const emp = employees.find(e => e.id === empId);
                          if (!emp) return null;
                          const isMarketer = emp.role === 'Marketer';
                          return (
                            <div
                              key={empId}
                              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${
                                isMarketer 
                                  ? 'bg-green-900/50 text-green-300 border-green-700' 
                                  : 'bg-blue-900/50 text-blue-300 border-blue-700'
                              }`}
                            >
                              <Icon name={isMarketer ? 'megaphone' : 'staff'} size="xs" />
                              <span>{emp.name}</span>
                              <button
                                onClick={() => handleUnassignEmployee(game.id, empId)}
                                className="ml-1 hover:text-red-400"
                                title={t.games.removeFromGame}
                              >
                                <Icon name="close" size="xs" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-yellow-400 bg-yellow-900/30 rounded-lg p-2 mb-2 flex items-center gap-1">
                        <Icon name="lightbulb" size="xs" /> {t.games.assignStaffHint}
                      </p>
                    )}
                    
                    {/* Staff Benefits Explainer */}
                    <div className="text-xs text-gray-500 mb-2 space-y-1">
                      <p>• <span className="text-green-400">{t.roles.marketer}</span> {t.games.marketersBoost}</p>
                      <p>• <span className="text-blue-400">{t.games.developers}</span> {t.games.developersHelp}</p>
                    </div>
                    
                    {/* Assign Staff */}
                    {availableEmployees.length > 0 && (
                      <select
                        aria-label={t.games.assignStaff}
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignEmployee(game.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="">+ {t.games.assignStaff}</option>
                        {availableEmployees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.role})
                          </option>
                        ))}
                      </select>
                    )}
                    
                    {/* Assign Founder Button for Live Games */}
                    {founder && isFounderAvailable() && (
                      <Button
                        fullWidth
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAssignFounder(game.id)}
                        className="flex items-center justify-center gap-2 mt-2"
                      >
                        <Icon name="star" size="sm" /> {t.games.assignYourself}
                      </Button>
                    )}
                  </div>
                  
                  {/* Improvement Tasks */}
                  <div>
                    <p className="text-xs text-gray-400 mb-2">{t.games.quickImprovements}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.entries(IMPROVEMENT_TASKS) as [ImprovementFocus, typeof IMPROVEMENT_TASKS[ImprovementFocus]][])
                        .slice(0, 4)
                        .map(([focus, task]) => (
                          <div
                            key={focus}
                            className="p-2 bg-gray-800 rounded-lg border border-gray-700 text-xs"
                          >
                            <p className="font-semibold text-white">{task.name}</p>
                            <p className="text-gray-400 mt-0.5">{task.durationDays} days</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(task.qualityBoosts).map(([stat, boost]) => (
                                <span key={stat} className="text-green-400">
                                  +{boost} {stat}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 italic">
                      {t.games.autoImprovementNote}
                    </p>
                  </div>

                  {/* Shutdown Button */}
                  <Button
                    fullWidth
                    variant="danger"
                    onClick={() => handleShutdownGame(game.id)}
                    className="flex items-center justify-center gap-2"
                  >
                    <Icon name="blocked" size="sm" className="text-white" /> {t.games.shutdownGame}
                  </Button>
                </div>
              )}

              {/* Shutdown Game Display */}
              {game.status === 'shutdown' && (
                <div className="pt-3 border-t border-gray-700 space-y-3">
                  <p className="text-sm text-red-400 text-center flex items-center justify-center gap-2">
                    <Icon name="blocked" size="sm" className="text-red-400" /> {t.games.gameShutdown}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      fullWidth
                      variant="success"
                      onClick={() => handleRelaunchGame(game.id)}
                      className="flex items-center justify-center gap-2"
                    >
                      <Icon name="rocket" size="sm" /> {t.games.relaunchGame}
                    </Button>
                    <Button
                      fullWidth
                      variant="danger"
                      onClick={() => handleDeleteGame(game.id)}
                      className="flex items-center justify-center gap-2"
                    >
                      <Icon name="close" size="sm" /> {t.games.deleteGame}
                    </Button>
                  </div>
                </div>
              )}
                </>
              )}
            </Card>
            );
          })}
        </div>
      )}

      {/* Launch Type Modal */}
      {showLaunchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">{t.games.chooseLaunchType}</h3>
            <p className="text-sm text-gray-400 mb-4">
              {t.games.howToLaunch}
            </p>
            
            <div className="space-y-3">
              {/* Instant Launch */}
              <button
                onClick={() => handleLaunchGame(showLaunchModal)}
                className="w-full p-4 rounded-lg border-2 border-green-600 bg-green-900/20 hover:bg-green-900/40 text-left transition"
              >
                <div className="flex items-center gap-3">
                  <Icon name="rocket" size="lg" className="text-green-400" />
                  <div>
                    <h4 className="font-semibold text-white">{t.games.instantGlobalLaunch}</h4>
                    <p className="text-xs text-gray-400">
                      {t.games.instantLaunchDesc}
                    </p>
                  </div>
                </div>
              </button>
              
              {/* Phased Launch */}
              <button
                onClick={() => handlePhasedLaunch(showLaunchModal)}
                className="w-full p-4 rounded-lg border-2 border-blue-600 bg-blue-900/20 hover:bg-blue-900/40 text-left transition"
              >
                <div className="flex items-center gap-3">
                  <Icon name="flask" size="lg" className="text-blue-400" />
                  <div>
                    <h4 className="font-semibold text-white">{t.games.phasedLaunch}</h4>
                    <p className="text-xs text-gray-400 mb-2">
                      {t.games.phasedLaunchDesc}
                    </p>
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-0.5 bg-blue-800/50 rounded text-blue-200">
                        Alpha: {LAUNCH_PHASE_CONFIGS.alpha.recommendedDurationDays}d
                      </span>
                      <span className="px-2 py-0.5 bg-blue-800/50 rounded text-blue-200">
                        Beta: {LAUNCH_PHASE_CONFIGS.beta.recommendedDurationDays}d
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={() => setShowLaunchModal(null)}>
                {t.common.cancel}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
