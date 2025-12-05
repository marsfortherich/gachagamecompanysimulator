/**
 * Tutorial System - Prompt 7.1
 * 
 * Interactive tutorial for new players with:
 * - Step-by-step guidance
 * - Spotlight UI highlighting
 * - Tooltips with explanations
 * - Progress tracking
 */

import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';

// =============================================================================
// Tutorial Step Types
// =============================================================================

export type TutorialStepId =
  | 'welcome'
  | 'company_founded'
  | 'first_employee_intro'
  | 'first_employee_hire'
  | 'first_project_intro'
  | 'first_project_start'
  | 'development_phases'
  | 'launch_game'
  | 'first_revenue'
  | 'hire_more_employees'
  | 'research_intro'
  | 'market_awareness'
  | 'first_ethical_decision'
  | 'tutorial_complete';

export interface TutorialStep {
  id: TutorialStepId;
  title: string;
  description: string;
  targetElement?: string; // CSS selector for spotlight
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  requiredAction?: string; // Action user must take
  canSkip: boolean;
  nextStep: TutorialStepId | null;
  previousStep: TutorialStepId | null;
  onEnter?: () => void;
  onExit?: () => void;
  highlightArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
    padding?: number;
  };
}

// =============================================================================
// Tutorial Step Configuration
// =============================================================================

export const TUTORIAL_STEPS: Record<TutorialStepId, TutorialStep> = {
  welcome: {
    id: 'welcome',
    title: 'Welcome to Gacha Game Simulator!',
    description: 'Ready to build your gacha game empire? This tutorial will guide you through the basics. You can skip at any time.',
    canSkip: true,
    nextStep: 'company_founded',
    previousStep: null,
    tooltipPosition: 'bottom',
  },
  company_founded: {
    id: 'company_founded',
    title: 'Your Company Awaits',
    description: 'You\'ve just founded your game development company! Let\'s start by checking your dashboard.',
    targetElement: '[data-tutorial="dashboard"]',
    canSkip: true,
    nextStep: 'first_employee_intro',
    previousStep: 'welcome',
    tooltipPosition: 'bottom',
  },
  first_employee_intro: {
    id: 'first_employee_intro',
    title: 'Building Your Team',
    description: 'Every great game needs talented people. Let\'s hire your first employee!',
    targetElement: '[data-tutorial="employees-tab"]',
    canSkip: true,
    nextStep: 'first_employee_hire',
    previousStep: 'company_founded',
    tooltipPosition: 'right',
  },
  first_employee_hire: {
    id: 'first_employee_hire',
    title: 'Hire an Employee',
    description: 'Click the "Gacha Pull" button to recruit new talent. Each pull may reveal common to legendary employees!',
    targetElement: '[data-tutorial="gacha-button"]',
    requiredAction: 'GACHA_PULL',
    canSkip: true,
    nextStep: 'first_project_intro',
    previousStep: 'first_employee_intro',
    tooltipPosition: 'left',
  },
  first_project_intro: {
    id: 'first_project_intro',
    title: 'Starting a Game Project',
    description: 'Now that you have an employee, let\'s create your first game!',
    targetElement: '[data-tutorial="games-tab"]',
    canSkip: true,
    nextStep: 'first_project_start',
    previousStep: 'first_employee_hire',
    tooltipPosition: 'right',
  },
  first_project_start: {
    id: 'first_project_start',
    title: 'Create New Game',
    description: 'Click "New Game" to start development. Choose a genre and assign your team.',
    targetElement: '[data-tutorial="new-game-button"]',
    requiredAction: 'CREATE_GAME',
    canSkip: true,
    nextStep: 'development_phases',
    previousStep: 'first_project_intro',
    tooltipPosition: 'bottom',
  },
  development_phases: {
    id: 'development_phases',
    title: 'Development Phases',
    description: 'Games go through phases: Planning → Development → Testing → Soft Launch → Live. Each phase needs different skills.',
    targetElement: '[data-tutorial="game-progress"]',
    canSkip: true,
    nextStep: 'launch_game',
    previousStep: 'first_project_start',
    tooltipPosition: 'bottom',
  },
  launch_game: {
    id: 'launch_game',
    title: 'Launch Your Game',
    description: 'When development is complete, your game will launch and start generating revenue!',
    targetElement: '[data-tutorial="launch-button"]',
    canSkip: true,
    nextStep: 'first_revenue',
    previousStep: 'development_phases',
    tooltipPosition: 'left',
  },
  first_revenue: {
    id: 'first_revenue',
    title: 'Your First Revenue!',
    description: 'Congratulations! Your game is making money. Revenue depends on game quality, marketing, and player satisfaction.',
    targetElement: '[data-tutorial="revenue-display"]',
    canSkip: true,
    nextStep: 'hire_more_employees',
    previousStep: 'launch_game',
    tooltipPosition: 'bottom',
  },
  hire_more_employees: {
    id: 'hire_more_employees',
    title: 'Expand Your Team',
    description: 'With revenue coming in, you can hire more employees. A diverse team with different skills makes better games!',
    targetElement: '[data-tutorial="hire-section"]',
    canSkip: true,
    nextStep: 'research_intro',
    previousStep: 'first_revenue',
    tooltipPosition: 'right',
  },
  research_intro: {
    id: 'research_intro',
    title: 'Research & Development',
    description: 'Unlock new game genres, features, and office upgrades through research. Invest in R&D to stay competitive!',
    targetElement: '[data-tutorial="research-tab"]',
    canSkip: true,
    nextStep: 'market_awareness',
    previousStep: 'hire_more_employees',
    tooltipPosition: 'right',
  },
  market_awareness: {
    id: 'market_awareness',
    title: 'Know Your Market',
    description: 'Keep an eye on market trends and competitor games. The most profitable genres change over time!',
    targetElement: '[data-tutorial="market-panel"]',
    canSkip: true,
    nextStep: 'first_ethical_decision',
    previousStep: 'research_intro',
    tooltipPosition: 'left',
  },
  first_ethical_decision: {
    id: 'first_ethical_decision',
    title: 'Ethical Choices',
    description: 'You\'ll face decisions that affect your reputation. Fair gacha rates and honest marketing build loyal players!',
    canSkip: true,
    nextStep: 'tutorial_complete',
    previousStep: 'market_awareness',
    tooltipPosition: 'bottom',
  },
  tutorial_complete: {
    id: 'tutorial_complete',
    title: 'Tutorial Complete!',
    description: 'You\'re ready to build your gacha empire! Remember: great games, happy players, and ethical practices lead to long-term success.',
    canSkip: false,
    nextStep: null,
    previousStep: 'first_ethical_decision',
    tooltipPosition: 'bottom',
  },
};

