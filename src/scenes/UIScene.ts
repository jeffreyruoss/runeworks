import Phaser from 'phaser';
import { UiScene, ConstraintMode, BitmapText } from 'phaser-pixui';
import { CANVAS_HEIGHT, BUILDING_COSTS, RESOURCE_DISPLAY_NAMES } from '../config';
import { GameUIState, PlayerResources } from '../types';

import { ObjectivesPanel } from '../managers/ObjectivesPanel';
import { GuidePanel } from '../managers/GuidePanel';
import { ResearchPanel } from '../managers/ResearchPanel';
import { ResearchManager } from '../managers/ResearchManager';
import { TutorialOverlay } from '../managers/TutorialOverlay';
import { MenuPanel } from '../managers/MenuPanel';
import { InventoryPanel } from '../managers/InventoryPanel';
import { canAfford } from '../utils';
import { uiTheme, FONT_SM } from '../ui-theme';

export class UIScene extends UiScene {
  // HUD text components (pixui BitmapText)
  private cursorInfoBmp!: BitmapText;
  private simStatusBmp!: BitmapText;
  private resourcesBmp!: BitmapText;
  private itemsBmp!: BitmapText;
  private hotbarBmp!: BitmapText;
  private selectedBmp!: BitmapText;
  // HUD bar backgrounds
  private topBarBg!: Phaser.GameObjects.Rectangle;
  private bottomBarBg!: Phaser.GameObjects.Rectangle;

  // Panels (delegated to managers)
  private menuPanel!: MenuPanel;
  private inventoryPanel!: InventoryPanel;
  private objectivesPanel!: ObjectivesPanel;
  private guidePanel!: GuidePanel;
  private researchPanel!: ResearchPanel;
  private researchManager!: ResearchManager;
  private tutorialOverlay!: TutorialOverlay;

  constructor() {
    super({
      key: 'UIScene',
      viewportConstraints: { mode: ConstraintMode.Minimum, height: CANVAS_HEIGHT },
      theme: uiTheme,
    });
  }

  create(): void {
    super.create();
    this.scene.bringToTop('UIScene');

    this.createHudBars();
    this.createPanels();
    this.listenToGameScene();
  }

  /** Create top and bottom HUD bars with bitmap text */
  private createHudBars(): void {
    const vp = this.viewport;
    const barH = 32;
    const pad = 4;

    // Top bar background (simple filled rectangle — frame_dark 9-slice needs 64px min)
    this.topBarBg = this.add.rectangle(
      Math.floor(vp.width / 2),
      Math.floor(barH / 2),
      vp.width,
      barH,
      0x0a0816,
      0.92
    );
    this.topBarBg.setOrigin(0.5, 0.5);

    // Bottom bar background
    this.bottomBarBg = this.add.rectangle(
      Math.floor(vp.width / 2),
      vp.height - Math.floor(barH / 2),
      vp.width,
      barH,
      0x0a0816,
      0.92
    );
    this.bottomBarBg.setOrigin(0.5, 0.5);

    // --- Top bar text (positive offsets = inward) ---
    // Cursor info (top-left)
    this.cursorInfoBmp = this.insert.topLeft.bitmapText({
      x: pad,
      y: pad,
      font: FONT_SM,
      text: '',
      tint: 0xe8e0f0,
    });

    // Sim status (top-center)
    this.simStatusBmp = this.insert.top.bitmapText({
      x: 0,
      y: pad,
      font: FONT_SM,
      text: '> 1x',
      tint: 0x4af0ff,
    });

    // Resources (top-right)
    this.resourcesBmp = this.insert.topRight.bitmapText({
      x: pad,
      y: pad,
      font: FONT_SM,
      text: '',
      tint: 0xb0a8c0,
    });

    // Items produced (top-left, second row)
    this.itemsBmp = this.insert.topLeft.bitmapText({
      x: pad,
      y: pad + 14,
      font: FONT_SM,
      text: '',
      tint: 0xffdd44,
    });

    // --- Bottom bar text (positive offsets = inward) ---
    // Hotbar (bottom-left)
    this.hotbarBmp = this.insert.bottomLeft.bitmapText({
      x: pad,
      y: pad + 14,
      font: FONT_SM,
      text: '[B] Build',
      tint: 0xb0a8c0,
    });

    // Selected building (bottom-right)
    this.selectedBmp = this.insert.bottomRight.bitmapText({
      x: pad,
      y: pad + 14,
      font: FONT_SM,
      text: '',
      tint: 0x8078a0,
    });

    // Help text (bottom-left, second row — closer to bottom edge)
    // Static help text (no need to update, so no stored reference)
    this.insert.bottomLeft.bitmapText({
      x: pad,
      y: pad,
      font: FONT_SM,
      text: 'ESDF:Move  Spc:Build  X:Cancel  R:Rot  P:Pause  O:Goals  G:Guide  K:Keys',
      tint: 0x605880,
    });

    // Update bar positions on resize
    this.scale.on('resize', () => this.repositionBars());
  }

