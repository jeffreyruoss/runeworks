import Phaser from 'phaser';
import { UiScene, ConstraintMode, BitmapText } from 'phaser-pixui';
import {
  CANVAS_HEIGHT,
  BUILDING_COSTS,
  RESOURCE_DISPLAY_NAMES,
  THEME,
  HUD_BAR_HEIGHT,
} from '../config';
import { GameUIState, PlayerResources } from '../types';

import { ObjectivesPanel } from '../managers/ObjectivesPanel';
import { GuidePanel } from '../managers/GuidePanel';
import { ResearchPanel } from '../managers/ResearchPanel';
import { ResearchManager } from '../managers/ResearchManager';
import { TutorialOverlay } from '../managers/TutorialOverlay';
import { MenuPanel } from '../managers/MenuPanel';
import { InventoryPanel } from '../managers/InventoryPanel';
import { BuildPanel } from '../managers/BuildPanel';
import { canAfford } from '../utils';
import { uiTheme, FONT_SM, getFontSize, getHelpFontSize, C } from '../ui-theme';

/** Set text on a pixui BitmapText without the maxWidth feedback loop.
 *  Clears maxWidth before so text renders unwrapped (correct width/height),
 *  uses pixui setter for layout positioning, then clears maxWidth again. */
function setText(bmp: BitmapText, value: string): void {
  bmp.internal.setMaxWidth(0);
  bmp.text = value;
  bmp.internal.setMaxWidth(0);
}

export class UIScene extends UiScene {
  // HUD text components (pixui BitmapText)
  private cursorInfoBmp!: BitmapText;
  private simStatusBmp!: BitmapText;
  private resourcesBmp!: BitmapText;
  private itemsBmp!: BitmapText;
  private helpBmp!: BitmapText;
  private selectedBmp!: BitmapText;
  // HUD bar backgrounds
  private topBarBg!: Phaser.GameObjects.Rectangle;
  private bottomBarBg!: Phaser.GameObjects.Rectangle;

  // Bound listener reference for cleanup
  private boundRepositionBars = this.repositionBars.bind(this);

  // Panels (delegated to managers)
  private menuPanel!: MenuPanel;
  private inventoryPanel!: InventoryPanel;
  private objectivesPanel!: ObjectivesPanel;
  private guidePanel!: GuidePanel;
  private researchPanel!: ResearchPanel;
  private researchManager!: ResearchManager;
  private tutorialOverlay!: TutorialOverlay;
  private buildPanel!: BuildPanel;

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

