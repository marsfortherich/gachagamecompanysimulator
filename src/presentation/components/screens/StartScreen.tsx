import { useState, useEffect } from 'react';
import { useGame } from '../../context';
import { Button, Input, Card, Icon, LanguageSelector } from '../common';
import { storageService } from '../../../infrastructure';
import { LOCATIONS, LocationId } from '../../../domain/company/Location';
import { useI18n } from '../../../infrastructure/i18n';
import { 
  FounderSpecialization, 
  FounderExperience, 
  SPECIALIZATION_CONFIGS, 
  EXPERIENCE_CONFIGS 
} from '../../../domain/company/Founder';

// Use domain location data for display
const LOCATION_INFO = Object.fromEntries(
  Object.entries(LOCATIONS).map(([key, config]) => [
    key,
    {
      name: config.name,
      region: config.region,
      description: config.description,
      bonuses: config.displayBonuses,
      targetAudience: config.targetAudience,
    }
  ])
) as Record<LocationId, { name: string; region: string; description: string; bonuses: readonly string[]; targetAudience: string }>;


export function StartScreen() {
  const { startGame, loadGame } = useGame();
  const { t } = useI18n();
  const [companyName, setCompanyName] = useState('');
  const [founderName, setFounderName] = useState('');
  const [specialization, setSpecialization] = useState<FounderSpecialization>('programmer');
  const [experience, setExperience] = useState<FounderExperience>('junior');
  const [headquarters, setHeadquarters] = useState<LocationId>('Tokyo');
  const [hasSave, setHasSave] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const locations = Object.keys(LOCATION_INFO) as LocationId[];
  const specializations = Object.keys(SPECIALIZATION_CONFIGS) as FounderSpecialization[];
  const experienceLevels = Object.keys(EXPERIENCE_CONFIGS) as FounderExperience[];

  useEffect(() => {
    const checkSave = async () => {
      const exists = await storageService.hasSave();
      setHasSave(exists);
      setIsLoading(false);
    };
    checkSave();
  }, []);

  const handleStart = () => {
    if (companyName.trim() && founderName.trim()) {
      startGame(companyName.trim(), founderName.trim(), specialization, experience, headquarters);
    }
  };

  const handleContinue = async () => {
    const success = await loadGame();
    if (!success) {
      alert('Failed to load save file');
    }
  };

  // Format currency for display
  const formatMoney = (amount: number) => {
    return amount >= 1000 ? `$${(amount / 1000).toFixed(0)}k` : `$${amount}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">{t.common.loading}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language Selector */}
        <div className="flex justify-end mb-4">
          <LanguageSelector />
        </div>
        
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Icon name="dice" size="xl" className="text-gacha-gold" /> {t.startScreen.title}
          </h1>
          <p className="text-gray-400">
            {t.startScreen.subtitle}
          </p>
        </div>

        <Card>
          <div className="space-y-6">
            {/* Continue Game */}
            {hasSave && (
              <div className="pb-6 border-b border-gray-700">
                <Button fullWidth size="lg" onClick={handleContinue}>
                  {t.startScreen.loadGame}
                </Button>
              </div>
            )}

            {/* New Game */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white text-center">
                {hasSave ? t.startScreen.orStartNew : t.startScreen.newGame}
              </h2>
              
              {/* Company Info */}
              <Input
                label={t.startScreen.companyName}
                placeholder={t.startScreen.companyNamePlaceholder}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              />

              {/* Founder Info */}
              <div className="pt-2 border-t border-gray-700">
                <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                  <Icon name="users" size="sm" className="text-gacha-purple" />
                  {t.startScreen.yourCharacter}
                </h3>
                
                <Input
                  label={t.startScreen.founderName}
                  placeholder={t.startScreen.founderNamePlaceholder}
                  value={founderName}
                  onChange={(e) => setFounderName(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {t.startScreen.specialization}
                    </label>
                    <select
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value as FounderSpecialization)}
                      className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gacha-purple text-sm"
                    >
                      {specializations.map((spec) => (
                        <option key={spec} value={spec}>
                          {SPECIALIZATION_CONFIGS[spec].name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {t.startScreen.experience}
                    </label>
                    <select
                      value={experience}
                      onChange={(e) => setExperience(e.target.value as FounderExperience)}
                      className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gacha-purple text-sm"
                    >
                      {experienceLevels.map((exp) => (
                        <option key={exp} value={exp}>
                          {EXPERIENCE_CONFIGS[exp].name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Founder Preview */}
                <div className="mt-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-medium text-white">
                        {SPECIALIZATION_CONFIGS[specialization].name}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        ({EXPERIENCE_CONFIGS[experience].name})
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gacha-gold">
                      {formatMoney(EXPERIENCE_CONFIGS[experience].startingFunds)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">
                    {SPECIALIZATION_CONFIGS[specialization].description}
                  </p>
                  <p className="text-xs text-gray-400">
                    {EXPERIENCE_CONFIGS[experience].description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                      +{SPECIALIZATION_CONFIGS[specialization].primaryBonus} {SPECIALIZATION_CONFIGS[specialization].primarySkill.replace('_', ' ')}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-300 rounded">
                      +{SPECIALIZATION_CONFIGS[specialization].secondaryBonus} {SPECIALIZATION_CONFIGS[specialization].secondarySkill.replace('_', ' ')}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded">
                      ×{EXPERIENCE_CONFIGS[experience].learningSpeedMultiplier} {t.startScreen.learning}
                    </span>
                  </div>
                </div>
              </div>

              {/* Headquarters */}
              <div className="pt-2 border-t border-gray-700">
                <label htmlFor="headquarters-select" className="block text-sm font-medium text-gray-300 mb-2">
                  {t.startScreen.headquarters}
                </label>
                <select
                  id="headquarters-select"
                  value={headquarters}
                  onChange={(e) => setHeadquarters(e.target.value as LocationId)}
                  className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gacha-purple"
                  aria-label={t.startScreen.selectLocation}
                >
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc} ({LOCATION_INFO[loc].region})
                    </option>
                  ))}
                </select>
                
                {/* Location info panel */}
                {LOCATION_INFO[headquarters] && (
                  <div className="mt-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="settings" size="sm" className="text-gacha-purple" />
                      <span className="font-medium text-white">{LOCATION_INFO[headquarters].name}</span>
                      <span className="text-xs text-gray-400">({LOCATION_INFO[headquarters].region})</span>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{LOCATION_INFO[headquarters].description}</p>
                    
                    <div className="mb-2">
                      <span className="text-xs text-gray-400 uppercase">{t.startScreen.bonuses}:</span>
                      <ul className="mt-1 space-y-0.5">
                        {LOCATION_INFO[headquarters].bonuses.map((bonus, i) => (
                          <li key={i} className="text-xs text-green-400 flex items-center gap-1">
                            <Icon name="check" size="sm" /> {bonus}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <span className="text-xs text-gray-400 uppercase">{t.startScreen.targetAudience}:</span>
                      <p className="text-xs text-blue-300 mt-0.5">{LOCATION_INFO[headquarters].targetAudience}</p>
                    </div>
                  </div>
                )}
              </div>

              <Button
                fullWidth
                size="lg"
                variant={hasSave ? 'secondary' : 'primary'}
                onClick={handleStart}
                disabled={!companyName.trim() || !founderName.trim()}
              >
                {t.startScreen.startGame}
              </Button>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          {t.startScreen.footerText}
        </p>
      </div>
    </div>
  );
}
