import Phaser from 'phaser';
import { PlayerResources } from '../types';
import { FONT_SM, getFontSize, C, addPanelBackground } from '../ui-theme';
import { getViewport } from '../utils';
import { ITEM_DISPLAY_NAMES } from '../data/stages';
import { RESOURCE_DISPLAY_NAMES } from '../config';

const ROW_H = 16;
const PAD_X = 16;
const PAD_Y = 14;

const RESOURCE_KEYS: Array<keyof PlayerResources> = [
  'stone',
  'wood',
  'iron',
  'clay',
  'crystal_shard',
];

const PRODUCED_KEYS = ['arcane_ingot', 'sun_ingot', 'cogwheel', 'thread', 'rune'] as const;

/**
 * Inventory modal panel showing player resources and produced items.
 * Toggled with the I key.
 */
export class InventoryPanel {
  private container: Phaser.GameObjects.Container;
  private resourceTexts: Phaser.GameObjects.BitmapText[] = [];
  private producedTexts: Phaser.GameObjects.BitmapText[] = [];

  constructor(scene: Phaser.Scene) {
    this.container = this.createPanel(scene);
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  update(resources: PlayerResources, produced: Record<string, number>): void {
    for (let i = 0; i < RESOURCE_KEYS.length; i++) {
      const key = RESOURCE_KEYS[i];
      const val = resources[key];
      this.resourceTexts[i].setText(`${RESOURCE_DISPLAY_NAMES[key]}: ${val}`);
      this.resourceTexts[i].setTint(val > 0 ? C.light : C.muted);
    }

    for (let i = 0; i < PRODUCED_KEYS.length; i++) {
      const key = PRODUCED_KEYS[i];
      const val = produced[key] || 0;
      this.producedTexts[i].setText(`${ITEM_DISPLAY_NAMES[key]}: ${val}`);
      this.producedTexts[i].setTint(val > 0 ? C.light : C.muted);
    }
  }

  private createPanel(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const vp = getViewport(scene);
    const container = scene.add.container(Math.floor(vp.width / 2), Math.floor(vp.height / 2));
    container.setDepth(1000);
    container.setVisible(false);

    const fontSize = getFontSize();
    const headerH = 18;
    const sectionGap = 10;
    const hintGap = 12;
    const hintH = 14;
    const resourceRows = RESOURCE_KEYS.length;
    const producedRows = PRODUCED_KEYS.length;
    const contentH =
      headerH +
      resourceRows * ROW_H +
      sectionGap +
      headerH +
      producedRows * ROW_H +
      hintGap +
      hintH;
    const contentW = 160;
    const panelW = contentW + 2 * PAD_X;
    const panelH = contentH + 2 * PAD_Y;

    addPanelBackground(scene, container, panelW, panelH);

    const left = -panelW / 2 + PAD_X;
    const top = -panelH / 2 + PAD_Y;
    let y = top;

    // Resources section
    const resHeader = scene.add.bitmapText(left, y, FONT_SM, 'RESOURCES', fontSize);
    resHeader.setTint(C.active);
    container.add(resHeader);
    y += headerH;

    for (const key of RESOURCE_KEYS) {
      const txt = scene.add.bitmapText(
        left + 4,
        y,
        FONT_SM,
        `${RESOURCE_DISPLAY_NAMES[key]}: 0`,
        fontSize
      );
      txt.setTint(C.muted);
      container.add(txt);
      this.resourceTexts.push(txt);
      y += ROW_H;
    }

    y += sectionGap;

    // Produced items section
    const prodHeader = scene.add.bitmapText(left, y, FONT_SM, 'PRODUCED', fontSize);
    prodHeader.setTint(C.active);
    container.add(prodHeader);
    y += headerH;

    for (const key of PRODUCED_KEYS) {
      const name = ITEM_DISPLAY_NAMES[key] || key;
      const txt = scene.add.bitmapText(left + 4, y, FONT_SM, `${name}: 0`, fontSize);
      txt.setTint(C.muted);
      container.add(txt);
      this.producedTexts.push(txt);
      y += ROW_H;
    }

    // Close hint
    const hint = scene.add.bitmapText(0, top + contentH, FONT_SM, 'I or X to close', fontSize);
    hint.setOrigin(0.5, 1);
    hint.setTint(C.muted);
    container.add(hint);

    return container;
  }
}
