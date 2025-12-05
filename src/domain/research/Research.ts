/**
 * Research & Technology Tree System - Prompt 8.1
 * 
 * Data-driven research system with DAG structure, categories, and prerequisites.
 */

// =============================================================================
// Types
// =============================================================================

export type ResearchId = string & { readonly brand: unique symbol };

export type ResearchCategory =
  | 'game_development'
  | 'monetization'
  | 'marketing'
  | 'infrastructure'
  | 'hr';

export type ResearchTier = 1 | 2 | 3 | 4 | 5;

export interface ResearchCost {
  money: number;
  researchPoints: number;
}

export interface ResearchEffect {
  type: ResearchEffectType;
  value: number;
  isPercentage: boolean;
}

export type ResearchEffectType =
  // Game Development
  | 'devSpeedBonus'
  | 'baseQualityBonus'
  | 'bugReductionBonus'
  | 'featureValueBonus'
  // Monetization
  | 'conversionRateBonus'
  | 'arppuBonus'
  | 'retentionBonus'
  | 'ethicalMonetizationUnlock'
  | 'predatoryMonetizationUnlock'
  // Marketing
  | 'playerAcquisitionBonus'
  | 'viralCoefficientBonus'
  | 'brandAwarenessBonus'
  | 'adEfficiencyBonus'
  // Infrastructure
  | 'serverCostReduction'
  | 'scalingBonus'
  | 'uptimeBonus'
  | 'maxPlayersBonus'
  // HR
  | 'moraleDecayReduction'
  | 'skillGrowthBonus'
  | 'salaryEfficiencyBonus'
  | 'hiringSpeedBonus'
  | 'trainingEfficiencyBonus';

export interface ResearchNode {
  id: ResearchId;
  name: string;
  description: string;
  icon: string;
  category: ResearchCategory;
  tier: ResearchTier;
  cost: ResearchCost;
  researchTime: number; // In-game days
  prerequisites: ResearchId[];
  mutuallyExclusiveWith?: ResearchId[];
  effects: ResearchEffect[];
  flavorText?: string;
  order: number; // Display order within category
}

export interface ResearchProgress {
  nodeId: ResearchId;
  startedAt: number; // Timestamp
  daysRemaining: number;
  totalDays: number;
}

export interface ResearchState {
  completed: Record<string, number>; // nodeId -> timestamp
  active: ResearchProgress | null;
  researchPoints: number;
  totalResearchCompleted: number;
  categoryProgress: Record<ResearchCategory, number>;
}

// =============================================================================
// Category Configuration
// =============================================================================

