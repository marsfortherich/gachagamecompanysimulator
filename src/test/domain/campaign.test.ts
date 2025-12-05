import { describe, it, expect } from 'vitest';
import {
  createCampaign,
  calculateCampaignCost,
  isCampaignOnCooldown,
  isCampaignActive,
  getCampaignCooldownRemaining,
  getActiveCampaigns,
  getCombinedCampaignEffects,
  updateCampaignStatus,
  CAMPAIGN_DEFINITIONS,
  Campaign,
  CampaignType,
} from '../../domain';

describe('Campaign', () => {
  describe('createCampaign', () => {
    it('should create a campaign with correct properties', () => {
      const campaign = createCampaign({
        type: 'social_media',
        gameId: 'game-1',
        currentTick: 100,
        gameDau: 10000,
      });

      expect(campaign.id).toBeTruthy();
      expect(campaign.type).toBe('social_media');
      expect(campaign.gameId).toBe('game-1');
      expect(campaign.status).toBe('active');
      expect(campaign.startTick).toBe(100);
      expect(campaign.endTick).toBe(100 + CAMPAIGN_DEFINITIONS.social_media.duration);
      expect(campaign.cost).toBeGreaterThan(0);
      expect(campaign.effects.dauBoost).toBe(CAMPAIGN_DEFINITIONS.social_media.dauBoost);
    });

    it('should create influencer short campaign', () => {
      const campaign = createCampaign({
        type: 'influencer_short',
        gameId: 'game-1',
        currentTick: 0,
        gameDau: 5000,
      });

      expect(campaign.type).toBe('influencer_short');
      expect(campaign.effects.dauBoost).toBe(CAMPAIGN_DEFINITIONS.influencer_short.dauBoost);
      expect(campaign.effects.revenueBoost).toBe(CAMPAIGN_DEFINITIONS.influencer_short.revenueBoost);
    });

    it('should create influencer long campaign with higher duration', () => {
      const campaign = createCampaign({
        type: 'influencer_long',
        gameId: 'game-1',
        currentTick: 0,
        gameDau: 5000,
      });

      expect(campaign.type).toBe('influencer_long');
      expect(campaign.endTick - campaign.startTick).toBe(CAMPAIGN_DEFINITIONS.influencer_long.duration);
      expect(campaign.effects.retentionBoost).toBe(CAMPAIGN_DEFINITIONS.influencer_long.retentionBoost);
    });
  });

  describe('calculateCampaignCost', () => {
    it('should calculate cost for low DAU game', () => {
      const cost = calculateCampaignCost('social_media', 1000);
      const baseCost = CAMPAIGN_DEFINITIONS.social_media.baseCost;
      
      // With 1000 DAU, the cost should be close to base cost
      expect(cost).toBeGreaterThanOrEqual(baseCost);
    });

    it('should scale cost with higher DAU', () => {
      const lowDauCost = calculateCampaignCost('social_media', 1000);
      const highDauCost = calculateCampaignCost('social_media', 100000);
      
      expect(highDauCost).toBeGreaterThan(lowDauCost);
    });

    it('should have different costs for different campaign types', () => {
      const socialCost = calculateCampaignCost('social_media', 10000);
      const adCost = calculateCampaignCost('ad_campaign', 10000);
      const influencerLongCost = calculateCampaignCost('influencer_long', 10000);
      
      // Ad campaign has higher base cost and scaling
      expect(adCost).toBeGreaterThan(socialCost);
      // Influencer long has the highest base cost
      expect(influencerLongCost).toBeGreaterThan(adCost);
    });
  });

  describe('isCampaignOnCooldown', () => {
    const createTestCampaign = (type: CampaignType, gameId: string, endTick: number): Campaign => ({
      id: `campaign-${Math.random()}`,
      type,
      gameId,
      status: 'completed',
      startTick: endTick - CAMPAIGN_DEFINITIONS[type].duration,
      endTick,
      cost: 1000,
      effects: {
        dauBoost: 0.1,
        retentionBoost: 0,
        revenueBoost: 0,
      },
    });

    it('should return false when no previous campaigns', () => {
      const result = isCampaignOnCooldown('social_media', 'game-1', [], 100);
      expect(result).toBe(false);
    });

    it('should return true during cooldown period', () => {
      const campaign = createTestCampaign('social_media', 'game-1', 100);
      const cooldown = CAMPAIGN_DEFINITIONS.social_media.cooldown;
      
      // Current tick is within cooldown period
      const result = isCampaignOnCooldown('social_media', 'game-1', [campaign], 100 + cooldown - 1);
      expect(result).toBe(true);
    });

    it('should return false after cooldown period', () => {
      const campaign = createTestCampaign('social_media', 'game-1', 100);
      const cooldown = CAMPAIGN_DEFINITIONS.social_media.cooldown;
      
      // Current tick is past cooldown
      const result = isCampaignOnCooldown('social_media', 'game-1', [campaign], 100 + cooldown + 1);
      expect(result).toBe(false);
    });

    it('should not affect other games', () => {
      const campaign = createTestCampaign('social_media', 'game-1', 100);
      
      // Different game should not be on cooldown
      const result = isCampaignOnCooldown('social_media', 'game-2', [campaign], 101);
      expect(result).toBe(false);
    });

    it('should not affect other campaign types', () => {
      const campaign = createTestCampaign('social_media', 'game-1', 100);
      
      // Different campaign type should not be on cooldown
      const result = isCampaignOnCooldown('ad_campaign', 'game-1', [campaign], 101);
      expect(result).toBe(false);
    });
  });

  describe('isCampaignActive', () => {
    const createActiveCampaign = (type: CampaignType, gameId: string): Campaign => ({
      id: `campaign-${Math.random()}`,
      type,
      gameId,
      status: 'active',
      startTick: 0,
      endTick: 100,
      cost: 1000,
      effects: { dauBoost: 0.1, retentionBoost: 0, revenueBoost: 0 },
    });

    it('should return false when no campaigns', () => {
      expect(isCampaignActive('social_media', 'game-1', [])).toBe(false);
    });

    it('should return true when campaign is active', () => {
      const campaign = createActiveCampaign('social_media', 'game-1');
      expect(isCampaignActive('social_media', 'game-1', [campaign])).toBe(true);
    });

    it('should return false when campaign is completed', () => {
      const campaign: Campaign = {
        ...createActiveCampaign('social_media', 'game-1'),
        status: 'completed',
      };
      expect(isCampaignActive('social_media', 'game-1', [campaign])).toBe(false);
    });

    it('should return false for different game', () => {
      const campaign = createActiveCampaign('social_media', 'game-1');
      expect(isCampaignActive('social_media', 'game-2', [campaign])).toBe(false);
    });
  });

  describe('getCampaignCooldownRemaining', () => {
    it('should return 0 when no previous campaigns', () => {
      const result = getCampaignCooldownRemaining('social_media', 'game-1', [], 100);
      expect(result).toBe(0);
    });

    it('should return remaining days during cooldown', () => {
      const campaign: Campaign = {
        id: 'test-campaign',
        type: 'social_media',
        gameId: 'game-1',
        status: 'completed',
        startTick: 0,
        endTick: 100,
        cost: 1000,
        effects: { dauBoost: 0.1, retentionBoost: 0, revenueBoost: 0 },
      };
      const cooldown = CAMPAIGN_DEFINITIONS.social_media.cooldown;
      
      // 1 day into cooldown
      const result = getCampaignCooldownRemaining('social_media', 'game-1', [campaign], 101);
      expect(result).toBe(cooldown - 1);
    });
  });

  describe('getActiveCampaigns', () => {
    it('should return empty array when no campaigns', () => {
      expect(getActiveCampaigns('game-1', [])).toHaveLength(0);
    });

    it('should return only active campaigns for specified game', () => {
      const campaigns: Campaign[] = [
        {
          id: 'c1',
          type: 'social_media',
          gameId: 'game-1',
          status: 'active',
          startTick: 0,
          endTick: 100,
          cost: 1000,
          effects: { dauBoost: 0.1, retentionBoost: 0, revenueBoost: 0 },
        },
        {
          id: 'c2',
          type: 'ad_campaign',
          gameId: 'game-1',
          status: 'completed',
          startTick: 0,
          endTick: 50,
          cost: 2000,
          effects: { dauBoost: 0.3, retentionBoost: 0, revenueBoost: 0 },
        },
        {
          id: 'c3',
          type: 'collaboration',
          gameId: 'game-2',
          status: 'active',
          startTick: 0,
          endTick: 100,
          cost: 1500,
          effects: { dauBoost: 0.25, retentionBoost: 0.05, revenueBoost: 0.1 },
        },
      ];

      const result = getActiveCampaigns('game-1', campaigns);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('c1');
    });
  });

  describe('getCombinedCampaignEffects', () => {
    it('should return zero effects when no campaigns', () => {
      const effects = getCombinedCampaignEffects('game-1', []);
      expect(effects.dauBoost).toBe(0);
      expect(effects.retentionBoost).toBe(0);
      expect(effects.revenueBoost).toBe(0);
    });

    it('should combine effects from multiple active campaigns', () => {
      const campaigns: Campaign[] = [
        {
          id: 'c1',
          type: 'social_media',
          gameId: 'game-1',
          status: 'active',
          startTick: 0,
          endTick: 100,
          cost: 1000,
          effects: { dauBoost: 0.1, retentionBoost: 0, revenueBoost: 0 },
        },
        {
          id: 'c2',
          type: 'influencer_long',
          gameId: 'game-1',
          status: 'active',
          startTick: 0,
          endTick: 100,
          cost: 5000,
          effects: { dauBoost: 0.15, retentionBoost: 0.15, revenueBoost: 0.10 },
        },
      ];

      const effects = getCombinedCampaignEffects('game-1', campaigns);
      expect(effects.dauBoost).toBe(0.25);
      expect(effects.retentionBoost).toBe(0.15);
      expect(effects.revenueBoost).toBe(0.10);
    });
  });

  describe('updateCampaignStatus', () => {
    it('should mark campaign as completed when past end tick', () => {
      const campaign: Campaign = {
        id: 'test',
        type: 'social_media',
        gameId: 'game-1',
        status: 'active',
        startTick: 0,
        endTick: 100,
        cost: 1000,
        effects: { dauBoost: 0.1, retentionBoost: 0, revenueBoost: 0 },
      };

      const updated = updateCampaignStatus(campaign, 101);
      expect(updated.status).toBe('completed');
    });

    it('should keep campaign active when before end tick', () => {
      const campaign: Campaign = {
        id: 'test',
        type: 'social_media',
        gameId: 'game-1',
        status: 'active',
        startTick: 0,
        endTick: 100,
        cost: 1000,
        effects: { dauBoost: 0.1, retentionBoost: 0, revenueBoost: 0 },
      };

      const updated = updateCampaignStatus(campaign, 50);
      expect(updated.status).toBe('active');
    });

    it('should not change already completed campaigns', () => {
      const campaign: Campaign = {
        id: 'test',
        type: 'social_media',
        gameId: 'game-1',
        status: 'completed',
        startTick: 0,
        endTick: 100,
        cost: 1000,
        effects: { dauBoost: 0.1, retentionBoost: 0, revenueBoost: 0 },
      };

      const updated = updateCampaignStatus(campaign, 200);
      expect(updated.status).toBe('completed');
    });
  });

  describe('Campaign Definitions', () => {
    it('should have 6 campaign types defined', () => {
      const types = Object.keys(CAMPAIGN_DEFINITIONS);
      expect(types).toHaveLength(6);
      expect(types).toContain('social_media');
      expect(types).toContain('collaboration');
      expect(types).toContain('livestream');
      expect(types).toContain('ad_campaign');
      expect(types).toContain('influencer_short');
      expect(types).toContain('influencer_long');
    });

    it('should have influencer_short with shorter duration than influencer_long', () => {
      expect(CAMPAIGN_DEFINITIONS.influencer_short.duration)
        .toBeLessThan(CAMPAIGN_DEFINITIONS.influencer_long.duration);
    });

    it('should have influencer_long with higher retention boost', () => {
      expect(CAMPAIGN_DEFINITIONS.influencer_long.retentionBoost)
        .toBeGreaterThan(CAMPAIGN_DEFINITIONS.influencer_short.retentionBoost);
    });

    it('should have influencer_long with higher base cost', () => {
      expect(CAMPAIGN_DEFINITIONS.influencer_long.baseCost)
        .toBeGreaterThan(CAMPAIGN_DEFINITIONS.influencer_short.baseCost);
    });

    it('should have all required properties for each campaign', () => {
      Object.values(CAMPAIGN_DEFINITIONS).forEach(def => {
        expect(def.type).toBeTruthy();
        expect(def.name).toBeTruthy();
        expect(def.icon).toBeTruthy();
        expect(def.description).toBeTruthy();
        expect(def.baseCost).toBeGreaterThan(0);
        expect(def.duration).toBeGreaterThan(0);
        expect(def.cooldown).toBeGreaterThanOrEqual(0);
        expect(def.dauBoost).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
