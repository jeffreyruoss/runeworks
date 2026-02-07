import { ItemType, TerrainType } from '../types';

/**
 * Maps terrain types to the item they yield when mined
 */
export const TERRAIN_TO_ITEM: Record<Exclude<TerrainType, 'empty'>, ItemType> = {
  arcstone: 'arcstone',
  sunite: 'sunite',
  stone: 'stone',
  iron: 'iron',
  forest: 'wood',
  clay: 'clay',
  crystal_shard: 'crystal_shard',
};

/**
 * All terrain types that can be quarried or hand-mined
 */
export const QUARRIABLE_TERRAIN: Set<TerrainType> = new Set([
  'arcstone',
  'sunite',
  'stone',
  'iron',
  'forest',
  'clay',
  'crystal_shard',
]);

/**
 * Colors for terrain rendering (base fill + highlight pattern)
 */
export const TERRAIN_COLORS: Record<
  Exclude<TerrainType, 'empty'>,
  { base: number; highlight: number }
> = {
  arcstone: { base: 0x4a3b6e, highlight: 0x7b68ee },
  sunite: { base: 0x8b6914, highlight: 0xdaa520 },
  stone: { base: 0x5a5a5a, highlight: 0x8a8a8a },
  iron: { base: 0x3a3a4a, highlight: 0x7a7a9a },
  forest: { base: 0x2a5a2a, highlight: 0x4a8a4a },
  clay: { base: 0x7a5a3a, highlight: 0xa87a5a },
  crystal_shard: { base: 0x2a5a6a, highlight: 0x6aeaea },
};

/**
 * Human-readable names shown in cursor info
 */
export const TERRAIN_DISPLAY_NAMES: Record<Exclude<TerrainType, 'empty'>, string> = {
  arcstone: 'Arcstone Vein',
  sunite: 'Sunite Vein',
  stone: 'Stone Outcrop',
  iron: 'Iron Deposit',
  forest: 'Forest',
  clay: 'Clay Pit',
  crystal_shard: 'Crystal Shard',
};
