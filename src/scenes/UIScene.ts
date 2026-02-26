import Phaser from 'phaser';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  COLORS,
  THEME,
  BUILDING_COSTS,
  RESOURCE_DISPLAY_NAMES,
} from '../config';
import { GameUIState, PlayerResources } from '../types';

import { ObjectivesPanel } from '../managers/ObjectivesPanel';
import { GuidePanel } from '../managers/GuidePanel';
import { ResearchPanel } from '../managers/ResearchPanel';
import { ResearchManager } from '../managers/ResearchManager';
import { TutorialOverlay } from '../managers/TutorialOverlay';
import { canAfford } from '../utils';
import { makeText, setupCamera } from '../phaser-utils';

export class UIScene extends Phaser.Scene {
  private selectedText!: Phaser.GameObjects.Text;
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

  // Tutorial overlay
  private tutorialOverlay!: TutorialOverlay;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    setupCamera(this);

    const graphics = this.add.graphics();

    // Top bar
    graphics.fillStyle(COLORS.hudBackground, 0.7);
    graphics.fillRect(0, 0, CANVAS_WIDTH, 20);

    // Bottom bar
    graphics.fillRect(0, CANVAS_HEIGHT - 28, CANVAS_WIDTH, 28);

    // Cursor info (top-left, shows what's under cursor)
    this.cursorInfoText = makeText(this, 4, 2, '', {
      fontSize: '10px',
      color: THEME.text.primary,
    });

    // Simulation status with play icon (top-center)
    this.simStatusText = makeText(this, CANVAS_WIDTH / 2, 2, '► 1x', {
      fontSize: '10px',
      color: THEME.status.active,
    });
    this.simStatusText.setOrigin(0.5, 0);

    // Resources (top-right area)
    this.resourcesText = makeText(this, CANVAS_WIDTH - 280, 2, '', {
      fontSize: '10px',
      color: THEME.text.secondary,
    });

    // Items produced (top, second row)
    this.itemsText = makeText(this, 4, 12, '', {
      fontSize: '8px',
      color: THEME.status.paused,
    });

    // Hotbar (bottom) - dynamic based on build mode
    this.hotbarText = makeText(this, 4, CANVAS_HEIGHT - 24, '[B] Build', {
      fontSize: '10px',
      color: THEME.text.secondary,
    });

    // Selected building (bottom-right)
    this.selectedText = makeText(this, CANVAS_WIDTH - 4, CANVAS_HEIGHT - 24, 'None', {
      fontSize: '10px',
      color: THEME.text.tertiary,
    });
    this.selectedText.setOrigin(1, 0);

