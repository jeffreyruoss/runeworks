import { BUILDING_DEFINITIONS } from '../../src/data/buildings';
import type { BuildingType, Direction } from '../../src/types';

const VALID_DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];
const allBuildingTypes = Object.keys(BUILDING_DEFINITIONS) as BuildingType[];

describe('BUILDING_DEFINITIONS', () => {
  it('defines all expected building types', () => {
    expect(allBuildingTypes).toContain('quarry');
    expect(allBuildingTypes).toContain('forge');
    expect(allBuildingTypes).toContain('workbench');
    expect(allBuildingTypes).toContain('coffer');
  });

  for (const type of allBuildingTypes) {
    describe(type, () => {
      const building = BUILDING_DEFINITIONS[type];

      it('has a type field matching its key', () => {
        expect(building.type).toBe(type);
      });

      it('has positive width', () => {
        expect(building.width).toBeGreaterThan(0);
      });

      it('has positive height', () => {
        expect(building.height).toBeGreaterThan(0);
      });

      it('has integer dimensions', () => {
        expect(Number.isInteger(building.width)).toBe(true);
        expect(Number.isInteger(building.height)).toBe(true);
      });

      it('has non-negative power cost', () => {
        expect(building.powerCost).toBeGreaterThanOrEqual(0);
      });

      it('has non-negative input buffer size', () => {
        expect(building.inputBufferSize).toBeGreaterThanOrEqual(0);
      });

      it('has positive output buffer size', () => {
        expect(building.outputBufferSize).toBeGreaterThan(0);
      });

      it('has only valid input side directions', () => {
        for (const side of building.inputSides) {
          expect(VALID_DIRECTIONS).toContain(side);
        }
      });

      it('has only valid output side directions', () => {
        for (const side of building.outputSides) {
          expect(VALID_DIRECTIONS).toContain(side);
        }
      });

      it('has at least one output side', () => {
        expect(building.outputSides.length).toBeGreaterThan(0);
      });

      it('has no duplicate input sides', () => {
        const unique = new Set(building.inputSides);
        expect(unique.size).toBe(building.inputSides.length);
      });

      it('has no duplicate output sides', () => {
        const unique = new Set(building.outputSides);
        expect(unique.size).toBe(building.outputSides.length);
      });
    });
  }

  describe('quarry specifics', () => {
    const quarry = BUILDING_DEFINITIONS.quarry;

    it('is 2x2', () => {
      expect(quarry.width).toBe(2);
      expect(quarry.height).toBe(2);
    });

    it('has no input sides (extracts from terrain)', () => {
      expect(quarry.inputSides).toHaveLength(0);
    });

    it('has zero input buffer (no inputs needed)', () => {
      expect(quarry.inputBufferSize).toBe(0);
    });
  });

  describe('forge specifics', () => {
    const forge = BUILDING_DEFINITIONS.forge;

    it('is 2x2', () => {
      expect(forge.width).toBe(2);
      expect(forge.height).toBe(2);
    });

    it('has input sides for receiving ore', () => {
      expect(forge.inputSides.length).toBeGreaterThan(0);
    });

    it('has positive input buffer for holding ore', () => {
      expect(forge.inputBufferSize).toBeGreaterThan(0);
    });
  });

  describe('workbench specifics', () => {
    const workbench = BUILDING_DEFINITIONS.workbench;

    it('is 2x2', () => {
      expect(workbench.width).toBe(2);
      expect(workbench.height).toBe(2);
    });

    it('has multiple input sides for multi-ingredient recipes', () => {
      expect(workbench.inputSides.length).toBeGreaterThanOrEqual(2);
    });

    it('has positive input buffer', () => {
      expect(workbench.inputBufferSize).toBeGreaterThan(0);
    });
  });

  describe('coffer specifics', () => {
    const coffer = BUILDING_DEFINITIONS.coffer;

    it('is 1x1', () => {
      expect(coffer.width).toBe(1);
      expect(coffer.height).toBe(1);
    });

    it('accepts items from all four directions', () => {
      expect(coffer.inputSides).toHaveLength(4);
      for (const dir of VALID_DIRECTIONS) {
        expect(coffer.inputSides).toContain(dir);
      }
    });

    it('outputs items in all four directions', () => {
      expect(coffer.outputSides).toHaveLength(4);
      for (const dir of VALID_DIRECTIONS) {
        expect(coffer.outputSides).toContain(dir);
      }
    });

    it('has zero power cost (passive storage)', () => {
      expect(coffer.powerCost).toBe(0);
    });

    it('has large buffer sizes for storage role', () => {
      expect(coffer.inputBufferSize).toBeGreaterThanOrEqual(50);
      expect(coffer.outputBufferSize).toBeGreaterThanOrEqual(50);
    });
  });
});