// =============================================================================
// Tutorial State
// =============================================================================

export interface TutorialState {
  isActive: boolean;
  currentStep: TutorialStepId | null;
  completedSteps: TutorialStepId[];
  skipped: boolean;
  startedAt: number | null;
  completedAt: number | null;
}

const initialTutorialState: TutorialState = {
  isActive: false,
  currentStep: null,
  completedSteps: [],
  skipped: false,
  startedAt: null,
  completedAt: null,
};

// =============================================================================
// Tutorial Actions
// =============================================================================

type TutorialAction =
  | { type: 'START_TUTORIAL' }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'SKIP_TUTORIAL' }
  | { type: 'COMPLETE_STEP'; stepId: TutorialStepId }
  | { type: 'COMPLETE_TUTORIAL' }
  | { type: 'RESTART_TUTORIAL' }
  | { type: 'JUMP_TO_STEP'; stepId: TutorialStepId }
  | { type: 'LOAD_STATE'; state: TutorialState };

function tutorialReducer(state: TutorialState, action: TutorialAction): TutorialState {
  switch (action.type) {
    case 'START_TUTORIAL':
      return {
        ...state,
        isActive: true,
        currentStep: 'welcome',
        startedAt: Date.now(),
        skipped: false,
      };

    case 'NEXT_STEP': {
      if (!state.currentStep) return state;
      const currentStepConfig = TUTORIAL_STEPS[state.currentStep];
      const nextStep = currentStepConfig.nextStep;
      
      if (!nextStep) {
        return {
          ...state,
          isActive: false,
          completedAt: Date.now(),
          completedSteps: [...state.completedSteps, state.currentStep],
        };
      }
      
      return {
        ...state,
        currentStep: nextStep,
        completedSteps: state.completedSteps.includes(state.currentStep)
          ? state.completedSteps
          : [...state.completedSteps, state.currentStep],
      };
    }

    case 'PREVIOUS_STEP': {
      if (!state.currentStep) return state;
      const currentStepConfig = TUTORIAL_STEPS[state.currentStep];
      const prevStep = currentStepConfig.previousStep;
      
      if (!prevStep) return state;
      
      return {
        ...state,
        currentStep: prevStep,
      };
    }

    case 'SKIP_TUTORIAL':
      return {
        ...state,
        isActive: false,
        skipped: true,
        completedAt: Date.now(),
      };

    case 'COMPLETE_STEP':
      return {
        ...state,
        completedSteps: state.completedSteps.includes(action.stepId)
          ? state.completedSteps
          : [...state.completedSteps, action.stepId],
      };

    case 'COMPLETE_TUTORIAL':
      return {
        ...state,
        isActive: false,
        completedAt: Date.now(),
        completedSteps: [...new Set([...state.completedSteps, 'tutorial_complete' as TutorialStepId])],
      };

    case 'RESTART_TUTORIAL':
      return {
        ...initialTutorialState,
        isActive: true,
        currentStep: 'welcome',
        startedAt: Date.now(),
      };

    case 'JUMP_TO_STEP':
      return {
        ...state,
        currentStep: action.stepId,
        isActive: true,
      };

    case 'LOAD_STATE':
      return action.state;

    default:
      return state;
  }
}

