import { ItemType } from '../types';

/**
 * Research recipes define what the Arcane Study building can consume
 * to produce Research Points (RP).
 */
export interface ResearchRecipe {
  id: string;
  name: string;
  input: ItemType;
  inputCount: number;
  craftTimeTicks: number;
  rpYield: number;
}

export const RESEARCH_RECIPES: ResearchRecipe[] = [
  {
    id: 'study_arcane_ingot',
    name: 'Study Arcane Ingot',
    input: 'arcane_ingot',
    inputCount: 1,
    craftTimeTicks: 40,
    rpYield: 2,
  },
  {
    id: 'study_sun_ingot',
    name: 'Study Sun Ingot',
    input: 'sun_ingot',
    inputCount: 1,
    craftTimeTicks: 40,
    rpYield: 2,
  },
  {
    id: 'study_cogwheel',
    name: 'Study Cogwheel',
    input: 'cogwheel',
    inputCount: 1,
    craftTimeTicks: 30,
    rpYield: 5,
  },
  {
    id: 'study_rune',
    name: 'Study Rune',
    input: 'rune',
    inputCount: 1,
    craftTimeTicks: 60,
    rpYield: 12,
  },
];

export function getResearchRecipe(id: string): ResearchRecipe | undefined {
  return RESEARCH_RECIPES.find((r) => r.id === id);
}

export type ResearchBranch = 'buildings' | 'recipes' | 'upgrades';

export type ResearchEffect =
  | { type: 'unlock_building'; building: string }
  | { type: 'unlock_recipe'; recipe: string }
  | { type: 'buffer_expansion'; amount: number }
  | { type: 'overclock'; craftTimeMultiplier: number };

export interface ResearchNode {
  id: string;
  name: string;
  branch: ResearchBranch;
  cost: number;
  requires: string | null;
  effect: ResearchEffect;
}

// NOTE: These nodes reference buildings/recipes that don't exist yet (splitter, merger,
// advanced_forge, quick_smelt, bulk_processing). When adding those, ensure they're wired
// to the research gating in ResearchManager.isBuildingUnlocked/isRecipeUnlocked.
export const RESEARCH_NODES: ResearchNode[] = [
  // Buildings branch
  {
    id: 'splitter',
    name: 'Splitter',
    branch: 'buildings',
    cost: 10,
    requires: null,
    effect: { type: 'unlock_building', building: 'splitter' },
  },
  {
    id: 'merger',
    name: 'Merger',
    branch: 'buildings',
    cost: 15,
    requires: 'splitter',
    effect: { type: 'unlock_building', building: 'merger' },
  },
  {
    id: 'advanced_forge',
    name: 'Advanced Forge',
    branch: 'buildings',
    cost: 25,
    requires: 'merger',
    effect: { type: 'unlock_building', building: 'advanced_forge' },
  },

  // Recipes branch
  {
    id: 'quick_smelt',
    name: 'Quick Smelt',
    branch: 'recipes',
    cost: 8,
    requires: null,
    effect: { type: 'unlock_recipe', recipe: 'quick_smelt' },
  },
  {
    id: 'bulk_processing',
    name: 'Bulk Processing',
    branch: 'recipes',
    cost: 20,
    requires: 'quick_smelt',
    effect: { type: 'unlock_recipe', recipe: 'bulk_processing' },
  },

  // Upgrades branch
  {
    id: 'buffer_expansion',
    name: 'Buffer Expansion',
    branch: 'upgrades',
    cost: 12,
    requires: null,
    effect: { type: 'buffer_expansion', amount: 5 },
  },
  {
    id: 'overclock',
    name: 'Overclock',
    branch: 'upgrades',
    cost: 30,
    requires: 'buffer_expansion',
    effect: { type: 'overclock', craftTimeMultiplier: 0.8 },
  },
];

export function getResearchNode(id: string): ResearchNode | undefined {
  return RESEARCH_NODES.find((n) => n.id === id);
}
