import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { CANVAS_WIDTH, CANVAS_HEIGHT, DEFAULT_ZOOM, COLORS } from './config';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: CANVAS_WIDTH * DEFAULT_ZOOM,
  height: CANVAS_HEIGHT * DEFAULT_ZOOM,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: COLORS.background,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, GameScene, UIScene],
};

new Phaser.Game(config);
