import Phaser from 'phaser';
import { UiScene, ConstraintMode } from 'phaser-pixui';
import { CANVAS_WIDTH, CANVAS_HEIGHT, THEME } from '../config';
import { GameMode } from '../types';
import { uiTheme, FONT_SM, FONT_MD, FONT_LG, C } from '../ui-theme';
import { blinkTransition } from '../audio';
import {
  getFontSizeLabel,
  cycleFontSize,
  getSoundVolume,
  getMusicVolume,
  adjustSoundVolume,
  adjustMusicVolume,
} from '../data/settings';

const LOGO_SIZE = 64;
const LOGO_OFFSET_Y = -150;
const TITLE_OFFSET_Y = -80;
const MENU_START_OFFSET_Y = -25;
const MENU_ITEM_SPACING = 50;
const SETTINGS_ROW_SPACING = 36;
const ICON_PADDING = 16;

interface ModeOption {
  mode: GameMode | 'settings';
  label: string;
  description: string;
}

const MODE_OPTIONS: ModeOption[] = [
  { mode: 'tutorial', label: 'TUTORIAL', description: 'Learn the basics step by step' },
  { mode: 'stages', label: 'STAGES', description: '10-stage progression challenge' },
  { mode: 'sandbox', label: 'SANDBOX', description: 'All buildings unlocked, no objectives' },
  { mode: 'settings', label: 'SETTINGS', description: 'Font size, sound, and music' },
];

type SettingKey = 'fontSize' | 'sound' | 'music' | 'back';

interface SettingRow {
  key: SettingKey;
  label: string;
}

const SETTINGS_ROWS: SettingRow[] = [
  { key: 'fontSize', label: 'Font Size' },
  { key: 'sound', label: 'Sound' },
  { key: 'music', label: 'Music' },
  { key: 'back', label: 'Back' },
];

/**
 * Mode selection screen with settings sub-menu.
 * Keyboard-only menu for choosing game mode or adjusting settings.
 */
export class ModeSelectScene extends UiScene {
  private selectedIndex = 0;
  private selecting = false;

  // Main menu elements
  private menuContainer!: Phaser.GameObjects.Container;
  private optionTexts: Phaser.GameObjects.BitmapText[] = [];
  private descTexts: Phaser.GameObjects.BitmapText[] = [];
  private arrowIcon!: Phaser.GameObjects.Sprite;
  private optionStartY = 0;
  private optionSpacing = 0;

  // Settings elements
  private settingsContainer!: Phaser.GameObjects.Container;
  private settingLabels: Phaser.GameObjects.BitmapText[] = [];
  private settingValues: (Phaser.GameObjects.BitmapText | null)[] = [];
  private settingsArrowIcon!: Phaser.GameObjects.Sprite;
  private settingsStartY = 0;
  private settingsSelectedIndex = 0;

  // State
  private inSettings = false;

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

    // Background
    const bg = this.add.rectangle(0, 0, 9999, 9999, THEME.modeSelect.bg);
    bg.setOrigin(0, 0);

    // Logo crest
    const logo = this.add.sprite(cx, cy + LOGO_OFFSET_Y, 'sprites', 'logo_crest');
    logo.setOrigin(0.5, 0.5);
    logo.setDisplaySize(LOGO_SIZE, LOGO_SIZE);

    // Title
    const title = this.add.bitmapText(cx, cy + TITLE_OFFSET_Y, FONT_LG, 'RUNEWORKS');
    title.setOrigin(0.5, 0.5);
    title.setScale(3);
    title.setTint(C.light);

    this.createMainMenu(cx, cy);
    this.createSettingsMenu(cx, cy);

    // Start in main menu
    this.showMainMenu();

