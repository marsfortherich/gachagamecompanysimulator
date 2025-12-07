import { useState } from 'react';
import { useGame } from '../../context';
import { GameActions } from '../../../application/actions';
import { Card, Button, Icon, ProgressBar, Input } from '../common';
import { useI18n } from '../../../infrastructure/i18n';
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

import { IconName } from '../common/Icon';

const FEATURE_ICONS: Record<FeatureType, IconName> = {
  content_update: 'package',
  seasonal_event: 'tree',
  dlc_expansion: 'games',
  quality_of_life: 'wrench',
  monetization_update: 'money',
  collaboration: 'handshake',
  anniversary: 'cake',
  balance_patch: 'balance',
};

export function FeatureRoadmapView() {
  const { state, dispatch } = useGame();
  const { t } = useI18n();
  const { company, games, scheduledFeatures, currentTick } = state;
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [selectedFeatureType, setSelectedFeatureType] = useState<FeatureType>('content_update');
  const [featureName, setFeatureName] = useState('');
  const [scheduledDays, setScheduledDays] = useState(7);

  // Helper to get translated feature type name and description
  const getFeatureTypeName = (type: FeatureType): string => {
    const nameMap: Record<FeatureType, string> = {
      content_update: t.roadmap.featureTypes.contentUpdate,
      seasonal_event: t.roadmap.featureTypes.seasonalEvent,
      dlc_expansion: t.roadmap.featureTypes.dlcExpansion,
      quality_of_life: t.roadmap.featureTypes.qualityOfLife,
      monetization_update: t.roadmap.featureTypes.monetizationUpdate,
      collaboration: t.roadmap.featureTypes.collaboration,
      anniversary: t.roadmap.featureTypes.anniversary,
      balance_patch: t.roadmap.featureTypes.balancePatch,
    };
    return nameMap[type] || type;
  };

  const getFeatureTypeDesc = (type: FeatureType): string => {
    const descMap: Record<FeatureType, string> = {
      content_update: t.roadmap.featureTypes.contentUpdateDesc,
      seasonal_event: t.roadmap.featureTypes.seasonalEventDesc,
      dlc_expansion: t.roadmap.featureTypes.dlcExpansionDesc,
      quality_of_life: t.roadmap.featureTypes.qualityOfLifeDesc,
      monetization_update: t.roadmap.featureTypes.monetizationUpdateDesc,
      collaboration: t.roadmap.featureTypes.collaborationDesc,
      anniversary: t.roadmap.featureTypes.anniversaryDesc,
      balance_patch: t.roadmap.featureTypes.balancePatchDesc,
    };
    return descMap[type] || '';
  };

  if (!company) {
    return (
      <div className="p-6">
        <Card>
          <p className="text-gray-400 text-center">{t.roadmap.startCompanyFirst}</p>
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
    if (confirm(t.roadmap.confirmCancelFeature)) {
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
        <h2 className="text-2xl font-bold text-white">{t.roadmap.title}</h2>
        <div className="flex gap-2">
          <span className="text-sm text-gray-400">
            {t.common.day} {currentTick}
          </span>
          <Button onClick={() => setShowScheduleModal(true)} disabled={liveGames.length === 0}>
            + {t.roadmap.scheduleFeature}
          </Button>
        </div>
      </div>

      {/* Schedule Feature Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <h3 className="text-xl font-bold text-white mb-4">{t.roadmap.scheduleNewFeature}</h3>
            
            <div className="space-y-4">
              {/* Game Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t.roadmap.game}</label>
                <select
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg"
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                >
                  <option value="">{t.roadmap.selectGame}</option>
                  {liveGames.map(game => (
                    <option key={game.id} value={game.id}>{game.name}</option>
                  ))}
                </select>
              </div>

              {/* Feature Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t.roadmap.featureType}</label>
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
                        <Icon name={FEATURE_ICONS[type]} size="sm" className="text-gacha-gold" />
                        <span className="text-sm text-white">{getFeatureTypeName(type)}</span>
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
                label={t.roadmap.featureName}
                placeholder={t.roadmap.featureNamePlaceholder}
                value={featureName}
                onChange={(e) => setFeatureName(e.target.value)}
              />

              {/* Schedule Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t.roadmap.startDevelopmentIn}
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
                  <span>{t.common.day} {currentTick + scheduledDays}</span>
                  <span>{scheduledDays} {t.roadmap.daysFromNow}</span>
                </div>
              </div>

              {/* Selected Feature Info */}
              {selectedFeatureType && (
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <h4 className="text-sm font-semibold text-white mb-2">
                    {getFeatureTypeName(selectedFeatureType)}
                  </h4>
                  <p className="text-xs text-gray-400 mb-2">
                    {getFeatureTypeDesc(selectedFeatureType)}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">{t.roadmap.devTime}:</span>
                      <span className="text-white ml-1">{FEATURE_TYPE_CONFIGS[selectedFeatureType].baseDevelopmentDays} {t.common.days}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">{t.roadmap.cost}:</span>
                      <span className="text-white ml-1">{formatCurrency(FEATURE_TYPE_CONFIGS[selectedFeatureType].baseCost)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">{t.roadmap.satisfaction}:</span>
                      <span className={`ml-1 ${FEATURE_TYPE_CONFIGS[selectedFeatureType].satisfactionBoost >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {FEATURE_TYPE_CONFIGS[selectedFeatureType].satisfactionBoost >= 0 ? '+' : ''}{FEATURE_TYPE_CONFIGS[selectedFeatureType].satisfactionBoost}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">{t.roadmap.revenueBoost}:</span>
                      <span className="text-gacha-gold ml-1">
                        {Math.round((FEATURE_TYPE_CONFIGS[selectedFeatureType].revenueMultiplier - 1) * 100)}% {t.roadmap.forDays.replace('{days}', String(FEATURE_TYPE_CONFIGS[selectedFeatureType].revenueBoostDays))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="secondary" fullWidth onClick={() => setShowScheduleModal(false)}>
                  {t.common.cancel}
                </Button>
                <Button 
                  fullWidth 
                  onClick={handleScheduleFeature}
                  disabled={!selectedGame || !featureName.trim()}
                >
                  {t.roadmap.scheduleFeature}
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
            <p className="text-gray-400">{t.roadmap.launchGameFirst}</p>
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
                  {game.monetization.dailyActiveUsers.toLocaleString()} {t.metrics.dau}
                </span>
              </div>

              {features.length === 0 ? (
                <p className="text-gray-400 text-sm py-4 text-center">
                  {t.roadmap.noFeaturesScheduled}
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
                            <Icon name={FEATURE_ICONS[feature.type]} size="lg" className="text-gacha-gold" />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-white">{feature.name}</h4>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(feature.status)}`}>
                                  {feature.status.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400">{getFeatureTypeName(feature.type)}</p>
                              
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
                                  {t.roadmap.startsInDays.replace('{days}', String(daysUntilStart))}
                                </p>
                              )}
                              
                              {feature.status === 'ready' && (
                                <p className="text-xs text-green-400 mt-1">
                                  {t.roadmap.readyToRelease}
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
                                  {t.roadmap.start} ({formatCurrency(config.baseCost)})
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
                                <Icon name="rocket" size="xs" className="mr-1" /> {t.roadmap.release}
                              </Button>
                            )}
                            
                            {feature.status === 'in_progress' && (
                              <Button 
                                size="sm" 
                                variant="danger"
                                onClick={() => handleCancelFeature(feature.id)}
                              >
                                {t.common.cancel}
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
