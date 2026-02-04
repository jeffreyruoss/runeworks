import { Simulation } from '../../src/Simulation';
import { QUARRY_TICKS_PER_ORE } from '../../src/config';
import { BUILDING_DEFINITIONS } from '../../src/data/buildings';
import { createTestBuilding, tickSimulation, resetIdCounter } from './helpers';

describe('Transfer', () => {
  let sim: Simulation;

  beforeEach(() => {
    sim = new Simulation();
    resetIdCounter();
  });

  describe('aligned building transfers', () => {
    it('transfers ore from quarry to forge when properly aligned', () => {
      // Quarry at (0,0) outputs right (rotation 0)
      // Quarry occupies (0,0)-(1,1), right edge at x=1
      // Forge at (2,0) inputs left (rotation 0), left edge at x=2
      // Adjacent: quarry right edge (1,y) -> forge left edge (2,y) ✓
      const quarry = createTestBuilding('quarry', { x: 0, y: 0, rotation: 0 });
      const forge = createTestBuilding('forge', { x: 2, y: 0, rotation: 0 });
      sim.setBuildings([quarry, forge]);
      sim.placeCrystalVein(0, 0, 2, 2, 'arcstone');
      sim.start();

      // Run exactly enough ticks for quarry to produce + transfer in same tick
      tickSimulation(sim, QUARRY_TICKS_PER_ORE);

      // Ore produced and transferred to forge in the same tick
      // (production phase runs before transfer phase within each tick)
      const forgeInput = forge.inputBuffer.get('arcstone') ?? 0;
      expect(forgeInput).toBe(1);
    });
  });

  describe('no transfer when not aligned', () => {
    it('does not transfer when output does not face target', () => {
      // Quarry output faces right (rotation 0), but forge is above
      const quarry = createTestBuilding('quarry', { x: 0, y: 2, rotation: 0 });
      const forge = createTestBuilding('forge', { x: 0, y: 0, rotation: 0 });
      sim.setBuildings([quarry, forge]);
      sim.placeCrystalVein(0, 2, 2, 2, 'arcstone');
      sim.start();

      tickSimulation(sim, QUARRY_TICKS_PER_ORE + 1);

      // Ore stays in quarry output
      expect(quarry.outputBuffer.get('arcstone')).toBe(1);
      expect(forge.inputBuffer.get('arcstone') ?? 0).toBe(0);
    });

    it('does not transfer when target input side does not face source', () => {
      // Quarry at (0,0) outputs right
      // Forge at (2,0) with rotation 2 -> input 'left' rotated by 2 = 'right'
      // Forge now accepts from right, not from left where quarry is
      const quarry = createTestBuilding('quarry', { x: 0, y: 0, rotation: 0 });
      const forge = createTestBuilding('forge', { x: 2, y: 0, rotation: 2 });
      sim.setBuildings([quarry, forge]);
      sim.placeCrystalVein(0, 0, 2, 2, 'arcstone');
      sim.start();

      tickSimulation(sim, QUARRY_TICKS_PER_ORE + 1);

      expect(quarry.outputBuffer.get('arcstone')).toBe(1);
      expect(forge.inputBuffer.get('arcstone') ?? 0).toBe(0);
    });

    it('does not transfer when buildings are not adjacent', () => {
      // Quarry outputs right, forge is to the right but with a gap
      const quarry = createTestBuilding('quarry', { x: 0, y: 0, rotation: 0 });
      const forge = createTestBuilding('forge', { x: 3, y: 0, rotation: 0 });
      sim.setBuildings([quarry, forge]);
      sim.placeCrystalVein(0, 0, 2, 2, 'arcstone');
      sim.start();

      tickSimulation(sim, QUARRY_TICKS_PER_ORE + 1);

      expect(quarry.outputBuffer.get('arcstone')).toBe(1);
      expect(forge.inputBuffer.get('arcstone') ?? 0).toBe(0);
    });
  });

  describe('round-robin distribution', () => {
    it('distributes items between multiple targets', () => {
      // Quarry at (0,0) outputs right
      // Two coffers on the right side (coffer is 1x1)
      const quarry = createTestBuilding('quarry', { x: 0, y: 0, rotation: 0 });
      const coffer1 = createTestBuilding('coffer', { x: 2, y: 0 });
      const coffer2 = createTestBuilding('coffer', { x: 2, y: 1 });

      sim.setBuildings([quarry, coffer1, coffer2]);
      sim.placeCrystalVein(0, 0, 2, 2, 'arcstone');
      sim.start();

      // Produce 4 items plus extra ticks for transfers
      tickSimulation(sim, QUARRY_TICKS_PER_ORE * 4 + 1);

      const c1Count = coffer1.inputBuffer.get('arcstone') ?? 0;
      const c2Count = coffer2.inputBuffer.get('arcstone') ?? 0;

      // Items should be distributed between the two coffers
      expect(c1Count + c2Count).toBe(4);
      expect(c1Count).toBeGreaterThanOrEqual(1);
      expect(c2Count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('canAcceptItem behavior', () => {
    it('coffer accepts any item type', () => {
      const quarry = createTestBuilding('quarry', { x: 0, y: 0, rotation: 0 });
      const coffer = createTestBuilding('coffer', { x: 2, y: 0 });

      sim.setBuildings([quarry, coffer]);
      sim.placeCrystalVein(0, 0, 2, 2, 'arcstone');
      sim.start();

      tickSimulation(sim, QUARRY_TICKS_PER_ORE + 1);
      expect(coffer.inputBuffer.get('arcstone')).toBe(1);
    });

    it('forge accepts ore types', () => {
      const quarry = createTestBuilding('quarry', { x: 0, y: 0, rotation: 0 });
      const forge = createTestBuilding('forge', { x: 2, y: 0, rotation: 0 });

      sim.setBuildings([quarry, forge]);
      sim.placeCrystalVein(0, 0, 2, 2, 'arcstone');
      sim.start();

      // Use exactly QUARRY_TICKS_PER_ORE so transfer happens but forge
      // hasn't consumed the ore yet (forge processes on next tick)
      tickSimulation(sim, QUARRY_TICKS_PER_ORE);
      expect(forge.inputBuffer.get('arcstone')).toBe(1);
    });

    it('forge rejects non-ore items', () => {
      // Workbench outputs cogwheel toward a forge
      const workbench = createTestBuilding('workbench', {
        x: 0,
        y: 0,
        rotation: 0,
        selectedRecipe: 'forge_cogwheel',
      });
      const forge = createTestBuilding('forge', { x: 2, y: 0, rotation: 0 });

      sim.setBuildings([workbench, forge]);
      sim.start();
      workbench.inputBuffer.set('arcane_ingot', 2);

      // Workbench crafts cogwheel (30 ticks), then tries to transfer
      tickSimulation(sim, 31);

      // Cogwheel should remain in workbench output
      expect(workbench.outputBuffer.get('cogwheel')).toBe(1);
      expect(forge.inputBuffer.get('cogwheel') ?? 0).toBe(0);
    });

    it('workbench accepts items matching its selected recipe', () => {
      // Forge outputs arcane_ingot, workbench needs it for forge_cogwheel
      const forge = createTestBuilding('forge', { x: 0, y: 0, rotation: 0 });
      const workbench = createTestBuilding('workbench', {
        x: 2,
        y: 0,
        rotation: 0,
        selectedRecipe: 'forge_cogwheel',
      });

      sim.setBuildings([forge, workbench]);
      sim.start();
      forge.inputBuffer.set('arcstone', 2);

      // Forge crafts arcane_ingot (40 ticks), then transfers
      tickSimulation(sim, 41);

      expect(workbench.inputBuffer.get('arcane_ingot')).toBe(1);
    });

    it('workbench rejects items not in its recipe', () => {
      // Forge outputs sun_ingot, but workbench recipe needs arcane_ingot
      const forge = createTestBuilding('forge', { x: 0, y: 0, rotation: 0 });
      const workbench = createTestBuilding('workbench', {
        x: 2,
        y: 0,
        rotation: 0,
        selectedRecipe: 'forge_cogwheel', // needs arcane_ingot, not sun_ingot
      });

      sim.setBuildings([forge, workbench]);
      sim.start();
      forge.inputBuffer.set('sunite', 2);

      // Forge crafts sun_ingot (40 ticks), then tries to transfer
      tickSimulation(sim, 41);

      // sun_ingot should stay in forge output
      expect(forge.outputBuffer.get('sun_ingot')).toBe(1);
      expect(workbench.inputBuffer.get('sun_ingot') ?? 0).toBe(0);
    });

    it('workbench with no recipe rejects all items', () => {
      const forge = createTestBuilding('forge', { x: 0, y: 0, rotation: 0 });
      const workbench = createTestBuilding('workbench', {
        x: 2,
        y: 0,
        rotation: 0,
        selectedRecipe: null,
      });

      sim.setBuildings([forge, workbench]);
      sim.start();
      forge.inputBuffer.set('arcstone', 2);

      tickSimulation(sim, 41);

      expect(forge.outputBuffer.get('arcane_ingot')).toBe(1);
      expect(workbench.inputBuffer.size).toBe(0);
    });
  });

  describe('buffer capacity limits', () => {
    it('does not transfer when target input buffer is full', () => {
      const quarry = createTestBuilding('quarry', { x: 0, y: 0, rotation: 0 });
      const forge = createTestBuilding('forge', { x: 2, y: 0, rotation: 0 });

      sim.setBuildings([quarry, forge]);
      sim.placeCrystalVein(0, 0, 2, 2, 'arcstone');
      sim.start();

      // Pre-fill forge buffers: input to capacity, output to capacity
      // (full output prevents forge from consuming input, keeping it full)
      forge.inputBuffer.set('arcstone', BUILDING_DEFINITIONS.forge.inputBufferSize);
      forge.outputBuffer.set('arcane_ingot', BUILDING_DEFINITIONS.forge.outputBufferSize);

      tickSimulation(sim, QUARRY_TICKS_PER_ORE);

      // Ore should stay in quarry output since forge input is full
      expect(quarry.outputBuffer.get('arcstone')).toBe(1);
      expect(forge.inputBuffer.get('arcstone')).toBe(BUILDING_DEFINITIONS.forge.inputBufferSize);
    });

    it('coffer respects its buffer capacity', () => {
      const quarry = createTestBuilding('quarry', { x: 0, y: 0, rotation: 0 });
      const coffer = createTestBuilding('coffer', { x: 2, y: 0 });

      sim.setBuildings([quarry, coffer]);
      sim.placeCrystalVein(0, 0, 2, 2, 'arcstone');
      sim.start();

      // Pre-fill coffer to capacity
      coffer.inputBuffer.set('arcstone', BUILDING_DEFINITIONS.coffer.inputBufferSize);

      tickSimulation(sim, QUARRY_TICKS_PER_ORE + 1);

      // Coffer should not accept more
      expect(coffer.inputBuffer.get('arcstone')).toBe(BUILDING_DEFINITIONS.coffer.inputBufferSize);
      expect(quarry.outputBuffer.get('arcstone')).toBe(1);
    });
  });
});
