import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, BUILDING_COSTS } from '../config';
import { GameUIState } from '../types';

export class UIScene extends Phaser.Scene {
  private buildingCountText!: Phaser.GameObjects.Text;
  private selectedText!: Phaser.GameObjects.Text;
  private cursorPosText!: Phaser.GameObjects.Text;
  private simStatusText!: Phaser.GameObjects.Text;
  private itemsText!: Phaser.GameObjects.Text;
  private stoneCountText!: Phaser.GameObjects.Text;
  private cursorInfoText!: Phaser.GameObjects.Text;
  private hotbarText!: Phaser.GameObjects.Text;

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

    // Cursor info (top-left, shows what's under cursor)
    this.cursorInfoText = this.add.text(4, 2, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffffff',
    });

    // Simulation status with play icon (top-center)
    this.simStatusText = this.add.text(CANVAS_WIDTH / 2, 2, '► 1x', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#00ffff',
    });
    this.simStatusText.setOrigin(0.5, 0);

    // Stone count (top-right area)
    this.stoneCountText = this.add.text(CANVAS_WIDTH - 130, 2, 'Stone:0', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#aaaaaa',
    });

    // Cursor position (top-right)
    this.cursorPosText = this.add.text(CANVAS_WIDTH - 60, 2, 'X:20 Y:12', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#888888',
    });

    // Building count (top-right corner)
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

    // Hotbar (bottom) - dynamic based on build mode
    this.hotbarText = this.add.text(4, CANVAS_HEIGHT - 24, '[B] Build', {
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
      'ESDF:Move  Space:Gather/Build  Del:Remove  R:Rotate  P:Pause  H:Stats  Esc:Menu',
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
      'ESDF - Move cursor',
      'Shift+ESDF - Jump 5 tiles',
      'B - Build menu',
      'Space/Enter - Gather/Build',
      'Backspace - Demolish',
      'R - Rotate',
      'P - Pause/Resume',
      'H - Toggle stats',
      'C - Cycle recipe',
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
    // Cursor info (what's under cursor)
    if (state.cursorInfo) {
      this.cursorInfoText.setText(state.cursorInfo);
      this.cursorInfoText.setColor('#ffffff');
    } else {
      this.cursorInfoText.setText('');
    }

    // Building count
    this.buildingCountText.setText(`B:${state.buildingCount}`);

    // Cursor position
    this.cursorPosText.setText(`X:${state.cursorX} Y:${state.cursorY}`);

    // Stone count
    this.stoneCountText.setText(`Stone:${state.playerResources.stone}`);

    // Selected building with cost info
    if (state.selectedBuilding) {
      const cost = BUILDING_COSTS[state.selectedBuilding];
      const hasEnough = state.playerResources.stone >= cost;

      if (hasEnough) {
        this.selectedText.setText(`${state.selectedBuilding.toUpperCase()} (${cost})`);
        this.selectedText.setColor('#00ff00');
      } else {
        this.selectedText.setText(`${state.selectedBuilding.toUpperCase()} (${cost}) Need stone!`);
        this.selectedText.setColor('#ff6666');
      }
    } else {
      this.selectedText.setText('None');
      this.selectedText.setColor('#888888');
    }

    // Hotbar - dynamic based on build mode
    if (state.buildModeActive) {
      this.hotbarText.setText('[Q] Quarry  [F] Forge  [W] Workbench  [C] Chest');
      this.hotbarText.setColor('#ffffff');
    } else {
      this.hotbarText.setText('[B] Build');
      this.hotbarText.setColor('#aaaaaa');
    }

    // Simulation status with play/pause icon
    if (state.simPaused) {
      this.simStatusText.setText(`║ ${state.simSpeed}x`);
      this.simStatusText.setColor('#ffff00');
    } else {
      this.simStatusText.setText(`► ${state.simSpeed}x`);
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