  private repositionBars(): void {
    const vp = this.viewport;
    const barH = 32;

    this.topBarBg.setPosition(Math.floor(vp.width / 2), Math.floor(barH / 2));
    this.topBarBg.setSize(vp.width, barH);

    this.bottomBarBg.setPosition(Math.floor(vp.width / 2), vp.height - Math.floor(barH / 2));
    this.bottomBarBg.setSize(vp.width, barH);
  }

  private createPanels(): void {
    this.menuPanel = new MenuPanel(this);
    this.inventoryPanel = new InventoryPanel(this);
    this.objectivesPanel = new ObjectivesPanel(this);
    this.guidePanel = new GuidePanel(this);

    this.researchManager = this.registry.get('researchManager') as ResearchManager;
    this.researchPanel = new ResearchPanel(this);
    this.tutorialOverlay = new TutorialOverlay(this);
  }

  private listenToGameScene(): void {
    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('gameStateChanged', this.onGameStateChanged, this);
    gameScene.events.on('researchNavigate', this.onResearchNavigate, this);
    gameScene.events.on('researchUnlock', this.onResearchUnlock, this);
  }

  private onGameStateChanged(state: GameUIState): void {
    // Cursor info
    this.cursorInfoBmp.text = state.cursorInfo ?? '';
    this.cursorInfoBmp.tint = 0xe8e0f0;

    // Resources
    this.resourcesBmp.text = this.formatResources(state.playerResources);

    // Selected building with cost info
    if (state.selectedBuilding) {
      const cost = BUILDING_COSTS[state.selectedBuilding];
      const affordable = canAfford(state.playerResources, cost);
      const costStr = this.formatCost(cost);
      const displayName = state.selectedBuilding.replace(/_/g, ' ').toUpperCase();
      this.selectedBmp.text = `${displayName} (${costStr})`;
      this.selectedBmp.tint = affordable ? 0x44ff88 : 0xff5566;
    } else if (state.cursorOverBuilding) {
      this.selectedBmp.text = '[X] Deconstruct';
      this.selectedBmp.tint = 0xff8888;
    } else {
      this.selectedBmp.text = '';
    }

    // Hotbar
    if (state.buildModeActive) {
      const entries: string[] = ['[Q] Quarry', '[F] Forge', '[W] Workbench', '[C] Chest'];
      if (this.researchManager.isBuildingUnlocked('arcane_study')) entries.push('[A] Study');
      if (state.unlockedManaBuildings.includes('mana_well')) entries.push('[M] Well');
      if (state.unlockedManaBuildings.includes('mana_obelisk')) entries.push('[O] Obelisk');
      if (state.unlockedManaBuildings.includes('mana_tower')) entries.push('[T] Tower');
      this.hotbarBmp.text = entries.join('  ');
      this.hotbarBmp.tint = 0xe8e0f0;
    } else {
      this.hotbarBmp.text = '[B] Build';
      this.hotbarBmp.tint = 0xb0a8c0;
    }

    // RP + Mana display
    const rpStr = state.researchPoints > 0 ? `  RP:${state.researchPoints}` : '';
    let manaStr = '';
    if (state.manaProduction > 0 || state.manaConsumption > 0) {
      manaStr = `  Mana:${state.manaProduction}/${state.manaConsumption}`;
    }

    // Sim status
    if (state.simPaused) {
      this.simStatusBmp.text = `|| ${state.simSpeed}x${rpStr}${manaStr}`;
      this.simStatusBmp.tint = 0xffdd44;
    } else {
      this.simStatusBmp.text = `> ${state.simSpeed}x${rpStr}${manaStr}`;
      this.simStatusBmp.tint = 0x4af0ff;
    }

    // Items produced
    const items = state.itemsProduced;
    const itemStrings: string[] = [];
    if (items.arcane_ingot) itemStrings.push(`ArcI:${items.arcane_ingot}`);
    if (items.sun_ingot) itemStrings.push(`SunI:${items.sun_ingot}`);
    if (items.cogwheel) itemStrings.push(`Cog:${items.cogwheel}`);
    if (items.thread) itemStrings.push(`Thrd:${items.thread}`);
    if (items.rune) itemStrings.push(`Rune:${items.rune}`);
    this.itemsBmp.text = itemStrings.join('  ');

    // Panel visibility
    this.menuPanel.setVisible(state.menuOpen);
    this.inventoryPanel.setVisible(state.inventoryOpen);
    this.guidePanel.setVisible(state.guideOpen);
    this.researchPanel.setVisible(state.researchOpen);
    if (state.researchOpen) this.researchPanel.update(this.researchManager);

    // Objectives
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
