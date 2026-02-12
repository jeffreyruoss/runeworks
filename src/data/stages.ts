import { BuildingType, ItemType } from '../types';

export interface Objective {
  item: ItemType;
  count: number;
}

export interface Stage {
  id: number;
  name: string;
  objectives: Objective[];
  unlockedBuildings?: BuildingType[];
}

export const STAGES: Stage[] = [
  { id: 1, name: 'First Ingots', objectives: [{ item: 'arcane_ingot', count: 3 }] },
  { id: 2, name: 'Sun Smelting', objectives: [{ item: 'sun_ingot', count: 3 }] },
  { id: 3, name: 'Ingot Production', objectives: [{ item: 'arcane_ingot', count: 10 }] },
  {
    id: 4,
    name: 'Dual Smelting',
    objectives: [
      { item: 'arcane_ingot', count: 5 },
      { item: 'sun_ingot', count: 5 },
    ],
  },
  {
    id: 5,
    name: 'Cog Works',
    objectives: [{ item: 'cogwheel', count: 3 }],
    unlockedBuildings: ['mana_well'],
  },
  {
    id: 6,
    name: 'Thread Spinning',
    objectives: [{ item: 'thread', count: 8 }],
    unlockedBuildings: ['mana_tower'],
  },
  {
    id: 7,
    name: 'Mixed Production',
    objectives: [
      { item: 'cogwheel', count: 5 },
      { item: 'thread', count: 10 },
    ],
  },
  {
    id: 8,
    name: 'First Rune',
    objectives: [{ item: 'rune', count: 1 }],
    unlockedBuildings: ['mana_obelisk'],
  },
  { id: 9, name: 'Rune Scribe', objectives: [{ item: 'rune', count: 5 }] },
  {
    id: 10,
    name: 'Master Runesmith',
    objectives: [
      { item: 'cogwheel', count: 3 },
      { item: 'thread', count: 6 },
      { item: 'rune', count: 3 },
    ],
  },
];

export function getStage(id: number): Stage | undefined {
  if (id < 1 || id > STAGES.length) return undefined;
  return STAGES[id - 1];
}

export const ITEM_DISPLAY_NAMES: Record<string, string> = {
  arcstone: 'Arcstone',
  sunite: 'Sunite',
  arcane_ingot: 'Arcane Ingot',
  sun_ingot: 'Sun Ingot',
  cogwheel: 'Cogwheel',
  thread: 'Thread',
  rune: 'Rune',
  stone: 'Stone',
  wood: 'Wood',
  iron: 'Iron',
  clay: 'Clay',
  crystal_shard: 'Crystal Shard',
};

export const PRODUCTION_CHAINS: Record<string, string> = {
  arcane_ingot: 'Quarry[Arcstone Vein] -> Forge (purify)',
  sun_ingot: 'Quarry[Sunite Vein] -> Forge (purify)',
  cogwheel: 'Quarry[Arcstone] -> Forge -> Workbench (2 ingots)',
  thread: 'Quarry[Sunite] -> Forge -> Workbench (1 ingot -> 2)',
  rune: '1 Arcane Ingot + 3 Thread -> Workbench',
};
