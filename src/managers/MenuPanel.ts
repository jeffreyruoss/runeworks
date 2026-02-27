import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, THEME, PANEL_INSET } from '../config';
import { makeText, createPanelFrame } from '../phaser-utils';

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
    const container = scene.add.container(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    container.setDepth(1000);
    container.setVisible(false);

    // Content dimensions drive panel size
    const lineH = 13;
    const headerH = 11;
    const titleH = 14;
    const hintH = 10;
    const maxLines = Math.max(REGULAR_COMMANDS.length, BUILD_COMMANDS.length);

    const contentW = 440;
    const contentH = titleH + 8 + headerH + 2 + maxLines * lineH + 8 + hintH;
    const panelW = contentW + 2 * PANEL_INSET;
    const panelH = contentH + 2 * PANEL_INSET;

    const bg = createPanelFrame(scene, panelW, panelH);
    container.add(bg);

    const top = -panelH / 2 + PANEL_INSET;

    // Title
    const title = makeText(scene, 0, top, 'KEY COMMANDS', {
      fontSize: '14px',
      color: THEME.text.primary,
    });
    title.setOrigin(0.5, 0);
    container.add(title);

    // Column layout
    const colX = [-contentW / 4, contentW / 4];
    const startY = top + titleH + 8;

    const addColumn = (x: number, header: string, commands: string[]): void => {
      let y = startY;
      const headerText = makeText(scene, x, y, header, {
        fontSize: '9px',
        color: THEME.text.secondary,
      });
      headerText.setOrigin(0.5, 0);
      container.add(headerText);
      y += headerH + 2;

      for (const cmd of commands) {
        const cmdText = makeText(scene, x, y, cmd, {
          fontSize: '8px',
          color: THEME.text.tertiary,
        });
        cmdText.setOrigin(0.5, 0);
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
    const closeHint = makeText(scene, 0, top + contentH, 'Press K or X to close', {
      fontSize: '10px',
      color: THEME.text.muted,
    });
    closeHint.setOrigin(0.5, 1);
    container.add(closeHint);

    return container;
  }
}
