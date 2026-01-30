import Phaser from 'phaser';
import { TILE_SIZE, GRID_WIDTH, GRID_HEIGHT, COLORS, CURSOR_JUMP_STEP } from '../config';
import { Building, BuildingType } from '../types';
import { BUILDING_DEFINITIONS } from '../data/buildings';
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

  // Keys
  private keys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    SPACE: Phaser.Input.Keyboard.Key;
    BACKSPACE: Phaser.Input.Keyboard.Key;
    R: Phaser.Input.Keyboard.Key;
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

    // Place some ore patches for testing
    this.placeTestOrePatches();

    // Setup input
    this.setupInput();

    // Center cursor
    this.cursor.x = Math.floor(GRID_WIDTH / 2);
    this.cursor.y = Math.floor(GRID_HEIGHT / 2);
    this.updateCursor();

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

  private placeTestOrePatches(): void {
    // Iron ore patch on the left side
    this.simulation.placeOrePatch(5, 8, 6, 6, 'iron_ore');

    // Copper ore patch on the right side
    this.simulation.placeOrePatch(30, 8, 6, 6, 'copper_ore');

    this.drawTerrain();
  }

  private drawTerrain(): void {
    this.terrainGraphics.clear();

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const terrain = this.simulation.getTerrain(x, y);

        if (terrain === 'iron_ore') {
          // Blue-gray for iron
          this.terrainGraphics.fillStyle(0x4a5462, 1);
          this.terrainGraphics.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

          // Pattern overlay (diagonal lines for iron)
          this.terrainGraphics.lineStyle(1, 0x6c7a89, 0.5);
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
        } else if (terrain === 'copper_ore') {
          // Orange-brown for copper
          this.terrainGraphics.fillStyle(0x8b4513, 1);
          this.terrainGraphics.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

          // Pattern overlay (dots for copper)
          this.terrainGraphics.fillStyle(0xb87333, 0.6);
          this.terrainGraphics.fillCircle(
            x * TILE_SIZE + TILE_SIZE / 2,
            y * TILE_SIZE + TILE_SIZE / 2,
            2
          );
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
    this.keys.ONE.on('down', () => this.selectBuilding('miner'));
    this.keys.TWO.on('down', () => this.selectBuilding('furnace'));
    this.keys.THREE.on('down', () => this.selectBuilding('assembler'));
    this.keys.FOUR.on('down', () => this.selectBuilding('chest'));

    // Actions
    this.keys.ENTER.on('down', () => this.placeBuilding());
    this.keys.BACKSPACE.on('down', () => this.deleteBuilding());
    this.keys.R.on('down', () => this.rotate());
    this.keys.ESC.on('down', () => this.deselect());

    // Simulation controls
    this.keys.SPACE.on('down', () => this.toggleSimulation());
    this.keys.COMMA.on('down', () => this.changeSpeed(-1));
    this.keys.PERIOD.on('down', () => this.changeSpeed(1));
  }

  private moveCursor(dx: number, dy: number): void {
    const step = this.keys.SHIFT.isDown ? CURSOR_JUMP_STEP : 1;
    this.cursor.x = Phaser.Math.Clamp(this.cursor.x + dx * step, 0, GRID_WIDTH - 1);
    this.cursor.y = Phaser.Math.Clamp(this.cursor.y + dy * step, 0, GRID_HEIGHT - 1);
    this.updateCursor();
    this.emitUIUpdate();
  }

  private selectBuilding(type: BuildingType): void {
    this.selectedBuilding = type;
    this.ghostRotation = 0;
    this.updateGhostSprite();
    this.updateCursor();
    this.emitUIUpdate();
  }

  private deselect(): void {
    this.selectedBuilding = null;
    this.ghostRotation = 0;
    if (this.ghostSprite) {
      this.ghostSprite.destroy();
      this.ghostSprite = null;
    }
    this.updateCursor();
    this.emitUIUpdate();
  }

  private toggleSimulation(): void {
    const state = this.simulation.getState();

    if (!state.running) {
      // Start simulation
      this.simulation.setBuildings(this.buildings);
      this.simulation.start();
    } else {
      // Stop simulation
      this.simulation.stop();
    }
    this.emitUIUpdate();
  }

  private changeSpeed(delta: number): void {
    const state = this.simulation.getState();
    const speeds = [1, 2, 4];
    const currentIndex = speeds.indexOf(state.speed);
    const newIndex = Phaser.Math.Clamp(currentIndex + delta, 0, speeds.length - 1);
    this.simulation.setSpeed(speeds[newIndex]);
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

    // Miners must be on ore patches
    if (this.selectedBuilding === 'miner') {
      let hasOre = false;
      for (let dy = 0; dy < def.height; dy++) {
        for (let dx = 0; dx < def.width; dx++) {
          const terrain = this.simulation.getTerrain(x + dx, y + dy);
          if (terrain === 'iron_ore' || terrain === 'copper_ore') {
            hasOre = true;
            break;
          }
        }
      }
      if (!hasOre) return false;
    }

    return true;
  }

  private placeBuilding(): void {
    if (!this.selectedBuilding || !this.canPlaceBuilding()) return;

    const def = BUILDING_DEFINITIONS[this.selectedBuilding];
    const x = this.cursor.x;
    const y = this.cursor.y;

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
      selectedRecipe: this.selectedBuilding === 'furnace' ? 'smelt_iron' : null, // Auto-select for furnace
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

  private updateBufferIndicators(): void {
    for (const building of this.buildings) {
      let indicator = this.bufferIndicators.get(building.id);

      const inputCount = getBufferTotal(building.inputBuffer);
      const outputCount = getBufferTotal(building.outputBuffer);

      if (inputCount > 0 || outputCount > 0) {
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
        }
      } else if (indicator) {
        indicator.destroy();
        this.bufferIndicators.delete(building.id);
      }
    }
  }

  private emitUIUpdate(): void {
    const state = this.simulation.getState();
    this.events.emit('gameStateChanged', {
      buildingCount: this.buildings.length,
      selectedBuilding: this.selectedBuilding,
      cursorX: this.cursor.x,
      cursorY: this.cursor.y,
      simRunning: state.running,
      simPaused: state.paused,
      simSpeed: state.speed,
      simTick: state.tickCount,
      itemsProduced: Object.fromEntries(state.itemsProduced),
    });
  }

  update(_time: number, delta: number): void {
    this.simulation.update(delta);
  }
}
