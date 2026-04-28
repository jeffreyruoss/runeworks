import { FlowSystem } from '../../src/simulation/FlowSystem';

describe('FlowSystem', () => {
  let flow: FlowSystem;

  beforeEach(() => {
    flow = new FlowSystem();
  });

  /** Place buildings rapidly to earn flow points. Returns timestamp after last placement. */
  function earnPoints(count: number, startMs = 1000): number {
    let t = startMs;
    flow.onBuildingPlaced(t); // starter bonus: 10
    // Each fast placement (500ms gap) adds 25. Need 4 per point (10+25*4=110→capped→point).
    for (let p = 0; p < count; p++) {
      const placements = p === 0 ? 4 : 3; // first cycle: 10+4*25=110, subsequent: 30+3*25=105
      for (let i = 0; i < placements; i++) {
        t += 500;
        flow.onBuildingPlaced(t);
      }
    }
    return t;
  }

  describe('initial state', () => {
    it('starts with zero flow level', () => {
      expect(flow.getFlowLevel()).toBe(0);
    });

    it('starts with zero flow points', () => {
      expect(flow.getFlowPoints()).toBe(0);
    });
  });

  describe('onBuildingPlaced', () => {
    it('first placement gives a small starter bonus of 10', () => {
      flow.onBuildingPlaced(1000);
      expect(flow.getFlowLevel()).toBe(10);
    });

    it('fast follow-up placement gives full flow (within 1500ms)', () => {
      flow.onBuildingPlaced(1000);
      flow.onBuildingPlaced(2000); // 1000ms gap → full 25 gain
      expect(flow.getFlowLevel()).toBe(35);
    });

    it('slow placement (>= 6000ms) gives no flow', () => {
      flow.onBuildingPlaced(1000);
      flow.onBuildingPlaced(8000); // 7000ms gap → no gain
      expect(flow.getFlowLevel()).toBe(10);
    });

    it('medium-speed placement gives proportional flow', () => {
      flow.onBuildingPlaced(1000);
      flow.onBuildingPlaced(4750); // 3750ms gap = midpoint → 50% of 25 = 12.5
      expect(flow.getFlowLevel()).toBeCloseTo(22.5);
    });

    it('flow level never exceeds 100 even with rapid placements', () => {
      flow.onBuildingPlaced(1000);
      for (let i = 1; i <= 10; i++) {
        flow.onBuildingPlaced(1000 + i * 500);
        expect(flow.getFlowLevel()).toBeLessThanOrEqual(100);
      }
      // Should have earned points from overflow, confirming cap triggered
      expect(flow.getFlowPoints()).toBeGreaterThan(0);
    });

    it('awards a flow point when meter reaches 100 and resets to 30', () => {
      earnPoints(1);
      expect(flow.getFlowPoints()).toBe(1);
      expect(flow.getFlowLevel()).toBe(30);
    });
  });

  describe('tick (decay)', () => {
    it('decays flow level by 0.15 per tick', () => {
      flow.onBuildingPlaced(1000);
      flow.tick();
      expect(flow.getFlowLevel()).toBeCloseTo(9.85);
    });

    it('flow level never goes below 0', () => {
      flow.onBuildingPlaced(1000);
      for (let i = 0; i < 100; i++) flow.tick();
      expect(flow.getFlowLevel()).toBe(0);
    });

    it('does not decay when already at 0', () => {
      flow.tick();
      expect(flow.getFlowLevel()).toBe(0);
    });
  });

  describe('spendPoints', () => {
    it('returns false when not enough points', () => {
      expect(flow.spendPoints(1)).toBe(false);
      expect(flow.getFlowPoints()).toBe(0);
    });

    it('deducts points and returns true when sufficient', () => {
      earnPoints(1);
      expect(flow.spendPoints(1)).toBe(true);
      expect(flow.getFlowPoints()).toBe(0);
    });

    it('can spend partial points', () => {
      earnPoints(2);
      expect(flow.getFlowPoints()).toBe(2);
      expect(flow.spendPoints(1)).toBe(true);
      expect(flow.getFlowPoints()).toBe(1);
    });
  });

  describe('reset', () => {
    it('clears flow level, points, and placement tracking', () => {
      earnPoints(1);

      flow.reset();
      expect(flow.getFlowLevel()).toBe(0);
      expect(flow.getFlowPoints()).toBe(0);

      // After reset, next placement is treated as first (starter bonus)
      flow.onBuildingPlaced(10000);
      expect(flow.getFlowLevel()).toBe(10);
    });
  });
});
