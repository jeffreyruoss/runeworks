import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { ModeSelectScene } from './scenes/ModeSelectScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { COLORS } from './config';

const dpr = window.devicePixelRatio || 1;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth * dpr,
  height: window.innerHeight * dpr,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: COLORS.background,
  scale: {
    mode: Phaser.Scale.NONE,
    zoom: 1 / dpr,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, ModeSelectScene, GameScene, UIScene],
};

const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth * dpr, window.innerHeight * dpr);
});
