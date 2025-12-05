/**
 * MetricCard Component - Prompt 5.3: Mobile Dashboard
 * 
 * A reusable card component for displaying metrics with:
 * - Title and value
 * - Optional trend indicator (up/down/neutral)
 * - Optional icon
 * - Optional subtitle/description
 * - Color variants based on metric type
 */

import React from 'react';
import { Icon } from './Icon';

export type MetricTrend = 'up' | 'down' | 'neutral';
export type MetricVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export interface MetricCardProps {
  /** Main metric title */
  title: string;
  /** Metric value to display */
  value: string | number;
  /** Optional subtitle or additional info */
  subtitle?: string;
  /** Optional icon (emoji or icon component) */
  icon?: React.ReactNode;
  /** Trend direction for change indicator */
  trend?: MetricTrend;
  /** Trend value (e.g., "+5%" or "-$1,000") */
  trendValue?: string;
  /** Color variant */
  variant?: MetricVariant;
  /** Click handler for interactive cards */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether the card is in a loading state */
  isLoading?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles: Record<MetricVariant, string> = {
  default: 'bg-white border-gray-200',
  success: 'bg-green-50 border-green-200',
  warning: 'bg-yellow-50 border-yellow-200',
  danger: 'bg-red-50 border-red-200',
  info: 'bg-blue-50 border-blue-200',
};

const variantIconStyles: Record<MetricVariant, string> = {
  default: 'bg-gray-100 text-gray-600',
  success: 'bg-green-100 text-green-600',
  warning: 'bg-yellow-100 text-yellow-600',
  danger: 'bg-red-100 text-red-600',
  info: 'bg-blue-100 text-blue-600',
};

const trendStyles: Record<MetricTrend, { color: string; icon: string }> = {
  up: { color: 'text-green-600', icon: '↑' },
  down: { color: 'text-red-600', icon: '↓' },
  neutral: { color: 'text-gray-500', icon: '→' },
};

const sizeStyles = {
  sm: {
    card: 'p-3',
    title: 'text-xs',
    value: 'text-lg',
    icon: 'w-8 h-8 text-lg',
  },
  md: {
    card: 'p-4',
    title: 'text-sm',
    value: 'text-2xl',
    icon: 'w-10 h-10 text-xl',
  },
  lg: {
    card: 'p-5',
    title: 'text-base',
    value: 'text-3xl',
    icon: 'w-12 h-12 text-2xl',
  },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  variant = 'default',
  onClick,
  className = '',
  isLoading = false,
  size = 'md',
}) => {
  const sizes = sizeStyles[size];
  const isClickable = !!onClick;

  return (
    <div
      className={`
        rounded-lg border shadow-sm transition-all duration-200
        ${variantStyles[variant]}
        ${sizes.card}
        ${isClickable ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''}
        ${className}
      `}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
    >
      <div className="flex items-start justify-between">
        {/* Left side: Title and Value */}
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-gray-500 ${sizes.title}`}>
            {title}
          </p>
          
          {isLoading ? (
            <div className={`${sizes.value} bg-gray-200 animate-pulse rounded h-8 w-24 mt-1`} />
          ) : (
            <p className={`font-bold text-gray-900 ${sizes.value} mt-1 truncate`}>
              {value}
            </p>
          )}

          {/* Trend indicator */}
          {trend && trendValue && !isLoading && (
            <div className={`flex items-center gap-1 mt-1 text-sm ${trendStyles[trend].color}`}>
              <span>{trendStyles[trend].icon}</span>
              <span>{trendValue}</span>
            </div>
          )}

          {/* Subtitle */}
          {subtitle && !isLoading && (
            <p className="text-xs text-gray-500 mt-1 truncate">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right side: Icon */}
        {icon && (
          <div
            className={`
              flex items-center justify-center rounded-lg flex-shrink-0 ml-3
              ${sizes.icon}
              ${variantIconStyles[variant]}
            `}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// Compound Components for Common Patterns
// =============================================================================

export interface MetricGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

const gridColumns: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

const gridGaps: Record<string, string> = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};

export const MetricGrid: React.FC<MetricGridProps> = ({
  children,
  columns = 2,
  gap = 'md',
  className = '',
}) => {
  return (
    <div className={`grid ${gridColumns[columns]} ${gridGaps[gap]} ${className}`}>
      {children}
    </div>
  );
};

// =============================================================================
// Specialized Metric Cards
// =============================================================================

export interface FinancialMetricCardProps {
  title: string;
  amount: number;
  previousAmount?: number;
  isExpense?: boolean;
  onClick?: () => void;
}

export const FinancialMetricCard: React.FC<FinancialMetricCardProps> = ({
  title,
  amount,
  previousAmount,
  isExpense = false,
  onClick,
}) => {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(Math.abs(amount));

  let trend: MetricTrend = 'neutral';
  let trendValue: string | undefined;

  if (previousAmount !== undefined && previousAmount !== 0) {
    const change = ((amount - previousAmount) / Math.abs(previousAmount)) * 100;
    if (change > 0) {
      trend = isExpense ? 'down' : 'up'; // Higher expenses are bad
      trendValue = `+${change.toFixed(1)}%`;
    } else if (change < 0) {
      trend = isExpense ? 'up' : 'down';
      trendValue = `${change.toFixed(1)}%`;
    }
  }

  const variant: MetricVariant = isExpense
    ? amount > 0 ? 'danger' : 'success'
    : amount > 0 ? 'success' : 'danger';

  return (
    <MetricCard
      title={title}
      value={isExpense ? `-${formattedAmount}` : formattedAmount}
      icon={isExpense ? <Icon name="expense" size="md" /> : <Icon name="money" size="md" />}
      trend={trend}
      trendValue={trendValue}
      variant={variant}
      onClick={onClick}
    />
  );
};

export interface ProgressMetricCardProps {
  title: string;
  current: number;
  max: number;
  unit?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export const ProgressMetricCard: React.FC<ProgressMetricCardProps> = ({
  title,
  current,
  max,
  unit = '',
  icon,
  onClick,
}) => {
  const percentage = Math.round((current / max) * 100);
  const variant: MetricVariant = 
    percentage >= 80 ? 'danger' :
    percentage >= 60 ? 'warning' : 
    'success';

  return (
    <MetricCard
      title={title}
      value={`${current}${unit} / ${max}${unit}`}
      subtitle={`${percentage}% utilized`}
      icon={icon || <Icon name="chart-up" size="md" />}
      variant={variant}
      onClick={onClick}
    />
  );
};

export default MetricCard;
