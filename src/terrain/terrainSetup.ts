import { Position, TerrainType } from '../types';
import { Simulation } from '../Simulation';
import { GRID_WIDTH, GRID_HEIGHT } from '../config';
import { generateBlob, mulberry32 } from './patchGenerator';

/** Deterministic seed for terrain generation */
const TERRAIN_SEED = 42;

/**
 * Patch layout definition: terrain type, center position, target size, and resource pool.
 * When `manualTiles` is provided, those exact positions are used instead of blob generation.
 */
export interface PatchDef {
  type: TerrainType;
  cx: number;
  cy: number;
  size: number;
  pool: number;
  manualTiles?: Position[];
}

/** Default patch layout for the 40x25 grid */
export const DEFAULT_PATCH_LAYOUT: PatchDef[] = [
  // 2 stone patches
  { type: 'stone', cx: 8, cy: 5, size: 25, pool: 500 },
  { type: 'stone', cx: 32, cy: 18, size: 25, pool: 500 },
  // 2 forest patches
  { type: 'forest', cx: 15, cy: 2, size: 30, pool: 600 },
  { type: 'forest', cx: 25, cy: 20, size: 30, pool: 600 },
  // Arcstone (organic blob)
  { type: 'arcstone', cx: 6, cy: 12, size: 25, pool: 750 },
  // Sunite (organic blob)
  { type: 'sunite', cx: 33, cy: 10, size: 25, pool: 750 },
  // Iron
  { type: 'iron', cx: 20, cy: 12, size: 20, pool: 400 },
  // Clay
  { type: 'clay', cx: 14, cy: 20, size: 20, pool: 400 },
  // Crystal shard (small, rare)
  { type: 'crystal_shard', cx: 20, cy: 8, size: 7, pool: 350 },
];

/**
 * Generate all terrain patches using organic blob shapes and register
 * them with the simulation. Uses a seeded PRNG for deterministic layout.
 *
 * @param layout - Custom patch layout (defaults to DEFAULT_PATCH_LAYOUT)
 * @param seed - Custom RNG seed (defaults to TERRAIN_SEED)
 */
export function generateTerrain(simulation: Simulation, layout?: PatchDef[], seed?: number): void {
  const rng = mulberry32(seed ?? TERRAIN_SEED);
  const patches = layout ?? DEFAULT_PATCH_LAYOUT;
  const occupied = new Set<string>();

  for (const def of patches) {
    let tiles: Position[];
    if (def.manualTiles) {
      tiles = def.manualTiles.filter(
        (t) =>
          t.x >= 0 &&
          t.x < GRID_WIDTH &&
          t.y >= 0 &&
          t.y < GRID_HEIGHT &&
          !occupied.has(`${t.x},${t.y}`)
      );
    } else {
      tiles = generateBlob(def.cx, def.cy, def.size, rng, (x, y) => occupied.has(`${x},${y}`));
    }
    for (const t of tiles) occupied.add(`${t.x},${t.y}`);
    if (def.type === 'water') {
      // Water is not a resource — just set terrain tiles directly
      for (const tile of tiles) {
        simulation.setTerrain(tile.x, tile.y, 'water');
      }
    } else {
      simulation.addResourcePatch(def.type, tiles, def.pool);
    }
  }
}
