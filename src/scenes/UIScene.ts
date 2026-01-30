import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, TICKS_PER_SECOND } from '../config';

interface GameState {
  buildingCount: number;
  selectedBuilding: string | null;
  cursorX: number;
  cursorY: number;
  simRunning: boolean;
  simPaused: boolean;
  simSpeed: number;
  simTick: number;
  itemsProduced: Record<string, number>;
}

export class UIScene extends Phaser.Scene {
  private buildingCountText!: Phaser.GameObjects.Text;
  private selectedText!: Phaser.GameObjects.Text;
  private cursorPosText!: Phaser.GameObjects.Text;
  private simStatusText!: Phaser.GameObjects.Text;
  private itemsText!: Phaser.GameObjects.Text;

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

    // Stage name + goal (top-left)
    this.add.text(4, 2, 'Stage 1: Iron Plates (Goal: 50)', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffffff',
    });

    // Simulation status (top-center)
    this.simStatusText = this.add.text(CANVAS_WIDTH / 2, 2, 'BUILD MODE', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#00ff00',
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
    this.add.text(4, CANVAS_HEIGHT - 24, '[1] Miner  [2] Furnace  [3] Assembler  [4] Chest', {
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
      'WASD:Move  Enter:Place  Del:Remove  R:Rotate  Space:Run/Stop  </>:Speed',
      {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#666666',
      }
    );

    // Listen for events from GameScene
    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('gameStateChanged', this.onGameStateChanged, this);
  }

  private onGameStateChanged(state: GameState): void {
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
    if (state.simRunning) {
      const seconds = Math.floor(state.simTick / TICKS_PER_SECOND);
      const speedStr = state.simSpeed > 1 ? ` [${state.simSpeed}x]` : '';
      this.simStatusText.setText(`RUNNING ${seconds}s${speedStr}`);
      this.simStatusText.setColor('#00ffff');
    } else {
      this.simStatusText.setText('BUILD MODE');
      this.simStatusText.setColor('#00ff00');
    }

    // Items produced
    const items = state.itemsProduced;
    const itemStrings: string[] = [];

    if (items.iron_plate) itemStrings.push(`IronP:${items.iron_plate}`);
    if (items.copper_plate) itemStrings.push(`CopperP:${items.copper_plate}`);
    if (items.gear) itemStrings.push(`Gear:${items.gear}`);
    if (items.wire) itemStrings.push(`Wire:${items.wire}`);
    if (items.circuit) itemStrings.push(`Circuit:${items.circuit}`);

    this.itemsText.setText(itemStrings.join('  '));
  }
}
