import Phaser from 'phaser';
import { ResponsiveScene, ConstraintMode } from 'phaser-pixui';
import {
  TILE_SIZE,
  GRID_WIDTH,
  GRID_HEIGHT,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  COLORS,
  CURSOR_JUMP_STEP,
} from '../config';
import { Building, BuildingType, GameMode, PlayerResources } from '../types';
import { BUILDING_DEFINITIONS } from '../data/buildings';
import { getRecipesForBuilding } from '../data/recipes';
import { getBuildingAt, addPlayerResource, getCursorInfo } from '../utils';
import { Simulation } from '../Simulation';
import { InputManager } from '../managers/InputManager';
import { TerrainRenderer } from '../managers/TerrainRenderer';
import { BuildingPlacer } from '../managers/BuildingPlacer';
import { BufferIndicators } from '../managers/BufferIndicators';
import { BuildingManager } from '../managers/BuildingManager';
import { StageManager } from '../managers/StageManager';
import { PanelManager } from '../managers/PanelManager';
import { ResearchManager } from '../managers/ResearchManager';
import { generateTerrain } from '../terrain/terrainSetup';
import { PatchDef } from '../terrain/terrainSetup';
import { QUARRIABLE_TERRAIN } from '../data/terrain';
import { RESEARCH_RECIPES } from '../data/research';
import { getTutorialStage } from '../data/tutorials';

export class GameScene extends ResponsiveScene {
  // Cursor state
  private cursor = { x: 0, y: 0 };
  private selectedBuilding: BuildingType | null = null;

  // Graphics
  private cursorGraphics!: Phaser.GameObjects.Graphics;

  // Core systems
  private simulation!: Simulation;
  private inputManager!: InputManager;
  private terrainRenderer!: TerrainRenderer;
  private buildingPlacer!: BuildingPlacer;
  private bufferIndicators!: BufferIndicators;
  private buildingManager!: BuildingManager;
  private stageManager!: StageManager;
  private panelManager!: PanelManager;
  private researchManager!: ResearchManager;

  // UI state
  private showAllBuffers = false;
  private buildModeActive = false;

  // Mode state
  private gameMode: GameMode = 'stages';
  private tutorialStageId = 1;

  // Player resources
  private playerResources: PlayerResources = {
    stone: 0,
    wood: 0,
    iron: 0,
    clay: 0,
    crystal_shard: 0,
  };

  constructor() {
    super({
      key: 'GameScene',
      viewportConstraints: {
        mode: ConstraintMode.Maximum,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      },
      getWorldSize: () => ({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }),
    });
  }

  init(data?: { mode?: GameMode }): void {
    this.gameMode = data?.mode ?? 'stages';
    this.tutorialStageId = 1;
  }

  create(): void {
    super.create();

    // Initialize simulation
    this.simulation = new Simulation();
    this.stageManager = new StageManager(this.simulation);
    this.stageManager.setMode(this.gameMode);
    this.panelManager = new PanelManager(this.stageManager);
    this.researchManager = new ResearchManager();
    this.registry.set('researchManager', this.researchManager);
    this.setupSimulationCallbacks();

    // Initialize managers
    this.terrainRenderer = new TerrainRenderer(this);
    this.buildingPlacer = new BuildingPlacer(this);
    this.bufferIndicators = new BufferIndicators(this);
    this.buildingManager = new BuildingManager();

    this.cursorGraphics = this.add.graphics();
    this.cursorGraphics.setDepth(100);

    // Setup mode-specific terrain and state
    this.initializeMode();

    // Setup input (must be after other init so callbacks reference valid state)
    this.inputManager = new InputManager(this, {
      moveCursor: (dx, dy) => this.handleMoveCursor(dx, dy),
      selectBuilding: (type) => this.handleSelectBuilding(type),
      handleAction: () => this.handleAction(),
      deleteBuilding: () => this.deleteBuilding(),
      rotate: () => this.handleRotateOrResearch(),
      handleCancel: () => this.handleCancel(),
      togglePause: () => this.togglePause(),
      toggleInventory: () => this.toggleInventory(),
      toggleBufferDisplay: () => this.toggleBufferDisplay(),
      cycleRecipe: () => this.handleCycleRecipe(),
      changeSpeed: (delta) => this.changeSpeed(delta),
      toggleBuildMode: () => this.toggleBuildMode(),
      toggleMenu: () => this.toggleMenu(),
      toggleObjectives: () => this.toggleObjectives(),
      toggleGuide: () => this.toggleGuide(),
      handleMKey: () => this.handleMKey(),
    });

    // Center cursor
    this.cursor.x = Math.floor(GRID_WIDTH / 2);
    this.cursor.y = Math.floor(GRID_HEIGHT / 2);
    this.updateCursor();

    // Start simulation
    this.simulation.setBuildings(this.buildingManager.getBuildings());
    this.simulation.start();

    // Defer initial UI update so UIScene has time to subscribe to events
    this.time.delayedCall(0, () => this.emitUIUpdate());
  }

