import { useState } from 'react';
import { useGame } from '../../context';
import { GameActions } from '../../../application/actions';
import { Card, Button, ProgressBar, Icon } from '../common';
import { useI18n } from '../../../infrastructure/i18n';
import { 
  getPrimarySkill, 
  SkillType, 
  EmployeeTier, 
  EmployeeRole,
  TIER_CONFIGS,
  getAvailableRoles,
  TRAINING_CONFIGS,
  TrainingType,
  OFFICE_TIERS,
} from '../../../domain';

const SKILL_COLORS: Record<SkillType, string> = {
  programming: 'blue',
  art: 'purple',
  game_design: 'green',
  marketing: 'gold',
  management: 'red',
  sound: 'blue',
  writing: 'purple',
};

const TIER_STYLES: Record<EmployeeTier, { bg: string; border: string; text: string }> = {
  junior: { bg: 'bg-green-900/30', border: 'border-green-700', text: 'text-green-400' },
  mid: { bg: 'bg-blue-900/30', border: 'border-blue-700', text: 'text-blue-400' },
  senior: { bg: 'bg-purple-900/30', border: 'border-purple-700', text: 'text-purple-400' },
};

export function EmployeesView() {
  const { state, dispatch } = useGame();
  const { employees, games, company, employeeTraining } = state;
  const [showHireModal, setShowHireModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<EmployeeTier>('junior');
  const [selectedRole, setSelectedRole] = useState<EmployeeRole>('Programmer');
  const [trainingEmployeeId, setTrainingEmployeeId] = useState<string | null>(null);
  const [collapsedEmployees, setCollapsedEmployees] = useState<Set<string>>(new Set());

  const toggleEmployeeCollapse = (employeeId: string) => {
    setCollapsedEmployees(prev => {
      const next = new Set(prev);
      if (next.has(employeeId)) {
        next.delete(employeeId);
      } else {
        next.add(employeeId);
      }
      return next;
    });
  };

  const collapseAllEmployees = () => {
    setCollapsedEmployees(new Set(employees.map(e => e.id)));
  };

  const expandAllEmployees = () => {
    setCollapsedEmployees(new Set());
  };

  const handleHire = () => {
    const config = TIER_CONFIGS[selectedTier];
    if (company && company.funds >= config.hiringCost) {
      dispatch(GameActions.hireEmployee(selectedTier, selectedRole));
      setShowHireModal(false);
    }
  };

  const handleFire = (employeeId: string) => {
    if (confirm(t.employees.confirmFire)) {
      dispatch(GameActions.fireEmployee(employeeId));
    }
  };

  const handleStartTraining = (employeeId: string, trainingType: TrainingType) => {
    dispatch(GameActions.startTraining(employeeId, trainingType));
    setTrainingEmployeeId(null);
  };

  const handleCancelTraining = (employeeId: string) => {
    dispatch(GameActions.cancelTraining(employeeId));
  };

  const getEmployeeTraining = (employeeId: string) => {
    return employeeTraining.find(t => t.employeeId === employeeId);
  };

  const getAssignedGame = (employeeId: string) => {
    return games.find(g => g.assignedEmployees.includes(employeeId));
  };

  const totalSalaries = employees.reduce((sum, e) => sum + e.salary, 0);
  const canAfford = (tier: EmployeeTier) => company && company.funds >= TIER_CONFIGS[tier].hiringCost;
  const canAffordTraining = (trainingType: TrainingType) => company && company.funds >= TRAINING_CONFIGS[trainingType].cost;

  const currentOffice = company ? OFFICE_TIERS[company.officeLevel] : OFFICE_TIERS[0];
  const canHireEmployees = currentOffice.maxEmployees > 0;
  const isAtMaxEmployees = employees.length >= currentOffice.maxEmployees;
  const { t } = useI18n();

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Basement Warning */}
      {!canHireEmployees && (
        <Card className="bg-yellow-900/30 border-yellow-700">
          <div className="flex items-center gap-3">
            <Icon name="warning" size="lg" className="text-yellow-400" />
            <div>
              <p className="text-yellow-200 font-semibold">{t.employees.basementWarning}</p>
              <p className="text-yellow-400 text-sm">
                {t.employees.basementWarningDesc}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">{t.employees.title}</h2>
          <p className="text-gray-400">
            {employees.length}{canHireEmployees ? ` / ${currentOffice.maxEmployees}` : ''} {t.employees.title.toLowerCase()} · ${totalSalaries.toLocaleString()}{t.common.perMonth}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {employees.length > 0 && (
            <>
              <Button variant="secondary" size="sm" onClick={expandAllEmployees}>
                <Icon name="chevronDown" size="xs" className="mr-1" /> {t.employees.expandAll}
              </Button>
              <Button variant="secondary" size="sm" onClick={collapseAllEmployees}>
                <Icon name="chevronUp" size="xs" className="mr-1" /> {t.employees.collapseAll}
              </Button>
            </>
          )}
          {canHireEmployees && (
            <Button 
              onClick={() => setShowHireModal(true)}
              disabled={isAtMaxEmployees}
            >
              + {t.employees.hireEmployee}
            </Button>
          )}
        </div>
      </div>

      {/* Hire Modal */}
      {showHireModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">{t.employees.hireNew}</h3>
                <button 
                  onClick={() => setShowHireModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Tier Selection */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-3">{t.employees.experienceLevel}</label>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(TIER_CONFIGS) as EmployeeTier[]).map((tier) => {
                    const config = TIER_CONFIGS[tier];
                    const styles = TIER_STYLES[tier];
                    const affordable = canAfford(tier);
                    
                    return (
                      <button
                        key={tier}
                        onClick={() => setSelectedTier(tier)}
                        disabled={!affordable}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          selectedTier === tier 
                            ? `${styles.bg} ${styles.border}` 
                            : 'bg-gray-700/50 border-gray-600'
                        } ${!affordable ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-500'}`}
                      >
                        <div className={`font-bold ${selectedTier === tier ? styles.text : 'text-white'}`}>
                          {config.label}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{config.description}</div>
                        <div className="mt-3 space-y-1 text-xs">
                          <div className={affordable ? 'text-green-400' : 'text-red-400'}>
                            {t.employees.hiring}: ${config.hiringCost.toLocaleString()}
                          </div>
                          <div className="text-gray-400">
                            {t.employees.salary}: ${config.salaryRange.min.toLocaleString()}-${config.salaryRange.max.toLocaleString()}/mo
                          </div>
                          <div className="text-gray-400">
                            {t.employees.skills}: {config.skillRange.min}-{config.skillRange.max}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Role Selection */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-3">{t.employees.role}</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {getAvailableRoles().map((role) => (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        selectedRole === role 
                          ? 'bg-gacha-purple/30 border-gacha-purple text-gacha-purple' 
                          : 'bg-gray-700/50 border-gray-600 text-white hover:border-gray-500'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-gray-400">{t.employees.hiringCost}:</span>
                    <span className={`ml-2 font-bold ${canAfford(selectedTier) ? 'text-green-400' : 'text-red-400'}`}>
                      ${TIER_CONFIGS[selectedTier].hiringCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-gray-400">
                    {t.employees.available}: <span className="text-gacha-gold">${company?.funds.toLocaleString() ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  variant="secondary" 
                  fullWidth
                  onClick={() => setShowHireModal(false)}
                >
                  {t.common.cancel}
                </Button>
                <Button 
                  variant="primary" 
                  fullWidth
                  disabled={!canAfford(selectedTier)}
                  onClick={handleHire}
                >
                  {t.employees.hire} {TIER_CONFIGS[selectedTier].label} {selectedRole}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Training Modal */}
      {trainingEmployeeId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  {t.employees.sendToTraining}: {employees.find(e => e.id === trainingEmployeeId)?.name}
                </h3>
                <button 
                  onClick={() => setTrainingEmployeeId(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                {(Object.entries(TRAINING_CONFIGS) as [TrainingType, typeof TRAINING_CONFIGS[TrainingType]][]).map(([type, config]) => {
                  const affordable = canAffordTraining(type);
                  return (
                    <div
                      key={type}
                      className={`p-4 rounded-lg border-2 ${affordable ? 'border-gray-600 hover:border-gacha-purple cursor-pointer' : 'border-gray-700 opacity-50'}`}
                      onClick={() => affordable && handleStartTraining(trainingEmployeeId, type)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-white capitalize">
                            {type.replace(/_/g, ' ')}
                          </h4>
                          <div className="flex gap-3 text-xs text-gray-400 mt-1">
                            <span><Icon name="clock" size="xs" className="inline mr-1" />{config.durationDays} {t.common.days}</span>
                            <span className={affordable ? 'text-green-400' : 'text-red-400'}>
                              <Icon name="money" size="xs" className="inline mr-1" />${config.cost.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Skill Boosts */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(config.skillBoosts).map(([skill, boost]) => (
                          <span key={skill} className="text-xs px-2 py-1 bg-gacha-purple/30 rounded text-gacha-purple">
                            +{boost} {skill.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {config.moraleBoost > 0 && (
                          <span className="text-xs px-2 py-1 bg-green-900/30 rounded text-green-400">
                            +{config.moraleBoost} {t.employees.morale.toLowerCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button 
                variant="secondary" 
                fullWidth
                className="mt-4"
                onClick={() => setTrainingEmployeeId(null)}
              >
                {t.common.cancel}
              </Button>
            </div>
          </div>
        </div>
      )}
      {employees.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-400">{t.employees.noEmployeesYet}</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {employees.map((employee) => {
            const primarySkill = getPrimarySkill(employee);
            const assignedGame = getAssignedGame(employee.id);
            const isCollapsed = collapsedEmployees.has(employee.id);
            const training = getEmployeeTraining(employee.id);

            return (
              <Card key={employee.id}>
                {/* Always visible header */}
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{employee.name}</h3>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300 capitalize">
                        {primarySkill.replace('_', ' ')}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        employee.isAvailable
                          ? 'bg-green-900 text-green-300'
                          : 'bg-blue-900 text-blue-300'
                      }`}>
                        {employee.isAvailable ? t.employees.available : t.employees.assigned}
                      </span>
                      {training && (
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-900 text-blue-300">
                          {t.employees.training}
                        </span>
                      )}
                      {employee.morale < 40 && (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-900 text-red-300">
                          {t.employees.lowMorale}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex items-start gap-2">
                    <div>
                      <p className="text-gacha-gold font-semibold">
                        ${employee.salary.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">{t.employees.perMonth}</p>
                    </div>
                    <button
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleEmployeeCollapse(employee.id);
                      }}
                    >
                      <Icon 
                        name={isCollapsed ? 'chevronDown' : 'chevronUp'} 
                        size="sm" 
                        className="text-gray-400" 
                      />
                    </button>
                  </div>
                </div>

                {/* Collapsible Content */}
                {!isCollapsed && (
                  <>

                {/* Skills */}
                <div className="space-y-2 mb-4 mt-3">
                  {(Object.entries(employee.skills) as [SkillType, number][])
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([skill, value]) => (
                      <ProgressBar
                        key={skill}
                        value={value}
                        color={SKILL_COLORS[skill] as 'blue' | 'green' | 'purple' | 'gold' | 'red'}
                        size="sm"
                        label={skill.replace('_', ' ')}
                        showLabel
                      />
                    ))}
                </div>

                {/* Assignment */}
                {assignedGame && (
                  <p className="text-sm text-gray-400 mb-3">
                    {t.employees.workingOn}: <span className="text-white">{assignedGame.name}</span>
                  </p>
                )}

                {/* Morale */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{t.employees.morale}</span>
                    <span className={`${
                      employee.morale >= 70 ? 'text-green-400' :
                      employee.morale >= 40 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {employee.morale}%
                    </span>
                  </div>
                  <ProgressBar
                    value={employee.morale}
                    color={
                      employee.morale >= 70 ? 'green' :
                      employee.morale >= 40 ? 'gold' : 'red'
                    }
                    size="sm"
                  />
                </div>

                {/* Training Status */}
                {(() => {
                  if (training) {
                    const config = TRAINING_CONFIGS[training.trainingType];
                    const progress = Math.min(100, ((state.currentTick - training.startTick) / config.durationDays) * 100);
                    return (
                      <div className="mb-3 p-2 bg-blue-900/30 rounded-lg border border-blue-700">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-blue-300 flex items-center gap-1">
                            <Icon name="book" size="xs" />
                            Training: {training.trainingType.replace(/_/g, ' ')}
                          </span>
                          <button
                            onClick={() => handleCancelTraining(employee.id)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            {t.common.cancel}
                          </button>
                        </div>
                        <ProgressBar
                          value={progress}
                          color="blue"
                          size="sm"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          {Math.ceil(config.durationDays - (state.currentTick - training.startTick))} {t.employees.daysRemaining}
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Actions */}
                <div className="flex gap-2">
                  {employee.isAvailable && !getEmployeeTraining(employee.id) && (
                    <Button
                      variant="secondary"
                      size="sm"
                      fullWidth
                      onClick={() => setTrainingEmployeeId(employee.id)}
                    >
                      <Icon name="book" size="xs" className="mr-1" />
                      {t.employees.train}
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    fullWidth
                    onClick={() => handleFire(employee.id)}
                  >
                    {t.employees.fire}
                  </Button>
                </div>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
