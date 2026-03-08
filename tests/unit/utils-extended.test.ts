import {
  addToBuffer,
  removeFromBuffer,
  hasIngredients,
  consumeIngredients,
  getBuildingAt,
  canAfford,
  deductCost,
  getCursorInfo,
  hexToCss,
  addPlayerResource,
} from '../../src/utils';
import type { ItemType, Building, PlayerResources, ResourcePatch } from '../../src/types';

function createMinimalBuilding(
  overrides: Partial<Building> & { type: Building['type'] }
): Building {
  return {
    id: 1,
    x: 0,
    y: 0,
    rotation: 0,
    inputBuffer: new Map(),
    outputBuffer: new Map(),
    craftProgress: 0,
    selectedRecipe: null,
    manaAccumulator: 0,
    connected: false,
    ticksStarved: 0,
    ticksBlocked: 0,
    ...overrides,
  };
}

describe('addToBuffer', () => {
  it('adds to an empty buffer', () => {
    const buf = new Map<ItemType, number>();
    addToBuffer(buf, 'arcstone', 3);
    expect(buf.get('arcstone')).toBe(3);
  });

  it('adds to an existing entry', () => {
    const buf = new Map<ItemType, number>([['arcstone', 2]]);
    addToBuffer(buf, 'arcstone', 5);
    expect(buf.get('arcstone')).toBe(7);
  });

  it('handles multiple item types', () => {
    const buf = new Map<ItemType, number>();
    addToBuffer(buf, 'arcstone', 2);
    addToBuffer(buf, 'sunite', 3);
    expect(buf.get('arcstone')).toBe(2);
    expect(buf.get('sunite')).toBe(3);
  });
});

describe('removeFromBuffer', () => {
  it('removes a partial amount', () => {
    const buf = new Map<ItemType, number>([['arcstone', 5]]);
    removeFromBuffer(buf, 'arcstone', 3);
    expect(buf.get('arcstone')).toBe(2);
  });

  it('removes exact amount and deletes key', () => {
    const buf = new Map<ItemType, number>([['arcstone', 3]]);
    removeFromBuffer(buf, 'arcstone', 3);
    expect(buf.has('arcstone')).toBe(false);
    expect(buf.size).toBe(0);
  });

  it('floors at 0 and deletes key when over-removing', () => {
    const buf = new Map<ItemType, number>([['arcstone', 2]]);
    removeFromBuffer(buf, 'arcstone', 10);
    expect(buf.has('arcstone')).toBe(false);
  });

  it('handles removing from nonexistent key', () => {
    const buf = new Map<ItemType, number>();
    removeFromBuffer(buf, 'arcstone', 5);
    expect(buf.has('arcstone')).toBe(false);
    expect(buf.size).toBe(0);
  });

  it('leaves other items untouched', () => {
    const buf = new Map<ItemType, number>([
      ['arcstone', 3],
      ['sunite', 5],
    ]);
    removeFromBuffer(buf, 'arcstone', 3);
    expect(buf.has('arcstone')).toBe(false);
    expect(buf.get('sunite')).toBe(5);
  });
});

describe('hasIngredients', () => {
  it('returns true when buffer meets all requirements', () => {
    const buf = new Map<ItemType, number>([
      ['arcane_ingot', 2],
      ['thread', 3],
    ]);
    const req = new Map<ItemType, number>([
      ['arcane_ingot', 2],
      ['thread', 3],
    ]);
    expect(hasIngredients(buf, req)).toBe(true);
  });

  it('returns true when buffer exceeds requirements', () => {
    const buf = new Map<ItemType, number>([['arcane_ingot', 10]]);
    const req = new Map<ItemType, number>([['arcane_ingot', 2]]);
    expect(hasIngredients(buf, req)).toBe(true);
  });

  it('returns false when buffer is short on one ingredient', () => {
    const buf = new Map<ItemType, number>([
      ['arcane_ingot', 2],
      ['thread', 1],
    ]);
    const req = new Map<ItemType, number>([
      ['arcane_ingot', 2],
      ['thread', 3],
    ]);
    expect(hasIngredients(buf, req)).toBe(false);
  });

  it('returns false when ingredient is missing entirely', () => {
    const buf = new Map<ItemType, number>([['arcane_ingot', 2]]);
    const req = new Map<ItemType, number>([
      ['arcane_ingot', 2],
      ['thread', 3],
    ]);
    expect(hasIngredients(buf, req)).toBe(false);
  });

  it('returns true for empty requirements', () => {
    const buf = new Map<ItemType, number>([['arcstone', 5]]);
    const req = new Map<ItemType, number>();
    expect(hasIngredients(buf, req)).toBe(true);
  });
});

