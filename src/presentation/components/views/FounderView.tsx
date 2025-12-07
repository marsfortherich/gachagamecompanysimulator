import { useState } from 'react';
import { useGame } from '../../context';
import { GameActions } from '../../../application/actions';
import { Card, Button, ProgressBar, Icon, IconName } from '../common';
import { useI18n } from '../../../infrastructure/i18n';
import { 
  SkillType,
  SPECIALIZATION_CONFIGS,
  EXPERIENCE_CONFIGS,
  FOUNDER_TRAINING_CONFIGS,
  FounderTrainingType,
} from '../../../domain';

type SkillColor = 'blue' | 'purple' | 'green' | 'gold' | 'red';

const SKILL_DISPLAY: Record<SkillType, { icon: IconName; color: SkillColor }> = {
  programming: { icon: 'code', color: 'blue' },
  art: { icon: 'palette', color: 'purple' },
  game_design: { icon: 'designer', color: 'green' },
  marketing: { icon: 'bullhorn', color: 'gold' },
  management: { icon: 'clipboard', color: 'red' },
  sound: { icon: 'note', color: 'blue' },
  writing: { icon: 'pencil', color: 'purple' },
};

const SKILL_ORDER: SkillType[] = ['programming', 'art', 'game_design', 'marketing', 'management', 'sound', 'writing'];

