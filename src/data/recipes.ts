import { Recipe, ItemType } from '../types';

/**
 * All recipes in the game
 */
export const RECIPES: Recipe[] = [
  {
    id: 'purify_arcstone',
    name: 'Purify Arcstone',
    inputs: new Map<ItemType, number>([['arcstone', 1]]),
    outputs: new Map<ItemType, number>([['arcane_ingot', 1]]),
    craftTimeTicks: 40, // 2 seconds
    building: 'forge',
  },
  {
    id: 'purify_sunite',
    name: 'Purify Sunite',
    inputs: new Map<ItemType, number>([['sunite', 1]]),
    outputs: new Map<ItemType, number>([['sun_ingot', 1]]),
    craftTimeTicks: 40,
    building: 'forge',
  },
  {
    id: 'forge_cogwheel',
    name: 'Forge Cogwheel',
    inputs: new Map<ItemType, number>([['arcane_ingot', 2]]),
    outputs: new Map<ItemType, number>([['cogwheel', 1]]),
    craftTimeTicks: 30, // 1.5 seconds
    building: 'workbench',
  },
  {
    id: 'spin_thread',
    name: 'Spin Thread',
    inputs: new Map<ItemType, number>([['sun_ingot', 1]]),
    outputs: new Map<ItemType, number>([['thread', 2]]),
    craftTimeTicks: 20, // 1 second
    building: 'workbench',
  },
  {
    id: 'inscribe_rune',
    name: 'Inscribe Rune',
    inputs: new Map<ItemType, number>([
      ['arcane_ingot', 1],
      ['thread', 3],
    ]),
    outputs: new Map<ItemType, number>([['rune', 1]]),
    craftTimeTicks: 60, // 3 seconds
    building: 'workbench',
  },
];

export function getRecipe(id: string): Recipe | undefined {
  return RECIPES.find((r) => r.id === id);
}

export function getRecipesForBuilding(building: 'forge' | 'workbench'): Recipe[] {
  return RECIPES.filter((r) => r.building === building);
}
