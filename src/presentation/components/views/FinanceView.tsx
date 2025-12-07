import { useGame } from '../../context';
import { Card, ProgressBar, Icon, IconName } from '../common';
import { OFFICE_TIERS } from '../../../domain';
import { useI18n } from '../../../infrastructure/i18n';

/**
 * FinanceView - Company financial overview and reports
 */
export function FinanceView() {
  const { state } = useGame();
  const { t } = useI18n();
  const { company, employees, games } = state;

  if (!company) return null;

  // Calculate financials
  const liveGames = games.filter(g => g.status === 'live');
  
  // Revenue
  const monthlyRevenue = liveGames.reduce(
    (sum, g) => sum + g.monetization.monthlyRevenue,
    0
  );
  const dailyRevenue = monthlyRevenue / 30;

  // Expenses
  const salaryExpenses = employees.reduce((sum, e) => sum + e.salary, 0);
  const officeExpenses = OFFICE_TIERS[company.officeLevel].monthlyCost;
  const totalMonthlyExpenses = salaryExpenses + officeExpenses;
  const dailyExpenses = totalMonthlyExpenses / 30;

  // Profit/Loss
  const monthlyProfit = monthlyRevenue - totalMonthlyExpenses;
  const dailyProfit = dailyRevenue - dailyExpenses;
  const isProfitable = monthlyProfit >= 0;

  // Runway calculation (how many months until bankruptcy if no revenue)
  const runwayMonths = totalMonthlyExpenses > 0
    ? company.funds / totalMonthlyExpenses
    : Infinity;

  // Revenue breakdown by game
  const revenueByGame = liveGames
    .map(g => ({
      name: g.name,
      genre: g.genre,
      revenue: g.monetization.monthlyRevenue,
      dau: g.monetization.dailyActiveUsers,
      arpdau: g.monetization.dailyActiveUsers > 0
        ? g.monetization.monthlyRevenue / g.monetization.dailyActiveUsers / 30
        : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Expense breakdown by category
  const expensesByRole = employees.reduce((acc, emp) => {
    acc[emp.role] = (acc[emp.role] || 0) + emp.salary;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Icon name="finance" size="lg" /> {t.finance.title}
        </h2>
        <div className="text-right">
          <p className="text-sm text-gray-400">{t.finance.currentFunds}</p>
          <p className="text-2xl font-bold text-gacha-gold">
            ${company.funds.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-gray-400 text-sm">{t.finance.monthlyRevenue}</p>
          <p className="text-2xl font-bold text-green-400">
            ${monthlyRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">
            ${dailyRevenue.toLocaleString()}{t.common.perDay}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-gray-400 text-sm">{t.finance.monthlyExpenses}</p>
          <p className="text-2xl font-bold text-red-400">
            ${totalMonthlyExpenses.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">
            ${dailyExpenses.toLocaleString()}{t.common.perDay}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-gray-400 text-sm">{t.finance.monthlyProfit}</p>
          <p className={`text-2xl font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
            {isProfitable ? '+' : '-'}${Math.abs(monthlyProfit).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">
            {isProfitable ? '+' : '-'}${Math.abs(dailyProfit).toLocaleString()}{t.common.perDay}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-gray-400 text-sm">{t.finance.runway}</p>
          <p className={`text-2xl font-bold ${
            runwayMonths > 6 ? 'text-green-400' :
            runwayMonths > 3 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {runwayMonths === Infinity ? '∞' : `${runwayMonths.toFixed(1)} ${t.finance.monthsAbbrev}`}
          </p>
          <p className="text-xs text-gray-500">
            {runwayMonths === Infinity ? t.finance.noExpenses : t.finance.untilFundsDepleted}
          </p>
        </Card>
      </div>

      {/* Profit/Loss Bar */}
      <Card title={t.finance.monthlyProfitLoss}>
        <div className="space-y-4">
          <div className="relative h-8 bg-gray-700 rounded-full overflow-hidden">
            {/* Revenue bar (green, starts from left) */}
            <div
              className="absolute left-0 top-0 h-full bg-green-500/30 border-r-2 border-green-500"
              style={{
                width: `${Math.min(100, (monthlyRevenue / Math.max(monthlyRevenue, totalMonthlyExpenses)) * 100)}%`,
              }}
            />
            {/* Expense bar overlay indicator */}
            <div
              className="absolute top-0 h-full border-l-4 border-red-500"
              style={{
                left: `${Math.min(100, (totalMonthlyExpenses / Math.max(monthlyRevenue, totalMonthlyExpenses)) * 100)}%`,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white gap-1">
              <Icon name={isProfitable ? 'chart-up' : 'chart-down'} size="sm" />
              {isProfitable ? t.finance.profitable : t.finance.operatingAtLoss}
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-green-400">{t.finance.revenue}: ${monthlyRevenue.toLocaleString()}</span>
            <span className="text-red-400">{t.finance.expenses}: ${totalMonthlyExpenses.toLocaleString()}</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <Card title={t.finance.revenueByGame}>
          {liveGames.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="games" size="xl" className="mx-auto mb-2 text-gray-500" />
              <p className="text-gray-400">{t.finance.noLiveGamesRevenue}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {revenueByGame.map(game => (
                <div key={game.name} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-white font-medium">{game.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{game.genre}</p>
                    </div>
                    <p className="text-green-400 font-semibold">
                      ${game.revenue.toLocaleString()}/mo
                    </p>
                  </div>
                  <ProgressBar
                    value={game.revenue}
                    max={Math.max(...revenueByGame.map(g => g.revenue))}
                    color="green"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>DAU: {game.dau.toLocaleString()}</span>
                    <span>ARPDAU: ${game.arpdau.toFixed(3)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Expense Breakdown */}
        <Card title={t.finance.expenseBreakdown}>
          <div className="space-y-3">
            {/* Salaries by role */}
            {Object.entries(expensesByRole)
              .sort(([, a], [, b]) => b - a)
              .map(([role, amount]) => {
                const roleIcon: IconName = 
                  role === 'Programmer' ? 'programmer' :
                  role === 'Artist' ? 'artist' :
                  role === 'Designer' ? 'designer' :
                  role === 'Marketer' ? 'marketer' :
                  role === 'Producer' ? 'producer' : 'staff';
                return (
                <div key={role} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <Icon name={roleIcon} />
                      <span className="text-white">{role} {t.finance.salaries}</span>
                    </div>
                    <span className="text-red-400 font-semibold">
                      ${amount.toLocaleString()}/mo
                    </span>
                  </div>
                  <ProgressBar
                    value={amount}
                    max={totalMonthlyExpenses}
                    color="red"
                  />
                </div>
              );
              })}

            {/* Office costs */}
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Icon name="settings" />
                  <span className="text-white">
                    {OFFICE_TIERS[company.officeLevel].name}
                  </span>
                </div>
                <span className="text-red-400 font-semibold">
                  ${officeExpenses.toLocaleString()}/mo
                </span>
              </div>
              <ProgressBar
                value={officeExpenses}
                max={totalMonthlyExpenses}
                color="red"
              />
            </div>

            {/* Total */}
            <div className="border-t border-gray-600 pt-3">
              <div className="flex justify-between items-center text-lg">
                <span className="text-white font-semibold">{t.finance.totalMonthlyExpenses}</span>
                <span className="text-red-400 font-bold">
                  ${totalMonthlyExpenses.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Financial Health Summary */}
      <Card title={t.finance.financialSummary}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Profitability Status */}
          <div className={`rounded-lg p-4 ${
            isProfitable ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'
          }`}>
            <p className="text-sm text-gray-400 mb-1">{t.finance.status}</p>
            <p className={`text-xl font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'} flex items-center gap-1`}>
              <Icon name={isProfitable ? 'check' : 'close'} size="sm" />
              {isProfitable ? t.finance.profitable : t.finance.losingMoney}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {isProfitable
                ? t.finance.earningProfitMargin.replace('{percent}', ((monthlyProfit / totalMonthlyExpenses) * 100).toFixed(0))
                : t.finance.losingFundsMonthly.replace('{percent}', ((Math.abs(monthlyProfit) / company.funds) * 100).toFixed(1))}
            </p>
          </div>

          {/* Employee Efficiency */}
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">{t.finance.revenuePerEmployee}</p>
            <p className="text-xl font-bold text-white">
              ${employees.length > 0 ? (monthlyRevenue / employees.length).toLocaleString() : 0}{t.common.perMonth}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {employees.length} {t.finance.employeesOnPayroll}
            </p>
          </div>

          {/* Game Efficiency */}
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">{t.finance.revenuePerGame}</p>
            <p className="text-xl font-bold text-white">
              ${liveGames.length > 0 ? (monthlyRevenue / liveGames.length).toLocaleString() : 0}{t.common.perMonth}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {liveGames.length} {t.finance.gamesGeneratingRevenue}
            </p>
          </div>
        </div>
      </Card>

      {/* Warnings */}
      {!isProfitable && runwayMonths < 6 && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Icon name="warning" size="lg" className="text-yellow-400" />
            <div>
              <p className="text-red-400 font-semibold">{t.finance.financialWarning}</p>
              <p className="text-sm text-gray-300">
                {runwayMonths < 1
                  ? t.finance.warningCritical
                  : runwayMonths < 3
                  ? t.finance.warningLow
                  : t.finance.warningCaution}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {t.finance.warningAdvice}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
