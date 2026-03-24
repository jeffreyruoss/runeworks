import Phaser from 'phaser';
import { BUILDING_COSTS, TICKS_PER_SECOND, RESOURCE_DISPLAY_NAMES } from '../config';
import { ITEM_DISPLAY_NAMES } from '../data/stages';
import { TERRAIN_DISPLAY_NAMES, TERRAIN_COLORS, ResourceTerrainType } from '../data/terrain';
import { RECIPES } from '../data/recipes';
import { RESEARCH_RECIPES } from '../data/research';
import { BUILDING_DEFINITIONS } from '../data/buildings';
import { BuildingType, ItemType } from '../types';
import { FONT_SM, getFontSize, C, addPanelBackground } from '../ui-theme';
import { getViewport } from '../utils';
import { getBarHeights } from '../layout';

/** Items that have 8x8 sprites in the atlas */
const ITEM_SPRITES: Set<ItemType> = new Set([
  'arcstone',
  'sunite',
  'arcane_ingot',
  'sun_ingot',
  'cogwheel',
  'thread',
  'rune',
  'stone',
  'wood',
  'iron',
  'clay',
  'crystal_shard',
]);

/** Resource entries: terrain type -> item yielded */
const RESOURCE_ENTRIES: Array<{ item: ItemType; terrain: ResourceTerrainType }> = [
  { item: 'stone', terrain: 'stone' },
  { item: 'wood', terrain: 'forest' },
  { item: 'iron', terrain: 'iron' },
  { item: 'clay', terrain: 'clay' },
  { item: 'crystal_shard', terrain: 'crystal_shard' },
  { item: 'arcstone', terrain: 'arcstone' },
  { item: 'sunite', terrain: 'sunite' },
];

const TAB_NAMES = ['RESOURCES', 'ITEMS', 'BUILDINGS', 'RESEARCH'];
const TAB_COLORS = [0x88aaff, 0xffaa44, 0x44ff88, 0xcc88ff];

interface TabDisplay {
  container: Phaser.GameObjects.Container;
  header: Phaser.GameObjects.BitmapText;
  underline: Phaser.GameObjects.Graphics;
}

/**
 * Full-page guide panel with tabbed layout.
 * Switch tabs with S/F keys, close with G or X.
 */
