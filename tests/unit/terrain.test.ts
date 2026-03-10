import {
  TERRAIN_TO_ITEM,
  QUARRIABLE_TERRAIN,
  TERRAIN_COLORS,
  TERRAIN_DISPLAY_NAMES,
  UNBUILDABLE_TERRAIN,
  ResourceTerrainType,
} from '../../src/data/terrain';
import type { TerrainType } from '../../src/types';

/** All non-empty terrain types (includes both resource and non-resource terrain) */
const ALL_NON_EMPTY_TERRAIN: Exclude<TerrainType, 'empty'>[] = [
  'water',
  'arcstone',
  'sunite',
  'stone',
  'iron',
  'forest',
  'clay',
  'crystal_shard',
];

/** Resource terrain types (can be mined, yield items) */
const RESOURCE_TERRAIN: ResourceTerrainType[] = [
  'arcstone',
  'sunite',
  'stone',
  'iron',
  'forest',
  'clay',
  'crystal_shard',
];

describe('TERRAIN_TO_ITEM', () => {
  it('covers all resource terrain types', () => {
    for (const t of RESOURCE_TERRAIN) {
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
  it('contains all resource terrain types', () => {
    for (const t of RESOURCE_TERRAIN) {
      expect(QUARRIABLE_TERRAIN.has(t)).toBe(true);
    }
  });

  it('does not contain empty or water', () => {
    expect(QUARRIABLE_TERRAIN.has('empty')).toBe(false);
    expect(QUARRIABLE_TERRAIN.has('water')).toBe(false);
  });

  it('has exactly the same set as resource terrain types', () => {
    expect(QUARRIABLE_TERRAIN.size).toBe(RESOURCE_TERRAIN.length);
  });
});

describe('UNBUILDABLE_TERRAIN', () => {
  it('contains water', () => {
    expect(UNBUILDABLE_TERRAIN.has('water')).toBe(true);
  });

  it('does not contain resource terrain types', () => {
    for (const t of RESOURCE_TERRAIN) {
      expect(UNBUILDABLE_TERRAIN.has(t)).toBe(false);
    }
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

  it('has Water display name', () => {
    expect(TERRAIN_DISPLAY_NAMES['water']).toBe('Water');
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
