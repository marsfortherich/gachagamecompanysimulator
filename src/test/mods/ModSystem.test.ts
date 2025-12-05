/**
 * Mod System Tests - Prompt 11.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ModPack,
  validateModPack,
  resetModLoader,
  getModLoader,
} from '@infrastructure/mods';

// =============================================================================
// Test Data
// =============================================================================

const validManifest = {
  id: 'test-mod',
  name: 'Test Mod',
  version: '1.0.0',
  author: 'Test Author',
  description: 'A test mod',
  gameVersion: '1.0.0',
};

const validEvent = {
  id: 'test_event',
  title: 'Test Event',
  description: 'A test event',
  category: 'random',
  severity: 'minor',
  choices: [
    {
      id: 'choice_a',
      text: 'Choice A',
      effects: [{ type: 'money', value: 1000 }],
      ethicalScore: 0,
    },
  ],
  triggerConditions: [{ type: 'random', probability: 0.1 }],
  cooldownDays: 30,
  isUnique: false,
  weight: 1.0,
};

const validItem = {
  id: 'test_item',
  name: 'Test Item',
  rarity: 'rare',
  type: 'character',
  description: 'A test item',
};

const validBanner = {
  id: 'test_banner',
  name: 'Test Banner',
  featuredItems: ['test_item'],
  itemPool: ['test_item'],
  duration: 168,
};

// =============================================================================
// Validator Tests
// =============================================================================

describe('ModValidator', () => {
  describe('Manifest Validation', () => {
    it('accepts valid manifest', () => {
      const pack: ModPack = { manifest: validManifest };
      const result = validateModPack(pack);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects missing id', () => {
      const pack: ModPack = {
        manifest: { ...validManifest, id: '' },
      };
      const result = validateModPack(pack);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('id'))).toBe(true);
    });

    it('rejects invalid id format', () => {
      const pack: ModPack = {
        manifest: { ...validManifest, id: 'invalid id with spaces' },
      };
      const result = validateModPack(pack);
      expect(result.valid).toBe(false);
    });

    it('warns on non-semver version', () => {
      const pack: ModPack = {
        manifest: { ...validManifest, version: 'beta' },
      };
      const result = validateModPack(pack);
      expect(result.warnings.some(w => w.message.includes('semantic'))).toBe(true);
    });
  });

  describe('Event Validation', () => {
    it('accepts valid events', () => {
      const pack: ModPack = {
        manifest: validManifest,
        events: [validEvent],
      };
      const result = validateModPack(pack);
      expect(result.valid).toBe(true);
    });

    it('rejects invalid category', () => {
      const pack: ModPack = {
        manifest: validManifest,
        events: [{ ...validEvent, category: 'invalid_category' }],
      };
      const result = validateModPack(pack);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('category'))).toBe(true);
    });

    it('rejects invalid severity', () => {
      const pack: ModPack = {
        manifest: validManifest,
        events: [{ ...validEvent, severity: 'extreme' }],
      };
      const result = validateModPack(pack);
      expect(result.valid).toBe(false);
    });

    it('rejects event without choices', () => {
      const pack: ModPack = {
        manifest: validManifest,
        events: [{ ...validEvent, choices: [] }],
      };
      const result = validateModPack(pack);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('choice'))).toBe(true);
    });

    it('rejects invalid effect type', () => {
      const pack: ModPack = {
        manifest: validManifest,
        events: [{
          ...validEvent,
          choices: [{
            id: 'test',
            text: 'Test',
            effects: [{ type: 'invalid_effect', value: 100 }],
            ethicalScore: 0,
          }],
        }],
      };
      const result = validateModPack(pack);
      expect(result.valid).toBe(false);
    });

    it('warns on large reputation changes', () => {
      const pack: ModPack = {
        manifest: validManifest,
        events: [{
          ...validEvent,
          choices: [{
            id: 'test',
            text: 'Test',
            effects: [{ type: 'reputation', value: 75 }],
            ethicalScore: 0,
          }],
        }],
      };
      const result = validateModPack(pack);
      expect(result.warnings.some(w => w.message.includes('reputation'))).toBe(true);
    });

    it('rejects duplicate event IDs', () => {
      const pack: ModPack = {
        manifest: validManifest,
        events: [validEvent, validEvent],
      };
      const result = validateModPack(pack);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Duplicate'))).toBe(true);
    });

    it('rejects invalid trigger condition', () => {
      const pack: ModPack = {
        manifest: validManifest,
        events: [{
          ...validEvent,
          triggerConditions: [{ type: 'invalid_trigger' }],
        }],
      };
      const result = validateModPack(pack);
      expect(result.valid).toBe(false);
    });

    it('rejects probability out of range', () => {
      const pack: ModPack = {
        manifest: validManifest,
        events: [{
          ...validEvent,
          triggerConditions: [{ type: 'random', probability: 1.5 }],
        }],
      };
      const result = validateModPack(pack);
      expect(result.valid).toBe(false);
    });
  });

  describe('Item Validation', () => {
    it('accepts valid items', () => {
      const pack: ModPack = {
        manifest: validManifest,
        items: [validItem],
      };
      const result = validateModPack(pack);
      expect(result.valid).toBe(true);
    });

    it('rejects invalid rarity', () => {
      const pack: ModPack = {
        manifest: validManifest,
        items: [{ ...validItem, rarity: 'mythic' }],
      };
      const result = validateModPack(pack);
      expect(result.valid).toBe(false);
    });

    it('rejects invalid item type', () => {
      const pack: ModPack = {
        manifest: validManifest,
        items: [{ ...validItem, type: 'mount' }],
      };
      const result = validateModPack(pack);
      expect(result.valid).toBe(false);
    });

    it('rejects negative costs', () => {
      const pack: ModPack = {
        manifest: validManifest,
        items: [{ ...validItem, artCost: -1000 }],
      };
      const result = validateModPack(pack);
      expect(result.valid).toBe(false);
    });
  });

  describe('Banner Validation', () => {
    it('accepts valid banners', () => {
      const pack: ModPack = {
        manifest: validManifest,
        items: [validItem],
        banners: [validBanner],
      };
      const result = validateModPack(pack);
      expect(result.valid).toBe(true);
    });

    it('warns on missing item references', () => {
      const pack: ModPack = {
        manifest: validManifest,
        items: [],
        banners: [validBanner],
      };
      const result = validateModPack(pack);
      expect(result.warnings.some(w => w.message.includes('not found'))).toBe(true);
    });

    it('warns on rates not summing to 1', () => {
      const pack: ModPack = {
        manifest: validManifest,
        items: [validItem],
        banners: [{
          ...validBanner,
          rates: { common: 0.5, uncommon: 0.3 },
        }],
      };
      const result = validateModPack(pack);
      expect(result.warnings.some(w => w.message.includes('sum'))).toBe(true);
    });

    it('rejects negative duration', () => {
      const pack: ModPack = {
        manifest: validManifest,
        items: [validItem],
        banners: [{ ...validBanner, duration: -1 }],
      };
      const result = validateModPack(pack);
      expect(result.valid).toBe(false);
    });
  });

  describe('Balance Override Validation', () => {
    it('accepts allowed paths', () => {
      const pack: ModPack = {
        manifest: validManifest,
        balanceOverrides: [
          { path: 'economy.baseArpu', value: 3.0 },
        ],
      };
      const result = validateModPack(pack);
      expect(result.valid).toBe(true);
    });

    it('rejects disallowed paths', () => {
      const pack: ModPack = {
        manifest: validManifest,
        balanceOverrides: [
          { path: 'internal.secret.value', value: 1000 },
        ],
      };
      const result = validateModPack(pack);
      expect(result.valid).toBe(false);
    });

    it('warns on extreme multipliers', () => {
      const pack: ModPack = {
        manifest: validManifest,
        balanceOverrides: [
          { path: 'economy.baseArpu', value: 100, operation: 'multiply' },
        ],
      };
      const result = validateModPack(pack);
      expect(result.warnings.some(w => w.message.includes('Extreme'))).toBe(true);
    });
  });
});

// =============================================================================
// Loader Tests
// =============================================================================

describe('ModLoader', () => {
  beforeEach(() => {
    resetModLoader();
  });

  describe('Loading Mods', () => {
    it('loads valid mod', () => {
      const loader = getModLoader();
      const pack: ModPack = {
        manifest: validManifest,
        events: [validEvent],
      };

      const { success, mod } = loader.loadMod(pack);
      expect(success).toBe(true);
      expect(mod).toBeDefined();
      expect(mod!.pack.manifest.id).toBe('test-mod');
    });

    it('rejects invalid mod', () => {
      const loader = getModLoader();
      const pack: ModPack = {
        manifest: { ...validManifest, id: '' },
      };

      const { success, result } = loader.loadMod(pack);
      expect(success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('loads from JSON string', () => {
      const loader = getModLoader();
      const pack: ModPack = { manifest: validManifest };
      const json = JSON.stringify(pack);

      const { success } = loader.loadFromJson(json);
      expect(success).toBe(true);
    });

    it('handles invalid JSON', () => {
      const loader = getModLoader();
      const { success, result } = loader.loadFromJson('not valid json');
      expect(success).toBe(false);
      expect(result!.errors[0].message).toContain('Invalid JSON');
    });
  });

  describe('Mod Management', () => {
    it('tracks load order', () => {
      const loader = getModLoader();
      
      loader.loadMod({ manifest: { ...validManifest, id: 'mod-a' } });
      loader.loadMod({ manifest: { ...validManifest, id: 'mod-b' } });
      loader.loadMod({ manifest: { ...validManifest, id: 'mod-c' } });

      const mods = loader.getLoadedMods();
      expect(mods).toHaveLength(3);
      expect(mods[0].pack.manifest.id).toBe('mod-a');
      expect(mods[2].pack.manifest.id).toBe('mod-c');
    });

    it('unloads mods', () => {
      const loader = getModLoader();
      loader.loadMod({ manifest: validManifest });

      expect(loader.getLoadedMods()).toHaveLength(1);
      
      const result = loader.unloadMod('test-mod');
      expect(result).toBe(true);
      expect(loader.getLoadedMods()).toHaveLength(0);
    });

    it('toggles mod enabled state', () => {
      const loader = getModLoader();
      loader.loadMod({ manifest: validManifest });

      loader.setModEnabled('test-mod', false);
      expect(loader.getEnabledMods()).toHaveLength(0);

      loader.setModEnabled('test-mod', true);
      expect(loader.getEnabledMods()).toHaveLength(1);
    });

    it('reorders mods', () => {
      const loader = getModLoader();
      loader.loadMod({ manifest: { ...validManifest, id: 'mod-a' } });
      loader.loadMod({ manifest: { ...validManifest, id: 'mod-b' } });

      loader.reorderMods(['mod-b', 'mod-a']);

      const mods = loader.getLoadedMods();
      expect(mods[0].pack.manifest.id).toBe('mod-b');
      expect(mods[1].pack.manifest.id).toBe('mod-a');
    });
  });

  describe('Dependencies', () => {
    it('checks missing dependencies', () => {
      const loader = getModLoader();
      const pack: ModPack = {
        manifest: {
          ...validManifest,
          dependencies: ['required-mod'],
        },
      };

      const { success, result } = loader.loadMod(pack);
      expect(success).toBe(false);
      expect(result.errors.some(e => e.message.includes('dependency'))).toBe(true);
    });

    it('allows loading with satisfied dependencies', () => {
      const loader = getModLoader();
      
      // Load dependency first
      loader.loadMod({ manifest: { ...validManifest, id: 'required-mod' } });
      
      // Now load dependent mod
      const pack: ModPack = {
        manifest: {
          ...validManifest,
          id: 'dependent-mod',
          dependencies: ['required-mod'],
        },
      };

      const { success } = loader.loadMod(pack);
      expect(success).toBe(true);
    });

    it('prevents unloading mods with dependents', () => {
      const loader = getModLoader();
      
      loader.loadMod({ manifest: { ...validManifest, id: 'base-mod' } });
      loader.loadMod({
        manifest: {
          ...validManifest,
          id: 'dependent-mod',
          dependencies: ['base-mod'],
        },
      });

      const result = loader.unloadMod('base-mod');
      expect(result).toBe(false);
    });
  });

  describe('Conflicts', () => {
    it('detects declared conflicts', () => {
      const loader = getModLoader();
      
      loader.loadMod({ manifest: { ...validManifest, id: 'mod-a' } });
      loader.loadMod({
        manifest: {
          ...validManifest,
          id: 'mod-b',
          conflicts: ['mod-a'],
        },
      });

      const conflicts = loader.getConflicts();
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].modA).toBe('mod-b');
      expect(conflicts[0].modB).toBe('mod-a');
    });
  });

  describe('Content Aggregation', () => {
    it('collects events from all enabled mods', () => {
      const loader = getModLoader();
      
      loader.loadMod({
        manifest: { ...validManifest, id: 'mod-a' },
        events: [{ ...validEvent, id: 'event_a' }],
      });
      
      loader.loadMod({
        manifest: { ...validManifest, id: 'mod-b' },
        events: [{ ...validEvent, id: 'event_b' }],
      });

      const events = loader.getModEvents();
      expect(events).toHaveLength(2);
    });

    it('excludes events from disabled mods', () => {
      const loader = getModLoader();
      
      loader.loadMod({
        manifest: { ...validManifest, id: 'mod-a' },
        events: [validEvent],
      });
      
      loader.setModEnabled('mod-a', false);

      const events = loader.getModEvents();
      expect(events).toHaveLength(0);
    });
  });

  describe('Balance Overrides', () => {
    it('applies set operation', () => {
      const loader = getModLoader();
      const config = { economy: { baseArpu: 2.0 } };
      
      const result = loader.applyBalanceOverrides(config, [
        { path: 'economy.baseArpu', value: 5.0, operation: 'set' },
      ]);

      expect(result.economy.baseArpu).toBe(5.0);
    });

    it('applies add operation', () => {
      const loader = getModLoader();
      const config = { economy: { baseArpu: 2.0 } };
      
      const result = loader.applyBalanceOverrides(config, [
        { path: 'economy.baseArpu', value: 1.0, operation: 'add' },
      ]);

      expect(result.economy.baseArpu).toBe(3.0);
    });

    it('applies multiply operation', () => {
      const loader = getModLoader();
      const config = { economy: { baseArpu: 2.0 } };
      
      const result = loader.applyBalanceOverrides(config, [
        { path: 'economy.baseArpu', value: 1.5, operation: 'multiply' },
      ]);

      expect(result.economy.baseArpu).toBe(3.0);
    });

    it('handles nested paths', () => {
      const loader = getModLoader();
      const config = {
        economy: {
          rates: { base: 1.0 },
        },
      };
      
      const result = loader.applyBalanceOverrides(config, [
        { path: 'economy.rates.base', value: 2.0 },
      ]);

      expect(result.economy.rates.base).toBe(2.0);
    });

    it('preserves immutability', () => {
      const loader = getModLoader();
      const config = { economy: { baseArpu: 2.0 } };
      
      loader.applyBalanceOverrides(config, [
        { path: 'economy.baseArpu', value: 5.0 },
      ]);

      // Original should be unchanged
      expect(config.economy.baseArpu).toBe(2.0);
    });
  });
});
