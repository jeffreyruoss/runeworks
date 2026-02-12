import Phaser from 'phaser';
import { TILE_SIZE, GRID_WIDTH, GRID_HEIGHT, COLORS, CURSOR_JUMP_STEP } from '../config';
import { Building, BuildingType, PlayerResources } from '../types';
import { BUILDING_DEFINITIONS } from '../data/buildings';
import { getRecipe, getRecipesForBuilding } from '../data/recipes';
import { getBuildingAt, addPlayerResource } from '../utils';
import { Simulation } from '../Simulation';
import { InputManager } from '../managers/InputManager';
import { TerrainRenderer } from '../managers/TerrainRenderer';
import { BuildingPlacer } from '../managers/BuildingPlacer';
import { BufferIndicators } from '../managers/BufferIndicators';
import { StageManager } from '../managers/StageManager';
import { PanelManager } from '../managers/PanelManager';
import { ResearchManager } from '../managers/ResearchManager';
import { generateTerrain } from '../terrain/terrainSetup';
import { QUARRIABLE_TERRAIN, TERRAIN_DISPLAY_NAMES } from '../data/terrain';
import { RESEARCH_RECIPES, getResearchRecipe } from '../data/research';

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
  private stageManager!: StageManager;
  private panelManager!: PanelManager;
  private researchManager!: ResearchManager;

  // UI state
  private showAllBuffers = false;
  private buildModeActive = false;

  // Player resources
  private playerResources: PlayerResources = {
    stone: 0,
    wood: 0,
    iron: 0,
    clay: 0,
    crystal_shard: 0,
  };

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Initialize simulation
    this.simulation = new Simulation();
    this.stageManager = new StageManager(this.simulation);
    this.panelManager = new PanelManager(this.stageManager);
    this.researchManager = new ResearchManager();
    this.registry.set('researchManager', this.researchManager);
    this.setupSimulationCallbacks();

    // Initialize managers
    this.terrainRenderer = new TerrainRenderer(this);
    this.buildingPlacer = new BuildingPlacer(this);
    this.bufferIndicators = new BufferIndicators(this);

    this.cursorGraphics = this.add.graphics();
    this.cursorGraphics.setDepth(100);

    // Draw grid and terrain
    this.terrainRenderer.drawGrid();
    this.setupTerrain();

    // Setup input (must be after other init so callbacks reference valid state)
    this.inputManager = new InputManager(this, {
      moveCursor: (dx, dy) => this.handleMoveCursor(dx, dy),
      selectBuilding: (type) => this.handleSelectBuilding(type),
      handleAction: () => this.handleAction(),
      deleteBuilding: () => this.deleteBuilding(),
      rotate: () => this.handleRotateOrResearch(),
      handleEsc: () => this.handleEsc(),
      togglePause: () => this.togglePause(),
      toggleInventory: () => this.toggleInventory(),
      toggleBufferDisplay: () => this.toggleBufferDisplay(),
      cycleRecipe: () => this.handleCycleRecipe(),
      changeSpeed: (delta) => this.changeSpeed(delta),
      toggleBuildMode: () => this.toggleBuildMode(),
      toggleMenu: () => this.toggleMenu(),
      toggleObjectives: () => this.toggleObjectives(),
      toggleGuide: () => this.toggleGuide(),
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
      this.stageManager.checkStageComplete();
      this.emitUIUpdate();
    };

    this.simulation.onResearchPointsProduced = (rp) => {
      this.researchManager.addResearchPoints(rp);
      this.emitUIUpdate();
    };

    this.simulation.getUpgrades = () => this.researchManager.getActiveUpgrades();
  }

  private setupTerrain(): void {
    generateTerrain(this.simulation);
    this.terrainRenderer.drawTerrain((x, y) => this.simulation.getTerrain(x, y));
  }

  // --- Input handlers ---

  /**
   * Movement callback - intercepts keys during build mode.
   * F key (dx=1, dy=0) selects forge; all other movement is blocked.
   */
  private handleMoveCursor(dx: number, dy: number): void {
    if (this.panelManager.isResearchOpen()) {
      this.events.emit('researchNavigate', dx, dy);
      return;
    }
    if (this.buildModeActive) {
      // F key is bound to moveCursor(1,0) — in build mode, treat it as forge selection
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
    if (!this.researchManager.isBuildingUnlocked(type)) return;
    this.buildModeActive = false;
    this.selectBuilding(type);
  }

  private selectBuilding(type: BuildingType): void {
    if (!this.researchManager.isBuildingUnlocked(type)) return;
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
    const closed = this.panelManager.closeTopPanel();
    if (closed) {
      if (closed === 'menu') this.events.emit('menuClosed');
      if (closed === 'inventory') this.events.emit('inventoryToggled', false);
      this.emitUIUpdate();
      return;
    }
    if (this.selectedBuilding) {
      this.selectedBuilding = null;
      this.buildingPlacer.clearSelection();
      this.updateCursor();
      this.emitUIUpdate();
      return;
    }
    this.panelManager.openMenu();
    this.events.emit('menuOpened');
    this.emitUIUpdate();
  }

  private toggleMenu(): void {
    const wasOpen = this.panelManager.isMenuOpen();
    this.panelManager.toggleMenu();
    this.events.emit(wasOpen ? 'menuClosed' : 'menuOpened');
    this.emitUIUpdate();
  }

  private togglePause(): void {
    this.simulation.togglePause();
    this.emitUIUpdate();
  }

  private toggleInventory(): void {
    const isOpen = this.panelManager.toggleInventory();
    this.events.emit('inventoryToggled', isOpen);
    this.emitUIUpdate();
  }

  private toggleGuide(): void {
    this.panelManager.toggleGuide();
    this.emitUIUpdate();
  }

  private toggleResearch(): void {
    this.panelManager.toggleResearch();
    this.emitUIUpdate();
  }

  private handleRotateOrResearch(): void {
    if (this.panelManager.isResearchOpen()) {
      this.toggleResearch();
      return;
    }
    if (this.selectedBuilding) {
      this.buildingPlacer.rotate();
    } else {
      this.toggleResearch();
    }
  }

  private toggleObjectives(): void {
    this.panelManager.toggleObjectives();
    this.emitUIUpdate();
  }

  private toggleBufferDisplay(): void {
    this.showAllBuffers = !this.showAllBuffers;
    this.bufferIndicators.update(this.buildings, this.getBuildingAtCursor(), this.showAllBuffers);
  }

  private cycleRecipe(): void {
    const building = this.getBuildingAtCursor();
    if (!building) return;

    if (building.type === 'workbench') {
      const recipes = getRecipesForBuilding('workbench').filter((r) =>
        this.researchManager.isRecipeUnlocked(r.id)
      );
      if (recipes.length === 0) return;

      const currentIndex = recipes.findIndex((r) => r.id === building.selectedRecipe);
      const nextIndex = (currentIndex + 1) % recipes.length;
      building.selectedRecipe = recipes[nextIndex].id;
      this.emitUIUpdate();
    } else if (building.type === 'arcane_study') {
      const currentIndex = RESEARCH_RECIPES.findIndex((r) => r.id === building.selectedRecipe);
      const nextIndex = (currentIndex + 1) % RESEARCH_RECIPES.length;
      building.selectedRecipe = RESEARCH_RECIPES[nextIndex].id;
      this.emitUIUpdate();
    }
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
    if (this.panelManager.isResearchOpen()) {
      this.events.emit('researchUnlock');
      return;
    }
    if (this.stageManager.isStageCompleteShown()) {
      this.stageManager.continueToNextStage();
      this.emitUIUpdate();
      return;
    }
    if (this.selectedBuilding) {
      this.placeBuilding();
    } else {
      this.mineResource();
    }
  }

  private mineResource(): boolean {
    const terrain = this.simulation.getTerrain(this.cursor.x, this.cursor.y);
    if (!QUARRIABLE_TERRAIN.has(terrain)) return false;

    const result = this.simulation.extractFromPatch(this.cursor.x, this.cursor.y);
    if (!result) return false;

    addPlayerResource(this.playerResources, result.item, 1);

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
      const name = building.type
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      // Inline recipe name lookup
      let recipeName: string | null = null;
      if (building.selectedRecipe) {
        const recipe =
          building.type === 'arcane_study'
            ? getResearchRecipe(building.selectedRecipe)
            : building.type === 'workbench'
              ? getRecipe(building.selectedRecipe)
              : null;
        recipeName = recipe?.name ?? null;
      }
      return recipeName ? `${name}: ${recipeName}` : name;
    }

    const terrain = this.simulation.getTerrain(this.cursor.x, this.cursor.y);
    if (terrain !== 'empty') {
      const displayName = TERRAIN_DISPLAY_NAMES[terrain];
      const patch = this.simulation.getPatchAt(this.cursor.x, this.cursor.y);
      if (patch) {
        return `${displayName} (${patch.remainingPool}/${patch.totalPool})`;
      }
      return displayName;
    }

    return null;
  }

  private emitUIUpdate(): void {
    const state = this.simulation.getState();
    this.events.emit('gameStateChanged', {
      selectedBuilding: this.selectedBuilding,
      cursorInfo: this.getCursorInfo(),
      simRunning: state.running,
      simPaused: state.paused,
      simSpeed: state.speed,
      simTick: state.tickCount,
      itemsProduced: Object.fromEntries(state.itemsProduced),
      menuOpen: this.panelManager.isMenuOpen(),
      inventoryOpen: this.panelManager.isInventoryOpen(),
      playerResources: this.playerResources,
      buildModeActive: this.buildModeActive,
      guideOpen: this.panelManager.isGuideOpen(),
      objectivesOpen: this.panelManager.isObjectivesOpen(),
      currentStage: this.stageManager.getCurrentStage(),
      stageComplete: this.stageManager.isStageComplete(),
      stageCompleteShown: this.stageManager.isStageCompleteShown(),
      objectiveProgress: this.stageManager.getObjectiveProgress(),
      researchOpen: this.panelManager.isResearchOpen(),
      researchPoints: this.researchManager.getResearchPoints(),
    });
  }

  update(_time: number, delta: number): void {
    this.simulation.update(delta);
  }
}
