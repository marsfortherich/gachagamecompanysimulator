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

// Location key mapping for i18n
const LOCATION_KEYS: Record<LocationId, string> = {
  'Tokyo': 'tokyo',
  'Seoul': 'seoul',
  'Shanghai': 'shanghai',
  'Los Angeles': 'losAngeles',
  'San Francisco': 'sanFrancisco',
  'Seattle': 'seattle',
  'Montreal': 'montreal',
  'London': 'london',
  'Stockholm': 'stockholm',
};


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

  const locations = Object.keys(LOCATIONS) as LocationId[];
  const specializations = Object.keys(SPECIALIZATION_CONFIGS) as FounderSpecialization[];
  const experienceLevels = Object.keys(EXPERIENCE_CONFIGS) as FounderExperience[];

  // Helper functions to get translated texts
  const getSpecName = (spec: FounderSpecialization) => {
    const nameMap: Record<FounderSpecialization, string> = {
      programmer: t.specializations.programmer,
      artist: t.specializations.artist,
      designer: t.specializations.designer,
      generalist: t.specializations.generalist,
    };
    return nameMap[spec];
  };

  const getSpecDesc = (spec: FounderSpecialization) => {
    const descMap: Record<FounderSpecialization, string> = {
      programmer: t.specializations.programmerDesc,
      artist: t.specializations.artistDesc,
      designer: t.specializations.designerDesc,
      generalist: t.specializations.generalistDesc,
    };
    return descMap[spec];
  };

  const getExpName = (exp: FounderExperience) => {
    const nameMap: Record<FounderExperience, string> = {
      student: t.experienceLevels.student,
      junior: t.experienceLevels.junior,
      experienced: t.experienceLevels.experienced,
      veteran: t.experienceLevels.veteran,
    };
    return nameMap[exp];
  };

  const getExpDesc = (exp: FounderExperience) => {
    const descMap: Record<FounderExperience, string> = {
      student: t.experienceLevels.studentDesc,
      junior: t.experienceLevels.juniorDesc,
      experienced: t.experienceLevels.experiencedDesc,
      veteran: t.experienceLevels.veteranDesc,
    };
    return descMap[exp];
  };

  const getSkillName = (skill: string) => {
    const skillMap: Record<string, string> = {
      programming: t.skills.programming,
      art: t.skills.art,
      game_design: t.skills.gameDesign,
      marketing: t.skills.marketing,
      management: t.skills.management,
      sound: t.skills.sound,
      writing: t.skills.writing,
    };
    return skillMap[skill] || skill.replace('_', ' ');
  };

  const getLocationName = (loc: LocationId) => {
    const key = LOCATION_KEYS[loc] as keyof typeof t.locations;
    return t.locations[key] || LOCATIONS[loc].name;
  };

  const getLocationDesc = (loc: LocationId) => {
    const key = LOCATION_KEYS[loc];
    const descKey = `${key}Desc` as keyof typeof t.locations;
    return (t.locations[descKey] as string) || LOCATIONS[loc].description;
  };

  const getLocationBonuses = (loc: LocationId): readonly string[] => {
    const key = LOCATION_KEYS[loc];
    const bonusKey = `${key}Bonuses` as keyof typeof t.locations;
    const bonuses = t.locations[bonusKey];
    return Array.isArray(bonuses) ? bonuses : LOCATIONS[loc].displayBonuses;
  };

  const getLocationAudience = (loc: LocationId) => {
    const key = LOCATION_KEYS[loc];
    const audienceKey = `${key}Audience` as keyof typeof t.locations;
    return (t.locations[audienceKey] as string) || LOCATIONS[loc].targetAudience;
  };

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
                          {getSpecName(spec)}
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
                          {getExpName(exp)}
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
                        {getSpecName(specialization)}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        ({getExpName(experience)})
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gacha-gold">
                      {formatMoney(EXPERIENCE_CONFIGS[experience].startingFunds)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">
                    {getSpecDesc(specialization)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {getExpDesc(experience)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                      +{SPECIALIZATION_CONFIGS[specialization].primaryBonus} {getSkillName(SPECIALIZATION_CONFIGS[specialization].primarySkill)}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-300 rounded">
                      +{SPECIALIZATION_CONFIGS[specialization].secondaryBonus} {getSkillName(SPECIALIZATION_CONFIGS[specialization].secondarySkill)}
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
                      {getLocationName(loc)} ({LOCATIONS[loc].region})
                    </option>
                  ))}
                </select>
                
                {/* Location info panel */}
                <div className="mt-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="settings" size="sm" className="text-gacha-purple" />
                    <span className="font-medium text-white">{getLocationName(headquarters)}</span>
                    <span className="text-xs text-gray-400">({LOCATIONS[headquarters].region})</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{getLocationDesc(headquarters)}</p>
                  
                  <div className="mb-2">
                    <span className="text-xs text-gray-400 uppercase">{t.startScreen.bonuses}:</span>
                    <ul className="mt-1 space-y-0.5">
                      {getLocationBonuses(headquarters).map((bonus, i) => (
                        <li key={i} className="text-xs text-green-400 flex items-center gap-1">
                          <Icon name="check" size="sm" /> {bonus}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <span className="text-xs text-gray-400 uppercase">{t.startScreen.targetAudience}:</span>
                    <p className="text-xs text-blue-300 mt-0.5">{getLocationAudience(headquarters)}</p>
                  </div>
                </div>
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
