import Phaser from 'phaser';
import { UiScene, ConstraintMode } from 'phaser-pixui';
import { CANVAS_WIDTH, CANVAS_HEIGHT, THEME } from '../config';
import { GameMode } from '../types';
import { uiTheme, FONT_SM, FONT_MD, FONT_LG, C } from '../ui-theme';
import { sfxr } from 'jsfxr';

const LOGO_SIZE = 64;
const LOGO_OFFSET_Y = -150;
const TITLE_OFFSET_Y = -80;
const MENU_START_OFFSET_Y = -25;
const MENU_ITEM_SPACING = 50;
const ICON_PADDING = 16;
const BLINK_COUNT = 5;
const BLINK_INTERVAL = 70; // ms per blink toggle

// Menu select sound params (sawtooth blip designed in sfxr.me)
const SELECT_SOUND_DEF = {
  oldParams: true,
  wave_type: 1,
  p_env_attack: 0,
  p_env_sustain: 0.02727193042081071,
  p_env_punch: 0.3719218275602389,
  p_env_decay: 0.2806954521471867,
  p_base_freq: 0.6417857495222331,
  p_freq_limit: 0,
  p_freq_ramp: 0,
  p_freq_dramp: 0,
  p_vib_strength: 0,
  p_vib_speed: 0,
  p_arp_mod: 0.5313118378337934,
  p_arp_speed: 0.5340896727515815,
  p_duty: 0,
  p_duty_ramp: 0,
  p_repeat_speed: 0,
  p_pha_offset: 0,
  p_pha_ramp: 0,
  p_lpf_freq: 1,
  p_lpf_ramp: 0,
  p_lpf_resonance: 0,
  p_hpf_freq: 0,
  p_hpf_ramp: 0,
  sound_vol: 0.25,
  sample_rate: 44100,
  sample_size: 8,
};

// Lazy-initialized on first scene create (avoids eager synthesis at import time)
let selectAudio: ReturnType<typeof sfxr.toAudio> | null = null;

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

    // Synthesize audio on first create (deferred from module load)
    if (!selectAudio) selectAudio = sfxr.toAudio(SELECT_SOUND_DEF);

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

    // Play 8-bit select sound
    selectAudio!.play();

    // NES-style rapid blink: alternate between white and active color
    const label = this.optionTexts[this.selectedIndex];
    const desc = this.descTexts[this.selectedIndex];
    let blinks = 0;
    const totalToggles = BLINK_COUNT * 2;

    this.time.addEvent({
      delay: BLINK_INTERVAL,
      repeat: totalToggles - 1,
      callback: () => {
        blinks++;
        const isWhite = blinks % 2 === 1;
        label.setTint(isWhite ? 0xffffff : C.active);
        desc.setTint(isWhite ? 0xffffff : C.active);
        this.arrowIcon.setVisible(!isWhite);

        // Transition after final blink
        if (blinks === totalToggles) {
          const mode = MODE_OPTIONS[this.selectedIndex].mode;
          this.scene.start('GameScene', { mode });
          this.scene.start('UIScene', { mode });
        }
      },
    });
  }
}
