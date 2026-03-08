import { Simulation } from '../../src/Simulation';
import {
  createTestBuilding,
  createManaWell,
  tickSimulation,
  resetIdCounter,
  startWithInputs,
} from './helpers';

describe('Arcane Study production', () => {
  let sim: Simulation;

  beforeEach(() => {
    sim = new Simulation();
    resetIdCounter();
  });

  describe('basic RP production', () => {
    it('produces RP from study_arcane_ingot recipe', () => {
      const study = createTestBuilding('arcane_study', {
        x: 0,
        y: 0,
        selectedRecipe: 'study_arcane_ingot',
      });
      const well = createManaWell();
      sim.setBuildings([study, well]);

      const callback = vi.fn();
      sim.onResearchPointsProduced = callback;
      startWithInputs(sim, study, [['arcane_ingot', 1]]);

      // study_arcane_ingot: 40 ticks, yields 2 RP
      tickSimulation(sim, 40);
      expect(callback).toHaveBeenCalledWith(2);
    });

    it('produces RP from study_cogwheel recipe', () => {
      const study = createTestBuilding('arcane_study', {
        x: 0,
        y: 0,
        selectedRecipe: 'study_cogwheel',
      });
      const well = createManaWell();
      sim.setBuildings([study, well]);

      const callback = vi.fn();
      sim.onResearchPointsProduced = callback;
      startWithInputs(sim, study, [['cogwheel', 1]]);

      // study_cogwheel: 30 ticks, yields 5 RP
      tickSimulation(sim, 30);
      expect(callback).toHaveBeenCalledWith(5);
    });

    it('produces RP from study_rune recipe', () => {
      const study = createTestBuilding('arcane_study', {
        x: 0,
        y: 0,
        selectedRecipe: 'study_rune',
      });
      const well = createManaWell();
      sim.setBuildings([study, well]);

      const callback = vi.fn();
      sim.onResearchPointsProduced = callback;
      startWithInputs(sim, study, [['rune', 1]]);

      // study_rune: 60 ticks, yields 12 RP
      tickSimulation(sim, 60);
      expect(callback).toHaveBeenCalledWith(12);
    });
  });

  describe('edge cases', () => {
    it('does nothing without a selected recipe', () => {
      const study = createTestBuilding('arcane_study', {
        x: 0,
        y: 0,
        selectedRecipe: null,
      });
      const well = createManaWell();
      sim.setBuildings([study, well]);

      const callback = vi.fn();
      sim.onResearchPointsProduced = callback;
      startWithInputs(sim, study, [['arcane_ingot', 5]]);

      tickSimulation(sim, 100);
      expect(callback).not.toHaveBeenCalled();
      expect(study.ticksStarved).toBe(0);
    });

    it('starves when input buffer is empty', () => {
      const study = createTestBuilding('arcane_study', {
        x: 0,
        y: 0,
        selectedRecipe: 'study_arcane_ingot',
      });
      const well = createManaWell();
      sim.setBuildings([study, well]);
      sim.start();

      tickSimulation(sim, 50);
      expect(study.ticksStarved).toBeGreaterThan(0);
    });

    it('does not produce output buffer items (RP is meta-resource)', () => {
      const study = createTestBuilding('arcane_study', {
        x: 0,
        y: 0,
        selectedRecipe: 'study_arcane_ingot',
      });
      const well = createManaWell();
      sim.setBuildings([study, well]);
      startWithInputs(sim, study, [['arcane_ingot', 5]]);

      tickSimulation(sim, 200);
      expect(study.outputBuffer.size).toBe(0);
    });

    it('produces multiple RP batches with sufficient input', () => {
      const study = createTestBuilding('arcane_study', {
        x: 0,
        y: 0,
        selectedRecipe: 'study_arcane_ingot',
      });
      const well = createManaWell();
      sim.setBuildings([study, well]);

      const callback = vi.fn();
      sim.onResearchPointsProduced = callback;
      startWithInputs(sim, study, [['arcane_ingot', 3]]);

      // 3 * 40 = 120 ticks for 3 crafts
      tickSimulation(sim, 120);
      expect(callback).toHaveBeenCalledTimes(3);
    });
  });

  describe('mana gating', () => {
    it('does not produce without mana (accumulator stays below threshold)', () => {
      const study = createTestBuilding('arcane_study', {
        x: 0,
        y: 0,
        selectedRecipe: 'study_arcane_ingot',
      });
      // No mana well - building is disconnected, trickle at 5% per tick
      sim.setBuildings([study]);

      const callback = vi.fn();
      sim.onResearchPointsProduced = callback;
      startWithInputs(sim, study, [['arcane_ingot', 1]]);

      // At 5% trickle, accumulator needs 20 ticks to reach 100
      // Normal craft is 40 ticks, so without mana it takes ~20x longer
      // In 40 ticks at trickle, only 2 powered ticks happen (enough for 2/40 progress)
      tickSimulation(sim, 40);
      expect(callback).not.toHaveBeenCalled();
    });

    it('eventually produces at trickle speed without mana', () => {
      const study = createTestBuilding('arcane_study', {
        x: 0,
        y: 0,
        selectedRecipe: 'study_arcane_ingot',
      });
      sim.setBuildings([study]);

      const callback = vi.fn();
      sim.onResearchPointsProduced = callback;
      startWithInputs(sim, study, [['arcane_ingot', 1]]);

      // At 5% trickle, accumulator reaches 100 every 20 ticks
      // Need 40 powered ticks → 40 * 20 = 800 total ticks
      tickSimulation(sim, 800);
      expect(callback).toHaveBeenCalledWith(2);
    });
  });
});
