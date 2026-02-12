import type { Building, BuildingType, ItemType, Position, TerrainType } from '../../src/types';
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
    manaAccumulator: 0,
    connected: false,
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
 * Advance the simulation by exactly `ticks` simulation ticks,
 * regardless of the current simulation speed setting.
 */
export function tickSimulation(sim: Simulation, ticks: number): void {
  const speed = sim.getState().speed;
  sim.update((MS_PER_TICK * ticks) / speed);
}

/**
 * Start simulation and pre-fill a building's input buffer.
 * Handles the start-then-set pattern safely since start() resets buffers.
 */
export function startWithInputs(
  sim: Simulation,
  building: Building,
  items: [ItemType, number][]
): void {
  sim.start();
  for (const [item, count] of items) {
    building.inputBuffer.set(item, count);
  }
}

/**
 * Place a resource patch as a rectangular area (replaces old placeCrystalVein).
 * Sets terrain and registers with the patch manager via addResourcePatch.
 */
export function placeResourcePatch(
  sim: Simulation,
  x: number,
  y: number,
  width: number,
  height: number,
  type: TerrainType,
  pool?: number
): void {
  const tiles: Position[] = [];
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      tiles.push({ x: x + dx, y: y + dy });
    }
  }
  sim.addResourcePatch(type, tiles, pool ?? tiles.length * 10);
}
