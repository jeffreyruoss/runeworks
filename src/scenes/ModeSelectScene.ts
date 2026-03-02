import Phaser from 'phaser';
import { UiScene, ConstraintMode } from 'phaser-pixui';
import { TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, THEME } from '../config';
import { GameMode } from '../types';
import { uiTheme, FONT_SM, FONT_MD, FONT_LG } from '../ui-theme';

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
  private arrowText!: Phaser.GameObjects.BitmapText;
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

    // Background fills entire viewport (prevents game bg color bleeding through)
    const bg = this.add.graphics();
    bg.fillStyle(THEME.modeSelect.bg, 1);
    bg.fillRect(0, 0, vp.width, vp.height);

    // Logo crest
    const logo = this.add.sprite(cx, cy - 150, 'sprites', 'logo_crest');
    logo.setOrigin(0.5, 0.5);
    logo.setDisplaySize(TILE_SIZE * 4, TILE_SIZE * 4);

    // Title — bitmap text for crisp rendering
    const title = this.add.bitmapText(cx, cy - 105, FONT_LG, 'RUNEWORKS');
    title.setOrigin(0.5, 0.5);
    title.setTint(0xe8e0f0);

    const subtitle = this.add.bitmapText(cx, cy - 82, FONT_SM, 'Micro-Factory Builder');
    subtitle.setOrigin(0.5, 0.5);
    subtitle.setTint(0x8078a0);

    // Mode options — centered vertically around viewport center
    this.optionStartY = cy - 25;
    this.optionSpacing = 50;

    for (let i = 0; i < MODE_OPTIONS.length; i++) {
      const opt = MODE_OPTIONS[i];
      const y = this.optionStartY + i * this.optionSpacing;

      const label = this.add.bitmapText(cx, y, FONT_MD, opt.label);
      label.setOrigin(0.5, 0.5);
      label.setTint(0xb0a8c0);
      this.optionTexts.push(label);

      const desc = this.add.bitmapText(cx, y + 18, FONT_SM, opt.description);
      desc.setOrigin(0.5, 0.5);
      desc.setTint(0x605880);
      this.descTexts.push(desc);
    }

    // Selection arrow
    this.arrowText = this.add.bitmapText(0, 0, FONT_MD, '>');
    this.arrowText.setOrigin(0.5, 0.5);
    this.arrowText.setTint(0x4af0ff);

    this.updateSelection();

    // Controls hint (near bottom of viewport)
    const hint = this.add.bitmapText(
      cx,
      vp.height - 40,
      FONT_SM,
      'E/D: Navigate    Space/Enter: Select'
    );
    hint.setOrigin(0.5, 0.5);
    hint.setTint(0x605880);

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
      this.optionTexts[i].setTint(selected ? 0x4af0ff : 0xb0a8c0);
      this.descTexts[i].setTint(selected ? 0x88d8e8 : 0x605880);
    }

    const y = this.optionStartY + this.selectedIndex * this.optionSpacing;
    this.arrowText.setPosition(cx - 80, y);
  }

  private selectMode(): void {
    const mode = MODE_OPTIONS[this.selectedIndex].mode;
    this.input.keyboard!.off('keydown', this.handleKey, this);
    this.scene.start('GameScene', { mode });
    this.scene.start('UIScene', { mode });
  }
}
