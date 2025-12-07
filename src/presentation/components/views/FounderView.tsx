import { useState } from 'react';
import { useGame } from '../../context';
import { GameActions } from '../../../application/actions';
import { Card, Button, ProgressBar, Icon } from '../common';
import { 
  SkillType,
  SPECIALIZATION_CONFIGS,
  EXPERIENCE_CONFIGS,
  FOUNDER_TRAINING_CONFIGS,
  FounderTrainingType,
} from '../../../domain';

type SkillColor = 'blue' | 'purple' | 'green' | 'gold' | 'red';

const SKILL_DISPLAY: Record<SkillType, { name: string; icon: string; color: SkillColor }> = {
  programming: { name: 'Programming', icon: '💻', color: 'blue' },
  art: { name: 'Art', icon: '🎨', color: 'purple' },
  game_design: { name: 'Game Design', icon: '🎮', color: 'green' },
  marketing: { name: 'Marketing', icon: '📢', color: 'gold' },
  management: { name: 'Management', icon: '📋', color: 'red' },
  sound: { name: 'Sound', icon: '🎵', color: 'blue' },
  writing: { name: 'Writing', icon: '✍️', color: 'purple' },
};

const SKILL_ORDER: SkillType[] = ['programming', 'art', 'game_design', 'marketing', 'management', 'sound', 'writing'];

