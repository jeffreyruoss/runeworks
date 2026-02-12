import { Building, ItemType, Position, ResourcePatch, TerrainType, SimulationState } from './types';
import { BUILDING_DEFINITIONS } from './data/buildings';
import { getRecipe } from './data/recipes';
import { GRID_WIDTH, GRID_HEIGHT, MS_PER_TICK, QUARRY_TICKS_PER_ORE } from './config';
import {
  getBufferTotal,
  addToBuffer,
  consumeIngredients,
  hasIngredients,
  removeFromBuffer,
} from './utils';
import { getResearchRecipe } from './data/research';
import { TransferSystem } from './simulation/transfers';
import { ManaSystem } from './simulation/ManaSystem';
import { ResourcePatchManager } from './terrain/ResourcePatchManager';
import { QUARRIABLE_TERRAIN } from './data/terrain';

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
  private manaSystem = new ManaSystem();
  private patchManager = new ResourcePatchManager();

  // Callbacks
  public onItemProduced?: (item: ItemType, count: number) => void;
  public onStateChanged?: (state: SimulationState) => void;
  public onResearchPointsProduced?: (rp: number) => void;

  // Research upgrade hooks (set by GameScene)
  public getUpgrades?: () => { bufferBonus: number; craftTimeMultiplier: number };

  constructor() {
    this.state = {
      running: false,
      paused: false,
      tickCount: 0,
      speed: 1,
      itemsProduced: new Map(),
      manaProduction: 0,
      manaConsumption: 0,
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

  addResourcePatch(terrainType: TerrainType, tiles: Position[], pool: number): void {
    for (const tile of tiles) {
      this.setTerrain(tile.x, tile.y, terrainType);
    }
    this.patchManager.addPatch(terrainType, tiles, pool);
  }

  getPatchAt(x: number, y: number): ResourcePatch | null {
    return this.patchManager.getPatchAt(x, y);
  }

  extractFromPatch(
    x: number,
    y: number
  ): { item: ItemType; depleted: boolean; tilesToClear: Position[] } | null {
    const result = this.patchManager.extractFromPatch(x, y);
    if (result?.depleted) {
      for (const tile of result.tilesToClear) {
        this.setTerrain(tile.x, tile.y, 'empty');
      }
    }
    return result;
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
      building.manaAccumulator = 0;
      building.connected = false;
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

  setPaused(paused: boolean): void {
    if (!this.state.running) return;
    this.state.paused = paused;
    this.onStateChanged?.(this.state);
  }

  setSpeed(speed: number): void {
    this.state.speed = Math.max(1, Math.min(4, speed));
    this.onStateChanged?.(this.state);
  }

  getState(): SimulationState {
    return { ...this.state };
  }

  resetItemsProduced(): void {
    this.state.itemsProduced = new Map();
    this.onStateChanged?.(this.state);
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

    // Phase 0: Mana network
    this.manaSystem.update(this.buildings);
    this.state.manaProduction = this.manaSystem.getTotalProduction();
    this.state.manaConsumption = this.manaSystem.getTotalConsumption();

    // Phase 1: Production
    for (const building of this.buildings) {
      this.updateBuilding(building);
    }

    // Phase 2: Transfer
    this.transferSystem.transferAll(this.buildings);

    this.onStateChanged?.(this.state);
  }

  private updateBuilding(building: Building): void {
    const def = BUILDING_DEFINITIONS[building.type];

    // Mana accumulator gate for powered buildings
    if (def.powerCost > 0) {
      if (building.manaAccumulator < 100) return;
      building.manaAccumulator -= 100;
    }

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
      case 'mana_well':
      case 'mana_obelisk':
      case 'mana_tower':
        break;
      case 'arcane_study':
        this.updateArcaneStudy(building);
        break;
    }
  }

  private getBufferBonus(): number {
    return this.getUpgrades?.().bufferBonus ?? 0;
  }

  private getCraftTimeMultiplier(): number {
    return this.getUpgrades?.().craftTimeMultiplier ?? 1;
  }

  private updateQuarry(building: Building): void {
    const def = BUILDING_DEFINITIONS.quarry;

    const outputCount = getBufferTotal(building.outputBuffer);
    if (outputCount >= def.outputBufferSize + this.getBufferBonus()) {
      building.ticksBlocked++;
      return;
    }

    const resource = this.getResourceUnderBuilding(building);
    if (!resource) {
      building.ticksStarved++;
      return;
    }

    building.craftProgress++;
    if (building.craftProgress >= QUARRY_TICKS_PER_ORE) {
      building.craftProgress = 0;
      const result = this.patchManager.extractFromPatch(resource.x, resource.y);
      if (result) {
        addToBuffer(building.outputBuffer, result.item, 1);
        if (result.depleted) {
          for (const tile of result.tilesToClear) {
            this.setTerrain(tile.x, tile.y, 'empty');
          }
        }
      }
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
    if (outputCount >= def.outputBufferSize + this.getBufferBonus()) {
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
    if (
      building.craftProgress >= Math.ceil(recipe.craftTimeTicks * this.getCraftTimeMultiplier())
    ) {
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
    if (outputCount >= def.outputBufferSize + this.getBufferBonus()) {
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
    if (
      building.craftProgress >= Math.ceil(recipe.craftTimeTicks * this.getCraftTimeMultiplier())
    ) {
      building.craftProgress = 0;
      for (const [item, count] of recipe.outputs) {
        addToBuffer(building.outputBuffer, item, count);
        this.recordProduction(item, count);
      }
    }
  }

  private updateArcaneStudy(building: Building): void {
    if (!building.selectedRecipe) return;

    const recipe = getResearchRecipe(building.selectedRecipe);
    if (!recipe) return;

    if (building.craftProgress === 0) {
      const available = building.inputBuffer.get(recipe.input) || 0;
      if (available < recipe.inputCount) {
        building.ticksStarved++;
        return;
      }
      removeFromBuffer(building.inputBuffer, recipe.input, recipe.inputCount);
    }

    building.craftProgress++;
    if (
      building.craftProgress >= Math.ceil(recipe.craftTimeTicks * this.getCraftTimeMultiplier())
    ) {
      building.craftProgress = 0;
      this.onResearchPointsProduced?.(recipe.rpYield);
    }
  }

  private getResourceUnderBuilding(
    building: Building
  ): { x: number; y: number; terrain: TerrainType } | null {
    const def = BUILDING_DEFINITIONS[building.type];
    for (let dy = 0; dy < def.height; dy++) {
      for (let dx = 0; dx < def.width; dx++) {
        const tx = building.x + dx;
        const ty = building.y + dy;
        const terrain = this.getTerrain(tx, ty);
        if (QUARRIABLE_TERRAIN.has(terrain)) {
          return { x: tx, y: ty, terrain };
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
