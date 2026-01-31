import Phaser from 'phaser';
import {
  TILE_SIZE,
  GRID_WIDTH,
  GRID_HEIGHT,
  COLORS,
  CURSOR_JUMP_STEP,
  BUILDING_COSTS,
} from '../config';
import { Building, BuildingType, PlayerResources } from '../types';
import { BUILDING_DEFINITIONS } from '../data/buildings';
import { getRecipesForBuilding } from '../data/recipes';
import { Simulation } from '../Simulation';
import { getBufferTotal } from '../utils';

export class GameScene extends Phaser.Scene {
  // Cursor state
  private cursor = { x: 0, y: 0 };
  private selectedBuilding: BuildingType | null = null;
  private ghostRotation = 0;

  // Graphics
  private cursorGraphics!: Phaser.GameObjects.Graphics;
  private ghostSprite: Phaser.GameObjects.Sprite | null = null;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private terrainGraphics!: Phaser.GameObjects.Graphics;
  private bufferIndicators: Map<number, Phaser.GameObjects.Text> = new Map();

  // Buildings
  private buildings: Building[] = [];
  private buildingSprites: Map<number, Phaser.GameObjects.Sprite> = new Map();
  private buildingIdCounter = 0;

  // Simulation
  private simulation!: Simulation;

  // UI state
  private showAllBuffers = false;
  private menuOpen = false;
  private inventoryOpen = false;

  // Player resources
  private playerResources: PlayerResources = { stone: 0 };

  // Stone deposit charges (how much stone remains at each deposit)
  private depositCharges: Map<string, number> = new Map();

  // Keys
  private keys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    SPACE: Phaser.Input.Keyboard.Key;
    BACKSPACE: Phaser.Input.Keyboard.Key;
    R: Phaser.Input.Keyboard.Key;
    P: Phaser.Input.Keyboard.Key;
    I: Phaser.Input.Keyboard.Key;
    H: Phaser.Input.Keyboard.Key;
    C: Phaser.Input.Keyboard.Key;
    ONE: Phaser.Input.Keyboard.Key;
    TWO: Phaser.Input.Keyboard.Key;
    THREE: Phaser.Input.Keyboard.Key;
    FOUR: Phaser.Input.Keyboard.Key;
    ESC: Phaser.Input.Keyboard.Key;
    SHIFT: Phaser.Input.Keyboard.Key;
    ENTER: Phaser.Input.Keyboard.Key;
    COMMA: Phaser.Input.Keyboard.Key;
    PERIOD: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Initialize simulation
    this.simulation = new Simulation();
    this.setupSimulationCallbacks();

    // Create visual layers
    this.terrainGraphics = this.add.graphics();
    this.terrainGraphics.setDepth(0);

    this.gridGraphics = this.add.graphics();
    this.gridGraphics.setDepth(1);

    this.cursorGraphics = this.add.graphics();
    this.cursorGraphics.setDepth(100);

    // Draw grid
    this.drawGrid();

    // Place crystal veins for testing
    this.placeCrystalVeins();

    // Setup input
    this.setupInput();

    // Center cursor
    this.cursor.x = Math.floor(GRID_WIDTH / 2);
    this.cursor.y = Math.floor(GRID_HEIGHT / 2);
    this.updateCursor();

    // Start simulation immediately
    this.simulation.setBuildings(this.buildings);
    this.simulation.start();

