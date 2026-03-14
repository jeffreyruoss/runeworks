import Phaser from 'phaser';
import { UiScene, ConstraintMode } from 'phaser-pixui';
import { CANVAS_WIDTH, CANVAS_HEIGHT, THEME } from '../config';
import { GameMode } from '../types';
import { uiTheme, FONT_SM, FONT_MD, FONT_LG, C } from '../ui-theme';
import { blinkTransition } from '../audio';

const LOGO_SIZE = 64;
const LOGO_OFFSET_Y = -150;
const TITLE_OFFSET_Y = -80;
const MENU_START_OFFSET_Y = -25;
const MENU_ITEM_SPACING = 50;
const ICON_PADDING = 16;

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
  private selecting = false;
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

    // Background — oversized to survive viewport resizes
    const bg = this.add.rectangle(0, 0, 9999, 9999, THEME.modeSelect.bg);
    bg.setOrigin(0, 0);

    // Logo crest
    const logo = this.add.sprite(cx, cy + LOGO_OFFSET_Y, 'sprites', 'logo_crest');
    logo.setOrigin(0.5, 0.5);
    logo.setDisplaySize(LOGO_SIZE, LOGO_SIZE);

    // Title — bitmap text scaled up for big impact
    const title = this.add.bitmapText(cx, cy + TITLE_OFFSET_Y, FONT_LG, 'RUNEWORKS');
    title.setOrigin(0.5, 0.5);
    title.setScale(3);
    title.setTint(C.light);

    // Mode options — centered vertically around viewport center
    this.optionStartY = cy + MENU_START_OFFSET_Y;
    this.optionSpacing = MENU_ITEM_SPACING;

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

    // Keyboard input
    this.input.keyboard!.on('keydown', this.handleKey, this);

    // Mouse input — hover to highlight, click to select
    for (let i = 0; i < MODE_OPTIONS.length; i++) {
      const y = this.optionStartY + i * this.optionSpacing;
      const hitZone = this.add.zone(cx, y + 6, 300, this.optionSpacing);
      hitZone.setInteractive({ useHandCursor: true });
      hitZone.on('pointerover', () => {
        if (this.selecting) return;
        this.selectedIndex = i;
        this.updateSelection();
      });
      hitZone.on('pointerdown', () => {
        if (this.selecting) return;
        this.selectedIndex = i;
        this.selectMode();
      });
    }
  }

  shutdown(): void {
    this.input.keyboard!.off('keydown', this.handleKey, this);
  }

  private handleKey(event: KeyboardEvent): void {
    if (this.selecting) return;
    switch (event.code) {
      case 'KeyE':
      case 'ArrowUp':
        this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        this.updateSelection();
        break;
      case 'KeyD':
      case 'ArrowDown':
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
      this.optionTexts[i].setTint(selected ? C.active : C.secondary);
      this.descTexts[i].setTint(selected ? C.active : C.muted);
    }

    const label = this.optionTexts[this.selectedIndex];
    const y = this.optionStartY + this.selectedIndex * this.optionSpacing;
    this.arrowIcon.setPosition(label.x - label.width / 2 - ICON_PADDING, y);
  }

  private selectMode(): void {
    if (this.selecting) return;
    this.selecting = true;
    this.input.keyboard!.off('keydown', this.handleKey, this);

    blinkTransition(
      this,
      [
        { obj: this.optionTexts[this.selectedIndex], tint: C.active },
        { obj: this.descTexts[this.selectedIndex], tint: C.active },
        { obj: this.arrowIcon, tint: 0, toggleVisible: true },
      ],
      () => {
        const mode = MODE_OPTIONS[this.selectedIndex].mode;
        this.scene.start('LoadingScene', { mode });
      }
    );
  }
}
