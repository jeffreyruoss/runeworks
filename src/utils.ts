import {
  ItemType,
  Direction,
  Building,
  PlayerResources,
  ResourcePatch,
  TerrainType,
} from './types';
import { BUILDING_DEFINITIONS } from './data/buildings';
import { TERRAIN_DISPLAY_NAMES } from './data/terrain';
import { getRecipe } from './data/recipes';
import { getResearchRecipe } from './data/research';

/**
 * Get total count of all items in a buffer
 */
export function getBufferTotal(buffer: Map<ItemType, number>): number {
  let total = 0;
  for (const count of buffer.values()) {
    total += count;
  }
  return total;
}

/**
 * Add items to a buffer
 */
export function addToBuffer(buffer: Map<ItemType, number>, item: ItemType, count: number): void {
  buffer.set(item, (buffer.get(item) || 0) + count);
}

/**
 * Remove items from a buffer (floors at 0)
 */
export function removeFromBuffer(
  buffer: Map<ItemType, number>,
  item: ItemType,
  count: number
): void {
  const current = buffer.get(item) || 0;
  const newCount = Math.max(0, current - count);
  if (newCount === 0) {
    buffer.delete(item);
  } else {
    buffer.set(item, newCount);
  }
}

/**
 * Check if a buffer has at least the required ingredients
 */
export function hasIngredients(
  buffer: Map<ItemType, number>,
  required: Map<ItemType, number>
): boolean {
  for (const [item, count] of required) {
    if ((buffer.get(item) || 0) < count) {
      return false;
    }
  }
  return true;
}

/**
 * Consume ingredients from a buffer
 */
export function consumeIngredients(
  buffer: Map<ItemType, number>,
  required: Map<ItemType, number>
): void {
  for (const [item, count] of required) {
    removeFromBuffer(buffer, item, count);
  }
}

/**
 * Find a building at a specific tile position
 */
export function getBuildingAt(x: number, y: number, buildings: Building[]): Building | null {
  for (const building of buildings) {
    const def = BUILDING_DEFINITIONS[building.type];
    if (
      x >= building.x &&
      x < building.x + def.width &&
      y >= building.y &&
      y < building.y + def.height
    ) {
      return building;
    }
  }
  return null;
}

/**
 * Rotate a direction by a number of 90-degree clockwise steps
 */
export function rotateDirection(dir: Direction, rotation: number): Direction {
  const dirs: Direction[] = ['right', 'down', 'left', 'up'];
  const idx = dirs.indexOf(dir);
  return dirs[(((idx + rotation) % 4) + 4) % 4];
}

/**
 * Get the opposite direction
 */
export function oppositeDirection(dir: Direction): Direction {
  const opposites: Record<Direction, Direction> = {
    right: 'left',
    left: 'right',
    up: 'down',
    down: 'up',
  };
  return opposites[dir];
}

/**
 * Check if player can afford a multi-resource cost
 */
export function canAfford(resources: PlayerResources, cost: Partial<PlayerResources>): boolean {
  for (const [key, amount] of Object.entries(cost)) {
    if (amount && resources[key as keyof PlayerResources] < amount) {
      return false;
    }
  }
  return true;
}

/**
 * Deduct a multi-resource cost from player resources
 */
export function deductCost(resources: PlayerResources, cost: Partial<PlayerResources>): void {
  for (const [key, amount] of Object.entries(cost)) {
    if (amount) {
      const k = key as keyof PlayerResources;
      resources[k] -= amount;
    }
  }
}

/**
 * Get a display string for what's at a given cursor position.
 * Returns building name (with recipe), terrain name (with pool info), or null.
 */
export function getCursorInfo(
  building: Building | null,
  terrain: TerrainType,
  patch: ResourcePatch | null
): string | null {
  if (building) {
    const name = building.type
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    let recipeName: string | null = null;
    if (building.selectedRecipe) {
      const recipe =
        building.type === 'arcane_study'
          ? getResearchRecipe(building.selectedRecipe)
          : building.type === 'workbench'
            ? getRecipe(building.selectedRecipe)
            : null;
      recipeName = recipe?.name ?? null;
    }
    return recipeName ? `${name}: ${recipeName}` : name;
  }

  if (terrain !== 'empty') {
    const displayName = TERRAIN_DISPLAY_NAMES[terrain];
    if (patch) {
      return `${displayName} (${patch.remainingPool}/${patch.totalPool})`;
    }
    return displayName;
  }

  return null;
}

/** Resource keys on PlayerResources */
const RESOURCE_KEYS: Set<string> = new Set(['stone', 'wood', 'iron', 'clay', 'crystal_shard']);

/**
 * Add an amount to the matching PlayerResources field.
 * Silently ignores items that aren't player resources (e.g. arcane_ingot).
 */
export function addPlayerResource(resources: PlayerResources, item: string, amount: number): void {
  if (RESOURCE_KEYS.has(item)) {
    resources[item as keyof PlayerResources] += amount;
  }
}
