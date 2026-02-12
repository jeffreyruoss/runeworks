import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config';
import { GameUIState } from '../types';
import { getStage, ITEM_DISPLAY_NAMES, PRODUCTION_CHAINS } from '../data/stages';
import { makeText } from '../utils';

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

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.9);
    bg.fillRect(-160, -110, 320, 220);
    bg.lineStyle(2, 0x666666);
    bg.strokeRect(-160, -110, 320, 220);
    bg.lineStyle(1, 0x444444);
    bg.lineBetween(-150, -78, 150, -78);
    this.objectivesContainer.add(bg);

    this.stageTitleText = makeText(this.scene, 0, -92, '', {
      fontSize: '14px',
      color: '#ffffff',
    });
    this.stageTitleText.setOrigin(0.5, 0.5);
    this.objectivesContainer.add(this.stageTitleText);

    const startY = -60;
    for (let i = 0; i < 3; i++) {
      const y = startY + i * 40;

      const objText = makeText(this.scene, -145, y, '', {
        fontSize: '10px',
        color: '#aaaaaa',
      });
      this.objectiveTexts.push(objText);
      this.objectivesContainer.add(objText);

      const chainText = makeText(this.scene, -133, y + 14, '', {
        fontSize: '8px',
        color: '#666688',
      });
      this.objectiveChainTexts.push(chainText);
      this.objectivesContainer.add(chainText);
    }

    this.stageCompleteText = makeText(this.scene, 0, 68, 'STAGE COMPLETE!', {
      fontSize: '12px',
      color: '#00ff00',
    });
    this.stageCompleteText.setOrigin(0.5, 0.5);
    this.stageCompleteText.setVisible(false);
    this.objectivesContainer.add(this.stageCompleteText);

    const hint = makeText(this.scene, 0, 95, 'Press O, X, or Esc to close', {
      fontSize: '8px',
      color: '#888888',
    });
    hint.setOrigin(0.5, 0.5);
    this.objectivesContainer.add(hint);
  }

  private createStageCompletePanel(): void {
    this.stageCompleteContainer = this.scene.add.container(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.stageCompleteContainer.setDepth(1001);
    this.stageCompleteContainer.setVisible(false);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.9);
    bg.fillRect(-120, -60, 240, 120);
    bg.lineStyle(2, 0x00ff00);
    bg.strokeRect(-120, -60, 240, 120);
    this.stageCompleteContainer.add(bg);

    const title = makeText(this.scene, 0, -35, 'STAGE COMPLETE!', {
      fontSize: '14px',
      color: '#00ff00',
    });
    title.setOrigin(0.5, 0.5);
    this.stageCompleteContainer.add(title);

    this.stageCompleteNameText = makeText(this.scene, 0, -10, '', {
      fontSize: '10px',
      color: '#ffffff',
    });
    this.stageCompleteNameText.setOrigin(0.5, 0.5);
    this.stageCompleteContainer.add(this.stageCompleteNameText);

    this.stageCompleteNextText = makeText(this.scene, 0, 25, '', {
      fontSize: '10px',
      color: '#aaaaaa',
    });
    this.stageCompleteNextText.setOrigin(0.5, 0.5);
    this.stageCompleteContainer.add(this.stageCompleteNextText);

    const hint = makeText(this.scene, 0, 45, '[Space] Continue', {
      fontSize: '10px',
      color: '#00ffff',
    });
    hint.setOrigin(0.5, 0.5);
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
    const stage = getStage(state.currentStage);
    const stageName = stage ? stage.name : `Stage ${state.currentStage}`;
    this.stageTitleText.setText(`Stage ${state.currentStage}: ${stageName}`);

    for (let i = 0; i < this.objectiveTexts.length; i++) {
      if (i < state.objectiveProgress.length) {
        const obj = state.objectiveProgress[i];
        const done = obj.produced >= obj.required;
        const check = done ? '[x]' : '[ ]';
        const name = ITEM_DISPLAY_NAMES[obj.item] || obj.item;
        this.objectiveTexts[i].setText(`${check} ${name}: ${obj.produced}/${obj.required}`);
        this.objectiveTexts[i].setColor(done ? '#00ff00' : '#aaaaaa');
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
    const stage = getStage(state.currentStage);
    const stageName = stage ? stage.name : `Stage ${state.currentStage}`;
    this.stageCompleteNameText.setText(stageName);

    const nextStage = getStage(state.currentStage + 1);
    if (nextStage) {
      this.stageCompleteNextText.setText(`Next: Stage ${nextStage.id} - ${nextStage.name}`);
    } else {
      this.stageCompleteNextText.setText('All stages complete!');
    }
  }
}