    // Initial UI update
    this.emitUIUpdate();
  }

  private setupSimulationCallbacks(): void {
    this.simulation.onStateChanged = (state) => {
      this.events.emit('simulationStateChanged', state);
      this.updateBufferIndicators();
    };

    this.simulation.onItemProduced = (item, count) => {
      this.events.emit('itemProduced', { item, count });
    };
  }

  private placeCrystalVeins(): void {
    // Arcstone vein on the left side (blue-purple crystals)
    this.simulation.placeCrystalVein(5, 8, 6, 6, 'arcstone');

    // Sunite vein on the right side (amber-gold crystals)
    this.simulation.placeCrystalVein(30, 8, 6, 6, 'sunite');

    // Place stone deposits near crystal veins
    this.placeStoneDeposits();

    this.drawTerrain();
  }

  private placeStoneDeposits(): void {
    // Stone deposits scattered 2-4 tiles from crystal veins
    // Each deposit has 3 stone charges
    const depositPositions = [
      // Near arcstone vein (left side)
      { x: 3, y: 6 },
      { x: 4, y: 7 },
      { x: 2, y: 10 },
      { x: 3, y: 12 },
      { x: 11, y: 7 },
      { x: 12, y: 9 },
      // Near sunite vein (right side)
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

  private drawTerrain(): void {
    this.terrainGraphics.clear();

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const terrain = this.simulation.getTerrain(x, y);

        if (terrain === 'arcstone') {
          // Blue-purple for arcstone crystals
          this.terrainGraphics.fillStyle(COLORS.arcstoneBase, 1);
          this.terrainGraphics.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

          // Crystal pattern overlay (diagonal facets)
          this.terrainGraphics.lineStyle(1, COLORS.arcstoneHighlight, 0.5);
          for (let i = 0; i < TILE_SIZE; i += 4) {
            this.terrainGraphics.lineBetween(
              x * TILE_SIZE + i,
              y * TILE_SIZE,
              x * TILE_SIZE,
              y * TILE_SIZE + i
            );
            this.terrainGraphics.lineBetween(
              x * TILE_SIZE + TILE_SIZE,
              y * TILE_SIZE + i,
              x * TILE_SIZE + i,
              y * TILE_SIZE + TILE_SIZE
            );
          }
        } else if (terrain === 'sunite') {
          // Amber-gold for sunite crystals
          this.terrainGraphics.fillStyle(COLORS.suniteBase, 1);
          this.terrainGraphics.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

          // Glowing pattern overlay (radiant dots)
          this.terrainGraphics.fillStyle(COLORS.suniteHighlight, 0.6);
          this.terrainGraphics.fillCircle(
            x * TILE_SIZE + TILE_SIZE / 2,
            y * TILE_SIZE + TILE_SIZE / 2,
            2
          );
        } else if (terrain === 'stone_deposit') {
          // Gray stone deposit
          this.terrainGraphics.fillStyle(COLORS.stoneDepositBase, 1);
          this.terrainGraphics.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

          // Rock pattern overlay (small angular shapes)
          this.terrainGraphics.fillStyle(COLORS.stoneDepositHighlight, 0.7);
          this.terrainGraphics.fillRect(x * TILE_SIZE + 2, y * TILE_SIZE + 3, 5, 4);
          this.terrainGraphics.fillRect(x * TILE_SIZE + 8, y * TILE_SIZE + 7, 6, 5);
          this.terrainGraphics.fillRect(x * TILE_SIZE + 4, y * TILE_SIZE + 10, 4, 3);
        }
      }
    }
  }

  private drawGrid(): void {
    this.gridGraphics.clear();
    this.gridGraphics.lineStyle(1, COLORS.gridLine, 0.3);

    for (let x = 0; x <= GRID_WIDTH; x++) {
      this.gridGraphics.moveTo(x * TILE_SIZE, 0);
      this.gridGraphics.lineTo(x * TILE_SIZE, GRID_HEIGHT * TILE_SIZE);
    }

    for (let y = 0; y <= GRID_HEIGHT; y++) {
      this.gridGraphics.moveTo(0, y * TILE_SIZE);
      this.gridGraphics.lineTo(GRID_WIDTH * TILE_SIZE, y * TILE_SIZE);
    }

    this.gridGraphics.strokePath();
  }

  private setupInput(): void {
    const keyboard = this.input.keyboard!;

    this.keys = {
      W: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      SPACE: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      BACKSPACE: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE),
      R: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      P: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),
      I: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I),
      H: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H),
      C: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C),
      ONE: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      TWO: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      THREE: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      FOUR: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
      ESC: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
      SHIFT: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      ENTER: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
      COMMA: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.COMMA),
      PERIOD: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PERIOD),
    };

    // Movement
    this.keys.W.on('down', () => this.moveCursor(0, -1));
    this.keys.A.on('down', () => this.moveCursor(-1, 0));
    this.keys.S.on('down', () => this.moveCursor(0, 1));
    this.keys.D.on('down', () => this.moveCursor(1, 0));

    // Building selection
    this.keys.ONE.on('down', () => this.selectBuilding('quarry'));
    this.keys.TWO.on('down', () => this.selectBuilding('forge'));
    this.keys.THREE.on('down', () => this.selectBuilding('workbench'));
    this.keys.FOUR.on('down', () => this.selectBuilding('coffer'));

    // Actions
    this.keys.SPACE.on('down', () => this.handleAction());
    this.keys.ENTER.on('down', () => this.handleAction());
    this.keys.BACKSPACE.on('down', () => this.deleteBuilding());
    this.keys.R.on('down', () => this.rotate());
    this.keys.ESC.on('down', () => this.handleEsc());

    // Toggle controls
    this.keys.P.on('down', () => this.togglePause());
    this.keys.I.on('down', () => this.toggleInventory());
    this.keys.H.on('down', () => this.toggleBufferDisplay());
    this.keys.C.on('down', () => this.cycleRecipe());

    // Simulation speed controls
    this.keys.COMMA.on('down', () => this.changeSpeed(-1));
    this.keys.PERIOD.on('down', () => this.changeSpeed(1));
  }

  private moveCursor(dx: number, dy: number): void {
    const step = this.keys.SHIFT.isDown ? CURSOR_JUMP_STEP : 1;
    this.cursor.x = Phaser.Math.Clamp(this.cursor.x + dx * step, 0, GRID_WIDTH - 1);
    this.cursor.y = Phaser.Math.Clamp(this.cursor.y + dy * step, 0, GRID_HEIGHT - 1);
    this.updateCursor();
    this.updateBufferIndicators();
    this.emitUIUpdate();
  }

  private selectBuilding(type: BuildingType): void {
    this.selectedBuilding = type;
    this.ghostRotation = 0;
    this.updateGhostSprite();
    this.updateCursor();
    this.emitUIUpdate();
  }

  private handleEsc(): void {
    // If menu is open, close it
    if (this.menuOpen) {
      this.closeMenu();
      return;
    }

    // If inventory is open, close it
    if (this.inventoryOpen) {
      this.toggleInventory();
      return;
    }

    // If building is selected, deselect it
    if (this.selectedBuilding) {
      this.selectedBuilding = null;
      this.ghostRotation = 0;
      if (this.ghostSprite) {
        this.ghostSprite.destroy();
        this.ghostSprite = null;
      }
      this.updateCursor();
      this.emitUIUpdate();
      return;
    }

    // Otherwise, open menu
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
    this.updateBufferIndicators();
  }

  private cycleRecipe(): void {
    // Only works when cursor is over a workbench
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
    // Try gathering stone first if on a deposit
    if (this.gatherStone()) return;

    // Otherwise try placing a building
    this.placeBuilding();
  }

  private gatherStone(): boolean {
    const terrain = this.simulation.getTerrain(this.cursor.x, this.cursor.y);
    if (terrain !== 'stone_deposit') return false;

    const key = `${this.cursor.x},${this.cursor.y}`;
    const charges = this.depositCharges.get(key) || 0;
    if (charges <= 0) return false;

    // Collect stone
    this.playerResources.stone++;

    // Reduce charges
    const remaining = charges - 1;
    if (remaining <= 0) {
      // Deposit depleted
      this.depositCharges.delete(key);
      this.simulation.setTerrain(this.cursor.x, this.cursor.y, 'empty');
    } else {
      this.depositCharges.set(key, remaining);
    }

    // Redraw terrain
    this.drawTerrain();
    this.emitUIUpdate();
    return true;
  }

  private updateGhostSprite(): void {
    if (this.ghostSprite) {
      this.ghostSprite.destroy();
      this.ghostSprite = null;
    }

    if (!this.selectedBuilding) return;

    this.ghostSprite = this.add.sprite(0, 0, 'sprites', this.selectedBuilding);
    this.ghostSprite.setOrigin(0, 0);
    this.ghostSprite.setAlpha(0.6);
    this.ghostSprite.setDepth(50);
    this.ghostSprite.setAngle(this.ghostRotation * 90);

    this.positionGhost();
  }

  private positionGhost(): void {
    if (!this.ghostSprite || !this.selectedBuilding) return;

    const def = BUILDING_DEFINITIONS[this.selectedBuilding];
    const x = this.cursor.x * TILE_SIZE;
    const y = this.cursor.y * TILE_SIZE;

    // Adjust position for rotation (sprites rotate around center by default)
    this.ghostSprite.setPosition(x + (def.width * TILE_SIZE) / 2, y + (def.height * TILE_SIZE) / 2);
    this.ghostSprite.setOrigin(0.5, 0.5);

    const isValid = this.canPlaceBuilding();
    this.ghostSprite.setTint(isValid ? 0x00ff00 : 0xff0000);
  }

  private rotate(): void {
    this.ghostRotation = (this.ghostRotation + 1) % 4;
    if (this.ghostSprite) {
      this.ghostSprite.setAngle(this.ghostRotation * 90);
    }
  }

  private canPlaceBuilding(): boolean {
    if (!this.selectedBuilding) return false;

    const def = BUILDING_DEFINITIONS[this.selectedBuilding];
    const x = this.cursor.x;
    const y = this.cursor.y;

    // Check bounds
    if (x + def.width > GRID_WIDTH || y + def.height > GRID_HEIGHT) {
      return false;
    }

    // Check for overlapping buildings
    for (const building of this.buildings) {
      const bDef = BUILDING_DEFINITIONS[building.type];
      if (
        x < building.x + bDef.width &&
        x + def.width > building.x &&
        y < building.y + bDef.height &&
        y + def.height > building.y
      ) {
        return false;
      }
    }

    // Quarries must be on crystal veins
    if (this.selectedBuilding === 'quarry') {
      let hasOre = false;
      for (let dy = 0; dy < def.height; dy++) {
        for (let dx = 0; dx < def.width; dx++) {
          const terrain = this.simulation.getTerrain(x + dx, y + dy);
          if (terrain === 'arcstone' || terrain === 'sunite') {
            hasOre = true;
            break;
          }
        }
      }
      if (!hasOre) return false;
    }

    // Check stone cost
    const cost = BUILDING_COSTS[this.selectedBuilding];
    if (this.playerResources.stone < cost) {
      return false;
    }

    return true;
  }

  private placeBuilding(): void {
    if (!this.selectedBuilding || !this.canPlaceBuilding()) return;

    const def = BUILDING_DEFINITIONS[this.selectedBuilding];
    const x = this.cursor.x;
    const y = this.cursor.y;

    // Deduct stone cost
    const cost = BUILDING_COSTS[this.selectedBuilding];
    this.playerResources.stone -= cost;

    // Determine initial recipe for buildings that need one
    // Note: Forges auto-detect recipe based on input (see Simulation.updateForge),
    // but we set a default here for potential future UI display purposes.
    // Workbenches require a recipe to function.
    let selectedRecipe: string | null = null;
    if (this.selectedBuilding === 'forge') {
      selectedRecipe = 'purify_arcstone';
    } else if (this.selectedBuilding === 'workbench') {
      selectedRecipe = 'forge_cogwheel';
    }

    // Create building data
    const building: Building = {
      id: this.buildingIdCounter++,
      type: this.selectedBuilding,
      x,
      y,
      rotation: this.ghostRotation,
      inputBuffer: new Map(),
      outputBuffer: new Map(),
      craftProgress: 0,
      selectedRecipe,
      ticksStarved: 0,
      ticksBlocked: 0,
    };

    this.buildings.push(building);

    // Create sprite
    const sprite = this.add.sprite(
      x * TILE_SIZE + (def.width * TILE_SIZE) / 2,
      y * TILE_SIZE + (def.height * TILE_SIZE) / 2,
      'sprites',
      this.selectedBuilding
    );
    sprite.setOrigin(0.5, 0.5);
    sprite.setAngle(this.ghostRotation * 90);
    sprite.setDepth(10);
    this.buildingSprites.set(building.id, sprite);

    this.updateCursor();
    this.emitUIUpdate();
  }

  private deleteBuilding(): void {
    const x = this.cursor.x;
    const y = this.cursor.y;

    const index = this.buildings.findIndex((b) => {
      const def = BUILDING_DEFINITIONS[b.type];
      return x >= b.x && x < b.x + def.width && y >= b.y && y < b.y + def.height;
    });

    if (index !== -1) {
      const building = this.buildings[index];

      // Remove sprite
      const sprite = this.buildingSprites.get(building.id);
      sprite?.destroy();
      this.buildingSprites.delete(building.id);

      // Remove buffer indicator
      const indicator = this.bufferIndicators.get(building.id);
      indicator?.destroy();
      this.bufferIndicators.delete(building.id);

      this.buildings.splice(index, 1);
      this.updateCursor();
      this.emitUIUpdate();
    }
  }

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

    // Determine cursor color
    let color: number = COLORS.cursorNeutral;
    if (type) {
      color = this.canPlaceBuilding() ? COLORS.cursorValid : COLORS.cursorInvalid;
    }

    this.cursorGraphics.lineStyle(2, color, 1);
    this.cursorGraphics.strokeRect(x, y, w, h);

    this.positionGhost();
  }

  private getBuildingAtCursor(): Building | null {
    const x = this.cursor.x;
    const y = this.cursor.y;
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

  private updateBufferIndicators(): void {
    const buildingUnderCursor = this.getBuildingAtCursor();

    for (const building of this.buildings) {
      let indicator = this.bufferIndicators.get(building.id);

      const inputCount = getBufferTotal(building.inputBuffer);
      const outputCount = getBufferTotal(building.outputBuffer);

      // Show indicator if: showAllBuffers is on, OR cursor is over this building
      const shouldShow =
        (inputCount > 0 || outputCount > 0) &&
        (this.showAllBuffers || building === buildingUnderCursor);

      if (shouldShow) {
        const def = BUILDING_DEFINITIONS[building.type];
        const x = building.x * TILE_SIZE + (def.width * TILE_SIZE) / 2;
        const y = building.y * TILE_SIZE - 4;

        const text = `${inputCount}/${outputCount}`;

        if (!indicator) {
          indicator = this.add.text(x, y, text, {
            fontFamily: 'monospace',
            fontSize: '8px',
            color: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 1, y: 0 },
          });
          indicator.setOrigin(0.5, 1);
          indicator.setDepth(200);
          this.bufferIndicators.set(building.id, indicator);
        } else {
          indicator.setText(text);
          indicator.setPosition(x, y);
          indicator.setVisible(true);
        }
      } else if (indicator) {
        indicator.setVisible(false);
      }
    }
  }

  private getCursorInfo(): string | null {
    // Check for building first
    const building = this.getBuildingAtCursor();
    if (building) {
      return building.type.charAt(0).toUpperCase() + building.type.slice(1);
    }

    // Check terrain
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
    });
  }

  update(_time: number, delta: number): void {
    this.simulation.update(delta);
  }
}
