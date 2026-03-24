import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { ModeSelectScene } from './scenes/ModeSelectScene';
import { LoadingScene } from './scenes/LoadingScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { PixuiDemoScene } from './scenes/PixuiDemoScene';
import { COLORS } from './config';
import { updateLayout } from './layout';
import { initDevTools } from './dev/devPanel';

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
  scene: [BootScene, ModeSelectScene, LoadingScene, GameScene, UIScene, PixuiDemoScene],
};

updateLayout(window.innerWidth * dpr, window.innerHeight * dpr);

const game = new Phaser.Game(config);
initDevTools(game);

window.addEventListener('resize', () => {
  const w = window.innerWidth * dpr;
  const h = window.innerHeight * dpr;
  updateLayout(w, h);
  game.scale.resize(w, h);
});
