import Phaser from 'phaser';
import { TILE_SIZE, GRID_WIDTH, GRID_HEIGHT, COLORS } from '../config';
import { TerrainType } from '../types';

/**
 * Renders terrain features (crystal veins, stone deposits) and the grid overlay.
 * Receives a terrain getter function to decouple from Simulation internals.
 */
export class TerrainRenderer {
  private terrainGraphics: Phaser.GameObjects.Graphics;
  private gridGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.terrainGraphics = scene.add.graphics();
    this.terrainGraphics.setDepth(0);

    this.gridGraphics = scene.add.graphics();
    this.gridGraphics.setDepth(1);
  }

  drawGrid(): void {
    this.gridGraphics.clear();
    this.gridGraphics.lineStyle(1, COLORS.gridLine, 0.3);

    for (let x = 0; x <= GRID_WIDTH; x++) {
      this.gridGraphics.moveTo(x * TILE_SIZE, 0);
      this.gridGraphics.lineTo(x * TILE_SIZE, GRID_HEIGHT * TILE_SIZE);
    }

    for (let y = 0; y <= GRID_HEIGHT; y++) {
      this.gridGraphics.moveTo(0, y * TILE_SIZE);
      this.gridGraphics.lineTo(GRID_WIDTH * TILE_SIZE, y * TILE_SIZE);
    }

    this.gridGraphics.strokePath();
  }

  drawTerrain(getTerrain: (x: number, y: number) => TerrainType): void {
    this.terrainGraphics.clear();

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const terrain = getTerrain(x, y);

        if (terrain === 'arcstone') {
          this.drawArcstone(x, y);
        } else if (terrain === 'sunite') {
          this.drawSunite(x, y);
        } else if (terrain === 'stone_deposit') {
          this.drawStoneDeposit(x, y);
        }
      }
    }
  }

  private drawArcstone(x: number, y: number): void {
    this.terrainGraphics.fillStyle(COLORS.arcstoneBase, 1);
    this.terrainGraphics.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

    // Crystal pattern overlay (diagonal facets)
    this.terrainGraphics.lineStyle(1, COLORS.arcstoneHighlight, 0.5);
    for (let i = 0; i < TILE_SIZE; i += 4) {
      this.terrainGraphics.lineBetween(
        x * TILE_SIZE + i,
        y * TILE_SIZE,
        x * TILE_SIZE,
        y * TILE_SIZE + i
      );
      this.terrainGraphics.lineBetween(
        x * TILE_SIZE + TILE_SIZE,
        y * TILE_SIZE + i,
        x * TILE_SIZE + i,
        y * TILE_SIZE + TILE_SIZE
      );
    }
  }

  private drawSunite(x: number, y: number): void {
    this.terrainGraphics.fillStyle(COLORS.suniteBase, 1);
    this.terrainGraphics.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

    // Glowing pattern overlay (radiant dots)
    this.terrainGraphics.fillStyle(COLORS.suniteHighlight, 0.6);
    this.terrainGraphics.fillCircle(
      x * TILE_SIZE + TILE_SIZE / 2,
      y * TILE_SIZE + TILE_SIZE / 2,
      2
    );
  }

  private drawStoneDeposit(x: number, y: number): void {
    this.terrainGraphics.fillStyle(COLORS.stoneDepositBase, 1);
    this.terrainGraphics.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

    // Rock pattern overlay (small angular shapes)
    this.terrainGraphics.fillStyle(COLORS.stoneDepositHighlight, 0.7);
    this.terrainGraphics.fillRect(x * TILE_SIZE + 2, y * TILE_SIZE + 3, 5, 4);
    this.terrainGraphics.fillRect(x * TILE_SIZE + 8, y * TILE_SIZE + 7, 6, 5);
    this.terrainGraphics.fillRect(x * TILE_SIZE + 4, y * TILE_SIZE + 10, 4, 3);
  }
}