export function FounderView() {
  const { state, dispatch } = useGame();
  const { founder, games } = state;
  const [selectedSkill, setSelectedSkill] = useState<SkillType>('programming');
  const [showTrainingModal, setShowTrainingModal] = useState(false);

  if (!founder) {
    return (
      <div className="p-6">
        <Card>
          <p className="text-gray-400">No founder data available.</p>
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
    if (value >= 80) return 'Master';
    if (value >= 60) return 'Expert';
    if (value >= 40) return 'Proficient';
    if (value >= 25) return 'Competent';
    if (value >= 10) return 'Novice';
    return 'Beginner';
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
          <h3 className="text-sm text-gray-400 mb-2">Current Activity</h3>
          {assignedGame ? (
            <div className="flex items-center gap-2">
              <Icon name="games" size="md" className="text-blue-400" />
              <div>
                <p className="text-white font-semibold">Working on: {assignedGame.name}</p>
                <p className="text-sm text-gray-400">
                  {assignedGame.status === 'live' ? 'Maintaining live game' : `Development: ${Math.round(assignedGame.developmentProgress)}%`}
                </p>
              </div>
            </div>
          ) : isTraining ? (
            <div className="flex items-center gap-2">
              <Icon name="book" size="md" className="text-green-400" />
              <div>
                <p className="text-white font-semibold">{FOUNDER_TRAINING_CONFIGS[founder.currentTraining!].name}</p>
                <p className="text-sm text-gray-400">
                  Training: {SKILL_DISPLAY[founder.trainingTargetSkill!].name}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Icon name="coffee" size="md" className="text-gray-400" />
              <div>
                <p className="text-white font-semibold">Idle</p>
                <p className="text-sm text-gray-400">Assign to a project or start training</p>
              </div>
            </div>
          )}
        </Card>

        {/* Experience */}
        <Card>
          <h3 className="text-sm text-gray-400 mb-2">Experience</h3>
          <div className="space-y-1">
            <p className="text-white">
              <span className="text-2xl font-bold">{founder.totalDaysWorked}</span>
              <span className="text-gray-400 ml-1">days worked</span>
            </p>
            <p className="text-gray-400 text-sm">
              {founder.gamesCompleted} game{founder.gamesCompleted !== 1 ? 's' : ''} completed
            </p>
          </div>
        </Card>

        {/* Energy */}
        <Card>
          <h3 className="text-sm text-gray-400 mb-2">Energy</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">{Math.round(founder.energy)}%</span>
              <span className={`text-sm ${founder.energy >= 70 ? 'text-green-400' : founder.energy >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                {founder.energy >= 70 ? 'Energetic' : founder.energy >= 40 ? 'Normal' : 'Tired'}
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
          <h3 className="text-lg font-semibold text-white">Skills</h3>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setShowTrainingModal(true)}
            disabled={isTraining}
          >
            <Icon name="book" size="sm" className="mr-1" />
            {isTraining ? 'Training in Progress...' : 'Start Training'}
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
                    <span className="text-lg">{display.icon}</span>
                    <span className="text-white font-medium">{display.name}</span>
                    {isPrimary && (
                      <span className="text-xs px-1.5 py-0.5 bg-yellow-700/50 text-yellow-300 rounded">Primary</span>
                    )}
                    {isSecondary && (
                      <span className="text-xs px-1.5 py-0.5 bg-blue-700/50 text-blue-300 rounded">Secondary</span>
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
                Training: {SKILL_DISPLAY[founder.trainingTargetSkill!].name}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {FOUNDER_TRAINING_CONFIGS[founder.currentTraining!].description}
              </p>
            </div>
            <div className="text-right">
              <p className="text-green-400 font-semibold">
                {Math.max(0, founder.trainingEndTick - state.currentTick)} days remaining
              </p>
              <p className="text-sm text-gray-400">
                +{FOUNDER_TRAINING_CONFIGS[founder.currentTraining!].skillGainPerDay * founder.learningMultiplier}/day
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Specialization Info */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-3">Specialization: {specConfig.name}</h3>
        <p className="text-gray-400 mb-4">{specConfig.description}</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-gray-700/30 rounded-lg">
            <p className="text-gray-400">Primary Skill</p>
            <p className="text-yellow-400 font-semibold flex items-center gap-1">
              {SKILL_DISPLAY[specConfig.primarySkill].icon} {SKILL_DISPLAY[specConfig.primarySkill].name}
            </p>
          </div>
          <div className="p-3 bg-gray-700/30 rounded-lg">
            <p className="text-gray-400">Secondary Skill</p>
            <p className="text-blue-400 font-semibold flex items-center gap-1">
              {SKILL_DISPLAY[specConfig.secondarySkill].icon} {SKILL_DISPLAY[specConfig.secondarySkill].name}
            </p>
          </div>
          <div className="p-3 bg-gray-700/30 rounded-lg">
            <p className="text-gray-400">Learning Speed</p>
            <p className="text-white font-semibold">{founder.learningMultiplier}x</p>
          </div>
          <div className="p-3 bg-gray-700/30 rounded-lg">
            <p className="text-gray-400">Role Equivalent</p>
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
                <h3 className="text-xl font-bold text-white">Start Training</h3>
                <button 
                  onClick={() => setShowTrainingModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Skill Selection */}
              <div className="mb-6">
                <h4 className="text-sm text-gray-400 mb-3">Select Skill to Train</h4>
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
                        <div className="text-2xl mb-1">{display.icon}</div>
                        <p className="text-xs text-white">{display.name}</p>
                        <p className="text-xs text-gray-400">{Math.round(founder.skills[skillType])}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Training Options */}
              <div className="space-y-3">
                <h4 className="text-sm text-gray-400 mb-3">Select Training Type</h4>
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
                              <p className="text-green-400 font-semibold">Free</p>
                            )}
                            {config.durationDays > 0 && (
                              <p className="text-xs text-gray-400">{config.durationDays} days</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
                          <span>+{(config.skillGainPerDay * founder.learningMultiplier).toFixed(2)}/day</span>
                          {config.durationDays > 0 && (
                            <span>Total: +{(config.skillGainPerDay * config.durationDays * founder.learningMultiplier).toFixed(1)} {SKILL_DISPLAY[selectedSkill].name}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>

              <div className="mt-6 flex justify-end">
                <Button variant="secondary" onClick={() => setShowTrainingModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
