import Phaser from 'phaser';
import { BUILDING_COSTS, TICKS_PER_SECOND, RESOURCE_DISPLAY_NAMES } from '../config';
import { ITEM_DISPLAY_NAMES } from '../data/stages';
import { TERRAIN_DISPLAY_NAMES, TERRAIN_COLORS } from '../data/terrain';
import { RECIPES } from '../data/recipes';
import { RESEARCH_RECIPES } from '../data/research';
import { BUILDING_DEFINITIONS } from '../data/buildings';
import { BuildingType, ItemType, TerrainType } from '../types';
import { FONT_SM, UI_ATLAS } from '../ui-theme';

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
const RESOURCE_ENTRIES: Array<{ item: ItemType; terrain: Exclude<TerrainType, 'empty'> }> = [
  { item: 'stone', terrain: 'stone' },
  { item: 'wood', terrain: 'forest' },
  { item: 'iron', terrain: 'iron' },
  { item: 'clay', terrain: 'clay' },
  { item: 'crystal_shard', terrain: 'crystal_shard' },
  { item: 'arcstone', terrain: 'arcstone' },
  { item: 'sunite', terrain: 'sunite' },
];

/**
 * Full-page guide panel showing all resources, items, buildings, and recipes.
 * Toggled with the G key.
 */
export class GuidePanel {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createPanel();
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  private createPanel(): void {
    const vp = (this.scene as any).viewport as { width: number; height: number };
    this.container = this.scene.add.container(Math.floor(vp.width / 2), Math.floor(vp.height / 2));
    this.container.setDepth(1000);
    this.container.setVisible(false);

    const padX = 20;
    const padY = 16;
    const contentW = 540;
    const contentH = 340;
    const panelW = contentW + 2 * padX;
    const panelH = contentH + 2 * padY;

    const bg = this.scene.add.nineslice(0, 0, UI_ATLAS, 'frame_dark', panelW, panelH);
    bg.setOrigin(0.5, 0.5);
    bg.setAlpha(0.93);
    this.container.add(bg);

    const left = -panelW / 2 + padX;
    const top = -panelH / 2 + padY;

    const title = this.scene.add.bitmapText(0, top, FONT_SM, 'GUIDE');
    title.setOrigin(0.5, 0);
    title.setTint(0xe8e0f0);
    this.container.add(title);

    const colX = [left, left + 186, left + 366];
    const topY = top + 20;

    this.createResourcesSection(colX[0], topY);
    this.createItemsSection(colX[1], topY);
    this.createBuildingsSection(colX[2], topY);
    this.createResearchRecipesSection(colX[1], topY + 185);

    const hint = this.scene.add.bitmapText(0, top + contentH, FONT_SM, 'Press G or X to close');
    hint.setOrigin(0.5, 1);
    hint.setTint(0x8078a0);
    this.container.add(hint);
  }

  private createResourcesSection(x: number, y: number): void {
    const header = this.scene.add.bitmapText(x, y, FONT_SM, 'RESOURCES');
    header.setTint(0x88aaff);
    this.container.add(header);

    const divider = this.scene.add.graphics();
    divider.lineStyle(1, 0x444466);
    divider.lineBetween(x, y + 14, x + 170, y + 14);
    this.container.add(divider);

    let rowY = y + 18;
    for (const entry of RESOURCE_ENTRIES) {
      const name = ITEM_DISPLAY_NAMES[entry.item] || entry.item;
      const source = TERRAIN_DISPLAY_NAMES[entry.terrain];

      const thumb = this.scene.add.graphics();
      const colors = TERRAIN_COLORS[entry.terrain];
      thumb.fillStyle(colors.highlight, 1);
      thumb.fillRect(x, rowY, 10, 10);
      this.container.add(thumb);

      const nameText = this.scene.add.bitmapText(x + 14, rowY, FONT_SM, name);
      nameText.setTint(0xc8c0d8);
      this.container.add(nameText);

      const sourceText = this.scene.add.bitmapText(x + 14, rowY + 12, FONT_SM, source);
      sourceText.setTint(0x605880);
      this.container.add(sourceText);

      rowY += 22;
    }
  }

