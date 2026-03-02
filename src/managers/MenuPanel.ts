import Phaser from 'phaser';
import { THEME } from '../config';
import { FONT_SM, UI_ATLAS } from '../ui-theme';

const REGULAR_COMMANDS = [
  'ESDF - Move cursor',
  'Shift+ESDF - Jump 5 tiles',
  'Space/Enter - Gather/Build',
  'X - Cancel / Deconstruct',
  'R - Rotate / Research',
  'C - Cycle recipe',
  'P - Pause/Resume',
  '</> - Speed down/up',
  'H - Toggle stats',
  'O - Objectives',
  'G - Guide',
  'K - Key Commands',
];

const BUILD_COMMANDS = [
  'B - Toggle build menu',
  'Q - Quarry',
  'F - Forge',
  'W - Workbench',
  'C - Chest',
  'A - Arcane Study',
  'M - Mana Well',
  'O - Mana Obelisk',
  'T - Mana Tower',
  'X - Exit build mode',
];

/**
 * Key commands modal panel. Shows two columns of keyboard bindings.
 * Toggled with the K key.
 */
export class MenuPanel {
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.container = this.createPanel(scene);
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  private createPanel(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const vp = (scene as any).viewport as { width: number; height: number };
    const container = scene.add.container(Math.floor(vp.width / 2), Math.floor(vp.height / 2));
    container.setDepth(1000);
    container.setVisible(false);

    const lineH = 13;
    const headerH = 14;
    const titleH = 16;
    const maxLines = Math.max(REGULAR_COMMANDS.length, BUILD_COMMANDS.length);

    const padX = 20;
    const padY = 16;
    const contentW = 440;
    const contentH = titleH + 8 + headerH + 2 + maxLines * lineH + 14;
    const panelW = contentW + 2 * padX;
    const panelH = contentH + 2 * padY;

    // 9-slice frame background
    const bg = scene.add.nineslice(0, 0, UI_ATLAS, 'frame_dark', panelW, panelH);
    bg.setOrigin(0.5, 0.5);
    bg.setAlpha(0.93);
    container.add(bg);

    const top = -panelH / 2 + padY;

    // Title
    const title = scene.add.bitmapText(0, top, FONT_SM, 'KEY COMMANDS');
    title.setOrigin(0.5, 0);
    title.setTint(0xe8e0f0);
    container.add(title);

    // Column layout
    const colX = [-contentW / 4, contentW / 4];
    const startY = top + titleH + 8;

    const addColumn = (x: number, header: string, commands: string[]): void => {
      let y = startY;
      const headerText = scene.add.bitmapText(x, y, FONT_SM, header);
      headerText.setOrigin(0.5, 0);
      headerText.setTint(0xb0a8c0);
      container.add(headerText);
      y += headerH + 2;

      for (const cmd of commands) {
        const cmdText = scene.add.bitmapText(x, y, FONT_SM, cmd);
        cmdText.setOrigin(0.5, 0);
        cmdText.setTint(0x8078a0);
        container.add(cmdText);
        y += lineH;
      }
    };

    addColumn(colX[0], 'REGULAR MODE', REGULAR_COMMANDS);
    addColumn(colX[1], 'BUILD MODE', BUILD_COMMANDS);

    // Divider line between columns
    const divider = scene.add.graphics();
    divider.lineStyle(1, THEME.panel.divider);
    const divTop = startY - 4;
    const divBot = startY + headerH + 2 + maxLines * lineH;
    divider.lineBetween(0, divTop, 0, divBot);
    container.add(divider);

    // Close hint at bottom
    const closeHint = scene.add.bitmapText(0, top + contentH, FONT_SM, 'Press K or X to close');
    closeHint.setOrigin(0.5, 1);
    closeHint.setTint(0x605880);
    container.add(closeHint);

    return container;
  }
}