  private initializeMode(): void {
    switch (this.gameMode) {
      case 'tutorial': {
        const tutorial = getTutorialStage(this.tutorialStageId);
        if (tutorial) {
          this.stageManager.loadTutorialStage(tutorial);
          generateTerrain(this.simulation, tutorial.terrainLayout);
          if (tutorial.startingResources) {
            Object.assign(this.playerResources, tutorial.startingResources);
          }
        }
        break;
      }
      case 'stages':
        generateTerrain(this.simulation);
        break;
      case 'sandbox':
        generateTerrain(this.simulation);
        break;
    }
    this.terrainRenderer.drawTerrain((x, y) => this.simulation.getTerrain(x, y));
  }

  private setupSimulationCallbacks(): void {
    this.simulation.onStateChanged = (state) => {
      this.events.emit('simulationStateChanged', state);
      this.bufferIndicators.update(
        this.buildingManager.getBuildings(),
        this.getBuildingAtCursor(),
        this.showAllBuffers
      );
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

  // --- World reset ---

  private resetWorld(
    terrainLayout?: PatchDef[],
    startingResources?: Partial<PlayerResources>
  ): void {
    this.simulation.stop();
    this.buildingManager.clearAll(this.bufferIndicators);
    this.simulation.reset();
    generateTerrain(this.simulation, terrainLayout);
    this.terrainRenderer.drawTerrain((x, y) => this.simulation.getTerrain(x, y));
    this.playerResources = { stone: 0, wood: 0, iron: 0, clay: 0, crystal_shard: 0 };
    if (startingResources) Object.assign(this.playerResources, startingResources);
    this.cursor = { x: Math.floor(GRID_WIDTH / 2), y: Math.floor(GRID_HEIGHT / 2) };
    this.selectedBuilding = null;
    this.buildModeActive = false;
    this.buildingPlacer.clearSelection();
    this.panelManager.closeAll();
    this.simulation.setBuildings(this.buildingManager.getBuildings());
    this.simulation.start();
    this.updateCursor();
    this.emitUIUpdate();
  }

  private returnToModeSelect(): void {
    this.simulation.stop();
    this.scene.stop('UIScene');
    this.scene.start('ModeSelectScene');
  }

  // --- Input handlers ---

  private handleMoveCursor(dx: number, dy: number): void {
    if (this.panelManager.isResearchOpen()) {
      this.events.emit('researchNavigate', dx, dy);
      return;
    }
    if (this.buildModeActive) {
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
    this.bufferIndicators.update(
      this.buildingManager.getBuildings(),
      this.getBuildingAtCursor(),
      this.showAllBuffers
    );
    this.emitUIUpdate();
  }

  private handleSelectBuilding(type: BuildingType): void {
    if (!this.buildModeActive) return;
    this.selectBuildingAndCloseBuildMode(type);
  }

  private handleCycleRecipe(): void {
    if (this.buildModeActive) {
      this.selectBuildingAndCloseBuildMode('chest');
      return;
    }
    this.cycleRecipe();
  }

  private selectBuildingAndCloseBuildMode(type: BuildingType): void {
    if (!this.isBuildingAvailable(type)) return;
    this.buildModeActive = false;
    this.selectBuilding(type);
  }

  private isBuildingAvailable(type: BuildingType): boolean {
    if (!this.researchManager.isBuildingUnlocked(type)) return false;
    return this.stageManager.isBuildingUnlockedByStage(type);
  }

  private selectBuilding(type: BuildingType): void {
    if (!this.isBuildingAvailable(type)) return;
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

  private handleCancel(): void {
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
    // Nothing to cancel — deconstruct building under cursor if present
    if (this.getBuildingAtCursor()) {
      this.deleteBuilding();
      return;
    }
  }

  private toggleMenu(): void {
    const wasOpen = this.panelManager.isMenuOpen();
    this.panelManager.toggleMenu();
    this.events.emit(wasOpen ? 'menuClosed' : 'menuOpened');
    this.emitUIUpdate();
  }

  /** M key: mana_well in build mode, otherwise no-op */
  private handleMKey(): void {
    if (this.buildModeActive) {
      this.selectBuildingAndCloseBuildMode('mana_well');
    }
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
      this.buildingPlacer.rotate(this.selectedBuilding);
    } else {
      this.toggleResearch();
    }
  }

  private toggleObjectives(): void {
    if (this.buildModeActive) {
      this.selectBuildingAndCloseBuildMode('mana_obelisk');
      return;
    }
    this.panelManager.toggleObjectives();
    this.emitUIUpdate();
  }

  private toggleBufferDisplay(): void {
    this.showAllBuffers = !this.showAllBuffers;
    this.bufferIndicators.update(
      this.buildingManager.getBuildings(),
      this.getBuildingAtCursor(),
      this.showAllBuffers
    );
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
      this.handleStageAdvance();
      return;
    }
    if (this.selectedBuilding) {
      this.placeBuilding();
    } else {
      this.mineResource();
    }
  }

  private handleStageAdvance(): void {
    if (this.gameMode === 'tutorial') {
      this.tutorialStageId++;
      const nextTutorial = getTutorialStage(this.tutorialStageId);
      if (nextTutorial) {
        this.stageManager.loadTutorialStage(nextTutorial);
        this.resetWorld(nextTutorial.terrainLayout, nextTutorial.startingResources);
      } else {
        this.returnToModeSelect();
      }
    } else if (this.gameMode === 'stages') {
      const advanced = this.stageManager.continueToNextStage();
      if (advanced) {
        this.resetWorld();
      } else {
        this.returnToModeSelect();
      }
    }
  }

  private mineResource(): boolean {
    const terrain = this.simulation.getTerrain(this.cursor.x, this.cursor.y);
    if (!QUARRIABLE_TERRAIN.has(terrain)) return false;

    const result = this.simulation.extractFromPatch(this.cursor.x, this.cursor.y);
    if (!result) return false;

    addPlayerResource(this.playerResources, result.item, 1);

    // Track gathered resources for tutorial objectives
    if (this.gameMode === 'tutorial') {
      this.simulation.recordGatheredItem(result.item, 1);
    }

    this.terrainRenderer.drawTerrain((x, y) => this.simulation.getTerrain(x, y));
    this.emitUIUpdate();
    return true;
  }

  private placeBuilding(): void {
    if (!this.selectedBuilding) return;

    const buildings = this.buildingManager.getBuildings();
    const result = this.buildingPlacer.placeBuilding(
      this.cursor.x,
      this.cursor.y,
      this.selectedBuilding,
      buildings,
      this.playerResources,
      this.buildingManager.getNextId(),
      (x, y) => this.simulation.getTerrain(x, y)
    );

    if (!result) return;

    this.buildingManager.addBuilding(result.building, result.sprite);
    this.updateCursor();
    this.emitUIUpdate();
  }

  private deleteBuilding(): void {
    if (this.buildingManager.deleteAtCursor(this.cursor.x, this.cursor.y, this.bufferIndicators)) {
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

    const buildings = this.buildingManager.getBuildings();
    let color: number = COLORS.cursorNeutral;
    const canPlace = this.buildingPlacer.canPlaceBuilding(
      this.cursor.x,
      this.cursor.y,
      this.selectedBuilding,
      buildings,
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
    return getBuildingAt(this.cursor.x, this.cursor.y, this.buildingManager.getBuildings());
  }

  private getCursorInfoText(): string | null {
    const building = this.getBuildingAtCursor();
    const terrain = this.simulation.getTerrain(this.cursor.x, this.cursor.y);
    const patch = this.simulation.getPatchAt(this.cursor.x, this.cursor.y);
    return getCursorInfo(building, terrain, patch);
  }

  private getTutorialText(): string[] | null {
    if (this.gameMode !== 'tutorial') return null;
    const tutorial = this.stageManager.getTutorialStage();
    return tutorial?.instructionText ?? null;
  }

  private emitUIUpdate(): void {
    const state = this.simulation.getState();
    this.events.emit('gameStateChanged', {
      selectedBuilding: this.selectedBuilding,
      cursorInfo: this.getCursorInfoText(),
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
      stageName: this.stageManager.getCurrentStageName(),
      stageComplete: this.stageManager.isStageComplete(),
      stageCompleteShown: this.stageManager.isStageCompleteShown(),
      objectiveProgress: this.stageManager.getObjectiveProgress(),
      researchOpen: this.panelManager.isResearchOpen(),
      researchPoints: this.researchManager.getResearchPoints(),
      manaProduction: state.manaProduction,
      manaConsumption: state.manaConsumption,
      unlockedManaBuildings: (['mana_well', 'mana_obelisk', 'mana_tower'] as BuildingType[]).filter(
        (t) => this.stageManager.isBuildingUnlockedByStage(t)
      ),
      cursorOverBuilding: this.getBuildingAtCursor() !== null,
      gameMode: this.gameMode,
      tutorialText: this.getTutorialText(),
    });
  }

  update(_time: number, delta: number): void {
    this.simulation.update(delta);
  }
}
