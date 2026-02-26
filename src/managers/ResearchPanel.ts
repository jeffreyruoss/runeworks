import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, THEME, TICKS_PER_SECOND } from '../config';
import { RESEARCH_NODES, RESEARCH_RECIPES, ResearchBranch, ResearchNode } from '../data/research';
import { ITEM_DISPLAY_NAMES } from '../data/stages';
import { ResearchManager } from './ResearchManager';
import { makeText } from '../phaser-utils';

interface NodeDisplay {
  node: ResearchNode;
  text: Phaser.GameObjects.Text;
  statusText: Phaser.GameObjects.Text;
}

/**
 * Full-page research panel showing tech tree branches and RP balance.
 * Supports ESDF navigation and Space/Enter to unlock nodes.
 */
export class ResearchPanel {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private rpText!: Phaser.GameObjects.Text;
  private nodeDisplays: NodeDisplay[] = [];
  private selectedIndex = 0;
  private selectionIndicator!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createPanel();
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  /** Navigate the tech tree selection. Returns true if input was consumed. */
  navigate(dx: number, dy: number): boolean {
    if (this.nodeDisplays.length === 0) return false;

    if (dy !== 0) {
      // Move within a branch (up/down)
      this.selectedIndex = Math.max(
        0,
        Math.min(this.nodeDisplays.length - 1, this.selectedIndex + dy)
      );
    } else if (dx !== 0) {
      // Move between branches (left/right)
      const currentNode = this.nodeDisplays[this.selectedIndex].node;
      const branches: ResearchBranch[] = ['buildings', 'recipes', 'upgrades'];
      const currentBranchIdx = branches.indexOf(currentNode.branch);
      const newBranchIdx = Math.max(0, Math.min(branches.length - 1, currentBranchIdx + dx));
      const targetBranch = branches[newBranchIdx];

      // Find first node in target branch
      const targetIdx = this.nodeDisplays.findIndex((d) => d.node.branch === targetBranch);
      if (targetIdx >= 0) {
        this.selectedIndex = targetIdx;
      }
    }

    return true;
  }

  /** Attempt to unlock the selected node. Returns true if unlocked. */
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
        display.statusText.setColor(THEME.status.valid);
        display.text.setColor('#88ff88');
      } else if (state === 'available') {
        display.statusText.setText('[ ]');
        display.statusText.setColor(THEME.text.primary);
        display.text.setColor(THEME.text.primary);
      } else {
        display.statusText.setText('[-]');
        display.statusText.setColor(THEME.text.muted);
        display.text.setColor(THEME.text.muted);
      }

      // Highlight selected node
      if (i === this.selectedIndex) {
        display.text.setColor(state === 'unlocked' ? '#88ffaa' : THEME.status.paused);
      }
    }

    // Position selection indicator
    if (this.nodeDisplays.length > 0) {
      const display = this.nodeDisplays[this.selectedIndex];
      this.selectionIndicator.setPosition(display.statusText.x - 12, display.statusText.y);
      this.selectionIndicator.setVisible(true);
    }
  }

  private createPanel(): void {
    this.container = this.scene.add.container(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.container.setDepth(1000);
    this.container.setVisible(false);

    const panelW = 540;
    const panelH = 340;

    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(THEME.panel.bg, 0.93);
    bg.fillRect(-panelW / 2, -panelH / 2, panelW, panelH);
    bg.lineStyle(2, 0x8844aa);
    bg.strokeRect(-panelW / 2, -panelH / 2, panelW, panelH);
    this.container.add(bg);

    // Title
    const title = makeText(this.scene, 0, -panelH / 2 + 12, 'RESEARCH', {
      fontSize: '14px',
      color: '#cc88ff',
    });
    title.setOrigin(0.5, 0.5);
    this.container.add(title);

    // RP display
    this.rpText = makeText(this.scene, 0, -panelH / 2 + 28, 'Research Points: 0', {
      fontSize: '10px',
      color: '#ffaa00',
    });
    this.rpText.setOrigin(0.5, 0.5);
    this.container.add(this.rpText);

    // Selection indicator
    this.selectionIndicator = makeText(this.scene, 0, 0, '>', {
      fontSize: '10px',
      color: THEME.status.paused,
    });
    this.selectionIndicator.setVisible(false);
    this.container.add(this.selectionIndicator);

    // Three columns
    const colX = [-panelW / 2 + 14, -panelW / 2 + 190, -panelW / 2 + 370];
    const topY = -panelH / 2 + 44;

    this.createBranch(colX[0], topY, 'BUILDINGS', 'buildings', '#44ff88');
    this.createBranch(colX[1], topY, 'RECIPES', 'recipes', '#ffaa44');
    this.createBranch(colX[2], topY, 'UPGRADES', 'upgrades', '#88aaff');

    // Research recipes reference
    this.createRecipeReference(-panelW / 2 + 14, topY + 180);

    // Close hint
    const hint = makeText(
      this.scene,
      0,
      panelH / 2 - 12,
      'ESDF:Navigate  Space:Unlock  R/X:Close',
      {
        fontSize: '8px',
        color: THEME.text.tertiary,
      }
    );
    hint.setOrigin(0.5, 0.5);
    this.container.add(hint);
  }

  private createBranch(
    x: number,
    y: number,
    title: string,
    branch: ResearchBranch,
    color: string
  ): void {
    const header = makeText(this.scene, x, y, title, {
      fontSize: '10px',
      color,
    });
    this.container.add(header);

    const divider = this.scene.add.graphics();
    divider.lineStyle(1, 0x444466);
    divider.lineBetween(x, y + 12, x + 160, y + 12);
    this.container.add(divider);

    const branchNodes = RESEARCH_NODES.filter((n) => n.branch === branch);
    let rowY = y + 18;

    for (const node of branchNodes) {
      const statusText = makeText(this.scene, x, rowY, '[-]', {
        fontSize: '10px',
        color: THEME.text.muted,
      });
      this.container.add(statusText);

      const nameText = makeText(this.scene, x + 26, rowY, `${node.name} (${node.cost} RP)`, {
        fontSize: '9px',
        color: THEME.text.secondary,
      });
      this.container.add(nameText);

      // Effect description
      const effectStr = this.getEffectDescription(node);
      const effectText = makeText(this.scene, x + 26, rowY + 12, effectStr, {
        fontSize: '7px',
        color: THEME.text.muted,
      });
      this.container.add(effectText);

      // Requirement
      if (node.requires) {
        const reqNode = RESEARCH_NODES.find((n) => n.id === node.requires);
        const reqText = makeText(
          this.scene,
          x + 26,
          rowY + 20,
          `Requires: ${reqNode?.name || node.requires}`,
          {
            fontSize: '7px',
            color: '#553355',
          }
        );
        this.container.add(reqText);
      }

      this.nodeDisplays.push({
        node,
        text: nameText,
        statusText,
      });

      rowY += node.requires ? 34 : 28;
    }
  }

  private createRecipeReference(x: number, y: number): void {
    const header = makeText(this.scene, x, y, 'STUDY RECIPES (Arcane Study building)', {
      fontSize: '9px',
      color: '#cc88ff',
    });
    this.container.add(header);

    const divider = this.scene.add.graphics();
    divider.lineStyle(1, 0x442266);
    divider.lineBetween(x, y + 12, x + 500, y + 12);
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
          fontSize: '8px',
          color: THEME.text.muted,
        }
      );
      this.container.add(text);
      rowY += 12;
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
