import { Position } from '../types';
import { GRID_WIDTH, GRID_HEIGHT } from '../config';

/**
 * Mulberry32 seeded PRNG - returns a function that produces deterministic
 * pseudo-random numbers in [0, 1) from a 32-bit seed.
 */
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates an organic blob shape by growing outward from a center tile.
 * Frontier tiles with more patch neighbors are weighted higher for cohesion.
 *
 * @param centerX - Center tile X coordinate
 * @param centerY - Center tile Y coordinate
 * @param targetSize - Desired number of tiles in the patch
 * @param rng - Seeded random number generator
 * @param isOccupied - Callback to check if a tile is already taken
 * @returns Array of positions forming the blob
 */
export function generateBlob(
  centerX: number,
  centerY: number,
  targetSize: number,
  rng: () => number,
  isOccupied: (x: number, y: number) => boolean
): Position[] {
  const patch: Position[] = [];
  const inPatch = new Set<string>();
  const frontier: Position[] = [];
  const inFrontier = new Set<string>();

  const key = (x: number, y: number) => `${x},${y}`;
  const inBounds = (x: number, y: number) => x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT;

  // Start with center tile
  if (inBounds(centerX, centerY) && !isOccupied(centerX, centerY)) {
    patch.push({ x: centerX, y: centerY });
    inPatch.add(key(centerX, centerY));
  }

  // Add initial neighbors to frontier
  const dirs = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ];
  for (const [dx, dy] of dirs) {
    const nx = centerX + dx;
    const ny = centerY + dy;
    if (inBounds(nx, ny) && !isOccupied(nx, ny)) {
      frontier.push({ x: nx, y: ny });
      inFrontier.add(key(nx, ny));
    }
  }

  // Grow the blob
  while (patch.length < targetSize && frontier.length > 0) {
    // Weight each frontier tile by number of patch neighbors (for cohesion)
    const weights: number[] = [];
    for (const tile of frontier) {
      let neighborCount = 0;
      for (const [dx, dy] of dirs) {
        if (inPatch.has(key(tile.x + dx, tile.y + dy))) {
          neighborCount++;
        }
      }
      weights.push(neighborCount + 1); // +1 so all tiles have non-zero weight
    }

    // Weighted random selection
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let roll = rng() * totalWeight;
    let chosenIdx = 0;
    for (let i = 0; i < weights.length; i++) {
      roll -= weights[i];
      if (roll <= 0) {
        chosenIdx = i;
        break;
      }
    }

    // Add chosen tile to patch
    const chosen = frontier[chosenIdx];
    frontier.splice(chosenIdx, 1);
    inFrontier.delete(key(chosen.x, chosen.y));

    if (isOccupied(chosen.x, chosen.y)) continue;

    patch.push(chosen);
    inPatch.add(key(chosen.x, chosen.y));

    // Add new neighbors to frontier
    for (const [dx, dy] of dirs) {
      const nx = chosen.x + dx;
      const ny = chosen.y + dy;
      const nk = key(nx, ny);
      if (inBounds(nx, ny) && !inPatch.has(nk) && !inFrontier.has(nk) && !isOccupied(nx, ny)) {
        frontier.push({ x: nx, y: ny });
        inFrontier.add(nk);
      }
    }
  }

  return patch;
}
