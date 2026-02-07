import { TerrainType } from '../types';
import { Simulation } from '../Simulation';
import { generateBlob, mulberry32 } from './patchGenerator';

/** Deterministic seed for terrain generation */
const TERRAIN_SEED = 42;

/**
 * Patch layout definition: terrain type, center position, target size, and resource pool.
 */
interface PatchDef {
  type: TerrainType;
  cx: number;
  cy: number;
  size: number;
  pool: number;
}

/** Default patch layout for the 40x25 grid */
const PATCH_LAYOUT: PatchDef[] = [
  // 2 stone patches
  { type: 'stone', cx: 8, cy: 5, size: 25, pool: 50 },
  { type: 'stone', cx: 32, cy: 18, size: 25, pool: 50 },
  // 2 forest patches
  { type: 'forest', cx: 15, cy: 2, size: 30, pool: 60 },
  { type: 'forest', cx: 25, cy: 20, size: 30, pool: 60 },
  // Arcstone (organic blob)
  { type: 'arcstone', cx: 6, cy: 12, size: 25, pool: 75 },
  // Sunite (organic blob)
  { type: 'sunite', cx: 33, cy: 10, size: 25, pool: 75 },
  // Iron
  { type: 'iron', cx: 20, cy: 12, size: 20, pool: 40 },
  // Clay
  { type: 'clay', cx: 14, cy: 20, size: 20, pool: 40 },
  // Crystal shard (small, rare)
  { type: 'crystal_shard', cx: 20, cy: 8, size: 7, pool: 35 },
];

/**
 * Generate all terrain patches using organic blob shapes and register
 * them with the simulation. Uses a seeded PRNG for deterministic layout.
 */
export function generateTerrain(simulation: Simulation): void {
  const rng = mulberry32(TERRAIN_SEED);
  const occupied = new Set<string>();

  for (const def of PATCH_LAYOUT) {
    const tiles = generateBlob(def.cx, def.cy, def.size, rng, (x, y) => occupied.has(`${x},${y}`));
    for (const t of tiles) occupied.add(`${t.x},${t.y}`);
    simulation.addResourcePatch(def.type, tiles, def.pool);
  }
}
