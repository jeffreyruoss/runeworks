import { getBufferTotal, rotateDirection, oppositeDirection } from '../../src/utils';
import type { ItemType, Direction } from '../../src/types';

describe('getBufferTotal', () => {
  it('returns 0 for an empty buffer', () => {
    const buffer = new Map<ItemType, number>();
    expect(getBufferTotal(buffer)).toBe(0);
  });

  it('returns the count for a single item type', () => {
    const buffer = new Map<ItemType, number>([['arcstone', 5]]);
    expect(getBufferTotal(buffer)).toBe(5);
  });

  it('returns the sum for multiple item types', () => {
    const buffer = new Map<ItemType, number>([
      ['arcstone', 3],
      ['sunite', 7],
      ['arcane_ingot', 2],
    ]);
    expect(getBufferTotal(buffer)).toBe(12);
  });

  it('handles items with zero count', () => {
    const buffer = new Map<ItemType, number>([
      ['arcstone', 0],
      ['sunite', 4],
    ]);
    expect(getBufferTotal(buffer)).toBe(4);
  });

  it('handles all item types present', () => {
    const buffer = new Map<ItemType, number>([
      ['arcstone', 1],
      ['sunite', 1],
      ['arcane_ingot', 1],
      ['sun_ingot', 1],
      ['cogwheel', 1],
      ['thread', 1],
      ['rune', 1],
    ]);
    expect(getBufferTotal(buffer)).toBe(7);
  });
});

describe('rotateDirection', () => {
  const directions: Direction[] = ['right', 'down', 'left', 'up'];

  it('returns the same direction for rotation 0', () => {
    for (const dir of directions) {
      expect(rotateDirection(dir, 0)).toBe(dir);
    }
  });

  it('rotates by 1 step (90 degrees clockwise)', () => {
    expect(rotateDirection('right', 1)).toBe('down');
    expect(rotateDirection('down', 1)).toBe('left');
    expect(rotateDirection('left', 1)).toBe('up');
    expect(rotateDirection('up', 1)).toBe('right');
  });

  it('rotates by 2 steps (180 degrees)', () => {
    expect(rotateDirection('right', 2)).toBe('left');
    expect(rotateDirection('down', 2)).toBe('up');
    expect(rotateDirection('left', 2)).toBe('right');
    expect(rotateDirection('up', 2)).toBe('down');
  });

  it('rotates by 3 steps (270 degrees clockwise)', () => {
    expect(rotateDirection('right', 3)).toBe('up');
    expect(rotateDirection('down', 3)).toBe('right');
    expect(rotateDirection('left', 3)).toBe('down');
    expect(rotateDirection('up', 3)).toBe('left');
  });

  it('returns to original after full rotation (4 steps)', () => {
    for (const dir of directions) {
      expect(rotateDirection(dir, 4)).toBe(dir);
    }
  });

  it('handles rotations greater than 4 via modular wrapping', () => {
    expect(rotateDirection('right', 5)).toBe('down');
    expect(rotateDirection('right', 8)).toBe('right');
    expect(rotateDirection('up', 7)).toBe('left');
  });
});

describe('oppositeDirection', () => {
  it('returns left for right', () => {
    expect(oppositeDirection('right')).toBe('left');
  });

  it('returns right for left', () => {
    expect(oppositeDirection('left')).toBe('right');
  });

  it('returns down for up', () => {
    expect(oppositeDirection('up')).toBe('down');
  });

  it('returns up for down', () => {
    expect(oppositeDirection('down')).toBe('up');
  });

  it('is its own inverse for all directions', () => {
    const directions: Direction[] = ['right', 'down', 'left', 'up'];
    for (const dir of directions) {
      expect(oppositeDirection(oppositeDirection(dir))).toBe(dir);
    }
  });
});
