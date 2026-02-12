import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, DEFAULT_ZOOM } from '../config';
import { makeText } from '../utils';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Zoom camera so world coords stay at 640x400
    this.cameras.main.setZoom(DEFAULT_ZOOM);
    this.cameras.main.setBounds(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.cameras.main.centerOn(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

    const width = CANVAS_WIDTH;
    const height = CANVAS_HEIGHT;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = makeText(this, width / 2, height / 2 - 50, 'Loading...', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
    });
    loadingText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x00ff00, 1);
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
      'assets/sprites/out/spritesheet.png',
      'assets/sprites/out/spritesheet.json'
    );
  }

  create(): void {
    // Start the game scene and UI scene in parallel
    this.scene.start('GameScene');
    this.scene.start('UIScene');
  }
}
