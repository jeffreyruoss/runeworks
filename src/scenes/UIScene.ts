import Phaser from 'phaser';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  THEME,
  BUILDING_COSTS,
  RESOURCE_DISPLAY_NAMES,
  PANEL_BORDER,
  BAR_VPAD,
} from '../config';
import { GameUIState, PlayerResources } from '../types';

import { ObjectivesPanel } from '../managers/ObjectivesPanel';
import { GuidePanel } from '../managers/GuidePanel';
import { ResearchPanel } from '../managers/ResearchPanel';
import { ResearchManager } from '../managers/ResearchManager';
import { TutorialOverlay } from '../managers/TutorialOverlay';
import { MenuPanel } from '../managers/MenuPanel';
import { InventoryPanel } from '../managers/InventoryPanel';
import { canAfford } from '../utils';
import { makeText, createPanelFrame, setupCamera } from '../phaser-utils';

export class UIScene extends Phaser.Scene {
  private selectedText!: Phaser.GameObjects.Text;
  private simStatusText!: Phaser.GameObjects.Text;
  private itemsText!: Phaser.GameObjects.Text;
  private resourcesText!: Phaser.GameObjects.Text;
  private cursorInfoText!: Phaser.GameObjects.Text;
  private hotbarText!: Phaser.GameObjects.Text;

  // Panels (delegated to managers)
  private menuPanel!: MenuPanel;
  private inventoryPanel!: InventoryPanel;
  private objectivesPanel!: ObjectivesPanel;
  private guidePanel!: GuidePanel;
  private researchPanel!: ResearchPanel;
  private researchManager!: ResearchManager;
  private tutorialOverlay!: TutorialOverlay;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    setupCamera(this);

    const barPad = PANEL_BORDER + BAR_VPAD; // 12 — equal on all sides for bars
    const rightX = CANVAS_WIDTH - barPad;
    const row1Y = barPad;
    const row2Y = row1Y + 12;

    // Top bar
    const topBarH = 2 * PANEL_BORDER + 2 * BAR_VPAD + 20; // 48
    const topBar = createPanelFrame(this, CANVAS_WIDTH, topBarH, 0.8);
    topBar.setPosition(CANVAS_WIDTH / 2, topBarH / 2);

    // Bottom bar
    const botBarH = 2 * PANEL_BORDER + 2 * BAR_VPAD + 20; // 48
    const bottomBar = createPanelFrame(this, CANVAS_WIDTH, botBarH, 0.8);
    bottomBar.setPosition(CANVAS_WIDTH / 2, CANVAS_HEIGHT - botBarH / 2);

    const botRow1Y = CANVAS_HEIGHT - botBarH + row1Y;
    const botRow2Y = botRow1Y + 12;

    // Cursor info (top-left, shows what's under cursor)
    this.cursorInfoText = makeText(this, barPad, row1Y, '', {
      fontSize: '10px',
      color: THEME.text.primary,
    });

    // Simulation status with play icon (top-center)
    this.simStatusText = makeText(this, CANVAS_WIDTH / 2, row1Y, '► 1x', {
      fontSize: '10px',
      color: THEME.status.active,
    });
    this.simStatusText.setOrigin(0.5, 0);

    // Resources (top-right area)
    this.resourcesText = makeText(this, CANVAS_WIDTH - 280, row1Y, '', {
      fontSize: '10px',
      color: THEME.text.secondary,
    });

    // Items produced (top, second row)
    this.itemsText = makeText(this, barPad, row2Y, '', {
      fontSize: '8px',
      color: THEME.status.paused,
    });

    // Hotbar (bottom row 1)
    this.hotbarText = makeText(this, barPad, botRow1Y, '[B] Build', {
      fontSize: '10px',
      color: THEME.text.secondary,
    });

    // Selected building (bottom-right row 1)
    this.selectedText = makeText(this, rightX, botRow1Y, 'None', {
      fontSize: '10px',
      color: THEME.text.tertiary,
    });
    this.selectedText.setOrigin(1, 0);

    // Help text (bottom row 2)
    makeText(
      this,
      barPad,
      botRow2Y,
      'ESDF:Move  Spc:Build  X:Cancel/Rmv  R:Rot/Research  P:Pause  H:Stats  O:Goals  G:Guide  K:Keys',
      {
        fontSize: '8px',
        color: THEME.text.muted,
      }
    );

    // Create panels (all delegated to manager classes)
    this.menuPanel = new MenuPanel(this);
    this.inventoryPanel = new InventoryPanel(this);
    this.objectivesPanel = new ObjectivesPanel(this);
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

    // Panel visibility
    this.menuPanel.setVisible(state.menuOpen);
    this.inventoryPanel.setVisible(state.inventoryOpen);
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