export class GuidePanel {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private tabs: TabDisplay[] = [];
  private currentTab = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createPanel();
  }

  setVisible(visible: boolean): void {
    const wasVisible = this.container.visible;
    this.container.setVisible(visible);
    if (visible && !wasVisible) this.updateTabDisplay();
  }

  navigate(dx: number): void {
    const newTab = Phaser.Math.Clamp(this.currentTab + dx, 0, TAB_NAMES.length - 1);
    if (newTab !== this.currentTab) {
      this.currentTab = newTab;
      this.updateTabDisplay();
    }
  }

  private updateTabDisplay(): void {
    for (let i = 0; i < this.tabs.length; i++) {
      const active = i === this.currentTab;
      this.tabs[i].container.setVisible(active);
      this.tabs[i].header.setTint(active ? TAB_COLORS[i] : C.muted);
      this.tabs[i].underline.setVisible(active);
    }
  }

  /** Add a small item sprite to a container if the item has a sprite in the atlas */
  private addItemSprite(
    ct: Phaser.GameObjects.Container,
    item: ItemType,
    x: number,
    y: number
  ): void {
    if (!ITEM_SPRITES.has(item)) return;
    const sprite = this.scene.add.sprite(x, y, 'sprites', item);
    sprite.setDisplaySize(10, 10);
    ct.add(sprite);
  }

  private createPanel(): void {
    const vp = getViewport(this.scene);
    const bars = getBarHeights((this.scene as any).zoom);
    const centerY = bars.top + (vp.height - bars.top - bars.bottom) / 2;
    this.container = this.scene.add.container(Math.floor(vp.width / 2), Math.floor(centerY));
    this.container.setDepth(1000);
    this.container.setVisible(false);

    const padX = 20;
    const padY = 16;
    const contentW = 500;
    const contentH = 340;
    const panelW = contentW + 2 * padX;
    const panelH = contentH + 2 * padY;

    addPanelBackground(this.scene, this.container, panelW, panelH);

    const left = -panelW / 2 + padX;
    const top = -panelH / 2 + padY;

    // Title
    const title = this.scene.add.bitmapText(0, top, FONT_SM, 'GUIDE', getFontSize());
    title.setOrigin(0.5, 0);
    title.setTint(C.light);
    this.container.add(title);

    // Tab bar
    const tabY = top + 18;
    const tabSpacing = contentW / TAB_NAMES.length;

    for (let i = 0; i < TAB_NAMES.length; i++) {
      const tabX = left + tabSpacing * i + tabSpacing / 2;

      const header = this.scene.add.bitmapText(tabX, tabY, FONT_SM, TAB_NAMES[i], getFontSize());
      header.setOrigin(0.5, 0);
      header.setTint(C.muted);
      this.container.add(header);

      const underline = this.scene.add.graphics();
      const hw = header.width / 2;
      underline.lineStyle(1, TAB_COLORS[i]);
      underline.lineBetween(tabX - hw, tabY + 14, tabX + hw, tabY + 14);
      underline.setVisible(false);
      this.container.add(underline);

      const tc = this.scene.add.container(0, 0);
      tc.setVisible(false);
      this.container.add(tc);

      this.tabs.push({ container: tc, header, underline });
    }

    // Divider below tabs
    const dividerY = tabY + 18;
    const divider = this.scene.add.graphics();
    divider.lineStyle(1, 0x444466);
    divider.lineBetween(left, dividerY, left + contentW, dividerY);
    this.container.add(divider);

    // Content area below divider
    const contentTop = dividerY + 6;

    this.createResourcesTab(this.tabs[0].container, left, contentTop);
    this.createItemsTab(this.tabs[1].container, left, contentTop);
    this.createBuildingsTab(this.tabs[2].container, left, contentTop);
    this.createResearchTab(this.tabs[3].container, left, contentTop);

    // Hint text
    const hint = this.scene.add.bitmapText(
      0,
      top + contentH,
      FONT_SM,
      'S/F:Switch Tab  G/X:Close',
      getFontSize()
    );
    hint.setOrigin(0.5, 1);
    hint.setTint(0x8078a0);
    this.container.add(hint);
  }

  private createResourcesTab(ct: Phaser.GameObjects.Container, x: number, y: number): void {
    let rowY = y;
    for (const entry of RESOURCE_ENTRIES) {
      const name = ITEM_DISPLAY_NAMES[entry.item] || entry.item;
      const source = TERRAIN_DISPLAY_NAMES[entry.terrain];
      const colors = TERRAIN_COLORS[entry.terrain];

      // Color swatch
      const thumb = this.scene.add.graphics();
      thumb.fillStyle(colors.highlight, 1);
      thumb.fillRect(x, rowY + 1, 10, 10);
      ct.add(thumb);

      this.addItemSprite(ct, entry.item, x + 22, rowY + 6);

      const nameText = this.scene.add.bitmapText(x + 32, rowY, FONT_SM, name, getFontSize());
      nameText.setTint(C.secondary);
      ct.add(nameText);

      const sourceText = this.scene.add.bitmapText(x + 140, rowY, FONT_SM, source, getFontSize());
      sourceText.setTint(C.muted);
      ct.add(sourceText);

      rowY += 18;
    }
  }

  private createItemsTab(ct: Phaser.GameObjects.Container, x: number, y: number): void {
    let rowY = y;
    for (const recipe of RECIPES) {
      const outputItem = [...recipe.outputs.keys()][0];
      const outputCount = recipe.outputs.get(outputItem)!;
      const name = ITEM_DISPLAY_NAMES[outputItem] || outputItem;

      this.addItemSprite(ct, outputItem, x + 5, rowY + 5);

      const nameText = this.scene.add.bitmapText(x + 14, rowY, FONT_SM, name, getFontSize());
      nameText.setTint(C.secondary);
      ct.add(nameText);

      // Recipe details on second line
      const inputStr = [...recipe.inputs.entries()]
        .map(([item, count]) => `${count} ${ITEM_DISPLAY_NAMES[item] || item}`)
        .join(' + ');
      const timeStr = `${recipe.craftTimeTicks / TICKS_PER_SECOND}s`;
      const buildingName = recipe.building.charAt(0).toUpperCase() + recipe.building.slice(1);
      const detail = `${inputStr} -> ${outputCount} (${timeStr}, ${buildingName})`;

      const detailText = this.scene.add.bitmapText(
        x + 14,
        rowY + 14,
        FONT_SM,
        detail,
        getFontSize()
      );
      detailText.setTint(C.muted);
      ct.add(detailText);

      rowY += 32;
    }
  }

  private createBuildingsTab(ct: Phaser.GameObjects.Container, x: number, y: number): void {
    const buildings: BuildingType[] = [
      'quarry',
      'forge',
      'workbench',
      'chest',
      'arcane_study',
      'mana_well',
      'mana_obelisk',
      'mana_tower',
    ];

    let rowY = y;
    for (const bType of buildings) {
      const def = BUILDING_DEFINITIONS[bType];
      const cost = BUILDING_COSTS[bType];
      const name = bType
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      // Building sprite
      const sprite = this.scene.add.sprite(x + 7, rowY + 7, 'sprites', bType);
      sprite.setDisplaySize(14, 14);
      ct.add(sprite);

      // Name + size
      const sizeStr = `${def.width}x${def.height}`;
      const nameText = this.scene.add.bitmapText(
        x + 18,
        rowY,
        FONT_SM,
        `${name}  (${sizeStr})`,
        getFontSize()
      );
      nameText.setTint(C.secondary);
      ct.add(nameText);

      // Cost
      const costStr = Object.entries(cost)
        .filter(([, v]) => v && v > 0)
        .map(([k, v]) => `${v} ${RESOURCE_DISPLAY_NAMES[k] || k}`)
        .join(', ');
      const costText = this.scene.add.bitmapText(
        x + 18,
        rowY + 13,
        FONT_SM,
        `Cost: ${costStr}`,
        getFontSize()
      );
      costText.setTint(C.muted);
      ct.add(costText);

      // I/O or special description
      const ioStr = this.getBuildingDescription(bType, def);
      const ioText = this.scene.add.bitmapText(x + 18, rowY + 25, FONT_SM, ioStr, getFontSize());
      ioText.setTint(C.muted);
      ct.add(ioText);

      rowY += 36;
    }
  }

  private getBuildingDescription(
    bType: BuildingType,
    def: (typeof BUILDING_DEFINITIONS)[BuildingType]
  ): string {
    if (bType === 'quarry') return 'Extracts from veins -> output right';
    if (bType === 'chest') return 'Storage (all sides)';
    if (bType === 'arcane_study') return 'Consumes items -> Research Points';
    if (def.manaProduction > 0)
      return `Generates ${def.manaProduction} mana, range ${def.manaRadius}`;
    if (bType === 'mana_tower') return `Extends mana network, range ${def.manaRadius}`;
    return `In: ${def.inputSides.join('/')} -> Out: ${def.outputSides.join('/')}`;
  }

  private createResearchTab(ct: Phaser.GameObjects.Container, x: number, y: number): void {
    const header = this.scene.add.bitmapText(
      x,
      y,
      FONT_SM,
      'STUDY RECIPES (Arcane Study)',
      getFontSize()
    );
    header.setTint(0xcc88ff);
    ct.add(header);

    const divider = this.scene.add.graphics();
    divider.lineStyle(1, 0x442266);
    divider.lineBetween(x, y + 14, x + 220, y + 14);
    ct.add(divider);

    let rowY = y + 20;
    for (const recipe of RESEARCH_RECIPES) {
      const timeStr = `${recipe.craftTimeTicks / TICKS_PER_SECOND}s`;
      const inputName = ITEM_DISPLAY_NAMES[recipe.input] || recipe.input;

      this.addItemSprite(ct, recipe.input, x + 5, rowY + 5);

      const text = this.scene.add.bitmapText(
        x + 14,
        rowY,
        FONT_SM,
        `${recipe.inputCount} ${inputName}  ->  ${recipe.rpYield} RP  (${timeStr})`,
        getFontSize()
      );
      text.setTint(C.secondary);
      ct.add(text);

      rowY += 18;
    }

    // Helpful tip
    const tipY = rowY + 14;
    const tip = this.scene.add.bitmapText(
      x,
      tipY,
      FONT_SM,
      'Higher-tier items yield more RP.',
      getFontSize()
    );
    tip.setTint(C.muted);
    ct.add(tip);

    const tip2 = this.scene.add.bitmapText(
      x,
      tipY + 14,
      FONT_SM,
      'Build Arcane Studies near production chains.',
      getFontSize()
    );
    tip2.setTint(C.muted);
    ct.add(tip2);
  }
}
