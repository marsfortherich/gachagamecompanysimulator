import { useState } from 'react';
import { useGame } from '../../context';
import { GameActions } from '../../../application/actions';
import { Card, Button, Icon } from '../common';
import { 
  OfficeUpgradeType, 
  getAvailableUpgrades,
  getPurchasedUpgradeDetails,
  calculateCombinedUpgradeEffects,
} from '../../../domain/company/OfficeUpgrades';
import { OFFICE_TIERS, OfficeLevel } from '../../../domain/company/Company';

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

export function OfficeUpgradesView() {
  const { state, dispatch } = useGame();
  const { company, officeUpgrades } = state;
  const [activeTab, setActiveTab] = useState<'upgrades' | 'office'>('upgrades');

  if (!company) {
    return (
      <div className="p-6">
        <Card>
          <p className="text-gray-400 text-center">Start a company first to manage office upgrades.</p>
        </Card>
      </div>
    );
  }

  const currentTier = OFFICE_TIERS[company.officeLevel];
  const nextLevel = company.officeLevel < 5 ? (company.officeLevel + 1) as OfficeLevel : null;
  const nextTier = nextLevel ? OFFICE_TIERS[nextLevel] : null;
  
  const availableUpgrades = getAvailableUpgrades(company.officeLevel, officeUpgrades);
  const purchasedUpgrades = getPurchasedUpgradeDetails(officeUpgrades);
  const combinedEffects = calculateCombinedUpgradeEffects(officeUpgrades);

  const handlePurchaseUpgrade = (upgradeType: OfficeUpgradeType) => {
    dispatch(GameActions.purchaseOfficeUpgrade(upgradeType));
  };

  const handleUpgradeOffice = () => {
    dispatch(GameActions.upgradeOffice());
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-white">Office & Upgrades</h2>
        <div className="text-sm text-gray-400">
          Budget: <span className="text-gacha-gold font-semibold">{formatCurrency(company.funds)}</span>
        </div>
      </div>

      {/* Current Office Status */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="text-4xl">
            {company.officeLevel === 1 ? '🏠' : 
             company.officeLevel === 2 ? '🏢' :
             company.officeLevel === 3 ? '🏬' :
             company.officeLevel === 4 ? '🏛️' : '🌆'}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white">{currentTier.name}</h3>
            <p className="text-sm text-gray-400">
              Level {company.officeLevel} • Max {currentTier.maxEmployees} employees • 
              {formatCurrency(currentTier.monthlyCost)}/month
            </p>
          </div>
          {nextTier && (
            <Button
              onClick={handleUpgradeOffice}
              disabled={company.funds < nextTier.upgradeCost}
              variant={company.funds >= nextTier.upgradeCost ? 'primary' : 'secondary'}
            >
              <Icon name="chevronUp" size="sm" className="mr-1" />
              Upgrade to {nextTier.name}
              <span className="ml-2 text-xs opacity-75">{formatCurrency(nextTier.upgradeCost)}</span>
            </Button>
          )}
        </div>
        
        {/* Combined Effects Summary */}
        {officeUpgrades.size > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Active Bonuses</h4>
            <div className="flex flex-wrap gap-3 text-xs">
              {(combinedEffects.developmentSpeedBonus ?? 0) > 0 && (
                <span className="px-2 py-1 bg-blue-900/50 rounded text-blue-300">
                  +{Math.round((combinedEffects.developmentSpeedBonus ?? 0) * 100)}% Dev Speed
                </span>
              )}
              {(combinedEffects.moraleBonus ?? 0) > 0 && (
                <span className="px-2 py-1 bg-green-900/50 rounded text-green-300">
                  +{combinedEffects.moraleBonus} Daily Morale
                </span>
              )}
              {(combinedEffects.trainingSpeedBonus ?? 0) > 0 && (
                <span className="px-2 py-1 bg-purple-900/50 rounded text-purple-300">
                  +{Math.round((combinedEffects.trainingSpeedBonus ?? 0) * 100)}% Training Speed
                </span>
              )}
              {combinedEffects.qualityBonus && Object.entries(combinedEffects.qualityBonus).map(([stat, bonus]) => (
                bonus > 0 && (
                  <span key={stat} className="px-2 py-1 bg-yellow-900/50 rounded text-yellow-300">
                    +{bonus} {stat}
                  </span>
                )
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Tab Buttons */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'upgrades' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('upgrades')}
        >
          Available Upgrades ({availableUpgrades.length})
        </Button>
        <Button
          variant={activeTab === 'office' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('office')}
        >
          Purchased ({purchasedUpgrades.length})
        </Button>
      </div>

      {/* Available Upgrades Grid */}
      {activeTab === 'upgrades' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableUpgrades.length === 0 ? (
            <Card className="col-span-full">
              <p className="text-gray-400 text-center py-4">
                {company.officeLevel < 5 
                  ? 'Upgrade your office to unlock more improvements!'
                  : 'All available upgrades have been purchased!'}
              </p>
            </Card>
          ) : (
            availableUpgrades.map(upgrade => {
              const canAfford = company.funds >= upgrade.cost;
              const meetsLevel = company.officeLevel >= upgrade.requiredOfficeLevel;
              
              return (
                <Card key={upgrade.type} className={!meetsLevel ? 'opacity-60' : ''}>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {upgrade.type === 'workstations' ? '💻' :
                       upgrade.type === 'meeting_room' ? '🗣️' :
                       upgrade.type === 'server_room' ? '🖥️' :
                       upgrade.type === 'break_room' ? '☕' :
                       upgrade.type === 'training_center' ? '📚' :
                       upgrade.type === 'recording_studio' ? '🎵' :
                       upgrade.type === 'art_studio' ? '🎨' :
                       upgrade.type === 'motion_capture' ? '📹' :
                       upgrade.type === 'cafeteria' ? '🍽️' :
                       upgrade.type === 'gym' ? '💪' :
                       upgrade.type === 'rooftop_garden' ? '🌿' : '🏢'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{upgrade.name}</h4>
                      <p className="text-xs text-gray-400 mt-1">{upgrade.description}</p>
                      
                      {/* Effects */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {upgrade.effects.developmentSpeedBonus && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-900/50 rounded text-blue-300">
                            +{Math.round(upgrade.effects.developmentSpeedBonus * 100)}% speed
                          </span>
                        )}
                        {upgrade.effects.moraleBonus && (
                          <span className="text-xs px-1.5 py-0.5 bg-green-900/50 rounded text-green-300">
                            +{upgrade.effects.moraleBonus} morale/day
                          </span>
                        )}
                        {upgrade.effects.qualityBonus && Object.entries(upgrade.effects.qualityBonus).map(([stat, bonus]) => (
                          <span key={stat} className="text-xs px-1.5 py-0.5 bg-yellow-900/50 rounded text-yellow-300">
                            +{bonus} {stat}
                          </span>
                        ))}
                      </div>
                      
                      {/* Requirements */}
                      {!meetsLevel && (
                        <p className="text-xs text-red-400 mt-2">
                          Requires Level {upgrade.requiredOfficeLevel} Office
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    fullWidth
                    className="mt-3"
                    variant={canAfford && meetsLevel ? 'primary' : 'secondary'}
                    disabled={!canAfford || !meetsLevel}
                    onClick={() => handlePurchaseUpgrade(upgrade.type)}
                  >
                    Purchase {formatCurrency(upgrade.cost)}
                  </Button>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Purchased Upgrades Grid */}
      {activeTab === 'office' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {purchasedUpgrades.length === 0 ? (
            <Card className="col-span-full">
              <p className="text-gray-400 text-center py-4">
                No upgrades purchased yet. Browse the available upgrades to improve your office!
              </p>
            </Card>
          ) : (
            purchasedUpgrades.map(upgrade => (
              <Card key={upgrade.type} className="border-green-600/30">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {upgrade.type === 'workstations' ? '💻' :
                     upgrade.type === 'meeting_room' ? '🗣️' :
                     upgrade.type === 'server_room' ? '🖥️' :
                     upgrade.type === 'break_room' ? '☕' :
                     upgrade.type === 'training_center' ? '📚' :
                     upgrade.type === 'recording_studio' ? '🎵' :
                     upgrade.type === 'art_studio' ? '🎨' :
                     upgrade.type === 'motion_capture' ? '📹' :
                     upgrade.type === 'cafeteria' ? '🍽️' :
                     upgrade.type === 'gym' ? '💪' :
                     upgrade.type === 'rooftop_garden' ? '🌿' : '🏢'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white">{upgrade.name}</h4>
                      <span className="text-xs px-1.5 py-0.5 bg-green-900/50 rounded text-green-300">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{upgrade.description}</p>
                    
                    {/* Active Effects */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {upgrade.effects.developmentSpeedBonus && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-900/50 rounded text-blue-300">
                          +{Math.round(upgrade.effects.developmentSpeedBonus * 100)}% speed
                        </span>
                      )}
                      {upgrade.effects.moraleBonus && (
                        <span className="text-xs px-1.5 py-0.5 bg-green-900/50 rounded text-green-300">
                          +{upgrade.effects.moraleBonus} morale/day
                        </span>
                      )}
                      {upgrade.effects.qualityBonus && Object.entries(upgrade.effects.qualityBonus).map(([stat, bonus]) => (
                        <span key={stat} className="text-xs px-1.5 py-0.5 bg-yellow-900/50 rounded text-yellow-300">
                          +{bonus} {stat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