// =============================================================================
// Tutorial Context
// =============================================================================

interface TutorialContextValue {
  state: TutorialState;
  currentStepConfig: TutorialStep | null;
  progress: number; // 0-100
  startTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  restartTutorial: () => void;
  jumpToStep: (stepId: TutorialStepId) => void;
  completeAction: (action: string) => void;
  isStepCompleted: (stepId: TutorialStepId) => boolean;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

// =============================================================================
// Tutorial Provider
// =============================================================================

interface TutorialProviderProps {
  children: ReactNode;
  initialState?: Partial<TutorialState>;
  onTutorialComplete?: () => void;
  onStepChange?: (stepId: TutorialStepId) => void;
}

export function TutorialProvider({
  children,
  initialState,
  onTutorialComplete,
  onStepChange,
}: TutorialProviderProps) {
  const [state, dispatch] = useReducer(
    tutorialReducer,
    { ...initialTutorialState, ...initialState }
  );

  const currentStepConfig = state.currentStep 
    ? TUTORIAL_STEPS[state.currentStep] 
    : null;

  // Calculate progress
  const totalSteps = Object.keys(TUTORIAL_STEPS).length;
  const progress = (state.completedSteps.length / totalSteps) * 100;

  const startTutorial = useCallback(() => {
    dispatch({ type: 'START_TUTORIAL' });
  }, []);

  const nextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
    if (state.currentStep) {
      const next = TUTORIAL_STEPS[state.currentStep].nextStep;
      if (next) {
        onStepChange?.(next);
      } else {
        onTutorialComplete?.();
      }
    }
  }, [state.currentStep, onStepChange, onTutorialComplete]);

  const previousStep = useCallback(() => {
    dispatch({ type: 'PREVIOUS_STEP' });
    if (state.currentStep) {
      const prev = TUTORIAL_STEPS[state.currentStep].previousStep;
      if (prev) {
        onStepChange?.(prev);
      }
    }
  }, [state.currentStep, onStepChange]);

  const skipTutorial = useCallback(() => {
    dispatch({ type: 'SKIP_TUTORIAL' });
  }, []);

  const completeTutorial = useCallback(() => {
    dispatch({ type: 'COMPLETE_TUTORIAL' });
    onTutorialComplete?.();
  }, [onTutorialComplete]);

  const restartTutorial = useCallback(() => {
    dispatch({ type: 'RESTART_TUTORIAL' });
    onStepChange?.('welcome');
  }, [onStepChange]);

  const jumpToStep = useCallback((stepId: TutorialStepId) => {
    dispatch({ type: 'JUMP_TO_STEP', stepId });
    onStepChange?.(stepId);
  }, [onStepChange]);

  // Check if an action completes the required action for current step
  const completeAction = useCallback((action: string) => {
    if (
      state.currentStep &&
      currentStepConfig?.requiredAction === action
    ) {
      dispatch({ type: 'NEXT_STEP' });
    }
  }, [state.currentStep, currentStepConfig]);

  const isStepCompleted = useCallback((stepId: TutorialStepId) => {
    return state.completedSteps.includes(stepId);
  }, [state.completedSteps]);

  const value: TutorialContextValue = {
    state,
    currentStepConfig,
    progress,
    startTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    restartTutorial,
    jumpToStep,
    completeAction,
    isStepCompleted,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

// =============================================================================
// Tutorial Hook
// =============================================================================

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}

// =============================================================================
// Tutorial Serialization (for save/load)
// =============================================================================

export function serializeTutorialState(state: TutorialState): string {
  return JSON.stringify(state);
}

export function deserializeTutorialState(json: string): TutorialState {
  try {
    return JSON.parse(json);
  } catch {
    return initialTutorialState;
  }
}
