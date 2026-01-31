import { Building, ItemType, TerrainType, Direction, SimulationState } from './types';
import { BUILDING_DEFINITIONS } from './data/buildings';
import { getRecipe } from './data/recipes';
import { GRID_WIDTH, GRID_HEIGHT, MS_PER_TICK, QUARRY_TICKS_PER_ORE } from './config';
import { getBufferTotal, rotateDirection, oppositeDirection } from './utils';

/**
 * Core simulation engine for Runeworks
 *
 * Handles tick-based updates for all buildings:
 * - Quarries extract ore from crystal veins
 * - Forges purify ore into ingots
 * - Workbenches craft items according to recipes
 * - Coffers store and distribute items
 * - Adjacent transfer moves items between buildings
 */
export class Simulation {
  private buildings: Building[] = [];
  private terrain: TerrainType[][] = [];
  private state: SimulationState;
  private accumulator = 0;
  private roundRobinIndex: Map<number, number> = new Map(); // building id -> last output index

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

    // Initialize terrain grid
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

  /**
   * Set terrain type at a position (for placing crystal veins)
   */
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

  /**
   * Place crystal veins in a rectangular area
   */
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

  /**
   * Register buildings from GameScene
   */
  setBuildings(buildings: Building[]): void {
    this.buildings = buildings;
  }

  /**
   * Start the simulation
   */
  start(): void {
    if (this.state.running) return;

    this.state.running = true;
    this.state.paused = false;
    this.state.tickCount = 0;
    this.state.itemsProduced = new Map();
    this.accumulator = 0;
    this.roundRobinIndex.clear();

    // Reset building states
    for (const building of this.buildings) {
      building.inputBuffer = new Map();
      building.outputBuffer = new Map();
      building.craftProgress = 0;
      building.ticksStarved = 0;
      building.ticksBlocked = 0;
    }

    this.onStateChanged?.(this.state);
  }

  /**
   * Stop the simulation
   */
  stop(): void {
    this.state.running = false;
    this.state.paused = false;
    this.onStateChanged?.(this.state);
  }

  /**
   * Toggle pause
   */
  togglePause(): void {
    if (!this.state.running) return;
    this.state.paused = !this.state.paused;
    this.onStateChanged?.(this.state);
  }

  /**
   * Set simulation speed (1, 2, or 4)
   */
  setSpeed(speed: number): void {
    this.state.speed = Math.max(1, Math.min(4, speed));
    this.onStateChanged?.(this.state);
  }

  getState(): SimulationState {
    return { ...this.state };
  }

  /**
   * Update simulation - call from game loop with delta time
   */
  update(deltaMs: number): void {
    if (!this.state.running || this.state.paused) return;

    this.accumulator += deltaMs * this.state.speed;

    while (this.accumulator >= MS_PER_TICK) {
      this.tick();
      this.accumulator -= MS_PER_TICK;
    }
  }

  /**
   * Execute one simulation tick
   */
  private tick(): void {
    this.state.tickCount++;

    // Phase 1: Production (quarries extract ore, machines craft)
    for (const building of this.buildings) {
      this.updateBuilding(building);
    }

    // Phase 2: Transfer (push items to adjacent buildings)
    for (const building of this.buildings) {
      this.transferOutputs(building);
    }

    this.onStateChanged?.(this.state);
  }

