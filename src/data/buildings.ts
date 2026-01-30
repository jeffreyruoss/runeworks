import { BuildingDefinition, BuildingType } from '../types';

export const BUILDING_DEFINITIONS: Record<BuildingType, BuildingDefinition> = {
  miner: {
    type: 'miner',
    width: 2,
    height: 2,
    powerCost: 2,
    inputSides: [], // Miners don't take items, they extract from terrain
    outputSides: ['right'],
    inputBufferSize: 0,
    outputBufferSize: 5,
  },
  furnace: {
    type: 'furnace',
    width: 2,
    height: 2,
    powerCost: 3,
    inputSides: ['left'],
    outputSides: ['right'],
    inputBufferSize: 10,
    outputBufferSize: 5,
  },
  assembler: {
    type: 'assembler',
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
    outputBufferSize: 50, // Chest uses same buffer for both
  },
};
