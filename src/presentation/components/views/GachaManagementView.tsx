import { useState } from 'react';
import { useGame } from '../../context';
import { GameActions } from '../../../application/actions';
import { Card, Button, ProgressBar } from '../common';
import { Icon } from '../common/Icon';
import { Game, GachaRates } from '../../../domain';
import { useI18n } from '../../../infrastructure/i18n';

/**
 * Rarity info for display - using color squares instead of emoji
 */
const RARITY_STYLE = {
  common: { color: 'text-gray-400', bgColor: 'bg-gray-400' },
  uncommon: { color: 'text-green-400', bgColor: 'bg-green-400' },
  rare: { color: 'text-blue-400', bgColor: 'bg-blue-400' },
  epic: { color: 'text-purple-400', bgColor: 'bg-purple-400' },
  legendary: { color: 'text-yellow-400', bgColor: 'bg-yellow-400' },
} as const;

type Rarity = keyof typeof RARITY_STYLE;

/**
 * GachaManagementView - Configure gacha rates and view player satisfaction
 */
export function GachaManagementView() {
  const { state, dispatch } = useGame();
  const { t } = useI18n();
  const { games } = state;

  // Get live games only
  const liveGames = games.filter(g => g.status === 'live');

  // Selected game for editing
  const [selectedGameId, setSelectedGameId] = useState<string | null>(
    liveGames.length > 0 ? liveGames[0].id : null
  );

  const selectedGame = liveGames.find(g => g.id === selectedGameId);

  // Local state for rate editing
  const [editingRates, setEditingRates] = useState<GachaRates | null>(null);
  const [rateError, setRateError] = useState<string | null>(null);

  const handleSelectGame = (gameId: string) => {
    setSelectedGameId(gameId);
    setEditingRates(null);
    setRateError(null);
  };

  const handleStartEditing = (game: Game) => {
    setEditingRates({ ...game.monetization.gachaRates });
  };

  const handleRateChange = (rarity: Rarity, value: number) => {
    if (!editingRates) return;
    
    // Clamp value between 0 and 1
    const clampedValue = Math.max(0, Math.min(1, value));
    
    setEditingRates({
      ...editingRates,
      [rarity]: clampedValue,
    });
    setRateError(null);
  };

  const handleSaveRates = () => {
    if (!editingRates || !selectedGameId) return;

    // Validate rates sum to 1.0 (with small tolerance)
    const total = Object.values(editingRates).reduce((sum, rate) => sum + rate, 0);
    if (Math.abs(total - 1.0) > 0.001) {
      setRateError(`${t.gacha.mustSum100} (${(total * 100).toFixed(1)}%)`);
      return;
    }

    dispatch(GameActions.updateGachaRates(selectedGameId, { ...editingRates }));
    setEditingRates(null);
    setRateError(null);
  };

  const handleCancelEdit = () => {
    setEditingRates(null);
    setRateError(null);
  };

  // Helper to auto-balance rates
  const handleAutoBalance = () => {
    if (!editingRates) return;
    const total = Object.values(editingRates).reduce((sum, rate) => sum + rate, 0);
    if (total === 0) return;

    const balanced: GachaRates = {
      common: editingRates.common / total,
      uncommon: editingRates.uncommon / total,
      rare: editingRates.rare / total,
      epic: editingRates.epic / total,
      legendary: editingRates.legendary / total,
    };
    setEditingRates(balanced);
    setRateError(null);
  };

  // Calculate satisfaction impact from rates
  const calculateSatisfactionImpact = (rates: GachaRates): string => {
    const legendaryRate = rates.legendary * 100;
    if (legendaryRate >= 2) return t.gacha.satisfactionVeryGenerous;
    if (legendaryRate >= 1) return t.gacha.satisfactionGenerous;
    if (legendaryRate >= 0.5) return t.gacha.satisfactionStandard;
    if (legendaryRate >= 0.1) return t.gacha.satisfactionStingy;
    return t.gacha.satisfactionPredatory;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Icon name="casino" size="md" className="text-purple-400" /> {t.gacha.title}</h2>
      </div>

      {liveGames.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Icon name="games" size="lg" className="text-gray-500 mb-4" />
            <p className="text-gray-400">{t.gacha.noLiveGames}</p>
            <p className="text-sm text-gray-500 mt-2">
              {t.gacha.launchGameFirst}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Selection */}
          <div className="lg:col-span-1">
            <Card title={t.gacha.liveGames}>
              <div className="space-y-2">
                {liveGames.map(game => (
                  <button
                    key={game.id}
                    onClick={() => handleSelectGame(game.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedGameId === game.id
                        ? 'bg-gacha-purple text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    <div className="font-semibold">{game.name}</div>
                    <div className="text-sm opacity-75 capitalize">{game.genre}</div>
                    <div className="text-xs mt-1">
                      {t.metrics.dau}: {game.monetization.dailyActiveUsers.toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Rate Configuration */}
          <div className="lg:col-span-2">
            {selectedGame ? (
              <div className="space-y-4">
                {/* Current Rates Display */}
                <Card title={`${selectedGame.name} - Gacha Rates`}>
                  <div className="space-y-4">
                    {/* Player Satisfaction */}
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">{t.gacha.playerSatisfaction}</span>
                        <span className={`font-semibold ${
                          selectedGame.monetization.playerSatisfaction >= 70 ? 'text-green-400' :
                          selectedGame.monetization.playerSatisfaction >= 40 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {selectedGame.monetization.playerSatisfaction.toFixed(0)}%
                        </span>
                      </div>
                      <ProgressBar
                        value={selectedGame.monetization.playerSatisfaction}
                        color={
                          selectedGame.monetization.playerSatisfaction >= 70 ? 'green' :
                          selectedGame.monetization.playerSatisfaction >= 40 ? 'gold' :
                          'red'
                        }
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        {calculateSatisfactionImpact(editingRates || selectedGame.monetization.gachaRates)}
                      </p>
                    </div>

                    {/* Rate Sliders/Inputs */}
                    <div className="space-y-3">
                      {(Object.keys(RARITY_STYLE) as Rarity[]).map(rarity => {
                        const style = RARITY_STYLE[rarity];
                        const rarityName = t.gacha.rarities[rarity];
                        const currentRate = editingRates
                          ? editingRates[rarity]
                          : selectedGame.monetization.gachaRates[rarity];
                        const percentage = (currentRate * 100).toFixed(2);

                        return (
                          <div key={rarity} className="bg-gray-700 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`w-4 h-4 rounded ${style.bgColor}`}></span>
                                <span className={`font-medium ${style.color}`}>{rarityName}</span>
                              </div>
                              {editingRates ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={percentage}
                                    onChange={(e) => handleRateChange(rarity, parseFloat(e.target.value) / 100)}
                                    className="w-20 px-2 py-1 bg-gray-600 text-white rounded text-right text-sm"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                  />
                                  <span className="text-gray-400 text-sm">%</span>
                                </div>
                              ) : (
                                <span className="text-white font-semibold">{percentage}%</span>
                              )}
                            </div>
                            <ProgressBar
                              value={currentRate * 100}
                              max={rarity === 'common' ? 100 : rarity === 'uncommon' ? 50 : 20}
                              color={
                                rarity === 'legendary' ? 'gold' :
                                rarity === 'epic' ? 'purple' :
                                rarity === 'rare' ? 'blue' :
                                'green'
                              }
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Total Sum Display */}
                    {editingRates && (
                      <div className={`p-3 rounded-lg ${
                        Math.abs(Object.values(editingRates).reduce((sum, r) => sum + r, 0) - 1.0) < 0.001
                          ? 'bg-green-900/30 border border-green-700'
                          : 'bg-red-900/30 border border-red-700'
                      }`}>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">{t.gacha.total}</span>
                          <span className={`font-bold ${
                            Math.abs(Object.values(editingRates).reduce((sum, r) => sum + r, 0) - 1.0) < 0.001
                              ? 'text-green-400'
                              : 'text-red-400'
                          }`}>
                            {(Object.values(editingRates).reduce((sum, r) => sum + r, 0) * 100).toFixed(2)}%
                          </span>
                        </div>
                        {rateError && (
                          <p className="text-red-400 text-sm mt-2">{rateError}</p>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {editingRates ? (
                        <>
                          <Button variant="secondary" onClick={handleAutoBalance}>
                            <Icon name="balance" size="sm" className="inline mr-1" /> {t.gacha.autoBalance}
                          </Button>
                          <Button variant="secondary" onClick={handleCancelEdit}>
                            {t.common.cancel}
                          </Button>
                          <Button onClick={handleSaveRates}>
                            <Icon name="save" size="sm" className="inline mr-1" /> {t.gacha.saveChanges}
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => handleStartEditing(selectedGame)}>
                          <Icon name="edit" size="sm" className="inline mr-1" /> {t.gacha.editRates}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Revenue Impact Info */}
                <Card title={<span className="flex items-center gap-2"><Icon name="lightbulb" size="sm" className="text-yellow-400" /> {t.gacha.strategyTips}</span>}>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <Icon name="target" size="md" className="text-purple-400" />
                      <div>
                        <p className="text-white font-medium">{t.gacha.higherLegendaryRates}</p>
                        <p className="text-gray-400">
                          {t.gacha.higherLegendaryRatesDesc}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Icon name="money" size="md" className="text-green-400" />
                      <div>
                        <p className="text-white font-medium">{t.gacha.lowerLegendaryRates}</p>
                        <p className="text-gray-400">
                          {t.gacha.lowerLegendaryRatesDesc}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Icon name="balance" size="md" className="text-blue-400" />
                      <div>
                        <p className="text-white font-medium">{t.gacha.industryStandard}</p>
                        <p className="text-gray-400">
                          {t.gacha.industryStandardDesc}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <Card>
                <div className="text-center py-8 text-gray-400">
                  {t.gacha.selectGameToManage}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