  /**
   * Update a single building's production
   */
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
      case 'coffer':
        // Coffers just hold items, no production
        break;
    }
  }

  /**
   * Quarry: Extract ore from crystal veins
   */
  private updateQuarry(building: Building): void {
    const def = BUILDING_DEFINITIONS.quarry;

    // Check output buffer space
    const outputCount = getBufferTotal(building.outputBuffer);
    if (outputCount >= def.outputBufferSize) {
      building.ticksBlocked++;
      return;
    }

    // Check what ore is under the quarry
    const oreType = this.getOreUnderBuilding(building);
    if (!oreType) {
      building.ticksStarved++;
      return;
    }

    building.craftProgress++;
    if (building.craftProgress >= QUARRY_TICKS_PER_ORE) {
      building.craftProgress = 0;

      const itemType: ItemType = oreType === 'arcstone' ? 'arcstone' : 'sunite';
      this.addToBuffer(building.outputBuffer, itemType, 1);
    }
  }

  /**
   * Forge: Purify ore into ingots
   */
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

    // Check output buffer space
    const outputCount = getBufferTotal(building.outputBuffer);
    if (outputCount >= def.outputBufferSize) {
      building.ticksBlocked++;
      return;
    }

    // Check if we have ingredients (only check at start of craft)
    if (building.craftProgress === 0) {
      if (!this.hasIngredients(building.inputBuffer, recipe.inputs)) {
        building.ticksStarved++;
        return;
      }
      // Consume ingredients
      this.consumeIngredients(building.inputBuffer, recipe.inputs);
    }

    // Progress crafting
    building.craftProgress++;
    if (building.craftProgress >= recipe.craftTimeTicks) {
      building.craftProgress = 0;

      // Produce outputs
      for (const [item, count] of recipe.outputs) {
        this.addToBuffer(building.outputBuffer, item, count);
        this.recordProduction(item, count);
      }
    }
  }

  /**
   * Workbench: Craft items according to selected recipe
   */
  private updateWorkbench(building: Building): void {
    const def = BUILDING_DEFINITIONS.workbench;

    if (!building.selectedRecipe) {
      return; // No recipe selected
    }

    const recipe = getRecipe(building.selectedRecipe);
    if (!recipe) return;

    // Check output buffer space
    const outputCount = getBufferTotal(building.outputBuffer);
    if (outputCount >= def.outputBufferSize) {
      building.ticksBlocked++;
      return;
    }

    // Check/consume ingredients at start of craft
    if (building.craftProgress === 0) {
      if (!this.hasIngredients(building.inputBuffer, recipe.inputs)) {
        building.ticksStarved++;
        return;
      }
      this.consumeIngredients(building.inputBuffer, recipe.inputs);
    }

    // Progress crafting
    building.craftProgress++;
    if (building.craftProgress >= recipe.craftTimeTicks) {
      building.craftProgress = 0;

      for (const [item, count] of recipe.outputs) {
        this.addToBuffer(building.outputBuffer, item, count);
        this.recordProduction(item, count);
      }
    }
  }

  /**
   * Transfer items from a building's output to adjacent buildings' inputs
   */
  private transferOutputs(building: Building): void {
    const def = BUILDING_DEFINITIONS[building.type];
    if (def.outputSides.length === 0) return;

    // Get actual output direction based on rotation
    const outputDirs = def.outputSides.map((side) => rotateDirection(side, building.rotation));

    // Find all items in output buffer
    for (const [itemType, count] of building.outputBuffer) {
      if (count <= 0) continue;

      // Find adjacent buildings that accept this item
      const targets = this.findAdjacentInputs(building, outputDirs, itemType);
      if (targets.length === 0) continue;

      // Round-robin distribution
      let rrIndex = this.roundRobinIndex.get(building.id) || 0;
      let transferred = 0;
      let consecutiveFullTargets = 0;

      for (let i = 0; i < count; i++) {
        const target = targets[rrIndex % targets.length];
        const targetDef = BUILDING_DEFINITIONS[target.type];
        const targetInputCount = getBufferTotal(target.inputBuffer);

        if (targetInputCount < targetDef.inputBufferSize) {
          // Transfer one item
          this.removeFromBuffer(building.outputBuffer, itemType, 1);
          this.addToBuffer(target.inputBuffer, itemType, 1);
          rrIndex++;
          transferred++;
          consecutiveFullTargets = 0;
        } else {
          // Target is full, try next one
          rrIndex++;
          consecutiveFullTargets++;
          // If we've checked all targets and all are full, stop trying
          if (consecutiveFullTargets >= targets.length) {
            break;
          }
        }
      }

      this.roundRobinIndex.set(building.id, rrIndex);
    }
  }

  /**
   * Find adjacent buildings that can accept an item type
   */
  private findAdjacentInputs(
    source: Building,
    outputDirs: Direction[],
    itemType: ItemType
  ): Building[] {
    const targets: Building[] = [];

    for (const dir of outputDirs) {
      // Get tiles on the output side of the source building
      const outputTiles = this.getOutputTiles(source, dir);

      for (const tile of outputTiles) {
        // Check adjacent tile in output direction
        const adjX = tile.x + (dir === 'right' ? 1 : dir === 'left' ? -1 : 0);
        const adjY = tile.y + (dir === 'down' ? 1 : dir === 'up' ? -1 : 0);

        // Find building at adjacent position
        const target = this.getBuildingAt(adjX, adjY);
        if (!target || target.id === source.id) continue;

        // Check if target accepts input from this direction
        const targetDef = BUILDING_DEFINITIONS[target.type];
        const targetInputDirs = targetDef.inputSides.map((s) =>
          rotateDirection(s, target.rotation)
        );

        // The input direction is opposite of our output direction
        const neededInputDir = oppositeDirection(dir);
        if (!targetInputDirs.includes(neededInputDir)) continue;

        // Check if target accepts this item type
        if (this.canAcceptItem(target, itemType)) {
          if (!targets.find((t) => t.id === target.id)) {
            targets.push(target);
          }
        }
      }
    }

    return targets;
  }

  /**
   * Get the tiles on a specific side of a building
   */
  private getOutputTiles(building: Building, dir: Direction): { x: number; y: number }[] {
    const def = BUILDING_DEFINITIONS[building.type];
    const tiles: { x: number; y: number }[] = [];

    switch (dir) {
      case 'right':
        for (let dy = 0; dy < def.height; dy++) {
          tiles.push({ x: building.x + def.width - 1, y: building.y + dy });
        }
        break;
      case 'left':
        for (let dy = 0; dy < def.height; dy++) {
          tiles.push({ x: building.x, y: building.y + dy });
        }
        break;
      case 'down':
        for (let dx = 0; dx < def.width; dx++) {
          tiles.push({ x: building.x + dx, y: building.y + def.height - 1 });
        }
        break;
      case 'up':
        for (let dx = 0; dx < def.width; dx++) {
          tiles.push({ x: building.x + dx, y: building.y });
        }
        break;
    }

    return tiles;
  }

  /**
   * Check if a building can accept a specific item type
   */
  private canAcceptItem(building: Building, itemType: ItemType): boolean {
    switch (building.type) {
      case 'coffer':
        return true; // Coffers accept anything

      case 'forge':
        return itemType === 'arcstone' || itemType === 'sunite';

      case 'workbench':
        if (!building.selectedRecipe) return false;
        const recipe = getRecipe(building.selectedRecipe);
        if (!recipe) return false;
        return recipe.inputs.has(itemType);

      default:
        return false;
    }
  }

  /**
   * Get ore type under a building (checks all tiles)
   */
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

  /**
   * Get building at a specific tile position
   */
  private getBuildingAt(x: number, y: number): Building | null {
    for (const building of this.buildings) {
      const def = BUILDING_DEFINITIONS[building.type];
      if (
        x >= building.x &&
        x < building.x + def.width &&
        y >= building.y &&
        y < building.y + def.height
      ) {
        return building;
      }
    }
    return null;
  }

  // Helper functions

  private addToBuffer(buffer: Map<ItemType, number>, item: ItemType, count: number): void {
    buffer.set(item, (buffer.get(item) || 0) + count);
  }

  private removeFromBuffer(buffer: Map<ItemType, number>, item: ItemType, count: number): void {
    const current = buffer.get(item) || 0;
    const newCount = Math.max(0, current - count);
    if (newCount === 0) {
      buffer.delete(item);
    } else {
      buffer.set(item, newCount);
    }
  }

  private hasIngredients(buffer: Map<ItemType, number>, required: Map<ItemType, number>): boolean {
    for (const [item, count] of required) {
      if ((buffer.get(item) || 0) < count) {
        return false;
      }
    }
    return true;
  }

  private consumeIngredients(buffer: Map<ItemType, number>, required: Map<ItemType, number>): void {
    for (const [item, count] of required) {
      this.removeFromBuffer(buffer, item, count);
    }
  }

  private recordProduction(item: ItemType, count: number): void {
    const current = this.state.itemsProduced.get(item) || 0;
    this.state.itemsProduced.set(item, current + count);
    this.onItemProduced?.(item, count);
  }
}
