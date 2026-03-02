import Phaser from 'phaser';
import { THEME } from '../config';
import { GameUIState } from '../types';
import { getStage, ITEM_DISPLAY_NAMES, PRODUCTION_CHAINS } from '../data/stages';
import { TUTORIALS } from '../data/tutorials';
import { FONT_SM, UI_ATLAS } from '../ui-theme';

/**
 * Manages the objectives panel and stage complete overlay in the UI.
 */
export class ObjectivesPanel {
  private scene: Phaser.Scene;

  // Objectives panel
  private objectivesContainer!: Phaser.GameObjects.Container;
  private stageTitleText!: Phaser.GameObjects.BitmapText;
  private objectiveTexts: Phaser.GameObjects.BitmapText[] = [];
  private objectiveChainTexts: Phaser.GameObjects.BitmapText[] = [];
  private stageCompleteText!: Phaser.GameObjects.BitmapText;

  // Stage complete overlay
  private stageCompleteContainer!: Phaser.GameObjects.Container;
  private stageCompleteNameText!: Phaser.GameObjects.BitmapText;
  private stageCompleteNextText!: Phaser.GameObjects.BitmapText;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createObjectivesPanel();
    this.createStageCompletePanel();
  }

  private createObjectivesPanel(): void {
    const vp = (this.scene as any).viewport as { width: number; height: number };
    this.objectivesContainer = this.scene.add.container(
      Math.floor(vp.width / 2),
      Math.floor(vp.height / 2)
    );
    this.objectivesContainer.setDepth(1000);
    this.objectivesContainer.setVisible(false);

    const padX = 20;
    const padY = 16;
    const titleH = 16;
    const divGap = 8;
    const objH = 40;
    const maxObj = 3;
    const completeH = 14;

    const contentW = 280;
    const contentH = titleH + divGap + maxObj * objH + completeH + 14;
    const panelW = contentW + 2 * padX;
    const panelH = contentH + 2 * padY;

    const bg = this.scene.add.nineslice(0, 0, UI_ATLAS, 'frame_dark', panelW, panelH);
    bg.setOrigin(0.5, 0.5);
    bg.setAlpha(0.93);
    this.objectivesContainer.add(bg);

    const left = -panelW / 2 + padX;
    const top = -panelH / 2 + padY;

    this.stageTitleText = this.scene.add.bitmapText(0, top, FONT_SM, '');
    this.stageTitleText.setOrigin(0.5, 0);
    this.stageTitleText.setTint(0xe8e0f0);
    this.objectivesContainer.add(this.stageTitleText);

    // Divider below title
    const dividerY = top + titleH + divGap / 2;
    const divider = this.scene.add.graphics();
    divider.lineStyle(1, THEME.panel.divider);
    divider.lineBetween(-contentW / 2, dividerY, contentW / 2, dividerY);
    this.objectivesContainer.add(divider);

    // Objectives
    const startY = top + titleH + divGap;
    for (let i = 0; i < maxObj; i++) {
      const y = startY + i * objH;

      const objText = this.scene.add.bitmapText(left, y, FONT_SM, '');
      objText.setTint(0xb0a8c0);
      this.objectiveTexts.push(objText);
      this.objectivesContainer.add(objText);

      const chainText = this.scene.add.bitmapText(left + 12, y + 14, FONT_SM, '');
      chainText.setTint(0x666688);
      this.objectiveChainTexts.push(chainText);
      this.objectivesContainer.add(chainText);
    }

    // Stage complete indicator
    this.stageCompleteText = this.scene.add.bitmapText(
      0,
      startY + maxObj * objH,
      FONT_SM,
      'STAGE COMPLETE!'
    );
    this.stageCompleteText.setOrigin(0.5, 0);
    this.stageCompleteText.setTint(0x44ff88);
    this.stageCompleteText.setVisible(false);
    this.objectivesContainer.add(this.stageCompleteText);

    // Close hint
    const hint = this.scene.add.bitmapText(0, top + contentH, FONT_SM, 'Press O or X to close');
    hint.setOrigin(0.5, 1);
    hint.setTint(0x8078a0);
    this.objectivesContainer.add(hint);
  }

  private createStageCompletePanel(): void {
    const vp = (this.scene as any).viewport as { width: number; height: number };
    this.stageCompleteContainer = this.scene.add.container(
      Math.floor(vp.width / 2),
      Math.floor(vp.height / 2)
    );
    this.stageCompleteContainer.setDepth(1001);
    this.stageCompleteContainer.setVisible(false);

    const padX = 20;
    const padY = 16;
    const contentW = 200;
    const contentH = 80;
    const panelW = contentW + 2 * padX;
    const panelH = contentH + 2 * padY;

    const bg = this.scene.add.nineslice(0, 0, UI_ATLAS, 'frame_bright', panelW, panelH);
    bg.setOrigin(0.5, 0.5);
    bg.setTint(0x44ff88);
    this.stageCompleteContainer.add(bg);

    const top = -panelH / 2 + padY;
    let y = top;

    const title = this.scene.add.bitmapText(0, y, FONT_SM, 'STAGE COMPLETE!');
    title.setOrigin(0.5, 0);
    title.setTint(0x44ff88);
    this.stageCompleteContainer.add(title);
    y += 26;

    this.stageCompleteNameText = this.scene.add.bitmapText(0, y, FONT_SM, '');
    this.stageCompleteNameText.setOrigin(0.5, 0);
    this.stageCompleteNameText.setTint(0xe8e0f0);
    this.stageCompleteContainer.add(this.stageCompleteNameText);
    y += 20;

    this.stageCompleteNextText = this.scene.add.bitmapText(0, y, FONT_SM, '');
    this.stageCompleteNextText.setOrigin(0.5, 0);
    this.stageCompleteNextText.setTint(0xb0a8c0);
    this.stageCompleteContainer.add(this.stageCompleteNextText);

    const hint = this.scene.add.bitmapText(0, top + contentH, FONT_SM, '[Space] Continue');
    hint.setOrigin(0.5, 1);
    hint.setTint(0x4af0ff);
    this.stageCompleteContainer.add(hint);
  }

  update(state: GameUIState): void {
    this.objectivesContainer.setVisible(state.objectivesOpen);
    if (state.objectivesOpen) this.updateObjectivesContent(state);

    this.stageCompleteContainer.setVisible(state.stageCompleteShown);
    if (state.stageCompleteShown) this.updateStageCompleteContent(state);
  }

  private updateObjectivesContent(state: GameUIState): void {
    const label = state.gameMode === 'tutorial' ? 'Lesson' : 'Stage';
    this.stageTitleText.setText(`${label} ${state.currentStage}: ${state.stageName}`);

    for (let i = 0; i < this.objectiveTexts.length; i++) {
      if (i < state.objectiveProgress.length) {
        const obj = state.objectiveProgress[i];
        const done = obj.produced >= obj.required;
        const check = done ? '[x]' : '[ ]';
        const name = ITEM_DISPLAY_NAMES[obj.item] || obj.item;
        this.objectiveTexts[i].setText(`${check} ${name}: ${obj.produced}/${obj.required}`);
        this.objectiveTexts[i].setTint(done ? 0x44ff88 : 0xb0a8c0);
        this.objectiveTexts[i].setVisible(true);

        const chain = PRODUCTION_CHAINS[obj.item] || '';
        this.objectiveChainTexts[i].setText(chain);
        this.objectiveChainTexts[i].setTint(done ? 0x448844 : 0x666688);
        this.objectiveChainTexts[i].setVisible(true);
      } else {
        this.objectiveTexts[i].setVisible(false);
        this.objectiveChainTexts[i].setVisible(false);
      }
    }

    this.stageCompleteText.setVisible(state.stageComplete);
  }

  private updateStageCompleteContent(state: GameUIState): void {
    this.stageCompleteNameText.setText(state.stageName);

    if (state.gameMode === 'tutorial') {
      if (state.currentStage < TUTORIALS.length) {
        this.stageCompleteNextText.setText('Next lesson...');
      } else {
        this.stageCompleteNextText.setText('Tutorial complete!');
      }
    } else {
      const nextStage = getStage(state.currentStage + 1);
      if (nextStage) {
        this.stageCompleteNextText.setText(`Next: Stage ${nextStage.id} - ${nextStage.name}`);
      } else {
        this.stageCompleteNextText.setText('All stages complete!');
      }
    }
  }
}
