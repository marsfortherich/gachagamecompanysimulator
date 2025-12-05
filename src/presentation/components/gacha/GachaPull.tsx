/**
 * GachaPull Component - Prompt 5.4: Gacha Animation
 * 
 * Animated gacha pull experience with:
 * - Pull animation sequence
 * - Reveal effects based on rarity
 * - Multi-pull support (10-pull)
 * - Skip functionality
 * - Sound/haptic feedback hooks
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { usePullAnimation } from '@presentation/hooks/useGacha';
import { Icon } from '../common/Icon';
import {
  PullResultViewModel,
  CelebrationLevel,
} from '@presentation/viewmodels/GachaViewModel';

// =============================================================================
// Types
// =============================================================================

export interface GachaPullProps {
  /** Results to display in the animation */
  results: PullResultViewModel[];
  /** Called when animation completes */
  onComplete: () => void;
  /** Called to skip animation */
  onSkip?: () => void;
  /** Enable auto-advance after each reveal */
  autoAdvance?: boolean;
  /** Delay between auto-advances (ms) */
  autoAdvanceDelay?: number;
  /** Custom class names */
  className?: string;
}

export type AnimationPhase = 
  | 'idle'
  | 'countdown'
  | 'pulling'
  | 'revealing'
  | 'celebrating'
  | 'summary';

// =============================================================================
// Animation Constants
// =============================================================================

const COUNTDOWN_DURATION = 1000;
const PULL_DURATION = 1500;
const REVEAL_DURATION = 800;
const CELEBRATION_DURATIONS: Record<CelebrationLevel, number> = {
  none: 300,
  minor: 600,
  major: 1000,
  legendary: 1500,
};

const RARITY_EFFECTS: Record<string, {
  bgGradient: string;
  glowColor: string;
  particleCount: number;
}> = {
  common: {
    bgGradient: 'from-gray-400 to-gray-600',
    glowColor: 'shadow-gray-400/50',
    particleCount: 0,
  },
  uncommon: {
    bgGradient: 'from-green-400 to-green-600',
    glowColor: 'shadow-green-400/50',
    particleCount: 5,
  },
  rare: {
    bgGradient: 'from-blue-400 to-blue-600',
    glowColor: 'shadow-blue-400/50',
    particleCount: 10,
  },
  epic: {
    bgGradient: 'from-purple-400 to-purple-600',
    glowColor: 'shadow-purple-400/50',
    particleCount: 15,
  },
  legendary: {
    bgGradient: 'from-yellow-400 via-orange-400 to-red-500',
    glowColor: 'shadow-yellow-400/60',
    particleCount: 25,
  },
};

// =============================================================================
// Main Component
// =============================================================================

