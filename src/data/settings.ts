/**
 * Player settings persisted in localStorage.
 * Font size, sound volume, music volume.
 *
 * Font size changes take effect on next scene creation (not live).
 */

const STORAGE_KEY = 'runeworks_settings';

export type FontSizeOption = 'small' | 'medium' | 'large';

const FONT_SIZE_VALUES: Record<FontSizeOption, number> = {
  small: 12,
  medium: 14,
  large: 16,
};

const FONT_SIZE_ORDER: FontSizeOption[] = ['small', 'medium', 'large'];

const VOLUME_STEP = 10;

interface PlayerSettings {
  fontSize: FontSizeOption;
  soundVolume: number; // 0-100
  musicVolume: number; // 0-100
}

function defaultSettings(): PlayerSettings {
  return { fontSize: 'small', soundVolume: 100, musicVolume: 100 };
}

function clampVolume(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

let cached: PlayerSettings | null = null;

export function loadSettings(): PlayerSettings {
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cached = defaultSettings();
      return cached;
    }
    const data = JSON.parse(raw) as Partial<PlayerSettings>;
    cached = {
      fontSize: FONT_SIZE_ORDER.includes(data.fontSize as FontSizeOption)
        ? (data.fontSize as FontSizeOption)
        : 'small',
      soundVolume: clampVolume(typeof data.soundVolume === 'number' ? data.soundVolume : 100),
      musicVolume: clampVolume(typeof data.musicVolume === 'number' ? data.musicVolume : 100),
    };
    return cached;
  } catch {
    cached = defaultSettings();
    return cached;
  }
}

function saveSettings(settings: PlayerSettings): void {
  cached = settings;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Silently fail if localStorage is full or unavailable
  }
}

/** Returns the numeric font size (12, 14, or 16) for the current setting. */
export function getFontSize(): number {
  return FONT_SIZE_VALUES[loadSettings().fontSize];
}

/** Returns the numeric font size minus 1, for the help bar. */
export function getHelpFontSize(): number {
  return getFontSize() - 1;
}

/** Returns the current font size option label. */
export function getFontSizeLabel(): string {
  return loadSettings().fontSize;
}

/** Cycle font size forward or backward and save. Returns the new label. */
export function cycleFontSize(direction: 1 | -1): FontSizeOption {
  const settings = { ...loadSettings() };
  const idx = FONT_SIZE_ORDER.indexOf(settings.fontSize);
  const newIdx = Math.max(0, Math.min(FONT_SIZE_ORDER.length - 1, idx + direction));
  settings.fontSize = FONT_SIZE_ORDER[newIdx];
  saveSettings(settings);
  return settings.fontSize;
}

/** Get current sound volume (0-100). */
export function getSoundVolume(): number {
  return loadSettings().soundVolume;
}

/** Get current music volume (0-100). */
export function getMusicVolume(): number {
  return loadSettings().musicVolume;
}

/** Adjust sound volume by +/- VOLUME_STEP, clamped to 0-100. */
export function adjustSoundVolume(direction: 1 | -1): number {
  const settings = { ...loadSettings() };
  settings.soundVolume = clampVolume(settings.soundVolume + direction * VOLUME_STEP);
  saveSettings(settings);
  return settings.soundVolume;
}

/** Adjust music volume by +/- VOLUME_STEP, clamped to 0-100. */
export function adjustMusicVolume(direction: 1 | -1): number {
  const settings = { ...loadSettings() };
  settings.musicVolume = clampVolume(settings.musicVolume + direction * VOLUME_STEP);
  saveSettings(settings);
  return settings.musicVolume;
}
