import Phaser from 'phaser';
import { THEME } from '../config';
import { FONT_SM, C } from '../ui-theme';
import { getViewport } from '../utils';

const LINE_H = 14;
const PAD_X = 16;
const PAD_Y = 10;

/**
 * Bottom-center overlay that displays tutorial instruction and objective text.
 * Dynamically sizes to fit content. Caches text to avoid per-frame recreation.
 */
export class TutorialOverlay {
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Graphics;
  private textObjects: Phaser.GameObjects.BitmapText[] = [];
  private scene: Phaser.Scene;
  private currentKey: string | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const vp = getViewport(scene);
    this.container = scene.add.container(Math.floor(vp.width / 2), 0);
    this.container.setDepth(900);
    this.container.setVisible(false);

    this.bg = scene.add.graphics();
    this.container.add(this.bg);
  }

  update(lines: string[] | null): void {
    if (!lines || lines.length === 0) {
      this.container.setVisible(false);
      this.currentKey = null;
      return;
    }

    this.container.setVisible(true);

    const key = lines.join('\n');

    // Always reposition container (viewport may have changed on resize)
    const vp = getViewport(this.scene);
    const boxH = lines.length * LINE_H + PAD_Y * 2;
    this.container.setPosition(Math.floor(vp.width / 2), vp.height - 32 - boxH / 2);

    if (key === this.currentKey) return;
    this.currentKey = key;

    for (const t of this.textObjects) t.destroy();
    this.textObjects = [];

    // Create text objects and add to container immediately (avoids 1-frame flash at world origin)
    const texts: Phaser.GameObjects.BitmapText[] = [];
    for (let i = 0; i < lines.length; i++) {
      const t = this.scene.add.bitmapText(0, 0, FONT_SM, lines[i]);
      this.container.add(t);
      t.setOrigin(0.5, 0.5);
      // First line cyan, objective lines ([x]/[ ]) green/grey, rest muted
      if (i === 0) {
        t.setTint(C.active);
      } else if (lines[i].startsWith('[x]')) {
        t.setTint(C.valid);
      } else if (lines[i].startsWith('[ ]')) {
        t.setTint(C.light);
      } else {
        t.setTint(C.secondary);
      }
      texts.push(t);
    }

    // Measure widest line
    let maxW = 0;
    for (const t of texts) maxW = Math.max(maxW, t.width);

    const boxW = maxW + PAD_X * 2;

    // Draw background
    this.bg.clear();
    this.bg.fillStyle(THEME.panel.bg, 0.85);
    this.bg.fillRect(-boxW / 2, -boxH / 2, boxW, boxH);
    this.bg.lineStyle(1, THEME.tutorial.border, 0.5);
    this.bg.strokeRect(-boxW / 2, -boxH / 2, boxW, boxH);

    // Position text lines
    const startY = -((lines.length - 1) * LINE_H) / 2;
    for (let i = 0; i < texts.length; i++) {
      texts[i].setPosition(0, startY + i * LINE_H);
    }
    this.textObjects = texts;
  }
}
