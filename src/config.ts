/**
 * Game configuration constants
 */

import { BuildingType, PlayerResources } from './types';

// Grid and display
export const TILE_SIZE = 16;
export const GRID_WIDTH = 40;
export const GRID_HEIGHT = 25;
export const CANVAS_WIDTH = GRID_WIDTH * TILE_SIZE; // 640
export const CANVAS_HEIGHT = GRID_HEIGHT * TILE_SIZE; // 400
export const DEFAULT_ZOOM = 4;
export const TEXT_RESOLUTION = DEFAULT_ZOOM;
export const UI_FONT = "'Silkscreen', monospace";

// Simulation
export const TICKS_PER_SECOND = 20;
export const MS_PER_TICK = 1000 / TICKS_PER_SECOND; // 50ms
export const DEFAULT_SIM_DURATION = 90; // seconds
export const QUARRY_TICKS_PER_ORE = 20; // 1 ore per second

// Cursor
export const CURSOR_JUMP_STEP = 5; // tiles to move when holding Shift

// Building defaults
export const DEFAULT_INPUT_BUFFER_SIZE = 10;
export const DEFAULT_OUTPUT_BUFFER_SIZE = 5;

// Building sizes (in tiles)
export const BUILDING_SIZES: Record<BuildingType, { width: number; height: number }> = {
  quarry: { width: 2, height: 2 },
  forge: { width: 2, height: 2 },
  workbench: { width: 2, height: 2 },
  chest: { width: 1, height: 1 },
  arcane_study: { width: 2, height: 2 },
  mana_well: { width: 1, height: 1 },
  mana_obelisk: { width: 2, height: 2 },
  mana_tower: { width: 1, height: 1 },
};

// Building costs (multi-resource)
export const BUILDING_COSTS: Record<BuildingType, Partial<PlayerResources>> = {
  quarry: { stone: 5, wood: 3 },
  forge: { stone: 6, iron: 2 },
  workbench: { stone: 4, wood: 4, iron: 1 },
  chest: { stone: 2, wood: 1 },
  arcane_study: { stone: 4, crystal_shard: 2 },
  mana_well: { stone: 3, crystal_shard: 1 },
  mana_obelisk: { stone: 8, crystal_shard: 4, iron: 2 },
  mana_tower: { stone: 4, iron: 1 },
};

// Resource display names (shared by UIScene and GuidePanel)
export const RESOURCE_DISPLAY_NAMES: Record<string, string> = {
  stone: 'Stone',
  wood: 'Wood',
  iron: 'Iron',
  clay: 'Clay',
  crystal_shard: 'Crystal',
};

// Colors for UI
export const COLORS = {
  background: 0x1a1a1a,
  gridLine: 0x333333,
  cursorValid: 0x00ff00,
  cursorInvalid: 0xff0000,
  cursorNeutral: 0xffffff,
  hudBackground: 0x000000,
  hudText: 0xffffff,
} as const;
