import Phaser from 'phaser';
import { UiScene, ConstraintMode, BitmapText } from 'phaser-pixui';
import { CANVAS_WIDTH, BUILDING_COSTS, RESOURCE_DISPLAY_NAMES, THEME } from '../config';
import { getBarHeights } from '../layout';
import { GameUIState, PlayerResources } from '../types';

import { ObjectivesPanel } from '../managers/ObjectivesPanel';
import { GuidePanel } from '../managers/GuidePanel';
import { ResearchPanel } from '../managers/ResearchPanel';
import { ResearchManager } from '../managers/ResearchManager';
import { TutorialOverlay } from '../managers/TutorialOverlay';
import { MenuPanel } from '../managers/MenuPanel';
import { InventoryPanel } from '../managers/InventoryPanel';
import { BuildPanel } from '../managers/BuildPanel';
import { UpgradesPanel } from '../managers/UpgradesPanel';
import { UpgradeState } from '../data/upgrades';
import { FlowSystem } from '../simulation/FlowSystem';
import { canAfford } from '../utils';
import { uiTheme, FONT_SM, getFontSize, getHelpFontSize, C } from '../ui-theme';

// Color stops for flow bar interpolation (hoisted to avoid per-frame allocation)
const FLOW_COLOR_STOPS: ReadonlyArray<readonly [number, number, number, number]> = [
  [0.0, 0x1a, 0x3a, 0x6a],
  [0.25, 0x22, 0x66, 0xcc],
  [0.5, 0x4a, 0xf0, 0xff],
  [0.75, 0x44, 0xff, 0x88],
  [1.0, 0xff, 0x88, 0x44],
];

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
  private helpBmp!: BitmapText;
  private selectedBmp!: BitmapText;
  // HUD bar backgrounds
  private topBarBg!: Phaser.GameObjects.Rectangle;
  private bottomBarBg!: Phaser.GameObjects.Rectangle;
  // Flow meter bar
  private flowBarBg!: Phaser.GameObjects.Rectangle;
  private flowBarFill!: Phaser.GameObjects.Rectangle;
  private flowPointsBmp!: BitmapText;

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
  private upgradesPanel!: UpgradesPanel;
  private upgradeState!: UpgradeState;
  private flowSystem!: FlowSystem;
  private prevFlowLevel = -1;
  private prevFlowPoints = -1;

  constructor() {
    super({
      key: 'UIScene',
      viewportConstraints: {
        mode: ConstraintMode.Minimum,
        width: CANVAS_WIDTH,
      },
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
    const pad = 4;
    const bars = getBarHeights(this.zoom);
    const topH = bars.top;
    const bottomH = bars.bottom;

    // Top bar background
    this.topBarBg = this.add.rectangle(
      Math.floor(vp.width / 2),
      Math.floor(topH / 2),
      vp.width,
      topH,
      THEME.hud.bg,
      1
    );
    this.topBarBg.setOrigin(0.5, 0.5);

    // Bottom bar background
    this.bottomBarBg = this.add.rectangle(
      Math.floor(vp.width / 2),
      vp.height - Math.floor(bottomH / 2),
      vp.width,
      bottomH,
      THEME.hud.bg,
      1
    );
    this.bottomBarBg.setOrigin(0.5, 0.5);

    // --- Flow meter bar (thin bar at bottom edge of top HUD) ---
    const flowBarH = 3;
    const flowY = topH - Math.floor(flowBarH / 2);
    this.flowBarBg = this.add.rectangle(
      Math.floor(vp.width / 2),
      flowY,
      vp.width,
      flowBarH,
      0x1a1830,
      1
    );
    this.flowBarBg.setOrigin(0.5, 0.5);
    this.flowBarFill = this.add.rectangle(0, flowY, 0, flowBarH, 0x2266cc, 1);
    this.flowBarFill.setOrigin(0, 0.5);

    // Flow points counter (top-right)
    this.flowPointsBmp = this.insert.topRight.bitmapText({
      x: pad,
      y: pad,
      font: FONT_SM,
      size: getFontSize(),
      text: '',
      tint: C.muted,
    });

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
    const bars = getBarHeights(this.zoom);
    const topH = bars.top;
    const bottomH = bars.bottom;

    this.topBarBg.setPosition(Math.floor(vp.width / 2), Math.floor(topH / 2));
    this.topBarBg.setSize(vp.width, topH);

    this.bottomBarBg.setPosition(Math.floor(vp.width / 2), vp.height - Math.floor(bottomH / 2));
    this.bottomBarBg.setSize(vp.width, bottomH);

    // Reposition flow bar
    const flowBarH = 3;
    const flowY = topH - Math.floor(flowBarH / 2);
    this.flowBarBg.setPosition(Math.floor(vp.width / 2), flowY);
    this.flowBarBg.setSize(vp.width, flowBarH);
    this.flowBarFill.setY(flowY);
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
    this.upgradesPanel = new UpgradesPanel(this);
    this.upgradeState = this.registry.get('upgradeState') as UpgradeState;
    this.flowSystem = this.registry.get('flowSystem') as FlowSystem;
  }

  private listenToGameScene(): void {
    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('gameStateChanged', this.onGameStateChanged, this);
    gameScene.events.on('guideNavigate', this.onGuideNavigate, this);
    gameScene.events.on('researchNavigate', this.onResearchNavigate, this);
    gameScene.events.on('researchUnlock', this.onResearchUnlock, this);
    gameScene.events.on('upgradesNavigate', this.onUpgradesNavigate, this);
    gameScene.events.on('upgradesPurchase', this.onUpgradesPurchase, this);
    // Request initial state now that we're subscribed
    gameScene.events.emit('uiReady');
  }

  private onGameStateChanged(state: GameUIState): void {
    // Cursor info
    setText(this.cursorInfoBmp, state.cursorInfo ?? '');
    this.cursorInfoBmp.tint = C.light;

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

    // Panel visibility
    this.menuPanel.setVisible(state.activePanel === 'menu');
    const invOpen = state.activePanel === 'inventory';
    if (invOpen) this.inventoryPanel.update(state.playerResources, state.itemsProduced);
    this.inventoryPanel.setVisible(invOpen);
    this.guidePanel.setVisible(state.activePanel === 'guide');
    this.researchPanel.setVisible(state.activePanel === 'research');
    if (state.activePanel === 'research') this.researchPanel.update(this.researchManager);

    // Objectives panel (only used in stages mode — tutorial/sandbox hide it)
    if (state.gameMode !== 'stages') {
      this.objectivesPanel.update({ ...state, activePanel: null, stageCompleteShown: false });
    } else {
      this.objectivesPanel.update(state);
    }

    // Upgrades panel
    const upgradesOpen = state.activePanel === 'upgrades';
    if (upgradesOpen) this.upgradesPanel.update(this.upgradeState, state.flowPoints);
    this.upgradesPanel.setVisible(upgradesOpen);

    // Flow meter bar
    this.updateFlowBar(state.flowLevel, state.flowPoints);

    // Tutorial overlay
    this.tutorialOverlay.update(state.tutorialText);
  }

  private updateFlowBar(level: number, points: number): void {
    if (level === this.prevFlowLevel && points === this.prevFlowPoints) return;
    this.prevFlowLevel = level;
    this.prevFlowPoints = points;

    const vp = this.viewport;
    const fraction = level / 100;
    this.flowBarFill.setSize(Math.floor(vp.width * fraction), 3);
    this.flowBarFill.setFillStyle(this.getFlowColor(fraction));

    if (points > 0) {
      setText(this.flowPointsBmp, `Flow:${points}`);
      this.flowPointsBmp.tint = C.active;
    } else {
      setText(this.flowPointsBmp, '');
    }
  }

  private getFlowColor(fraction: number): number {
    let lo = FLOW_COLOR_STOPS[0];
    let hi = FLOW_COLOR_STOPS[FLOW_COLOR_STOPS.length - 1];
    for (let i = 0; i < FLOW_COLOR_STOPS.length - 1; i++) {
      if (fraction >= FLOW_COLOR_STOPS[i][0] && fraction <= FLOW_COLOR_STOPS[i + 1][0]) {
        lo = FLOW_COLOR_STOPS[i];
        hi = FLOW_COLOR_STOPS[i + 1];
        break;
      }
    }

    const range = hi[0] - lo[0];
    const t = range > 0 ? (fraction - lo[0]) / range : 0;
    const r = Math.round(lo[1] + (hi[1] - lo[1]) * t);
    const g = Math.round(lo[2] + (hi[2] - lo[2]) * t);
    const b = Math.round(lo[3] + (hi[3] - lo[3]) * t);
    return (r << 16) | (g << 8) | b;
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
    if (state.activePanel === 'upgrades') {
      return [
        { key: 'E/D', label: 'Select' },
        { key: 'Space', label: 'Buy' },
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
      { key: 'U', label: 'Upgrades' },
      { key: 'G', label: 'Guide' },
      { key: 'K', label: 'Keys' },
    ];
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

  private onUpgradesNavigate(dy: number): void {
    this.upgradesPanel.navigate(dy);
  }

  private onUpgradesPurchase(): void {
    this.upgradesPanel.tryPurchase(this.upgradeState, () => this.flowSystem.spendPoint());
    this.upgradesPanel.update(this.upgradeState, this.flowSystem.getFlowPoints());
  }

  private cleanup(): void {
    const gameScene = this.scene.get('GameScene');
    gameScene.events.off('gameStateChanged', this.onGameStateChanged, this);
    gameScene.events.off('guideNavigate', this.onGuideNavigate, this);
    gameScene.events.off('researchNavigate', this.onResearchNavigate, this);
    gameScene.events.off('researchUnlock', this.onResearchUnlock, this);
    gameScene.events.off('upgradesNavigate', this.onUpgradesNavigate, this);
    gameScene.events.off('upgradesPurchase', this.onUpgradesPurchase, this);
    this.scale.off('resize', this.boundRepositionBars);
  }
}
