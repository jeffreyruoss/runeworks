/** Flow meter constants */
const MAX_FLOW = 100;
const FLOW_DECAY_PER_TICK = 0.15; // loses ~3 per second
const FLOW_PER_PLACEMENT_BASE = 25; // max flow gained from a fast placement
const FAST_PLACEMENT_MS = 1500; // place within this window for full flow
const SLOW_PLACEMENT_MS = 6000; // slower than this gives zero flow

/**
 * Tracks building placement speed and awards Flow Points.
 * Flow meter (0–100) fills when the player places buildings quickly
 * and decays over time. When it fills completely, a Flow Point is awarded.
 */
export class FlowSystem {
  private flowLevel = 0;
  private flowPoints = 0;
  private lastPlacementTime = 0;

  /** Call when a building is successfully placed. Uses wall-clock ms. */
  onBuildingPlaced(nowMs: number): void {
    if (this.lastPlacementTime === 0) {
      // First placement of the stage — small starter bonus
      this.flowLevel = Math.min(MAX_FLOW, this.flowLevel + 10);
      this.lastPlacementTime = nowMs;
      return;
    }

    const elapsed = nowMs - this.lastPlacementTime;
    this.lastPlacementTime = nowMs;

    if (elapsed >= SLOW_PLACEMENT_MS) {
      // Too slow — no flow
      return;
    }

    // Linear interpolation: faster placement = more flow
    const t = Math.max(
      0,
      1 - (elapsed - FAST_PLACEMENT_MS) / (SLOW_PLACEMENT_MS - FAST_PLACEMENT_MS)
    );
    const gain = FLOW_PER_PLACEMENT_BASE * Math.min(1, t);
    this.flowLevel = Math.min(MAX_FLOW, this.flowLevel + gain);

    // Award a point when meter fills
    if (this.flowLevel >= MAX_FLOW) {
      this.flowPoints++;
      this.flowLevel = 30;
    }
  }

  /** Call once per simulation tick to apply decay. */
  tick(): void {
    if (this.flowLevel > 0) {
      this.flowLevel = Math.max(0, this.flowLevel - FLOW_DECAY_PER_TICK);
    }
  }

  getFlowLevel(): number {
    return this.flowLevel;
  }

  getFlowPoints(): number {
    return this.flowPoints;
  }

  spendPoint(): boolean {
    if (this.flowPoints <= 0) return false;
    this.flowPoints--;
    return true;
  }

  reset(): void {
    this.flowLevel = 0;
    this.flowPoints = 0;
    this.lastPlacementTime = 0;
  }
}
