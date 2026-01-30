/**
 * Game configuration constants
 */

// Grid and display
export const TILE_SIZE = 16;
export const GRID_WIDTH = 40;
export const GRID_HEIGHT = 25;
export const CANVAS_WIDTH = GRID_WIDTH * TILE_SIZE; // 640
export const CANVAS_HEIGHT = GRID_HEIGHT * TILE_SIZE; // 400
export const DEFAULT_ZOOM = 4;

// Simulation
export const TICKS_PER_SECOND = 20;
export const MS_PER_TICK = 1000 / TICKS_PER_SECOND; // 50ms
export const DEFAULT_SIM_DURATION = 90; // seconds
export const MINER_TICKS_PER_ORE = 20; // 1 ore per second

// Cursor
export const CURSOR_JUMP_STEP = 5; // tiles to move when holding Shift

// Building defaults
export const DEFAULT_INPUT_BUFFER_SIZE = 10;
export const DEFAULT_OUTPUT_BUFFER_SIZE = 5;

// Power costs
export const POWER_COSTS = {
  miner: 2,
  furnace: 3,
  assembler: 4,
  chest: 0,
} as const;

// Building sizes (in tiles)
export const BUILDING_SIZES = {
  miner: { width: 2, height: 2 },
  furnace: { width: 2, height: 2 },
  assembler: { width: 2, height: 2 },
  chest: { width: 1, height: 1 },
} as const;

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
