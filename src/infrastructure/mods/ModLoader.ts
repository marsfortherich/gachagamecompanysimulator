/**
 * Mod Loader - Prompt 11.2
 * 
 * Loads, validates, and applies mod packs to the game state.
 */

import {
  ModPack,
  LoadedMod,
  ModBalanceOverride,
  ModEventDefinition,
  ModValidationResult,
} from './ModTypes';
import { validateModPack } from './ModValidator';

// =============================================================================
// Internal Mutable State Type
// =============================================================================

interface MutableModLoaderState {
  mods: Map<string, LoadedMod>;
  loadOrder: string[];
  conflicts: Array<{ modA: string; modB: string; reason: string }>;
}

// =============================================================================
// Mod Loader Class
// =============================================================================

export class ModLoader {
  private state: MutableModLoaderState = {
    mods: new Map(),
    loadOrder: [],
    conflicts: [],
  };

  /**
   * Load a mod pack from JSON
   */
  loadFromJson(json: string): { success: boolean; result?: ModValidationResult; mod?: LoadedMod } {
    try {
      const pack = JSON.parse(json) as ModPack;
      return this.loadMod(pack);
    } catch (error) {
      return {
        success: false,
        result: {
          valid: false,
          errors: [{ path: 'root', message: `Invalid JSON: ${error}`, severity: 'error' }],
          warnings: [],
        },
      };
    }
  }

  /**
   * Load and validate a mod pack
   */
  loadMod(pack: ModPack): { success: boolean; result: ModValidationResult; mod?: LoadedMod } {
    // Validate the pack
    const result = validateModPack(pack);

    if (!result.valid) {
      return { success: false, result };
    }

    // Check for conflicts with loaded mods
    const conflicts = this.checkConflicts(pack);
    if (conflicts.length > 0) {
      this.state.conflicts.push(...conflicts);
      // Conflicts are warnings, not errors - mod can still load
    }

    // Check dependencies
    const missingDeps = this.checkDependencies(pack);
    if (missingDeps.length > 0) {
      return {
        success: false,
        result: {
          valid: false,
          errors: missingDeps.map(dep => ({
            path: 'manifest.dependencies',
            message: `Missing required dependency: ${dep}`,
            severity: 'error' as const,
          })),
          warnings: result.warnings,
        },
      };
    }

    // Create loaded mod
    const loadedMod: LoadedMod = {
      pack,
      enabled: true,
      loadOrder: this.state.loadOrder.length,
      loadedAt: Date.now(),
    };

    // Add to state
    this.state.mods.set(pack.manifest.id, loadedMod);
    this.state.loadOrder.push(pack.manifest.id);

    return { success: true, result, mod: loadedMod };
  }

  /**
   * Unload a mod
   */
  unloadMod(modId: string): boolean {
    if (!this.state.mods.has(modId)) {
      return false;
    }

    // Check if other mods depend on this one
    const dependents = this.findDependents(modId);
    if (dependents.length > 0) {
      console.warn(`Cannot unload ${modId}: required by ${dependents.join(', ')}`);
      return false;
    }

    this.state.mods.delete(modId);
    this.state.loadOrder = this.state.loadOrder.filter(id => id !== modId);

    // Remove related conflicts
    this.state.conflicts = this.state.conflicts.filter(
      c => c.modA !== modId && c.modB !== modId
    );

    return true;
  }

  /**
   * Toggle mod enabled state
   */
  setModEnabled(modId: string, enabled: boolean): boolean {
    const mod = this.state.mods.get(modId);
    if (!mod) return false;

    this.state.mods.set(modId, { ...mod, enabled });
    return true;
  }

  /**
   * Get all loaded mods
   */
  getLoadedMods(): readonly LoadedMod[] {
    return this.state.loadOrder
      .map(id => this.state.mods.get(id))
      .filter((mod): mod is LoadedMod => mod !== undefined);
  }

  /**
   * Get enabled mods in load order
   */
  getEnabledMods(): readonly LoadedMod[] {
    return this.getLoadedMods().filter(mod => mod.enabled);
  }

  /**
   * Get all events from enabled mods
   */
  getModEvents(): ModEventDefinition[] {
    const events: ModEventDefinition[] = [];
    for (const mod of this.getEnabledMods()) {
      if (mod.pack.events) {
        events.push(...mod.pack.events);
      }
    }
    return events;
  }

