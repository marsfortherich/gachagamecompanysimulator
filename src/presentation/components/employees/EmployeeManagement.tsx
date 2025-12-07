/**
 * Employee Components - Prompt 5.5: Employee Management
 * 
 * Enhanced employee management UI with:
 * - Role filters
 * - Sorting options
 * - Skill display with visual indicators
 * - Employee cards with detailed info
 */

import React, { useState } from 'react';
import { useEmployees, EmployeeFilters, TeamStats } from '@presentation/hooks/useEmployees';
import { EmployeeViewModel, SkillDisplay, MoraleDisplay } from '@presentation/viewmodels/EmployeeViewModel';
import { EmployeeRole } from '@domain/employee';
import { Icon, IconName } from '@presentation/components/common/Icon';
import { useI18n } from '@infrastructure/i18n';

// =============================================================================
// Filter Bar Component
// =============================================================================

export interface EmployeeFilterBarProps {
  filters: EmployeeFilters;
  onFilterChange: (filters: EmployeeFilters) => void;
  onClear: () => void;
}

const ROLE_OPTIONS: Array<{ value: EmployeeRole | ''; label: string; icon?: IconName }> = [
  { value: '', label: 'All Roles' },
  { value: 'Programmer', label: 'Programmer', icon: 'programmer' },
  { value: 'Artist', label: 'Artist', icon: 'artist' },
  { value: 'Designer', label: 'Designer', icon: 'designer' },
  { value: 'Marketer', label: 'Marketer', icon: 'marketer' },
  { value: 'Producer', label: 'Producer', icon: 'producer' },
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'level', label: 'Level' },
  { value: 'salary', label: 'Salary' },
  { value: 'morale', label: 'Morale' },
] as const;

export const EmployeeFilterBar: React.FC<EmployeeFilterBarProps> = ({
  filters,
  onFilterChange,
  onClear,
}) => {
  return (
    <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      {/* Search */}
      <div className="flex-1 min-w-[200px]">
        <input
          type="text"
          placeholder="Search employees..."
          value={filters.searchTerm || ''}
          onChange={(e) => onFilterChange({ ...filters, searchTerm: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 
                     focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Role Filter */}
      <select
        aria-label="Filter by role"
        value={filters.role || ''}
        onChange={(e) => onFilterChange({ 
          ...filters, 
          role: e.target.value as EmployeeRole | undefined || undefined 
        })}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 
                   focus:ring-blue-500 focus:border-blue-500"
      >
        {ROLE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Sort By */}
      <select
        aria-label="Sort employees by"
        value={filters.sortBy || 'name'}
        onChange={(e) => onFilterChange({ 
          ...filters, 
          sortBy: e.target.value as EmployeeFilters['sortBy']
        })}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 
                   focus:ring-blue-500 focus:border-blue-500"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>Sort by {opt.label}</option>
        ))}
      </select>

      {/* Sort Order Toggle */}
      <button
        onClick={() => onFilterChange({ 
          ...filters, 
          sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
        })}
        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {filters.sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
      </button>

      {/* Clear Filters */}
      <button
        onClick={onClear}
        className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 
                   rounded-lg transition-colors"
      >
        Clear
      </button>
    </div>
  );
};

// =============================================================================
// Employee Card Component
// =============================================================================

