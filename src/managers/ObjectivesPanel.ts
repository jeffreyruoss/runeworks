import Phaser from 'phaser';
import { THEME } from '../config';
import { GameUIState } from '../types';
import { getStage, ITEM_DISPLAY_NAMES, PRODUCTION_CHAINS } from '../data/stages';
import { TUTORIALS } from '../data/tutorials';
import { FONT_SM, getFontSize, C, addPanelBackground } from '../ui-theme';
import { getViewport } from '../utils';

const PAD_X = 20;
const PAD_Y = 16;
const LINE_H = 14;
const OBJ_H = 40;
const MAX_OBJ = 3;
const DIV_GAP = 8;
const MIN_CONTENT_W = 200;

/**
 * Manages the objectives panel and stage complete overlay in the UI.
 */
export class ObjectivesPanel {
  private scene: Phaser.Scene;

  // Objectives panel
  private objectivesContainer!: Phaser.GameObjects.Container;
  private bgFill!: Phaser.GameObjects.Rectangle;
  private bg!: Phaser.GameObjects.NineSlice;
  private stageTitleText!: Phaser.GameObjects.BitmapText;
  private divider!: Phaser.GameObjects.Graphics;
  private objectiveTexts: Phaser.GameObjects.BitmapText[] = [];
  private objectiveChainTexts: Phaser.GameObjects.BitmapText[] = [];
  private stageCompleteText!: Phaser.GameObjects.BitmapText;
  private closeHint!: Phaser.GameObjects.BitmapText;

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
    const vp = getViewport(this.scene);
    this.objectivesContainer = this.scene.add.container(
      Math.floor(vp.width / 2),
      Math.floor(vp.height / 2)
    );
    this.objectivesContainer.setDepth(1000);
    this.objectivesContainer.setVisible(false);

    // Background (sized dynamically in updateObjectivesContent)
    const { fill, frame } = addPanelBackground(this.scene, this.objectivesContainer, 100, 100);
    this.bgFill = fill;
    this.bg = frame;

    // Title
    this.stageTitleText = this.scene.add.bitmapText(0, 0, FONT_SM, '', getFontSize());
    this.stageTitleText.setOrigin(0.5, 0);
    this.stageTitleText.setTint(C.light);
    this.objectivesContainer.add(this.stageTitleText);

    // Divider
    this.divider = this.scene.add.graphics();
    this.objectivesContainer.add(this.divider);

    // Objective rows
    for (let i = 0; i < MAX_OBJ; i++) {
      const objText = this.scene.add.bitmapText(0, 0, FONT_SM, '', getFontSize());
      objText.setTint(C.secondary);
      this.objectiveTexts.push(objText);
      this.objectivesContainer.add(objText);

      const chainText = this.scene.add.bitmapText(0, 0, FONT_SM, '', getFontSize());
      chainText.setTint(0x666688);
      this.objectiveChainTexts.push(chainText);
      this.objectivesContainer.add(chainText);
    }

    // Stage complete indicator
    this.stageCompleteText = this.scene.add.bitmapText(
      0,
      0,
      FONT_SM,
      'STAGE COMPLETE!',
      getFontSize()
    );
    this.stageCompleteText.setOrigin(0.5, 0);
    this.stageCompleteText.setTint(C.valid);
    this.stageCompleteText.setVisible(false);
    this.objectivesContainer.add(this.stageCompleteText);

