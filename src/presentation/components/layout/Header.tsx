import { useGame } from '../../context';
import { GameActions } from '../../../application/actions';
import { GameSpeed } from '../../../application/state';
import { Icon, LanguageSelector } from '../common';
import { useI18n } from '../../../infrastructure/i18n';

export function Header() {
  const { state, dispatch, saveGame } = useGame();
  const { t } = useI18n();
  const { company, currentTick, gameSpeed, isPaused } = state;

  const formatDate = (tick: number): string => {
    const startDate = new Date(2026, 0, 1);
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + tick);
    return currentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSpeedChange = (speed: GameSpeed) => {
    dispatch(GameActions.setGameSpeed(speed));
  };

  const handleTogglePause = () => {
    dispatch(GameActions.togglePause());
  };

  const handleSave = async () => {
    await saveGame();
    alert('Game saved!');
  };

  if (!company) return null;

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Company Info */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">{company.name}</h1>
            <p className="text-sm text-gray-400">{company.headquarters}</p>
          </div>
          <div className="hidden sm:block h-8 w-px bg-gray-600" />
          <div className="hidden sm:block">
            <p className="text-sm text-gray-400">{t.header.funds}</p>
            <p className="text-lg font-semibold text-gacha-gold">
              {formatCurrency(company.funds)}
            </p>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm text-gray-400">{t.header.reputation}</p>
            <p className="text-lg font-semibold text-gacha-purple">
              {company.reputation}/100
            </p>
          </div>
        </div>

        {/* Date and Controls */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-400">{t.header.date}</p>
            <p className="text-lg font-semibold text-white">
              {formatDate(currentTick)}
            </p>
          </div>

          {/* Speed Controls */}
          <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
            <button
              onClick={handleTogglePause}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                isPaused
                  ? 'bg-gacha-red text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              {isPaused ? '▶' : '⏸'}
            </button>
            {(['slow', 'normal', 'fast', 'ultra'] as GameSpeed[]).map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  gameSpeed === speed
                    ? 'bg-gacha-purple text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {speed === 'slow' && '1x'}
                {speed === 'normal' && '2x'}
                {speed === 'fast' && '4x'}
                {speed === 'ultra' && '8x'}
              </button>
            ))}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors flex items-center gap-1.5"
          >
            <Icon name="save" size="sm" className="text-green-400" /> Save
          </button>

          {/* Language Selector */}
          <LanguageSelector />
        </div>
      </div>

      {/* Mobile: Company stats */}
      <div className="flex sm:hidden gap-4 mt-3 pt-3 border-t border-gray-700">
        <div>
          <p className="text-xs text-gray-400">{t.header.funds}</p>
          <p className="text-base font-semibold text-gacha-gold">
            {formatCurrency(company.funds)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">{t.header.reputation}</p>
          <p className="text-base font-semibold text-gacha-purple">
            {company.reputation}/100
          </p>
        </div>
      </div>
    </header>
  );
}
