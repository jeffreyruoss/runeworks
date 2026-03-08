import {
  TERRAIN_TO_ITEM,
  QUARRIABLE_TERRAIN,
  TERRAIN_COLORS,
  TERRAIN_DISPLAY_NAMES,
} from '../../src/data/terrain';
import type { TerrainType } from '../../src/types';

const ALL_NON_EMPTY_TERRAIN: Exclude<TerrainType, 'empty'>[] = [
  'arcstone',
  'sunite',
  'stone',
  'iron',
  'forest',
  'clay',
  'crystal_shard',
];

describe('TERRAIN_TO_ITEM', () => {
  it('covers all non-empty terrain types', () => {
    for (const t of ALL_NON_EMPTY_TERRAIN) {
      expect(TERRAIN_TO_ITEM[t]).toBeDefined();
      expect(typeof TERRAIN_TO_ITEM[t]).toBe('string');
    }
  });

  it('maps forest to wood (not forest)', () => {
    expect(TERRAIN_TO_ITEM['forest']).toBe('wood');
  });

  it('maps matching terrain to same-named items', () => {
    expect(TERRAIN_TO_ITEM['arcstone']).toBe('arcstone');
    expect(TERRAIN_TO_ITEM['sunite']).toBe('sunite');
    expect(TERRAIN_TO_ITEM['stone']).toBe('stone');
    expect(TERRAIN_TO_ITEM['iron']).toBe('iron');
    expect(TERRAIN_TO_ITEM['clay']).toBe('clay');
    expect(TERRAIN_TO_ITEM['crystal_shard']).toBe('crystal_shard');
  });
});

describe('QUARRIABLE_TERRAIN', () => {
  it('contains all non-empty terrain types', () => {
    for (const t of ALL_NON_EMPTY_TERRAIN) {
      expect(QUARRIABLE_TERRAIN.has(t)).toBe(true);
    }
  });

  it('does not contain empty', () => {
    expect(QUARRIABLE_TERRAIN.has('empty')).toBe(false);
  });

  it('has exactly the same set as non-empty terrain types', () => {
    expect(QUARRIABLE_TERRAIN.size).toBe(ALL_NON_EMPTY_TERRAIN.length);
  });
});

describe('TERRAIN_DISPLAY_NAMES', () => {
  it('covers all non-empty terrain types', () => {
    for (const t of ALL_NON_EMPTY_TERRAIN) {
      expect(TERRAIN_DISPLAY_NAMES[t]).toBeDefined();
      expect(typeof TERRAIN_DISPLAY_NAMES[t]).toBe('string');
      expect(TERRAIN_DISPLAY_NAMES[t].length).toBeGreaterThan(0);
    }
  });
});

describe('TERRAIN_COLORS', () => {
  it('covers all non-empty terrain types', () => {
    for (const t of ALL_NON_EMPTY_TERRAIN) {
      expect(TERRAIN_COLORS[t]).toBeDefined();
      expect(typeof TERRAIN_COLORS[t].base).toBe('number');
      expect(typeof TERRAIN_COLORS[t].highlight).toBe('number');
    }
  });
});
