import { ManaSystem } from '../../src/simulation/ManaSystem';
import { createTestBuilding, resetIdCounter } from './helpers';

describe('ManaSystem', () => {
  let mana: ManaSystem;

  beforeEach(() => {
    mana = new ManaSystem();
    resetIdCounter();
  });

  describe('connectivity - basic generator range', () => {
    it('marks generator itself as connected', () => {
      const well = createTestBuilding('mana_well', { x: 10, y: 10 });
      mana.update([well]);
      expect(well.connected).toBe(true);
    });

    it('connects buildings within generator radius', () => {
      // mana_well radius=5, 1x1
      const well = createTestBuilding('mana_well', { x: 10, y: 10 });
      // workbench at (12, 10): center-to-center Chebyshev = |12.5+1-10.5| = 3 < 5
      const wb = createTestBuilding('workbench', { x: 12, y: 10 });
      mana.update([well, wb]);
      expect(wb.connected).toBe(true);
    });

    it('does not connect buildings outside generator radius', () => {
      const well = createTestBuilding('mana_well', { x: 0, y: 0 });
      // workbench at (20, 20): center-to-center Chebyshev = max(21-0.5, 21-0.5) = 20.5 > 5
      const wb = createTestBuilding('workbench', { x: 20, y: 20 });
      mana.update([well, wb]);
      expect(wb.connected).toBe(false);
    });
  });

  describe('connectivity - conduit extension (BFS)', () => {
    it('mana_tower extends network reach', () => {
      // Well at (0,0), tower at (4,0), workbench at (8,0)
      // Well radius=5: covers tower at center (4.5,0.5), distance = 4 < 5 ✓
      // Tower radius=5: covers workbench at center (9,1), distance = max(4.5, 0.5) = 4.5 < 5 ✓
      const well = createTestBuilding('mana_well', { x: 0, y: 0 });
      const tower = createTestBuilding('mana_tower', { x: 4, y: 0 });
      const wb = createTestBuilding('workbench', { x: 8, y: 0 });

      mana.update([well, tower, wb]);
      expect(tower.connected).toBe(true);
      expect(wb.connected).toBe(true);
    });

    it('chain of towers extends reach further', () => {
      const well = createTestBuilding('mana_well', { x: 0, y: 0 });
      const tower1 = createTestBuilding('mana_tower', { x: 4, y: 0 });
      const tower2 = createTestBuilding('mana_tower', { x: 8, y: 0 });
      const wb = createTestBuilding('workbench', { x: 12, y: 0 });

      mana.update([well, tower1, tower2, wb]);
      expect(wb.connected).toBe(true);
    });

    it('building too far from last conduit is disconnected', () => {
      const well = createTestBuilding('mana_well', { x: 0, y: 0 });
      const tower = createTestBuilding('mana_tower', { x: 4, y: 0 });
      // workbench at (20, 0): center (21,1), distance from tower center (4.5,0.5) = 16.5 > 5
      const wb = createTestBuilding('workbench', { x: 20, y: 0 });

      mana.update([well, tower, wb]);
      expect(wb.connected).toBe(false);
    });
  });

  describe('connectivity - multiple generators', () => {
    it('two wells power separate areas', () => {
      const well1 = createTestBuilding('mana_well', { x: 0, y: 0 });
      const well2 = createTestBuilding('mana_well', { x: 30, y: 0 });
      const wb1 = createTestBuilding('workbench', { x: 2, y: 0 });
      const wb2 = createTestBuilding('workbench', { x: 28, y: 0 });

      mana.update([well1, well2, wb1, wb2]);
      expect(wb1.connected).toBe(true);
      expect(wb2.connected).toBe(true);
    });

    it('mana_obelisk has larger radius (8)', () => {
      // obelisk is 2x2 at (10,10), center (11,11), radius 8
      const obelisk = createTestBuilding('mana_obelisk', { x: 10, y: 10 });
      // workbench at (17, 10), center (18, 11), distance = max(7, 0) = 7 < 8
      const wb = createTestBuilding('workbench', { x: 17, y: 10 });

      mana.update([obelisk, wb]);
      expect(wb.connected).toBe(true);
    });
  });

  describe('mana balance and production', () => {
    it('reports total production from connected generators', () => {
      const well = createTestBuilding('mana_well', { x: 0, y: 0 }); // 4 mana
      mana.update([well]);
      expect(mana.getTotalProduction()).toBe(4);
    });

    it('reports zero production for disconnected generators', () => {
      // A generator is always connected to itself, so production should always count
      // But if there are no generators, production is 0
      mana.update([]);
      expect(mana.getTotalProduction()).toBe(0);
    });

    it('sums production from multiple generators', () => {
      const well = createTestBuilding('mana_well', { x: 0, y: 0 }); // 4
      const obelisk = createTestBuilding('mana_obelisk', { x: 10, y: 10 }); // 10
      mana.update([well, obelisk]);
      expect(mana.getTotalProduction()).toBe(14);
    });

    it('reports consumption from connected powered buildings', () => {
      const well = createTestBuilding('mana_well', { x: 0, y: 0 });
      // workbench has powerCost=3
      const wb = createTestBuilding('workbench', { x: 2, y: 0 });
      mana.update([well, wb]);
      expect(mana.getTotalConsumption()).toBe(3);
    });

    it('does not count disconnected buildings in consumption', () => {
      const well = createTestBuilding('mana_well', { x: 0, y: 0 });
      const wb = createTestBuilding('workbench', { x: 30, y: 30 }); // too far
      mana.update([well, wb]);
      expect(mana.getTotalConsumption()).toBe(0);
    });
  });

  describe('speed multipliers (manaAccumulator)', () => {
    it('connected building with sufficient mana gets 100 per tick', () => {
      // Well produces 4, workbench costs 3, ratio = 4/3 > 1 → clamped to 1
      const well = createTestBuilding('mana_well', { x: 0, y: 0 });
      const wb = createTestBuilding('workbench', { x: 2, y: 0 });
      wb.manaAccumulator = 0;

      mana.update([well, wb]);
      expect(wb.manaAccumulator).toBe(100);
    });

    it('connected building with deficit gets proportional accumulator', () => {
      // Two workbenches (3 each = 6 total), one well (4 production)
      // Ratio = 4/6 = 0.667, round(0.667 * 100) = 67
      const well = createTestBuilding('mana_well', { x: 0, y: 0 });
      const wb1 = createTestBuilding('workbench', { x: 2, y: 0 });
      const wb2 = createTestBuilding('workbench', { x: 2, y: 3 });
      wb1.manaAccumulator = 0;
      wb2.manaAccumulator = 0;

      mana.update([well, wb1, wb2]);
      expect(wb1.manaAccumulator).toBe(67);
      expect(wb2.manaAccumulator).toBe(67);
    });

    it('disconnected powered building gets 5% trickle', () => {
      const wb = createTestBuilding('workbench', { x: 20, y: 20 });
      wb.manaAccumulator = 0;

      mana.update([wb]); // no generator
      expect(wb.manaAccumulator).toBe(5);
    });

    it('accumulator caps at 200', () => {
      const well = createTestBuilding('mana_well', { x: 0, y: 0 });
      const wb = createTestBuilding('workbench', { x: 2, y: 0 });
      wb.manaAccumulator = 150;

      mana.update([well, wb]);
      expect(wb.manaAccumulator).toBe(200); // 150 + 100 = 250, capped to 200
    });

    it('non-powered buildings are not affected', () => {
      const well = createTestBuilding('mana_well', { x: 0, y: 0 });
      const quarry = createTestBuilding('quarry', { x: 2, y: 0 });
      quarry.manaAccumulator = 0;

      mana.update([well, quarry]);
      expect(quarry.manaAccumulator).toBe(0); // powerCost=0, skipped
    });
  });
});