export interface ResearchCategoryConfig {
  id: ResearchCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const RESEARCH_CATEGORIES: Record<ResearchCategory, ResearchCategoryConfig> = {
  game_development: {
    id: 'game_development',
    name: 'Game Development',
    description: 'Improve development speed and game quality',
    icon: '🎮',
    color: 'blue',
  },
  monetization: {
    id: 'monetization',
    name: 'Monetization',
    description: 'Enhance revenue generation and player spending',
    icon: '💰',
    color: 'green',
  },
  marketing: {
    id: 'marketing',
    name: 'Marketing',
    description: 'Boost player acquisition and brand awareness',
    icon: '📢',
    color: 'purple',
  },
  infrastructure: {
    id: 'infrastructure',
    name: 'Infrastructure',
    description: 'Reduce costs and improve scaling',
    icon: '🖥️',
    color: 'gray',
  },
  hr: {
    id: 'hr',
    name: 'Human Resources',
    description: 'Improve employee management and growth',
    icon: '👥',
    color: 'orange',
  },
};

// =============================================================================
// Research Node Definitions
// =============================================================================

function createResearchId(id: string): ResearchId {
  return id as ResearchId;
}

export const RESEARCH_NODES: ResearchNode[] = [
  // ===========================================================================
  // GAME DEVELOPMENT - Tier 1
  // ===========================================================================
  {
    id: createResearchId('gd_agile_basics'),
    name: 'Agile Basics',
    description: 'Introduce basic agile methodologies to speed up development',
    icon: '🏃',
    category: 'game_development',
    tier: 1,
    cost: { money: 5000, researchPoints: 50 },
    researchTime: 5,
    prerequisites: [],
    effects: [{ type: 'devSpeedBonus', value: 5, isPercentage: true }],
    flavorText: 'Stand-ups, sprints, and sticky notes everywhere',
    order: 1,
  },
  {
    id: createResearchId('gd_code_review'),
    name: 'Code Review Process',
    description: 'Implement code reviews to catch bugs early',
    icon: '🔍',
    category: 'game_development',
    tier: 1,
    cost: { money: 4000, researchPoints: 40 },
    researchTime: 4,
    prerequisites: [],
    effects: [{ type: 'bugReductionBonus', value: 10, isPercentage: true }],
    order: 2,
  },
  // Game Development - Tier 2
  {
    id: createResearchId('gd_ci_cd'),
    name: 'CI/CD Pipeline',
    description: 'Automate build and deployment processes',
    icon: '🔄',
    category: 'game_development',
    tier: 2,
    cost: { money: 15000, researchPoints: 100 },
    researchTime: 8,
    prerequisites: [createResearchId('gd_agile_basics')],
    effects: [
      { type: 'devSpeedBonus', value: 10, isPercentage: true },
      { type: 'bugReductionBonus', value: 5, isPercentage: true },
    ],
    order: 3,
  },
  {
    id: createResearchId('gd_quality_assurance'),
    name: 'QA Department',
    description: 'Establish dedicated quality assurance team',
    icon: '✅',
    category: 'game_development',
    tier: 2,
    cost: { money: 20000, researchPoints: 120 },
    researchTime: 10,
    prerequisites: [createResearchId('gd_code_review')],
    effects: [
      { type: 'baseQualityBonus', value: 10, isPercentage: true },
      { type: 'bugReductionBonus', value: 15, isPercentage: true },
    ],
    order: 4,
  },
  // Game Development - Tier 3
  {
    id: createResearchId('gd_engine_optimization'),
    name: 'Engine Optimization',
    description: 'Optimize game engine for faster development',
    icon: '⚙️',
    category: 'game_development',
    tier: 3,
    cost: { money: 50000, researchPoints: 250 },
    researchTime: 15,
    prerequisites: [createResearchId('gd_ci_cd')],
    effects: [
      { type: 'devSpeedBonus', value: 15, isPercentage: true },
      { type: 'featureValueBonus', value: 10, isPercentage: true },
    ],
    order: 5,
  },
  {
    id: createResearchId('gd_automated_testing'),
    name: 'Automated Testing',
    description: 'Implement comprehensive automated test suites',
    icon: '🤖',
    category: 'game_development',
    tier: 3,
    cost: { money: 40000, researchPoints: 200 },
    researchTime: 12,
    prerequisites: [createResearchId('gd_quality_assurance'), createResearchId('gd_ci_cd')],
    effects: [
      { type: 'bugReductionBonus', value: 25, isPercentage: true },
      { type: 'devSpeedBonus', value: 5, isPercentage: true },
    ],
    order: 6,
  },
  // Game Development - Tier 4
  {
    id: createResearchId('gd_ai_assisted_dev'),
    name: 'AI-Assisted Development',
    description: 'Use AI tools to accelerate coding and content creation',
    icon: '🧠',
    category: 'game_development',
    tier: 4,
    cost: { money: 100000, researchPoints: 500 },
    researchTime: 20,
    prerequisites: [createResearchId('gd_engine_optimization'), createResearchId('gd_automated_testing')],
    effects: [
      { type: 'devSpeedBonus', value: 25, isPercentage: true },
      { type: 'baseQualityBonus', value: 15, isPercentage: true },
    ],
    order: 7,
  },

  // ===========================================================================
  // MONETIZATION - Tier 1
  // ===========================================================================
  {
    id: createResearchId('mon_analytics'),
    name: 'Player Analytics',
    description: 'Track player behavior to optimize monetization',
    icon: '📊',
    category: 'monetization',
    tier: 1,
    cost: { money: 6000, researchPoints: 60 },
    researchTime: 5,
    prerequisites: [],
    effects: [{ type: 'conversionRateBonus', value: 5, isPercentage: true }],
    order: 1,
  },
  {
    id: createResearchId('mon_ab_testing'),
    name: 'A/B Testing',
    description: 'Test monetization strategies scientifically',
    icon: '🔬',
    category: 'monetization',
    tier: 1,
    cost: { money: 5000, researchPoints: 50 },
    researchTime: 4,
    prerequisites: [],
    effects: [{ type: 'arppuBonus', value: 5, isPercentage: true }],
    order: 2,
  },
  // Monetization - Tier 2 (Ethical Path)
  {
    id: createResearchId('mon_fair_pricing'),
    name: 'Fair Pricing Model',
    description: 'Develop player-friendly pricing strategies',
    icon: '⚖️',
    category: 'monetization',
    tier: 2,
    cost: { money: 15000, researchPoints: 100 },
    researchTime: 8,
    prerequisites: [createResearchId('mon_analytics')],
    mutuallyExclusiveWith: [createResearchId('mon_whale_hunting')],
    effects: [
      { type: 'retentionBonus', value: 15, isPercentage: true },
      { type: 'ethicalMonetizationUnlock', value: 1, isPercentage: false },
    ],
    flavorText: 'Happy players spend more over time',
    order: 3,
  },
  // Monetization - Tier 2 (Predatory Path)
  {
    id: createResearchId('mon_whale_hunting'),
    name: 'Whale Optimization',
    description: 'Target high-spending players aggressively',
    icon: '🐋',
    category: 'monetization',
    tier: 2,
    cost: { money: 12000, researchPoints: 80 },
    researchTime: 6,
    prerequisites: [createResearchId('mon_analytics')],
    mutuallyExclusiveWith: [createResearchId('mon_fair_pricing')],
    effects: [
      { type: 'arppuBonus', value: 30, isPercentage: true },
      { type: 'retentionBonus', value: -10, isPercentage: true },
      { type: 'predatoryMonetizationUnlock', value: 1, isPercentage: false },
    ],
    flavorText: 'Ethically questionable but profitable',
    order: 4,
  },
  // Monetization - Tier 3
  {
    id: createResearchId('mon_battle_pass'),
    name: 'Battle Pass System',
    description: 'Implement seasonal content monetization',
    icon: '🎫',
    category: 'monetization',
    tier: 3,
    cost: { money: 30000, researchPoints: 180 },
    researchTime: 12,
    prerequisites: [createResearchId('mon_ab_testing')],
    effects: [
      { type: 'conversionRateBonus', value: 15, isPercentage: true },
      { type: 'retentionBonus', value: 10, isPercentage: true },
    ],
    order: 5,
  },
  {
    id: createResearchId('mon_subscription'),
    name: 'Subscription Model',
    description: 'Add recurring subscription options',
    icon: '📅',
    category: 'monetization',
    tier: 3,
    cost: { money: 35000, researchPoints: 200 },
    researchTime: 14,
    prerequisites: [createResearchId('mon_fair_pricing')],
    effects: [
      { type: 'conversionRateBonus', value: 10, isPercentage: true },
      { type: 'retentionBonus', value: 20, isPercentage: true },
    ],
    order: 6,
  },

  // ===========================================================================
  // MARKETING - Tier 1
  // ===========================================================================
  {
    id: createResearchId('mkt_social_media'),
    name: 'Social Media Presence',
    description: 'Build brand awareness through social platforms',
    icon: '📱',
    category: 'marketing',
    tier: 1,
    cost: { money: 3000, researchPoints: 30 },
    researchTime: 3,
    prerequisites: [],
    effects: [{ type: 'brandAwarenessBonus', value: 10, isPercentage: true }],
    order: 1,
  },
  {
    id: createResearchId('mkt_influencer'),
    name: 'Influencer Partnerships',
    description: 'Partner with content creators for promotion',
    icon: '🌟',
    category: 'marketing',
    tier: 1,
    cost: { money: 8000, researchPoints: 50 },
    researchTime: 5,
    prerequisites: [],
    effects: [{ type: 'playerAcquisitionBonus', value: 15, isPercentage: true }],
    order: 2,
  },
  // Marketing - Tier 2
  {
    id: createResearchId('mkt_targeted_ads'),
    name: 'Targeted Advertising',
    description: 'Use data-driven ad targeting',
    icon: '🎯',
    category: 'marketing',
    tier: 2,
    cost: { money: 20000, researchPoints: 120 },
    researchTime: 8,
    prerequisites: [createResearchId('mkt_social_media')],
    effects: [
      { type: 'adEfficiencyBonus', value: 25, isPercentage: true },
      { type: 'playerAcquisitionBonus', value: 10, isPercentage: true },
    ],
    order: 3,
  },
  {
    id: createResearchId('mkt_community'),
    name: 'Community Building',
    description: 'Develop dedicated player community',
    icon: '🏠',
    category: 'marketing',
    tier: 2,
    cost: { money: 15000, researchPoints: 100 },
    researchTime: 10,
    prerequisites: [createResearchId('mkt_social_media'), createResearchId('mkt_influencer')],
    effects: [
      { type: 'viralCoefficientBonus', value: 20, isPercentage: true },
      { type: 'retentionBonus', value: 10, isPercentage: true },
    ],
    order: 4,
  },
  // Marketing - Tier 3
  {
    id: createResearchId('mkt_viral_mechanics'),
    name: 'Viral Game Mechanics',
    description: 'Design features that encourage sharing',
    icon: '🦠',
    category: 'marketing',
    tier: 3,
    cost: { money: 40000, researchPoints: 220 },
    researchTime: 14,
    prerequisites: [createResearchId('mkt_community')],
    effects: [
      { type: 'viralCoefficientBonus', value: 40, isPercentage: true },
      { type: 'playerAcquisitionBonus', value: 20, isPercentage: true },
    ],
    order: 5,
  },

  // ===========================================================================
  // INFRASTRUCTURE - Tier 1
  // ===========================================================================
  {
    id: createResearchId('inf_cloud_basics'),
    name: 'Cloud Infrastructure',
    description: 'Migrate to cloud-based hosting',
    icon: '☁️',
    category: 'infrastructure',
    tier: 1,
    cost: { money: 10000, researchPoints: 60 },
    researchTime: 6,
    prerequisites: [],
    effects: [{ type: 'serverCostReduction', value: 10, isPercentage: true }],
    order: 1,
  },
  {
    id: createResearchId('inf_monitoring'),
    name: 'System Monitoring',
    description: 'Implement comprehensive monitoring',
    icon: '📈',
    category: 'infrastructure',
    tier: 1,
    cost: { money: 8000, researchPoints: 50 },
    researchTime: 5,
    prerequisites: [],
    effects: [{ type: 'uptimeBonus', value: 5, isPercentage: true }],
    order: 2,
  },
  // Infrastructure - Tier 2
  {
    id: createResearchId('inf_auto_scaling'),
    name: 'Auto-Scaling',
    description: 'Automatically scale infrastructure with demand',
    icon: '📊',
    category: 'infrastructure',
    tier: 2,
    cost: { money: 25000, researchPoints: 150 },
    researchTime: 10,
    prerequisites: [createResearchId('inf_cloud_basics'), createResearchId('inf_monitoring')],
    effects: [
      { type: 'scalingBonus', value: 30, isPercentage: true },
      { type: 'serverCostReduction', value: 15, isPercentage: true },
    ],
    order: 3,
  },
  // Infrastructure - Tier 3
  {
    id: createResearchId('inf_global_cdn'),
    name: 'Global CDN',
    description: 'Deploy content delivery network worldwide',
    icon: '🌐',
    category: 'infrastructure',
    tier: 3,
    cost: { money: 60000, researchPoints: 300 },
    researchTime: 15,
    prerequisites: [createResearchId('inf_auto_scaling')],
    effects: [
      { type: 'maxPlayersBonus', value: 50, isPercentage: true },
      { type: 'uptimeBonus', value: 15, isPercentage: true },
    ],
    order: 4,
  },
  {
    id: createResearchId('inf_edge_computing'),
    name: 'Edge Computing',
    description: 'Process data closer to players',
    icon: '⚡',
    category: 'infrastructure',
    tier: 3,
    cost: { money: 75000, researchPoints: 350 },
    researchTime: 18,
    prerequisites: [createResearchId('inf_global_cdn')],
    effects: [
      { type: 'serverCostReduction', value: 25, isPercentage: true },
      { type: 'scalingBonus', value: 20, isPercentage: true },
    ],
    order: 5,
  },

  // ===========================================================================
  // HR - Tier 1
  // ===========================================================================
  {
    id: createResearchId('hr_onboarding'),
    name: 'Improved Onboarding',
    description: 'Streamline new employee integration',
    icon: '🎓',
    category: 'hr',
    tier: 1,
    cost: { money: 4000, researchPoints: 40 },
    researchTime: 4,
    prerequisites: [],
    effects: [{ type: 'hiringSpeedBonus', value: 20, isPercentage: true }],
    order: 1,
  },
  {
    id: createResearchId('hr_culture'),
    name: 'Company Culture',
    description: 'Develop positive workplace culture',
    icon: '❤️',
    category: 'hr',
    tier: 1,
    cost: { money: 5000, researchPoints: 50 },
    researchTime: 5,
    prerequisites: [],
    effects: [{ type: 'moraleDecayReduction', value: 15, isPercentage: true }],
    order: 2,
  },
  // HR - Tier 2
  {
    id: createResearchId('hr_training'),
    name: 'Training Programs',
    description: 'Establish continuous learning programs',
    icon: '📚',
    category: 'hr',
    tier: 2,
    cost: { money: 15000, researchPoints: 100 },
    researchTime: 8,
    prerequisites: [createResearchId('hr_onboarding')],
    effects: [
      { type: 'skillGrowthBonus', value: 25, isPercentage: true },
      { type: 'trainingEfficiencyBonus', value: 20, isPercentage: true },
    ],
    order: 3,
  },
  {
    id: createResearchId('hr_benefits'),
    name: 'Benefits Package',
    description: 'Competitive benefits to retain talent',
    icon: '🎁',
    category: 'hr',
    tier: 2,
    cost: { money: 20000, researchPoints: 120 },
    researchTime: 10,
    prerequisites: [createResearchId('hr_culture')],
    effects: [
      { type: 'moraleDecayReduction', value: 25, isPercentage: true },
      { type: 'salaryEfficiencyBonus', value: 10, isPercentage: true },
    ],
    order: 4,
  },
  // HR - Tier 3
  {
    id: createResearchId('hr_mentorship'),
    name: 'Mentorship Program',
    description: 'Pair senior and junior employees',
    icon: '🤝',
    category: 'hr',
    tier: 3,
    cost: { money: 30000, researchPoints: 180 },
    researchTime: 12,
    prerequisites: [createResearchId('hr_training'), createResearchId('hr_benefits')],
    effects: [
      { type: 'skillGrowthBonus', value: 40, isPercentage: true },
      { type: 'moraleDecayReduction', value: 15, isPercentage: true },
    ],
    order: 5,
  },
  {
    id: createResearchId('hr_remote_work'),
    name: 'Remote Work Infrastructure',
    description: 'Enable efficient remote work',
    icon: '🏠',
    category: 'hr',
    tier: 3,
    cost: { money: 25000, researchPoints: 150 },
    researchTime: 10,
    prerequisites: [createResearchId('hr_culture')],
    effects: [
      { type: 'salaryEfficiencyBonus', value: 20, isPercentage: true },
      { type: 'hiringSpeedBonus', value: 30, isPercentage: true },
    ],
    order: 6,
  },
];

// =============================================================================
// Helper Functions
// =============================================================================

export function createInitialResearchState(): ResearchState {
  const categoryProgress: Record<ResearchCategory, number> = {
    game_development: 0,
    monetization: 0,
    marketing: 0,
    infrastructure: 0,
    hr: 0,
  };

  return {
    completed: {},
    active: null,
    researchPoints: 0,
    totalResearchCompleted: 0,
    categoryProgress,
  };
}

export function getResearchById(id: string): ResearchNode | undefined {
  return RESEARCH_NODES.find(n => n.id === id);
}

export function getResearchByCategory(category: ResearchCategory): ResearchNode[] {
  return RESEARCH_NODES.filter(n => n.category === category).sort((a, b) => a.order - b.order);
}

export function getResearchByTier(tier: ResearchTier): ResearchNode[] {
  return RESEARCH_NODES.filter(n => n.tier === tier);
}

export function isResearchCompleted(state: ResearchState, nodeId: string): boolean {
  return nodeId in state.completed;
}

export function arePrerequisitesMet(state: ResearchState, node: ResearchNode): boolean {
  return node.prerequisites.every(prereq => isResearchCompleted(state, prereq as string));
}

export function isMutuallyExclusiveBlocked(state: ResearchState, node: ResearchNode): boolean {
  if (!node.mutuallyExclusiveWith) return false;
  return node.mutuallyExclusiveWith.some(exclusiveId => 
    isResearchCompleted(state, exclusiveId as string)
  );
}

export function canStartResearch(
  state: ResearchState,
  node: ResearchNode,
  currentMoney: number
): { canStart: boolean; reason?: string } {
  // Already completed?
  if (isResearchCompleted(state, node.id as string)) {
    return { canStart: false, reason: 'Already researched' };
  }

  // Already researching something?
  if (state.active !== null) {
    return { canStart: false, reason: 'Research already in progress' };
  }

  // Prerequisites met?
  if (!arePrerequisitesMet(state, node)) {
    return { canStart: false, reason: 'Prerequisites not met' };
  }

  // Mutually exclusive blocked?
  if (isMutuallyExclusiveBlocked(state, node)) {
    return { canStart: false, reason: 'Blocked by mutually exclusive research' };
  }

  // Enough money?
  if (currentMoney < node.cost.money) {
    return { canStart: false, reason: `Need $${node.cost.money}` };
  }

  // Enough research points?
  if (state.researchPoints < node.cost.researchPoints) {
    return { canStart: false, reason: `Need ${node.cost.researchPoints} research points` };
  }

  return { canStart: true };
}

export function getAvailableResearch(state: ResearchState): ResearchNode[] {
  return RESEARCH_NODES.filter(node => {
    if (isResearchCompleted(state, node.id as string)) return false;
    if (!arePrerequisitesMet(state, node)) return false;
    if (isMutuallyExclusiveBlocked(state, node)) return false;
    return true;
  });
}

export function calculateTotalEffect(
  state: ResearchState,
  effectType: ResearchEffectType
): number {
  let total = 0;

  for (const nodeId of Object.keys(state.completed)) {
    const node = getResearchById(nodeId);
    if (node) {
      for (const effect of node.effects) {
        if (effect.type === effectType) {
          total += effect.value;
        }
      }
    }
  }

  return total;
}

export function getCategoryCompletion(
  state: ResearchState,
  category: ResearchCategory
): { completed: number; total: number; percentage: number } {
  const categoryNodes = getResearchByCategory(category);
  const completedCount = categoryNodes.filter(n => 
    isResearchCompleted(state, n.id as string)
  ).length;

  return {
    completed: completedCount,
    total: categoryNodes.length,
    percentage: categoryNodes.length > 0 ? (completedCount / categoryNodes.length) * 100 : 0,
  };
}

export function getTechTreeGraph(): { nodes: ResearchNode[]; edges: { from: string; to: string }[] } {
  const edges: { from: string; to: string }[] = [];

  for (const node of RESEARCH_NODES) {
    for (const prereq of node.prerequisites) {
      edges.push({ from: prereq as string, to: node.id as string });
    }
  }

  return { nodes: RESEARCH_NODES, edges };
}
