import { STAGES, getStage, ITEM_DISPLAY_NAMES, PRODUCTION_CHAINS } from '../../src/data/stages';
import { BUILDING_DEFINITIONS } from '../../src/data/buildings';

describe('STAGES data', () => {
  it('contains 10 stages', () => {
    expect(STAGES).toHaveLength(10);
  });

  it('stage ids are sequential starting from 1', () => {
    STAGES.forEach((stage, i) => {
      expect(stage.id).toBe(i + 1);
    });
  });

  it('every stage has a non-empty name', () => {
    for (const stage of STAGES) {
      expect(stage.name.length).toBeGreaterThan(0);
    }
  });

  it('every stage has at least one objective', () => {
    for (const stage of STAGES) {
      expect(stage.objectives.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('all objective counts are positive integers', () => {
    for (const stage of STAGES) {
      for (const obj of stage.objectives) {
        expect(obj.count).toBeGreaterThan(0);
        expect(Number.isInteger(obj.count)).toBe(true);
      }
    }
  });

  it('objectives reference valid item types', () => {
    const validItems = Object.keys(ITEM_DISPLAY_NAMES);
    for (const stage of STAGES) {
      for (const obj of stage.objectives) {
        expect(validItems).toContain(obj.item);
      }
    }
  });

  it('stages with unlockedBuildings have valid building types', () => {
    const validBuildings = Object.keys(BUILDING_DEFINITIONS);
    for (const stage of STAGES) {
      if (stage.unlockedBuildings) {
        for (const b of stage.unlockedBuildings) {
          expect(validBuildings).toContain(b);
        }
      }
    }
  });

  it('stage 5 unlocks mana_well', () => {
    expect(STAGES[4].unlockedBuildings).toContain('mana_well');
  });

  it('stage 6 unlocks mana_tower', () => {
    expect(STAGES[5].unlockedBuildings).toContain('mana_tower');
  });

  it('stage 8 unlocks mana_obelisk', () => {
    expect(STAGES[7].unlockedBuildings).toContain('mana_obelisk');
  });
});

describe('getStage()', () => {
  it('returns the correct stage for valid ids', () => {
    for (const stage of STAGES) {
      const found = getStage(stage.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(stage.id);
      expect(found!.name).toBe(stage.name);
    }
  });

  it('returns undefined for id 0', () => {
    expect(getStage(0)).toBeUndefined();
  });

  it('returns undefined for negative id', () => {
    expect(getStage(-1)).toBeUndefined();
  });

  it('returns undefined for id beyond stage count', () => {
    expect(getStage(STAGES.length + 1)).toBeUndefined();
  });

  it('stage 1 is First Ingots with arcane_ingot objective', () => {
    const s = getStage(1)!;
    expect(s.name).toBe('First Ingots');
    expect(s.objectives).toEqual([{ item: 'arcane_ingot', count: 3 }]);
  });

  it('stage 10 has three objectives', () => {
    const s = getStage(10)!;
    expect(s.objectives).toHaveLength(3);
  });
});

describe('ITEM_DISPLAY_NAMES', () => {
  it('has entries for all known items', () => {
    const expectedItems = [
      'arcstone',
      'sunite',
      'arcane_ingot',
      'sun_ingot',
      'cogwheel',
      'thread',
      'rune',
      'stone',
      'wood',
      'iron',
      'clay',
      'crystal_shard',
    ];
    for (const item of expectedItems) {
      expect(ITEM_DISPLAY_NAMES[item]).toBeDefined();
      expect(ITEM_DISPLAY_NAMES[item].length).toBeGreaterThan(0);
    }
  });
});

describe('PRODUCTION_CHAINS', () => {
  it('has entries for key produced items', () => {
    expect(PRODUCTION_CHAINS['arcane_ingot']).toBeDefined();
    expect(PRODUCTION_CHAINS['sun_ingot']).toBeDefined();
    expect(PRODUCTION_CHAINS['cogwheel']).toBeDefined();
    expect(PRODUCTION_CHAINS['thread']).toBeDefined();
    expect(PRODUCTION_CHAINS['rune']).toBeDefined();
  });

  it('all chain descriptions are non-empty strings', () => {
    for (const [, desc] of Object.entries(PRODUCTION_CHAINS)) {
      expect(typeof desc).toBe('string');
      expect(desc.length).toBeGreaterThan(0);
    }
  });
});
