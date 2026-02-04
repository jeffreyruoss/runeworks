import { Simulation } from '../../src/Simulation';
import { GRID_WIDTH, GRID_HEIGHT, MS_PER_TICK } from '../../src/config';
import { createTestBuilding, tickSimulation, resetIdCounter, startWithInputs } from './helpers';

describe('Simulation', () => {
  let sim: Simulation;

  beforeEach(() => {
    sim = new Simulation();
    resetIdCounter();
  });

  describe('lifecycle', () => {
    it('starts not running', () => {
      const state = sim.getState();
      expect(state.running).toBe(false);
      expect(state.paused).toBe(false);
      expect(state.tickCount).toBe(0);
    });

    it('starts the simulation', () => {
      sim.start();
      const state = sim.getState();
      expect(state.running).toBe(true);
      expect(state.paused).toBe(false);
      expect(state.tickCount).toBe(0);
    });

    it('ignores double start', () => {
      sim.start();
      tickSimulation(sim, 5);
      sim.start(); // should be ignored
      expect(sim.getState().tickCount).toBe(5);
    });

    it('stops the simulation', () => {
      sim.start();
      sim.stop();
      const state = sim.getState();
      expect(state.running).toBe(false);
      expect(state.paused).toBe(false);
    });

    it('toggles pause when running', () => {
      sim.start();
      sim.togglePause();
      expect(sim.getState().paused).toBe(true);

      sim.togglePause();
      expect(sim.getState().paused).toBe(false);
    });

    it('does not toggle pause when not running', () => {
      sim.togglePause();
      expect(sim.getState().paused).toBe(false);
    });

    it('does not tick when paused', () => {
      sim.start();
      sim.togglePause();
      tickSimulation(sim, 10);
      expect(sim.getState().tickCount).toBe(0);
    });

    it('resets building buffers on start()', () => {
      const quarry = createTestBuilding('quarry', { x: 0, y: 0 });
      quarry.outputBuffer.set('arcstone', 3);
      quarry.craftProgress = 5;
      quarry.ticksStarved = 2;
      quarry.ticksBlocked = 1;

      sim.setBuildings([quarry]);
      sim.start();

      expect(quarry.outputBuffer.size).toBe(0);
      expect(quarry.inputBuffer.size).toBe(0);
      expect(quarry.craftProgress).toBe(0);
      expect(quarry.ticksStarved).toBe(0);
      expect(quarry.ticksBlocked).toBe(0);
    });
  });

  describe('terrain management', () => {
    it('initializes all terrain as empty', () => {
      expect(sim.getTerrain(0, 0)).toBe('empty');
      expect(sim.getTerrain(20, 12)).toBe('empty');
      expect(sim.getTerrain(GRID_WIDTH - 1, GRID_HEIGHT - 1)).toBe('empty');
    });

    it('sets and gets terrain type', () => {
      sim.setTerrain(5, 10, 'arcstone');
      expect(sim.getTerrain(5, 10)).toBe('arcstone');

      sim.setTerrain(5, 10, 'sunite');
      expect(sim.getTerrain(5, 10)).toBe('sunite');
    });

    it('returns empty for out-of-bounds coordinates', () => {
      expect(sim.getTerrain(-1, 0)).toBe('empty');
      expect(sim.getTerrain(0, -1)).toBe('empty');
      expect(sim.getTerrain(GRID_WIDTH, 0)).toBe('empty');
      expect(sim.getTerrain(0, GRID_HEIGHT)).toBe('empty');
      expect(sim.getTerrain(999, 999)).toBe('empty');
    });

    it('silently ignores out-of-bounds setTerrain', () => {
      sim.setTerrain(-1, -1, 'arcstone');
      expect(sim.getTerrain(-1, -1)).toBe('empty');

      sim.setTerrain(GRID_WIDTH, GRID_HEIGHT, 'sunite');
      expect(sim.getTerrain(GRID_WIDTH, GRID_HEIGHT)).toBe('empty');
    });

    it('placeCrystalVein sets rectangular area', () => {
      sim.placeCrystalVein(2, 3, 4, 3, 'arcstone');

      // Inside the vein
      expect(sim.getTerrain(2, 3)).toBe('arcstone');
      expect(sim.getTerrain(5, 5)).toBe('arcstone');
      expect(sim.getTerrain(3, 4)).toBe('arcstone');

      // Outside the vein
      expect(sim.getTerrain(1, 3)).toBe('empty');
      expect(sim.getTerrain(6, 3)).toBe('empty');
      expect(sim.getTerrain(2, 2)).toBe('empty');
      expect(sim.getTerrain(2, 6)).toBe('empty');
    });

    it('placeCrystalVein clips to grid boundaries', () => {
      sim.placeCrystalVein(GRID_WIDTH - 2, GRID_HEIGHT - 2, 5, 5, 'sunite');

      expect(sim.getTerrain(GRID_WIDTH - 2, GRID_HEIGHT - 2)).toBe('sunite');
      expect(sim.getTerrain(GRID_WIDTH - 1, GRID_HEIGHT - 1)).toBe('sunite');
      expect(sim.getTerrain(GRID_WIDTH, GRID_HEIGHT)).toBe('empty');
    });

    it('sets and gets stone_deposit terrain', () => {
      sim.setTerrain(3, 3, 'stone_deposit');
      expect(sim.getTerrain(3, 3)).toBe('stone_deposit');
    });

    it('quarry does not extract from stone_deposit', () => {
      const quarry = createTestBuilding('quarry', { x: 0, y: 0 });
      sim.setBuildings([quarry]);
      sim.setTerrain(0, 0, 'stone_deposit');
      sim.setTerrain(1, 0, 'stone_deposit');
      sim.setTerrain(0, 1, 'stone_deposit');
      sim.setTerrain(1, 1, 'stone_deposit');
      sim.start();

      tickSimulation(sim, 40);
      expect(quarry.outputBuffer.size).toBe(0);
    });
  });

  describe('speed control', () => {
    it('defaults to speed 1', () => {
      expect(sim.getState().speed).toBe(1);
    });

    it('sets speed to 2', () => {
      sim.setSpeed(2);
      expect(sim.getState().speed).toBe(2);
    });

    it('sets speed to 4', () => {
      sim.setSpeed(4);
      expect(sim.getState().speed).toBe(4);
    });

    it('clamps speed below 1 to 1', () => {
      sim.setSpeed(0);
      expect(sim.getState().speed).toBe(1);

      sim.setSpeed(-5);
      expect(sim.getState().speed).toBe(1);
    });

    it('clamps speed above 4 to 4', () => {
      sim.setSpeed(10);
      expect(sim.getState().speed).toBe(4);

      sim.setSpeed(100);
      expect(sim.getState().speed).toBe(4);
    });

    it('processes ticks faster at higher speed', () => {
      sim.setSpeed(2);
      sim.start();

      // At 2x speed, MS_PER_TICK of real time produces 2 sim ticks
      sim.update(MS_PER_TICK);
      expect(sim.getState().tickCount).toBe(2);
    });
  });

  describe('tick accumulation', () => {
    it('accumulates fractional ticks', () => {
      sim.start();
      // Update with half a tick worth of time
      sim.update(MS_PER_TICK / 2);
      expect(sim.getState().tickCount).toBe(0);

      // Another half tick should complete a full tick
      sim.update(MS_PER_TICK / 2);
      expect(sim.getState().tickCount).toBe(1);
    });

    it('processes multiple ticks in one update', () => {
      sim.start();
      sim.update(MS_PER_TICK * 5);
      expect(sim.getState().tickCount).toBe(5);
    });
  });

  describe('callbacks', () => {
    it('fires onStateChanged when simulation starts', () => {
      const callback = vi.fn();
      sim.onStateChanged = callback;
      sim.start();
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ running: true, paused: false })
      );
    });

    it('fires onStateChanged when simulation stops', () => {
      sim.start();
      const callback = vi.fn();
      sim.onStateChanged = callback;
      sim.stop();
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ running: false }));
    });

    it('fires onStateChanged on each tick', () => {
      sim.start();
      const callback = vi.fn();
      sim.onStateChanged = callback;

      tickSimulation(sim, 3);
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('fires onStateChanged on pause toggle', () => {
      sim.start();
      const callback = vi.fn();
      sim.onStateChanged = callback;

      sim.togglePause();
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ paused: true }));
    });

    it('fires onStateChanged on speed change', () => {
      const callback = vi.fn();
      sim.onStateChanged = callback;
      sim.setSpeed(4);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ speed: 4 }));
    });

    it('fires onItemProduced when a forge produces ingots', () => {
      const forge = createTestBuilding('forge', { x: 0, y: 0 });
      sim.setBuildings([forge]);

      const callback = vi.fn();
      sim.onItemProduced = callback;
      startWithInputs(sim, forge, [['arcstone', 2]]);

      // purify_arcstone takes 40 ticks
      tickSimulation(sim, 40);
      expect(callback).toHaveBeenCalledWith('arcane_ingot', 1);
    });
  });
});
