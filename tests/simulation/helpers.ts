import type { Building, BuildingType, ItemType } from '../../src/types';
import { MS_PER_TICK } from '../../src/config';
import { Simulation } from '../../src/Simulation';

let nextId = 1;

export function resetIdCounter(): void {
  nextId = 1;
}

interface TestBuildingOptions {
  x?: number;
  y?: number;
  rotation?: number;
  selectedRecipe?: string | null;
}

/**
 * Factory for creating Building objects with unique IDs and sensible defaults
 */
export function createTestBuilding(
  type: BuildingType,
  options: TestBuildingOptions = {}
): Building {
  return {
    id: nextId++,
    type,
    x: options.x ?? 0,
    y: options.y ?? 0,
    rotation: options.rotation ?? 0,
    inputBuffer: new Map(),
    outputBuffer: new Map(),
    craftProgress: 0,
    selectedRecipe: options.selectedRecipe ?? null,
    ticksStarved: 0,
    ticksBlocked: 0,
  };
}

/**
 * Factory for creating item buffers
 */
export function createBuffer(items?: [ItemType, number][]): Map<ItemType, number> {
  return new Map(items ?? []);
}

/**
 * Advance the simulation by the given number of ticks.
 * At speed 1, this processes exactly `ticks` simulation ticks.
 * At higher speeds, more ticks will be processed.
 */
export function tickSimulation(sim: Simulation, ticks: number): void {
  sim.update(MS_PER_TICK * ticks);
}
