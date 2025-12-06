import { useState } from 'react';
import { useGame } from '../../context';
import { GameActions } from '../../../application/actions';
import { Card, Button, Icon, ProgressBar, Input } from '../common';
import { 
  FEATURE_TYPE_CONFIGS, 
  FeatureType,
  ScheduledFeature,
} from '../../../domain/game/FeatureRoadmap';

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

const FEATURE_ICONS: Record<FeatureType, string> = {
  content_update: '📦',
  seasonal_event: '🎄',
  dlc_expansion: '🎮',
  quality_of_life: '🔧',
  monetization_update: '💰',
  collaboration: '🤝',
  anniversary: '🎂',
  balance_patch: '⚖️',
};

export function FeatureRoadmapView() {
  const { state, dispatch } = useGame();
  const { company, games, scheduledFeatures, currentTick } = state;
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [selectedFeatureType, setSelectedFeatureType] = useState<FeatureType>('content_update');
  const [featureName, setFeatureName] = useState('');
  const [scheduledDays, setScheduledDays] = useState(7);

  if (!company) {
    return (
      <div className="p-6">
        <Card>
          <p className="text-gray-400 text-center">Start a company first to manage your feature roadmap.</p>
        </Card>
      </div>
    );
  }

  const liveGames = games.filter(g => g.status === 'live');

  const handleScheduleFeature = () => {
    if (!selectedGame || !featureName.trim()) return;
    
    dispatch(GameActions.scheduleFeature(
      selectedGame,
      selectedFeatureType,
      featureName.trim(),
      currentTick + scheduledDays
    ));
    
    setShowScheduleModal(false);
    setFeatureName('');
  };

  const handleStartDevelopment = (featureId: string) => {
    dispatch(GameActions.startFeatureDevelopment(featureId));
  };

  const handleReleaseFeature = (featureId: string) => {
    dispatch(GameActions.releaseFeature(featureId));
  };

  const handleCancelFeature = (featureId: string) => {
    if (confirm('Are you sure you want to cancel this feature?')) {
      dispatch(GameActions.cancelFeature(featureId));
    }
  };

  // Group features by game
  const featuresByGame = liveGames.map(game => ({
    game,
    features: scheduledFeatures.filter(f => f.gameId === game.id && f.status !== 'cancelled'),
  }));

  const getStatusColor = (status: ScheduledFeature['status']) => {
    switch (status) {
      case 'planned': return 'bg-blue-900/50 text-blue-300';
      case 'in_progress': return 'bg-yellow-900/50 text-yellow-300';
      case 'ready': return 'bg-green-900/50 text-green-300';
      case 'released': return 'bg-purple-900/50 text-purple-300';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-white">Feature Roadmap</h2>
        <div className="flex gap-2">
          <span className="text-sm text-gray-400">
            Day {currentTick}
          </span>
          <Button onClick={() => setShowScheduleModal(true)} disabled={liveGames.length === 0}>
            + Schedule Feature
          </Button>
        </div>
      </div>

      {/* Schedule Feature Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <h3 className="text-xl font-bold text-white mb-4">Schedule New Feature</h3>
            
            <div className="space-y-4">
              {/* Game Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Game</label>
                <select
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg"
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                >
                  <option value="">Select a game...</option>
                  {liveGames.map(game => (
                    <option key={game.id} value={game.id}>{game.name}</option>
                  ))}
                </select>
              </div>

              {/* Feature Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Feature Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(FEATURE_TYPE_CONFIGS) as [FeatureType, typeof FEATURE_TYPE_CONFIGS[FeatureType]][]).map(([type, config]) => (
                    <div
                      key={type}
                      className={`p-2 rounded-lg border cursor-pointer transition-all ${
                        selectedFeatureType === type 
                          ? 'border-gacha-purple bg-gacha-purple/20' 
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => setSelectedFeatureType(type)}
                    >
                      <div className="flex items-center gap-2">
                        <span>{FEATURE_ICONS[type]}</span>
                        <span className="text-sm text-white">{config.name}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {config.baseDevelopmentDays}d • {formatCurrency(config.baseCost)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature Name */}
              <Input
                label="Feature Name"
                placeholder="e.g., Summer Festival Event"
                value={featureName}
                onChange={(e) => setFeatureName(e.target.value)}
              />

              {/* Schedule Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Development In (Days)
                </label>
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={scheduledDays}
                  onChange={(e) => setScheduledDays(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Day {currentTick + scheduledDays}</span>
                  <span>{scheduledDays} days from now</span>
                </div>
              </div>

              {/* Selected Feature Info */}
              {selectedFeatureType && (
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <h4 className="text-sm font-semibold text-white mb-2">
                    {FEATURE_TYPE_CONFIGS[selectedFeatureType].name}
                  </h4>
                  <p className="text-xs text-gray-400 mb-2">
                    {FEATURE_TYPE_CONFIGS[selectedFeatureType].description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">Dev Time:</span>
                      <span className="text-white ml-1">{FEATURE_TYPE_CONFIGS[selectedFeatureType].baseDevelopmentDays} days</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Cost:</span>
                      <span className="text-white ml-1">{formatCurrency(FEATURE_TYPE_CONFIGS[selectedFeatureType].baseCost)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Satisfaction:</span>
                      <span className={`ml-1 ${FEATURE_TYPE_CONFIGS[selectedFeatureType].satisfactionBoost >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {FEATURE_TYPE_CONFIGS[selectedFeatureType].satisfactionBoost >= 0 ? '+' : ''}{FEATURE_TYPE_CONFIGS[selectedFeatureType].satisfactionBoost}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Revenue Boost:</span>
                      <span className="text-gacha-gold ml-1">
                        {Math.round((FEATURE_TYPE_CONFIGS[selectedFeatureType].revenueMultiplier - 1) * 100)}% for {FEATURE_TYPE_CONFIGS[selectedFeatureType].revenueBoostDays}d
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="secondary" fullWidth onClick={() => setShowScheduleModal(false)}>
                  Cancel
                </Button>
                <Button 
                  fullWidth 
                  onClick={handleScheduleFeature}
                  disabled={!selectedGame || !featureName.trim()}
                >
                  Schedule Feature
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* No Live Games Message */}
      {liveGames.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <Icon name="games" size="xl" className="mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400">Launch a game first to plan feature updates!</p>
          </div>
        </Card>
      ) : (
        /* Feature Timeline by Game */
        <div className="space-y-6">
          {featuresByGame.map(({ game, features }) => (
            <Card key={game.id}>
              <div className="flex items-center gap-3 mb-4">
                <Icon name="games" size="md" className="text-gacha-purple" />
                <h3 className="text-lg font-bold text-white">{game.name}</h3>
                <span className="text-xs px-2 py-0.5 bg-green-900/50 rounded text-green-300">
                  {game.monetization.dailyActiveUsers.toLocaleString()} DAU
                </span>
              </div>

              {features.length === 0 ? (
                <p className="text-gray-400 text-sm py-4 text-center">
                  No features scheduled. Plan your content roadmap!
                </p>
              ) : (
                <div className="space-y-3">
                  {features.sort((a, b) => a.scheduledReleaseTick - b.scheduledReleaseTick).map(feature => {
                    const config = FEATURE_TYPE_CONFIGS[feature.type];
                    const daysUntilStart = feature.scheduledStartTick - currentTick;
                    
                    return (
                      <div 
                        key={feature.id}
                        className="p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{FEATURE_ICONS[feature.type]}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-white">{feature.name}</h4>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(feature.status)}`}>
                                  {feature.status.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400">{config.name}</p>
                              
                              {feature.status === 'in_progress' && (
                                <div className="mt-2 w-48">
                                  <ProgressBar 
                                    value={feature.developmentProgress} 
                                    color="purple"
                                    size="sm"
                                    showLabel
                                  />
                                </div>
                              )}
                              
                              {feature.status === 'planned' && (
                                <p className="text-xs text-blue-400 mt-1">
                                  Starts in {daysUntilStart} days
                                </p>
                              )}
                              
                              {feature.status === 'ready' && (
                                <p className="text-xs text-green-400 mt-1">
                                  Ready to release!
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {feature.status === 'planned' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="primary"
                                  onClick={() => handleStartDevelopment(feature.id)}
                                  disabled={company.funds < config.baseCost}
                                >
                                  Start ({formatCurrency(config.baseCost)})
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="danger"
                                  onClick={() => handleCancelFeature(feature.id)}
                                >
                                  <Icon name="close" size="xs" />
                                </Button>
                              </>
                            )}
                            
                            {feature.status === 'ready' && (
                              <Button 
                                size="sm" 
                                variant="success"
                                onClick={() => handleReleaseFeature(feature.id)}
                              >
                                <Icon name="rocket" size="xs" className="mr-1" /> Release
                              </Button>
                            )}
                            
                            {feature.status === 'in_progress' && (
                              <Button 
                                size="sm" 
                                variant="danger"
                                onClick={() => handleCancelFeature(feature.id)}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
