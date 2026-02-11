/**
 * localStorage persistence for research points and tech tree unlocks.
 * Auto-saves on mutation, loads on game start.
 */

const STORAGE_KEY = 'runeworks_research';
const CURRENT_VERSION = 1;

export interface ResearchSaveData {
  version: number;
  researchPoints: number;
  unlockedNodes: string[];
}

function defaultSaveData(): ResearchSaveData {
  return {
    version: CURRENT_VERSION,
    researchPoints: 0,
    unlockedNodes: [],
  };
}

export function loadResearchData(): ResearchSaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSaveData();

    const data = JSON.parse(raw) as ResearchSaveData;
    if (!data.version || data.version !== CURRENT_VERSION) {
      return defaultSaveData();
    }
    if (!Array.isArray(data.unlockedNodes)) {
      return defaultSaveData();
    }
    return {
      version: CURRENT_VERSION,
      researchPoints: data.researchPoints || 0,
      unlockedNodes: data.unlockedNodes,
    };
  } catch {
    return defaultSaveData();
  }
}

export function saveResearchData(data: ResearchSaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Silently fail if localStorage is full or unavailable
  }
}
