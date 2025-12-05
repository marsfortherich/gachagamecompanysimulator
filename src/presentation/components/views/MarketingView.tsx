import { useState } from 'react';
import { useGame } from '../../context';
import { GameActions } from '../../../application/actions';
import { Card, Button, ProgressBar, Icon } from '../common';
import { 
  Game, 
  Employee, 
  CAMPAIGN_DEFINITIONS, 
  CampaignType,
  calculateCampaignCost,
  isCampaignOnCooldown,
  isCampaignActive,
  getCampaignCooldownRemaining,
  getActiveCampaigns,
} from '../../../domain';

/**
 * Get all campaign types from definitions
 */
const CAMPAIGN_TYPES = Object.values(CAMPAIGN_DEFINITIONS);

/**
 * MarketingView - Run campaigns and manage marketing team
 */
export function MarketingView() {
  const { state, dispatch } = useGame();
  const { games, employees, company, campaigns, currentTick } = state;

  // Get live games and marketers
  const liveGames = games.filter(g => g.status === 'live');
  const marketers = employees.filter(e => e.role === 'Marketer');
  const availableMarketers = marketers.filter(e => e.isAvailable);

  // Selected game for marketing
  const [selectedGameId, setSelectedGameId] = useState<string | null>(
    liveGames.length > 0 ? liveGames[0].id : null
  );

  const selectedGame = liveGames.find(g => g.id === selectedGameId);

  // Get assigned marketers for selected game
  const getAssignedMarketers = (game: Game): Employee[] => {
    return game.assignedEmployees
      .map(id => employees.find(e => e.id === id))
      .filter((e): e is Employee => e !== undefined && e.role === 'Marketer');
  };

  const handleAssignMarketer = (gameId: string, employeeId: string) => {
    dispatch(GameActions.assignToProject(employeeId, gameId));
  };

  const handleUnassignMarketer = (gameId: string, employeeId: string) => {
    dispatch(GameActions.unassignFromProject(employeeId, gameId));
  };

  const handleStartCampaign = (gameId: string, campaignType: CampaignType) => {
    dispatch(GameActions.startCampaign(gameId, campaignType));
  };

  // Calculate marketing effectiveness
  const calculateMarketingBonus = (game: Game): number => {
    const assignedMarketers = getAssignedMarketers(game);
    if (assignedMarketers.length === 0) return 0;

    // Base 50% boost per marketer, modified by their skill
    const totalBoost = assignedMarketers.reduce((sum, m) => {
      const marketingSkill = m.skills.marketing || 50;
      return sum + (0.5 * (marketingSkill / 100));
    }, 0);

    return Math.min(totalBoost, 2.0); // Cap at 200% bonus
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Icon name="marketing" size="lg" /> Marketing
        </h2>
        <div className="text-sm text-gray-400">
          Budget: <span className="text-gacha-gold font-semibold">
            ${company?.funds.toLocaleString() ?? 0}
          </span>
        </div>
      </div>

      {/* Marketing Team Overview */}
      <Card title="Marketing Team">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-white">{marketers.length}</p>
            <p className="text-xs text-gray-400">Total Marketers</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{availableMarketers.length}</p>
            <p className="text-xs text-gray-400">Available</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{marketers.length - availableMarketers.length}</p>
            <p className="text-xs text-gray-400">Assigned</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gacha-purple">
              {marketers.length > 0 
                ? Math.round(marketers.reduce((sum, m) => sum + (m.skills.marketing || 50), 0) / marketers.length)
                : 0}
            </p>
            <p className="text-xs text-gray-400">Avg. Skill</p>
          </div>
        </div>

        {marketers.length === 0 && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 text-center">
            <p className="text-yellow-400 flex items-center justify-center gap-1">
              <Icon name="warning" size="sm" /> No marketers hired!
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Hire marketers from the Staff tab to boost your games' user acquisition.
            </p>
          </div>
        )}
      </Card>

      {liveGames.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Icon name="games" size="xl" className="mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400">No live games to market</p>
            <p className="text-sm text-gray-500 mt-2">
              Launch a game first to run marketing campaigns.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Selection */}
          <div className="lg:col-span-1">
            <Card title="Live Games">
              <div className="space-y-2">
                {liveGames.map(game => {
                  const marketingBonus = calculateMarketingBonus(game);
                  const assignedMarketers = getAssignedMarketers(game);

                  return (
                    <button
                      key={game.id}
                      onClick={() => setSelectedGameId(game.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedGameId === game.id
                          ? 'bg-gacha-purple text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      <div className="font-semibold">{game.name}</div>
                      <div className="text-sm opacity-75">
                        DAU: {game.monetization.dailyActiveUsers.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs flex items-center gap-1">
                          <Icon name="megaphone" size="xs" /> {assignedMarketers.length} marketer{assignedMarketers.length !== 1 ? 's' : ''}
                        </span>
                        {marketingBonus > 0 && (
                          <span className="text-xs text-green-400">
                            +{(marketingBonus * 100).toFixed(0)}% DAU
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Marketing Management */}
          <div className="lg:col-span-2">
            {selectedGame ? (
              <div className="space-y-4">
                {/* Assigned Marketers */}
                <Card title={`${selectedGame.name} - Marketing Team`}>
                  <div className="space-y-4">
                    {/* Current DAU Boost */}
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Marketing Boost</span>
                        <span className="text-green-400 font-semibold">
                          +{(calculateMarketingBonus(selectedGame) * 100).toFixed(0)}% DAU Growth
                        </span>
                      </div>
                      <ProgressBar
                        value={calculateMarketingBonus(selectedGame) * 50}
                        max={100}
                        color="green"
                      />
                    </div>

                    {/* Assigned Marketers List */}
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Assigned Marketers</p>
                      {getAssignedMarketers(selectedGame).length > 0 ? (
                        <div className="space-y-2">
                          {getAssignedMarketers(selectedGame).map(marketer => (
                            <div
                              key={marketer.id}
                              className="flex items-center justify-between bg-gray-700 rounded-lg p-3"
                            >
                              <div>
                                <span className="text-white font-medium">{marketer.name}</span>
                                <span className="text-sm text-gray-400 ml-2">
                                  Marketing: {marketer.skills.marketing || 50}
                                </span>
                              </div>
                              <Button
                                variant="danger"
                                onClick={() => handleUnassignMarketer(selectedGame.id, marketer.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-center">
                          <p className="text-yellow-400 text-sm">No marketers assigned</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Assign marketers to boost user acquisition
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Assign Marketer Dropdown */}
                    {availableMarketers.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">Add Marketer</p>
                        <select
                          aria-label="Select a marketer to assign"
                          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg"
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAssignMarketer(selectedGame.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          defaultValue=""
                        >
                          <option value="">+ Select a marketer...</option>
                          {availableMarketers.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} (Marketing: {m.skills.marketing || 50})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Active Campaigns */}
                {getActiveCampaigns(selectedGame.id, campaigns).length > 0 && (
                  <Card title="Active Campaigns">
                    <div className="space-y-3">
                      {getActiveCampaigns(selectedGame.id, campaigns).map(campaign => {
                        const definition = CAMPAIGN_DEFINITIONS[campaign.type];
                        const remainingDays = campaign.endTick - currentTick;
                        const progress = ((definition.duration - remainingDays) / definition.duration) * 100;
                        
                        return (
                          <div key={campaign.id} className="bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Icon name="target" />
                                <span className="text-white font-medium">{definition.name}</span>
                              </div>
                              <span className="text-green-400 text-sm">
                                {remainingDays} days left
                              </span>
                            </div>
                            <ProgressBar value={progress} max={100} color="green" />
                            <div className="flex gap-4 mt-2 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Icon name="chart-up" size="xs" /> +{(campaign.effects.dauBoost * 100).toFixed(0)}% DAU
                              </span>
                              {campaign.effects.retentionBoost > 0 && (
                                <span className="flex items-center gap-1">
                                  <Icon name="refresh" size="xs" /> +{(campaign.effects.retentionBoost * 100).toFixed(0)}% Retention
                                </span>
                              )}
                              {campaign.effects.revenueBoost > 0 && (
                                <span className="flex items-center gap-1">
                                  <Icon name="money" size="xs" /> +{(campaign.effects.revenueBoost * 100).toFixed(0)}% Revenue
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {/* Campaign Types */}
                <Card title="Launch Campaign">
                  <div className="space-y-3">
                    {CAMPAIGN_TYPES.map(campaignDef => {
                      const cost = calculateCampaignCost(campaignDef.type, selectedGame.monetization.dailyActiveUsers);
                      const isActive = isCampaignActive(campaignDef.type, selectedGame.id, campaigns);
                      const onCooldown = isCampaignOnCooldown(campaignDef.type, selectedGame.id, campaigns, currentTick);
                      const cooldownRemaining = getCampaignCooldownRemaining(campaignDef.type, selectedGame.id, campaigns, currentTick);
                      const canAfford = (company?.funds ?? 0) >= cost;
                      const canStart = !isActive && !onCooldown && canAfford;
                      
                      return (
                        <div
                          key={campaignDef.type}
                          className={`bg-gray-700 rounded-lg p-4 ${(!canStart) ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <Icon name="target" size="lg" />
                              <div>
                                <p className="text-white font-medium">{campaignDef.name}</p>
                                <p className="text-sm text-gray-400">{campaignDef.description}</p>
                                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Icon name="chart-up" size="xs" /> +{(campaignDef.dauBoost * 100).toFixed(0)}% DAU
                                  </span>
                                  {campaignDef.retentionBoost > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Icon name="refresh" size="xs" /> +{(campaignDef.retentionBoost * 100).toFixed(0)}% Retention
                                    </span>
                                  )}
                                  {campaignDef.revenueBoost > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Icon name="money" size="xs" /> +{(campaignDef.revenueBoost * 100).toFixed(0)}% Revenue
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Icon name="clock" size="xs" /> {campaignDef.duration} days
                                  </span>
                                  <span className={`flex items-center gap-1 ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                                    <Icon name="money" size="xs" /> ${cost.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {isActive ? (
                                <span className="text-green-400 text-sm px-3 py-1 bg-green-900/30 rounded">
                                  Active
                                </span>
                              ) : onCooldown ? (
                                <span className="text-yellow-400 text-sm px-3 py-1 bg-yellow-900/30 rounded flex items-center gap-1">
                                  <Icon name="clock" size="xs" /> {cooldownRemaining} days
                                </span>
                              ) : (
                                <Button 
                                  variant="primary"
                                  disabled={!canStart}
                                  onClick={() => handleStartCampaign(selectedGame.id, campaignDef.type)}
                                >
                                  Start
                                </Button>
                              )}
                              {!canAfford && !isActive && !onCooldown && (
                                <span className="text-red-400 text-xs">Insufficient funds</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            ) : (
              <Card>
                <div className="text-center py-8 text-gray-400">
                  Select a game to manage its marketing
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
