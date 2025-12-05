import { describe, it, expect, beforeEach } from 'vitest';
import {
  ResearchManager,
  ResearchEventType,
} from '../../domain/research/ResearchManager';
import {
  RESEARCH_NODES,
  ResearchCategory,
  getResearchById,
  getResearchByCategory,
  canStartResearch,
  isResearchCompleted,
  createInitialResearchState,
} from '../../domain/research/Research';

describe('ResearchManager', () => {
  let manager: ResearchManager;

  beforeEach(() => {
    manager = new ResearchManager();
  });

  describe('Initialization', () => {
    it('should start with initial state', () => {
      const state = manager.getState();
      expect(state.completed).toEqual({});
      expect(state.active).toBeNull();
      expect(state.researchPoints).toBe(0);
    });

    it('should start with no active research', () => {
      const state = manager.getState();
      expect(state.active).toBeNull();
    });

    it('should have research nodes available', () => {
      expect(RESEARCH_NODES.length).toBeGreaterThan(0);
    });
  });

  describe('Research Points', () => {
    it('should add research points', () => {
      manager.addResearchPoints(100);
      expect(manager.getResearchPoints()).toBe(100);
    });

    it('should accumulate research points', () => {
      manager.addResearchPoints(100);
      manager.addResearchPoints(50);
      expect(manager.getResearchPoints()).toBe(150);
    });
  });

  describe('Research Start', () => {
    it('should start research with sufficient resources', () => {
      const tier1Research = RESEARCH_NODES.find(
        (r) => r.tier === 1 && r.prerequisites.length === 0
      );
      
      if (tier1Research) {
        manager.addResearchPoints(tier1Research.cost.researchPoints + 100);
        
        const result = manager.startResearch(
          tier1Research.id as string,
          tier1Research.cost.money + 1000,
          () => true
        );
        
        expect(result.success).toBe(true);
        expect(manager.getState().active).not.toBeNull();
        expect(manager.getState().active?.nodeId).toBe(tier1Research.id);
      }
    });

    it('should fail to start research without enough money', () => {
      const tier1Research = RESEARCH_NODES.find(
        (r) => r.tier === 1 && r.prerequisites.length === 0
      );
      
      if (tier1Research) {
        manager.addResearchPoints(tier1Research.cost.researchPoints + 100);
        
        const result = manager.startResearch(
          tier1Research.id as string,
          0, // No money
          () => false
        );
        
        expect(result.success).toBe(false);
      }
    });

    it('should fail to start research with unmet prerequisites', () => {
      const tier2Research = RESEARCH_NODES.find(
        (r) => r.tier === 2 && r.prerequisites.length > 0
      );
      
      if (tier2Research) {
        manager.addResearchPoints(10000);
        
        const result = manager.startResearch(
          tier2Research.id as string,
          100000,
          () => true
        );
        
        expect(result.success).toBe(false);
        expect(result.reason).toContain('Prerequisite');
      }
    });
  });

  describe('Research Progress', () => {
    it('should tick research day', () => {
      const tier1Research = RESEARCH_NODES.find(
        (r) => r.tier === 1 && r.prerequisites.length === 0
      );
      
      if (tier1Research) {
        manager.addResearchPoints(tier1Research.cost.researchPoints + 100);
        manager.startResearch(
          tier1Research.id as string,
          tier1Research.cost.money + 1000,
          () => true
        );
        
        const initialDays = manager.getState().active?.daysRemaining ?? 0;
        manager.tick();
        const newDays = manager.getState().active?.daysRemaining ?? 0;
        
        expect(newDays).toBe(initialDays - 1);
      }
    });

    it('should complete research when days reach zero', () => {
      const tier1Research = RESEARCH_NODES.find(
        (r) => r.tier === 1 && r.prerequisites.length === 0
      );
      
      if (tier1Research) {
        manager.addResearchPoints(tier1Research.cost.researchPoints + 100);
        manager.startResearch(
          tier1Research.id as string,
          tier1Research.cost.money + 1000,
          () => true
        );
        
        // Advance enough days to complete
        for (let i = 0; i < tier1Research.researchTime + 1; i++) {
          manager.tick();
        }
        
        const state = manager.getState();
        expect(state.active).toBeNull();
        expect(state.completed[tier1Research.id as string]).toBeDefined();
      }
    });
  });

  describe('Callbacks', () => {
    it('should trigger callback when research is started', () => {
      let eventType: ResearchEventType | null = null;
      let eventNodeId: string | null = null;
      
      manager.setOnEvent((type, node) => {
        eventType = type;
        eventNodeId = node.id as string;
      });
      
      const tier1Research = RESEARCH_NODES.find(
        (r) => r.tier === 1 && r.prerequisites.length === 0
      );
      
      if (tier1Research) {
        manager.addResearchPoints(tier1Research.cost.researchPoints + 100);
        manager.startResearch(
          tier1Research.id as string,
          tier1Research.cost.money + 1000,
          () => true
        );
        
        expect(eventType).toBe('started');
        expect(eventNodeId).toBe(tier1Research.id as string);
      }
    });
  });

  describe('State Persistence', () => {
    it('should load state correctly', () => {
      const initialState = createInitialResearchState();
      initialState.researchPoints = 500;
      
      const newManager = new ResearchManager(initialState);
      
      expect(newManager.getResearchPoints()).toBe(500);
    });

    it('should reset state', () => {
      manager.addResearchPoints(500);
      manager.reset();
      
      expect(manager.getResearchPoints()).toBe(0);
    });
  });
});

