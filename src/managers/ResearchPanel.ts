import Phaser from 'phaser';
import { TICKS_PER_SECOND } from '../config';
import { RESEARCH_NODES, RESEARCH_RECIPES, ResearchBranch, ResearchNode } from '../data/research';
import { ITEM_DISPLAY_NAMES } from '../data/stages';
import { ResearchManager } from './ResearchManager';
import { FONT_SM, UI_ATLAS } from '../ui-theme';

interface NodeDisplay {
  node: ResearchNode;
  text: Phaser.GameObjects.BitmapText;
  statusText: Phaser.GameObjects.BitmapText;
}

/**
 * Full-page research panel showing tech tree branches and RP balance.
 * Supports ESDF navigation and Space/Enter to unlock nodes.
 */
export class ResearchPanel {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private rpText!: Phaser.GameObjects.BitmapText;
  private nodeDisplays: NodeDisplay[] = [];
  private selectedIndex = 0;
  private selectionIndicator!: Phaser.GameObjects.BitmapText;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createPanel();
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  navigate(dx: number, dy: number): boolean {
    if (this.nodeDisplays.length === 0) return false;

    if (dy !== 0) {
      this.selectedIndex = Math.max(
        0,
        Math.min(this.nodeDisplays.length - 1, this.selectedIndex + dy)
      );
    } else if (dx !== 0) {
      const currentNode = this.nodeDisplays[this.selectedIndex].node;
      const branches: ResearchBranch[] = ['buildings', 'recipes', 'upgrades'];
      const currentBranchIdx = branches.indexOf(currentNode.branch);
      const newBranchIdx = Math.max(0, Math.min(branches.length - 1, currentBranchIdx + dx));
      const targetBranch = branches[newBranchIdx];
      const targetIdx = this.nodeDisplays.findIndex((d) => d.node.branch === targetBranch);
      if (targetIdx >= 0) this.selectedIndex = targetIdx;
    }

    return true;
  }

  tryUnlock(researchManager: ResearchManager): boolean {
    if (this.selectedIndex >= this.nodeDisplays.length) return false;
    const node = this.nodeDisplays[this.selectedIndex].node;
    return researchManager.unlock(node.id);
  }

  update(researchManager: ResearchManager): void {
    this.rpText.setText(`Research Points: ${researchManager.getResearchPoints()}`);

    for (let i = 0; i < this.nodeDisplays.length; i++) {
      const display = this.nodeDisplays[i];
      const state = researchManager.getNodeState(display.node.id);

      if (state === 'unlocked') {
        display.statusText.setText('[x]');
        display.statusText.setTint(0x44ff88);
        display.text.setTint(0x88ff88);
      } else if (state === 'available') {
        display.statusText.setText('[ ]');
        display.statusText.setTint(0xe8e0f0);
        display.text.setTint(0xe8e0f0);
      } else {
        display.statusText.setText('[-]');
        display.statusText.setTint(0x605880);
        display.text.setTint(0x605880);
      }

      if (i === this.selectedIndex) {
        display.text.setTint(state === 'unlocked' ? 0x88ffaa : 0xffdd44);
      }
    }

    if (this.nodeDisplays.length > 0) {
      const display = this.nodeDisplays[this.selectedIndex];
      this.selectionIndicator.setPosition(display.statusText.x - 12, display.statusText.y);
      this.selectionIndicator.setVisible(true);
    }
  }

