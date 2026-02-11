import { BuildingDefinition, BuildingType } from '../types';

export const BUILDING_DEFINITIONS: Record<BuildingType, BuildingDefinition> = {
  quarry: {
    type: 'quarry',
    width: 2,
    height: 2,
    powerCost: 2,
    inputSides: [], // Quarries don't take items, they extract from terrain
    outputSides: ['right'],
    inputBufferSize: 0,
    outputBufferSize: 5,
  },
  forge: {
    type: 'forge',
    width: 2,
    height: 2,
    powerCost: 3,
    inputSides: ['left'],
    outputSides: ['right'],
    inputBufferSize: 10,
    outputBufferSize: 5,
  },
  workbench: {
    type: 'workbench',
    width: 2,
    height: 2,
    powerCost: 4,
    inputSides: ['left', 'up'],
    outputSides: ['right'],
    inputBufferSize: 10,
    outputBufferSize: 5,
  },
  chest: {
    type: 'chest',
    width: 1,
    height: 1,
    powerCost: 0,
    inputSides: ['up', 'down', 'left', 'right'],
    outputSides: ['up', 'down', 'left', 'right'],
    inputBufferSize: 50,
    outputBufferSize: 50, // Chest input/output buffers have same size
  },
  arcane_study: {
    type: 'arcane_study',
    width: 2,
    height: 2,
    powerCost: 3,
    inputSides: ['left', 'up'],
    outputSides: [],
    inputBufferSize: 10,
    outputBufferSize: 0, // RP is a meta-resource, not a physical item
  },
};
