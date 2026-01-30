import { Recipe, ItemType } from '../types';

/**
 * All recipes in the game
 */
export const RECIPES: Recipe[] = [
  {
    id: 'smelt_iron',
    name: 'Smelt Iron',
    inputs: new Map<ItemType, number>([['iron_ore', 1]]),
    outputs: new Map<ItemType, number>([['iron_plate', 1]]),
    craftTimeTicks: 40, // 2 seconds
    building: 'furnace',
  },
  {
    id: 'smelt_copper',
    name: 'Smelt Copper',
    inputs: new Map<ItemType, number>([['copper_ore', 1]]),
    outputs: new Map<ItemType, number>([['copper_plate', 1]]),
    craftTimeTicks: 40,
    building: 'furnace',
  },
  {
    id: 'craft_gear',
    name: 'Craft Gear',
    inputs: new Map<ItemType, number>([['iron_plate', 2]]),
    outputs: new Map<ItemType, number>([['gear', 1]]),
    craftTimeTicks: 30, // 1.5 seconds
    building: 'assembler',
  },
  {
    id: 'craft_wire',
    name: 'Craft Wire',
    inputs: new Map<ItemType, number>([['copper_plate', 1]]),
    outputs: new Map<ItemType, number>([['wire', 2]]),
    craftTimeTicks: 20, // 1 second
    building: 'assembler',
  },
  {
    id: 'craft_circuit',
    name: 'Craft Circuit',
    inputs: new Map<ItemType, number>([
      ['iron_plate', 1],
      ['wire', 3],
    ]),
    outputs: new Map<ItemType, number>([['circuit', 1]]),
    craftTimeTicks: 60, // 3 seconds
    building: 'assembler',
  },
];

export function getRecipe(id: string): Recipe | undefined {
  return RECIPES.find((r) => r.id === id);
}

export function getRecipesForBuilding(building: 'furnace' | 'assembler'): Recipe[] {
  return RECIPES.filter((r) => r.building === building);
}