    this.events.on('shutdown', this.cleanup, this);
  }

  /** Create top and bottom HUD bars with bitmap text */
  private createHudBars(): void {
    const vp = this.viewport;
    const barH = HUD_BAR_HEIGHT;
    const pad = 4;

    // Top bar background
    this.topBarBg = this.add.rectangle(
      Math.floor(vp.width / 2),
      Math.floor(barH / 2),
      vp.width,
      barH,
      THEME.hud.bg,
      0.92
    );
    this.topBarBg.setOrigin(0.5, 0.5);

    // Bottom bar background
    this.bottomBarBg = this.add.rectangle(
      Math.floor(vp.width / 2),
      vp.height - Math.floor(barH / 2),
      vp.width,
      barH,
      THEME.hud.bg,
      0.92
    );
    this.bottomBarBg.setOrigin(0.5, 0.5);

    // --- Top bar text ---
    this.cursorInfoBmp = this.insert.topLeft.bitmapText({
      x: pad,
      y: pad,
      font: FONT_SM,
      size: getFontSize(),
      text: '',
      tint: C.light,
    });

    this.simStatusBmp = this.insert.top.bitmapText({
      x: 0,
      y: pad,
      font: FONT_SM,
      size: getFontSize(),
      tint: C.active,
    });
    setText(this.simStatusBmp, 'Game Speed  > 1x');

    this.resourcesBmp = this.insert.topRight.bitmapText({
      x: pad,
      y: pad,
      font: FONT_SM,
      size: getFontSize(),
      text: '',
      tint: C.secondary,
    });

    this.itemsBmp = this.insert.topLeft.bitmapText({
      x: pad,
      y: pad + 14,
      font: FONT_SM,
      size: getFontSize(),
      text: '',
      tint: C.paused,
    });

    // --- Bottom bar text ---
    // Selected building info (right, top row)
    this.selectedBmp = this.insert.bottomRight.bitmapText({
      x: pad,
      y: pad + 14,
      font: FONT_SM,
      size: getFontSize(),
      text: '',
      tint: 0x8078a0,
    });

    // Dynamic help text with cyan hotkeys (left, bottom row)
    this.helpBmp = this.insert.bottomLeft.bitmapText({
      x: pad,
      y: pad,
      font: FONT_SM,
      size: getHelpFontSize(),
      text: '',
      tint: C.light,
    });

    // Update bar positions on resize
    this.scale.on('resize', this.boundRepositionBars);
  }

  private repositionBars(): void {
    const vp = this.viewport;
    const barH = HUD_BAR_HEIGHT;

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

    const rm = this.registry.get('researchManager');
    if (!rm) {
      throw new Error(
        'ResearchManager not found in registry — ensure GameScene sets it before UIScene creates'
      );
    }
    this.researchManager = rm as ResearchManager;
    this.researchPanel = new ResearchPanel(this);
    this.tutorialOverlay = new TutorialOverlay(this);
    this.buildPanel = new BuildPanel(this);
  }

  private listenToGameScene(): void {
    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('gameStateChanged', this.onGameStateChanged, this);
    gameScene.events.on('guideNavigate', this.onGuideNavigate, this);
    gameScene.events.on('researchNavigate', this.onResearchNavigate, this);
    gameScene.events.on('researchUnlock', this.onResearchUnlock, this);
    // Request initial state now that we're subscribed
    gameScene.events.emit('uiReady');
  }

  private onGameStateChanged(state: GameUIState): void {
    // Cursor info
    setText(this.cursorInfoBmp, state.cursorInfo ?? '');
    this.cursorInfoBmp.tint = C.light;

    // Resources
    setText(this.resourcesBmp, this.formatResources(state.playerResources));

    // Selected building with cost info
    if (state.selectedBuilding) {
      const cost = BUILDING_COSTS[state.selectedBuilding];
      const affordable = canAfford(state.playerResources, cost);
      const costStr = this.formatCost(cost);
      const displayName = state.selectedBuilding.replace(/_/g, ' ').toUpperCase();
      setText(this.selectedBmp, `${displayName} (${costStr})`);
      this.selectedBmp.tint = affordable ? C.valid : C.invalid;
    } else if (state.cursorOverBuilding) {
      setText(this.selectedBmp, '[X] Deconstruct');
      this.selectedBmp.tint = 0xff8888;
    } else {
      setText(this.selectedBmp, '');
    }

    // Build bar replaces help/selected text when open
    const buildOpen = state.activePanel === 'build';
    this.helpBmp.internal.setVisible(!buildOpen);
    this.selectedBmp.internal.setVisible(!buildOpen);

    // Dynamic help text with cyan hotkeys
    this.updateHelpText(state);

    // Build bar — only show buildings the player can actually select
    if (buildOpen) {
      this.buildPanel.updateAvailable(new Set(state.availableBuildings));
    }
    this.buildPanel.setVisible(buildOpen);

    // RP + Mana display
    const rpStr = state.researchPoints > 0 ? `  RP:${state.researchPoints}` : '';
    let manaStr = '';
    if (state.manaProduction > 0 || state.manaConsumption > 0) {
      manaStr = `  Mana:${state.manaProduction}/${state.manaConsumption}`;
    }

    // Sim status
    if (state.simPaused) {
      setText(this.simStatusBmp, `Game Speed  || ${state.simSpeed}x${rpStr}${manaStr}`);
      this.simStatusBmp.tint = C.paused;
    } else {
      setText(this.simStatusBmp, `Game Speed  > ${state.simSpeed}x${rpStr}${manaStr}`);
      this.simStatusBmp.tint = C.active;
    }

    // Items produced
    const items = state.itemsProduced;
    const itemStrings: string[] = [];
    if (items.arcane_ingot) itemStrings.push(`ArcI:${items.arcane_ingot}`);
    if (items.sun_ingot) itemStrings.push(`SunI:${items.sun_ingot}`);
    if (items.cogwheel) itemStrings.push(`Cog:${items.cogwheel}`);
    if (items.thread) itemStrings.push(`Thrd:${items.thread}`);
    if (items.rune) itemStrings.push(`Rune:${items.rune}`);
    setText(this.itemsBmp, itemStrings.join('  '));

    // Panel visibility
    this.menuPanel.setVisible(state.activePanel === 'menu');
    this.inventoryPanel.setVisible(state.activePanel === 'inventory');
    this.guidePanel.setVisible(state.activePanel === 'guide');
    this.researchPanel.setVisible(state.activePanel === 'research');
    if (state.activePanel === 'research') this.researchPanel.update(this.researchManager);

    // Objectives panel (only used in stages mode — tutorial/sandbox hide it)
    if (state.gameMode !== 'stages') {
      this.objectivesPanel.update({ ...state, activePanel: null, stageCompleteShown: false });
    } else {
      this.objectivesPanel.update(state);
    }

    // Tutorial overlay
    this.tutorialOverlay.update(state.tutorialText);
  }

  /** Build the bottom help bar text with per-character cyan tinting on hotkeys */
  private updateHelpText(state: GameUIState): void {
    type Seg = { key: string; label: string; id?: string; tintLabel?: number };
    const s: Seg[] = this.getHelpSegments(state);

    // Tint active placement mode toggle green
    if (state.selectedBuilding) {
      const activeId =
        state.placementMode === 'multi'
          ? 'multi'
          : state.placementMode === 'continue'
            ? 'continue'
            : null;
      if (activeId) {
        const seg = s.find((seg) => seg.id === activeId);
        if (seg) seg.tintLabel = C.valid;
      }
    }

    // Build text and track cyan character ranges + label tint overrides
    let text = '';
    const cyan: Array<[number, number]> = [];
    const labelTints: Array<[number, number, number]> = []; // [start, len, color]
    for (let i = 0; i < s.length; i++) {
      if (i > 0) text += '  ';
      cyan.push([text.length, s[i].key.length]);
      const labelStart = text.length + s[i].key.length + 1; // after ":"
      text += s[i].key + ':' + s[i].label;
      if (s[i].tintLabel != null) {
        labelTints.push([labelStart, s[i].label.length, s[i].tintLabel!]);
      }
    }

    setText(this.helpBmp, text);

    // Apply per-character tinting via underlying Phaser BitmapText
    try {
      const phaser = this.helpBmp.internal;
      phaser.setCharacterTint(0, -1, false, C.light);
      for (const [start, len] of cyan) {
        phaser.setCharacterTint(start, len, false, C.active);
      }
      for (const [start, len, color] of labelTints) {
        phaser.setCharacterTint(start, len, false, color);
      }
    } catch {
      this.helpBmp.tint = C.light;
    }
  }

  private getHelpSegments(state: GameUIState): Array<{ key: string; label: string; id?: string }> {
    // Panel-specific hints
    if (state.activePanel === 'guide') {
      return [
        { key: 'S/F', label: 'Tab' },
        { key: 'G/X', label: 'Close' },
      ];
    }
    if (state.activePanel === 'research') {
      return [
        { key: 'ESDF', label: 'Navigate' },
        { key: 'Space', label: 'Unlock' },
        { key: 'X', label: 'Close' },
      ];
    }
    if (state.activePanel !== null) {
      return [{ key: 'X', label: 'Close' }];
    }

    // Building selected — placement mode
    if (state.selectedBuilding) {
      return [
        { key: 'ESDF', label: 'Move' },
        { key: 'Space', label: 'Place' },
        { key: 'R', label: 'Rotate' },
        { key: 'M', label: 'Multi-Place Toggle', id: 'multi' },
        { key: 'C', label: 'Continue Building Toggle', id: 'continue' },
        { key: 'X', label: 'Cancel' },
      ];
    }

    // Default — no panel, no selection
    return [
      { key: 'ESDF', label: 'Move' },
      { key: 'B', label: 'Build' },
      { key: 'R', label: 'Research' },
      { key: 'P', label: 'Pause' },
      { key: 'O', label: 'Goals' },
      { key: 'G', label: 'Guide' },
      { key: 'K', label: 'Keys' },
    ];
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

  private onGuideNavigate(dx: number): void {
    this.guidePanel.navigate(dx);
  }

  private onResearchNavigate(dx: number, dy: number): void {
    this.researchPanel.navigate(dx, dy);
    this.researchPanel.update(this.researchManager);
  }

  private onResearchUnlock(): void {
    this.researchPanel.tryUnlock(this.researchManager);
    this.researchPanel.update(this.researchManager);
  }

  private cleanup(): void {
    const gameScene = this.scene.get('GameScene');
    gameScene.events.off('gameStateChanged', this.onGameStateChanged, this);
    gameScene.events.off('guideNavigate', this.onGuideNavigate, this);
    gameScene.events.off('researchNavigate', this.onResearchNavigate, this);
    gameScene.events.off('researchUnlock', this.onResearchUnlock, this);
    this.scale.off('resize', this.boundRepositionBars);
  }
}
