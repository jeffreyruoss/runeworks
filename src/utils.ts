import { ItemType, Direction } from './types';

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
 * Rotate a direction by a number of 90-degree clockwise steps
 */
export function rotateDirection(dir: Direction, rotation: number): Direction {
  const dirs: Direction[] = ['right', 'down', 'left', 'up'];
  const idx = dirs.indexOf(dir);
  return dirs[(idx + rotation) % 4];
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
