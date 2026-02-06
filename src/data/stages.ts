import { ItemType } from '../types';

export interface Objective {
  item: ItemType;
  count: number;
}

export interface Stage {
  id: number;
  name: string;
  objectives: Objective[];
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
  { id: 5, name: 'Cog Works', objectives: [{ item: 'cogwheel', count: 3 }] },
  { id: 6, name: 'Thread Spinning', objectives: [{ item: 'thread', count: 8 }] },
  {
    id: 7,
    name: 'Mixed Production',
    objectives: [
      { item: 'cogwheel', count: 5 },
      { item: 'thread', count: 10 },
    ],
  },
  { id: 8, name: 'First Rune', objectives: [{ item: 'rune', count: 1 }] },
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
  return STAGES.find((s) => s.id === id);
}