  /**
   * Get merged balance overrides from enabled mods
   * Later mods override earlier ones
   */
  getBalanceOverrides(): ModBalanceOverride[] {
    const overrides: ModBalanceOverride[] = [];
    for (const mod of this.getEnabledMods()) {
      if (mod.pack.balanceOverrides) {
        overrides.push(...mod.pack.balanceOverrides);
      }
    }
    return overrides;
  }

  /**
   * Apply balance overrides to a config object
   */
  applyBalanceOverrides<T extends object>(config: T, overrides: ModBalanceOverride[]): T {
    const result = { ...config } as Record<string, unknown>;

    for (const override of overrides) {
      const parts = override.path.split('.');
      let current: Record<string, unknown> = result;

      // Navigate to parent
      for (let i = 0; i < parts.length - 1; i++) {
        if (typeof current[parts[i]] === 'object' && current[parts[i]] !== null) {
          current[parts[i]] = { ...(current[parts[i]] as object) };
          current = current[parts[i]] as Record<string, unknown>;
        } else {
          // Path doesn't exist, skip
          current = {};
          break;
        }
      }

      const lastKey = parts[parts.length - 1];
      if (lastKey in current) {
        const currentValue = current[lastKey];
        
        if (typeof currentValue === 'number' && typeof override.value === 'number') {
          switch (override.operation) {
            case 'add':
              current[lastKey] = currentValue + override.value;
              break;
            case 'multiply':
              current[lastKey] = currentValue * override.value;
              break;
            default: // 'set' or undefined
              current[lastKey] = override.value;
          }
        } else {
          current[lastKey] = override.value;
        }
      }
    }

    return result as T;
  }

  /**
   * Get current conflicts
   */
  getConflicts(): readonly { modA: string; modB: string; reason: string }[] {
    return [...this.state.conflicts];
  }

  /**
   * Export state for persistence
   */
  exportState(): string {
    return JSON.stringify({
      loadOrder: this.state.loadOrder,
      enabledStates: Object.fromEntries(
        Array.from(this.state.mods.entries()).map(([id, mod]) => [id, mod.enabled])
      ),
    });
  }

  /**
   * Reorder mods
   */
  reorderMods(newOrder: string[]): boolean {
    // Verify all mods exist
    if (!newOrder.every(id => this.state.mods.has(id))) {
      return false;
    }
    if (newOrder.length !== this.state.loadOrder.length) {
      return false;
    }

    this.state.loadOrder = [...newOrder];

    // Update load order indices
    newOrder.forEach((id, index) => {
      const mod = this.state.mods.get(id)!;
      this.state.mods.set(id, { ...mod, loadOrder: index });
    });

    return true;
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private checkConflicts(pack: ModPack): Array<{ modA: string; modB: string; reason: string }> {
    const conflicts: Array<{ modA: string; modB: string; reason: string }> = [];

    // Check declared conflicts
    if (pack.manifest.conflicts) {
      for (const conflictId of pack.manifest.conflicts) {
        if (this.state.mods.has(conflictId)) {
          conflicts.push({
            modA: pack.manifest.id,
            modB: conflictId,
            reason: 'Declared conflict in manifest',
          });
        }
      }
    }

    // Check if any loaded mod declares conflict with this one
    for (const [modId, loadedMod] of this.state.mods) {
      if (loadedMod.pack.manifest.conflicts?.includes(pack.manifest.id)) {
        conflicts.push({
          modA: modId,
          modB: pack.manifest.id,
          reason: `${modId} declares conflict with ${pack.manifest.id}`,
        });
      }
    }

    return conflicts;
  }

  private checkDependencies(pack: ModPack): string[] {
    if (!pack.manifest.dependencies) {
      return [];
    }

    return pack.manifest.dependencies.filter(dep => !this.state.mods.has(dep));
  }

  private findDependents(modId: string): string[] {
    const dependents: string[] = [];
    for (const [id, mod] of this.state.mods) {
      if (mod.pack.manifest.dependencies?.includes(modId)) {
        dependents.push(id);
      }
    }
    return dependents;
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let instance: ModLoader | null = null;

export function getModLoader(): ModLoader {
  if (!instance) {
    instance = new ModLoader();
  }
  return instance;
}

export function resetModLoader(): void {
  instance = null;
}
