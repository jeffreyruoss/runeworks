import Phaser from 'phaser';
import { FONT_SM, getFontSize, C, addPanelBackground } from '../ui-theme';
import { getViewport } from '../utils';

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
    const vp = getViewport(scene);
    const container = scene.add.container(Math.floor(vp.width / 2), Math.floor(vp.height / 2));
    container.setDepth(1000);
    container.setVisible(false);

    const padX = 20;
    const padY = 16;
    const contentW = 160;
    const contentH = 60;
    const panelW = contentW + 2 * padX;
    const panelH = contentH + 2 * padY;

    addPanelBackground(scene, container, panelW, panelH);

    const top = -panelH / 2 + padY;

    const title = scene.add.bitmapText(0, top, FONT_SM, 'INVENTORY', getFontSize());
    title.setOrigin(0.5, 0);
    title.setTint(C.light);
    container.add(title);

    const placeholder = scene.add.bitmapText(0, top + 20, FONT_SM, 'Coming soon...', getFontSize());
    placeholder.setOrigin(0.5, 0);
    placeholder.setTint(C.muted);
    container.add(placeholder);

    const hint = scene.add.bitmapText(
      0,
      top + contentH,
      FONT_SM,
      'Press I or X to close',
      getFontSize()
    );
    hint.setOrigin(0.5, 1);
    hint.setTint(0x8078a0);
    container.add(hint);

    return container;
  }
}
