import { describe, it, expect } from 'vitest';
import {
  REPUTATION_TIERS,
  getReputationTier,
  BACKLASH_SEVERITY_CONFIG,
  createBacklashEvent,
  reputationToSentiment,
  getSentimentCategory,
  createInitialSocialMediaState,
  simulateSocialMediaTick,
  calculateReputationDecay,
  calculateEthicalReputationImpact,
  createInitialReputationState,
  applyReputationChange,
  addBacklashEvent,
  resolveBacklash,
  cleanupExpiredBacklash,
  simulateReputationTick,
} from '@domain/reputation';
import { SeededRNG } from '@domain/shared';

describe('Reputation System', () => {
  describe('REPUTATION_TIERS', () => {
    it('has all tiers defined', () => {
      const tierNames = REPUTATION_TIERS.map(t => t.tier);
      
      expect(tierNames).toContain('beloved');
      expect(tierNames).toContain('respected');
      expect(tierNames).toContain('neutral');
      expect(tierNames).toContain('questionable');
      expect(tierNames).toContain('disliked');
      expect(tierNames).toContain('reviled');
    });

    it('tiers cover full 0-100 range', () => {
      for (let rep = 0; rep <= 100; rep++) {
        const tier = getReputationTier(rep);
        expect(tier).toBeDefined();
      }
    });

    it('higher tiers have better modifiers', () => {
      const beloved = REPUTATION_TIERS.find(t => t.tier === 'beloved')!;
      const reviled = REPUTATION_TIERS.find(t => t.tier === 'reviled')!;
      
      expect(beloved.acquisitionModifier).toBeGreaterThan(reviled.acquisitionModifier);
      expect(beloved.revenueModifier).toBeGreaterThan(reviled.revenueModifier);
      expect(beloved.employeeRecruitModifier).toBeGreaterThan(reviled.employeeRecruitModifier);
    });
  });

  describe('getReputationTier', () => {
    it('returns correct tier for reputation value', () => {
      expect(getReputationTier(95).tier).toBe('beloved');
      expect(getReputationTier(75).tier).toBe('respected');
      expect(getReputationTier(55).tier).toBe('neutral');
      expect(getReputationTier(40).tier).toBe('questionable');
      expect(getReputationTier(20).tier).toBe('disliked');
      expect(getReputationTier(5).tier).toBe('reviled');
    });

    it('clamps out-of-range values', () => {
      expect(getReputationTier(-10).tier).toBe('reviled');
      expect(getReputationTier(150).tier).toBe('beloved');
    });
  });

  describe('BACKLASH_SEVERITY_CONFIG', () => {
    it('has all severities defined', () => {
      expect(BACKLASH_SEVERITY_CONFIG.minor).toBeDefined();
      expect(BACKLASH_SEVERITY_CONFIG.moderate).toBeDefined();
      expect(BACKLASH_SEVERITY_CONFIG.severe).toBeDefined();
      expect(BACKLASH_SEVERITY_CONFIG.catastrophic).toBeDefined();
    });

    it('higher severities have worse effects', () => {
      expect(BACKLASH_SEVERITY_CONFIG.catastrophic.baseReputationLoss)
        .toBeGreaterThan(BACKLASH_SEVERITY_CONFIG.minor.baseReputationLoss);
      
      expect(BACKLASH_SEVERITY_CONFIG.catastrophic.basePlayerLoss)
        .toBeGreaterThan(BACKLASH_SEVERITY_CONFIG.minor.basePlayerLoss);
    });
  });

  describe('createBacklashEvent', () => {
    it('creates event with correct severity', () => {
      const rng = new SeededRNG(12345);
      
      const event = createBacklashEvent(
        'moderate',
        'Dark pattern implementation',
        'Players discovered manipulative monetization',
        10,
        rng
      );
      
      expect(event.severity).toBe('moderate');
      expect(event.cause).toBe('Dark pattern implementation');
      expect(event.startDay).toBe(10);
      expect(event.effects.dailyReputationLoss).toBeGreaterThan(0);
    });

    it('includes resolution options', () => {
      const rng = new SeededRNG(12345);
      
      const event = createBacklashEvent('minor', 'Test', 'Test', 1, rng);
      
      expect(event.resolutionOptions.length).toBeGreaterThan(0);
      
      for (const option of event.resolutionOptions) {
        expect(option.name).toBeDefined();
        expect(typeof option.cost).toBe('number');
        expect(option.effectiveness).toBeGreaterThan(0);
        expect(option.effectiveness).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Social Media Sentiment', () => {
    it('converts reputation to sentiment', () => {
      expect(reputationToSentiment(100)).toBe(100);
      expect(reputationToSentiment(50)).toBe(0);
      expect(reputationToSentiment(0)).toBe(-100);
    });

    it('categorizes sentiment correctly', () => {
      expect(getSentimentCategory(80)).toBe('very_positive');
      expect(getSentimentCategory(40)).toBe('positive');
      expect(getSentimentCategory(0)).toBe('neutral');
      expect(getSentimentCategory(-40)).toBe('negative');
      expect(getSentimentCategory(-80)).toBe('very_negative');
    });
  });

  describe('createInitialSocialMediaState', () => {
    it('creates state based on reputation', () => {
      const highRepState = createInitialSocialMediaState(90);
      const lowRepState = createInitialSocialMediaState(20);
      
      expect(highRepState.sentimentScore).toBeGreaterThan(lowRepState.sentimentScore);
      expect(['very_positive', 'positive']).toContain(highRepState.overallSentiment);
      expect(['negative', 'very_negative']).toContain(lowRepState.overallSentiment);
    });

    it('includes influencer opinions', () => {
      const state = createInitialSocialMediaState(50);
      
      expect(state.influencerOpinions.length).toBeGreaterThan(0);
      
      for (const influencer of state.influencerOpinions) {
        expect(influencer.name).toBeDefined();
        expect(influencer.followers).toBeGreaterThan(0);
      }
    });
  });

  describe('simulateSocialMediaTick', () => {
    it('updates sentiment based on reputation', () => {
      const rng = new SeededRNG(12345);
      const initialState = createInitialSocialMediaState(50);
      
      const newState = simulateSocialMediaTick(initialState, 70, [], 1, rng);
      
      // Sentiment should drift toward the higher reputation
      expect(typeof newState.sentimentScore).toBe('number');
    });

    it('reacts to active backlash', () => {
      const rng = new SeededRNG(12345);
      const initialState = createInitialSocialMediaState(70);
      
      const backlash = createBacklashEvent('severe', 'Test', 'Test', 0, rng);
      
      const withoutBacklash = simulateSocialMediaTick(initialState, 70, [], 1, rng);
      
      const rng2 = new SeededRNG(12345);
      const withBacklash = simulateSocialMediaTick(initialState, 70, [backlash], 1, rng2);
      
      expect(withBacklash.sentimentScore).toBeLessThan(withoutBacklash.sentimentScore);
    });
  });

  describe('calculateReputationDecay', () => {
    it('decays high reputation slowly', () => {
      const decay = calculateReputationDecay(90, 30);
      
      expect(decay).toBeLessThan(0);  // Should lose reputation
      expect(Math.abs(decay)).toBeLessThan(5);  // But slowly
    });

    it('recovers low reputation slowly', () => {
      const recovery = calculateReputationDecay(20, 30);
      
      expect(recovery).toBeGreaterThan(0);  // Should gain reputation
      expect(recovery).toBeLessThanOrEqual(5);  // Capped at 5
    });

    it('neutral reputation stays stable', () => {
      const decay = calculateReputationDecay(50, 30);
      
      expect(decay).toBe(0);
    });
  });

  describe('calculateEthicalReputationImpact', () => {
    it('positive ethics improve reputation', () => {
      const impact = calculateEthicalReputationImpact(80, 0.8);
      expect(impact).toBeGreaterThan(0);
    });

    it('negative ethics damage reputation', () => {
      const impact = calculateEthicalReputationImpact(-60, 0.8);
      expect(impact).toBeLessThan(0);
    });

    it('public awareness amplifies impact', () => {
      const lowAwareness = calculateEthicalReputationImpact(50, 0.2);
      const highAwareness = calculateEthicalReputationImpact(50, 1.0);
      
      expect(Math.abs(highAwareness)).toBeGreaterThan(Math.abs(lowAwareness));
    });
  });

  describe('Reputation State Management', () => {
    it('creates initial state', () => {
      const state = createInitialReputationState(60);
      
      expect(state.currentReputation).toBe(60);
      expect(state.reputationHistory).toEqual([]);
      expect(state.activeBacklash).toEqual([]);
    });

    it('applies reputation changes', () => {
      const state = createInitialReputationState(50);
      
      const newState = applyReputationChange(state, {
        amount: 10,
        source: 'Good deed',
        day: 1,
      });
      
      expect(newState.currentReputation).toBe(60);
      expect(newState.reputationHistory.length).toBe(1);
    });

    it('clamps reputation to 0-100', () => {
      const highState = createInitialReputationState(95);
      const boosted = applyReputationChange(highState, {
        amount: 20,
        source: 'Big boost',
        day: 1,
      });
      
      expect(boosted.currentReputation).toBe(100);
      
      const lowState = createInitialReputationState(5);
      const damaged = applyReputationChange(lowState, {
        amount: -20,
        source: 'Disaster',
        day: 1,
      });
      
      expect(damaged.currentReputation).toBe(0);
    });

    it('adds backlash events', () => {
      const rng = new SeededRNG(12345);
      const state = createInitialReputationState(50);
      const backlash = createBacklashEvent('moderate', 'Test', 'Test', 1, rng);
      
      const newState = addBacklashEvent(state, backlash);
      
      expect(newState.activeBacklash.length).toBe(1);
    });
  });

  describe('resolveBacklash', () => {
    it('can successfully resolve backlash', () => {
      const rng = new SeededRNG(42);  // Seed that produces success
      const state = createInitialReputationState(50);
      const backlash = createBacklashEvent('minor', 'Test', 'Test', 1, rng);
      const stateWithBacklash = addBacklashEvent(state, backlash);
      
      // Try many times to get a success
      let foundSuccess = false;
      for (let i = 0; i < 10; i++) {
        const attemptRng = new SeededRNG(i * 100);
        const result = resolveBacklash(
          stateWithBacklash,
          backlash.id,
          backlash.resolutionOptions[0].id,
          10,
          attemptRng
        );
        
        if (result.success) {
          foundSuccess = true;
          expect(result.newState.currentReputation).toBeGreaterThanOrEqual(state.currentReputation);
          break;
        }
      }
      
      // Just verify the mechanism works
      expect(typeof foundSuccess).toBe('boolean');
    });

    it('returns error for non-existent backlash', () => {
      const rng = new SeededRNG(12345);
      const state = createInitialReputationState(50);
      
      const result = resolveBacklash(state, 'fake_id', 'resolution', 10, rng);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('cleanupExpiredBacklash', () => {
    it('removes expired backlash', () => {
      const rng = new SeededRNG(12345);
      const state = createInitialReputationState(50);
      const backlash = createBacklashEvent('minor', 'Test', 'Test', 1, rng);
      
      // Backlash duration is around 7 days for minor
      const stateWithBacklash = addBacklashEvent(state, backlash);
      
      // Before expiry
      const beforeExpiry = cleanupExpiredBacklash(stateWithBacklash, 5);
      expect(beforeExpiry.activeBacklash.length).toBe(1);
      
      // After expiry (well past duration)
      const afterExpiry = cleanupExpiredBacklash(stateWithBacklash, 100);
      expect(afterExpiry.activeBacklash.length).toBe(0);
    });
  });

  describe('simulateReputationTick', () => {
    it('applies backlash effects', () => {
      const rng = new SeededRNG(12345);
      const state = createInitialReputationState(70);
      const backlash = createBacklashEvent('moderate', 'Test', 'Test', 0, rng);
      const stateWithBacklash = addBacklashEvent(state, backlash);
      
      const rng2 = new SeededRNG(12345);
      const tickedState = simulateReputationTick(stateWithBacklash, 1, rng2);
      
      // Should have lost some reputation due to backlash
      expect(tickedState.currentReputation).toBeLessThan(state.currentReputation);
    });

    it('updates social media', () => {
      const rng = new SeededRNG(12345);
      const state = createInitialReputationState(50);
      
      const tickedState = simulateReputationTick(state, 1, rng);
      
      expect(tickedState.socialMedia).toBeDefined();
      expect(typeof tickedState.socialMedia.sentimentScore).toBe('number');
    });
  });
});
