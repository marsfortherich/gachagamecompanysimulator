import { useState, useEffect } from 'react';
import { useGame } from '../../context';
import { Button, Input, Card, Icon } from '../common';
import { storageService } from '../../../infrastructure';

export function StartScreen() {
  const { startGame, loadGame } = useGame();
  const [companyName, setCompanyName] = useState('');
  const [headquarters, setHeadquarters] = useState('Tokyo');
  const [hasSave, setHasSave] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const locations = [
    'Tokyo',
    'Seoul',
    'Shanghai',
    'Los Angeles',
    'San Francisco',
    'Seattle',
    'Montreal',
    'London',
    'Stockholm',
  ];

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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Headquarters
                </label>
                <select
                  value={headquarters}
                  onChange={(e) => setHeadquarters(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gacha-purple"
                >
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
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
