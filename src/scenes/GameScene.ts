import Phaser from 'phaser';
import { TILE_SIZE, GRID_WIDTH, GRID_HEIGHT, COLORS, CURSOR_JUMP_STEP } from '../config';
import { Building, BuildingType, PlayerResources } from '../types';
import { BUILDING_DEFINITIONS } from '../data/buildings';
import { getRecipesForBuilding } from '../data/recipes';
import { getBuildingAt } from '../utils';
import { Simulation } from '../Simulation';
import { InputManager } from '../managers/InputManager';
import { TerrainRenderer } from '../managers/TerrainRenderer';
import { BuildingPlacer } from '../managers/BuildingPlacer';
import { BufferIndicators } from '../managers/BufferIndicators';

export class GameScene extends Phaser.Scene {
  // Cursor state
  private cursor = { x: 0, y: 0 };
  private selectedBuilding: BuildingType | null = null;

  // Graphics
  private cursorGraphics!: Phaser.GameObjects.Graphics;

  // Buildings
  private buildings: Building[] = [];
  private buildingSprites: Map<number, Phaser.GameObjects.Sprite> = new Map();
  private buildingIdCounter = 0;

  // Core systems
  private simulation!: Simulation;
  private inputManager!: InputManager;
  private terrainRenderer!: TerrainRenderer;
  private buildingPlacer!: BuildingPlacer;
  private bufferIndicators!: BufferIndicators;

  // UI state
  private showAllBuffers = false;
  private menuOpen = false;
  private inventoryOpen = false;
  private buildModeActive = false;

  // Player resources
  private playerResources: PlayerResources = { stone: 0 };

  // Stone deposit charges (how much stone remains at each deposit)
  private depositCharges: Map<string, number> = new Map();

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Initialize simulation
    this.simulation = new Simulation();
    this.setupSimulationCallbacks();

    // Initialize managers
    this.terrainRenderer = new TerrainRenderer(this);
    this.buildingPlacer = new BuildingPlacer(this);
    this.bufferIndicators = new BufferIndicators(this);

    this.cursorGraphics = this.add.graphics();
    this.cursorGraphics.setDepth(100);

    // Draw grid and terrain
    this.terrainRenderer.drawGrid();
    this.placeCrystalVeins();

    // Setup input (must be after other init so callbacks reference valid state)
    this.inputManager = new InputManager(this, {
      moveCursor: (dx, dy) => this.handleMoveCursor(dx, dy),
      selectBuilding: (type) => this.handleSelectBuilding(type),
      handleAction: () => this.handleAction(),
      deleteBuilding: () => this.deleteBuilding(),
      rotate: () => this.buildingPlacer.rotate(),
      handleEsc: () => this.handleEsc(),
      togglePause: () => this.togglePause(),
      toggleInventory: () => this.toggleInventory(),
      toggleBufferDisplay: () => this.toggleBufferDisplay(),
      cycleRecipe: () => this.handleCycleRecipe(),
      changeSpeed: (delta) => this.changeSpeed(delta),
      toggleBuildMode: () => this.toggleBuildMode(),
    });

    // Center cursor
    this.cursor.x = Math.floor(GRID_WIDTH / 2);
    this.cursor.y = Math.floor(GRID_HEIGHT / 2);
    this.updateCursor();

    // Start simulation
    this.simulation.setBuildings(this.buildings);
    this.simulation.start();

