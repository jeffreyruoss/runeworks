import Phaser from 'phaser';
import { ResponsiveScene } from 'phaser-pixui';
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

// phaser-pixui's ResponsiveScene reads window.innerWidth directly to compute
// its viewport zoom. When we cap the canvas at 1920x1080 on larger screens,
// it would otherwise overshoot zoom and overflow the canvas. Override the
// two private methods so pixui sees the capped size.
const responsiveProto = ResponsiveScene.prototype as unknown as {
  _getCanvasWidth(): number;
  _getCanvasHeight(): number;
  _getDevicePixelRatio(): number;
};
responsiveProto._getCanvasWidth = function () {
  return Math.min(window.innerWidth, MAX_CSS_WIDTH) * this._getDevicePixelRatio();
};
responsiveProto._getCanvasHeight = function () {
  return Math.min(window.innerHeight, MAX_CSS_HEIGHT) * this._getDevicePixelRatio();
};

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
