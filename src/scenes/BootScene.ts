import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, THEME } from '../config';
import { makeText, setupCamera } from '../phaser-utils';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    setupCamera(this);

    const width = CANVAS_WIDTH;
    const height = CANVAS_HEIGHT;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(THEME.boot.progressBox, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = makeText(this, width / 2, height / 2 - 50, 'Loading...', {
      fontSize: '16px',
      color: THEME.text.primary,
    });
    loadingText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(THEME.boot.progressBar, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Load spritesheet atlas
    this.load.atlas(
      'sprites',
      'assets/sprites/ai-out/spritesheet.png',
      'assets/sprites/ai-out/spritesheet.json'
    );
  }

  create(): void {
    this.scene.start('ModeSelectScene');
  }
}
