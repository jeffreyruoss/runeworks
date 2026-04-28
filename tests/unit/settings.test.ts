/**
 * Tests for src/data/settings.ts
 *
 * The settings module caches internally, so we re-import fresh for each test
 * by using vi.resetModules() + dynamic import.
 */

const STORAGE_KEY = 'runeworks_settings';
const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => storage.set(k, v),
    removeItem: (k: string) => storage.delete(k),
  });
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function loadModule() {
  return await import('../../src/data/settings');
}

describe('loadSettings', () => {
  it('returns defaults when localStorage is empty', async () => {
    const { loadSettings } = await loadModule();
    const s = loadSettings();
    expect(s.fontSize).toBe('small');
    expect(s.soundVolume).toBe(100);
    expect(s.musicVolume).toBe(100);
  });

  it('parses valid stored settings', async () => {
    storage.set(
      STORAGE_KEY,
      JSON.stringify({ fontSize: 'large', soundVolume: 50, musicVolume: 70 })
    );
    const { loadSettings } = await loadModule();
    const s = loadSettings();
    expect(s.fontSize).toBe('large');
    expect(s.soundVolume).toBe(50);
    expect(s.musicVolume).toBe(70);
  });

  it('falls back to small for invalid fontSize', async () => {
    storage.set(
      STORAGE_KEY,
      JSON.stringify({ fontSize: 'huge', soundVolume: 80, musicVolume: 80 })
    );
    const { loadSettings } = await loadModule();
    const s = loadSettings();
    expect(s.fontSize).toBe('small');
  });

  it('clamps volume to 0-100 range', async () => {
    storage.set(
      STORAGE_KEY,
      JSON.stringify({ fontSize: 'small', soundVolume: 200, musicVolume: -50 })
    );
    const { loadSettings } = await loadModule();
    const s = loadSettings();
    expect(s.soundVolume).toBe(100);
    expect(s.musicVolume).toBe(0);
  });

  it('returns defaults on malformed JSON', async () => {
    storage.set(STORAGE_KEY, '{broken}');
    const { loadSettings } = await loadModule();
    const s = loadSettings();
    expect(s.fontSize).toBe('small');
    expect(s.soundVolume).toBe(100);
  });

  it('defaults volume when type is not number', async () => {
    storage.set(
      STORAGE_KEY,
      JSON.stringify({ fontSize: 'small', soundVolume: 'loud', musicVolume: null })
    );
    const { loadSettings } = await loadModule();
    const s = loadSettings();
    expect(s.soundVolume).toBe(100);
    expect(s.musicVolume).toBe(100);
  });
});

describe('getFontSize / getHelpFontSize', () => {
  it('returns 12 for small and 11 for help font (defaults)', async () => {
    const { getFontSize, getHelpFontSize } = await loadModule();
    expect(getFontSize()).toBe(12);
    expect(getHelpFontSize()).toBe(11);
  });

  it('returns 14 for medium', async () => {
    storage.set(
      STORAGE_KEY,
      JSON.stringify({ fontSize: 'medium', soundVolume: 100, musicVolume: 100 })
    );
    const { getFontSize } = await loadModule();
    expect(getFontSize()).toBe(14);
  });

  it('returns 16 for large', async () => {
    storage.set(
      STORAGE_KEY,
      JSON.stringify({ fontSize: 'large', soundVolume: 100, musicVolume: 100 })
    );
    const { getFontSize } = await loadModule();
    expect(getFontSize()).toBe(16);
  });
});

describe('cycleFontSize', () => {
  it('cycles forward from default small to medium', async () => {
    const { cycleFontSize } = await loadModule();
    const result = cycleFontSize(1);
    expect(result).toBe('medium');
  });

  it('clamps at small when cycling backward from default', async () => {
    const { cycleFontSize } = await loadModule();
    const result = cycleFontSize(-1);
    expect(result).toBe('small');
  });

  it('cycles forward from medium to large', async () => {
    storage.set(
      STORAGE_KEY,
      JSON.stringify({ fontSize: 'medium', soundVolume: 100, musicVolume: 100 })
    );
    const { cycleFontSize } = await loadModule();
    const result = cycleFontSize(1);
    expect(result).toBe('large');
  });

  it('clamps at large when cycling forward', async () => {
    storage.set(
      STORAGE_KEY,
      JSON.stringify({ fontSize: 'large', soundVolume: 100, musicVolume: 100 })
    );
    const { cycleFontSize } = await loadModule();
    const result = cycleFontSize(1);
    expect(result).toBe('large');
  });

  it('clamps at small when cycling backward', async () => {
    storage.set(
      STORAGE_KEY,
      JSON.stringify({ fontSize: 'small', soundVolume: 100, musicVolume: 100 })
    );
    const { cycleFontSize } = await loadModule();
    const result = cycleFontSize(-1);
    expect(result).toBe('small');
  });

  it('persists to localStorage', async () => {
    const { cycleFontSize } = await loadModule();
    cycleFontSize(1);
    const saved = JSON.parse(storage.get(STORAGE_KEY)!);
    expect(saved.fontSize).toBe('medium');
  });
});

describe('volume controls', () => {
  it('getSoundVolume returns default 100', async () => {
    const { getSoundVolume } = await loadModule();
    expect(getSoundVolume()).toBe(100);
  });

  it('getMusicVolume returns default 100', async () => {
    const { getMusicVolume } = await loadModule();
    expect(getMusicVolume()).toBe(100);
  });

  it('adjustSoundVolume decreases by 10', async () => {
    const { adjustSoundVolume } = await loadModule();
    const result = adjustSoundVolume(-1);
    expect(result).toBe(90);
  });

  it('adjustSoundVolume increases by 10', async () => {
    storage.set(
      STORAGE_KEY,
      JSON.stringify({ fontSize: 'medium', soundVolume: 50, musicVolume: 100 })
    );
    const { adjustSoundVolume } = await loadModule();
    const result = adjustSoundVolume(1);
    expect(result).toBe(60);
  });

  it('adjustMusicVolume clamps at 0', async () => {
    storage.set(
      STORAGE_KEY,
      JSON.stringify({ fontSize: 'medium', soundVolume: 100, musicVolume: 5 })
    );
    const { adjustMusicVolume } = await loadModule();
    const result = adjustMusicVolume(-1);
    expect(result).toBe(0);
  });

  it('adjustSoundVolume clamps at 100', async () => {
    const { adjustSoundVolume } = await loadModule();
    const result = adjustSoundVolume(1); // 100 + 10 = clamped to 100
    expect(result).toBe(100);
  });

  it('volume changes persist to localStorage', async () => {
    const { adjustSoundVolume } = await loadModule();
    adjustSoundVolume(-1);
    const saved = JSON.parse(storage.get(STORAGE_KEY)!);
    expect(saved.soundVolume).toBe(90);
  });
});

describe('getFontSizeLabel', () => {
  it('returns the current font size option', async () => {
    const { getFontSizeLabel } = await loadModule();
    expect(getFontSizeLabel()).toBe('small');
  });
});
