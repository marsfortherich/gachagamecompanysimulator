/**
 * Garage/Office Upgrade System
 * 
 * Provides visible upgrades for the office space that unlock
 * new capabilities, improve development speed, and enhance visuals.
 */

import { OfficeLevel } from './Company';

/**
 * Types of office upgrades
 */
export type OfficeUpgradeType =
  | 'workstations'        // More desks/computers
  | 'meeting_room'        // Better collaboration
  | 'server_room'         // Faster testing/deployment
  | 'break_room'          // Better morale
  | 'training_center'     // Faster skill growth
  | 'recording_studio'    // Better sound quality
  | 'art_studio'          // Better graphics
  | 'motion_capture'      // Premium animations
  | 'cafeteria'           // Employee satisfaction
  | 'gym'                 // Employee health/morale
  | 'rooftop_garden';     // Premium morale boost

/**
 * Configuration for each upgrade type
 */
export interface OfficeUpgradeConfig {
  readonly type: OfficeUpgradeType;
  readonly name: string;
  readonly description: string;
  readonly cost: number;
  readonly requiredOfficeLevel: OfficeLevel;
  readonly effects: OfficeUpgradeEffects;
  readonly icon: string;  // Icon identifier
}

/**
 * Effects that an upgrade provides
 */
export interface OfficeUpgradeEffects {
  readonly developmentSpeedBonus?: number;      // e.g., 0.1 = +10%
  readonly qualityBonus?: Partial<{
    graphics: number;
    gameplay: number;
    story: number;
    sound: number;
    polish: number;
  }>;
  readonly moraleBonus?: number;                // Daily morale gain
  readonly trainingSpeedBonus?: number;         // e.g., 0.2 = 20% faster training
  readonly maxEmployeesBonus?: number;          // Additional employee slots
  readonly maintenanceReduction?: number;       // e.g., 0.1 = 10% less monthly cost
  readonly hiringCostReduction?: number;        // e.g., 0.15 = 15% cheaper hiring
}

export const OFFICE_UPGRADES: Record<OfficeUpgradeType, OfficeUpgradeConfig> = {
  workstations: {
    type: 'workstations',
    name: 'Premium Workstations',
    description: 'High-end development workstations with dual monitors and ergonomic chairs.',
    cost: 15000,
    requiredOfficeLevel: 1,
    effects: {
      developmentSpeedBonus: 0.1,
      moraleBonus: 0.5,
    },
    icon: 'computer',
  },
  meeting_room: {
    type: 'meeting_room',
    name: 'Meeting Room',
    description: 'Dedicated space for team meetings and brainstorming sessions.',
    cost: 20000,
    requiredOfficeLevel: 1,
    effects: {
      developmentSpeedBonus: 0.05,
      qualityBonus: { gameplay: 2, story: 2 },
    },
    icon: 'users',
  },
  server_room: {
    type: 'server_room',
    name: 'Server Room',
    description: 'Dedicated servers for build automation and testing.',
    cost: 35000,
    requiredOfficeLevel: 2,
    effects: {
      developmentSpeedBonus: 0.15,
      qualityBonus: { polish: 3 },
    },
    icon: 'database',
  },
  break_room: {
    type: 'break_room',
    name: 'Break Room',
    description: 'Comfortable space for employees to relax and recharge.',
    cost: 12000,
    requiredOfficeLevel: 1,
    effects: {
      moraleBonus: 1.0,
    },
    icon: 'coffee',
  },
  training_center: {
    type: 'training_center',
    name: 'Training Center',
    description: 'Dedicated learning space with resources for skill development.',
    cost: 45000,
    requiredOfficeLevel: 2,
    effects: {
      trainingSpeedBonus: 0.25,
      developmentSpeedBonus: 0.05,
    },
    icon: 'academic',
  },
  recording_studio: {
    type: 'recording_studio',
    name: 'Recording Studio',
    description: 'Professional audio recording and mixing studio.',
    cost: 60000,
    requiredOfficeLevel: 3,
    effects: {
      qualityBonus: { sound: 10 },
    },
    icon: 'music',
  },
  art_studio: {
    type: 'art_studio',
    name: 'Art Studio',
    description: 'Dedicated space with professional art equipment and lighting.',
    cost: 55000,
    requiredOfficeLevel: 3,
    effects: {
      qualityBonus: { graphics: 8 },
      developmentSpeedBonus: 0.05,
    },
    icon: 'palette',
  },
  motion_capture: {
    type: 'motion_capture',
    name: 'Motion Capture Studio',
    description: 'State-of-the-art motion capture for premium animations.',
    cost: 150000,
    requiredOfficeLevel: 4,
    effects: {
      qualityBonus: { graphics: 15, polish: 5 },
    },
    icon: 'video',
  },
  cafeteria: {
    type: 'cafeteria',
    name: 'Cafeteria',
    description: 'On-site dining with quality food options.',
    cost: 40000,
    requiredOfficeLevel: 3,
    effects: {
      moraleBonus: 1.5,
      maxEmployeesBonus: 5,
    },
    icon: 'food',
  },
  gym: {
    type: 'gym',
    name: 'Fitness Center',
    description: 'Employee gym for health and wellness.',
    cost: 50000,
    requiredOfficeLevel: 4,
    effects: {
      moraleBonus: 2.0,
    },
    icon: 'activity',
  },
  rooftop_garden: {
    type: 'rooftop_garden',
    name: 'Rooftop Garden',
    description: 'Peaceful outdoor space for relaxation and fresh air.',
    cost: 80000,
    requiredOfficeLevel: 5,
    effects: {
      moraleBonus: 3.0,
      maintenanceReduction: 0.05,
    },
    icon: 'tree',
  },
};

