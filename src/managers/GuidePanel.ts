import Phaser from 'phaser';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BUILDING_COSTS,
  TICKS_PER_SECOND,
  RESOURCE_DISPLAY_NAMES,
} from '../config';
import { ITEM_DISPLAY_NAMES } from '../data/stages';
import { TERRAIN_DISPLAY_NAMES, TERRAIN_COLORS } from '../data/terrain';
import { RECIPES } from '../data/recipes';
import { RESEARCH_RECIPES } from '../data/research';
import { BUILDING_DEFINITIONS } from '../data/buildings';
import { BuildingType, ItemType, TerrainType } from '../types';
import { makeText } from '../phaser-utils';

/** Items that have 8×8 sprites in the atlas */
const ITEM_SPRITES: Set<ItemType> = new Set([
  'arcstone',
  'sunite',
  'arcane_ingot',
  'sun_ingot',
  'cogwheel',
  'thread',
  'rune',
]);

/** Resource entries: terrain type → item yielded, display name, source terrain name */
const RESOURCE_ENTRIES: Array<{
  item: ItemType;
  terrain: Exclude<TerrainType, 'empty'>;
}> = [
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
    this.container = this.scene.add.container(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.container.setDepth(1000);
    this.container.setVisible(false);

    const panelW = 580;
    const panelH = 370;

    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.93);
    bg.fillRect(-panelW / 2, -panelH / 2, panelW, panelH);
    bg.lineStyle(2, 0x666666);
    bg.strokeRect(-panelW / 2, -panelH / 2, panelW, panelH);
    this.container.add(bg);

    // Title
    const title = makeText(this.scene, 0, -panelH / 2 + 12, 'GUIDE', {
      fontSize: '14px',
      color: '#ffffff',
    });
    title.setOrigin(0.5, 0.5);
    this.container.add(title);

    // Three columns layout
    const colX = [-panelW / 2 + 14, -panelW / 2 + 200, -panelW / 2 + 380];
    const topY = -panelH / 2 + 28;

    this.createResourcesSection(colX[0], topY);
    this.createItemsSection(colX[1], topY);
    this.createBuildingsSection(colX[2], topY);
    this.createResearchRecipesSection(colX[1], topY + 185);

    // Close hint
    const hint = makeText(this.scene, 0, panelH / 2 - 12, 'Press G, X, or Esc to close', {
      fontSize: '8px',
      color: '#888888',
    });
    hint.setOrigin(0.5, 0.5);
    this.container.add(hint);
  }

  private createResourcesSection(x: number, y: number): void {
    const header = makeText(this.scene, x, y, 'RESOURCES', {
      fontSize: '10px',
      color: '#88aaff',
    });
    this.container.add(header);

    // Divider
    const divider = this.scene.add.graphics();
    divider.lineStyle(1, 0x444466);
    divider.lineBetween(x, y + 12, x + 170, y + 12);
    this.container.add(divider);

    let rowY = y + 18;
    for (const entry of RESOURCE_ENTRIES) {
      const name = ITEM_DISPLAY_NAMES[entry.item] || entry.item;
      const source = TERRAIN_DISPLAY_NAMES[entry.terrain];

      // Thumbnail: colored rectangle from terrain colors
      const thumb = this.scene.add.graphics();
      const colors = TERRAIN_COLORS[entry.terrain];
      thumb.fillStyle(colors.highlight, 1);
      thumb.fillRect(x, rowY, 10, 10);
      this.container.add(thumb);

      const nameText = makeText(this.scene, x + 14, rowY, name, {
        fontSize: '8px',
        color: '#cccccc',
      });
      this.container.add(nameText);

      const sourceText = makeText(this.scene, x + 14, rowY + 10, source, {
        fontSize: '7px',
        color: '#666666',
      });
      this.container.add(sourceText);

      rowY += 22;
    }
  }

  private createItemsSection(x: number, y: number): void {
    const header = makeText(this.scene, x, y, 'CRAFTED ITEMS', {
      fontSize: '10px',
      color: '#ffaa44',
    });
    this.container.add(header);

    const divider = this.scene.add.graphics();
    divider.lineStyle(1, 0x664422);
    divider.lineBetween(x, y + 12, x + 170, y + 12);
    this.container.add(divider);

    let rowY = y + 18;
    for (const recipe of RECIPES) {
      // Get the first output item for display
      const outputItem = [...recipe.outputs.keys()][0];
      const outputCount = recipe.outputs.get(outputItem)!;
      const name = ITEM_DISPLAY_NAMES[outputItem] || outputItem;

      // Thumbnail: sprite if available
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

      const nameText = makeText(this.scene, x + 14, rowY, name, {
        fontSize: '8px',
        color: '#cccccc',
      });
      this.container.add(nameText);

      // Recipe line: inputs → output (time) | building
      const inputStr = [...recipe.inputs.entries()]
        .map(([item, count]) => `${count} ${ITEM_DISPLAY_NAMES[item] || item}`)
        .join(' + ');
      const timeStr = `${recipe.craftTimeTicks / TICKS_PER_SECOND}s`;
      const buildingName = recipe.building.charAt(0).toUpperCase() + recipe.building.slice(1);
      const recipeStr = `${inputStr} -> ${outputCount} (${timeStr}) [${buildingName}]`;

      const recipeText = makeText(this.scene, x + 14, rowY + 10, recipeStr, {
        fontSize: '7px',
        color: '#666666',
      });
      this.container.add(recipeText);

      rowY += 24;
    }
  }

  private createBuildingsSection(x: number, y: number): void {
    const header = makeText(this.scene, x, y, 'BUILDINGS', {
      fontSize: '10px',
      color: '#44ff88',
    });
    this.container.add(header);

    const divider = this.scene.add.graphics();
    divider.lineStyle(1, 0x226644);
    divider.lineBetween(x, y + 12, x + 170, y + 12);
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

      // Thumbnail: building sprite scaled down
      const sprite = this.scene.add.sprite(x + 7, rowY + 7, 'sprites', bType);
      sprite.setDisplaySize(14, 14);
      this.container.add(sprite);

      const nameText = makeText(this.scene, x + 18, rowY, name, {
        fontSize: '8px',
        color: '#cccccc',
      });
      this.container.add(nameText);

      // Size + cost
      const costStr = Object.entries(cost)
        .filter(([, v]) => v && v > 0)
        .map(([k, v]) => `${v} ${RESOURCE_DISPLAY_NAMES[k] || k}`)
        .join(' ');
      const sizeStr = `${def.width}x${def.height}`;

      const detailText = makeText(this.scene, x + 18, rowY + 10, `${sizeStr}  Cost: ${costStr}`, {
        fontSize: '7px',
        color: '#666666',
      });
      this.container.add(detailText);

      // I/O description
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

      const ioText = makeText(this.scene, x + 18, rowY + 19, ioStr, {
        fontSize: '7px',
        color: '#555555',
      });
      this.container.add(ioText);

      rowY += 34;
    }
  }

  private createResearchRecipesSection(x: number, y: number): void {
    const header = makeText(this.scene, x, y, 'RESEARCH (Arcane Study)', {
      fontSize: '10px',
      color: '#cc88ff',
    });
    this.container.add(header);

    const divider = this.scene.add.graphics();
    divider.lineStyle(1, 0x442266);
    divider.lineBetween(x, y + 12, x + 170, y + 12);
    this.container.add(divider);

    let rowY = y + 16;
    for (const recipe of RESEARCH_RECIPES) {
      const timeStr = `${recipe.craftTimeTicks / TICKS_PER_SECOND}s`;
      const text = makeText(
        this.scene,
        x,
        rowY,
        `${recipe.inputCount} ${ITEM_DISPLAY_NAMES[recipe.input] || recipe.input} -> ${recipe.rpYield} RP (${timeStr})`,
        {
          fontSize: '7px',
          color: '#666666',
        }
      );
      this.container.add(text);
      rowY += 12;
    }
  }
}