    // Keyboard input
    this.input.keyboard!.on('keydown', this.handleKey, this);
  }

  shutdown(): void {
    this.input.keyboard!.off('keydown', this.handleKey, this);
  }

  // --- Main Menu ---

  private createMainMenu(cx: number, cy: number): void {
    this.menuContainer = this.add.container(0, 0);
    this.optionStartY = cy + MENU_START_OFFSET_Y;
    this.optionSpacing = MENU_ITEM_SPACING;

    for (let i = 0; i < MODE_OPTIONS.length; i++) {
      const opt = MODE_OPTIONS[i];
      const y = this.optionStartY + i * this.optionSpacing;

      const label = this.add.bitmapText(cx, y, FONT_MD, opt.label);
      label.setOrigin(0.5, 0.5);
      label.setTint(C.secondary);
      this.optionTexts.push(label);
      this.menuContainer.add(label);

      const desc = this.add.bitmapText(cx, y + 18, FONT_SM, opt.description);
      desc.setOrigin(0.5, 0.5);
      desc.setTint(C.muted);
      this.descTexts.push(desc);
      this.menuContainer.add(desc);

      // Mouse hit zone
      const hitZone = this.add.zone(cx, y + 6, 300, this.optionSpacing);
      hitZone.setInteractive({ useHandCursor: true });
      hitZone.on('pointerover', () => {
        if (this.selecting || this.inSettings) return;
        this.selectedIndex = i;
        this.updateMainSelection();
      });
      hitZone.on('pointerdown', () => {
        if (this.selecting || this.inSettings) return;
        this.selectedIndex = i;
        this.selectMainOption();
      });
      this.menuContainer.add(hitZone);
    }

    this.arrowIcon = this.add.sprite(0, 0, 'sprites', 'menu_rune');
    this.arrowIcon.setOrigin(0.5, 0.5);
    this.menuContainer.add(this.arrowIcon);
  }

  private createSettingsMenu(cx: number, cy: number): void {
    this.settingsContainer = this.add.container(0, 0);
    this.settingsStartY = cy + MENU_START_OFFSET_Y;

    const settingsTitle = this.add.bitmapText(cx, this.settingsStartY - 30, FONT_MD, 'SETTINGS');
    settingsTitle.setOrigin(0.5, 0.5);
    settingsTitle.setTint(C.light);
    this.settingsContainer.add(settingsTitle);

    for (let i = 0; i < SETTINGS_ROWS.length; i++) {
      const row = SETTINGS_ROWS[i];
      const y = this.settingsStartY + i * SETTINGS_ROW_SPACING;

      if (row.key === 'back') {
        const backText = this.add.bitmapText(cx, y, FONT_MD, 'BACK');
        backText.setOrigin(0.5, 0.5);
        backText.setTint(C.secondary);
        this.settingLabels.push(backText);
        this.settingsContainer.add(backText);

        this.settingValues.push(null);
      } else {
        const labelText = this.add.bitmapText(cx - 60, y, FONT_SM, row.label);
        labelText.setOrigin(1, 0.5);
        labelText.setTint(C.secondary);
        this.settingLabels.push(labelText);
        this.settingsContainer.add(labelText);

        const valueText = this.add.bitmapText(cx - 50, y, FONT_SM, '');
        valueText.setOrigin(0, 0.5);
        valueText.setTint(C.active);
        this.settingValues.push(valueText);
        this.settingsContainer.add(valueText);
      }
    }

    this.settingsArrowIcon = this.add.sprite(0, 0, 'sprites', 'menu_rune');
    this.settingsArrowIcon.setOrigin(0.5, 0.5);
    this.settingsContainer.add(this.settingsArrowIcon);

    // Hint text
    const hint = this.add.bitmapText(
      cx,
      this.settingsStartY + SETTINGS_ROWS.length * SETTINGS_ROW_SPACING + 10,
      FONT_SM,
      'E/D to navigate  |  S/F to adjust  |  X to go back'
    );
    hint.setOrigin(0.5, 0.5);
    hint.setTint(C.muted);
    this.settingsContainer.add(hint);
  }

  private showMainMenu(): void {
    this.inSettings = false;
    this.menuContainer.setVisible(true);
    this.settingsContainer.setVisible(false);
    this.updateMainSelection();
  }

  private showSettings(): void {
    this.inSettings = true;
    this.settingsSelectedIndex = 0;
    this.menuContainer.setVisible(false);
    this.settingsContainer.setVisible(true);
    this.refreshSettingsValues();
    this.updateSettingsSelection();
  }

  private updateMainSelection(): void {
    for (let i = 0; i < this.optionTexts.length; i++) {
      const selected = i === this.selectedIndex;
      this.optionTexts[i].setTint(selected ? C.active : C.secondary);
      this.descTexts[i].setTint(selected ? C.active : C.muted);
    }

    const label = this.optionTexts[this.selectedIndex];
    const y = this.optionStartY + this.selectedIndex * this.optionSpacing;
    this.arrowIcon.setPosition(label.x - label.width / 2 - ICON_PADDING, y);
  }

  private updateSettingsSelection(): void {
    for (let i = 0; i < this.settingLabels.length; i++) {
      const selected = i === this.settingsSelectedIndex;
      this.settingLabels[i].setTint(selected ? C.active : C.secondary);
      this.settingValues[i]?.setTint(selected ? C.active : C.paused);
    }

    const labelObj = this.settingLabels[this.settingsSelectedIndex];
    const y = this.settingsStartY + this.settingsSelectedIndex * SETTINGS_ROW_SPACING;
    const leftEdge = labelObj.x - labelObj.width * labelObj.originX;
    this.settingsArrowIcon.setPosition(leftEdge - ICON_PADDING, y);
  }

  private refreshSettingsValues(): void {
    for (let i = 0; i < SETTINGS_ROWS.length; i++) {
      const row = SETTINGS_ROWS[i];
      const val = this.settingValues[i];
      if (!val) continue;
      if (row.key === 'fontSize') {
        val.setText(`< ${getFontSizeLabel().toUpperCase()} >`);
      } else if (row.key === 'sound') {
        val.setText(`< ${getSoundVolume()} >`);
      } else if (row.key === 'music') {
        val.setText(`< ${getMusicVolume()} >`);
      }
    }
  }

  // --- Input ---

  private handleKey(event: KeyboardEvent): void {
    if (this.selecting) return;

    if (this.inSettings) {
      this.handleSettingsKey(event);
    } else {
      this.handleMainKey(event);
    }
  }

  private handleMainKey(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyE':
      case 'ArrowUp':
        this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        this.updateMainSelection();
        break;
      case 'KeyD':
      case 'ArrowDown':
        this.selectedIndex = Math.min(MODE_OPTIONS.length - 1, this.selectedIndex + 1);
        this.updateMainSelection();
        break;
      case 'Space':
      case 'Enter':
        this.selectMainOption();
        break;
    }
  }

  private handleSettingsKey(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyE':
      case 'ArrowUp':
        this.settingsSelectedIndex = Math.max(0, this.settingsSelectedIndex - 1);
        this.updateSettingsSelection();
        break;
      case 'KeyD':
      case 'ArrowDown':
        this.settingsSelectedIndex = Math.min(
          SETTINGS_ROWS.length - 1,
          this.settingsSelectedIndex + 1
        );
        this.updateSettingsSelection();
        break;
      case 'KeyS':
      case 'ArrowLeft':
        this.adjustSetting(-1);
        break;
      case 'KeyF':
      case 'ArrowRight':
        this.adjustSetting(1);
        break;
      case 'Space':
      case 'Enter':
        if (SETTINGS_ROWS[this.settingsSelectedIndex].key === 'back') {
          this.showMainMenu();
        }
        break;
      case 'KeyX':
      case 'Escape':
        this.showMainMenu();
        break;
    }
  }

  private adjustSetting(direction: 1 | -1): void {
    const row = SETTINGS_ROWS[this.settingsSelectedIndex];
    switch (row.key) {
      case 'fontSize':
        cycleFontSize(direction);
        break;
      case 'sound':
        adjustSoundVolume(direction);
        break;
      case 'music':
        adjustMusicVolume(direction);
        break;
    }
    this.refreshSettingsValues();
  }

  // --- Selection ---

  private selectMainOption(): void {
    if (this.selecting) return;

    const m = MODE_OPTIONS[this.selectedIndex].mode;

    if (m === 'settings') {
      this.showSettings();
      return;
    }

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
        this.scene.start('LoadingScene', { mode: m });
      }
    );
  }
}
