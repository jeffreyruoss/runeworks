/**
 * Upgrade definitions for the Flow → Upgrades system.
 * Upgrades reset each stage.
 */

export type UpgradeId =
  | 'efficient_builds'
  | 'rapid_craft'
  | 'deep_buffers'
  | 'mana_affinity'
  | 'gold_interest'
  | 'bulk_gather'
  | 'quarry_yield'
  | 'runic_insight'
  | 'traders_cut';

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  description: string;
  maxLevel: number;
  cost: number;
}

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'efficient_builds',
    name: 'Efficient Builds',
    description: '-1 stone cost',
    maxLevel: 3,
    cost: 1,
  },
  {
    id: 'rapid_craft',
    name: 'Rapid Craft',
    description: '+15% craft speed',
    maxLevel: 3,
    cost: 2,
  },
  {
    id: 'deep_buffers',
    name: 'Deep Buffers',
    description: '+3 buffer capacity',
    maxLevel: 2,
    cost: 2,
  },
  {
    id: 'mana_affinity',
    name: 'Mana Affinity',
    description: '+1 mana per well',
    maxLevel: 2,
    cost: 2,
  },
  {
    id: 'gold_interest',
    name: 'Gold Interest',
    description: '+5% interest rate',
    maxLevel: 3,
    cost: 3,
  },
  {
    id: 'bulk_gather',
    name: 'Bulk Gather',
    description: '+1 per gather action',
    maxLevel: 2,
    cost: 1,
  },
  {
    id: 'quarry_yield',
    name: 'Quarry Yield',
    description: '+1 ore per cycle',
    maxLevel: 2,
    cost: 2,
  },
  {
    id: 'runic_insight',
    name: 'Runic Insight',
    description: '+20% research speed',
    maxLevel: 3,
    cost: 3,
  },
  {
    id: 'traders_cut',
    name: "Trader's Cut",
    description: '-15% trade cost',
    maxLevel: 3,
    cost: 1,
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

  private getMultiplier(id: UpgradeId, base: number): number {
    const level = this.getLevel(id);
    return level > 0 ? Math.pow(base, level) : 1;
  }

  getCraftTimeMultiplier(): number {
    return this.getMultiplier('rapid_craft', 0.85);
  }

  getBufferBonus(): number {
    return this.getLevel('deep_buffers') * 3;
  }

  getStoneCostReduction(): number {
    return this.getLevel('efficient_builds');
  }

  getManaProductionBonus(): number {
    return this.getLevel('mana_affinity');
  }

  getGoldInterestBonus(): number {
    return this.getLevel('gold_interest') * 5;
  }

  getBulkGatherBonus(): number {
    return this.getLevel('bulk_gather');
  }

  getQuarryYieldBonus(): number {
    return this.getLevel('quarry_yield');
  }

  getResearchSpeedMultiplier(): number {
    return this.getMultiplier('runic_insight', 0.8);
  }

  getTradeCostMultiplier(): number {
    return this.getMultiplier('traders_cut', 0.85);
  }

  reset(): void {
    this.levels.clear();
  }
}
