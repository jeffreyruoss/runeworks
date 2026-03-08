import { ResourcePatchManager } from '../../src/terrain/ResourcePatchManager';

describe('ResourcePatchManager', () => {
  let manager: ResourcePatchManager;

  beforeEach(() => {
    manager = new ResourcePatchManager();
  });

  describe('addPatch', () => {
    it('creates a patch with correct properties', () => {
      const tiles = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ];
      const patch = manager.addPatch('arcstone', tiles, 30);

      expect(patch.terrainType).toBe('arcstone');
      expect(patch.tiles).toHaveLength(3);
      expect(patch.totalPool).toBe(30);
      expect(patch.remainingPool).toBe(30);
    });

    it('assigns incrementing IDs', () => {
      const p1 = manager.addPatch('arcstone', [{ x: 0, y: 0 }], 10);
      const p2 = manager.addPatch('sunite', [{ x: 5, y: 5 }], 10);
      expect(p2.id).toBeGreaterThan(p1.id);
    });

    it('makes tiles findable via getPatchAt', () => {
      const tiles = [
        { x: 2, y: 3 },
        { x: 3, y: 3 },
      ];
      manager.addPatch('stone', tiles, 20);

      expect(manager.getPatchAt(2, 3)).not.toBeNull();
      expect(manager.getPatchAt(3, 3)).not.toBeNull();
    });
  });

  describe('getPatchAt', () => {
    it('returns patch for a tile in the patch', () => {
      const tiles = [{ x: 5, y: 5 }];
      const patch = manager.addPatch('iron', tiles, 10);
      expect(manager.getPatchAt(5, 5)).toBe(patch);
    });

    it('returns null for a tile not in any patch', () => {
      manager.addPatch('arcstone', [{ x: 0, y: 0 }], 10);
      expect(manager.getPatchAt(10, 10)).toBeNull();
    });

    it('does not confuse multiple patches', () => {
      const p1 = manager.addPatch('arcstone', [{ x: 0, y: 0 }], 10);
      const p2 = manager.addPatch('sunite', [{ x: 5, y: 5 }], 10);

      expect(manager.getPatchAt(0, 0)).toBe(p1);
      expect(manager.getPatchAt(5, 5)).toBe(p2);
    });
  });

  describe('extractFromPatch', () => {
    it('decrements remaining pool and returns correct item', () => {
      manager.addPatch('arcstone', [{ x: 0, y: 0 }], 5);
      const result = manager.extractFromPatch(0, 0);

      expect(result).not.toBeNull();
      expect(result!.item).toBe('arcstone');
      expect(result!.depleted).toBe(false);
      expect(result!.tilesToClear).toHaveLength(0);

      // Check pool decremented
      const patch = manager.getPatchAt(0, 0);
      expect(patch!.remainingPool).toBe(4);
    });

    it('maps forest terrain to wood item', () => {
      manager.addPatch('forest', [{ x: 0, y: 0 }], 5);
      const result = manager.extractFromPatch(0, 0);
      expect(result!.item).toBe('wood');
    });

    it('depletes patch when pool reaches 0', () => {
      const tiles = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ];
      manager.addPatch('stone', tiles, 1);

      const result = manager.extractFromPatch(0, 0);
      expect(result!.depleted).toBe(true);
      expect(result!.tilesToClear).toHaveLength(2);
      expect(result!.tilesToClear).toEqual(expect.arrayContaining(tiles));
    });

    it('cleans up all tiles after depletion', () => {
      const tiles = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ];
      manager.addPatch('iron', tiles, 1);
      manager.extractFromPatch(0, 0);

      expect(manager.getPatchAt(0, 0)).toBeNull();
      expect(manager.getPatchAt(1, 0)).toBeNull();
    });

    it('returns null for tiles with no patch', () => {
      expect(manager.extractFromPatch(99, 99)).toBeNull();
    });

    it('returns null for already-depleted patches', () => {
      manager.addPatch('clay', [{ x: 0, y: 0 }], 1);
      manager.extractFromPatch(0, 0); // deplete
      expect(manager.extractFromPatch(0, 0)).toBeNull();
    });
  });

  describe('shared pool behavior', () => {
    it('multiple tiles share the same pool', () => {
      const tiles = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ];
      manager.addPatch('arcstone', tiles, 10);

      manager.extractFromPatch(0, 0);
      const patch = manager.getPatchAt(1, 0);
      expect(patch!.remainingPool).toBe(9);
    });

    it('extracting from any tile depletes the entire patch', () => {
      const tiles = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ];
      manager.addPatch('sunite', tiles, 2);

      manager.extractFromPatch(0, 0);
      manager.extractFromPatch(1, 0);

      // Both tiles should be cleared
      expect(manager.getPatchAt(0, 0)).toBeNull();
      expect(manager.getPatchAt(1, 0)).toBeNull();
    });
  });

  describe('reset', () => {
    it('clears all patches', () => {
      manager.addPatch('arcstone', [{ x: 0, y: 0 }], 10);
      manager.addPatch('sunite', [{ x: 5, y: 5 }], 10);

      manager.reset();

      expect(manager.getPatchAt(0, 0)).toBeNull();
      expect(manager.getPatchAt(5, 5)).toBeNull();
    });

    it('resets ID counter so new patches start from 0', () => {
      manager.addPatch('arcstone', [{ x: 0, y: 0 }], 10);
      manager.reset();

      const newPatch = manager.addPatch('sunite', [{ x: 1, y: 1 }], 10);
      expect(newPatch.id).toBe(0);
    });
  });
});
