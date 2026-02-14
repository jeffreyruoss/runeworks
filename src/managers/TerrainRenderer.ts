import Phaser from 'phaser';
import { TILE_SIZE, GRID_WIDTH, GRID_HEIGHT } from '../config';
import { TerrainType } from '../types';

/** Map terrain types to atlas frame names */
const TERRAIN_FRAME: Record<TerrainType, string> = {
  empty: 'ground',
  arcstone: 'arcstone_vein',
  sunite: 'sunite_vein',
  stone: 'stone_terrain',
  iron: 'iron_terrain',
  forest: 'forest_terrain',
  clay: 'clay_terrain',
  crystal_shard: 'crystal_shard_terrain',
};

/**
 * Renders terrain features (resource patches) and the grid overlay.
 * Uses sprite tiles from the AI-generated atlas.
 */
export class TerrainRenderer {
  private terrainSprites: Phaser.GameObjects.Sprite[][];
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Initialize empty sprite grid
    this.terrainSprites = Array.from({ length: GRID_HEIGHT }, () =>
      Array.from({ length: GRID_WIDTH }, () => null as unknown as Phaser.GameObjects.Sprite)
    );
  }

  drawTerrain(getTerrain: (x: number, y: number) => TerrainType): void {
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const terrain = getTerrain(x, y);
        const frame = TERRAIN_FRAME[terrain];

        if (this.terrainSprites[y][x]) {
          // Update existing sprite's frame
          this.terrainSprites[y][x].setFrame(frame);
        } else {
          // Create new sprite
          const sprite = this.scene.add.sprite(
            x * TILE_SIZE + TILE_SIZE / 2,
            y * TILE_SIZE + TILE_SIZE / 2,
            'sprites',
            frame
          );
          sprite.setDisplaySize(TILE_SIZE, TILE_SIZE);
          sprite.setDepth(0);
          this.terrainSprites[y][x] = sprite;
        }
      }
    }
  }
}
