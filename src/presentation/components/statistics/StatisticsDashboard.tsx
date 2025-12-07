/**
 * Statistics Dashboard - Prompt 6.4
 * 
 * Displays analytics and statistics with Recharts visualizations.
 */

import React, { useMemo } from 'react';
import { useGame } from '@presentation/context/GameContext';
import { useI18n } from '@infrastructure/i18n';
import type { Game, Employee } from '@domain/index';
import type { StatisticsDTO, DailyStatsDTO } from '@domain/shared/DTOs';
import { Icon } from '../common/Icon';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// =============================================================================
// Types
// =============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
}

interface ChartDataPoint {
  name: string;
  revenue: number;
  expenses: number;
  profit: number;
}

// =============================================================================
// Stat Card Component
// =============================================================================

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
}) => {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm">{title}</span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subtitle && (
        <div className="text-slate-400 text-xs mt-1">{subtitle}</div>
      )}
      {trend && (
        <div
          className={`text-sm mt-2 ${
            trend.isPositive ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value).toFixed(1)}%
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Recharts Financial Chart
// =============================================================================

interface FinancialChartProps {
  data: ChartDataPoint[];
  height?: number;
}

const CHART_COLORS = {
  revenue: '#10B981',  // green
  expenses: '#EF4444', // red
  profit: '#6366F1',   // indigo
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-lg">
        <p className="text-slate-300 font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: ${entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const FinancialChart: React.FC<FinancialChartProps> = ({ data, height = 300 }) => {
  if (data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center text-slate-400"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.revenue} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={CHART_COLORS.revenue} stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.expenses} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={CHART_COLORS.expenses} stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.profit} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={CHART_COLORS.profit} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis 
          dataKey="name" 
          stroke="#94A3B8" 
          fontSize={12}
          tickLine={false}
        />
        <YAxis 
          stroke="#94A3B8" 
          fontSize={12}
          tickLine={false}
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ paddingTop: '20px' }}
          formatter={(value) => <span className="text-slate-300">{value}</span>}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke={CHART_COLORS.revenue}
          fillOpacity={1}
          fill="url(#colorRevenue)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="expenses"
          name="Expenses"
          stroke={CHART_COLORS.expenses}
          fillOpacity={1}
          fill="url(#colorExpenses)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="profit"
          name="Profit"
          stroke={CHART_COLORS.profit}
          fillOpacity={1}
          fill="url(#colorProfit)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// =============================================================================
// Recharts Pie Chart
// =============================================================================

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface DistributionPieChartProps {
  data: PieChartData[];
  height?: number;
}

const DistributionPieChart: React.FC<DistributionPieChartProps> = ({ data, height = 250 }) => {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  if (total === 0) {
    return (
      <div 
        className="flex items-center justify-center text-slate-400"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  // Transform data to include index signature
  const chartData = data.map(d => ({ ...d }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
          labelLine={{ stroke: '#94A3B8' }}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [`${value} (${((value / total) * 100).toFixed(1)}%)`, name]}
          contentStyle={{ 
            backgroundColor: '#1E293B', 
            border: '1px solid #334155',
            borderRadius: '8px',
          }}
          itemStyle={{ color: '#E2E8F0' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

// =============================================================================
// Statistics Hook
// =============================================================================

function useStatistics(): StatisticsDTO {
  const { state } = useGame();

  return useMemo(() => {
    // Calculate statistics from state
    const totalRevenue = state.games.reduce((sum: number, game: Game) => {
      const gameRevenue = game.monetization?.monthlyRevenue ?? 0;
      return sum + gameRevenue;
    }, 0);

    const totalExpenses = state.employees.reduce((sum: number, emp: Employee) => {
      return sum + (emp.salary ?? 0);
    }, 0) * 12; // Annual

    const gamesReleased = state.games.filter((g: Game) => 
      g.status === 'live' || g.status === 'soft_launch'
    ).length;

    // Generate sample daily stats for demo using deterministic values based on day
    const dailyStats: DailyStatsDTO[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      // Use deterministic pseudo-random based on day index
      const seed = (i + 1) * 1337;
      dailyStats.push({
        date: date.toISOString().split('T')[0],
        revenue: 5000 + (seed % 10000),
        expenses: 2000 + ((seed * 7) % 3000),
        profit: 0,
        gamesReleased: 0,
        employeesHired: 0,
        gachaPulls: seed % 10,
      });
      // Calculate profit
      dailyStats[dailyStats.length - 1].profit = 
        dailyStats[dailyStats.length - 1].revenue - 
        dailyStats[dailyStats.length - 1].expenses;
    }

    return {
      totalPlaytime: state.currentTick * 60, // Rough estimate in seconds
      gamesCreated: state.games.length,
      gamesReleased,
      totalRevenue,
      totalExpenses,
      employeesHired: state.employees.length,
      employeesFired: 0,
      gachaPulls: 0,
      // Employees don't have rarity in this domain model - would need to track from gacha system
      ssrObtained: 0,
      highestFunds: state.company?.funds ?? 0,
      longestGame: state.games[0]?.name ?? null,
      dailyStats,
    };
  }, [state]);
}

// =============================================================================
// Statistics Dashboard Component
// =============================================================================

export const StatisticsDashboard: React.FC = () => {
  const statistics = useStatistics();
  const { state } = useGame();
  const { t } = useI18n();

  // Transform daily stats for chart
  const chartData: ChartDataPoint[] = useMemo(() => {
    return statistics.dailyStats.map(day => ({
      name: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
      revenue: day.revenue,
      expenses: day.expenses,
      profit: day.profit,
    }));
  }, [statistics.dailyStats]);

  // Employee distribution by role
  const employeeDistribution: PieChartData[] = useMemo(() => {
    const roles: Record<string, number> = {};
    state.employees.forEach(emp => {
      roles[emp.role] = (roles[emp.role] || 0) + 1;
    });

    const colors: Record<string, string> = {
      developer: '#3B82F6',
      designer: '#8B5CF6',
      artist: '#EC4899',
      producer: '#F59E0B',
      qa: '#10B981',
      marketing: '#6366F1',
    };

    return Object.entries(roles).map(([role, count]) => ({
      name: role.charAt(0).toUpperCase() + role.slice(1),
      value: count,
      color: colors[role] || '#64748B',
    }));
  }, [state.employees]);

  // Game status distribution
  const gameDistribution: PieChartData[] = useMemo(() => {
    const statuses: Record<string, number> = {};
    state.games.forEach(game => {
      statuses[game.status] = (statuses[game.status] || 0) + 1;
    });

    const colors: Record<string, string> = {
      planning: '#64748B',
      development: '#3B82F6',
      testing: '#F59E0B',
      soft_launch: '#8B5CF6',
      live: '#10B981',
      maintenance: '#6366F1',
      shutdown: '#EF4444',
    };

    return Object.entries(statuses).map(([status, count]) => ({
      name: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
      color: colors[status] || '#64748B',
    }));
  }, [state.games]);

  // Format playtime
  const formatPlaytime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t.stats.title}</h1>
        <span className="text-slate-400 text-sm">
          {t.stats.lastUpdated}: {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title={t.statistics.totalPlaytime}
          value={formatPlaytime(statistics.totalPlaytime)}
          icon={<Icon name="clock" size="md" />}
        />
        <StatCard
          title={t.statistics.gamesCreated}
          value={statistics.gamesCreated}
          subtitle={`${statistics.gamesReleased} ${t.stats.released}`}
          icon={<Icon name="games" size="md" />}
        />
        <StatCard
          title={t.statistics.totalRevenue}
          value={`$${statistics.totalRevenue.toLocaleString()}`}
          trend={{ value: 12.5, isPositive: true }}
          icon={<Icon name="money" size="md" />}
        />
        <StatCard
          title={t.statistics.totalEmployees}
          value={statistics.employeesHired}
          subtitle={`${statistics.ssrObtained} ${t.stats.legendary}`}
          icon={<Icon name="users" size="md" />}
        />
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title={t.statistics.highestFunds}
          value={`$${statistics.highestFunds.toLocaleString()}`}
          icon={<Icon name="chart-up" size="md" />}
        />
        <StatCard
          title={t.statistics.totalExpenses}
          value={`$${statistics.totalExpenses.toLocaleString()}`}
          icon={<Icon name="chart-down" size="md" />}
        />
        <StatCard
          title={t.statistics.netProfit}
          value={`$${(statistics.totalRevenue - statistics.totalExpenses).toLocaleString()}`}
          trend={{
            value: ((statistics.totalRevenue - statistics.totalExpenses) / Math.max(statistics.totalExpenses, 1)) * 100,
            isPositive: statistics.totalRevenue > statistics.totalExpenses,
          }}
          icon={<Icon name="money" size="md" />}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">
            {t.stats.weeklyFinancialOverview}
          </h2>
          <FinancialChart data={chartData} height={300} />
        </div>

        {/* Distribution Charts */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">
            {t.stats.teamComposition}
          </h2>
          {employeeDistribution.length > 0 ? (
            <DistributionPieChart data={employeeDistribution} height={250} />
          ) : (
            <div className="text-slate-400 text-center py-8">
              {t.stats.noEmployeesHiredYet}
            </div>
          )}
        </div>
      </div>

      {/* Game Distribution */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">
          {t.stats.gamePortfolioStatus}
        </h2>
        {gameDistribution.length > 0 ? (
          <DistributionPieChart data={gameDistribution} height={250} />
        ) : (
          <div className="text-slate-400 text-center py-8">
            {t.stats.noGamesInDevelopment}
          </div>
        )}
      </div>

      {/* Gacha Stats */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">{t.statistics.gachaStatistics}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-400">
              {statistics.gachaPulls}
            </div>
            <div className="text-slate-400 text-sm">{t.statistics.totalPulls}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400">
              {statistics.ssrObtained}
            </div>
            <div className="text-slate-400 text-sm">{t.statistics.legendaryObtained}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">
              {statistics.gachaPulls > 0 
                ? ((statistics.ssrObtained / statistics.gachaPulls) * 100).toFixed(1) 
                : '0.0'}%
            </div>
            <div className="text-slate-400 text-sm">{t.statistics.legendaryRate}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">
              {statistics.gachaPulls > 0 
                ? Math.floor(statistics.gachaPulls / Math.max(statistics.ssrObtained, 1))
                : 0}
            </div>
            <div className="text-slate-400 text-sm">{t.stats.avgPullsPerLegendary}</div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default StatisticsDashboard;
