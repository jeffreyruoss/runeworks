import Phaser from 'phaser';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  COLORS,
  BUILDING_COSTS,
  RESOURCE_DISPLAY_NAMES,
} from '../config';
import { GameUIState, PlayerResources } from '../types';
import { ObjectivesPanel } from '../managers/ObjectivesPanel';
import { GuidePanel } from '../managers/GuidePanel';
import { ResearchPanel } from '../managers/ResearchPanel';
import { ResearchManager } from '../managers/ResearchManager';
import { canAfford, makeText } from '../utils';

export class UIScene extends Phaser.Scene {
  private buildingCountText!: Phaser.GameObjects.Text;
  private selectedText!: Phaser.GameObjects.Text;
  private cursorPosText!: Phaser.GameObjects.Text;
  private simStatusText!: Phaser.GameObjects.Text;
  private itemsText!: Phaser.GameObjects.Text;
  private resourcesText!: Phaser.GameObjects.Text;
  private cursorInfoText!: Phaser.GameObjects.Text;
  private hotbarText!: Phaser.GameObjects.Text;

  // Menu panel
  private menuPanel!: Phaser.GameObjects.Container;

  // Inventory panel
  private inventoryPanel!: Phaser.GameObjects.Container;

  // Objectives (delegated to manager)
  private objectivesPanel!: ObjectivesPanel;

  // Guide panel
  private guidePanel!: GuidePanel;

