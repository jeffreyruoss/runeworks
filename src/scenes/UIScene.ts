import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, BUILDING_COSTS } from '../config';
import { GameUIState } from '../types';
import { getStage } from '../data/stages';

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

  // Objectives panel
  private objectivesPanel!: Phaser.GameObjects.Container;
  private stageTitleText!: Phaser.GameObjects.Text;
  private objectiveTexts: Phaser.GameObjects.Text[] = [];
  private objectiveChainTexts: Phaser.GameObjects.Text[] = [];
  private stageCompleteText!: Phaser.GameObjects.Text;

  // Stage complete overlay
  private stageCompletePanel!: Phaser.GameObjects.Container;
  private stageCompleteTitle!: Phaser.GameObjects.Text;
  private stageCompleteNameText!: Phaser.GameObjects.Text;
  private stageCompleteNextText!: Phaser.GameObjects.Text;

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
      'ESDF:Move  Space:Build  Del:Remove  R:Rotate  P:Pause  H:Stats  O:Goals  M:Menu  X:Back',
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

    // Create objectives panel (hidden by default)
    this.createObjectivesPanel();

    // Create stage complete overlay (hidden by default)
    this.createStageCompletePanel();

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
      'O - Objectives',
      '</> - Speed down/up',
      'M - Menu',
      'X/Esc - Cancel/Back',
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
    const closeHint = this.add.text(0, 90, 'Press M or Esc to close', {
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
    const hint = this.add.text(0, 40, 'Press I, X, or Esc to close', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#888888',
    });
    hint.setOrigin(0.5, 0.5);
    this.inventoryPanel.add(hint);
  }

  private createObjectivesPanel(): void {
    this.objectivesPanel = this.add.container(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.objectivesPanel.setDepth(1000);
    this.objectivesPanel.setVisible(false);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.9);
    bg.fillRect(-160, -110, 320, 220);
    bg.lineStyle(2, 0x666666);
    bg.strokeRect(-160, -110, 320, 220);
    // Divider under title
    bg.lineStyle(1, 0x444444);
    bg.lineBetween(-150, -78, 150, -78);
    this.objectivesPanel.add(bg);

    // Stage title
    this.stageTitleText = this.add.text(0, -92, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
    });
    this.stageTitleText.setOrigin(0.5, 0.5);
    this.objectivesPanel.add(this.stageTitleText);

    // Objective + chain text lines (up to 3 pairs)
    const startY = -60;
    for (let i = 0; i < 3; i++) {
      const y = startY + i * 40;

      const objText = this.add.text(-145, y, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#aaaaaa',
      });
      this.objectiveTexts.push(objText);
      this.objectivesPanel.add(objText);

      const chainText = this.add.text(-133, y + 14, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#666688',
      });
      this.objectiveChainTexts.push(chainText);
      this.objectivesPanel.add(chainText);
    }

    // Stage complete text
    this.stageCompleteText = this.add.text(0, 68, 'STAGE COMPLETE!', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#00ff00',
    });
    this.stageCompleteText.setOrigin(0.5, 0.5);
    this.stageCompleteText.setVisible(false);
    this.objectivesPanel.add(this.stageCompleteText);

    // Close hint
    const hint = this.add.text(0, 95, 'Press O, X, or Esc to close', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#888888',
    });
    hint.setOrigin(0.5, 0.5);
    this.objectivesPanel.add(hint);
  }

  private createStageCompletePanel(): void {
    this.stageCompletePanel = this.add.container(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.stageCompletePanel.setDepth(1001);
    this.stageCompletePanel.setVisible(false);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.9);
    bg.fillRect(-120, -60, 240, 120);
    bg.lineStyle(2, 0x00ff00);
    bg.strokeRect(-120, -60, 240, 120);
    this.stageCompletePanel.add(bg);

    // Title
    this.stageCompleteTitle = this.add.text(0, -35, 'STAGE COMPLETE!', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#00ff00',
    });
    this.stageCompleteTitle.setOrigin(0.5, 0.5);
    this.stageCompletePanel.add(this.stageCompleteTitle);

    // Stage name
    this.stageCompleteNameText = this.add.text(0, -10, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffffff',
    });
    this.stageCompleteNameText.setOrigin(0.5, 0.5);
    this.stageCompletePanel.add(this.stageCompleteNameText);

    // Next stage / continue hint
    this.stageCompleteNextText = this.add.text(0, 25, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#aaaaaa',
    });
    this.stageCompleteNextText.setOrigin(0.5, 0.5);
    this.stageCompletePanel.add(this.stageCompleteNextText);

    // Action hint
    const hint = this.add.text(0, 45, '[Space] Continue', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#00ffff',
    });
    hint.setOrigin(0.5, 0.5);
    this.stageCompletePanel.add(hint);
  }

  private updateStageCompletePanel(state: GameUIState): void {
    const stage = getStage(state.currentStage);
    const stageName = stage ? stage.name : `Stage ${state.currentStage}`;
    this.stageCompleteNameText.setText(stageName);

    const nextStage = getStage(state.currentStage + 1);
    if (nextStage) {
      this.stageCompleteNextText.setText(`Next: Stage ${nextStage.id} - ${nextStage.name}`);
    } else {
      this.stageCompleteNextText.setText('All stages complete!');
    }
  }

  private readonly ITEM_DISPLAY_NAMES: Record<string, string> = {
    arcstone: 'Arcstone',
    sunite: 'Sunite',
    arcane_ingot: 'Arcane Ingot',
    sun_ingot: 'Sun Ingot',
    cogwheel: 'Cogwheel',
    thread: 'Thread',
    rune: 'Rune',
  };

  private readonly PRODUCTION_CHAINS: Record<string, string> = {
    arcane_ingot: 'Quarry[Arcstone Vein] -> Forge (purify)',
    sun_ingot: 'Quarry[Sunite Vein] -> Forge (purify)',
    cogwheel: 'Quarry[Arcstone] -> Forge -> Workbench (2 ingots)',
    thread: 'Quarry[Sunite] -> Forge -> Workbench (1 ingot -> 2)',
    rune: '1 Arcane Ingot + 3 Thread -> Workbench',
  };

  private updateObjectivesContent(state: GameUIState): void {
    const stage = getStage(state.currentStage);
    const stageName = stage ? stage.name : `Stage ${state.currentStage}`;
    this.stageTitleText.setText(`Stage ${state.currentStage}: ${stageName}`);

    for (let i = 0; i < this.objectiveTexts.length; i++) {
      if (i < state.objectiveProgress.length) {
        const obj = state.objectiveProgress[i];
        const done = obj.produced >= obj.required;
        const check = done ? '[x]' : '[ ]';
        const name = this.ITEM_DISPLAY_NAMES[obj.item] || obj.item;
        this.objectiveTexts[i].setText(`${check} ${name}: ${obj.produced}/${obj.required}`);
        this.objectiveTexts[i].setColor(done ? '#00ff00' : '#aaaaaa');
        this.objectiveTexts[i].setVisible(true);

        const chain = this.PRODUCTION_CHAINS[obj.item] || '';
        this.objectiveChainTexts[i].setText(chain);
        this.objectiveChainTexts[i].setColor(done ? '#448844' : '#666688');
        this.objectiveChainTexts[i].setVisible(true);
      } else {
        this.objectiveTexts[i].setVisible(false);
        this.objectiveChainTexts[i].setVisible(false);
      }
    }

    this.stageCompleteText.setVisible(state.stageComplete);
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

    // Objectives panel
    this.objectivesPanel.setVisible(state.objectivesOpen);
    if (state.objectivesOpen) {
      this.updateObjectivesContent(state);
    }

    // Stage complete overlay
    this.stageCompletePanel.setVisible(state.stageCompleteShown);
    if (state.stageCompleteShown) {
      this.updateStageCompletePanel(state);
    }
  }

  shutdown(): void {
    const gameScene = this.scene.get('GameScene');
    gameScene.events.off('gameStateChanged', this.onGameStateChanged, this);
  }
}
