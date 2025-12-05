import { describe, it, expect, beforeEach } from 'vitest';
import {
  SandboxFlags,
  SandboxManager,
  getSandboxManager,
  DEFAULT_SANDBOX_FLAGS,
  createInitialSandboxState,
  SandboxState,
} from '../../domain/sandbox';

describe('SandboxManager', () => {
  let manager: SandboxManager;

  beforeEach(() => {
    manager = new SandboxManager();
  });

  describe('Initialization', () => {
    it('should start with sandbox disabled', () => {
      expect(manager.isEnabled()).toBe(false);
    });

    it('should have all cheats disabled by default', () => {
      const state = manager.getState();
      const flags = state.flags;
      
      expect(flags.infiniteMoney).toBe(false);
      expect(flags.freeHiring).toBe(false);
      expect(flags.instantDevelopment).toBe(false);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const manager1 = getSandboxManager();
      const manager2 = getSandboxManager();
      expect(manager1).toBe(manager2);
    });
  });

  describe('Sandbox Activation', () => {
    it('should enable sandbox mode', () => {
      manager.enable();
      expect(manager.isEnabled()).toBe(true);
    });

    it('should disable sandbox mode', () => {
      manager.enable();
      manager.disable();
      expect(manager.isEnabled()).toBe(false);
    });

    it('should mark as sandbox when enabled', () => {
      manager.enable();
      const state = manager.getState();
      expect(state.isMarkedAsSandbox).toBe(true);
    });
  });

  describe('Flag Management', () => {
    beforeEach(() => {
      manager.enable();
    });

    it('should set individual flags', () => {
      manager.setFlag('infiniteMoney', true);
      expect(manager.getFlag('infiniteMoney')).toBe(true);
    });

    it('should toggle flags', () => {
      expect(manager.getFlag('infiniteMoney')).toBe(false);
      
      manager.setFlag('infiniteMoney', true);
      expect(manager.getFlag('infiniteMoney')).toBe(true);
      
      manager.setFlag('infiniteMoney', false);
      expect(manager.getFlag('infiniteMoney')).toBe(false);
    });

    it('should set multiple flags', () => {
      manager.setFlag('infiniteMoney', true);
      manager.setFlag('instantDevelopment', true);
      manager.setFlag('freeHiring', true);
      
      expect(manager.getFlag('infiniteMoney')).toBe(true);
      expect(manager.getFlag('instantDevelopment')).toBe(true);
      expect(manager.getFlag('freeHiring')).toBe(true);
    });

    it('should reset all flags', () => {
      manager.setFlag('infiniteMoney', true);
      manager.setFlag('instantDevelopment', true);
      
      manager.disableAllFlags();
      
      expect(manager.getFlag('infiniteMoney')).toBe(false);
      expect(manager.getFlag('instantDevelopment')).toBe(false);
    });
  });

  describe('State Management', () => {
    it('should get current state', () => {
      manager.enable();
      manager.setFlag('infiniteMoney', true);
      
      const state = manager.getState();
      
      expect(state.enabled).toBe(true);
      expect(state.flags.infiniteMoney).toBe(true);
    });

    it('should load state correctly', () => {
      const state: SandboxState = {
        enabled: true,
        flags: {
          ...DEFAULT_SANDBOX_FLAGS,
          infiniteMoney: true,
          maxQuality: true,
        },
        activatedAt: Date.now(),
        isMarkedAsSandbox: true,
        forcedEventQueue: [],
        manipulatedTrends: {},
      };
      
      manager.loadState(state);
      
      expect(manager.isEnabled()).toBe(true);
      expect(manager.getFlag('infiniteMoney')).toBe(true);
      expect(manager.getFlag('maxQuality')).toBe(true);
      expect(manager.getFlag('freeHiring')).toBe(false);
    });
  });

  describe('Callbacks', () => {
    it('should trigger callback when flag changes', () => {
      let changedFlag: keyof SandboxFlags | null = null;
      let newValue: boolean | number | null = null;
      
      manager.setOnFlagChange((flag, value) => {
        changedFlag = flag;
        newValue = value;
      });
      
      manager.enable();
      manager.setFlag('infiniteMoney', true);
      
      expect(changedFlag).toBe('infiniteMoney');
      expect(newValue).toBe(true);
    });
  });
});

