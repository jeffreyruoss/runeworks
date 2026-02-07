import { ItemType, Position, ResourcePatch, TerrainType } from '../types';
import { TERRAIN_TO_ITEM } from '../data/terrain';

/**
 * Manages resource patches: stores patch data, provides O(1) tile-to-patch
 * lookup, and handles extraction/depletion.
 */
export class ResourcePatchManager {
  private patchesById: Map<number, ResourcePatch> = new Map();
  private tileToPatchId: Map<string, number> = new Map();
  private nextId = 0;

  private key(x: number, y: number): string {
    return `${x},${y}`;
  }

  /**
   * Register a new resource patch
   */
  addPatch(terrainType: TerrainType, tiles: Position[], pool: number): ResourcePatch {
    const patch: ResourcePatch = {
      id: this.nextId++,
      terrainType,
      tiles: [...tiles],
      totalPool: pool,
      remainingPool: pool,
    };
    this.patchesById.set(patch.id, patch);
    for (const tile of tiles) {
      this.tileToPatchId.set(this.key(tile.x, tile.y), patch.id);
    }
    return patch;
  }

  /**
   * Get the patch at a tile position, or null if none
   */
  getPatchAt(x: number, y: number): ResourcePatch | null {
    const patchId = this.tileToPatchId.get(this.key(x, y));
    if (patchId === undefined) return null;
    return this.patchesById.get(patchId) ?? null;
  }

  /**
   * Extract one unit of resource from the patch at (x, y).
   * Returns the item type and whether the patch is now depleted.
   * Returns null if no patch at this tile or patch is already empty.
   */
  extractFromPatch(
    x: number,
    y: number
  ): { item: ItemType; depleted: boolean; tilesToClear: Position[] } | null {
    const patch = this.getPatchAt(x, y);
    if (!patch || patch.remainingPool <= 0) return null;
    if (patch.terrainType === 'empty') return null;

    const item = TERRAIN_TO_ITEM[patch.terrainType];
    patch.remainingPool--;

    const depleted = patch.remainingPool <= 0;
    const tilesToClear = depleted ? [...patch.tiles] : [];

    if (depleted) {
      for (const tile of patch.tiles) {
        this.tileToPatchId.delete(this.key(tile.x, tile.y));
      }
      this.patchesById.delete(patch.id);
    }

    return { item, depleted, tilesToClear };
  }

  /**
   * Clear all patches
   */
  reset(): void {
    this.patchesById = new Map();
    this.tileToPatchId = new Map();
    this.nextId = 0;
  }
}