    // Help text
    makeText(
      this,
      4,
      CANVAS_HEIGHT - 12,
      'ESDF:Move  Spc:Build  X:Cancel/Rmv  R:Rot/Research  P:Pause  H:Stats  O:Goals  G:Guide  K:Keys',
      {
        fontSize: '8px',
        color: THEME.text.muted,
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

    // Create tutorial overlay
    this.tutorialOverlay = new TutorialOverlay(this);

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

    // Background
    const panelW = 480;
    const panelH = 240;
    const bg = this.add.graphics();
    bg.fillStyle(THEME.panel.bg, 0.9);
    bg.fillRect(-panelW / 2, -panelH / 2, panelW, panelH);
    bg.lineStyle(2, THEME.panel.border);
    bg.strokeRect(-panelW / 2, -panelH / 2, panelW, panelH);
    this.menuPanel.add(bg);

    // Title
    const title = makeText(this, 0, -panelH / 2 + 14, 'KEY COMMANDS', {
      fontSize: '14px',
      color: THEME.text.primary,
    });
    title.setOrigin(0.5, 0.5);
    this.menuPanel.add(title);

    // Column layout helper
    const colX = [-panelW / 4, panelW / 4];
    const startY = -panelH / 2 + 40;
    const lineH = 13;

    const addColumn = (x: number, header: string, commands: string[]): void => {
      let y = startY;
      const headerText = makeText(this, x, y, header, {
        fontSize: '9px',
        color: THEME.text.secondary,
      });
      headerText.setOrigin(0.5, 0.5);
      this.menuPanel.add(headerText);
      y += lineH + 2;

      for (const cmd of commands) {
        const cmdText = makeText(this, x, y, cmd, {
          fontSize: '8px',
          color: THEME.text.tertiary,
        });
        cmdText.setOrigin(0.5, 0.5);
        this.menuPanel.add(cmdText);
        y += lineH;
      }
    };

    addColumn(colX[0], 'REGULAR MODE', [
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
    ]);

    addColumn(colX[1], 'BUILD MODE', [
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
    ]);

    // Divider line between columns
    const divider = this.add.graphics();
    divider.lineStyle(1, THEME.panel.divider);
    divider.lineBetween(0, startY - 6, 0, panelH / 2 - 30);
    this.menuPanel.add(divider);

    // Close hint at bottom
    const closeHint = makeText(this, 0, panelH / 2 - 14, 'Press K or X to close', {
      fontSize: '10px',
      color: THEME.text.muted,
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
    bg.fillStyle(THEME.panel.bg, 0.9);
    bg.fillRect(-100, -60, 200, 120);
    bg.lineStyle(2, THEME.panel.border);
    bg.strokeRect(-100, -60, 200, 120);
    this.inventoryPanel.add(bg);

    // Title
    const invTitle = makeText(this, 0, -45, 'INVENTORY', {
      fontSize: '12px',
      color: THEME.text.primary,
    });
    invTitle.setOrigin(0.5, 0.5);
    this.inventoryPanel.add(invTitle);

    // Placeholder text
    const placeholder = makeText(this, 0, 0, 'Coming soon...', {
      fontSize: '10px',
      color: THEME.text.muted,
    });
    placeholder.setOrigin(0.5, 0.5);
    this.inventoryPanel.add(placeholder);

    // Close hint
    const hint = makeText(this, 0, 40, 'Press I or X to close', {
      fontSize: '8px',
      color: THEME.text.tertiary,
    });
    hint.setOrigin(0.5, 0.5);
    this.inventoryPanel.add(hint);
  }

  private onGameStateChanged(state: GameUIState): void {
    // Cursor info (what's under cursor)
    if (state.cursorInfo) {
      this.cursorInfoText.setText(state.cursorInfo);
      this.cursorInfoText.setColor(THEME.text.primary);
    } else {
      this.cursorInfoText.setText('');
    }

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
        this.selectedText.setColor(THEME.status.affordable);
      } else {
        this.selectedText.setText(`${displayName} (${costStr})`);
        this.selectedText.setColor(THEME.status.unaffordable);
      }
    } else if (state.cursorOverBuilding) {
      this.selectedText.setText('[X] Deconstruct');
      this.selectedText.setColor(THEME.status.deconstructHint);
    } else {
      this.selectedText.setText('');
      this.selectedText.setColor(THEME.text.tertiary);
    }

    // Hotbar - dynamic based on build mode
    if (state.buildModeActive) {
      const entries: string[] = ['[Q] Quarry', '[F] Forge', '[W] Workbench', '[C] Chest'];
      if (this.researchManager.isBuildingUnlocked('arcane_study')) {
        entries.push('[A] Study');
      }
      if (state.unlockedManaBuildings.includes('mana_well')) {
        entries.push('[M] Well');
      }
      if (state.unlockedManaBuildings.includes('mana_obelisk')) {
        entries.push('[O] Obelisk');
      }
      if (state.unlockedManaBuildings.includes('mana_tower')) {
        entries.push('[T] Tower');
      }
      this.hotbarText.setText(entries.join('  '));
      this.hotbarText.setColor(THEME.text.primary);
    } else {
      this.hotbarText.setText('[B] Build');
      this.hotbarText.setColor(THEME.text.secondary);
    }

    // RP display (after sim status)
    const rpStr = state.researchPoints > 0 ? `  RP:${state.researchPoints}` : '';

    // Mana display (only when there's mana production or consumption)
    let manaStr = '';
    if (state.manaProduction > 0 || state.manaConsumption > 0) {
      manaStr = `  Mana:${state.manaProduction}/${state.manaConsumption}`;
    }

    // Simulation status with play/pause icon
    if (state.simPaused) {
      this.simStatusText.setText(`║ ${state.simSpeed}x${rpStr}${manaStr}`);
      this.simStatusText.setColor(THEME.status.paused);
    } else {
      this.simStatusText.setText(`► ${state.simSpeed}x${rpStr}${manaStr}`);
      this.simStatusText.setColor(THEME.status.active);
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

    // Objectives and stage complete — hidden in sandbox mode
    if (state.gameMode !== 'sandbox') {
      this.objectivesPanel.update(state);
    } else {
      this.objectivesPanel.update({ ...state, objectivesOpen: false, stageCompleteShown: false });
    }

    // Tutorial overlay
    this.tutorialOverlay.update(state.tutorialText);
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
