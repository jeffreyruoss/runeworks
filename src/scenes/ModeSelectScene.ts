import Phaser from 'phaser';
import { UiScene, ConstraintMode } from 'phaser-pixui';
import { TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from '../config';
import { GameMode } from '../types';
import { uiTheme, FONT_SM, FONT_MD, FONT_LG, C } from '../ui-theme';

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
 * Extends UiScene for bitmap font support (crisp pixel-perfect text).
 */
export class ModeSelectScene extends UiScene {
  private selectedIndex = 0;
  private optionTexts: Phaser.GameObjects.BitmapText[] = [];
  private descTexts: Phaser.GameObjects.BitmapText[] = [];
  private arrowIcon!: Phaser.GameObjects.Sprite;
  private optionStartY = 0;
  private optionSpacing = 0;

  constructor() {
    super({
      key: 'ModeSelectScene',
      viewportConstraints: {
        mode: ConstraintMode.Minimum,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      },
      theme: uiTheme,
    });
  }

  create(): void {
    super.create();

    const vp = this.viewport;
    const cx = Math.floor(vp.width / 2);
    const cy = Math.floor(vp.height / 2);

    // Background fills entire viewport
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 1);
    bg.fillRect(0, 0, vp.width, vp.height);

    // Logo crest
    const logo = this.add.sprite(cx, cy - 150, 'sprites', 'logo_crest');
    logo.setOrigin(0.5, 0.5);
    logo.setDisplaySize(TILE_SIZE * 4, TILE_SIZE * 4);

    // Title — bitmap text scaled up for big impact
    const title = this.add.bitmapText(cx, cy - 80, FONT_LG, 'RUNEWORKS');
    title.setOrigin(0.5, 0.5);
    title.setScale(3);
    title.setTint(C.light);

    // Mode options — centered vertically around viewport center
    this.optionStartY = cy - 25;
    this.optionSpacing = 50;

    for (let i = 0; i < MODE_OPTIONS.length; i++) {
      const opt = MODE_OPTIONS[i];
      const y = this.optionStartY + i * this.optionSpacing;

      const label = this.add.bitmapText(cx, y, FONT_MD, opt.label);
      label.setOrigin(0.5, 0.5);
      label.setTint(C.secondary);
      this.optionTexts.push(label);

      const desc = this.add.bitmapText(cx, y + 18, FONT_SM, opt.description);
      desc.setOrigin(0.5, 0.5);
      desc.setTint(C.muted);
      this.descTexts.push(desc);
    }

    // Selection rune icon
    this.arrowIcon = this.add.sprite(0, 0, 'sprites', 'menu_rune');
    this.arrowIcon.setOrigin(0.5, 0.5);

    this.updateSelection();

    // Controls hint (near bottom of viewport)
    const hint = this.add.bitmapText(
      cx,
      vp.height - 40,
      FONT_SM,
      'E/D: Navigate    Space/Enter: Select'
    );
    hint.setOrigin(0.5, 0.5);
    hint.setTint(C.muted);

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
    const cx = Math.floor(this.viewport.width / 2);

    for (let i = 0; i < this.optionTexts.length; i++) {
      const selected = i === this.selectedIndex;
      this.optionTexts[i].setTint(selected ? C.active : C.secondary);
      this.descTexts[i].setTint(selected ? 0x88d8e8 : C.muted);
    }

    const y = this.optionStartY + this.selectedIndex * this.optionSpacing;
    this.arrowIcon.setPosition(cx - 80, y);
  }

  private selectMode(): void {
    const mode = MODE_OPTIONS[this.selectedIndex].mode;
    this.input.keyboard!.off('keydown', this.handleKey, this);
    this.scene.start('GameScene', { mode });
    this.scene.start('UIScene', { mode });
  }
}