describe('consumeIngredients', () => {
  it('deducts all required items', () => {
    const buf = new Map<ItemType, number>([
      ['arcane_ingot', 5],
      ['thread', 6],
    ]);
    const req = new Map<ItemType, number>([
      ['arcane_ingot', 2],
      ['thread', 3],
    ]);
    consumeIngredients(buf, req);
    expect(buf.get('arcane_ingot')).toBe(3);
    expect(buf.get('thread')).toBe(3);
  });

  it('removes keys that reach zero', () => {
    const buf = new Map<ItemType, number>([
      ['arcane_ingot', 2],
      ['thread', 3],
    ]);
    const req = new Map<ItemType, number>([
      ['arcane_ingot', 2],
      ['thread', 3],
    ]);
    consumeIngredients(buf, req);
    expect(buf.has('arcane_ingot')).toBe(false);
    expect(buf.has('thread')).toBe(false);
    expect(buf.size).toBe(0);
  });

  it('leaves unrequired items untouched', () => {
    const buf = new Map<ItemType, number>([
      ['arcane_ingot', 5],
      ['sunite', 3],
    ]);
    const req = new Map<ItemType, number>([['arcane_ingot', 2]]);
    consumeIngredients(buf, req);
    expect(buf.get('sunite')).toBe(3);
  });
});

describe('getBuildingAt', () => {
  it('finds a 1x1 building at exact position', () => {
    const chest = createMinimalBuilding({ type: 'chest', x: 5, y: 5 });
    expect(getBuildingAt(5, 5, [chest])).toBe(chest);
  });

  it('finds a 2x2 building from any of its 4 tiles', () => {
    const quarry = createMinimalBuilding({ type: 'quarry', x: 3, y: 3 });
    expect(getBuildingAt(3, 3, [quarry])).toBe(quarry);
    expect(getBuildingAt(4, 3, [quarry])).toBe(quarry);
    expect(getBuildingAt(3, 4, [quarry])).toBe(quarry);
    expect(getBuildingAt(4, 4, [quarry])).toBe(quarry);
  });

  it('returns null for tile outside any building', () => {
    const quarry = createMinimalBuilding({ type: 'quarry', x: 3, y: 3 });
    expect(getBuildingAt(5, 5, [quarry])).toBeNull();
    expect(getBuildingAt(2, 3, [quarry])).toBeNull();
  });

  it('returns null for empty building list', () => {
    expect(getBuildingAt(0, 0, [])).toBeNull();
  });

  it('returns first building found when checking overlapping positions', () => {
    const chest1 = createMinimalBuilding({ type: 'chest', id: 1, x: 5, y: 5 });
    const quarry = createMinimalBuilding({ type: 'quarry', id: 2, x: 4, y: 4 });
    // quarry covers (4,4)-(5,5), chest at (5,5)
    expect(getBuildingAt(5, 5, [chest1, quarry])).toBe(chest1);
    expect(getBuildingAt(5, 5, [quarry, chest1])).toBe(quarry);
  });
});

describe('canAfford', () => {
  it('returns true when resources meet cost', () => {
    const res: PlayerResources = { stone: 10, wood: 5, iron: 3, clay: 0, crystal_shard: 2 };
    expect(canAfford(res, { stone: 5, wood: 3 })).toBe(true);
  });

  it('returns true when resources exactly equal cost', () => {
    const res: PlayerResources = { stone: 5, wood: 3, iron: 0, clay: 0, crystal_shard: 0 };
    expect(canAfford(res, { stone: 5, wood: 3 })).toBe(true);
  });

  it('returns false when any resource is insufficient', () => {
    const res: PlayerResources = { stone: 4, wood: 5, iron: 0, clay: 0, crystal_shard: 0 };
    expect(canAfford(res, { stone: 5, wood: 3 })).toBe(false);
  });

  it('returns true with empty cost', () => {
    const res: PlayerResources = { stone: 0, wood: 0, iron: 0, clay: 0, crystal_shard: 0 };
    expect(canAfford(res, {})).toBe(true);
  });
});

