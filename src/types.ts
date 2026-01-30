/**
 * Core game types for Hotkey Foundry
 */

export type ItemType =
  | 'iron_ore'
  | 'copper_ore'
  | 'iron_plate'
  | 'copper_plate'
  | 'gear'
  | 'wire'
  | 'circuit';

export type BuildingType = 'miner' | 'furnace' | 'assembler' | 'chest';

export type Direction = 'up' | 'down' | 'left' | 'right';

export type TerrainType = 'empty' | 'iron_ore' | 'copper_ore';

export interface Position {
  x: number;
  y: number;
}

export interface BuildingDefinition {
  type: BuildingType;
  width: number;
  height: number;
  powerCost: number;
  inputSides: Direction[];
  outputSides: Direction[];
  inputBufferSize: number;
  outputBufferSize: number;
}

export interface Recipe {
  id: string;
  name: string;
  inputs: Map<ItemType, number>;
  outputs: Map<ItemType, number>;
  craftTimeTicks: number;
  building: 'furnace' | 'assembler';
}

export interface Building {
  id: number;
  type: BuildingType;
  x: number;
  y: number;
  rotation: number; // 0=right, 1=down, 2=left, 3=up (output direction)

  // Runtime state
  inputBuffer: Map<ItemType, number>;
  outputBuffer: Map<ItemType, number>;
  craftProgress: number; // ticks into current craft
  selectedRecipe: string | null; // recipe id for assemblers

  // Stats for bottleneck analysis
  ticksStarved: number;
  ticksBlocked: number;
}

export interface SimulationState {
  running: boolean;
  paused: boolean;
  tickCount: number;
  speed: number; // 1, 2, or 4
  itemsProduced: Map<ItemType, number>;
}
