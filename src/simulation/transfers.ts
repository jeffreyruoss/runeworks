import { Building, ItemType, Direction } from '../types';
import { BUILDING_DEFINITIONS } from '../data/buildings';
import { getRecipe } from '../data/recipes';
import { getResearchRecipe } from '../data/research';
import {
  getBufferTotal,
  addToBuffer,
  removeFromBuffer,
  rotateDirection,
  oppositeDirection,
  getBuildingAt,
} from '../utils';

/**
 * Handles item transfer between adjacent buildings.
 *
 * Each tick, buildings push items from their output buffer to adjacent
 * buildings' input buffers using round-robin distribution. Transfer only
 * occurs when the output side of one building faces the input side of another.
 */
export class TransferSystem {
  private roundRobinIndex: Map<number, number> = new Map();

  reset(): void {
    this.roundRobinIndex.clear();
  }

  /**
   * Run transfer phase for all buildings
   */
  transferAll(buildings: Building[]): void {
    for (const building of buildings) {
      this.transferOutputs(building, buildings);
    }
  }

  /**
   * Transfer items from a building's output to adjacent buildings' inputs
   */
  private transferOutputs(building: Building, allBuildings: Building[]): void {
    const def = BUILDING_DEFINITIONS[building.type];
    if (def.outputSides.length === 0) return;

    // Get actual output direction based on rotation
    const outputDirs = def.outputSides.map((side) => rotateDirection(side, building.rotation));

    // Find all items in output buffer
    for (const [itemType, count] of building.outputBuffer) {
      if (count <= 0) continue;

      // Find adjacent buildings that accept this item
      const targets = this.findAdjacentInputs(building, outputDirs, itemType, allBuildings);
      if (targets.length === 0) continue;

      // Round-robin distribution
      let rrIndex = this.roundRobinIndex.get(building.id) || 0;
      let consecutiveFullTargets = 0;

      for (let i = 0; i < count; i++) {
        const target = targets[rrIndex % targets.length];
        const targetDef = BUILDING_DEFINITIONS[target.type];
        const targetInputCount = getBufferTotal(target.inputBuffer);

        if (targetInputCount < targetDef.inputBufferSize) {
          removeFromBuffer(building.outputBuffer, itemType, 1);
          addToBuffer(target.inputBuffer, itemType, 1);
          rrIndex++;
          consecutiveFullTargets = 0;
        } else {
          rrIndex++;
          consecutiveFullTargets++;
          if (consecutiveFullTargets >= targets.length) {
            break;
          }
        }
      }

      this.roundRobinIndex.set(building.id, rrIndex);
    }
  }

  /**
   * Find adjacent buildings that can accept an item type
   */
  private findAdjacentInputs(
    source: Building,
    outputDirs: Direction[],
    itemType: ItemType,
    allBuildings: Building[]
  ): Building[] {
    const targets: Building[] = [];

    for (const dir of outputDirs) {
      const outputTiles = this.getOutputTiles(source, dir);

      for (const tile of outputTiles) {
        const adjX = tile.x + (dir === 'right' ? 1 : dir === 'left' ? -1 : 0);
        const adjY = tile.y + (dir === 'down' ? 1 : dir === 'up' ? -1 : 0);

        const target = getBuildingAt(adjX, adjY, allBuildings);
        if (!target || target.id === source.id) continue;

        // Check if target accepts input from this direction
        const targetDef = BUILDING_DEFINITIONS[target.type];
        const targetInputDirs = targetDef.inputSides.map((s) =>
          rotateDirection(s, target.rotation)
        );

        const neededInputDir = oppositeDirection(dir);
        if (!targetInputDirs.includes(neededInputDir)) continue;

        if (canAcceptItem(target, itemType)) {
          if (!targets.find((t) => t.id === target.id)) {
            targets.push(target);
          }
        }
      }
    }

    return targets;
  }

  /**
   * Get the tiles on a specific side of a building
   */
  private getOutputTiles(building: Building, dir: Direction): { x: number; y: number }[] {
    const def = BUILDING_DEFINITIONS[building.type];
    const tiles: { x: number; y: number }[] = [];

    switch (dir) {
      case 'right':
        for (let dy = 0; dy < def.height; dy++) {
          tiles.push({ x: building.x + def.width - 1, y: building.y + dy });
        }
        break;
      case 'left':
        for (let dy = 0; dy < def.height; dy++) {
          tiles.push({ x: building.x, y: building.y + dy });
        }
        break;
      case 'down':
        for (let dx = 0; dx < def.width; dx++) {
          tiles.push({ x: building.x + dx, y: building.y + def.height - 1 });
        }
        break;
      case 'up':
        for (let dx = 0; dx < def.width; dx++) {
          tiles.push({ x: building.x + dx, y: building.y });
        }
        break;
    }

    return tiles;
  }
}

/**
 * Check if a building can accept a specific item type
 */
export function canAcceptItem(building: Building, itemType: ItemType): boolean {
  switch (building.type) {
    case 'chest':
      return true;
    case 'forge':
      return itemType === 'arcstone' || itemType === 'sunite';
    case 'workbench': {
      if (!building.selectedRecipe) return false;
      const recipe = getRecipe(building.selectedRecipe);
      if (!recipe) return false;
      return recipe.inputs.has(itemType);
    }
    case 'arcane_study': {
      if (!building.selectedRecipe) return false;
      const researchRecipe = getResearchRecipe(building.selectedRecipe);
      if (!researchRecipe) return false;
      return researchRecipe.input === itemType;
    }
    default:
      return false;
  }
}
