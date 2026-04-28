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

const MAX_CSS_WIDTH = 1920;
const MAX_CSS_HEIGHT = 1080;

function getViewportSize(): { w: number; h: number } {
  const cssW = Math.min(window.innerWidth, MAX_CSS_WIDTH);
  const cssH = Math.min(window.innerHeight, MAX_CSS_HEIGHT);
  return { w: cssW * dpr, h: cssH * dpr };
}

const { w: initialW, h: initialH } = getViewportSize();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: initialW,
  height: initialH,
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

updateLayout(initialW, initialH);

const game = new Phaser.Game(config);
initDevTools(game);

window.addEventListener('resize', () => {
  const { w, h } = getViewportSize();
  updateLayout(w, h);
  game.scale.resize(w, h);
});