export interface EmployeeCardProps {
  employee: EmployeeViewModel;
  onSelect?: (employee: EmployeeViewModel) => void;
  onFire?: (employeeId: string) => void;
  isSelected?: boolean;
  showActions?: boolean;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  onSelect,
  onFire,
  isSelected = false,
  showActions = true,
}) => {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`
        bg-white rounded-lg border-2 shadow-sm transition-all duration-200
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}
        ${onSelect ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''}
      `}
      onClick={() => onSelect?.(employee)}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        {/* Avatar */}
        <div 
          className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 
                     flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
        >
          {employee.avatarInitials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">
              {employee.displayName}
            </h3>
            <span 
              className="px-2 py-0.5 text-xs font-medium rounded-full"
              style={{ 
                backgroundColor: employee.levelBadge.color + '20',
                color: employee.levelBadge.color 
              }}
            >
              {employee.levelBadge.text}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
            <span>{employee.roleIcon}</span>
            <span>{employee.roleLabel}</span>
            <span>•</span>
            <span>{employee.salaryFormatted}/mo</span>
          </div>
        </div>

        {/* Morale indicator */}
        <MoraleIndicator morale={employee.morale} size="sm" />
      </div>

      {/* Skills preview */}
      <div className="px-4 pb-2">
        <div className="flex gap-1">
          {employee.topSkills.slice(0, 3).map((skill) => (
            <SkillBadge key={skill.key} skill={skill} size="sm" />
          ))}
          {employee.topSkills.length > 3 && (
            <span className="text-xs text-gray-400 flex items-center">
              +{employee.topSkills.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Expandable details */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
            {t.employeeManagement.allSkills}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {employee.allSkills.map((skill) => (
              <SkillProgressBar key={skill.key} skill={skill} />
            ))}
          </div>
          
          <div className="mt-3 flex gap-2 text-xs text-gray-500 items-center">
            <span>{employee.experienceLabel}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              {employee.isAvailable 
                ? <><Icon name="check" size="xs" className="text-green-500" /> {t.employeeManagement.available}</>
                : <><Icon name="lock" size="xs" className="text-gray-400" /> {t.employeeManagement.assigned}</>
              }
            </span>
          </div>
        </div>
      )}

      {/* Footer actions */}
      {showActions && (
        <div className="flex border-t border-gray-100">
          <button
            className="flex-1 py-2 text-sm text-gray-600 hover:text-blue-600 
                       hover:bg-blue-50 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? t.employeeManagement.hideDetails : t.employeeManagement.showDetails}
          </button>
          {onFire && (
            <button
              className="flex-1 py-2 text-sm text-gray-600 hover:text-red-600 
                         hover:bg-red-50 transition-colors border-l border-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                onFire(employee.id);
              }}
            >
              Fire
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Skill Components
// =============================================================================

interface SkillBadgeProps {
  skill: SkillDisplay;
  size?: 'sm' | 'md';
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({ skill, size = 'md' }) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}
      `}
      style={{ 
        backgroundColor: skill.color + '20',
        color: skill.color 
      }}
    >
      <span>{skill.icon}</span>
      <span>{skill.value}</span>
    </span>
  );
};

interface SkillProgressBarProps {
  skill: SkillDisplay;
}

export const SkillProgressBar: React.FC<SkillProgressBarProps> = ({ skill }) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm w-5">{skill.icon}</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ 
            width: `${skill.percentage}%`,
            backgroundColor: skill.color 
          }}
        />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">
        {skill.value}
      </span>
    </div>
  );
};

// =============================================================================
// Morale Component
// =============================================================================

interface MoraleIndicatorProps {
  morale: MoraleDisplay;
  size?: 'sm' | 'md' | 'lg';
}

export const MoraleIndicator: React.FC<MoraleIndicatorProps> = ({ 
  morale, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  return (
    <div 
      className={`
        ${sizeClasses[size]} rounded-full flex items-center justify-center
        transition-colors
      `}
      style={{ backgroundColor: morale.color + '20' }}
      title={`${morale.label}: ${morale.value}%`}
    >
      <span>{morale.icon}</span>
    </div>
  );
};

// =============================================================================
// Team Stats Summary
// =============================================================================

export interface TeamStatsSummaryProps {
  stats: TeamStats;
}

export const TeamStatsSummary: React.FC<TeamStatsSummaryProps> = ({ stats }) => {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg border border-gray-200">
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</div>
        <div className="text-sm text-gray-500">{t.employeeManagement.employees}</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">
          ${(stats.totalSalary / 1000).toFixed(0)}K
        </div>
        <div className="text-sm text-gray-500">{t.employeeManagement.monthlyPayroll}</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">
          {stats.averageMorale.toFixed(0)}%
        </div>
        <div className="text-sm text-gray-500">{t.employeeManagement.avgMorale}</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">
          Lv {stats.averageLevel.toFixed(1)}
        </div>
        <div className="text-sm text-gray-500">{t.employeeManagement.avgLevel}</div>
      </div>
      
      {/* Role breakdown */}
      <div className="col-span-2 md:col-span-4 flex justify-center gap-4 mt-2 pt-4 border-t border-gray-100">
        {(Object.entries(stats.byRole) as [EmployeeRole, number][]).map(([role, count]) => (
          <div key={role} className="text-center">
            <div className="text-lg font-semibold text-gray-700">{count}</div>
            <div className="text-xs text-gray-500">{role}s</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// Employee List Component
// =============================================================================

export interface EmployeeListProps {
  employees: EmployeeViewModel[];
  onSelect?: (employee: EmployeeViewModel) => void;
  onFire?: (employeeId: string) => void;
  selectedId?: string;
  emptyMessage?: string;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  onSelect,
  onFire,
  selectedId,
  emptyMessage = 'No employees found',
}) => {
  if (employees.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {employees.map((employee) => (
        <EmployeeCard
          key={employee.id}
          employee={employee}
          onSelect={onSelect}
          onFire={onFire}
          isSelected={employee.id === selectedId}
        />
      ))}
    </div>
  );
};

// =============================================================================
// Employee Management View (Full Page)
// =============================================================================

export interface EmployeeManagementViewProps {
  onEmployeeSelect?: (employee: EmployeeViewModel) => void;
}

export const EmployeeManagementView: React.FC<EmployeeManagementViewProps> = ({
  onEmployeeSelect,
}) => {
  const {
    employees,
    teamStats,
    filters,
    setFilters,
    clearFilters,
    fireEmployee,
  } = useEmployees();

  const [selectedId, setSelectedId] = useState<string>();

  const handleSelect = (employee: EmployeeViewModel) => {
    setSelectedId(employee.id);
    onEmployeeSelect?.(employee);
  };

  return (
    <div className="space-y-6">
      {/* Team Stats */}
      <TeamStatsSummary stats={teamStats} />

      {/* Filters */}
      <EmployeeFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onClear={clearFilters}
      />

      {/* Employee list */}
      <EmployeeList
        employees={employees}
        onSelect={handleSelect}
        onFire={fireEmployee}
        selectedId={selectedId}
      />
    </div>
  );
};

export default EmployeeManagementView;