  private createPanel(): void {
    const vp = (this.scene as any).viewport as { width: number; height: number };
    this.container = this.scene.add.container(Math.floor(vp.width / 2), Math.floor(vp.height / 2));
    this.container.setDepth(1000);
    this.container.setVisible(false);

    const padX = 20;
    const padY = 16;
    const contentW = 500;
    const contentH = 310;
    const panelW = contentW + 2 * padX;
    const panelH = contentH + 2 * padY;

    const bg = this.scene.add.nineslice(0, 0, UI_ATLAS, 'frame_dark', panelW, panelH);
    bg.setOrigin(0.5, 0.5);
    bg.setAlpha(0.93);
    bg.setTint(0x8844aa);
    this.container.add(bg);

    const left = -panelW / 2 + padX;
    const top = -panelH / 2 + padY;

    const title = this.scene.add.bitmapText(0, top, FONT_SM, 'RESEARCH');
    title.setOrigin(0.5, 0);
    title.setTint(0xcc88ff);
    this.container.add(title);

    this.rpText = this.scene.add.bitmapText(0, top + 16, FONT_SM, 'Research Points: 0');
    this.rpText.setOrigin(0.5, 0);
    this.rpText.setTint(0xffaa00);
    this.container.add(this.rpText);

    this.selectionIndicator = this.scene.add.bitmapText(0, 0, FONT_SM, '>');
    this.selectionIndicator.setTint(0xffdd44);
    this.selectionIndicator.setVisible(false);
    this.container.add(this.selectionIndicator);

    const colX = [left, left + 176, left + 356];
    const topY = top + 32;

    this.createBranch(colX[0], topY, 'BUILDINGS', 'buildings', 0x44ff88);
    this.createBranch(colX[1], topY, 'RECIPES', 'recipes', 0xffaa44);
    this.createBranch(colX[2], topY, 'UPGRADES', 'upgrades', 0x88aaff);
    this.createRecipeReference(left, topY + 180);

    const hint = this.scene.add.bitmapText(
      0,
      top + contentH,
      FONT_SM,
      'ESDF:Navigate  Space:Unlock  R/X:Close'
    );
    hint.setOrigin(0.5, 1);
    hint.setTint(0x8078a0);
    this.container.add(hint);
  }

  private createBranch(
    x: number,
    y: number,
    title: string,
    branch: ResearchBranch,
    color: number
  ): void {
    const header = this.scene.add.bitmapText(x, y, FONT_SM, title);
    header.setTint(color);
    this.container.add(header);

    const divider = this.scene.add.graphics();
    divider.lineStyle(1, 0x444466);
    divider.lineBetween(x, y + 14, x + 160, y + 14);
    this.container.add(divider);

    const branchNodes = RESEARCH_NODES.filter((n) => n.branch === branch);
    let rowY = y + 18;

    for (const node of branchNodes) {
      const statusText = this.scene.add.bitmapText(x, rowY, FONT_SM, '[-]');
      statusText.setTint(0x605880);
      this.container.add(statusText);

      const nameText = this.scene.add.bitmapText(
        x + 26,
        rowY,
        FONT_SM,
        `${node.name} (${node.cost} RP)`
      );
      nameText.setTint(0xb0a8c0);
      this.container.add(nameText);

      const effectStr = this.getEffectDescription(node);
      const effectText = this.scene.add.bitmapText(x + 26, rowY + 14, FONT_SM, effectStr);
      effectText.setTint(0x605880);
      this.container.add(effectText);

      if (node.requires) {
        const reqNode = RESEARCH_NODES.find((n) => n.id === node.requires);
        const reqText = this.scene.add.bitmapText(
          x + 26,
          rowY + 24,
          FONT_SM,
          `Requires: ${reqNode?.name || node.requires}`
        );
        reqText.setTint(0x553355);
        this.container.add(reqText);
      }

      this.nodeDisplays.push({ node, text: nameText, statusText });
      rowY += node.requires ? 38 : 30;
    }
  }

  private createRecipeReference(x: number, y: number): void {
    const header = this.scene.add.bitmapText(
      x,
      y,
      FONT_SM,
      'STUDY RECIPES (Arcane Study building)'
    );
    header.setTint(0xcc88ff);
    this.container.add(header);

    const divider = this.scene.add.graphics();
    divider.lineStyle(1, 0x442266);
    divider.lineBetween(x, y + 14, x + 500, y + 14);
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

  private getEffectDescription(node: ResearchNode): string {
    const effect = node.effect;
    switch (effect.type) {
      case 'unlock_building':
        return `Unlocks ${effect.building} building`;
      case 'unlock_recipe':
        return `Unlocks ${effect.recipe} recipe`;
      case 'buffer_expansion':
        return `+${effect.amount} buffer on all buildings`;
      case 'overclock':
        return `${Math.round((1 - effect.craftTimeMultiplier) * 100)}% faster crafting`;
    }
  }
}