describe('Default Sandbox Flags', () => {
  it('should have all flags set to appropriate defaults', () => {
    expect(DEFAULT_SANDBOX_FLAGS.infiniteMoney).toBe(false);
    expect(DEFAULT_SANDBOX_FLAGS.freeHiring).toBe(false);
    expect(DEFAULT_SANDBOX_FLAGS.instantDevelopment).toBe(false);
    expect(DEFAULT_SANDBOX_FLAGS.speedMultiplier).toBe(1);
  });

  it('should include all expected flag keys', () => {
    const expectedKeys: (keyof SandboxFlags)[] = [
      'infiniteMoney',
      'freeHiring',
      'noSalaries',
      'noServerCosts',
      'noReputationDecay',
      'maxReputation',
      'instantDevelopment',
      'noBugs',
      'maxQuality',
      'maxEmployeeSkills',
      'noMoraleDecay',
      'noEmployeeQuit',
      'guaranteedLegendary',
      'freePulls',
      'manipulateMarket',
      'noCompetitors',
      'forceEvents',
      'noNegativeEvents',
      'instantResearch',
      'freeResearch',
      'revealHiddenAchievements',
      'speedMultiplier',
    ];

    expectedKeys.forEach((key) => {
      expect(key in DEFAULT_SANDBOX_FLAGS).toBe(true);
    });
  });
});

describe('createInitialSandboxState', () => {
  it('should create state with defaults', () => {
    const state = createInitialSandboxState();
    
    expect(state.enabled).toBe(false);
    expect(state.activatedAt).toBeNull();
    expect(state.isMarkedAsSandbox).toBe(false);
    expect(state.forcedEventQueue).toEqual([]);
    expect(state.manipulatedTrends).toEqual({});
  });

  it('should create independent copies', () => {
    const state1 = createInitialSandboxState();
    const state2 = createInitialSandboxState();
    
    state1.enabled = true;
    
    expect(state1.enabled).toBe(true);
    expect(state2.enabled).toBe(false);
  });
});

describe('Cheat Categories', () => {
  let manager: SandboxManager;

  beforeEach(() => {
    manager = new SandboxManager();
    manager.enable();
  });

  describe('Economy Cheats', () => {
    it('should enable infinite money mode', () => {
      manager.setFlag('infiniteMoney', true);
      expect(manager.getFlag('infiniteMoney')).toBe(true);
    });

    it('should enable free hiring', () => {
      manager.setFlag('freeHiring', true);
      expect(manager.getFlag('freeHiring')).toBe(true);
    });

    it('should disable salaries', () => {
      manager.setFlag('noSalaries', true);
      expect(manager.getFlag('noSalaries')).toBe(true);
    });
  });

  describe('Development Cheats', () => {
    it('should enable instant development', () => {
      manager.setFlag('instantDevelopment', true);
      expect(manager.getFlag('instantDevelopment')).toBe(true);
    });

    it('should disable bugs', () => {
      manager.setFlag('noBugs', true);
      expect(manager.getFlag('noBugs')).toBe(true);
    });

    it('should enable max quality', () => {
      manager.setFlag('maxQuality', true);
      expect(manager.getFlag('maxQuality')).toBe(true);
    });
  });

  describe('Research Cheats', () => {
    it('should enable instant research', () => {
      manager.setFlag('instantResearch', true);
      expect(manager.getFlag('instantResearch')).toBe(true);
    });

    it('should enable free research', () => {
      manager.setFlag('freeResearch', true);
      expect(manager.getFlag('freeResearch')).toBe(true);
    });
  });

  describe('Event Cheats', () => {
    it('should disable negative events', () => {
      manager.setFlag('noNegativeEvents', true);
      expect(manager.getFlag('noNegativeEvents')).toBe(true);
    });

    it('should enable force events', () => {
      manager.setFlag('forceEvents', true);
      expect(manager.getFlag('forceEvents')).toBe(true);
    });
  });

  describe('Gacha Cheats', () => {
    it('should guarantee legendary pulls', () => {
      manager.setFlag('guaranteedLegendary', true);
      expect(manager.getFlag('guaranteedLegendary')).toBe(true);
    });

    it('should enable free pulls', () => {
      manager.setFlag('freePulls', true);
      expect(manager.getFlag('freePulls')).toBe(true);
    });
  });

  describe('Speed Control', () => {
    it('should set speed multiplier', () => {
      manager.setFlag('speedMultiplier', 5);
      expect(manager.getFlag('speedMultiplier')).toBe(5);
    });

    it('should support various speed values', () => {
      const speeds = [1, 2, 5, 10];
      
      speeds.forEach((speed) => {
        manager.setFlag('speedMultiplier', speed);
        expect(manager.getFlag('speedMultiplier')).toBe(speed);
      });
    });
  });
});

describe('Sandbox State Persistence', () => {
  it('should preserve marked state after disable', () => {
    const manager = new SandboxManager();
    
    manager.enable();
    expect(manager.getState().isMarkedAsSandbox).toBe(true);
    
    manager.disable();
    expect(manager.getState().isMarkedAsSandbox).toBe(true);
  });

  it('should record activation timestamp', () => {
    const manager = new SandboxManager();
    const beforeEnable = Date.now();
    
    manager.enable();
    
    const state = manager.getState();
    expect(state.activatedAt).not.toBeNull();
    expect(state.activatedAt!).toBeGreaterThanOrEqual(beforeEnable);
  });
});
