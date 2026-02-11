import { RESEARCH_NODES, ResearchNode } from '../data/research';
import { loadResearchData, saveResearchData, ResearchSaveData } from '../data/persistence';

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

    const node = RESEARCH_NODES.find((n) => n.id === nodeId);
    if (!node) return false;

    if (this.researchPoints < node.cost) return false;
    if (node.requires && !this.unlockedNodes.has(node.requires)) return false;

    return true;
  }

  /** Unlock a node, deducting RP. Returns true if successful. */
  unlock(nodeId: string): boolean {
    if (!this.canUnlock(nodeId)) return false;

    const node = RESEARCH_NODES.find((n) => n.id === nodeId)!;
    this.researchPoints -= node.cost;
    this.unlockedNodes.add(nodeId);
    this.save();
    return true;
  }

  isNodeUnlocked(nodeId: string): boolean {
    return this.unlockedNodes.has(nodeId);
  }

  /** Base buildings (quarry, forge, workbench, chest, arcane_study) are always available. */
  isBuildingUnlocked(type: string): boolean {
    const baseBuildings = ['quarry', 'forge', 'workbench', 'chest', 'arcane_study'];
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
    // Check if any node gates this recipe
    const gatingNode = RESEARCH_NODES.find(
      (n) => n.effect.type === 'unlock_recipe' && n.effect.recipe === recipeId
    );
    if (!gatingNode) return true; // Not gated by research
    return this.unlockedNodes.has(gatingNode.id);
  }

  /** Returns active upgrade effects from unlocked nodes. */
  getActiveUpgrades(): { bufferBonus: number; craftSpeedMultiplier: number } {
    let bufferBonus = 0;
    let craftSpeedMultiplier = 1;

    for (const nodeId of this.unlockedNodes) {
      const node = RESEARCH_NODES.find((n) => n.id === nodeId);
      if (!node) continue;

      if (node.effect.type === 'buffer_expansion') {
        bufferBonus += node.effect.amount;
      } else if (node.effect.type === 'overclock') {
        craftSpeedMultiplier *= node.effect.speedMultiplier;
      }
    }

    return { bufferBonus, craftSpeedMultiplier };
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

  private save(): void {
    const data: ResearchSaveData = {
      version: 1,
      researchPoints: this.researchPoints,
      unlockedNodes: [...this.unlockedNodes],
    };
    saveResearchData(data);
  }
}
