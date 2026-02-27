import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, THEME, PANEL_INSET } from '../config';
import { makeText, createPanelFrame } from '../phaser-utils';

/**
 * Inventory modal panel. Currently a placeholder.
 * Toggled with the I key.
 */
export class InventoryPanel {
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.container = this.createPanel(scene);
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  private createPanel(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const container = scene.add.container(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    container.setDepth(1000);
    container.setVisible(false);

    // Content dimensions drive panel size
    const titleH = 12;
    const placeholderH = 10;
    const hintH = 8;
    const contentW = 160;
    const contentH = titleH + 16 + placeholderH + 16 + hintH;
    const panelW = contentW + 2 * PANEL_INSET;
    const panelH = contentH + 2 * PANEL_INSET;

    const bg = createPanelFrame(scene, panelW, panelH);
    container.add(bg);

    const top = -panelH / 2 + PANEL_INSET;

    // Title
    const title = makeText(scene, 0, top, 'INVENTORY', {
      fontSize: '12px',
      color: THEME.text.primary,
    });
    title.setOrigin(0.5, 0);
    container.add(title);

    // Placeholder text
    const placeholder = makeText(scene, 0, top + titleH + 16, 'Coming soon...', {
      fontSize: '10px',
      color: THEME.text.muted,
    });
    placeholder.setOrigin(0.5, 0);
    container.add(placeholder);

    // Close hint
    const hint = makeText(scene, 0, top + contentH, 'Press I or X to close', {
      fontSize: '8px',
      color: THEME.text.tertiary,
    });
    hint.setOrigin(0.5, 1);
    container.add(hint);

    return container;
  }
}
