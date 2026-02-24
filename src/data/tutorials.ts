import { BuildingType, ItemType, PlayerResources } from '../types';
import { PatchDef } from '../terrain/terrainSetup';

export interface TutorialStage {
  id: number;
  name: string;
  instructionText: string[];
  objectives: Array<{ item: ItemType; count: number }>;
  unlockedBuildings: BuildingType[];
  terrainLayout: PatchDef[];
  startingResources?: Partial<PlayerResources>;
}

export const TUTORIALS: TutorialStage[] = [
  {
    id: 1,
    name: 'Movement & Gathering',
    instructionText: [
      'Welcome to Runeworks!',
      'Use ESDF to move the cursor.',
      'Move to a stone tile and press Space to gather.',
      'Gather 5 stone to continue.',
    ],
    objectives: [{ item: 'stone', count: 5 }],
    unlockedBuildings: [],
    terrainLayout: [{ type: 'stone', cx: 20, cy: 12, size: 20, pool: 100 }],
  },
  {
    id: 2,
    name: 'Multi-Resource Gathering',
    instructionText: [
      'Resources come in many types.',
      'Gather both stone and wood.',
      'Move to the green forest tiles for wood.',
      'Gather 5 stone and 5 wood to continue.',
    ],
    objectives: [
      { item: 'stone', count: 5 },
      { item: 'wood', count: 5 },
    ],
    unlockedBuildings: [],
    terrainLayout: [
      { type: 'stone', cx: 15, cy: 12, size: 15, pool: 100 },
      { type: 'forest', cx: 25, cy: 12, size: 15, pool: 100 },
    ],
  },
  {
    id: 3,
    name: 'First Building',
    instructionText: [
      'Press B for build menu, then Q to select Quarry.',
      'Place it on arcstone with Space. R rotates.',
      'X cancels selection. X on a building deconstructs it.',
      'Let the quarry produce 3 arcstone.',
    ],
    objectives: [{ item: 'arcstone', count: 3 }],
    unlockedBuildings: ['quarry'],
    terrainLayout: [
      { type: 'arcstone', cx: 20, cy: 12, size: 20, pool: 200 },
      { type: 'stone', cx: 10, cy: 8, size: 10, pool: 100 },
      { type: 'forest', cx: 30, cy: 8, size: 10, pool: 100 },
    ],
    startingResources: { stone: 20, wood: 20 },
  },
  {
    id: 4,
    name: 'Rotation & Transfer',
    instructionText: [
      'Buildings transfer items to adjacent buildings.',
      'Use R to rotate before placing.',
      "Point a Quarry's output toward a Forge's input.",
      'Produce 1 arcane ingot to continue.',
    ],
    objectives: [{ item: 'arcane_ingot', count: 1 }],
    unlockedBuildings: ['quarry', 'forge'],
    terrainLayout: [
      { type: 'arcstone', cx: 16, cy: 12, size: 25, pool: 500 },
      { type: 'stone', cx: 8, cy: 6, size: 10, pool: 100 },
      { type: 'forest', cx: 32, cy: 6, size: 10, pool: 100 },
    ],
    startingResources: { stone: 30, wood: 20, iron: 10 },
  },
  {
    id: 5,
    name: 'Crafting',
    instructionText: [
      'Workbenches craft advanced items from ingots.',
      'Build: Quarry -> Forge -> Workbench.',
      'Use C on a workbench to cycle recipes.',
      'Produce 1 cogwheel to complete the tutorial!',
    ],
    objectives: [{ item: 'cogwheel', count: 1 }],
    unlockedBuildings: ['quarry', 'forge', 'workbench', 'chest'],
    terrainLayout: [
      { type: 'arcstone', cx: 12, cy: 12, size: 25, pool: 500 },
      { type: 'stone', cx: 6, cy: 5, size: 10, pool: 100 },
      { type: 'forest', cx: 34, cy: 5, size: 10, pool: 100 },
      { type: 'iron', cx: 30, cy: 18, size: 10, pool: 100 },
    ],
    startingResources: { stone: 40, wood: 30, iron: 15 },
  },
];

export function getTutorialStage(id: number): TutorialStage | undefined {
  return TUTORIALS.find((t) => t.id === id);
}
