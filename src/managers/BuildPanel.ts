import Phaser from 'phaser';
import { BuildingType } from '../types';
import { FONT_SM, getFontSize, C, addPanelBackground } from '../ui-theme';
import { getViewport } from '../utils';

interface BuildEntry {
  type: BuildingType;
  key: string;
  name: string;
}

const LEFT_ENTRIES: BuildEntry[] = [
  { type: 'quarry', key: 'Q', name: 'Quarry' },
  { type: 'forge', key: 'F', name: 'Forge' },
  { type: 'workbench', key: 'W', name: 'Workbench' },
  { type: 'chest', key: 'C', name: 'Chest' },
];

const RIGHT_ENTRIES: BuildEntry[] = [
  { type: 'arcane_study', key: 'A', name: 'Study' },
  { type: 'mana_well', key: 'M', name: 'Well' },
  { type: 'mana_obelisk', key: 'O', name: 'Obelisk' },
  { type: 'mana_tower', key: 'T', name: 'Tower' },
];

/**
 * Build mode modal showing available buildings with sprites and hotkeys.
 * Two-column layout: basic buildings (left), advanced buildings (right).
 */
export class BuildPanel {
  private container: Phaser.GameObjects.Container;
  private entryGroups = new Map<BuildingType, Phaser.GameObjects.GameObject[]>();

  constructor(scene: Phaser.Scene) {
    this.container = this.createPanel(scene);
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

  private createPanel(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const vp = getViewport(scene);
    const container = scene.add.container(Math.floor(vp.width / 2), Math.floor(vp.height / 2));
    container.setDepth(1000);
    container.setVisible(false);

    const padX = 14;
    const padY = 12;
    const rowH = 22;
    const colW = 110;
    const colGap = 12;
    const titleH = 18;
    const rows = 4;

    const contentW = colW * 2 + colGap;
    const contentH = titleH + rows * rowH + 16;
    const panelW = contentW + 2 * padX;
    const panelH = contentH + 2 * padY;

    addPanelBackground(scene, container, panelW, panelH);

    const left = -panelW / 2 + padX;
    const top = -panelH / 2 + padY;

    const title = scene.add.bitmapText(0, top, FONT_SM, 'BUILD', getFontSize());
    title.setOrigin(0.5, 0);
    title.setTint(C.active);
    container.add(title);

    const startY = top + titleH;
    this.createColumn(scene, container, left, startY, rowH, LEFT_ENTRIES);
    this.createColumn(scene, container, left + colW + colGap, startY, rowH, RIGHT_ENTRIES);

    const hint = scene.add.bitmapText(
      0,
      top + contentH - 2,
      FONT_SM,
      'B or X to close',
      getFontSize()
    );
    hint.setOrigin(0.5, 1);
    hint.setTint(C.muted);
    container.add(hint);

    return container;
  }

  private createColumn(
    scene: Phaser.Scene,
    parent: Phaser.GameObjects.Container,
    x: number,
    startY: number,
    rowH: number,
    entries: BuildEntry[]
  ): void {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const rowY = startY + i * rowH;

      const sprite = scene.add.sprite(x + 7, rowY + 7, 'sprites', entry.type);
      sprite.setDisplaySize(14, 14);
      parent.add(sprite);

      const keyText = scene.add.bitmapText(x + 18, rowY, FONT_SM, entry.key, getFontSize());
      keyText.setTint(C.active);
      parent.add(keyText);

      const nameText = scene.add.bitmapText(x + 30, rowY, FONT_SM, entry.name, getFontSize());
      nameText.setTint(C.light);
      parent.add(nameText);

      this.entryGroups.set(entry.type, [sprite, keyText, nameText]);
    }
  }
}
