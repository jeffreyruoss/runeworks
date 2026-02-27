import Phaser from 'phaser';
import {
  TEXT_RESOLUTION,
  UI_FONT,
  DEFAULT_ZOOM,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PANEL_BORDER,
  PANEL_FILL,
} from './config';

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
 * Create an ornate panel frame from tiled edge and corner sprites.
 * Returns a Container centered at (0, 0) with solid dark fill,
 * tiled border edges, and corner pieces.
 */
export function createPanelFrame(
  scene: Phaser.Scene,
  width: number,
  height: number,
  alpha?: number
): Phaser.GameObjects.Container {
  const container = scene.add.container(0, 0);
  const B = PANEL_BORDER;
  const halfW = width / 2;
  const halfH = height / 2;

  // Solid dark fill
  const fill = scene.add.graphics();
  fill.fillStyle(PANEL_FILL, 1);
  fill.fillRect(-halfW, -halfH, width, height);
  container.add(fill);

  // Horizontal edges (tiled)
  const edgeW = width - 2 * B;
  if (edgeW > 0) {
    const top = scene.add.tileSprite(0, -halfH + B / 2, edgeW, B, 'sprites', 'panel_edge_h');
    container.add(top);

    const bot = scene.add.tileSprite(0, halfH - B / 2, edgeW, B, 'sprites', 'panel_edge_h');
    bot.setFlipY(true);
    container.add(bot);
  }

  // Vertical edges (tiled)
  const edgeH = height - 2 * B;
  if (edgeH > 0) {
    const left = scene.add.tileSprite(-halfW + B / 2, 0, B, edgeH, 'sprites', 'panel_edge_v');
    container.add(left);

    const right = scene.add.tileSprite(halfW - B / 2, 0, B, edgeH, 'sprites', 'panel_edge_v');
    right.setFlipX(true);
    container.add(right);
  }

  // Corners
  const cx = halfW - B / 2;
  const cy = halfH - B / 2;

  const tl = scene.add.image(-cx, -cy, 'sprites', 'panel_corner');
  container.add(tl);

  const tr = scene.add.image(cx, -cy, 'sprites', 'panel_corner');
  tr.setFlipX(true);
  container.add(tr);

  const bl = scene.add.image(-cx, cy, 'sprites', 'panel_corner');
  bl.setFlipY(true);
  container.add(bl);

  const br = scene.add.image(cx, cy, 'sprites', 'panel_corner');
  br.setFlipX(true);
  br.setFlipY(true);
  container.add(br);

  container.setAlpha(alpha ?? 0.9);
  return container;
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
