import Phaser from 'phaser';
import { UPGRADES, UpgradeState } from '../data/upgrades';
import { FONT_SM, getFontSize, C, addPanelBackground } from '../ui-theme';
import { getViewport } from '../utils';
import { getBarHeights } from '../layout';

const PAD_X = 16;
const PAD_Y = 14;
const NAME_ROW_H = 12;
const DESC_ROW_H = 16;
const ITEM_H = NAME_ROW_H + DESC_ROW_H; // 28px per upgrade

/**
 * Upgrades panel — spend Flow Points on per-stage upgrades.
 * Toggled with the U key.
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

      this.descTexts[i].setText(def.description);
      this.descTexts[i].setTint(C.muted);

      const pips = Array.from({ length: def.maxLevel }, (_, j) => (j < level ? '+' : '-')).join(
        ' '
      );
      this.levelTexts[i].setText(pips);
      this.levelTexts[i].setTint(maxed ? C.muted : C.valid);
    }

    this.updateSelector();
  }

  navigate(dy: number): void {
    this.selectedIndex = Phaser.Math.Clamp(this.selectedIndex + dy, 0, UPGRADES.length - 1);
    this.updateSelector();
  }

  /** Try to purchase the selected upgrade. Returns true if successful. */
  tryPurchase(upgradeState: UpgradeState, spendPoint: () => boolean): boolean {
    const def = UPGRADES[this.selectedIndex];
    if (!def) return false;
    if (!upgradeState.canUpgrade(def.id)) return false;
    if (!spendPoint()) return false;
    upgradeState.upgrade(def.id);
    return true;
  }

  private updateSelector(): void {
    const baseY = this.selector.getData('baseY') as number;
    this.selector.setY(baseY + this.selectedIndex * ITEM_H);
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
    const headerH = 20;
    const pointsH = 20;
    const hintH = 14;
    const hintGap = 10;
    const contentH = headerH + UPGRADES.length * ITEM_H + pointsH + hintGap + hintH;
    const contentW = 240;
    const panelW = contentW + 2 * PAD_X;
    const panelH = contentH + 2 * PAD_Y;

    addPanelBackground(scene, container, panelW, panelH);

    const left = -panelW / 2 + PAD_X;
    const right = panelW / 2 - PAD_X;
    let y = -panelH / 2 + PAD_Y;

    // Header
    const header = scene.add.bitmapText(left, y, FONT_SM, 'UPGRADES', fontSize);
    header.setTint(C.active);
    container.add(header);
    y += headerH;

    // Selection indicator
    this.selector = scene.add.rectangle(0, y + ITEM_H / 2, panelW - 8, ITEM_H, C.active, 0.12);
    this.selector.setOrigin(0.5, 0.5);
    this.selector.setData('baseY', y + ITEM_H / 2);
    container.add(this.selector);

    // Upgrade rows — name + level pips on line 1, description on line 2
    for (let i = 0; i < UPGRADES.length; i++) {
      const nameTxt = scene.add.bitmapText(left + 4, y, FONT_SM, '', smallSize);
      nameTxt.setTint(C.light);
      container.add(nameTxt);
      this.nameTexts.push(nameTxt);

      const lvl = scene.add.bitmapText(right, y, FONT_SM, '', smallSize);
      lvl.setOrigin(1, 0);
      lvl.setTint(C.valid);
      container.add(lvl);
      this.levelTexts.push(lvl);

      const descTxt = scene.add.bitmapText(left + 8, y + NAME_ROW_H, FONT_SM, '', smallSize);
      descTxt.setTint(C.muted);
      container.add(descTxt);
      this.descTexts.push(descTxt);

      y += ITEM_H;
    }

    // Flow points display
    this.pointsText = scene.add.bitmapText(left, y + 4, FONT_SM, 'Flow Points: 0', smallSize);
    this.pointsText.setTint(C.muted);
    container.add(this.pointsText);
    y += pointsH;

    // Hint
    const hint = scene.add.bitmapText(
      0,
      y + hintGap,
      FONT_SM,
      'E/D:Select  Space:Buy  U/X:Close',
      smallSize
    );
    hint.setOrigin(0.5, 0);
    hint.setTint(C.muted);
    container.add(hint);

    return container;
  }
}
