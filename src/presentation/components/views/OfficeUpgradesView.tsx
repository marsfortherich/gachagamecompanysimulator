import { useState } from 'react';
import { useGame } from '../../context';
import { useI18n } from '../../../infrastructure/i18n';
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
  const { t } = useI18n();
  const { company, officeUpgrades } = state;
  const [activeTab, setActiveTab] = useState<'upgrades' | 'office'>('upgrades');

  if (!company) {
    return (
      <div className="p-6">
        <Card>
          <p className="text-gray-400 text-center">{t.office.startCompanyFirst}</p>
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
        <h2 className="text-2xl font-bold text-white">{t.office.officeAndUpgrades}</h2>
        <div className="text-sm text-gray-400">
          {t.office.budget}: <span className="text-gacha-gold font-semibold">{formatCurrency(company.funds)}</span>
        </div>
      </div>

      {/* Current Office Status */}
      <Card>
        <div className="flex items-center gap-4">
          <Icon 
            name={company.officeLevel === 1 ? 'home' : 
                 company.officeLevel === 2 ? 'building' :
                 company.officeLevel === 3 ? 'office-building' :
                 company.officeLevel === 4 ? 'government' : 'cityscape'}
            size="xl"
            className="text-gacha-gold"
          />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white">{currentTier.name}</h3>
            <p className="text-sm text-gray-400">
              {t.office.level} {company.officeLevel} • {t.office.max} {currentTier.maxEmployees} {t.office.employees} • 
              {formatCurrency(currentTier.monthlyCost)}{t.common.perMonth}
            </p>
          </div>
          {nextTier && (
            <Button
              onClick={handleUpgradeOffice}
              disabled={company.funds < nextTier.upgradeCost}
              variant={company.funds >= nextTier.upgradeCost ? 'primary' : 'secondary'}
            >
              <Icon name="chevronUp" size="sm" className="mr-1" />
              {t.office.upgradeTo} {nextTier.name}
              <span className="ml-2 text-xs opacity-75">{formatCurrency(nextTier.upgradeCost)}</span>
            </Button>
          )}
        </div>
        
        {/* Combined Effects Summary */}
        {officeUpgrades.size > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">{t.office.activeBonuses}</h4>
            <div className="flex flex-wrap gap-3 text-xs">
              {(combinedEffects.developmentSpeedBonus ?? 0) > 0 && (
                <span className="px-2 py-1 bg-blue-900/50 rounded text-blue-300">
                  +{Math.round((combinedEffects.developmentSpeedBonus ?? 0) * 100)}% {t.office.devSpeed}
                </span>
              )}
              {(combinedEffects.moraleBonus ?? 0) > 0 && (
                <span className="px-2 py-1 bg-green-900/50 rounded text-green-300">
                  +{combinedEffects.moraleBonus} {t.office.dailyMorale}
                </span>
              )}
              {(combinedEffects.trainingSpeedBonus ?? 0) > 0 && (
                <span className="px-2 py-1 bg-purple-900/50 rounded text-purple-300">
                  +{Math.round((combinedEffects.trainingSpeedBonus ?? 0) * 100)}% {t.office.trainingSpeed}
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
          {t.office.availableUpgrades} ({availableUpgrades.length})
        </Button>
        <Button
          variant={activeTab === 'office' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('office')}
        >
          {t.office.purchased} ({purchasedUpgrades.length})
        </Button>
      </div>

      {/* Available Upgrades Grid */}
      {activeTab === 'upgrades' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableUpgrades.length === 0 ? (
            <Card className="col-span-full">
              <p className="text-gray-400 text-center py-4">
                {company.officeLevel < 5 
                  ? t.office.upgradeToUnlock
                  : t.office.allUpgradesPurchased}
              </p>
            </Card>
          ) : (
            availableUpgrades.map(upgrade => {
              const canAfford = company.funds >= upgrade.cost;
              const meetsLevel = company.officeLevel >= upgrade.requiredOfficeLevel;
              
              return (
                <Card key={upgrade.type} className={!meetsLevel ? 'opacity-60' : ''}>
                  <div className="flex items-start gap-3">
                    <Icon 
                      name={upgrade.type === 'workstations' ? 'workstation' :
                           upgrade.type === 'meeting_room' ? 'meeting-room' :
                           upgrade.type === 'server_room' ? 'server' :
                           upgrade.type === 'break_room' ? 'coffee' :
                           upgrade.type === 'training_center' ? 'training' :
                           upgrade.type === 'recording_studio' ? 'music' :
                           upgrade.type === 'art_studio' ? 'palette' :
                           upgrade.type === 'motion_capture' ? 'video-camera' :
                           upgrade.type === 'cafeteria' ? 'utensils' :
                           upgrade.type === 'gym' ? 'dumbbell' :
                           upgrade.type === 'rooftop_garden' ? 'plant' : 'building'}
                      size="lg"
                      className="text-gacha-gold"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{upgrade.name}</h4>
                      <p className="text-xs text-gray-400 mt-1">{upgrade.description}</p>
                      
                      {/* Effects */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {upgrade.effects.developmentSpeedBonus && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-900/50 rounded text-blue-300">
                            +{Math.round(upgrade.effects.developmentSpeedBonus * 100)}% {t.office.speed}
                          </span>
                        )}
                        {upgrade.effects.moraleBonus && (
                          <span className="text-xs px-1.5 py-0.5 bg-green-900/50 rounded text-green-300">
                            +{upgrade.effects.moraleBonus} {t.office.moralePerDay}
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
                          {t.office.requiresLevel} {upgrade.requiredOfficeLevel}
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
                    {t.office.purchase} {formatCurrency(upgrade.cost)}
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
                {t.office.noUpgradesPurchased}
              </p>
            </Card>
          ) : (
            purchasedUpgrades.map(upgrade => (
              <Card key={upgrade.type} className="border-green-600/30">
                <div className="flex items-start gap-3">
                  <Icon 
                    name={upgrade.type === 'workstations' ? 'workstation' :
                         upgrade.type === 'meeting_room' ? 'meeting-room' :
                         upgrade.type === 'server_room' ? 'server' :
                         upgrade.type === 'break_room' ? 'coffee' :
                         upgrade.type === 'training_center' ? 'training' :
                         upgrade.type === 'recording_studio' ? 'music' :
                         upgrade.type === 'art_studio' ? 'palette' :
                         upgrade.type === 'motion_capture' ? 'video-camera' :
                         upgrade.type === 'cafeteria' ? 'utensils' :
                         upgrade.type === 'gym' ? 'dumbbell' :
                         upgrade.type === 'rooftop_garden' ? 'plant' : 'building'}
                    size="lg"
                    className="text-green-400"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white">{upgrade.name}</h4>
                      <span className="text-xs px-1.5 py-0.5 bg-green-900/50 rounded text-green-300">
                        {t.office.active}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{upgrade.description}</p>
                    
                    {/* Active Effects */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {upgrade.effects.developmentSpeedBonus && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-900/50 rounded text-blue-300">
                          +{Math.round(upgrade.effects.developmentSpeedBonus * 100)}% {t.office.speed}
                        </span>
                      )}
                      {upgrade.effects.moraleBonus && (
                        <span className="text-xs px-1.5 py-0.5 bg-green-900/50 rounded text-green-300">
                          +{upgrade.effects.moraleBonus} {t.office.moralePerDay}
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
