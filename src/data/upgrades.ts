/**
 * Upgrade definitions for the Flow → Upgrades system.
 * Upgrades reset each stage.
 */

export type UpgradeId = 'efficient_builds' | 'rapid_craft' | 'deep_buffers' | 'mana_affinity';

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  description: string;
  maxLevel: number;
}

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'efficient_builds',
    name: 'Efficient Builds',
    description: '-1 stone cost',
    maxLevel: 3,
  },
  {
    id: 'rapid_craft',
    name: 'Rapid Craft',
    description: '+15% craft speed',
    maxLevel: 3,
  },
  {
    id: 'deep_buffers',
    name: 'Deep Buffers',
    description: '+3 buffer capacity',
    maxLevel: 2,
  },
  {
    id: 'mana_affinity',
    name: 'Mana Affinity',
    description: '+1 mana per well',
    maxLevel: 2,
  },
];

/** Tracks which upgrades the player has purchased this stage. */
export class UpgradeState {
  private levels: Map<UpgradeId, number> = new Map();

  getLevel(id: UpgradeId): number {
    return this.levels.get(id) ?? 0;
  }

  canUpgrade(id: UpgradeId): boolean {
    const def = UPGRADES.find((u) => u.id === id);
    if (!def) return false;
    return this.getLevel(id) < def.maxLevel;
  }

  upgrade(id: UpgradeId): boolean {
    if (!this.canUpgrade(id)) return false;
    this.levels.set(id, this.getLevel(id) + 1);
    return true;
  }

  /** Get the craft time multiplier from rapid_craft levels. */
  getCraftTimeMultiplier(): number {
    const level = this.getLevel('rapid_craft');
    return level > 0 ? Math.pow(0.85, level) : 1;
  }

  /** Get the buffer bonus from deep_buffers levels. */
  getBufferBonus(): number {
    return this.getLevel('deep_buffers') * 3;
  }

  /** Get the stone cost reduction from efficient_builds levels. */
  getStoneCostReduction(): number {
    return this.getLevel('efficient_builds');
  }

  /** Get the mana production bonus from mana_affinity levels. */
  getManaProductionBonus(): number {
    return this.getLevel('mana_affinity');
  }

  reset(): void {
    this.levels.clear();
  }
}
