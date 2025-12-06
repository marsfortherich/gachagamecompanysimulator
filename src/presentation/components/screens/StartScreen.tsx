import { useState, useEffect } from 'react';
import { useGame } from '../../context';
import { Button, Input, Card, Icon } from '../common';
import { storageService } from '../../../infrastructure';

// Headquarters location data with bonuses and descriptions
interface LocationInfo {
  name: string;
  region: string;
  description: string;
  bonuses: string[];
  targetAudience: string;
}

const LOCATION_INFO: Record<string, LocationInfo> = {
  'Tokyo': {
    name: 'Tokyo',
    region: 'Asia',
    description: 'The heart of the gacha gaming industry',
    bonuses: ['+15% gacha revenue', 'Access to top anime artists', 'Strong mobile gaming market'],
    targetAudience: 'Core mobile gamers, anime/JRPG enthusiasts',
  },
  'Seoul': {
    name: 'Seoul',
    region: 'Asia',
    description: 'Competitive gaming capital with strong esports culture',
    bonuses: ['+10% player engagement', 'Skilled developers', 'Esports integration'],
    targetAudience: 'Competitive players, MMO fans',
  },
  'Shanghai': {
    name: 'Shanghai',
    region: 'Asia',
    description: 'Gateway to the massive Chinese gaming market',
    bonuses: ['+20% potential player base', 'Lower development costs', 'Growing talent pool'],
    targetAudience: 'Casual to mid-core players, large market',
  },
  'Los Angeles': {
    name: 'Los Angeles',
    region: 'North America',
    description: 'Entertainment capital with strong marketing reach',
    bonuses: ['+15% marketing effectiveness', 'Celebrity partnerships', 'Media connections'],
    targetAudience: 'Western casual gamers, mainstream audience',
  },
  'San Francisco': {
    name: 'San Francisco',
    region: 'North America',
    description: 'Tech hub with innovative development culture',
    bonuses: ['+10% development speed', 'Access to tech talent', 'Investor connections'],
    targetAudience: 'Tech-savvy players, early adopters',
  },
  'Seattle': {
    name: 'Seattle',
    region: 'North America',
    description: 'Home to major gaming studios',
    bonuses: ['+10% game quality', 'Experienced developers', 'Strong gaming culture'],
    targetAudience: 'Core gamers, AAA-quality seekers',
  },
  'Montreal': {
    name: 'Montreal',
    region: 'North America',
    description: 'Creative hub with government incentives',
    bonuses: ['-15% employee costs', 'Art/design talent', 'Bilingual market access'],
    targetAudience: 'Story-focused players, artistic games',
  },
  'London': {
    name: 'London',
    region: 'Europe',
    description: 'European gateway with diverse talent',
    bonuses: ['+10% EU market reach', 'Cultural diversity', 'Strong IP protection'],
    targetAudience: 'European market, strategy gamers',
  },
  'Stockholm': {
    name: 'Stockholm',
    region: 'Europe',
    description: 'Nordic game dev excellence',
    bonuses: ['+15% game polish', 'Work-life balance = happy devs', 'Indie success stories'],
    targetAudience: 'Quality-focused players, indie fans',
  },
};

export function StartScreen() {
  const { startGame, loadGame } = useGame();
  const [companyName, setCompanyName] = useState('');
  const [headquarters, setHeadquarters] = useState('Tokyo');
  const [hasSave, setHasSave] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const locations = Object.keys(LOCATION_INFO);

  useEffect(() => {
    const checkSave = async () => {
      const exists = await storageService.hasSave();
      setHasSave(exists);
      setIsLoading(false);
    };
    checkSave();
  }, []);

  const handleStart = () => {
    if (companyName.trim()) {
      startGame(companyName.trim(), headquarters);
    }
  };

  const handleContinue = async () => {
    const success = await loadGame();
    if (!success) {
      alert('Failed to load save file');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Icon name="dice" size="xl" className="text-gacha-gold" /> Gacha Game Company Simulator
          </h1>
          <p className="text-gray-400">
            Build your gacha game empire
          </p>
        </div>

        <Card>
          <div className="space-y-6">
            {/* Continue Game */}
            {hasSave && (
              <div className="pb-6 border-b border-gray-700">
                <Button fullWidth size="lg" onClick={handleContinue}>
                  Continue Game
                </Button>
              </div>
            )}

            {/* New Game */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white text-center">
                {hasSave ? 'Or Start New Game' : 'New Game'}
              </h2>
              
              <Input
                label="Company Name"
                placeholder="Enter your company name..."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              />

              <div>
                <label htmlFor="headquarters-select" className="block text-sm font-medium text-gray-300 mb-2">
                  Headquarters
                </label>
                <select
                  id="headquarters-select"
                  value={headquarters}
                  onChange={(e) => setHeadquarters(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gacha-purple"
                  aria-label="Select headquarters location"
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
                      <span className="text-xs text-gray-400 uppercase">Bonuses:</span>
                      <ul className="mt-1 space-y-0.5">
                        {LOCATION_INFO[headquarters].bonuses.map((bonus, i) => (
                          <li key={i} className="text-xs text-green-400 flex items-center gap-1">
                            <Icon name="check" size="sm" /> {bonus}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <span className="text-xs text-gray-400 uppercase">Target Audience:</span>
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
                disabled={!companyName.trim()}
              >
                Start New Company
              </Button>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Manage developers, create games, design gacha systems,
          and build your gaming empire!
        </p>
      </div>
    </div>
  );
}