export function FounderView() {
  const { state, dispatch } = useGame();
  const { founder, games } = state;
  const { t } = useI18n();
  const [selectedSkill, setSelectedSkill] = useState<SkillType>('programming');
  const [showTrainingModal, setShowTrainingModal] = useState(false);

  // Helper to get skill name from translations
  const getSkillName = (skill: SkillType): string => {
    const skillKeyMap: Record<SkillType, keyof typeof t.skills> = {
      programming: 'programming',
      art: 'art',
      game_design: 'gameDesign',
      marketing: 'marketing',
      management: 'management',
      sound: 'sound',
      writing: 'writing',
    };
    return t.skills[skillKeyMap[skill]];
  };

  if (!founder) {
    return (
      <div className="p-6">
        <Card>
          <p className="text-gray-400">{t.common.loading}</p>
        </Card>
      </div>
    );
  }

  const specConfig = SPECIALIZATION_CONFIGS[founder.specialization];
  const expConfig = EXPERIENCE_CONFIGS[founder.experience];

  // Check if founder is assigned to any project
  const assignedGame = games.find(g => g.assignedEmployees.includes(founder.id));
  const isTraining = founder.currentTraining !== null;

  const handleStartTraining = (trainingType: FounderTrainingType, skill: SkillType) => {
    dispatch(GameActions.startFounderTraining(trainingType, skill));
    setShowTrainingModal(false);
  };

  const getSkillLevel = (value: number): string => {
    if (value >= 80) return t.founder.skillLevels.master;
    if (value >= 60) return t.founder.skillLevels.expert;
    if (value >= 40) return t.founder.skillLevels.proficient;
    if (value >= 25) return t.founder.skillLevels.competent;
    if (value >= 10) return t.founder.skillLevels.novice;
    return t.founder.skillLevels.beginner;
  };

  const getSkillColor = (value: number): string => {
    if (value >= 80) return 'text-yellow-400';
    if (value >= 60) return 'text-purple-400';
    if (value >= 40) return 'text-blue-400';
    if (value >= 25) return 'text-green-400';
    return 'text-gray-400';
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Icon name="star" size="md" className="text-yellow-400" />
            {founder.name}
          </h2>
          <p className="text-gray-400">
            {specConfig.name} · {expConfig.name}
          </p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Activity */}
        <Card>
          <h3 className="text-sm text-gray-400 mb-2">{t.founder.currentActivity}</h3>
          {assignedGame ? (
            <div className="flex items-center gap-2">
              <Icon name="games" size="md" className="text-blue-400" />
              <div>
                <p className="text-white font-semibold">{t.founder.workingOn}: {assignedGame.name}</p>
                <p className="text-sm text-gray-400">
                  {assignedGame.status === 'live' ? t.founder.maintainingLiveGame : `${t.founder.development}: ${Math.round(assignedGame.developmentProgress)}%`}
                </p>
              </div>
            </div>
          ) : isTraining ? (
            <div className="flex items-center gap-2">
              <Icon name="book" size="md" className="text-green-400" />
              <div>
                <p className="text-white font-semibold">{FOUNDER_TRAINING_CONFIGS[founder.currentTraining!].name}</p>
                <p className="text-sm text-gray-400">
                  {t.founder.training}: {getSkillName(founder.trainingTargetSkill!)}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Icon name="coffee" size="md" className="text-gray-400" />
              <div>
                <p className="text-white font-semibold">{t.founder.idle}</p>
                <p className="text-sm text-gray-400">{t.founder.assignToProjectOrTrain}</p>
              </div>
            </div>
          )}
        </Card>

        {/* Experience */}
        <Card>
          <h3 className="text-sm text-gray-400 mb-2">{t.founder.experience}</h3>
          <div className="space-y-1">
            <p className="text-white">
              <span className="text-2xl font-bold">{founder.totalDaysWorked}</span>
              <span className="text-gray-400 ml-1">{t.founder.daysWorked}</span>
            </p>
            <p className="text-gray-400 text-sm">
              {founder.gamesCompleted} {t.founder.gamesCompleted}
            </p>
          </div>
        </Card>

        {/* Energy */}
        <Card>
          <h3 className="text-sm text-gray-400 mb-2">{t.founder.energy}</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">{Math.round(founder.energy)}%</span>
              <span className={`text-sm ${founder.energy >= 70 ? 'text-green-400' : founder.energy >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                {founder.energy >= 70 ? t.founder.energetic : founder.energy >= 40 ? t.founder.normal : t.founder.tired}
              </span>
            </div>
            <ProgressBar 
              value={founder.energy} 
              max={100} 
              color={founder.energy >= 70 ? 'green' : founder.energy >= 40 ? 'gold' : 'red'}
            />
          </div>
        </Card>
      </div>

      {/* Skills Section */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">{t.founder.skills}</h3>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setShowTrainingModal(true)}
            disabled={isTraining}
          >
            <Icon name="book" size="sm" className="mr-1" />
            {isTraining ? t.founder.trainingInProgress : t.founder.startTraining}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SKILL_ORDER.map((skillType) => {
            const skill = founder.skills[skillType];
            const display = SKILL_DISPLAY[skillType];
            const isPrimary = skillType === specConfig.primarySkill;
            const isSecondary = skillType === specConfig.secondarySkill;
            
            return (
              <div key={skillType} className="p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon name={display.icon} size="md" />
                    <span className="text-white font-medium">{getSkillName(skillType)}</span>
                    {isPrimary && (
                      <span className="text-xs px-1.5 py-0.5 bg-yellow-700/50 text-yellow-300 rounded">{t.founder.primary}</span>
                    )}
                    {isSecondary && (
                      <span className="text-xs px-1.5 py-0.5 bg-blue-700/50 text-blue-300 rounded">{t.founder.secondary}</span>
                    )}
                  </div>
                  <span className={`font-bold ${getSkillColor(skill)}`}>
                    {Math.round(skill)}
                  </span>
                </div>
                <ProgressBar value={skill} max={100} color={display.color} />
                <p className={`text-xs mt-1 ${getSkillColor(skill)}`}>
                  {getSkillLevel(skill)}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Training Progress (if training) */}
      {isTraining && founder.trainingEndTick && (
        <Card className="border-green-700 bg-green-900/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-400">
                {FOUNDER_TRAINING_CONFIGS[founder.currentTraining!].name}
              </h3>
              <p className="text-gray-400">
                {t.founder.training}: {getSkillName(founder.trainingTargetSkill!)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {FOUNDER_TRAINING_CONFIGS[founder.currentTraining!].description}
              </p>
            </div>
            <div className="text-right">
              <p className="text-green-400 font-semibold">
                {Math.max(0, founder.trainingEndTick - state.currentTick)} {t.founder.daysRemaining}
              </p>
              <p className="text-sm text-gray-400">
                +{FOUNDER_TRAINING_CONFIGS[founder.currentTraining!].skillGainPerDay * founder.learningMultiplier}{t.common.perDay}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Specialization Info */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-3">{t.founder.specialization}: {specConfig.name}</h3>
        <p className="text-gray-400 mb-4">{specConfig.description}</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-gray-700/30 rounded-lg">
            <p className="text-gray-400">{t.founder.primary} {t.founder.skills.toLowerCase()}</p>
            <p className="text-yellow-400 font-semibold flex items-center gap-1">
              <Icon name={SKILL_DISPLAY[specConfig.primarySkill].icon} size="sm" /> {getSkillName(specConfig.primarySkill)}
            </p>
          </div>
          <div className="p-3 bg-gray-700/30 rounded-lg">
            <p className="text-gray-400">{t.founder.secondary} {t.founder.skills.toLowerCase()}</p>
            <p className="text-blue-400 font-semibold flex items-center gap-1">
              <Icon name={SKILL_DISPLAY[specConfig.secondarySkill].icon} size="sm" /> {getSkillName(specConfig.secondarySkill)}
            </p>
          </div>
          <div className="p-3 bg-gray-700/30 rounded-lg">
            <p className="text-gray-400">{t.founder.learningSpeed}</p>
            <p className="text-white font-semibold">{founder.learningMultiplier}x</p>
          </div>
          <div className="p-3 bg-gray-700/30 rounded-lg">
            <p className="text-gray-400">{t.founder.roleEquivalent}</p>
            <p className="text-white font-semibold">{specConfig.equivalentRole}</p>
          </div>
        </div>
      </Card>

      {/* Training Modal */}
      {showTrainingModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">{t.founder.startTraining}</h3>
                <button 
                  onClick={() => setShowTrainingModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Skill Selection */}
              <div className="mb-6">
                <h4 className="text-sm text-gray-400 mb-3">{t.founder.selectSkillToTrain}</h4>
                <div className="grid grid-cols-4 gap-2">
                  {SKILL_ORDER.filter(s => s !== 'management').map((skillType) => {
                    const display = SKILL_DISPLAY[skillType];
                    return (
                      <button
                        key={skillType}
                        onClick={() => setSelectedSkill(skillType)}
                        className={`p-3 rounded-lg border transition-colors ${
                          selectedSkill === skillType
                            ? 'border-blue-500 bg-blue-900/30'
                            : 'border-gray-700 bg-gray-700/30 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex justify-center mb-1">
                          <Icon name={display.icon} size="lg" />
                        </div>
                        <p className="text-xs text-white">{getSkillName(skillType)}</p>
                        <p className="text-xs text-gray-400">{Math.round(founder.skills[skillType])}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Training Options */}
              <div className="space-y-3">
                <h4 className="text-sm text-gray-400 mb-3">{t.founder.selectTrainingType}</h4>
                {Object.values(FOUNDER_TRAINING_CONFIGS)
                  .filter(config => !config.requiresActiveProject || assignedGame)
                  .map((config) => {
                    const totalCost = config.costPerDay * config.durationDays;
                    const canAfford = state.company && state.company.funds >= totalCost;
                    
                    return (
                      <button
                        key={config.type}
                        onClick={() => canAfford && handleStartTraining(config.type, selectedSkill)}
                        disabled={!canAfford}
                        className={`w-full p-4 rounded-lg border text-left transition-colors ${
                          canAfford
                            ? 'border-gray-700 bg-gray-700/30 hover:border-blue-500 hover:bg-blue-900/20'
                            : 'border-gray-800 bg-gray-800/50 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-white font-semibold">{config.name}</p>
                            <p className="text-sm text-gray-400">{config.description}</p>
                          </div>
                          <div className="text-right">
                            {totalCost > 0 ? (
                              <p className={`font-semibold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                                ${totalCost.toLocaleString()}
                              </p>
                            ) : (
                              <p className="text-green-400 font-semibold">{t.common.free}</p>
                            )}
                            {config.durationDays > 0 && (
                              <p className="text-xs text-gray-400">{config.durationDays} {t.common.days}</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
                          <span>+{(config.skillGainPerDay * founder.learningMultiplier).toFixed(2)}{t.common.perDay}</span>
                          {config.durationDays > 0 && (
                            <span>{t.common.total}: +{(config.skillGainPerDay * config.durationDays * founder.learningMultiplier).toFixed(1)} {getSkillName(selectedSkill)}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>

              <div className="mt-6 flex justify-end">
                <Button variant="secondary" onClick={() => setShowTrainingModal(false)}>
                  {t.common.cancel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
