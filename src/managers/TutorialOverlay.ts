import Phaser from 'phaser';
import { THEME } from '../config';
import { FONT_SM } from '../ui-theme';

/**
 * Bottom-center overlay that displays tutorial instruction text.
 * Shown only during tutorial mode. Caches text to avoid per-frame recreation.
 */
export class TutorialOverlay {
  private container: Phaser.GameObjects.Container;
  private textObjects: Phaser.GameObjects.BitmapText[] = [];
  private scene: Phaser.Scene;
  private currentKey: string | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const vp = (scene as any).viewport as { width: number; height: number };
    this.container = scene.add.container(Math.floor(vp.width / 2), vp.height - 80);
    this.container.setDepth(900);
    this.container.setVisible(false);

    // Background
    const bg = scene.add.graphics();
    bg.fillStyle(THEME.panel.bg, 0.8);
    bg.fillRect(-200, -30, 400, 60);
    bg.lineStyle(1, THEME.tutorial.border, 0.5);
    bg.strokeRect(-200, -30, 400, 60);
    this.container.add(bg);
  }

  update(lines: string[] | null): void {
    if (!lines || lines.length === 0) {
      this.container.setVisible(false);
      this.currentKey = null;
      return;
    }

    this.container.setVisible(true);

    const key = lines.join('\n');
    if (key === this.currentKey) return;
    this.currentKey = key;

    for (const t of this.textObjects) t.destroy();
    this.textObjects = [];

    const lineHeight = 14;
    const startY = -((lines.length - 1) * lineHeight) / 2;

    for (let i = 0; i < lines.length; i++) {
      const t = this.scene.add.bitmapText(0, startY + i * lineHeight, FONT_SM, lines[i]);
      t.setOrigin(0.5, 0.5);
      t.setTint(i === 0 ? 0x4af0ff : 0xb0a8c0);
      this.container.add(t);
      this.textObjects.push(t);
    }
  }
}
