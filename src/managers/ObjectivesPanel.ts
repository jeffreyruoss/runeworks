import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, THEME, PANEL_INSET } from '../config';
import { GameUIState } from '../types';
import { getStage, ITEM_DISPLAY_NAMES, PRODUCTION_CHAINS } from '../data/stages';
import { TUTORIALS } from '../data/tutorials';
import { makeText, createPanelFrame } from '../phaser-utils';

/**
 * Manages the objectives panel and stage complete overlay in the UI.
 * Extracted from UIScene to keep it under the 300-line target.
 */
export class ObjectivesPanel {
  private scene: Phaser.Scene;

  // Objectives panel
  private objectivesContainer!: Phaser.GameObjects.Container;
  private stageTitleText!: Phaser.GameObjects.Text;
  private objectiveTexts: Phaser.GameObjects.Text[] = [];
  private objectiveChainTexts: Phaser.GameObjects.Text[] = [];
  private stageCompleteText!: Phaser.GameObjects.Text;

  // Stage complete overlay
  private stageCompleteContainer!: Phaser.GameObjects.Container;
  private stageCompleteNameText!: Phaser.GameObjects.Text;
  private stageCompleteNextText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createObjectivesPanel();
    this.createStageCompletePanel();
  }

  private createObjectivesPanel(): void {
    this.objectivesContainer = this.scene.add.container(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.objectivesContainer.setDepth(1000);
    this.objectivesContainer.setVisible(false);

    // Content dimensions drive panel size
    const titleH = 14;
    const divGap = 8;
    const objH = 40; // per objective row (text + chain + gap)
    const maxObj = 3;
    const completeH = 12;
    const hintH = 8;

    const contentW = 280;
    const contentH = titleH + divGap + maxObj * objH + completeH + 4 + hintH;
    const panelW = contentW + 2 * PANEL_INSET;
    const panelH = contentH + 2 * PANEL_INSET;

    const bg = createPanelFrame(this.scene, panelW, panelH);
    this.objectivesContainer.add(bg);

    const left = -panelW / 2 + PANEL_INSET;
    const top = -panelH / 2 + PANEL_INSET;

    // Title
    this.stageTitleText = makeText(this.scene, 0, top, '', {
      fontSize: '14px',
      color: THEME.text.primary,
    });
    this.stageTitleText.setOrigin(0.5, 0);
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

      const objText = makeText(this.scene, left, y, '', {
        fontSize: '10px',
        color: THEME.text.secondary,
      });
      this.objectiveTexts.push(objText);
      this.objectivesContainer.add(objText);

      const chainText = makeText(this.scene, left + 12, y + 14, '', {
        fontSize: '8px',
        color: '#666688',
      });
      this.objectiveChainTexts.push(chainText);
      this.objectivesContainer.add(chainText);
    }

    // Stage complete indicator
    this.stageCompleteText = makeText(this.scene, 0, startY + maxObj * objH, 'STAGE COMPLETE!', {
      fontSize: '12px',
      color: THEME.status.valid,
    });
    this.stageCompleteText.setOrigin(0.5, 0);
    this.stageCompleteText.setVisible(false);
    this.objectivesContainer.add(this.stageCompleteText);

    // Close hint
    const hint = makeText(this.scene, 0, top + contentH, 'Press O or X to close', {
      fontSize: '8px',
      color: THEME.text.tertiary,
    });
    hint.setOrigin(0.5, 1);
    this.objectivesContainer.add(hint);
  }

  private createStageCompletePanel(): void {
    this.stageCompleteContainer = this.scene.add.container(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.stageCompleteContainer.setDepth(1001);
    this.stageCompleteContainer.setVisible(false);

    // Content dimensions drive panel size
    const titleH = 14;
    const nameH = 10;
    const nextH = 10;
    const hintH = 10;
    const contentW = 200;
    const contentH = titleH + 12 + nameH + 10 + nextH + 12 + hintH;
    const panelW = contentW + 2 * PANEL_INSET;
    const panelH = contentH + 2 * PANEL_INSET;

    const bg = createPanelFrame(this.scene, panelW, panelH);
    // Tint border sprites green for celebratory sheen
    bg.each((child: Phaser.GameObjects.GameObject) => {
      if (
        child instanceof Phaser.GameObjects.Image ||
        child instanceof Phaser.GameObjects.TileSprite
      ) {
        child.setTint(0x44ff88);
      }
    });
    this.stageCompleteContainer.add(bg);

    const top = -panelH / 2 + PANEL_INSET;
    let y = top;

    const title = makeText(this.scene, 0, y, 'STAGE COMPLETE!', {
      fontSize: '14px',
      color: THEME.status.valid,
    });
    title.setOrigin(0.5, 0);
    this.stageCompleteContainer.add(title);
    y += titleH + 12;

    this.stageCompleteNameText = makeText(this.scene, 0, y, '', {
      fontSize: '10px',
      color: THEME.text.primary,
    });
    this.stageCompleteNameText.setOrigin(0.5, 0);
    this.stageCompleteContainer.add(this.stageCompleteNameText);
    y += nameH + 10;

    this.stageCompleteNextText = makeText(this.scene, 0, y, '', {
      fontSize: '10px',
      color: THEME.text.secondary,
    });
    this.stageCompleteNextText.setOrigin(0.5, 0);
    this.stageCompleteContainer.add(this.stageCompleteNextText);

    const hint = makeText(this.scene, 0, top + contentH, '[Space] Continue', {
      fontSize: '10px',
      color: THEME.status.active,
    });
    hint.setOrigin(0.5, 1);
    this.stageCompleteContainer.add(hint);
  }

  /** Update panel visibility and content based on game state. */
  update(state: GameUIState): void {
    this.objectivesContainer.setVisible(state.objectivesOpen);
    if (state.objectivesOpen) {
      this.updateObjectivesContent(state);
    }

    this.stageCompleteContainer.setVisible(state.stageCompleteShown);
    if (state.stageCompleteShown) {
      this.updateStageCompleteContent(state);
    }
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
        this.objectiveTexts[i].setColor(done ? THEME.status.valid : THEME.text.secondary);
        this.objectiveTexts[i].setVisible(true);

        const chain = PRODUCTION_CHAINS[obj.item] || '';
        this.objectiveChainTexts[i].setText(chain);
        this.objectiveChainTexts[i].setColor(done ? '#448844' : '#666688');
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
      // Tutorial: generic "next lesson" or "tutorial complete"
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
