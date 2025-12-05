/**
 * Tutorial UI Components - Prompt 7.1
 * 
 * Spotlight overlay and tooltip components for tutorial system.
 */

import { useEffect, useState, useRef, ReactNode } from 'react';
import { useTutorial, TutorialStep } from './TutorialContext';
import { Icon } from '../components/common/Icon';

// =============================================================================
// Types
// =============================================================================

interface SpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TooltipPosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
}

// =============================================================================
// Spotlight Overlay Component
// =============================================================================

interface SpotlightOverlayProps {
  targetSelector?: string;
  padding?: number;
  onBackgroundClick?: () => void;
}

export function SpotlightOverlay({
  targetSelector,
  padding = 8,
  onBackgroundClick,
}: SpotlightOverlayProps) {
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);

  useEffect(() => {
    if (!targetSelector) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSpotlight(null);
      return;
    }

    const updateSpotlight = () => {
      const element = document.querySelector(targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setSpotlight({
          x: rect.left - padding,
          y: rect.top - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        });
      } else {
        setSpotlight(null);
      }
    };

    updateSpotlight();

    // Update on resize/scroll
    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight, true);

    // Use MutationObserver to detect DOM changes
    const observer = new MutationObserver(updateSpotlight);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight, true);
      observer.disconnect();
    };
  }, [targetSelector, padding]);

  if (!spotlight && !targetSelector) {
    // Full-screen overlay with no spotlight
    return (
      <div
        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
        onClick={onBackgroundClick}
      />
    );
  }

  // Create spotlight with SVG mask
  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      <svg className="w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlight && (
              <rect
                x={spotlight.x}
                y={spotlight.y}
                width={spotlight.width}
                height={spotlight.height}
                rx={8}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#spotlight-mask)"
          className="pointer-events-auto"
          onClick={onBackgroundClick}
        />
      </svg>
      
      {/* Spotlight border glow */}
      {spotlight && (
        <div
          className="absolute border-2 border-indigo-400 rounded-lg shadow-lg animate-pulse"
          style={{
            left: spotlight.x,
            top: spotlight.y,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}

// =============================================================================
// Tutorial Tooltip Component
// =============================================================================

interface TutorialTooltipProps {
  step: TutorialStep;
  targetSelector?: string;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  canGoBack: boolean;
  progress: number;
}

export function TutorialTooltip({
  step,
  targetSelector,
  onNext,
  onPrevious,
  onSkip,
  canGoBack,
  progress,
}: TutorialTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<TooltipPosition>({
    top: 50,
    left: 50,
    arrowPosition: 'top',
  });

  useEffect(() => {
    const calculatePosition = () => {
      if (!tooltipRef.current) return;

      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = 16;

      if (!targetSelector) {
        // Center in viewport
        setPosition({
          top: (viewportHeight - tooltipRect.height) / 2,
          left: (viewportWidth - tooltipRect.width) / 2,
          arrowPosition: 'top',
        });
        return;
      }

      const target = document.querySelector(targetSelector);
      if (!target) {
        // Fallback to center
        setPosition({
          top: (viewportHeight - tooltipRect.height) / 2,
          left: (viewportWidth - tooltipRect.width) / 2,
          arrowPosition: 'top',
        });
        return;
      }

      const targetRect = target.getBoundingClientRect();
      const preferredPosition = step.tooltipPosition || 'bottom';

      let newPosition: TooltipPosition;

      switch (preferredPosition) {
        case 'top':
          newPosition = {
            bottom: viewportHeight - targetRect.top + margin,
            left: targetRect.left + (targetRect.width - tooltipRect.width) / 2,
            arrowPosition: 'bottom',
          };
          break;
        case 'bottom':
          newPosition = {
            top: targetRect.bottom + margin,
            left: targetRect.left + (targetRect.width - tooltipRect.width) / 2,
            arrowPosition: 'top',
          };
          break;
        case 'left':
          newPosition = {
            top: targetRect.top + (targetRect.height - tooltipRect.height) / 2,
            right: viewportWidth - targetRect.left + margin,
            arrowPosition: 'right',
          };
          break;
        case 'right':
          newPosition = {
            top: targetRect.top + (targetRect.height - tooltipRect.height) / 2,
            left: targetRect.right + margin,
            arrowPosition: 'left',
          };
          break;
        default:
          newPosition = {
            top: targetRect.bottom + margin,
            left: targetRect.left,
            arrowPosition: 'top',
          };
      }

      // Clamp to viewport
      if (newPosition.left !== undefined) {
        newPosition.left = Math.max(margin, Math.min(newPosition.left, viewportWidth - tooltipRect.width - margin));
      }
      if (newPosition.top !== undefined) {
        newPosition.top = Math.max(margin, Math.min(newPosition.top, viewportHeight - tooltipRect.height - margin));
      }

      setPosition(newPosition);
    };

    // Delay calculation to ensure ref is attached
    const timer = setTimeout(calculatePosition, 50);

    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
    };
  }, [targetSelector, step.tooltipPosition]);

  const arrowClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-slate-800',
    bottom: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-slate-800',
    left: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-slate-800',
    right: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-slate-800',
  };

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[9999] bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-5 max-w-md animate-fadeIn"
      style={{
        top: position.top,
        bottom: position.bottom,
        left: position.left,
        right: position.right,
      }}
    >
      {/* Arrow */}
      <div
        className={`absolute w-0 h-0 border-8 ${arrowClasses[position.arrowPosition]}`}
      />

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-700 rounded-t-xl overflow-hidden">
        <div
          className="h-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="pt-2">
        <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
        <p className="text-slate-300 text-sm mb-4">{step.description}</p>

        {/* Required action hint */}
        {step.requiredAction && (
          <div className="mb-4 px-3 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-lg">
            <p className="text-indigo-300 text-xs flex items-center gap-1.5">
              <Icon name="pointer" size="xs" /> Complete this action to continue
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {canGoBack && (
              <button
                onClick={onPrevious}
                className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {step.canSkip && (
              <button
                onClick={onSkip}
                className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Skip Tutorial
              </button>
            )}
            {!step.requiredAction && step.nextStep && (
              <button
                onClick={onNext}
                className="px-4 py-1.5 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 
                         text-white rounded-lg transition-colors"
              >
                Next →
              </button>
            )}
            {!step.nextStep && (
              <button
                onClick={onNext}
                className="px-4 py-1.5 text-sm font-medium bg-green-500 hover:bg-green-600 
                         text-white rounded-lg transition-colors flex items-center gap-1.5"
              >
                Complete! <Icon name="sparkles" size="xs" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Tutorial Container Component
// =============================================================================

interface TutorialContainerProps {
  children: ReactNode;
}

export function TutorialContainer({ children }: TutorialContainerProps) {
  const {
    state,
    currentStepConfig,
    progress,
    nextStep,
    previousStep,
    skipTutorial,
  } = useTutorial();

  if (!state.isActive || !currentStepConfig) {
    return <>{children}</>;
  }

  const canGoBack = currentStepConfig.previousStep !== null;

  return (
    <>
      {children}
      
      {/* Spotlight overlay */}
      <SpotlightOverlay
        targetSelector={currentStepConfig.targetElement}
        padding={12}
      />

      {/* Tooltip */}
      <TutorialTooltip
        step={currentStepConfig}
        targetSelector={currentStepConfig.targetElement}
        onNext={nextStep}
        onPrevious={previousStep}
        onSkip={skipTutorial}
        canGoBack={canGoBack}
        progress={progress}
      />
    </>
  );
}

// =============================================================================
// Tutorial Replay Panel (for settings)
// =============================================================================

interface TutorialReplayPanelProps {
  onReplay: (stepId?: string) => void;
}

export function TutorialReplayPanel({ onReplay }: TutorialReplayPanelProps) {
  const { state, jumpToStep } = useTutorial();
  
  const sections = [
    { id: 'welcome', label: 'Welcome & Overview' },
    { id: 'first_employee_intro', label: 'Hiring Employees' },
    { id: 'first_project_intro', label: 'Game Development' },
    { id: 'research_intro', label: 'Research System' },
    { id: 'market_awareness', label: 'Market & Ethics' },
  ] as const;

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">Tutorial Sections</h3>
      
      <div className="space-y-2">
        {sections.map((section) => {
          const isCompleted = state.completedSteps.includes(section.id as typeof state.completedSteps[0]);
          
          return (
            <button
              key={section.id}
              onClick={() => {
                jumpToStep(section.id as typeof state.completedSteps[0]);
                onReplay(section.id);
              }}
              className={`
                w-full flex items-center justify-between px-4 py-3 rounded-lg
                transition-colors text-left
                ${isCompleted 
                  ? 'bg-green-500/10 border border-green-500/30 hover:bg-green-500/20' 
                  : 'bg-slate-700 hover:bg-slate-600'
                }
              `}
            >
              <span className="text-white">{section.label}</span>
              <span className="text-sm flex items-center gap-1">
                {isCompleted 
                  ? <><Icon name="check" size="xs" className="text-green-400" /> Completed</> 
                  : <><Icon name="play" size="xs" /> Replay</>}
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onReplay()}
        className="mt-4 w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white 
                   font-medium rounded-lg transition-colors"
      >
        Restart Full Tutorial
      </button>
    </div>
  );
}

// =============================================================================
// CSS for animations (add to global CSS)
// =============================================================================

/*
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
*/
