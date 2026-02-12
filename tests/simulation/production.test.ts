import { Simulation } from '../../src/Simulation';
import { QUARRY_TICKS_PER_ORE } from '../../src/config';
import { BUILDING_DEFINITIONS } from '../../src/data/buildings';
import {
  createTestBuilding,
  createManaWell,
  tickSimulation,
  resetIdCounter,
  startWithInputs,
  placeResourcePatch,
} from './helpers';

describe('Production', () => {
  let sim: Simulation;

  beforeEach(() => {
    sim = new Simulation();
    resetIdCounter();
  });

  describe('quarry', () => {
    it('extracts arcstone ore after QUARRY_TICKS_PER_ORE ticks', () => {
      const quarry = createTestBuilding('quarry', { x: 0, y: 0 });
      sim.setBuildings([quarry]);
      placeResourcePatch(sim, 0, 0, 2, 2, 'arcstone');
      sim.start();

      // One tick before production
      tickSimulation(sim, QUARRY_TICKS_PER_ORE - 1);
      expect(quarry.outputBuffer.get('arcstone') ?? 0).toBe(0);

      // Exactly at production threshold
      tickSimulation(sim, 1);
      expect(quarry.outputBuffer.get('arcstone')).toBe(1);
    });

    it('extracts sunite ore when on sunite vein', () => {
      const quarry = createTestBuilding('quarry', { x: 4, y: 4 });
      sim.setBuildings([quarry]);
      placeResourcePatch(sim, 4, 4, 2, 2, 'sunite');
      sim.start();

      tickSimulation(sim, QUARRY_TICKS_PER_ORE);
      expect(quarry.outputBuffer.get('sunite')).toBe(1);
    });

    it('produces multiple ore over time', () => {
      const quarry = createTestBuilding('quarry', { x: 0, y: 0 });
      sim.setBuildings([quarry]);
      placeResourcePatch(sim, 0, 0, 2, 2, 'arcstone');
      sim.start();

      tickSimulation(sim, QUARRY_TICKS_PER_ORE * 3);
      expect(quarry.outputBuffer.get('arcstone')).toBe(3);
    });

    it('starves when not on a crystal vein', () => {
      const quarry = createTestBuilding('quarry', { x: 10, y: 10 });
      sim.setBuildings([quarry]);
      // No vein placed
      sim.start();

      tickSimulation(sim, QUARRY_TICKS_PER_ORE * 2);
      expect(quarry.outputBuffer.size).toBe(0);
      expect(quarry.ticksStarved).toBeGreaterThan(0);
    });

    it('blocks when output buffer is full', () => {
      const quarry = createTestBuilding('quarry', { x: 0, y: 0 });
      sim.setBuildings([quarry]);
      placeResourcePatch(sim, 0, 0, 2, 2, 'arcstone');
      sim.start();

      // Run enough ticks to fill the output buffer (size 5)
      tickSimulation(sim, QUARRY_TICKS_PER_ORE * 10);

      expect(quarry.outputBuffer.get('arcstone')).toBe(
        BUILDING_DEFINITIONS.quarry.outputBufferSize
      );
      expect(quarry.ticksBlocked).toBeGreaterThan(0);
    });

    it('only checks terrain under its 2x2 tiles', () => {
      // Quarry at (5,5) covers (5,5), (6,5), (5,6), (6,6)
      const quarry = createTestBuilding('quarry', { x: 5, y: 5 });
      sim.setBuildings([quarry]);

      // Place vein adjacent but NOT under the quarry
      sim.setTerrain(4, 5, 'arcstone');
      sim.setTerrain(7, 5, 'arcstone');
      sim.start();

      tickSimulation(sim, QUARRY_TICKS_PER_ORE * 2);
      expect(quarry.outputBuffer.size).toBe(0);
      expect(quarry.ticksStarved).toBeGreaterThan(0);
    });
  });

  describe('forge', () => {
    it('smelts arcstone into arcane_ingot', () => {
      const forge = createTestBuilding('forge', { x: 0, y: 0 });
      sim.setBuildings([forge]);
      startWithInputs(sim, forge, [['arcstone', 2]]);

      tickSimulation(sim, 40);
      expect(forge.outputBuffer.get('arcane_ingot')).toBe(1);
    });

    it('smelts sunite into sun_ingot', () => {
      const forge = createTestBuilding('forge', { x: 0, y: 0 });
      sim.setBuildings([forge]);
      startWithInputs(sim, forge, [['sunite', 2]]);

      tickSimulation(sim, 40);
      expect(forge.outputBuffer.get('sun_ingot')).toBe(1);
    });

    it('starves with no input', () => {
      const forge = createTestBuilding('forge', { x: 0, y: 0 });
      sim.setBuildings([forge]);
      sim.start();

      tickSimulation(sim, 100);
      expect(forge.outputBuffer.size).toBe(0);
      expect(forge.ticksStarved).toBeGreaterThan(0);
    });

    it('consumes input at start of craft, not when complete', () => {
      const forge = createTestBuilding('forge', { x: 0, y: 0 });
      sim.setBuildings([forge]);
      startWithInputs(sim, forge, [['arcstone', 2]]);

      // After 1 tick: 1 arcstone consumed for crafting, 1 remains
      tickSimulation(sim, 1);
      expect(forge.inputBuffer.get('arcstone')).toBe(1);
      // But output not yet ready
      expect(forge.outputBuffer.get('arcane_ingot') ?? 0).toBe(0);
    });

    it('blocks when output buffer is full', () => {
      const forge = createTestBuilding('forge', { x: 0, y: 0 });
      sim.setBuildings([forge]);
      // Give enough ore for many crafts
      startWithInputs(sim, forge, [['arcstone', 10]]);

      tickSimulation(sim, 40 * 10);
      // Output should be capped at buffer size (5)
      expect(forge.outputBuffer.get('arcane_ingot')).toBeLessThanOrEqual(
        BUILDING_DEFINITIONS.forge.outputBufferSize
      );
      expect(forge.ticksBlocked).toBeGreaterThan(0);
    });
  });

  describe('workbench', () => {
    it('crafts cogwheel from arcane_ingots', () => {
      const workbench = createTestBuilding('workbench', {
        x: 0,
        y: 0,
        selectedRecipe: 'forge_cogwheel',
      });
      const well = createManaWell();
      sim.setBuildings([workbench, well]);
      startWithInputs(sim, workbench, [['arcane_ingot', 2]]);

      // forge_cogwheel takes 30 ticks
      tickSimulation(sim, 30);
      expect(workbench.outputBuffer.get('cogwheel')).toBe(1);
    });

    it('crafts thread from sun_ingot (produces 2)', () => {
      const workbench = createTestBuilding('workbench', {
        x: 0,
        y: 0,
        selectedRecipe: 'spin_thread',
      });
      const well = createManaWell();
      sim.setBuildings([workbench, well]);
      startWithInputs(sim, workbench, [['sun_ingot', 1]]);

      // spin_thread takes 20 ticks
      tickSimulation(sim, 20);
      expect(workbench.outputBuffer.get('thread')).toBe(2);
    });

    it('crafts rune from arcane_ingot and thread', () => {
      const workbench = createTestBuilding('workbench', {
        x: 0,
        y: 0,
        selectedRecipe: 'inscribe_rune',
      });
      const well = createManaWell();
      sim.setBuildings([workbench, well]);
      startWithInputs(sim, workbench, [
        ['arcane_ingot', 1],
        ['thread', 3],
      ]);

      // inscribe_rune takes 60 ticks
      tickSimulation(sim, 60);
      expect(workbench.outputBuffer.get('rune')).toBe(1);
    });

    it('does nothing without a selected recipe', () => {
      const workbench = createTestBuilding('workbench', {
        x: 0,
        y: 0,
        selectedRecipe: null,
      });
      sim.setBuildings([workbench]);
      startWithInputs(sim, workbench, [['arcane_ingot', 5]]);

      tickSimulation(sim, 100);
      expect(workbench.outputBuffer.size).toBe(0);
      // Returns early without incrementing starved
      expect(workbench.ticksStarved).toBe(0);
    });

    it('starves when missing ingredients', () => {
      const workbench = createTestBuilding('workbench', {
        x: 0,
        y: 0,
        selectedRecipe: 'forge_cogwheel',
      });
      sim.setBuildings([workbench]);
      // Need 2 arcane_ingot, only have 1
      startWithInputs(sim, workbench, [['arcane_ingot', 1]]);

      tickSimulation(sim, 60);
      expect(workbench.outputBuffer.size).toBe(0);
      expect(workbench.ticksStarved).toBeGreaterThan(0);
    });
  });
});
