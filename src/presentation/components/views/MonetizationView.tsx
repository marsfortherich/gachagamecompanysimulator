import { useState } from 'react';
import { useGame } from '../../context';
import { GameActions } from '../../../application/actions';
import { Card, Button, Icon, ProgressBar } from '../common';
import { 
  MONETIZATION_CONFIGS, 
  MonetizationStrategy,
  MONETIZATION_LEVELS,
  getUpgradeCost,
  calculateMonetizationSummary,
} from '../../../domain/economy/Monetization';
import { 
  AD_TYPE_CONFIGS, 
  AdType,
} from '../../../domain/economy/Advertising';

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

import { IconName } from '../common/Icon';

const STRATEGY_ICONS: Record<MonetizationStrategy, IconName> = {
  gacha: 'casino',
  monthly_pass: 'pass',
  battle_pass: 'sword',
  ad_free: 'no-ads',
  cosmetic_shop: 'shirt',
  starter_pack: 'gift',
  vip_subscription: 'crown',
  energy_system: 'energy',
};

const AD_ICONS: Record<AdType, IconName> = {
  banner_ad: 'newspaper',
  interstitial: 'tv',
  rewarded_video: 'film',
  native_ad: 'phone',
  sponsored_content: 'handshake',
};

export function MonetizationView() {
  const { state, dispatch } = useGame();
  const { company, games, monetizationSetups, gameAdConfigs, monetizationImplementations } = state;
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'strategies' | 'advertising'>('strategies');

  if (!company) {
    return (
      <div className="p-6">
        <Card>
          <p className="text-gray-400 text-center">Start a company first to manage monetization.</p>
        </Card>
      </div>
    );
  }

  const liveGames = games.filter(g => g.status === 'live');
  const selectedGame = liveGames.find(g => g.id === selectedGameId) ?? liveGames[0];
  
  if (!selectedGame) {
    return (
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold text-white">Monetization</h2>
        <Card>
          <div className="text-center py-8">
            <Icon name="money" size="xl" className="mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400">Launch a game first to set up monetization!</p>
          </div>
        </Card>
      </div>
    );
  }

  const currentSetup = monetizationSetups[selectedGame.id];
  const currentAdConfig = gameAdConfigs[selectedGame.id];
  const pendingImplementations = monetizationImplementations.filter(i => i.gameId === selectedGame.id);

  const handleImplementStrategy = (strategy: MonetizationStrategy) => {
    dispatch(GameActions.implementMonetization(selectedGame.id, strategy));
  };

  const handleUpgradeStrategy = (strategy: MonetizationStrategy) => {
    dispatch(GameActions.upgradeMonetization(selectedGame.id, strategy));
  };

  const handleEnableAd = (adType: AdType) => {
    dispatch(GameActions.enableAdType(selectedGame.id, adType));
  };

  const handleDisableAd = (adType: AdType) => {
    dispatch(GameActions.disableAdType(selectedGame.id, adType));
  };

  // Calculate summary
  const summary = currentSetup 
    ? calculateMonetizationSummary(currentSetup, selectedGame.monetization.dailyActiveUsers)
    : null;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-white">Monetization</h2>
        <div className="text-sm text-gray-400">
          Budget: <span className="text-gacha-gold font-semibold">{formatCurrency(company.funds)}</span>
        </div>
      </div>

      {/* Game Selector */}
      {liveGames.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {liveGames.map(game => (
            <Button
              key={game.id}
              variant={selectedGame?.id === game.id ? 'primary' : 'secondary'}
              onClick={() => setSelectedGameId(game.id)}
            >
              {game.name}
            </Button>
          ))}
        </div>
      )}

      {/* Game Stats */}
      <Card>
        <div className="flex items-center gap-4">
          <Icon name="games" size="lg" className="text-gacha-purple" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">{selectedGame.name}</h3>
            <div className="flex gap-4 text-sm text-gray-400">
              <span>{selectedGame.monetization.dailyActiveUsers.toLocaleString()} DAU</span>
              <span className="text-gacha-gold">{formatCurrency(selectedGame.monetization.monthlyRevenue)}/mo revenue</span>
            </div>
          </div>
          {summary && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Est. Monthly from Monetization</p>
              <p className="text-lg font-bold text-gacha-gold">{formatCurrency(summary.totalMonthlyRevenue)}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Tab Buttons */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'strategies' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('strategies')}
        >
          <Icon name="money" size="sm" className="mr-1" /> Monetization Strategies
        </Button>
        <Button
          variant={activeTab === 'advertising' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('advertising')}
        >
          <Icon name="megaphone" size="sm" className="mr-1" /> Advertising
        </Button>
      </div>

      {/* Monetization Strategies Tab */}
      {activeTab === 'strategies' && (
        <div className="grid gap-4 md:grid-cols-2">
          {(Object.entries(MONETIZATION_CONFIGS) as [MonetizationStrategy, typeof MONETIZATION_CONFIGS[MonetizationStrategy]][]).map(([strategy, config]) => {
            const isEnabled = currentSetup?.enabledStrategies.has(strategy);
            const currentLevel = currentSetup?.strategyLevels[strategy] ?? 1;
            const isPending = pendingImplementations.some(i => i.strategy === strategy);
            const canAfford = company.funds >= config.implementationCost;
            const levelConfig = MONETIZATION_LEVELS[currentLevel];
            const upgradeAvailable = isEnabled && currentLevel < 3;
            const upgradeCost = currentSetup ? getUpgradeCost(currentSetup, strategy) : 0;
            
            return (
              <Card 
                key={strategy} 
                className={isEnabled ? 'border-green-600/30' : isPending ? 'border-yellow-600/30' : ''}
              >
                <div className="flex items-start gap-3">
                  <Icon name={STRATEGY_ICONS[strategy]} size="xl" className="text-gacha-gold" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-white">{config.name}</h4>
                      {isEnabled && (
                        <span className="text-xs px-1.5 py-0.5 bg-green-900/50 rounded text-green-300">
                          {levelConfig.name}
                        </span>
                      )}
                      {isPending && (
                        <span className="text-xs px-1.5 py-0.5 bg-yellow-900/50 rounded text-yellow-300">
                          Implementing...
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{config.description}</p>
                    
                    {/* Stats */}
                    <div className="flex flex-wrap gap-2 mt-2 text-xs">
                      <span className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300">
                        {(config.conversionRate * 100).toFixed(1)}% convert
                      </span>
                      <span className="px-1.5 py-0.5 bg-gray-700 rounded text-gacha-gold">
                        ${config.revenuePerConversion}/convert
                      </span>
                      <span className={`px-1.5 py-0.5 rounded ${
                        config.satisfactionImpact >= 0 
                          ? 'bg-green-900/50 text-green-300' 
                          : 'bg-red-900/50 text-red-300'
                      }`}>
                        {config.satisfactionImpact >= 0 ? '+' : ''}{config.satisfactionImpact} satisfaction
                      </span>
                    </div>
                    
                    {/* Level upgrade info */}
                    {upgradeAvailable && (
                      <div className="mt-2 pt-2 border-t border-gray-700">
                        <p className="text-xs text-gray-400">
                          Upgrade to {MONETIZATION_LEVELS[(currentLevel + 1) as 1 | 2 | 3].name}: 
                          +{Math.round((MONETIZATION_LEVELS[(currentLevel + 1) as 1 | 2 | 3].conversionMultiplier - 1) * 100)}% conversion
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="mt-3 flex gap-2">
                  {!isEnabled && !isPending && (
                    <Button
                      fullWidth
                      variant={canAfford ? 'primary' : 'secondary'}
                      disabled={!canAfford || config.implementationCost === 0}
                      onClick={() => handleImplementStrategy(strategy)}
                    >
                      {config.implementationCost === 0 
                        ? 'Included' 
                        : `Implement (${formatCurrency(config.implementationCost)})`}
                    </Button>
                  )}
                  
                  {isEnabled && upgradeAvailable && (
                    <Button
                      fullWidth
                      variant={company.funds >= upgradeCost ? 'primary' : 'secondary'}
                      disabled={company.funds < upgradeCost}
                      onClick={() => handleUpgradeStrategy(strategy)}
                    >
                      Upgrade ({formatCurrency(upgradeCost)})
                    </Button>
                  )}
                  
                  {isEnabled && !upgradeAvailable && (
                    <div className="w-full text-center text-xs text-gray-400 py-2">
                      Max Level
                    </div>
                  )}
                  
                  {isPending && (
                    <div className="w-full">
                      <ProgressBar value={50} color="gold" size="sm" />
                      <p className="text-xs text-gray-400 text-center mt-1">
                        {config.setupDays} days to complete
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Advertising Tab */}
      {activeTab === 'advertising' && (
        <div className="space-y-4">
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Ad Revenue Settings</h3>
            <p className="text-sm text-gray-400 mb-4">
              Enable ads to generate additional revenue. Be careful - too many ads can hurt player satisfaction!
            </p>
            
            <div className="grid gap-4 md:grid-cols-2">
              {(Object.entries(AD_TYPE_CONFIGS) as [AdType, typeof AD_TYPE_CONFIGS[AdType]][]).map(([adType, config]) => {
                const isEnabled = currentAdConfig?.enabledAdTypes.has(adType);
                const canAfford = company.funds >= config.setupCost;
                
                return (
                  <div 
                    key={adType}
                    className={`p-3 rounded-lg border ${
                      isEnabled ? 'border-green-600/30 bg-green-900/10' : 'border-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon name={AD_ICONS[adType]} size="lg" className="text-gacha-gold" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{config.name}</h4>
                        <p className="text-xs text-gray-400">{config.description}</p>
                        
                        <div className="flex flex-wrap gap-1 mt-2 text-xs">
                          <span className="px-1.5 py-0.5 bg-gacha-gold/20 rounded text-gacha-gold">
                            ${(config.revenuePerView * config.viewsPerDauPerDay).toFixed(3)}/DAU/day
                          </span>
                          <span className={`px-1.5 py-0.5 rounded ${
                            config.satisfactionImpact >= 0 
                              ? 'bg-green-900/50 text-green-300' 
                              : 'bg-red-900/50 text-red-300'
                          }`}>
                            {config.satisfactionImpact >= 0 ? '+' : ''}{config.satisfactionImpact}/day satisfaction
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      {!isEnabled ? (
                        <Button
                          fullWidth
                          size="sm"
                          variant={canAfford ? 'primary' : 'secondary'}
                          disabled={!canAfford}
                          onClick={() => handleEnableAd(adType)}
                        >
                          Enable ({formatCurrency(config.setupCost)})
                        </Button>
                      ) : (
                        <Button
                          fullWidth
                          size="sm"
                          variant="danger"
                          onClick={() => handleDisableAd(adType)}
                        >
                          Disable
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Active Ads Summary */}
          {currentAdConfig && currentAdConfig.enabledAdTypes.size > 0 && (
            <Card>
              <h4 className="text-sm font-semibold text-white mb-2">Active Ads Revenue</h4>
              <div className="text-2xl font-bold text-gacha-gold">
                ~${(Array.from(currentAdConfig.enabledAdTypes).reduce((sum, adType) => {
                  const config = AD_TYPE_CONFIGS[adType];
                  return sum + (config.revenuePerView * config.viewsPerDauPerDay * selectedGame.monetization.dailyActiveUsers);
                }, 0)).toLocaleString()}/day
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Based on {selectedGame.monetization.dailyActiveUsers.toLocaleString()} DAU
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