/**
 * Office state with purchased upgrades
 */
export interface OfficeUpgrades {
  readonly purchasedUpgrades: Set<OfficeUpgradeType>;
}

/**
 * Create empty office upgrades
 */
export function createEmptyOfficeUpgrades(): OfficeUpgrades {
  return {
    purchasedUpgrades: new Set(),
  };
}

/**
 * Check if an upgrade can be purchased
 */
export function canPurchaseUpgrade(
  upgradeType: OfficeUpgradeType,
  currentLevel: OfficeLevel,
  currentFunds: number,
  purchasedUpgrades: Set<OfficeUpgradeType>
): { canPurchase: boolean; reason?: string } {
  const config = OFFICE_UPGRADES[upgradeType];
  
  if (purchasedUpgrades.has(upgradeType)) {
    return { canPurchase: false, reason: 'Already purchased' };
  }
  
  if (currentLevel < config.requiredOfficeLevel) {
    return { 
      canPurchase: false, 
      reason: `Requires office level ${config.requiredOfficeLevel}` 
    };
  }
  
  if (currentFunds < config.cost) {
    return { canPurchase: false, reason: 'Insufficient funds' };
  }
  
  return { canPurchase: true };
}

/**
 * Calculate combined effects from all purchased upgrades
 */
export function calculateCombinedUpgradeEffects(
  purchasedUpgrades: Set<OfficeUpgradeType>
): OfficeUpgradeEffects {
  // Use mutable object and cast at the end to satisfy readonly interface
  const combined = {
    developmentSpeedBonus: 0,
    qualityBonus: { graphics: 0, gameplay: 0, story: 0, sound: 0, polish: 0 },
    moraleBonus: 0,
    trainingSpeedBonus: 0,
    maxEmployeesBonus: 0,
    maintenanceReduction: 0,
    hiringCostReduction: 0,
  };
  
  for (const upgradeType of purchasedUpgrades) {
    const config = OFFICE_UPGRADES[upgradeType];
    const effects = config.effects;
    
    if (effects.developmentSpeedBonus) {
      combined.developmentSpeedBonus += effects.developmentSpeedBonus;
    }
    
    if (effects.qualityBonus) {
      for (const [key, value] of Object.entries(effects.qualityBonus)) {
        const k = key as keyof typeof combined.qualityBonus;
        if (value) {
          combined.qualityBonus[k] += value;
        }
      }
    }
    
    if (effects.moraleBonus) {
      combined.moraleBonus += effects.moraleBonus;
    }
    
    if (effects.trainingSpeedBonus) {
      combined.trainingSpeedBonus += effects.trainingSpeedBonus;
    }
    
    if (effects.maxEmployeesBonus) {
      combined.maxEmployeesBonus += effects.maxEmployeesBonus;
    }
    
    if (effects.maintenanceReduction) {
      combined.maintenanceReduction += effects.maintenanceReduction;
    }
    
    if (effects.hiringCostReduction) {
      combined.hiringCostReduction += effects.hiringCostReduction;
    }
  }
  
  return combined as OfficeUpgradeEffects;
}

/**
 * Get available upgrades for current office level
 */
export function getAvailableUpgrades(
  currentLevel: OfficeLevel,
  purchasedUpgrades: Set<OfficeUpgradeType>
): OfficeUpgradeConfig[] {
  return Object.values(OFFICE_UPGRADES).filter(
    upgrade => 
      upgrade.requiredOfficeLevel <= currentLevel &&
      !purchasedUpgrades.has(upgrade.type)
  );
}

/**
 * Get purchased upgrade details
 */
export function getPurchasedUpgradeDetails(
  purchasedUpgrades: Set<OfficeUpgradeType>
): OfficeUpgradeConfig[] {
  return Array.from(purchasedUpgrades).map(type => OFFICE_UPGRADES[type]);
}
