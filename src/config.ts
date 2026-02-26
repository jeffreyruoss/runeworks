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

// Theme palette — logo crest inspired (deep indigo, cyan, amber, purple-gray)
export const THEME = {
  panel: {
    bg: 0x0d0b1a,
    border: 0x5a4a6e,
    divider: 0x3a3050,
  },
  hud: {
    bg: 0x0a0816,
  },
  world: {
    bg: 0x141020,
    gridLine: 0x2a2240,
  },
  text: {
    primary: '#e8e0f0',
    secondary: '#b0a8c0',
    tertiary: '#8078a0',
    muted: '#605880',
    content: '#c8c0d8',
  },
  status: {
    active: '#4af0ff',
    valid: '#44ff88',
    invalid: '#ff5566',
    paused: '#ffdd44',
    affordable: '#44ff88',
    unaffordable: '#ff5566',
    deconstructHint: '#ff8888',
  },
  ghost: {
    valid: 0x00ff00,
    invalid: 0xff0000,
  },
  buffer: {
    text: '#ffdd44',
    bg: '#0d0b1a',
  },
  boot: {
    progressBox: 0x1a1830,
    progressBar: 0x4af0ff,
  },
  modeSelect: {
    bg: 0x0d0b1a,
    selected: '#4af0ff',
    selectedDesc: '#88d8e8',
  },
  tutorial: {
    border: 0x4af0ff,
    header: '#4af0ff',
  },
  section: {
    resources: '#88aaff',
    items: '#ffaa44',
    buildings: '#44ff88',
    research: '#cc88ff',
  },
} as const;

// Colors for UI (backward-compat layer referencing THEME)
export const COLORS = {
  background: THEME.world.bg,
  gridLine: THEME.world.gridLine,
  cursorValid: 0x00ff00,
  cursorInvalid: 0xff0000,
  cursorNeutral: 0xffffff,
  hudBackground: THEME.hud.bg,
  hudText: 0xffffff,
} as const;