    // Close hint
    this.closeHint = this.scene.add.bitmapText(
      0,
      0,
      FONT_SM,
      'Press O or X to close',
      getFontSize()
    );
    this.closeHint.setOrigin(0.5, 1);
    this.closeHint.setTint(0x8078a0);
    this.objectivesContainer.add(this.closeHint);
  }

  private createStageCompletePanel(): void {
    const vp = getViewport(this.scene);
    this.stageCompleteContainer = this.scene.add.container(
      Math.floor(vp.width / 2),
      Math.floor(vp.height / 2)
    );
    this.stageCompleteContainer.setDepth(1001);
    this.stageCompleteContainer.setVisible(false);

    const contentW = 200;
    const contentH = 80;
    const panelW = contentW + 2 * PAD_X;
    const panelH = contentH + 2 * PAD_Y;

    addPanelBackground(this.scene, this.stageCompleteContainer, panelW, panelH, {
      frameTint: 0x66cc88,
      frameAlpha: 0.8,
    });

    const top = -panelH / 2 + PAD_Y;
    let y = top;

    const title = this.scene.add.bitmapText(0, y, FONT_SM, 'STAGE COMPLETE!', getFontSize());
    title.setOrigin(0.5, 0);
    title.setTint(C.valid);
    this.stageCompleteContainer.add(title);
    y += 26;

    this.stageCompleteNameText = this.scene.add.bitmapText(0, y, FONT_SM, '', getFontSize());
    this.stageCompleteNameText.setOrigin(0.5, 0);
    this.stageCompleteNameText.setTint(C.light);
    this.stageCompleteContainer.add(this.stageCompleteNameText);
    y += 20;

    this.stageCompleteNextText = this.scene.add.bitmapText(0, y, FONT_SM, '', getFontSize());
    this.stageCompleteNextText.setOrigin(0.5, 0);
    this.stageCompleteNextText.setTint(C.secondary);
    this.stageCompleteContainer.add(this.stageCompleteNextText);

    const hint = this.scene.add.bitmapText(
      0,
      top + contentH,
      FONT_SM,
      '[Enter] Continue',
      getFontSize()
    );
    hint.setOrigin(0.5, 1);
    hint.setTint(C.active);
    this.stageCompleteContainer.add(hint);
  }

  update(state: GameUIState): void {
    const objectivesOpen = state.activePanel === 'objectives';
    this.objectivesContainer.setVisible(objectivesOpen);
    if (objectivesOpen) this.updateObjectivesContent(state);

    this.stageCompleteContainer.setVisible(state.stageCompleteShown);
    if (state.stageCompleteShown) this.updateStageCompleteContent(state);
  }

  private updateObjectivesContent(state: GameUIState): void {
    const label = state.gameMode === 'tutorial' ? 'Lesson' : 'Stage';
    const objCount = Math.min(state.objectiveProgress.length, MAX_OBJ);

    // --- Pass 1: set all text content so we can measure widths ---

    this.stageTitleText.setText(`${label} ${state.currentStage}: ${state.stageName}`);

    for (let i = 0; i < MAX_OBJ; i++) {
      if (i < objCount) {
        const obj = state.objectiveProgress[i];
        const done = obj.produced >= obj.required;
        const check = done ? '[x]' : '[ ]';
        const name = ITEM_DISPLAY_NAMES[obj.item] || obj.item;
        this.objectiveTexts[i].setText(`${check} ${name}: ${obj.produced}/${obj.required}`);
        this.objectiveTexts[i].setTint(done ? C.valid : C.secondary);
        this.objectiveTexts[i].setVisible(true);

        const chain = PRODUCTION_CHAINS[obj.item] || '';
        this.objectiveChainTexts[i].setText(chain);
        this.objectiveChainTexts[i].setTint(done ? 0x448844 : 0x666688);
        this.objectiveChainTexts[i].setVisible(chain.length > 0);
      } else {
        this.objectiveTexts[i].setVisible(false);
        this.objectiveChainTexts[i].setVisible(false);
      }
    }

    this.stageCompleteText.setVisible(state.stageComplete);

    // --- Pass 2: measure widest text to determine panel width ---

    let maxW = this.stageTitleText.width;
    for (let i = 0; i < objCount; i++) {
      maxW = Math.max(maxW, this.objectiveTexts[i].width);
      if (this.objectiveChainTexts[i].visible) {
        maxW = Math.max(maxW, this.objectiveChainTexts[i].width + 12);
      }
    }
    maxW = Math.max(maxW, this.closeHint.width);
    const contentW = Math.max(maxW, MIN_CONTENT_W);

    // --- Pass 3: compute height and position everything ---

    const titleH = 16;
    const objsH = objCount * OBJ_H;
    const completeH = state.stageComplete ? LINE_H + 4 : 0;
    const hintH = LINE_H + 4;
    const contentH = titleH + DIV_GAP + objsH + completeH + hintH;

    const panelW = contentW + 2 * PAD_X;
    const panelH = contentH + 2 * PAD_Y;
    this.bgFill.setSize(panelW, panelH);
    this.bg.setSize(panelW, panelH);

    const left = -contentW / 2;
    const top = -panelH / 2 + PAD_Y;
    let y = top;

    this.stageTitleText.setPosition(0, y);
    y += titleH;

    this.divider.clear();
    this.divider.lineStyle(1, THEME.panel.divider);
    this.divider.lineBetween(-contentW / 2, y + DIV_GAP / 2, contentW / 2, y + DIV_GAP / 2);
    y += DIV_GAP;

    for (let i = 0; i < objCount; i++) {
      this.objectiveTexts[i].setPosition(left, y);
      this.objectiveChainTexts[i].setPosition(left + 12, y + LINE_H);
      y += OBJ_H;
    }

    this.stageCompleteText.setPosition(0, y);
    if (state.stageComplete) y += LINE_H + 4;

    this.closeHint.setPosition(0, y + hintH);
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
