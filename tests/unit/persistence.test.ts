import { loadResearchData, saveResearchData, clearResearchData } from '../../src/data/persistence';

// Mock localStorage
const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => storage.set(k, v),
    removeItem: (k: string) => storage.delete(k),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadResearchData', () => {
  it('returns default data when localStorage is empty', () => {
    const data = loadResearchData();
    expect(data.version).toBe(1);
    expect(data.researchPoints).toBe(0);
    expect(data.unlockedNodes).toEqual([]);
  });

  it('returns parsed data from valid JSON', () => {
    storage.set(
      'runeworks_research',
      JSON.stringify({
        version: 1,
        researchPoints: 42,
        unlockedNodes: ['splitter', 'merger'],
      })
    );
    const data = loadResearchData();
    expect(data.researchPoints).toBe(42);
    expect(data.unlockedNodes).toEqual(['splitter', 'merger']);
  });

  it('returns default data when version does not match', () => {
    storage.set(
      'runeworks_research',
      JSON.stringify({
        version: 999,
        researchPoints: 100,
        unlockedNodes: ['splitter'],
      })
    );
    const data = loadResearchData();
    expect(data.researchPoints).toBe(0);
    expect(data.unlockedNodes).toEqual([]);
  });

  it('returns default data when unlockedNodes is not an array', () => {
    storage.set(
      'runeworks_research',
      JSON.stringify({
        version: 1,
        researchPoints: 50,
        unlockedNodes: 'not-an-array',
      })
    );
    const data = loadResearchData();
    expect(data.researchPoints).toBe(0);
    expect(data.unlockedNodes).toEqual([]);
  });

  it('returns default data on malformed JSON', () => {
    storage.set('runeworks_research', '{not valid json}');
    const data = loadResearchData();
    expect(data.researchPoints).toBe(0);
    expect(data.unlockedNodes).toEqual([]);
  });
});

describe('saveResearchData', () => {
  it('writes JSON to localStorage under correct key', () => {
    saveResearchData({
      version: 1,
      researchPoints: 25,
      unlockedNodes: ['buffer_expansion'],
    });
    const raw = storage.get('runeworks_research');
    expect(raw).toBeDefined();
    const parsed = JSON.parse(raw!);
    expect(parsed.researchPoints).toBe(25);
    expect(parsed.unlockedNodes).toEqual(['buffer_expansion']);
  });
});

describe('clearResearchData', () => {
  it('removes the key from localStorage', () => {
    storage.set('runeworks_research', 'some data');
    clearResearchData();
    expect(storage.has('runeworks_research')).toBe(false);
  });
});
