import { useGame } from '../../context';
import { Card, ProgressBar } from '../common';
import { useI18n } from '../../../infrastructure/i18n';

export function DashboardView() {
  const { state } = useGame();
  const { t } = useI18n();
  const { company, employees, games } = state;

  if (!company) return null;

  const activeGames = games.filter(g => g.status === 'live').length;
  const gamesInDev = games.filter(g => 
    g.status === 'development' || g.status === 'planning' || g.status === 'testing'
  ).length;

  const totalMonthlyRevenue = games
    .filter(g => g.status === 'live')
    .reduce((sum, g) => sum + g.monetization.monthlyRevenue, 0);

  const totalDAU = games
    .filter(g => g.status === 'live')
    .reduce((sum, g) => sum + g.monetization.dailyActiveUsers, 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-2xl font-bold text-white">{t.dashboard.title}</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-gray-400 text-sm">{t.dashboard.employees}</p>
          <p className="text-3xl font-bold text-white">{employees.length}</p>
        </Card>
        <Card className="text-center">
          <p className="text-gray-400 text-sm">{t.dashboard.activeGames}</p>
          <p className="text-3xl font-bold text-gacha-green">{activeGames}</p>
        </Card>
        <Card className="text-center">
          <p className="text-gray-400 text-sm">{t.dashboard.inDevelopment}</p>
          <p className="text-3xl font-bold text-gacha-blue">{gamesInDev}</p>
        </Card>
        <Card className="text-center">
          <p className="text-gray-400 text-sm">{t.dashboard.totalDAU}</p>
          <p className="text-3xl font-bold text-gacha-purple">
            {totalDAU.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Games in Development */}
      <Card title={t.dashboard.gamesInDevelopment}>
        {gamesInDev === 0 ? (
          <p className="text-gray-400 text-center py-4">
            {t.dashboard.noGamesInDev}
          </p>
        ) : (
          <div className="space-y-4">
            {games
              .filter(g => g.status !== 'live' && g.status !== 'shutdown')
              .map(game => (
                <div key={game.id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-white">{game.name}</h4>
                    <span className="text-xs px-2 py-1 rounded bg-gray-600 text-gray-300 capitalize">
                      {game.status.replace('_', ' ')}
                    </span>
                  </div>
                  <ProgressBar
                    value={game.developmentProgress}
                    color="purple"
                    showLabel
                    label={t.dashboard.progress}
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    {game.assignedEmployees.length} {t.dashboard.employeesAssigned}
                  </p>
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* Live Games Performance */}
      <Card title={t.dashboard.liveGames}>
        {activeGames === 0 ? (
          <p className="text-gray-400 text-center py-4">
            {t.dashboard.noLiveGames}
          </p>
        ) : (
          <div className="space-y-4">
            {games
              .filter(g => g.status === 'live')
              .map(game => (
                <div key={game.id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-white">{game.name}</h4>
                    <span className="text-gacha-gold font-semibold">
                      ${game.monetization.monthlyRevenue.toLocaleString()}{t.common.perMonth}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">{t.dashboard.dau}</p>
                      <p className="text-white">
                        {game.monetization.dailyActiveUsers.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">{t.dashboard.satisfaction}</p>
                      <p className="text-white">
                        {game.monetization.playerSatisfaction}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* Company Stats */}
      <Card title={t.dashboard.companyPerformance}>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">{t.dashboard.reputation}</span>
              <span className="text-white">{company.reputation}/100</span>
            </div>
            <ProgressBar
              value={company.reputation}
              color={company.reputation >= 70 ? 'green' : company.reputation >= 40 ? 'blue' : 'red'}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">{t.dashboard.monthlyRevenue}</p>
              <p className="text-xl font-semibold text-gacha-gold">
                ${totalMonthlyRevenue.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">{t.dashboard.monthlyExpenses}</p>
              <p className="text-xl font-semibold text-gacha-red">
                ${employees.reduce((sum, e) => sum + e.salary, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
