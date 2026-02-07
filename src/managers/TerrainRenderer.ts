import Phaser from 'phaser';
import { TILE_SIZE, GRID_WIDTH, GRID_HEIGHT, COLORS } from '../config';
import { TerrainType } from '../types';
import { TERRAIN_COLORS } from '../data/terrain';

/**
 * Renders terrain features (resource patches) and the grid overlay.
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
        if (terrain === 'empty') {
          this.drawGround(x, y);
        } else {
          this.drawTerrainTile(terrain, x, y);
        }
      }
    }
  }

  /** Simple hash for deterministic per-tile variation */
  private tileHash(x: number, y: number): number {
    let h = (x * 374761393 + y * 668265263) | 0;
    h = (h ^ (h >> 13)) * 1274126177;
    return (h ^ (h >> 16)) >>> 0;
  }

  private drawGround(x: number, y: number): void {
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;
    const h = this.tileHash(x, y);

    // Dark grass base with slight per-tile variation
    const bases = [0x1a3a1a, 0x1b3b1a, 0x193819, 0x1a391b];
    this.terrainGraphics.fillStyle(bases[h & 3], 1);
    this.terrainGraphics.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // Grass blades — short 1px-wide vertical strokes at deterministic positions
    const bladeColor = [0x2a5a2a, 0x286028, 0x245524][h % 3];
    this.terrainGraphics.fillStyle(bladeColor, 0.7);

    const bx1 = ((h >> 2) % 12) + 2;
    const by1 = ((h >> 5) % 6) + 8;
    this.terrainGraphics.fillRect(px + bx1, py + by1, 1, 3);

    const bx2 = ((h >> 8) % 10) + 3;
    const by2 = ((h >> 11) % 7) + 6;
    this.terrainGraphics.fillRect(px + bx2, py + by2, 1, 2);

    const bx3 = ((h >> 14) % 11) + 2;
    const by3 = ((h >> 17) % 5) + 9;
    this.terrainGraphics.fillRect(px + bx3, py + by3, 1, 3);

    // Lighter grass highlight on ~half of tiles
    if (h & 0x100000) {
      this.terrainGraphics.fillStyle(0x3a6a3a, 0.4);
      const hx = ((h >> 21) % 10) + 3;
      const hy = ((h >> 24) % 8) + 5;
      this.terrainGraphics.fillRect(px + hx, py + hy, 1, 2);
    }
  }

  private drawTerrainTile(terrain: Exclude<TerrainType, 'empty'>, x: number, y: number): void {
    const colors = TERRAIN_COLORS[terrain];
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;

    // Base fill
    this.terrainGraphics.fillStyle(colors.base, 1);
    this.terrainGraphics.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // Per-terrain highlight pattern
    switch (terrain) {
      case 'arcstone':
        this.drawArcstonePattern(px, py, colors.highlight);
        break;
      case 'sunite':
        this.drawSunitePattern(px, py, colors.highlight);
        break;
      case 'stone':
        this.drawStonePattern(px, py, colors.highlight);
        break;
      case 'iron':
        this.drawIronPattern(px, py, colors.highlight);
        break;
      case 'forest':
        this.drawForestPattern(px, py, colors.highlight);
        break;
      case 'clay':
        this.drawClayPattern(px, py, colors.highlight);
        break;
      case 'crystal_shard':
        this.drawCrystalShardPattern(px, py, colors.highlight);
        break;
    }
  }

  private drawArcstonePattern(px: number, py: number, highlight: number): void {
    // Diagonal crystal facets
    this.terrainGraphics.lineStyle(1, highlight, 0.5);
    for (let i = 0; i < TILE_SIZE; i += 4) {
      this.terrainGraphics.lineBetween(px + i, py, px, py + i);
      this.terrainGraphics.lineBetween(px + TILE_SIZE, py + i, px + i, py + TILE_SIZE);
    }
  }

  private drawSunitePattern(px: number, py: number, highlight: number): void {
    // Radiant center dot
    this.terrainGraphics.fillStyle(highlight, 0.6);
    this.terrainGraphics.fillCircle(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 2);
  }

  private drawStonePattern(px: number, py: number, highlight: number): void {
    // Angular rock chunks
    this.terrainGraphics.fillStyle(highlight, 0.7);
    this.terrainGraphics.fillRect(px + 2, py + 3, 5, 4);
    this.terrainGraphics.fillRect(px + 8, py + 7, 6, 5);
    this.terrainGraphics.fillRect(px + 4, py + 10, 4, 3);
  }

  private drawIronPattern(px: number, py: number, highlight: number): void {
    // Metallic diagonal streaks
    this.terrainGraphics.lineStyle(1, highlight, 0.6);
    this.terrainGraphics.lineBetween(px + 2, py + 2, px + 6, py + 6);
    this.terrainGraphics.lineBetween(px + 8, py + 4, px + 12, py + 8);
    this.terrainGraphics.lineBetween(px + 4, py + 10, px + 10, py + 14);
  }

  private drawForestPattern(px: number, py: number, highlight: number): void {
    // Tree/leaf dot clusters
    this.terrainGraphics.fillStyle(highlight, 0.7);
    this.terrainGraphics.fillCircle(px + 4, py + 4, 2);
    this.terrainGraphics.fillCircle(px + 11, py + 6, 2);
    this.terrainGraphics.fillCircle(px + 7, py + 12, 2);
  }

  private drawClayPattern(px: number, py: number, highlight: number): void {
    // Horizontal wavy lines
    this.terrainGraphics.lineStyle(1, highlight, 0.5);
    this.terrainGraphics.lineBetween(px + 1, py + 4, px + 14, py + 5);
    this.terrainGraphics.lineBetween(px + 2, py + 8, px + 13, py + 9);
    this.terrainGraphics.lineBetween(px + 1, py + 12, px + 14, py + 13);
  }

  private drawCrystalShardPattern(px: number, py: number, highlight: number): void {
    // Sparkle/star pattern
    this.terrainGraphics.lineStyle(1, highlight, 0.8);
    const cx = px + TILE_SIZE / 2;
    const cy = py + TILE_SIZE / 2;
    this.terrainGraphics.lineBetween(cx - 3, cy, cx + 3, cy);
    this.terrainGraphics.lineBetween(cx, cy - 3, cx, cy + 3);
    this.terrainGraphics.lineBetween(cx - 2, cy - 2, cx + 2, cy + 2);
    this.terrainGraphics.lineBetween(cx + 2, cy - 2, cx - 2, cy + 2);
  }
}