  // Research panel
  private researchPanel!: ResearchPanel;
  private researchManager!: ResearchManager;

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
    this.cursorInfoText = makeText(this, 4, 2, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffffff',
    });

    // Simulation status with play icon (top-center)
    this.simStatusText = makeText(this, CANVAS_WIDTH / 2, 2, '► 1x', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#00ffff',
    });
    this.simStatusText.setOrigin(0.5, 0);

    // Resources (top-right area)
    this.resourcesText = makeText(this, CANVAS_WIDTH - 280, 2, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#aaaaaa',
    });

    // Cursor position (top-right)
    this.cursorPosText = makeText(this, CANVAS_WIDTH - 60, 2, 'X:20 Y:12', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#888888',
    });

    // Items produced (top, second row)
    this.itemsText = makeText(this, 4, 12, '', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ffff00',
    });

    // Hotbar (bottom) - dynamic based on build mode
    this.hotbarText = makeText(this, 4, CANVAS_HEIGHT - 24, '[B] Build', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#aaaaaa',
    });

    // Selected building (bottom-right)
    this.selectedText = makeText(this, CANVAS_WIDTH - 4, CANVAS_HEIGHT - 24, 'None', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#888888',
    });
    this.selectedText.setOrigin(1, 0);

    // Help text
    makeText(
      this,
      4,
      CANVAS_HEIGHT - 12,
      'ESDF:Move  Spc:Build  Del:Rmv  R:Rot/Research  P:Pause  H:Stats  O:Goals  G:Guide  M:Menu',
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

    // Create objectives panels (delegated to manager)
    this.objectivesPanel = new ObjectivesPanel(this);

    // Create guide panel
    this.guidePanel = new GuidePanel(this);

    // Get shared research manager from GameScene via registry
    this.researchManager = this.registry.get('researchManager') as ResearchManager;
    this.researchPanel = new ResearchPanel(this);

    // Listen for events from GameScene
    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('gameStateChanged', this.onGameStateChanged, this);
    gameScene.events.on('researchNavigate', this.onResearchNavigate, this);
    gameScene.events.on('researchUnlock', this.onResearchUnlock, this);
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
    const title = makeText(this, 0, -100, 'KEY COMMANDS', {
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
      'R - Rotate / Research',
      'P - Pause/Resume',
      'H - Toggle stats',
      'C - Cycle recipe',
      'O - Objectives',
      'G - Guide',
      '</> - Speed down/up',
      'M - Menu',
      'X/Esc - Cancel/Back',
    ];

    let yPos = -70;
    for (const cmd of keyCommands) {
      const cmdText = makeText(this, 0, yPos, cmd, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#888888',
      });
      cmdText.setOrigin(0.5, 0.5);
      this.menuPanel.add(cmdText);
      yPos += 12;
    }

    // Close hint at bottom
    const closeHint = makeText(this, 0, 90, 'Press M or Esc to close', {
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
    const invTitle = makeText(this, 0, -45, 'INVENTORY', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
    });
    invTitle.setOrigin(0.5, 0.5);
    this.inventoryPanel.add(invTitle);

    // Placeholder text
    const placeholder = makeText(this, 0, 0, 'Coming soon...', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#666666',
    });
    placeholder.setOrigin(0.5, 0.5);
    this.inventoryPanel.add(placeholder);

    // Close hint
    const hint = makeText(this, 0, 40, 'Press I, X, or Esc to close', {
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

    // Cursor position
    this.cursorPosText.setText(`X:${state.cursorX} Y:${state.cursorY}`);

    // Resources - show all non-zero
    this.resourcesText.setText(this.formatResources(state.playerResources));

    // Selected building with cost info
    if (state.selectedBuilding) {
      const cost = BUILDING_COSTS[state.selectedBuilding];
      const affordable = canAfford(state.playerResources, cost);
      const costStr = this.formatCost(cost);

      const displayName = state.selectedBuilding.replace(/_/g, ' ').toUpperCase();
      if (affordable) {
        this.selectedText.setText(`${displayName} (${costStr})`);
        this.selectedText.setColor('#00ff00');
      } else {
        this.selectedText.setText(`${displayName} (${costStr})`);
        this.selectedText.setColor('#ff6666');
      }
    } else {
      this.selectedText.setText('None');
      this.selectedText.setColor('#888888');
    }

    // Hotbar - dynamic based on build mode
    if (state.buildModeActive) {
      const entries: string[] = ['[Q] Quarry', '[F] Forge', '[W] Workbench', '[C] Chest'];
      if (this.researchManager.isBuildingUnlocked('arcane_study')) {
        entries.push('[A] Study');
      }
      this.hotbarText.setText(entries.join('  '));
      this.hotbarText.setColor('#ffffff');
    } else {
      this.hotbarText.setText('[B] Build');
      this.hotbarText.setColor('#aaaaaa');
    }

    // RP display (after sim status)
    const rpStr = state.researchPoints > 0 ? `  RP:${state.researchPoints}` : '';

    // Simulation status with play/pause icon
    if (state.simPaused) {
      this.simStatusText.setText(`║ ${state.simSpeed}x${rpStr}`);
      this.simStatusText.setColor('#ffff00');
    } else {
      this.simStatusText.setText(`► ${state.simSpeed}x${rpStr}`);
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

    // Guide panel visibility
    this.guidePanel.setVisible(state.guideOpen);

    // Research panel visibility
    this.researchPanel.setVisible(state.researchOpen);
    if (state.researchOpen) {
      this.researchPanel.update(this.researchManager);
    }

    // Objectives and stage complete (delegated to manager)
    this.objectivesPanel.update(state);
  }

  private formatResources(res: PlayerResources): string {
    const parts: string[] = [];
    if (res.stone) parts.push(`Stone:${res.stone}`);
    if (res.wood) parts.push(`Wood:${res.wood}`);
    if (res.iron) parts.push(`Iron:${res.iron}`);
    if (res.clay) parts.push(`Clay:${res.clay}`);
    if (res.crystal_shard) parts.push(`Crystal:${res.crystal_shard}`);
    return parts.join(' ') || 'No resources';
  }

  private formatCost(cost: Partial<PlayerResources>): string {
    return Object.entries(cost)
      .filter(([, v]) => v && v > 0)
      .map(([k, v]) => `${RESOURCE_DISPLAY_NAMES[k] || k}:${v}`)
      .join(' ');
  }

  private onResearchNavigate(dx: number, dy: number): void {
    this.researchPanel.navigate(dx, dy);
    this.researchPanel.update(this.researchManager);
  }

  private onResearchUnlock(): void {
    this.researchPanel.tryUnlock(this.researchManager);
    this.researchPanel.update(this.researchManager);
  }

  shutdown(): void {
    const gameScene = this.scene.get('GameScene');
    gameScene.events.off('gameStateChanged', this.onGameStateChanged, this);
    gameScene.events.off('researchNavigate', this.onResearchNavigate, this);
    gameScene.events.off('researchUnlock', this.onResearchUnlock, this);
  }
}