describe('Research Helper Functions', () => {
  describe('getResearchById', () => {
    it('should return research node by ID', () => {
      const firstNode = RESEARCH_NODES[0];
      const node = getResearchById(firstNode.id as string);
      expect(node).toBeDefined();
      expect(node?.id).toBe(firstNode.id);
    });

    it('should return undefined for unknown ID', () => {
      const node = getResearchById('unknown_id');
      expect(node).toBeUndefined();
    });
  });

  describe('getResearchByCategory', () => {
    it('should return all research in a category', () => {
      const categories: ResearchCategory[] = [
        'game_development',
        'monetization',
        'marketing',
        'infrastructure',
        'hr',
      ];
      
      categories.forEach((category) => {
        const researches = getResearchByCategory(category);
        expect(researches.length).toBeGreaterThan(0);
        researches.forEach((r) => {
          expect(r.category).toBe(category);
        });
      });
    });
  });

  describe('canStartResearch', () => {
    it('should allow starting tier 1 research with no prerequisites', () => {
      const state = createInitialResearchState();
      state.researchPoints = 10000;
      
      const tier1Research = RESEARCH_NODES.find(
        (r) => r.tier === 1 && r.prerequisites.length === 0
      );
      
      if (tier1Research) {
        const result = canStartResearch(state, tier1Research, 100000);
        expect(result.canStart).toBe(true);
      }
    });

    it('should block starting without prerequisites', () => {
      const state = createInitialResearchState();
      state.researchPoints = 10000;
      
      const tier2Research = RESEARCH_NODES.find(
        (r) => r.tier === 2 && r.prerequisites.length > 0
      );
      
      if (tier2Research) {
        const result = canStartResearch(state, tier2Research, 100000);
        expect(result.canStart).toBe(false);
      }
    });
  });

  describe('isResearchCompleted', () => {
    it('should return false for incomplete research', () => {
      const state = createInitialResearchState();
      const firstNode = RESEARCH_NODES[0];
      
      expect(isResearchCompleted(state, firstNode.id as string)).toBe(false);
    });

    it('should return true for completed research', () => {
      const state = createInitialResearchState();
      const firstNode = RESEARCH_NODES[0];
      state.completed[firstNode.id as string] = Date.now();
      
      expect(isResearchCompleted(state, firstNode.id as string)).toBe(true);
    });
  });
});

describe('Research DAG Validation', () => {
  it('should have valid prerequisite references', () => {
    const allIds = new Set(RESEARCH_NODES.map((r) => r.id as string));
    
    RESEARCH_NODES.forEach((node) => {
      node.prerequisites.forEach((prereq) => {
        expect(allIds.has(prereq as string)).toBe(true);
      });
    });
  });

  it('should have valid mutual exclusivity references', () => {
    const allIds = new Set(RESEARCH_NODES.map((r) => r.id as string));
    
    RESEARCH_NODES.forEach((node) => {
      if (node.mutuallyExclusiveWith) {
        node.mutuallyExclusiveWith.forEach((exId) => {
          expect(allIds.has(exId as string)).toBe(true);
        });
      }
    });
  });

  it('should have all required fields on research nodes', () => {
    RESEARCH_NODES.forEach((node) => {
      expect(node.id).toBeDefined();
      expect(node.name).toBeDefined();
      expect(node.description).toBeDefined();
      expect(node.category).toBeDefined();
      expect(node.tier).toBeGreaterThanOrEqual(1);
      expect(node.tier).toBeLessThanOrEqual(5);
      expect(node.cost).toBeDefined();
      expect(node.cost.money).toBeGreaterThanOrEqual(0);
      expect(node.cost.researchPoints).toBeGreaterThanOrEqual(0);
      expect(node.researchTime).toBeGreaterThan(0);
      expect(Array.isArray(node.prerequisites)).toBe(true);
      expect(Array.isArray(node.effects)).toBe(true);
    });
  });
});