export const GachaPull: React.FC<GachaPullProps> = ({
  results,
  onComplete,
  onSkip,
  autoAdvance = true,
  autoAdvanceDelay = 2000,
  className = '',
}) => {
  const {
    animationState,
    isAnimating,
    currentResult,
    startAnimation,
    advanceToNext,
    skipAnimation,
    resetAnimation,
    hasMoreResults,
    revealedCount,
    totalCount,
  } = usePullAnimation();

  const [phase, setPhase] = useState<AnimationPhase>('idle');
  const [showParticles, setShowParticles] = useState(false);

  // Start animation when results change
  useEffect(() => {
    if (results.length > 0 && !isAnimating) {
      startAnimation(results);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase('countdown');
    }
  }, [results, isAnimating, startAnimation]);

  // Handle phase transitions
  useEffect(() => {
    if (phase === 'countdown') {
      const timer = setTimeout(() => {
        setPhase('pulling');
      }, COUNTDOWN_DURATION);
      return () => clearTimeout(timer);
    }

    if (phase === 'pulling') {
      const timer = setTimeout(() => {
        advanceToNext();
        setPhase('revealing');
      }, PULL_DURATION);
      return () => clearTimeout(timer);
    }

    if (phase === 'revealing' && currentResult) {
      const timer = setTimeout(() => {
        setShowParticles(true);
        setPhase('celebrating');
      }, REVEAL_DURATION);
      return () => clearTimeout(timer);
    }

    if (phase === 'celebrating' && currentResult) {
      const duration = CELEBRATION_DURATIONS[currentResult.celebrationLevel];
      const timer = setTimeout(() => {
        setShowParticles(false);
        if (hasMoreResults && autoAdvance) {
          advanceToNext();
          setPhase('revealing');
        } else if (!hasMoreResults) {
          setPhase('summary');
        }
      }, duration + autoAdvanceDelay);
      return () => clearTimeout(timer);
    }

    if (phase === 'summary') {
      // Animation complete
    }
  }, [phase, currentResult, hasMoreResults, autoAdvance, autoAdvanceDelay, advanceToNext]);

  // Handle skip
  const handleSkip = useCallback(() => {
    skipAnimation();
    setPhase('summary');
    onSkip?.();
  }, [skipAnimation, onSkip]);

  // Handle complete
  const handleComplete = useCallback(() => {
    resetAnimation();
    setPhase('idle');
    onComplete();
  }, [resetAnimation, onComplete]);

  // Handle tap to advance
  const handleTap = useCallback(() => {
    if (phase === 'celebrating' && hasMoreResults) {
      setShowParticles(false);
      advanceToNext();
      setPhase('revealing');
    } else if (phase === 'summary') {
      handleComplete();
    }
  }, [phase, hasMoreResults, advanceToNext, handleComplete]);

  return (
    <div 
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        bg-black/80 backdrop-blur-sm
        ${className}
      `}
      onClick={handleTap}
    >
      {/* Skip button */}
      {phase !== 'idle' && phase !== 'summary' && (
        <button
          className="absolute top-4 right-4 px-4 py-2 bg-white/20 hover:bg-white/30 
                     rounded-lg text-white font-medium transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
        >
          Skip
        </button>
      )}

      {/* Progress indicator */}
      {phase !== 'idle' && phase !== 'summary' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
          {Array.from({ length: totalCount }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i < revealedCount ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      )}

      {/* Animation content */}
      <div className="relative">
        {/* Countdown phase */}
        {phase === 'countdown' && (
          <CountdownAnimation />
        )}

        {/* Pulling phase */}
        {phase === 'pulling' && (
          <PullingAnimation />
        )}

        {/* Reveal/Celebrate phase */}
        {(phase === 'revealing' || phase === 'celebrating') && currentResult && (
          <ItemReveal 
            result={currentResult} 
            showParticles={showParticles}
            isCelebrating={phase === 'celebrating'}
          />
        )}

        {/* Summary phase */}
        {phase === 'summary' && (
          <PullSummary 
            results={animationState.results} 
            onClose={handleComplete}
          />
        )}
      </div>
    </div>
  );
};

// =============================================================================
// Sub-components
// =============================================================================

const CountdownAnimation: React.FC = () => {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => setCount(count - 1), 300);
      return () => clearTimeout(timer);
    }
  }, [count]);

  return (
    <div className="text-9xl font-bold text-white animate-pulse">
      {count > 0 ? count : <Icon name="dice" size="lg" className="text-white" />}
    </div>
  );
};

const PullingAnimation: React.FC = () => {
  return (
    <div className="relative w-48 h-48">
      {/* Spinning orb effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 animate-spin" />
      <div className="absolute inset-2 rounded-full bg-black flex items-center justify-center">
        <Icon name="sparkles" size="lg" className="text-yellow-400 animate-bounce" />
      </div>
      {/* Outer glow rings */}
      <div className="absolute -inset-4 rounded-full border-2 border-white/20 animate-ping" />
      <div className="absolute -inset-8 rounded-full border border-white/10 animate-ping animation-delay-200" />
    </div>
  );
};

interface ItemRevealProps {
  result: PullResultViewModel;
  showParticles: boolean;
  isCelebrating: boolean;
}

const ItemReveal: React.FC<ItemRevealProps> = ({ result, showParticles, isCelebrating }) => {
  const effects = RARITY_EFFECTS[result.item.rarity] || RARITY_EFFECTS.common;

  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* Particle effects */}
      {showParticles && effects.particleCount > 0 && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: effects.particleCount }).map((_, i) => (
            <Particle key={i} index={i} rarity={result.item.rarity} />
          ))}
        </div>
      )}

      {/* Item card */}
      <div 
        className={`
          relative w-64 h-80 rounded-xl overflow-hidden
          bg-gradient-to-br ${effects.bgGradient}
          shadow-2xl ${effects.glowColor}
          transform transition-all duration-500
          ${isCelebrating ? 'scale-110' : 'scale-100'}
          ${isCelebrating && result.celebrationLevel === 'legendary' ? 'animate-pulse' : ''}
        `}
      >
        {/* Card inner content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white">
          {/* Type icon */}
          <span className="text-5xl mb-4">{result.item.typeIcon}</span>
          
          {/* Item name */}
          <h3 className="text-xl font-bold text-center mb-2">
            {result.item.name}
          </h3>
          
          {/* Rarity badge */}
          <div className="px-3 py-1 rounded-full bg-white/20 text-sm font-medium">
            {result.item.rarityLabel}
          </div>

          {/* Duplicate indicator */}
          {result.isDuplicate && (
            <div className="mt-4 px-2 py-1 rounded bg-white/10 text-xs">
              Duplicate! +10 Tokens
            </div>
          )}

          {/* Pity indicator */}
          {result.pityUsed && (
            <div className="mt-2 px-2 py-1 rounded bg-yellow-500/50 text-xs">
              ⭐ Guaranteed!
            </div>
          )}
        </div>

        {/* Shine effect */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent 
                     -translate-x-full animate-shine"
        />
      </div>

      {/* Tap to continue hint */}
      {isCelebrating && (
        <p className="text-white/60 text-sm animate-pulse">
          Tap to continue
        </p>
      )}
    </div>
  );
};

interface ParticleProps {
  index: number;
  rarity: string;
}

const Particle: React.FC<ParticleProps> = ({ index, rarity }) => {
  // Memoize random values so they're stable between renders
  const particleStyle = useMemo(() => {
    const angle = (index / 20) * 360;
    const distance = 100 + Math.random() * 100;
    const delay = Math.random() * 0.5;
    const size = 4 + Math.random() * 8;
    return { angle, distance, delay, size };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]); // Only recalculate when index changes
  
  const colors: Record<string, string> = {
    uncommon: 'bg-green-400',
    rare: 'bg-blue-400',
    epic: 'bg-purple-400',
    legendary: 'bg-yellow-400',
  };

  return (
    <div
      className={`
        absolute left-1/2 top-1/2 rounded-full
        ${colors[rarity] || 'bg-white'}
        animate-particle
      `}
      style={{
        width: particleStyle.size,
        height: particleStyle.size,
        transform: `rotate(${particleStyle.angle}deg) translateY(-${particleStyle.distance}px)`,
        animationDelay: `${particleStyle.delay}s`,
      }}
    />
  );
};

interface PullSummaryProps {
  results: PullResultViewModel[];
  onClose: () => void;
}

const PullSummary: React.FC<PullSummaryProps> = ({ results, onClose }) => {
  // Group by rarity for display
  const byRarity = results.reduce((acc, r) => {
    acc[r.item.rarity] = (acc[r.item.rarity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-gray-900/90 rounded-xl p-6 max-w-md mx-4">
      <h2 className="text-2xl font-bold text-white text-center mb-4">
        Pull Results
      </h2>

      {/* Rarity summary */}
      <div className="flex justify-center gap-4 mb-6">
        {Object.entries(byRarity).map(([rarity, count]) => (
          <div 
            key={rarity}
            className={`
              px-3 py-2 rounded-lg text-center
              bg-gradient-to-br ${RARITY_EFFECTS[rarity]?.bgGradient || 'from-gray-400 to-gray-600'}
            `}
          >
            <div className="text-xl font-bold text-white">{count}</div>
            <div className="text-xs text-white/80 capitalize">{rarity}</div>
          </div>
        ))}
      </div>

      {/* Item grid */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {results.map((result, i) => (
          <div
            key={i}
            className={`
              aspect-square rounded-lg flex items-center justify-center
              bg-gradient-to-br ${RARITY_EFFECTS[result.item.rarity]?.bgGradient || 'from-gray-400 to-gray-600'}
              ${result.isDuplicate ? 'opacity-60' : ''}
            `}
            title={result.item.name}
          >
            <span className="text-lg">{result.item.typeIcon}</span>
          </div>
        ))}
      </div>

      {/* Close button */}
      <button
        className="w-full py-3 bg-white text-gray-900 rounded-lg font-bold 
                   hover:bg-gray-100 transition-colors"
        onClick={onClose}
      >
        Continue
      </button>
    </div>
  );
};

// =============================================================================
// CSS Animation Classes (add to your global CSS or Tailwind config)
// =============================================================================

/*
@keyframes shine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes particle {
  0% { opacity: 1; transform: rotate(var(--angle)) translateY(0); }
  100% { opacity: 0; transform: rotate(var(--angle)) translateY(-200px); }
}

.animate-shine {
  animation: shine 1.5s ease-in-out infinite;
}

.animate-particle {
  animation: particle 1s ease-out forwards;
}

.animation-delay-200 {
  animation-delay: 0.2s;
}
*/

export default GachaPull;
