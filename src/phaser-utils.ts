import Phaser from 'phaser';
import { TEXT_RESOLUTION, UI_FONT, DEFAULT_ZOOM, CANVAS_WIDTH, CANVAS_HEIGHT } from './config';

/**
 * Configure a scene's camera for the zoomed rendering approach.
 * Canvas is at full display resolution; camera zoom keeps world coords at 640x400.
 */
export function setupCamera(scene: Phaser.Scene): void {
  scene.cameras.main.setZoom(DEFAULT_ZOOM);
  scene.cameras.main.setBounds(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  scene.cameras.main.centerOn(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

/**
 * Create a text object with high-resolution rendering for crisp display.
 * Uses resolution multiplier so the internal canvas matches the final zoom,
 * and linear filtering so the texture maps smoothly to screen pixels
 * (pixelArt: true forces NEAREST globally which causes aliasing at 1:1 ratio).
 */
export function makeText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string | string[],
  style?: Phaser.Types.GameObjects.Text.TextStyle
): Phaser.GameObjects.Text {
  const t = scene.add.text(x, y, text, {
    fontFamily: UI_FONT,
    ...style,
    resolution: TEXT_RESOLUTION,
  });
  t.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  return t;
}
