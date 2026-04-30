/**
 * Central layout calculator for game area and HUD bars.
 * Both GameScene and UIScene read from this to position themselves.
 *
 * Bar heights are defined in virtual pixels (matching pixui's bitmap text
 * coordinate space), then scaled to screen pixels using pixui's integer zoom.
 * The game area uses fractional aspect-ratio fitting between the bars.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config';

// Bar heights in pixui virtual pixels (must fit bitmap text content)
const TOP_BAR_VP = 20;
const BOTTOM_BAR_VP = 40;

// Pixui constraint width (must match UIScene's viewportConstraints.width)
const PIXUI_MIN_WIDTH = CANVAS_WIDTH; // 640

export interface GameLayout {
  topBarH: number; // screen px
  bottomBarH: number; // screen px
  zoom: number; // fractional zoom for game world
  gameRect: { x: number; y: number; w: number; h: number }; // screen px
  canvasW: number;
  canvasH: number;
}

let current: GameLayout = {
  topBarH: TOP_BAR_VP,
  bottomBarH: BOTTOM_BAR_VP,
  zoom: 1,
  gameRect: { x: 0, y: TOP_BAR_VP, w: CANVAS_WIDTH, h: CANVAS_HEIGHT },
  canvasW: CANVAS_WIDTH,
  canvasH: CANVAS_HEIGHT,
};

export function updateLayout(canvasW: number, canvasH: number): void {
  // Compute pixui's integer zoom (same formula as ResponsiveScene)
  const pixuiZoom = Math.max(1, Math.floor(canvasW / PIXUI_MIN_WIDTH));

  // Bar heights in screen pixels = virtual pixels × pixui zoom
  const topBarH = TOP_BAR_VP * pixuiZoom;
  const bottomBarH = BOTTOM_BAR_VP * pixuiZoom;

  // Available space between the bars
  const availW = canvasW;
  const availH = canvasH - topBarH - bottomBarH;

  // Fit game area maintaining world aspect ratio (fractional)
  let gameW: number;
  let gameH: number;
  if (availW / availH > CANVAS_WIDTH / CANVAS_HEIGHT) {
    gameH = availH;
    gameW = gameH * (CANVAS_WIDTH / CANVAS_HEIGHT);
  } else {
    gameW = availW;
    gameH = gameW * (CANVAS_HEIGHT / CANVAS_WIDTH);
  }

  const zoom = gameW / CANVAS_WIDTH;

  // Center horizontally; center vertically between the bars
  const gameX = (canvasW - gameW) / 2;
  const gameY = topBarH + (availH - gameH) / 2;

  current = {
    topBarH,
    bottomBarH,
    zoom,
    gameRect: { x: gameX, y: gameY, w: gameW, h: gameH },
    canvasW,
    canvasH,
  };
}

export function getLayout(): GameLayout {
  return current;
}

/** Get bar heights in pixui virtual pixels for a given scene's zoom level */
export function getBarHeights(sceneZoom: number): { top: number; bottom: number } {
  const z = sceneZoom || 1;
  return { top: current.topBarH / z, bottom: current.bottomBarH / z };
}
