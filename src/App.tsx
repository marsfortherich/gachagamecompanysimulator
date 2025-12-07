import { GameProvider, useGame } from './presentation/context';
import { StartScreen, GameScreen } from './presentation/components/screens';
import { I18nProvider } from './infrastructure/i18n';

function AppContent() {
  const { state } = useGame();

  if (!state.company) {
    return <StartScreen />;
  }

  return <GameScreen />;
}

function App() {
  return (
    <I18nProvider>
      <GameProvider>
        <AppContent />
      </GameProvider>
    </I18nProvider>
  );
}

export default App;
