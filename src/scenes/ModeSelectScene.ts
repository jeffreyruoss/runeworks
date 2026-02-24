import Phaser from 'phaser';
import { TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from '../config';
import { GameMode } from '../types';
import { makeText, setupCamera } from '../phaser-utils';

interface ModeOption {
  mode: GameMode;
  label: string;
  description: string;
}

const MODE_OPTIONS: ModeOption[] = [
  { mode: 'tutorial', label: 'TUTORIAL', description: 'Learn the basics step by step' },
  { mode: 'stages', label: 'STAGES', description: '10-stage progression challenge' },
  { mode: 'sandbox', label: 'SANDBOX', description: 'All buildings unlocked, no objectives' },
];

/**
 * Mode selection screen. Keyboard-only menu for choosing game mode.
 */
export class ModeSelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private optionTexts: Phaser.GameObjects.Text[] = [];
  private descTexts: Phaser.GameObjects.Text[] = [];
  private arrowText!: Phaser.GameObjects.Text;
  private optionStartY = 0;
  private optionSpacing = 0;

  constructor() {
    super({ key: 'ModeSelectScene' });
  }

  create(): void {
    setupCamera(this);

    // Background (solid black)
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 1);
    bg.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Logo crest
    const logo = this.add.sprite(CANVAS_WIDTH / 2, 50, 'sprites', 'logo_crest');
    logo.setOrigin(0.5, 0.5);
    logo.setDisplaySize(TILE_SIZE * 4, TILE_SIZE * 4);

    // Title
    const title = makeText(this, CANVAS_WIDTH / 2, 95, 'RUNEWORKS', {
      fontSize: '24px',
      color: '#ffffff',
    });
    title.setOrigin(0.5, 0.5);

    const subtitle = makeText(this, CANVAS_WIDTH / 2, 118, 'Micro-Factory Builder', {
      fontSize: '10px',
      color: '#888888',
    });
    subtitle.setOrigin(0.5, 0.5);

    // Mode options
    this.optionStartY = 175;
    this.optionSpacing = 45;
    const startY = this.optionStartY;
    const spacing = this.optionSpacing;

    for (let i = 0; i < MODE_OPTIONS.length; i++) {
      const opt = MODE_OPTIONS[i];
      const y = startY + i * spacing;

      const label = makeText(this, CANVAS_WIDTH / 2, y, opt.label, {
        fontSize: '14px',
        color: '#aaaaaa',
      });
      label.setOrigin(0.5, 0.5);
      this.optionTexts.push(label);

      const desc = makeText(this, CANVAS_WIDTH / 2, y + 16, opt.description, {
        fontSize: '8px',
        color: '#666666',
      });
      desc.setOrigin(0.5, 0.5);
      this.descTexts.push(desc);
    }

    // Selection arrow
    this.arrowText = makeText(this, 0, 0, '>', {
      fontSize: '14px',
      color: '#00ff00',
    });
    this.arrowText.setOrigin(0.5, 0.5);

    this.updateSelection();

    // Controls hint
    const hint = makeText(
      this,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT - 40,
      'E/D: Navigate    Space/Enter: Select',
      {
        fontSize: '10px',
        color: '#666666',
      }
    );
    hint.setOrigin(0.5, 0.5);

    // Input
    this.input.keyboard!.on('keydown', this.handleKey, this);
  }

  private handleKey(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyE':
        this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        this.updateSelection();
        break;
      case 'KeyD':
        this.selectedIndex = Math.min(MODE_OPTIONS.length - 1, this.selectedIndex + 1);
        this.updateSelection();
        break;
      case 'Space':
      case 'Enter':
        this.selectMode();
        break;
    }
  }

  private updateSelection(): void {
    for (let i = 0; i < this.optionTexts.length; i++) {
      const selected = i === this.selectedIndex;
      this.optionTexts[i].setColor(selected ? '#00ff00' : '#aaaaaa');
      this.descTexts[i].setColor(selected ? '#88ff88' : '#666666');
    }

    const y = this.optionStartY + this.selectedIndex * this.optionSpacing;
    this.arrowText.setPosition(CANVAS_WIDTH / 2 - 60, y);
  }

  private selectMode(): void {
    const mode = MODE_OPTIONS[this.selectedIndex].mode;
    this.input.keyboard!.off('keydown', this.handleKey, this);
    this.scene.start('GameScene', { mode });
    this.scene.start('UIScene', { mode });
  }
}