describe('deductCost', () => {
  it('subtracts costs correctly', () => {
    const res: PlayerResources = { stone: 10, wood: 5, iron: 3, clay: 0, crystal_shard: 2 };
    deductCost(res, { stone: 5, wood: 3 });
    expect(res.stone).toBe(5);
    expect(res.wood).toBe(2);
    expect(res.iron).toBe(3); // unchanged
  });

  it('does nothing with empty cost', () => {
    const res: PlayerResources = { stone: 10, wood: 5, iron: 3, clay: 0, crystal_shard: 0 };
    deductCost(res, {});
    expect(res.stone).toBe(10);
    expect(res.wood).toBe(5);
  });
});

describe('getCursorInfo', () => {
  it('returns building name for a building without recipe', () => {
    const quarry = createMinimalBuilding({ type: 'quarry' });
    expect(getCursorInfo(quarry, 'empty', null)).toBe('Quarry');
  });

  it('returns formatted name for multi-word building', () => {
    const study = createMinimalBuilding({ type: 'arcane_study' });
    expect(getCursorInfo(study, 'empty', null)).toBe('Arcane Study');
  });

  it('returns building with recipe name for workbench', () => {
    const wb = createMinimalBuilding({ type: 'workbench', selectedRecipe: 'forge_cogwheel' });
    expect(getCursorInfo(wb, 'empty', null)).toBe('Workbench: Forge Cogwheel');
  });

  it('returns building with recipe name for arcane_study', () => {
    const study = createMinimalBuilding({
      type: 'arcane_study',
      selectedRecipe: 'study_arcane_ingot',
    });
    expect(getCursorInfo(study, 'empty', null)).toBe('Arcane Study: Study Arcane Ingot');
  });

  it('returns terrain display name for non-empty terrain without patch', () => {
    expect(getCursorInfo(null, 'arcstone', null)).toBe('Arcstone Vein');
    expect(getCursorInfo(null, 'stone', null)).toBe('Stone Outcrop');
  });

  it('returns terrain with pool info when patch present', () => {
    const patch: ResourcePatch = {
      id: 1,
      terrainType: 'arcstone',
      tiles: [{ x: 0, y: 0 }],
      totalPool: 100,
      remainingPool: 75,
    };
    expect(getCursorInfo(null, 'arcstone', patch)).toBe('Arcstone Vein (75/100)');
  });

  it('returns null for empty terrain without building', () => {
    expect(getCursorInfo(null, 'empty', null)).toBeNull();
  });

  it('prioritizes building over terrain', () => {
    const quarry = createMinimalBuilding({ type: 'quarry' });
    expect(getCursorInfo(quarry, 'arcstone', null)).toBe('Quarry');
  });
});

describe('hexToCss', () => {
  it('converts hex number to CSS color string', () => {
    expect(hexToCss(0xe8e0f0)).toBe('#e8e0f0');
  });

  it('handles black with zero-padding', () => {
    expect(hexToCss(0x000000)).toBe('#000000');
  });

  it('handles colors with leading zeros', () => {
    expect(hexToCss(0x00ff00)).toBe('#00ff00');
  });

  it('handles white', () => {
    expect(hexToCss(0xffffff)).toBe('#ffffff');
  });
});

describe('addPlayerResource', () => {
  it('adds to matching resource fields', () => {
    const res: PlayerResources = { stone: 0, wood: 0, iron: 0, clay: 0, crystal_shard: 0 };
    addPlayerResource(res, 'stone', 5);
    expect(res.stone).toBe(5);

    addPlayerResource(res, 'wood', 3);
    expect(res.wood).toBe(3);

    addPlayerResource(res, 'crystal_shard', 2);
    expect(res.crystal_shard).toBe(2);
  });

  it('accumulates when called multiple times', () => {
    const res: PlayerResources = { stone: 5, wood: 0, iron: 0, clay: 0, crystal_shard: 0 };
    addPlayerResource(res, 'stone', 3);
    expect(res.stone).toBe(8);
  });

  it('ignores non-resource items silently', () => {
    const res: PlayerResources = { stone: 5, wood: 0, iron: 0, clay: 0, crystal_shard: 0 };
    addPlayerResource(res, 'arcane_ingot', 10);
    addPlayerResource(res, 'rune', 5);
    expect(res.stone).toBe(5); // unchanged
    expect(res.wood).toBe(0);
  });
});
