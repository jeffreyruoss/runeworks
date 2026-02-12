import { Building } from '../types';
import { BUILDING_DEFINITIONS } from '../data/buildings';

/**
 * Mana power network system.
 *
 * Generators (mana_well, mana_obelisk) produce mana and have a connectivity radius.
 * Conduits (mana_tower) extend the network without producing mana.
 * Powered buildings (powerCost > 0) need to be within the mana network to run at full speed.
 *
 * Connectivity is computed via BFS from generators through conduits using Chebyshev distance.
 * Speed multiplier = min(1, totalMana / totalConsumption) for powered buildings in range.
 * Disconnected powered buildings run at 5% speed (trickle).
 */
export class ManaSystem {
  private totalProduction = 0;
  private totalConsumption = 0;
  private connectedSet: Set<number> = new Set(); // building IDs in network

  getTotalProduction(): number {
    return this.totalProduction;
  }

  getTotalConsumption(): number {
    return this.totalConsumption;
  }

  /**
   * Recompute mana network connectivity and speed multipliers for all buildings.
   * Called once per tick before production phase.
   */
  update(buildings: Building[]): void {
    this.computeConnectivity(buildings);
    this.computeManaBalance(buildings);
    this.applySpeedMultipliers(buildings);
  }

  private computeConnectivity(buildings: Building[]): void {
    this.connectedSet.clear();

    // Find all generators and conduits
    const generators: Building[] = [];
    const conduits: Building[] = [];

    for (const b of buildings) {
      const def = BUILDING_DEFINITIONS[b.type];
      if (def.manaProduction > 0) {
        generators.push(b);
      } else if (def.manaRadius > 0) {
        conduits.push(b);
      }
    }

    // BFS from generators through conduits
    // Start with all generators as seeds
    const visited = new Set<number>();
    const queue: Building[] = [];

    for (const gen of generators) {
      visited.add(gen.id);
      this.connectedSet.add(gen.id);
      queue.push(gen);
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentDef = BUILDING_DEFINITIONS[current.type];

      // Mark all buildings within range as connected
      for (const b of buildings) {
        if (this.connectedSet.has(b.id)) continue;

        if (this.isInRange(current, currentDef.manaRadius, b)) {
          this.connectedSet.add(b.id);

          // If this is a conduit, add to BFS queue to extend range
          const bDef = BUILDING_DEFINITIONS[b.type];
          if (bDef.manaRadius > 0 && !visited.has(b.id)) {
            visited.add(b.id);
            queue.push(b);
          }
        }
      }
    }

    // Update connected flag on buildings
    for (const b of buildings) {
      b.connected = this.connectedSet.has(b.id);
    }
  }

  /** Check if target building is within Chebyshev distance of source */
  private isInRange(source: Building, radius: number, target: Building): boolean {
    const sourceDef = BUILDING_DEFINITIONS[source.type];
    const targetDef = BUILDING_DEFINITIONS[target.type];

    // Approximate range using center-to-center Chebyshev distance
    const srcCx = source.x + sourceDef.width / 2;
    const srcCy = source.y + sourceDef.height / 2;
    const tgtCx = target.x + targetDef.width / 2;
    const tgtCy = target.y + targetDef.height / 2;

    const dx = Math.abs(srcCx - tgtCx);
    const dy = Math.abs(srcCy - tgtCy);
    const chebyshev = Math.max(dx, dy);

    return chebyshev <= radius;
  }

  private computeManaBalance(buildings: Building[]): void {
    this.totalProduction = 0;
    this.totalConsumption = 0;

    for (const b of buildings) {
      const def = BUILDING_DEFINITIONS[b.type];
      if (def.manaProduction > 0 && this.connectedSet.has(b.id)) {
        this.totalProduction += def.manaProduction;
      }
      if (def.powerCost > 0 && this.connectedSet.has(b.id)) {
        this.totalConsumption += def.powerCost;
      }
    }
  }

  private applySpeedMultipliers(buildings: Building[]): void {
    const multiplier =
      this.totalConsumption > 0 ? Math.min(1, this.totalProduction / this.totalConsumption) : 1;

    for (const b of buildings) {
      const def = BUILDING_DEFINITIONS[b.type];
      if (def.powerCost === 0) continue;

      if (!b.connected) {
        // Disconnected: trickle at 5%
        b.manaAccumulator = Math.min(b.manaAccumulator + 5, 200);
      } else {
        // Connected: scale by mana ratio (0-100%)
        b.manaAccumulator = Math.min(b.manaAccumulator + Math.round(multiplier * 100), 200);
      }
    }
  }
}
