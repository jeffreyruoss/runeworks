import { ThemeConfig, TextAlign } from 'phaser-pixui';

/**
 * PixUI theme for Runeworks. Uses CC0 Mana Soul assets
 * by Gabriel Lima (tiopalada.itch.io).
 */
export const uiTheme: ThemeConfig = {
  resources: {
    basePath: 'packed_assets',
    atlas: 'mana_soul',
    fonts: {
      atlas: 'fonts',
      names: ['mana_roots', 'mana_trunk', 'mana_branches'],
    },
  },

  palette: {
    default: 0xe8e0f0, // text.primary
    light: 0xe8e0f0,
    dark: 0x0d0b1a, // panel.bg
    secondary: 0xb0a8c0,
    muted: 0x605880,
    active: 0x4af0ff,
    valid: 0x44ff88,
    invalid: 0xff5566,
    paused: 0xffdd44,
  },

  fontName: 'mana_roots',
  fontSize: 16,
  fontTint: 'light',

  button: {
    frame: 'button',
    defaultWidth: 128,
    fontTintDisabled: 'muted',
  },

  progress: {
    frame: 'progress_curly',
    bar: 'bar_green',
    paddingX: 5,
    paddingY: 3,
  },

  textArea: {
    styles: {
      header: {
        fontName: 'mana_trunk',
        fontTint: 'light',
        defaultAlign: TextAlign.Center,
      },
    },
  },
};

// UI atlas key and font names for use in manual bitmapText calls
export const UI_ATLAS = 'mana_soul';
export const FONT_SM = 'mana_roots'; // Smallest — good for HUD text
export const FONT_MD = 'mana_trunk'; // Medium — good for panel headers
export const FONT_LG = 'mana_branches'; // Largest — good for titles