  private createItemsSection(x: number, y: number): void {
    const header = this.scene.add.bitmapText(x, y, FONT_SM, 'CRAFTED ITEMS');
    header.setTint(0xffaa44);
    this.container.add(header);

    const divider = this.scene.add.graphics();
    divider.lineStyle(1, 0x664422);
    divider.lineBetween(x, y + 14, x + 170, y + 14);
    this.container.add(divider);

    let rowY = y + 18;
    for (const recipe of RECIPES) {
      const outputItem = [...recipe.outputs.keys()][0];
      const outputCount = recipe.outputs.get(outputItem)!;
      const name = ITEM_DISPLAY_NAMES[outputItem] || outputItem;

      if (ITEM_SPRITES.has(outputItem)) {
        const sprite = this.scene.add.sprite(x + 5, rowY + 5, 'sprites', outputItem);
        sprite.setDisplaySize(10, 10);
        this.container.add(sprite);
      } else {
        const thumb = this.scene.add.graphics();
        thumb.fillStyle(0x888888, 1);
        thumb.fillRect(x, rowY, 10, 10);
        this.container.add(thumb);
      }

      const nameText = this.scene.add.bitmapText(x + 14, rowY, FONT_SM, name);
      nameText.setTint(0xc8c0d8);
      this.container.add(nameText);

      const inputStr = [...recipe.inputs.entries()]
        .map(([item, count]) => `${count} ${ITEM_DISPLAY_NAMES[item] || item}`)
        .join(' + ');
      const timeStr = `${recipe.craftTimeTicks / TICKS_PER_SECOND}s`;
      const buildingName = recipe.building.charAt(0).toUpperCase() + recipe.building.slice(1);
      const recipeStr = `${inputStr} -> ${outputCount} (${timeStr}) [${buildingName}]`;

      const recipeText = this.scene.add.bitmapText(x + 14, rowY + 12, FONT_SM, recipeStr);
      recipeText.setTint(0x605880);
      this.container.add(recipeText);

      rowY += 24;
    }
  }

  private createBuildingsSection(x: number, y: number): void {
    const header = this.scene.add.bitmapText(x, y, FONT_SM, 'BUILDINGS');
    header.setTint(0x44ff88);
    this.container.add(header);

    const divider = this.scene.add.graphics();
    divider.lineStyle(1, 0x226644);
    divider.lineBetween(x, y + 14, x + 170, y + 14);
    this.container.add(divider);

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

    let rowY = y + 18;
    for (const bType of buildings) {
      const def = BUILDING_DEFINITIONS[bType];
      const cost = BUILDING_COSTS[bType];
      const name = bType
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      const sprite = this.scene.add.sprite(x + 7, rowY + 7, 'sprites', bType);
      sprite.setDisplaySize(14, 14);
      this.container.add(sprite);

      const nameText = this.scene.add.bitmapText(x + 18, rowY, FONT_SM, name);
      nameText.setTint(0xc8c0d8);
      this.container.add(nameText);

      const costStr = Object.entries(cost)
        .filter(([, v]) => v && v > 0)
        .map(([k, v]) => `${v} ${RESOURCE_DISPLAY_NAMES[k] || k}`)
        .join(' ');
      const sizeStr = `${def.width}x${def.height}`;

      const detailText = this.scene.add.bitmapText(
        x + 18,
        rowY + 12,
        FONT_SM,
        `${sizeStr}  Cost: ${costStr}`
      );
      detailText.setTint(0x605880);
      this.container.add(detailText);

      let ioStr = '';
      if (bType === 'quarry') {
        ioStr = 'Extracts from veins -> output';
      } else if (bType === 'chest') {
        ioStr = 'Storage (all sides)';
      } else if (bType === 'arcane_study') {
        ioStr = 'Consumes items -> Research Points';
      } else if (def.manaProduction > 0) {
        ioStr = `Generates ${def.manaProduction} mana, range ${def.manaRadius}`;
      } else if (bType === 'mana_tower') {
        ioStr = `Extends mana network, range ${def.manaRadius}`;
      } else {
        const inSides = def.inputSides.join('/');
        const outSides = def.outputSides.join('/');
        ioStr = `In:${inSides} -> Out:${outSides}`;
      }

      const ioText = this.scene.add.bitmapText(x + 18, rowY + 22, FONT_SM, ioStr);
      ioText.setTint(0x605880);
      this.container.add(ioText);

      rowY += 34;
    }
  }

  private createResearchRecipesSection(x: number, y: number): void {
    const header = this.scene.add.bitmapText(x, y, FONT_SM, 'RESEARCH (Arcane Study)');
    header.setTint(0xcc88ff);
    this.container.add(header);

    const divider = this.scene.add.graphics();
    divider.lineStyle(1, 0x442266);
    divider.lineBetween(x, y + 14, x + 170, y + 14);
    this.container.add(divider);

    let rowY = y + 18;
    for (const recipe of RESEARCH_RECIPES) {
      const timeStr = `${recipe.craftTimeTicks / TICKS_PER_SECOND}s`;
      const text = this.scene.add.bitmapText(
        x,
        rowY,
        FONT_SM,
        `${recipe.inputCount} ${ITEM_DISPLAY_NAMES[recipe.input] || recipe.input} -> ${recipe.rpYield} RP (${timeStr})`
      );
      text.setTint(0x605880);
      this.container.add(text);
      rowY += 14;
    }
  }
}