    this.emitUIUpdate();
  }

  private setupSimulationCallbacks(): void {
    this.simulation.onStateChanged = (state) => {
      this.events.emit('simulationStateChanged', state);
      this.bufferIndicators.update(this.buildings, this.getBuildingAtCursor(), this.showAllBuffers);
    };

    this.simulation.onItemProduced = (item, count) => {
      this.events.emit('itemProduced', { item, count });
    };
  }

  private placeCrystalVeins(): void {
    this.simulation.placeCrystalVein(5, 8, 6, 6, 'arcstone');
    this.simulation.placeCrystalVein(30, 8, 6, 6, 'sunite');
    this.placeStoneDeposits();
    this.terrainRenderer.drawTerrain((x, y) => this.simulation.getTerrain(x, y));
  }

  private placeStoneDeposits(): void {
    const depositPositions = [
      { x: 3, y: 6 },
      { x: 4, y: 7 },
      { x: 2, y: 10 },
      { x: 3, y: 12 },
      { x: 11, y: 7 },
      { x: 12, y: 9 },
      { x: 28, y: 6 },
      { x: 27, y: 8 },
      { x: 36, y: 7 },
      { x: 37, y: 10 },
      { x: 29, y: 14 },
      { x: 35, y: 13 },
    ];

    for (const pos of depositPositions) {
      this.simulation.setTerrain(pos.x, pos.y, 'stone_deposit');
      this.depositCharges.set(`${pos.x},${pos.y}`, 3);
    }
  }

  // --- Input handlers ---

  /**
   * Movement callback - also handles F key in build mode (forge selection).
   * In build mode, movement keys are disabled.
   */
  private handleMoveCursor(dx: number, dy: number): void {
    if (this.buildModeActive) {
      // F key fires both moveCursor(1,0) and is the forge build key
      if (dx === 1 && dy === 0) {
        this.selectBuildingAndCloseBuildMode('forge');
      }
      return;
    }
    this.moveCursor(dx, dy);
  }

  private moveCursor(dx: number, dy: number): void {
    const step = this.inputManager.keys.SHIFT.isDown ? CURSOR_JUMP_STEP : 1;
    this.cursor.x = Phaser.Math.Clamp(this.cursor.x + dx * step, 0, GRID_WIDTH - 1);
    this.cursor.y = Phaser.Math.Clamp(this.cursor.y + dy * step, 0, GRID_HEIGHT - 1);
    this.updateCursor();
    this.bufferIndicators.update(this.buildings, this.getBuildingAtCursor(), this.showAllBuffers);
    this.emitUIUpdate();
  }

  /**
   * Building selection callback from Q and W keys.
   * Q=quarry, W=workbench. Only active during build mode.
   */
  private handleSelectBuilding(type: BuildingType): void {
    if (!this.buildModeActive) return;
    this.selectBuildingAndCloseBuildMode(type);
  }

  /**
   * Cycle recipe callback - also handles C key in build mode (chest selection).
   */
  private handleCycleRecipe(): void {
    if (this.buildModeActive) {
      this.selectBuildingAndCloseBuildMode('chest');
      return;
    }
    this.cycleRecipe();
  }

  private selectBuildingAndCloseBuildMode(type: BuildingType): void {
    this.buildModeActive = false;
    this.selectBuilding(type);
  }

  private selectBuilding(type: BuildingType): void {
    this.selectedBuilding = type;
    this.buildingPlacer.resetRotation();
    this.buildingPlacer.updateGhostSprite(type);
    this.updateCursor();
    this.emitUIUpdate();
  }

  private toggleBuildMode(): void {
    this.buildModeActive = !this.buildModeActive;
    this.emitUIUpdate();
  }

  private handleEsc(): void {
    if (this.buildModeActive) {
      this.buildModeActive = false;
      this.emitUIUpdate();
      return;
    }
    if (this.menuOpen) {
      this.closeMenu();
      return;
    }
    if (this.inventoryOpen) {
      this.toggleInventory();
      return;
    }
    if (this.selectedBuilding) {
      this.selectedBuilding = null;
      this.buildingPlacer.clearSelection();
      this.updateCursor();
      this.emitUIUpdate();
      return;
    }
    this.openMenu();
  }

  private openMenu(): void {
    this.menuOpen = true;
    this.events.emit('menuOpened');
    this.emitUIUpdate();
  }

  private closeMenu(): void {
    this.menuOpen = false;
    this.events.emit('menuClosed');
    this.emitUIUpdate();
  }

  private togglePause(): void {
    this.simulation.togglePause();
    this.emitUIUpdate();
  }

  private toggleInventory(): void {
    this.inventoryOpen = !this.inventoryOpen;
    this.events.emit('inventoryToggled', this.inventoryOpen);
    this.emitUIUpdate();
  }

  private toggleBufferDisplay(): void {
    this.showAllBuffers = !this.showAllBuffers;
    this.bufferIndicators.update(this.buildings, this.getBuildingAtCursor(), this.showAllBuffers);
  }

  private cycleRecipe(): void {
    const building = this.getBuildingAtCursor();
    if (!building || building.type !== 'workbench') return;

    const recipes = getRecipesForBuilding('workbench');
    if (recipes.length === 0) return;

    const currentIndex = recipes.findIndex((r) => r.id === building.selectedRecipe);
    const nextIndex = (currentIndex + 1) % recipes.length;
    building.selectedRecipe = recipes[nextIndex].id;

    this.emitUIUpdate();
  }

  private changeSpeed(delta: number): void {
    const state = this.simulation.getState();
    const speeds = [1, 2, 4];
    const currentIndex = speeds.indexOf(state.speed);
    const newIndex = Phaser.Math.Clamp(currentIndex + delta, 0, speeds.length - 1);
    this.simulation.setSpeed(speeds[newIndex]);
    this.emitUIUpdate();
  }

  private handleAction(): void {
    if (this.gatherStone()) return;
    this.placeBuilding();
  }

  private gatherStone(): boolean {
    const terrain = this.simulation.getTerrain(this.cursor.x, this.cursor.y);
    if (terrain !== 'stone_deposit') return false;

    const key = `${this.cursor.x},${this.cursor.y}`;
    const charges = this.depositCharges.get(key) || 0;
    if (charges <= 0) return false;

    this.playerResources.stone++;

    const remaining = charges - 1;
    if (remaining <= 0) {
      this.depositCharges.delete(key);
      this.simulation.setTerrain(this.cursor.x, this.cursor.y, 'empty');
    } else {
      this.depositCharges.set(key, remaining);
    }

    this.terrainRenderer.drawTerrain((x, y) => this.simulation.getTerrain(x, y));
    this.emitUIUpdate();
    return true;
  }

  private placeBuilding(): void {
    if (!this.selectedBuilding) return;

    const result = this.buildingPlacer.placeBuilding(
      this.cursor.x,
      this.cursor.y,
      this.selectedBuilding,
      this.buildings,
      this.playerResources,
      this.buildingIdCounter,
      (x, y) => this.simulation.getTerrain(x, y)
    );

    if (!result) return;

    this.buildingIdCounter++;
    this.buildings.push(result.building);
    this.buildingSprites.set(result.building.id, result.sprite);
    this.updateCursor();
    this.emitUIUpdate();
  }

  private deleteBuilding(): void {
    const index = this.buildings.findIndex((b) => {
      const def = BUILDING_DEFINITIONS[b.type];
      return (
        this.cursor.x >= b.x &&
        this.cursor.x < b.x + def.width &&
        this.cursor.y >= b.y &&
        this.cursor.y < b.y + def.height
      );
    });

    if (index !== -1) {
      const building = this.buildings[index];

      const sprite = this.buildingSprites.get(building.id);
      sprite?.destroy();
      this.buildingSprites.delete(building.id);

      this.bufferIndicators.removeForBuilding(building.id);

      this.buildings.splice(index, 1);
      this.updateCursor();
      this.emitUIUpdate();
    }
  }

  // --- Visual updates ---

  private updateCursor(): void {
    this.cursorGraphics.clear();

    const type = this.selectedBuilding;
    const def = type ? BUILDING_DEFINITIONS[type] : null;
    const width = def ? def.width : 1;
    const height = def ? def.height : 1;

    const x = this.cursor.x * TILE_SIZE;
    const y = this.cursor.y * TILE_SIZE;
    const w = width * TILE_SIZE;
    const h = height * TILE_SIZE;

    let color: number = COLORS.cursorNeutral;
    const canPlace = this.buildingPlacer.canPlaceBuilding(
      this.cursor.x,
      this.cursor.y,
      this.selectedBuilding,
      this.buildings,
      this.playerResources,
      (cx, cy) => this.simulation.getTerrain(cx, cy)
    );
    if (type) {
      color = canPlace ? COLORS.cursorValid : COLORS.cursorInvalid;
    }

    this.cursorGraphics.lineStyle(2, color, 1);
    this.cursorGraphics.strokeRect(x, y, w, h);

    this.buildingPlacer.positionGhost(
      this.cursor.x,
      this.cursor.y,
      this.selectedBuilding,
      canPlace
    );
  }

  private getBuildingAtCursor(): Building | null {
    return getBuildingAt(this.cursor.x, this.cursor.y, this.buildings);
  }

  private getCursorInfo(): string | null {
    const building = this.getBuildingAtCursor();
    if (building) {
      return building.type.charAt(0).toUpperCase() + building.type.slice(1);
    }

    const terrain = this.simulation.getTerrain(this.cursor.x, this.cursor.y);
    if (terrain === 'stone_deposit') {
      const key = `${this.cursor.x},${this.cursor.y}`;
      const charges = this.depositCharges.get(key) || 0;
      return `Stone Deposit (${charges})`;
    }
    if (terrain === 'arcstone') return 'Arcstone Vein';
    if (terrain === 'sunite') return 'Sunite Vein';

    return null;
  }

  private emitUIUpdate(): void {
    const state = this.simulation.getState();
    this.events.emit('gameStateChanged', {
      buildingCount: this.buildings.length,
      selectedBuilding: this.selectedBuilding,
      cursorX: this.cursor.x,
      cursorY: this.cursor.y,
      cursorInfo: this.getCursorInfo(),
      simRunning: state.running,
      simPaused: state.paused,
      simSpeed: state.speed,
      simTick: state.tickCount,
      itemsProduced: Object.fromEntries(state.itemsProduced),
      menuOpen: this.menuOpen,
      inventoryOpen: this.inventoryOpen,
      playerResources: this.playerResources,
      buildModeActive: this.buildModeActive,
    });
  }

  update(_time: number, delta: number): void {
    this.simulation.update(delta);
  }
}
