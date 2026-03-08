import { mulberry32, generateBlob } from '../../src/terrain/patchGenerator';
import { GRID_WIDTH, GRID_HEIGHT } from '../../src/config';

describe('mulberry32', () => {
  it('same seed produces same sequence', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    for (let i = 0; i < 20; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('different seeds produce different sequences', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(99);
    // Very unlikely (but not impossible) that first 5 values match
    let allMatch = true;
    for (let i = 0; i < 5; i++) {
      if (rng1() !== rng2()) allMatch = false;
    }
    expect(allMatch).toBe(false);
  });

  it('output is in [0, 1) range', () => {
    const rng = mulberry32(12345);
    for (let i = 0; i < 1000; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
});

describe('generateBlob', () => {
  it('produces tiles up to targetSize', () => {
    const rng = mulberry32(42);
    const tiles = generateBlob(20, 12, 15, rng, () => false);
    expect(tiles.length).toBe(15);
  });

  it('includes center tile', () => {
    const rng = mulberry32(42);
    const tiles = generateBlob(10, 10, 5, rng, () => false);
    expect(tiles.some((t) => t.x === 10 && t.y === 10)).toBe(true);
  });

  it('all tiles are within grid boundaries', () => {
    const rng = mulberry32(42);
    // Place blob near corner to test boundary clamping
    const tiles = generateBlob(1, 1, 20, rng, () => false);
    for (const t of tiles) {
      expect(t.x).toBeGreaterThanOrEqual(0);
      expect(t.x).toBeLessThan(GRID_WIDTH);
      expect(t.y).toBeGreaterThanOrEqual(0);
      expect(t.y).toBeLessThan(GRID_HEIGHT);
    }
  });

  it('respects isOccupied callback', () => {
    const rng = mulberry32(42);
    const occupied = new Set(['11,10', '10,11', '9,10', '10,9']);
    const tiles = generateBlob(10, 10, 10, rng, (x, y) => occupied.has(`${x},${y}`));

    for (const t of tiles) {
      expect(occupied.has(`${t.x},${t.y}`)).toBe(false);
    }
  });

  it('produces deterministic output with same seed', () => {
    const tiles1 = generateBlob(20, 12, 10, mulberry32(42), () => false);
    const tiles2 = generateBlob(20, 12, 10, mulberry32(42), () => false);

    expect(tiles1).toEqual(tiles2);
  });

  it('produces connected tiles (each tile adjacent to at least one other)', () => {
    const rng = mulberry32(42);
    const tiles = generateBlob(20, 12, 20, rng, () => false);
    const tileSet = new Set(tiles.map((t) => `${t.x},${t.y}`));

    // Every tile except possibly the first should be adjacent to at least one other tile
    for (let i = 1; i < tiles.length; i++) {
      const t = tiles[i];
      const hasNeighbor =
        tileSet.has(`${t.x - 1},${t.y}`) ||
        tileSet.has(`${t.x + 1},${t.y}`) ||
        tileSet.has(`${t.x},${t.y - 1}`) ||
        tileSet.has(`${t.x},${t.y + 1}`);
      expect(hasNeighbor).toBe(true);
    }
  });

  it('handles edge case at grid corner (0,0)', () => {
    const rng = mulberry32(42);
    const tiles = generateBlob(0, 0, 10, rng, () => false);
    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles[0]).toEqual({ x: 0, y: 0 });
  });

  it('returns fewer tiles when blocked by occupied cells', () => {
    const rng = mulberry32(42);
    // Block all neighbors of center
    const tiles = generateBlob(10, 10, 20, rng, (x, y) => {
      if (x === 10 && y === 10) return false;
      // Block everything within 1 tile of center
      return Math.abs(x - 10) <= 1 && Math.abs(y - 10) <= 1;
    });
    // Only center tile should be placeable since all neighbors are blocked
    expect(tiles.length).toBe(1);
  });
});
