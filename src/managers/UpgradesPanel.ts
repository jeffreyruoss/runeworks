import Phaser from 'phaser';
import { UPGRADES, UpgradeState } from '../data/upgrades';
import { FONT_SM, getFontSize, C, addPanelBackground } from '../ui-theme';
import { getViewport } from '../utils';
import { getBarHeights } from '../layout';

const PAD_X = 16;
const PAD_Y = 14;
const NAME_ROW_H = 12;
const DESC_ROW_H = 16;
const ITEM_H = NAME_ROW_H + DESC_ROW_H;
const COL_GAP = 16;
const COL_W = 200;
const COLUMNS = 2;
const ROWS = Math.ceil(UPGRADES.length / COLUMNS);

/**
 * Upgrades panel — spend Flow Points on per-stage upgrades.
 * 2-column grid layout, toggled with the U key.
 */
export class UpgradesPanel {
  private container: Phaser.GameObjects.Container;
  private nameTexts: Phaser.GameObjects.BitmapText[] = [];
  private descTexts: Phaser.GameObjects.BitmapText[] = [];
  private levelTexts: Phaser.GameObjects.BitmapText[] = [];
  private pointsText!: Phaser.GameObjects.BitmapText;
  private selectedIndex = 0;
  private selector!: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    this.container = this.createPanel(scene);
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
    if (visible) this.selectedIndex = 0;
  }

  update(upgradeState: UpgradeState, flowPoints: number): void {
    this.pointsText.setText(`Flow Points: ${flowPoints}`);
    this.pointsText.setTint(flowPoints > 0 ? C.active : C.muted);

    for (let i = 0; i < UPGRADES.length; i++) {
      const def = UPGRADES[i];
      const level = upgradeState.getLevel(def.id);
      const maxed = level >= def.maxLevel;

      this.nameTexts[i].setText(def.name);
      this.nameTexts[i].setTint(maxed ? C.muted : C.light);

      const costTag = maxed ? 'MAX' : `${def.cost}fp`;
      this.descTexts[i].setText(`${def.description}  (${costTag})`);
      this.descTexts[i].setTint(maxed ? C.muted : flowPoints >= def.cost ? C.light : C.invalid);

      this.levelTexts[i].setText(`${level}/${def.maxLevel}`);
      this.levelTexts[i].setTint(maxed ? C.muted : C.valid);
    }

    this.updateSelector();
  }

  navigate(dx: number, dy: number): void {
    const col = this.selectedIndex % COLUMNS;
    const row = Math.floor(this.selectedIndex / COLUMNS);

    let newCol = col + dx;
    let newRow = row + dy;

    newCol = Phaser.Math.Clamp(newCol, 0, COLUMNS - 1);
    newRow = Phaser.Math.Clamp(newRow, 0, ROWS - 1);

    const newIndex = newRow * COLUMNS + newCol;
    if (newIndex < UPGRADES.length) {
      this.selectedIndex = newIndex;
    }
    this.updateSelector();
  }

  tryPurchase(upgradeState: UpgradeState, spendPoints: (cost: number) => boolean): boolean {
    const def = UPGRADES[this.selectedIndex];
    if (!def) return false;
    if (!upgradeState.canUpgrade(def.id)) return false;
    if (!spendPoints(def.cost)) return false;
    upgradeState.upgrade(def.id);
    return true;
  }

  private updateSelector(): void {
    const col = this.selectedIndex % COLUMNS;
    const row = Math.floor(this.selectedIndex / COLUMNS);
    const baseX = this.selector.getData('baseX') as number;
    const baseY = this.selector.getData('baseY') as number;
    this.selector.setPosition(baseX + col * (COL_W + COL_GAP), baseY + row * ITEM_H);
  }

  private createPanel(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const vp = getViewport(scene);
    const bars = getBarHeights((scene as any).zoom);
    const centerY = bars.top + (vp.height - bars.top - bars.bottom) / 2;
    const container = scene.add.container(Math.floor(vp.width / 2), Math.floor(centerY));
    container.setDepth(1000);
    container.setVisible(false);

    const fontSize = getFontSize();
    const smallSize = Math.max(8, fontSize - 4);
    const headerH = 22;
    const pointsH = 22;
    const hintH = 14;
    const hintGap = 10;
    const gridH = ROWS * ITEM_H;
    const contentH = headerH + gridH + pointsH + hintGap + hintH;
    const contentW = COL_W * COLUMNS + COL_GAP * (COLUMNS - 1);
    const panelW = contentW + 2 * PAD_X;
    const panelH = contentH + 2 * PAD_Y;

    addPanelBackground(scene, container, panelW, panelH);

    const left = -panelW / 2 + PAD_X;
    let y = -panelH / 2 + PAD_Y;

    // Header
    const header = scene.add.bitmapText(left, y, FONT_SM, 'UPGRADES', fontSize);
    header.setTint(C.active);
    container.add(header);
    y += headerH;

    // Selection indicator
    this.selector = scene.add.rectangle(
      left + COL_W / 2,
      y + ITEM_H / 2,
      COL_W + 4,
      ITEM_H,
      C.active,
      0.12
    );
    this.selector.setOrigin(0.5, 0.5);
    this.selector.setData('baseX', left + COL_W / 2);
    this.selector.setData('baseY', y + ITEM_H / 2);
    container.add(this.selector);

    // Upgrade items in 2-column grid
    for (let i = 0; i < UPGRADES.length; i++) {
      const col = i % COLUMNS;
      const row = Math.floor(i / COLUMNS);
      const colX = left + col * (COL_W + COL_GAP);
      const itemY = y + row * ITEM_H;

      const nameTxt = scene.add.bitmapText(colX + 4, itemY, FONT_SM, '', smallSize);
      nameTxt.setTint(C.light);
      container.add(nameTxt);
      this.nameTexts.push(nameTxt);

      const lvl = scene.add.bitmapText(colX + COL_W - 4, itemY, FONT_SM, '', smallSize);
      lvl.setOrigin(1, 0);
      lvl.setTint(C.valid);
      container.add(lvl);
      this.levelTexts.push(lvl);

      const descTxt = scene.add.bitmapText(colX + 8, itemY + NAME_ROW_H, FONT_SM, '', smallSize);
      descTxt.setTint(C.muted);
      container.add(descTxt);
      this.descTexts.push(descTxt);
    }

    const bottomY = y + gridH;

    // Flow points display
    this.pointsText = scene.add.bitmapText(left, bottomY + 4, FONT_SM, 'Flow Points: 0', smallSize);
    this.pointsText.setTint(C.muted);
    container.add(this.pointsText);

    // Hint
    const hint = scene.add.bitmapText(
      0,
      bottomY + pointsH + hintGap,
      FONT_SM,
      'ESDF:Select  Space:Buy  U/X:Close',
      smallSize
    );
    hint.setOrigin(0.5, 0);
    hint.setTint(C.muted);
    container.add(hint);

    return container;
  }
}
