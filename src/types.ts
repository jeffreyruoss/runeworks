/**
 * Core game types for Arcane Foundry
 */

export type ItemType =
  | 'arcstone'
  | 'sunite'
  | 'arcane_ingot'
  | 'sun_ingot'
  | 'cogwheel'
  | 'thread'
  | 'rune';

export type BuildingType = 'quarry' | 'forge' | 'workbench' | 'coffer';

export type Direction = 'up' | 'down' | 'left' | 'right';

export type TerrainType = 'empty' | 'arcstone' | 'sunite';

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
  building: 'forge' | 'workbench';
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
  selectedRecipe: string | null; // recipe id for workbenches

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

/**
 * UI state passed from GameScene to UIScene for HUD updates
 */
export interface GameUIState {
  buildingCount: number;
  selectedBuilding: string | null;
  cursorX: number;
  cursorY: number;
  simRunning: boolean;
  simPaused: boolean;
  simSpeed: number;
  simTick: number;
  itemsProduced: Record<string, number>;
  menuOpen: boolean;
  inventoryOpen: boolean;
}
