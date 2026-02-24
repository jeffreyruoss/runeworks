import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config';
import { makeText } from '../phaser-utils';

/**
 * Bottom-center overlay that displays tutorial instruction text.
 * Shown only during tutorial mode. Caches text to avoid per-frame recreation.
 */
export class TutorialOverlay {
  private container: Phaser.GameObjects.Container;
  private textObjects: Phaser.GameObjects.Text[] = [];
  private scene: Phaser.Scene;
  private currentKey: string | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
    this.container.setDepth(900);
    this.container.setVisible(false);

    // Background
    const bg = scene.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRect(-200, -30, 400, 60);
    bg.lineStyle(1, 0x00ff00, 0.5);
    bg.strokeRect(-200, -30, 400, 60);
    this.container.add(bg);
  }

  /**
   * Update the overlay with tutorial text lines, or hide if null.
   * Skips recreation if the text hasn't changed.
   */
  update(lines: string[] | null): void {
    if (!lines || lines.length === 0) {
      this.container.setVisible(false);
      this.currentKey = null;
      return;
    }

    this.container.setVisible(true);

    // Cache check: skip if text is unchanged
    const key = lines.join('\n');
    if (key === this.currentKey) return;
    this.currentKey = key;

    // Destroy old text objects
    for (const t of this.textObjects) {
      t.destroy();
    }
    this.textObjects = [];

    // Create new text lines
    const lineHeight = 12;
    const startY = -((lines.length - 1) * lineHeight) / 2;

    for (let i = 0; i < lines.length; i++) {
      const t = makeText(this.scene, 0, startY + i * lineHeight, lines[i], {
        fontSize: '9px',
        color: i === 0 ? '#00ff00' : '#aaaaaa',
      });
      t.setOrigin(0.5, 0.5);
      this.container.add(t);
      this.textObjects.push(t);
    }
  }
}
