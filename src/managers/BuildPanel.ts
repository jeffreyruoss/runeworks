import Phaser from 'phaser';
import { BuildingType } from '../types';
import { FONT_SM, getFontSize, C } from '../ui-theme';
import { getViewport } from '../utils';
import { getBarHeights } from '../layout';
import { THEME } from '../config';

interface BuildEntry {
  type: BuildingType;
  key: string;
  name: string;
}

const ROW1_ENTRIES: BuildEntry[] = [
  { type: 'quarry', key: 'Q', name: 'Quarry' },
  { type: 'forge', key: 'F', name: 'Forge' },
  { type: 'workbench', key: 'W', name: 'Bench' },
  { type: 'chest', key: 'C', name: 'Chest' },
];

const ROW2_ENTRIES: BuildEntry[] = [
  { type: 'arcane_study', key: 'A', name: 'Study' },
  { type: 'mana_well', key: 'M', name: 'Well' },
  { type: 'mana_obelisk', key: 'O', name: 'Obelisk' },
  { type: 'mana_tower', key: 'T', name: 'Tower' },
];

const SPRITE_SIZE = 14;
const ROW_H = 18;
const PAD = 4;

/**
 * Inline build bar at the bottom of the viewport.
 * Two rows of 4 building entries with sprite + hotkey + name.
 */
export class BuildPanel {
  private container: Phaser.GameObjects.Container;
  private bg!: Phaser.GameObjects.Rectangle;
  private entryGroups = new Map<BuildingType, Phaser.GameObjects.GameObject[]>();
  private scene: Phaser.Scene;
  private boundReposition = this.reposition.bind(this);

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = this.createBar(scene);
    scene.scale.on('resize', this.boundReposition);
    scene.events.once('shutdown', () => scene.scale.off('resize', this.boundReposition));
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  updateAvailable(available: Set<BuildingType>): void {
    for (const [type, objects] of this.entryGroups) {
      const unlocked = available.has(type);
      for (const obj of objects) (obj as any).setAlpha(unlocked ? 1 : 0.35);
    }
  }

  private createBar(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const vp = getViewport(scene);
    const barH = getBarHeights((scene as any).zoom).bottom;

    const container = scene.add.container(0, vp.height - barH);
    container.setDepth(1000);
    container.setVisible(false);

    // Dark background spanning full width
    this.bg = scene.add.rectangle(
      Math.floor(vp.width / 2),
      Math.floor(barH / 2),
      vp.width,
      barH,
      THEME.hud.bg,
      0.92
    );
    this.bg.setOrigin(0.5, 0.5);
    container.add(this.bg);

    const fontSize = getFontSize();
    const row1Y = PAD;
    const row1MidY = row1Y + ROW_H / 2;

    // Close hint — vertically centered with row 1
    const closeKey = scene.add.bitmapText(PAD, 0, FONT_SM, 'X or B', fontSize);
    closeKey.setOrigin(0, 0.5);
    closeKey.setPosition(PAD, row1MidY);
    closeKey.setTint(C.active);
    container.add(closeKey);

    const closeLabel = scene.add.bitmapText(0, 0, FONT_SM, ':Close', fontSize);
    closeLabel.setOrigin(0, 0.5);
    closeLabel.setPosition(PAD + closeKey.width + 1, row1MidY);
    closeLabel.setTint(C.light);
    container.add(closeLabel);

    // Layout entries: 2 rows of 4
    const startX = PAD + closeKey.width + closeLabel.width + 10;
    const entryW = Math.floor((vp.width - startX - PAD) / 4);

    this.createRow(scene, container, startX, row1Y, entryW, fontSize, ROW1_ENTRIES);
    this.createRow(scene, container, startX, row1Y + ROW_H, entryW, fontSize, ROW2_ENTRIES);

    return container;
  }

  private createRow(
    scene: Phaser.Scene,
    parent: Phaser.GameObjects.Container,
    startX: number,
    rowY: number,
    entryW: number,
    fontSize: number,
    entries: BuildEntry[]
  ): void {
    const midY = rowY + ROW_H / 2;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const x = startX + i * entryW;

      // Sprite centered vertically in row
      const sprite = scene.add.sprite(x + SPRITE_SIZE / 2, midY, 'sprites', entry.type);
      sprite.setDisplaySize(SPRITE_SIZE, SPRITE_SIZE);
      parent.add(sprite);

      // Text centered vertically in row
      const textX = x + SPRITE_SIZE + 4;
      const keyText = scene.add.bitmapText(textX, midY, FONT_SM, entry.key, fontSize);
      keyText.setOrigin(0, 0.5);
      keyText.setTint(C.active);
      parent.add(keyText);

      const nameText = scene.add.bitmapText(
        textX + keyText.width + 2,
        midY,
        FONT_SM,
        entry.name,
        fontSize
      );
      nameText.setOrigin(0, 0.5);
      nameText.setTint(C.light);
      parent.add(nameText);

      this.entryGroups.set(entry.type, [sprite, keyText, nameText]);
    }
  }

  private reposition(): void {
    const vp = getViewport(this.scene);
    const barH = getBarHeights((this.scene as any).zoom).bottom;
    this.container.setPosition(0, vp.height - barH);
    this.bg.setPosition(Math.floor(vp.width / 2), Math.floor(barH / 2));
    this.bg.setSize(vp.width, barH);
  }
}
