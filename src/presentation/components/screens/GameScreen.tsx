import { useState } from 'react';
import { useGame } from '../../context';
import { GameActions } from '../../../application/actions';
import { useI18n } from '../../../infrastructure/i18n';
import { Header, Sidebar } from '../layout';
import { Button } from '../common';
import { 
  DashboardView, 
  GamesView, 
  EmployeesView,
  FounderView,
  GachaManagementView,
  MarketingView,
  FinanceView,
  OfficeUpgradesView,
  FeatureRoadmapView,
  MonetizationView,
  CrowdfundingView,
} from '../views';

export function GameScreen() {
  const { state, dispatch } = useGame();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!state.company) {
    return null;
  }

  // Game Over Screen
  if (state.isGameOver) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-900/50 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-red-500 mb-4">{t.gameOver.title}</h1>
          <p className="text-gray-300 mb-6">{state.gameOverReason}</p>
          <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">{t.nav.dashboard}</p>
                <p className="text-white font-semibold">{state.company.name}</p>
              </div>
              <div>
                <p className="text-gray-400">{t.gameOver.daysSurvived}</p>
                <p className="text-white font-semibold">{state.currentTick}</p>
              </div>
              <div>
                <p className="text-gray-400">{t.gameOver.gamesMade}</p>
                <p className="text-white font-semibold">{state.games.length}</p>
              </div>
              <div>
                <p className="text-gray-400">{t.gameOver.employeesHired}</p>
                <p className="text-white font-semibold">{state.employees.length}</p>
              </div>
            </div>
          </div>
          <Button 
            variant="primary" 
            fullWidth
            onClick={() => dispatch(GameActions.resetState())}
          >
            {t.gameOver.startNewGame}
          </Button>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'founder':
        return <FounderView />;
      case 'games':
        return <GamesView />;
      case 'employees':
        return <EmployeesView />;
      case 'gacha':
        return <GachaManagementView />;
      case 'marketing':
        return <MarketingView />;
      case 'finance':
        return <FinanceView />;
      case 'office':
        return <OfficeUpgradesView />;
      case 'roadmap':
        return <FeatureRoadmapView />;
      case 'monetization':
        return <MonetizationView />;
      case 'crowdfunding':
        return <CrowdfundingView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
