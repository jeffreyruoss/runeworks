import { UPGRADES, UpgradeState } from '../../src/data/upgrades';
import type { UpgradeId } from '../../src/data/upgrades';

describe('UPGRADES data', () => {
  it('contains 9 upgrades', () => {
    expect(UPGRADES).toHaveLength(9);
  });

  it('all ids are unique', () => {
    const ids = UPGRADES.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every upgrade has a non-empty name and description', () => {
    for (const u of UPGRADES) {
      expect(u.name.length).toBeGreaterThan(0);
      expect(u.description.length).toBeGreaterThan(0);
    }
  });

  it('every upgrade has maxLevel >= 1 and cost >= 1', () => {
    for (const u of UPGRADES) {
      expect(u.maxLevel).toBeGreaterThanOrEqual(1);
      expect(u.cost).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('UpgradeState', () => {
  let state: UpgradeState;

  beforeEach(() => {
    state = new UpgradeState();
  });

  describe('getLevel / upgrade / canUpgrade', () => {
    it('starts at level 0 for all upgrades', () => {
      for (const u of UPGRADES) {
        expect(state.getLevel(u.id)).toBe(0);
      }
    });

    it('canUpgrade returns true when below maxLevel', () => {
      expect(state.canUpgrade('rapid_craft')).toBe(true);
    });

    it('upgrade increments the level and returns true', () => {
      expect(state.upgrade('rapid_craft')).toBe(true);
      expect(state.getLevel('rapid_craft')).toBe(1);
    });

    it('canUpgrade returns false at maxLevel', () => {
      const def = UPGRADES.find((u) => u.id === 'deep_buffers')!;
      for (let i = 0; i < def.maxLevel; i++) state.upgrade('deep_buffers');
      expect(state.canUpgrade('deep_buffers')).toBe(false);
    });

    it('upgrade returns false when already at maxLevel', () => {
      const def = UPGRADES.find((u) => u.id === 'bulk_gather')!;
      for (let i = 0; i < def.maxLevel; i++) state.upgrade('bulk_gather');
      expect(state.upgrade('bulk_gather')).toBe(false);
    });

    it('canUpgrade returns false for unknown id', () => {
      expect(state.canUpgrade('nonexistent' as UpgradeId)).toBe(false);
    });
  });

  describe('bonus getters at level 0', () => {
    it('getCraftTimeMultiplier returns 1', () => {
      expect(state.getCraftTimeMultiplier()).toBe(1);
    });

    it('getBufferBonus returns 0', () => {
      expect(state.getBufferBonus()).toBe(0);
    });

    it('getStoneCostReduction returns 0', () => {
      expect(state.getStoneCostReduction()).toBe(0);
    });

    it('getManaProductionBonus returns 0', () => {
      expect(state.getManaProductionBonus()).toBe(0);
    });

    it('getGoldInterestBonus returns 0', () => {
      expect(state.getGoldInterestBonus()).toBe(0);
    });

    it('getBulkGatherBonus returns 0', () => {
      expect(state.getBulkGatherBonus()).toBe(0);
    });

    it('getQuarryYieldBonus returns 0', () => {
      expect(state.getQuarryYieldBonus()).toBe(0);
    });

    it('getResearchSpeedMultiplier returns 1', () => {
      expect(state.getResearchSpeedMultiplier()).toBe(1);
    });

    it('getTradeCostMultiplier returns 1', () => {
      expect(state.getTradeCostMultiplier()).toBe(1);
    });
  });

  describe('bonus getters at upgraded levels', () => {
    it('rapid_craft level 1: 0.85x craft time', () => {
      state.upgrade('rapid_craft');
      expect(state.getCraftTimeMultiplier()).toBeCloseTo(0.85);
    });

    it('rapid_craft level 3: compounding craft speed', () => {
      for (let i = 0; i < 3; i++) state.upgrade('rapid_craft');
      expect(state.getCraftTimeMultiplier()).toBeCloseTo(Math.pow(0.85, 3));
    });

    it('deep_buffers level 2: +6 buffer', () => {
      state.upgrade('deep_buffers');
      state.upgrade('deep_buffers');
      expect(state.getBufferBonus()).toBe(6);
    });

    it('efficient_builds level 1: -1 stone cost', () => {
      state.upgrade('efficient_builds');
      expect(state.getStoneCostReduction()).toBe(1);
    });

    it('mana_affinity level 2: +2 mana per well', () => {
      state.upgrade('mana_affinity');
      state.upgrade('mana_affinity');
      expect(state.getManaProductionBonus()).toBe(2);
    });

    it('gold_interest level 3: +15% interest', () => {
      for (let i = 0; i < 3; i++) state.upgrade('gold_interest');
      expect(state.getGoldInterestBonus()).toBe(15);
    });

    it('bulk_gather level 1: +1 per gather', () => {
      state.upgrade('bulk_gather');
      expect(state.getBulkGatherBonus()).toBe(1);
    });

    it('quarry_yield level 2: +2 ore per cycle', () => {
      state.upgrade('quarry_yield');
      state.upgrade('quarry_yield');
      expect(state.getQuarryYieldBonus()).toBe(2);
    });

    it('runic_insight level 1: 0.8x research time', () => {
      state.upgrade('runic_insight');
      expect(state.getResearchSpeedMultiplier()).toBeCloseTo(0.8);
    });

    it('traders_cut level 2: 0.85^2 trade cost', () => {
      state.upgrade('traders_cut');
      state.upgrade('traders_cut');
      expect(state.getTradeCostMultiplier()).toBeCloseTo(Math.pow(0.85, 2));
    });
  });

  describe('reset', () => {
    it('clears all upgrade levels back to 0', () => {
      state.upgrade('rapid_craft');
      state.upgrade('deep_buffers');
      state.upgrade('efficient_builds');
      state.reset();
      expect(state.getLevel('rapid_craft')).toBe(0);
      expect(state.getLevel('deep_buffers')).toBe(0);
      expect(state.getLevel('efficient_builds')).toBe(0);
    });

    it('allows re-upgrading after reset', () => {
      const def = UPGRADES.find((u) => u.id === 'bulk_gather')!;
      for (let i = 0; i < def.maxLevel; i++) state.upgrade('bulk_gather');
      expect(state.canUpgrade('bulk_gather')).toBe(false);

      state.reset();
      expect(state.canUpgrade('bulk_gather')).toBe(true);
      expect(state.upgrade('bulk_gather')).toBe(true);
    });
  });
});
