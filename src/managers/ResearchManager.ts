import { RESEARCH_NODES, ResearchNode } from '../data/research';
import {
  loadResearchData,
  saveResearchData,
  clearResearchData,
  ResearchSaveData,
} from '../data/persistence';

/** O(1) lookup for research nodes by ID */
const NODE_MAP: Map<string, ResearchNode> = new Map(RESEARCH_NODES.map((n) => [n.id, n]));

/**
 * Manages research points balance, tech tree unlocks, and persistence.
 * Loaded from localStorage on init, auto-saves on every mutation.
 */
export class ResearchManager {
  private researchPoints: number;
  private unlockedNodes: Set<string>;

  constructor() {
    const data = loadResearchData();
    this.researchPoints = data.researchPoints;
    this.unlockedNodes = new Set(data.unlockedNodes);
  }

  getResearchPoints(): number {
    return this.researchPoints;
  }

  addResearchPoints(rp: number): void {
    this.researchPoints += rp;
    this.save();
  }

  /** Check if a node can be unlocked (enough RP, prerequisite met, not already unlocked) */
  canUnlock(nodeId: string): boolean {
    if (this.unlockedNodes.has(nodeId)) return false;

    const node = NODE_MAP.get(nodeId);
    if (!node) return false;

    if (this.researchPoints < node.cost) return false;
    if (node.requires && !this.unlockedNodes.has(node.requires)) return false;

    return true;
  }

  /** Unlock a node, deducting RP. Returns true if successful. */
  unlock(nodeId: string): boolean {
    if (!this.canUnlock(nodeId)) return false;

    const node = NODE_MAP.get(nodeId)!;
    this.researchPoints -= node.cost;
    this.unlockedNodes.add(nodeId);
    this.save();
    return true;
  }

  isNodeUnlocked(nodeId: string): boolean {
    return this.unlockedNodes.has(nodeId);
  }

  /** Base buildings are always available (research doesn't gate them; stages do). */
  isBuildingUnlocked(type: string): boolean {
    const baseBuildings = [
      'quarry',
      'forge',
      'workbench',
      'chest',
      'arcane_study',
      'mana_well',
      'mana_obelisk',
      'mana_tower',
    ];
    if (baseBuildings.includes(type)) return true;

    return RESEARCH_NODES.some(
      (n) =>
        n.effect.type === 'unlock_building' &&
        n.effect.building === type &&
        this.unlockedNodes.has(n.id)
    );
  }

  /** Base recipes are always available. Research-unlocked recipes require the node. */
  isRecipeUnlocked(recipeId: string): boolean {
    const gatingNode = RESEARCH_NODES.find(
      (n) => n.effect.type === 'unlock_recipe' && n.effect.recipe === recipeId
    );
    if (!gatingNode) return true; // Not gated by research
    return this.unlockedNodes.has(gatingNode.id);
  }

  /** Returns active upgrade effects from unlocked nodes. */
  getActiveUpgrades(): { bufferBonus: number; craftTimeMultiplier: number } {
    let bufferBonus = 0;
    let craftTimeMultiplier = 1;

    for (const nodeId of this.unlockedNodes) {
      const node = NODE_MAP.get(nodeId);
      if (!node) continue;

      if (node.effect.type === 'buffer_expansion') {
        bufferBonus += node.effect.amount;
      } else if (node.effect.type === 'overclock') {
        craftTimeMultiplier *= node.effect.craftTimeMultiplier;
      }
    }

    return { bufferBonus, craftTimeMultiplier };
  }

  /** Get the state of a specific node for UI display */
  getNodeState(nodeId: string): 'unlocked' | 'available' | 'locked' {
    if (this.unlockedNodes.has(nodeId)) return 'unlocked';
    if (this.canUnlock(nodeId)) return 'available';
    return 'locked';
  }

  getNodes(): ResearchNode[] {
    return RESEARCH_NODES;
  }

  /** Reset all research progress (for new game) */
  reset(): void {
    this.researchPoints = 0;
    this.unlockedNodes.clear();
    clearResearchData();
  }

  private save(): void {
    const data: ResearchSaveData = {
      version: 1,
      researchPoints: this.researchPoints,
      unlockedNodes: [...this.unlockedNodes],
    };
    saveResearchData(data);
  }
}
