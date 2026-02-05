import { Building, ItemType, TerrainType, SimulationState } from './types';
import { BUILDING_DEFINITIONS } from './data/buildings';
import { getRecipe } from './data/recipes';
import { GRID_WIDTH, GRID_HEIGHT, MS_PER_TICK, QUARRY_TICKS_PER_ORE } from './config';
import { getBufferTotal, addToBuffer, consumeIngredients, hasIngredients } from './utils';
import { TransferSystem } from './simulation/transfers';

/**
 * Core simulation engine for Runeworks
 *
 * Handles tick-based updates for all buildings:
 * - Quarries extract ore from crystal veins
 * - Forges purify ore into ingots
 * - Workbenches craft items according to recipes
 * - Chests store and distribute items
 * - Adjacent transfer moves items between buildings (via TransferSystem)
 */
export class Simulation {
  private buildings: Building[] = [];
  private terrain: TerrainType[][] = [];
  private state: SimulationState;
  private accumulator = 0;
  private transferSystem = new TransferSystem();

  // Callbacks
  public onItemProduced?: (item: ItemType, count: number) => void;
  public onStateChanged?: (state: SimulationState) => void;

  constructor() {
    this.state = {
      running: false,
      paused: false,
      tickCount: 0,
      speed: 1,
      itemsProduced: new Map(),
    };

    this.initTerrain();
  }

  private initTerrain(): void {
    this.terrain = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      this.terrain[y] = [];
      for (let x = 0; x < GRID_WIDTH; x++) {
        this.terrain[y][x] = 'empty';
      }
    }
  }

  setTerrain(x: number, y: number, type: TerrainType): void {
    if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
      this.terrain[y][x] = type;
    }
  }

  getTerrain(x: number, y: number): TerrainType {
    if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
      return this.terrain[y][x];
    }
    return 'empty';
  }

  placeCrystalVein(
    x: number,
    y: number,
    width: number,
    height: number,
    type: 'arcstone' | 'sunite'
  ): void {
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        this.setTerrain(x + dx, y + dy, type);
      }
    }
  }

  setBuildings(buildings: Building[]): void {
    this.buildings = buildings;
  }

  start(): void {
    if (this.state.running) return;

    this.state.running = true;
    this.state.paused = false;
    this.state.tickCount = 0;
    this.state.itemsProduced = new Map();
    this.accumulator = 0;
    this.transferSystem.reset();

    for (const building of this.buildings) {
      building.inputBuffer = new Map();
      building.outputBuffer = new Map();
      building.craftProgress = 0;
      building.ticksStarved = 0;
      building.ticksBlocked = 0;
    }

    this.onStateChanged?.(this.state);
  }

  stop(): void {
    this.state.running = false;
    this.state.paused = false;
    this.onStateChanged?.(this.state);
  }

  togglePause(): void {
    if (!this.state.running) return;
    this.state.paused = !this.state.paused;
    this.onStateChanged?.(this.state);
  }

  setSpeed(speed: number): void {
    this.state.speed = Math.max(1, Math.min(4, speed));
    this.onStateChanged?.(this.state);
  }

  getState(): SimulationState {
    return { ...this.state };
  }

  update(deltaMs: number): void {
    if (!this.state.running || this.state.paused) return;

    this.accumulator += deltaMs * this.state.speed;

    while (this.accumulator >= MS_PER_TICK) {
      this.tick();
      this.accumulator -= MS_PER_TICK;
    }
  }

  private tick(): void {
    this.state.tickCount++;

    // Phase 1: Production
    for (const building of this.buildings) {
      this.updateBuilding(building);
    }

    // Phase 2: Transfer
    this.transferSystem.transferAll(this.buildings);

    this.onStateChanged?.(this.state);
  }

  private updateBuilding(building: Building): void {
    switch (building.type) {
      case 'quarry':
        this.updateQuarry(building);
        break;
      case 'forge':
        this.updateForge(building);
        break;
      case 'workbench':
        this.updateWorkbench(building);
        break;
      case 'chest':
        break;
    }
  }

  private updateQuarry(building: Building): void {
    const def = BUILDING_DEFINITIONS.quarry;

    const outputCount = getBufferTotal(building.outputBuffer);
    if (outputCount >= def.outputBufferSize) {
      building.ticksBlocked++;
      return;
    }

    const oreType = this.getOreUnderBuilding(building);
    if (!oreType) {
      building.ticksStarved++;
      return;
    }

    building.craftProgress++;
    if (building.craftProgress >= QUARRY_TICKS_PER_ORE) {
      building.craftProgress = 0;
      const itemType: ItemType = oreType === 'arcstone' ? 'arcstone' : 'sunite';
      addToBuffer(building.outputBuffer, itemType, 1);
    }
  }

  private updateForge(building: Building): void {
    const def = BUILDING_DEFINITIONS.forge;

    // Determine recipe based on input
    let recipe = null;
    if ((building.inputBuffer.get('arcstone') || 0) > 0) {
      recipe = getRecipe('purify_arcstone');
    } else if ((building.inputBuffer.get('sunite') || 0) > 0) {
      recipe = getRecipe('purify_sunite');
    }

    if (!recipe) {
      building.ticksStarved++;
      return;
    }

    const outputCount = getBufferTotal(building.outputBuffer);
    if (outputCount >= def.outputBufferSize) {
      building.ticksBlocked++;
      return;
    }

    if (building.craftProgress === 0) {
      if (!hasIngredients(building.inputBuffer, recipe.inputs)) {
        building.ticksStarved++;
        return;
      }
      consumeIngredients(building.inputBuffer, recipe.inputs);
    }

    building.craftProgress++;
    if (building.craftProgress >= recipe.craftTimeTicks) {
      building.craftProgress = 0;
      for (const [item, count] of recipe.outputs) {
        addToBuffer(building.outputBuffer, item, count);
        this.recordProduction(item, count);
      }
    }
  }

  private updateWorkbench(building: Building): void {
    const def = BUILDING_DEFINITIONS.workbench;

    if (!building.selectedRecipe) return;

    const recipe = getRecipe(building.selectedRecipe);
    if (!recipe) return;

    const outputCount = getBufferTotal(building.outputBuffer);
    if (outputCount >= def.outputBufferSize) {
      building.ticksBlocked++;
      return;
    }

    if (building.craftProgress === 0) {
      if (!hasIngredients(building.inputBuffer, recipe.inputs)) {
        building.ticksStarved++;
        return;
      }
      consumeIngredients(building.inputBuffer, recipe.inputs);
    }

    building.craftProgress++;
    if (building.craftProgress >= recipe.craftTimeTicks) {
      building.craftProgress = 0;
      for (const [item, count] of recipe.outputs) {
        addToBuffer(building.outputBuffer, item, count);
        this.recordProduction(item, count);
      }
    }
  }

  private getOreUnderBuilding(building: Building): TerrainType | null {
    const def = BUILDING_DEFINITIONS[building.type];
    for (let dy = 0; dy < def.height; dy++) {
      for (let dx = 0; dx < def.width; dx++) {
        const terrain = this.getTerrain(building.x + dx, building.y + dy);
        if (terrain === 'arcstone' || terrain === 'sunite') {
          return terrain;
        }
      }
    }
    return null;
  }

  private recordProduction(item: ItemType, count: number): void {
    const current = this.state.itemsProduced.get(item) || 0;
    this.state.itemsProduced.set(item, current + count);
    this.onItemProduced?.(item, count);
  }
}
