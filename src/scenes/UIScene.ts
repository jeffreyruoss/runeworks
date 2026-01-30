import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, TICKS_PER_SECOND } from '../config';
import { GameUIState } from '../types';

export class UIScene extends Phaser.Scene {
  private buildingCountText!: Phaser.GameObjects.Text;
  private selectedText!: Phaser.GameObjects.Text;
  private cursorPosText!: Phaser.GameObjects.Text;
  private simStatusText!: Phaser.GameObjects.Text;
  private itemsText!: Phaser.GameObjects.Text;

  // Menu panel
  private menuPanel!: Phaser.GameObjects.Container;

  // Inventory panel
  private inventoryPanel!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    const graphics = this.add.graphics();

    // Top bar
    graphics.fillStyle(COLORS.hudBackground, 0.7);
    graphics.fillRect(0, 0, CANVAS_WIDTH, 20);

    // Bottom bar
    graphics.fillRect(0, CANVAS_HEIGHT - 28, CANVAS_WIDTH, 28);

    // Quest name + quota (top-left)
    this.add.text(4, 2, 'Quest 1: Arcane Ingots (Quota: 50)', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffffff',
    });

    // Simulation status (top-center)
    this.simStatusText = this.add.text(CANVAS_WIDTH / 2, 2, '0s [1x]', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#00ffff',
    });
    this.simStatusText.setOrigin(0.5, 0);

    // Cursor position + building count (top-right)
    this.cursorPosText = this.add.text(CANVAS_WIDTH - 80, 2, 'X:20 Y:12', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#888888',
    });

    this.buildingCountText = this.add.text(CANVAS_WIDTH - 4, 2, 'B:0', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffffff',
    });
    this.buildingCountText.setOrigin(1, 0);

    // Items produced (top, second row)
    this.itemsText = this.add.text(4, 12, '', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ffff00',
    });

    // Hotbar (bottom)
    this.add.text(4, CANVAS_HEIGHT - 24, '[1] Quarry  [2] Forge  [3] Workbench  [4] Coffer', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#aaaaaa',
    });

    // Selected building (bottom-right)
    this.selectedText = this.add.text(CANVAS_WIDTH - 4, CANVAS_HEIGHT - 24, 'None', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#888888',
    });
    this.selectedText.setOrigin(1, 0);

    // Help text
    this.add.text(
      4,
      CANVAS_HEIGHT - 12,
      'WASD:Move  Space:Build  Del:Remove  R:Rotate  P:Pause  I:Inv*  H:Stats  Esc:Menu',
      {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#666666',
      }
    );

    // Create menu panel (hidden by default)
    this.createMenuPanel();

    // Create inventory panel (hidden by default)
    this.createInventoryPanel();

    // Listen for events from GameScene
    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('gameStateChanged', this.onGameStateChanged, this);
  }

  private createMenuPanel(): void {
    this.menuPanel = this.add.container(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.menuPanel.setDepth(1000);
    this.menuPanel.setVisible(false);

    // Background - larger container to fit content
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.9);
    bg.fillRect(-140, -120, 280, 240);
    bg.lineStyle(2, 0x666666);
    bg.strokeRect(-140, -120, 280, 240);
    this.menuPanel.add(bg);

    // Title
    const title = this.add.text(0, -100, 'KEY COMMANDS', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
    });
    title.setOrigin(0.5, 0.5);
    this.menuPanel.add(title);

    // Key commands list
    const keyCommands = [
      'WASD - Move cursor',
      'Shift+WASD - Jump 5 tiles',
      '1-4 - Select building',
      'Space/Enter - Construct',
      'Backspace - Demolish',
      'R - Rotate',
      'P - Pause/Resume',
      'I - Inventory*',
      'H - Toggle stats',
      '</> - Speed down/up',
      'Esc - Menu/Back',
    ];

    let yPos = -70;
    for (const cmd of keyCommands) {
      const cmdText = this.add.text(0, yPos, cmd, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#888888',
      });
      cmdText.setOrigin(0.5, 0.5);
      this.menuPanel.add(cmdText);
      yPos += 12;
    }

    // Close hint at bottom
    const closeHint = this.add.text(0, 90, 'Press Esc to close', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#666666',
    });
    closeHint.setOrigin(0.5, 0.5);
    this.menuPanel.add(closeHint);
  }

  private createInventoryPanel(): void {
    this.inventoryPanel = this.add.container(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.inventoryPanel.setDepth(1000);
    this.inventoryPanel.setVisible(false);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.9);
    bg.fillRect(-100, -60, 200, 120);
    bg.lineStyle(2, 0x666666);
    bg.strokeRect(-100, -60, 200, 120);
    this.inventoryPanel.add(bg);

    // Title
    const title = this.add.text(0, -45, 'INVENTORY', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
    });
    title.setOrigin(0.5, 0.5);
    this.inventoryPanel.add(title);

    // Placeholder text
    const placeholder = this.add.text(0, 0, 'Coming soon...', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#666666',
    });
    placeholder.setOrigin(0.5, 0.5);
    this.inventoryPanel.add(placeholder);

    // Close hint
    const hint = this.add.text(0, 40, 'Press I or Esc to close', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#888888',
    });
    hint.setOrigin(0.5, 0.5);
    this.inventoryPanel.add(hint);
  }

  private onGameStateChanged(state: GameUIState): void {
    // Building count
    this.buildingCountText.setText(`B:${state.buildingCount}`);

    // Cursor position
    this.cursorPosText.setText(`X:${state.cursorX} Y:${state.cursorY}`);

    // Selected building
    if (state.selectedBuilding) {
      this.selectedText.setText(state.selectedBuilding.toUpperCase());
      this.selectedText.setColor('#00ff00');
    } else {
      this.selectedText.setText('None');
      this.selectedText.setColor('#888888');
    }

    // Simulation status
    const seconds = Math.floor(state.simTick / TICKS_PER_SECOND);
    if (state.simPaused) {
      this.simStatusText.setText(`PAUSED ${seconds}s [${state.simSpeed}x]`);
      this.simStatusText.setColor('#ffff00');
    } else {
      this.simStatusText.setText(`${seconds}s [${state.simSpeed}x]`);
      this.simStatusText.setColor('#00ffff');
    }

    // Items produced
    const items = state.itemsProduced;
    const itemStrings: string[] = [];

    if (items.arcane_ingot) itemStrings.push(`ArcI:${items.arcane_ingot}`);
    if (items.sun_ingot) itemStrings.push(`SunI:${items.sun_ingot}`);
    if (items.cogwheel) itemStrings.push(`Cog:${items.cogwheel}`);
    if (items.thread) itemStrings.push(`Thrd:${items.thread}`);
    if (items.rune) itemStrings.push(`Rune:${items.rune}`);

    this.itemsText.setText(itemStrings.join('  '));

    // Menu visibility
    this.menuPanel.setVisible(state.menuOpen);

    // Inventory visibility
    this.inventoryPanel.setVisible(state.inventoryOpen);
  }

  shutdown(): void {
    const gameScene = this.scene.get('GameScene');
    gameScene.events.off('gameStateChanged', this.onGameStateChanged, this);
  }
}
