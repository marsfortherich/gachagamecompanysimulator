import { useState } from 'react';
import { useGame } from '../../context';
import { GameActions } from '../../../application/actions';
import { Card, Button, Input, ProgressBar, Icon, IconName } from '../common';
import { GameGenre, GENRE_CONFIGS, GenreTier } from '../../../domain';
import { IMPROVEMENT_TASKS, ImprovementFocus } from '../../../domain/game/LiveGameImprovement';
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
  const { games, employees, company, unlockedGenres } = state;
  const [showNewGame, setShowNewGame] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<GameGenre>('idle'); // Start with an unlocked genre

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

  const handleLaunchGame = (gameId: string) => {
    dispatch(GameActions.launchGame(gameId));
  };

  const handleShutdownGame = (gameId: string) => {
    if (confirm('Are you sure you want to shutdown this game? This will stop all revenue generation.')) {
      dispatch(GameActions.shutdownGame(gameId));
    }
  };

  const availableEmployees = employees.filter(e => e.isAvailable);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Game Projects</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowHelp(true)}>
            ? Help
          </Button>
          <Button onClick={() => setShowNewGame(true)}>+ New Game</Button>
        </div>
      </div>

      {/* Help Modal */}
      <PhaseHelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* New Game Modal */}
      {showNewGame && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-lg my-8">
            <h3 className="text-xl font-bold text-white mb-4">Start New Game Project</h3>
            <div className="space-y-4">
              <Input
                label="Game Name"
                placeholder="Enter game name..."
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Genre <span className="text-xs text-gray-500">(click to select, some require unlocking)</span>
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
                                  ${config.baseARPDAU.toFixed(2)}/DAU
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
                              Unlock {formatCurrency(config.unlockCost)}
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
                    {GENRE_CONFIGS[selectedGenre].name} Details
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">Dev Time:</span>
                      <span className="text-white ml-1">{GENRE_CONFIGS[selectedGenre].baseDevelopmentTime} days</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Team Size:</span>
                      <span className="text-white ml-1">{GENRE_CONFIGS[selectedGenre].requiredTeamSize}+ members</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Max DAU:</span>
                      <span className="text-white ml-1">{GENRE_CONFIGS[selectedGenre].maxDAU.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Whale Rate:</span>
                      <span className="text-gacha-gold ml-1">{(GENRE_CONFIGS[selectedGenre].whalePercentage * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Retention:</span>
                      <span className="text-green-400 ml-1">{(GENRE_CONFIGS[selectedGenre].retentionRate * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Content Need:</span>
                      <span className={`ml-1 ${GENRE_CONFIGS[selectedGenre].contentDemand > 0.7 ? 'text-red-400' : GENRE_CONFIGS[selectedGenre].contentDemand > 0.4 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {GENRE_CONFIGS[selectedGenre].contentDemand > 0.7 ? 'High' : GENRE_CONFIGS[selectedGenre].contentDemand > 0.4 ? 'Medium' : 'Low'}
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
                  Cancel
                </Button>
                <Button
                  fullWidth
                  onClick={handleCreateGame}
                  disabled={!newGameName.trim()}
                >
                  Create Project
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
            <p className="text-gray-400">No games yet. Start your first project!</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {games.map((game) => {
            // Calculate team data for breakdown
            const teamMembers: TeamMemberForCalculation[] = game.assignedEmployees
              .map(empId => employees.find(e => e.id === empId))
              .filter((e): e is NonNullable<typeof e> => e != null)
              .map(emp => ({
                skills: emp.skills,
                morale: emp.morale,
                role: emp.role,
              }));
            const teamBreakdown = calculateTeamEffectivenessBreakdown(teamMembers);

            return (
            <Card key={game.id}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-white">{game.name}</h3>
                  <div className="flex gap-2 mt-1 items-center">
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300 capitalize">
                      {game.genre}
                    </span>
                    <PhaseInfoTooltip phaseId={game.status}>
                      <span className={`text-xs px-2 py-0.5 rounded capitalize cursor-help flex items-center gap-1 ${
                        game.status === 'live' 
                          ? 'bg-green-900 text-green-300'
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {game.status.replace('_', ' ')} <Icon name="question" size="xs" className="text-gray-400" />
                      </span>
                    </PhaseInfoTooltip>
                  </div>
                </div>
              </div>

              {/* Development Progress with Breakdown */}
              {game.status !== 'live' && game.status !== 'shutdown' && (
                <div className="mb-4 space-y-2">
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
                  { label: 'GFX', value: game.quality.graphics },
                  { label: 'Play', value: game.quality.gameplay },
                  { label: 'Story', value: game.quality.story },
                  { label: 'Sound', value: game.quality.sound },
                  { label: 'Polish', value: game.quality.polish },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-xs text-gray-400">{stat.label}</div>
                    <div className="text-sm font-semibold text-white">
                      {Math.round(stat.value)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Assigned Employees */}
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">
                  Team ({game.assignedEmployees.length} members)
                </p>
                {game.assignedEmployees.length === 0 && game.status !== 'live' && game.status !== 'shutdown' && (
                  <div className="text-sm text-yellow-400 bg-yellow-900/30 rounded-lg p-2 mb-2 flex items-center gap-2">
                    <Icon name="warning" size="sm" className="text-yellow-400" /> No employees assigned! Assign team members to make progress.
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  {game.assignedEmployees.map((empId) => {
                    const emp = employees.find(e => e.id === empId);
                    return emp ? (
                      <span
                        key={empId}
                        className="text-xs px-2 py-1 bg-gray-700 rounded-full text-gray-300"
                      >
                        {emp.name.split(' ')[0]}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Actions */}
              {game.status !== 'live' && game.status !== 'shutdown' && (
                <div className="space-y-2">
                  {availableEmployees.length > 0 && (
                    <select
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAssignEmployee(game.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="">+ Assign employee...</option>
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
                      onClick={() => handleLaunchGame(game.id)}
                      className="flex items-center justify-center gap-2"
                    >
                      <Icon name="rocket" size="sm" className="text-white" /> Launch Game
                    </Button>
                  )}
                </div>
              )}

              {/* Live Game Stats & Management */}
              {game.status === 'live' && (
                <div className="space-y-4 pt-3 border-t border-gray-700">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">DAU</p>
                      <p className="text-lg font-semibold text-white">
                        {game.monetization.dailyActiveUsers.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Revenue</p>
                      <p className="text-lg font-semibold text-gacha-gold">
                        ${game.monetization.monthlyRevenue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Player Satisfaction */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Player Satisfaction</span>
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
                        <Icon name="warning" size="xs" /> Low satisfaction reduces revenue and causes player churn!
                      </p>
                    )}
                  </div>

                  {/* Maintenance Team */}
                  <div>
                    <p className="text-xs text-gray-400 mb-2">
                      Maintenance Team <span className="text-gray-500">(assigns staff to maintain/improve the game)</span>
                    </p>
                    {game.assignedEmployees.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {game.assignedEmployees.map((empId) => {
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
                                title="Remove from game"
                              >
                                <Icon name="close" size="xs" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-yellow-400 bg-yellow-900/30 rounded-lg p-2 mb-2 flex items-center gap-1">
                        <Icon name="lightbulb" size="xs" /> Assign staff to maintain the game and slow satisfaction decay!
                      </p>
                    )}
                    
                    {/* Staff Benefits Explainer */}
                    <div className="text-xs text-gray-500 mb-2 space-y-1">
                      <p>• <span className="text-green-400">Marketers</span> boost DAU by 50%</p>
                      <p>• <span className="text-blue-400">Developers</span> maintain satisfaction & improve quality</p>
                    </div>
                    
                    {/* Assign Staff */}
                    {availableEmployees.length > 0 && (
                      <select
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignEmployee(game.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="">+ Assign staff...</option>
                        {availableEmployees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.role})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  {/* Improvement Tasks */}
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Quick Improvements</p>
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
                      Assigned developers automatically work on improvements based on game needs.
                    </p>
                  </div>

                  {/* Shutdown Button */}
                  <Button
                    fullWidth
                    variant="danger"
                    onClick={() => handleShutdownGame(game.id)}
                    className="flex items-center justify-center gap-2"
                  >
                    <Icon name="blocked" size="sm" className="text-white" /> Shutdown Game
                  </Button>
                </div>
              )}

              {/* Shutdown Game Display */}
              {game.status === 'shutdown' && (
                <div className="pt-3 border-t border-gray-700">
                  <p className="text-sm text-red-400 text-center flex items-center justify-center gap-2"><Icon name="blocked" size="sm" className="text-red-400" /> Game has been shutdown</p>
                </div>
              )}
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
