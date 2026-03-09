import { GameMode, PlayerResources } from '../types';

export interface DevSettings {
  enabled: boolean;
  autoStartMode: GameMode | null;
  startStage: number | null;
  tutorialStep: number | null;
  resources: Partial<PlayerResources> | null;
  researchUnlocks: string[] | null;
  researchPoints: number | null;
}

const STORAGE_KEY = 'runeworks_dev_settings';

const DEFAULT_SETTINGS: DevSettings = {
  enabled: false,
  autoStartMode: null,
  startStage: null,
  tutorialStep: null,
  resources: null,
  researchUnlocks: null,
  researchPoints: null,
};

// Cached after first read — settings only change on reload
let cached: DevSettings | undefined;

export function loadDevSettings(): DevSettings {
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cached = raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    cached = { ...DEFAULT_SETTINGS };
  }
  return cached!;
}

export function saveDevSettings(settings: DevSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  cached = undefined;
}

export function clearDevSettings(): void {
  localStorage.removeItem(STORAGE_KEY);
  cached = undefined;
}

/** Returns settings if enabled, null otherwise. Game code calls this. */
export function getActiveDevSettings(): DevSettings | null {
  const settings = loadDevSettings();
  return settings.enabled ? settings : null;
}

/** True when enabled AND at least one override is non-null */
export function isDevActive(): boolean {
  const settings = loadDevSettings();
  if (!settings.enabled) return false;
  return (
    settings.autoStartMode !== null ||
    settings.startStage !== null ||
    settings.tutorialStep !== null ||
    settings.resources !== null ||
    settings.researchUnlocks !== null ||
    settings.researchPoints !== null
  );
}
