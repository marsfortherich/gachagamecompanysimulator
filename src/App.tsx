import { GameProvider, useGame } from './presentation/context';
import { StartScreen, GameScreen } from './presentation/components/screens';

function AppContent() {
  const { state } = useGame();

  if (!state.company) {
    return <StartScreen />;
  }

  return <GameScreen />;
}

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

export default App;
