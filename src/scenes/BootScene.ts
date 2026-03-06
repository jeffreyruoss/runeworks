import { ResponsiveScene, ConstraintMode } from 'phaser-pixui';
import { CANVAS_WIDTH, CANVAS_HEIGHT, THEME } from '../config';

export class BootScene extends ResponsiveScene {
  constructor() {
    super({
      key: 'BootScene',
      viewportConstraints: {
        mode: ConstraintMode.Minimum,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      },
    });
  }

  preload(): void {
    const width = CANVAS_WIDTH;
    const height = CANVAS_HEIGHT;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(THEME.boot.progressBox, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(THEME.boot.progressBar, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
    });

    // Load spritesheet atlas
    this.load.atlas(
      'sprites',
      'assets/sprites/ai-out/spritesheet.png',
      'assets/sprites/ai-out/spritesheet.json'
    );
  }

  create(): void {
    super.create();
    this.scene.start('ModeSelectScene');
  }
}
