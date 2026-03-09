import Phaser from 'phaser';
import { TILE_SIZE, GRID_WIDTH, GRID_HEIGHT, BUILDING_COSTS, THEME } from '../config';
import { Building, BuildingType, Direction, PlayerResources, TerrainType } from '../types';
import { BUILDING_DEFINITIONS } from '../data/buildings';
import { QUARRIABLE_TERRAIN } from '../data/terrain';
import { canAfford, deductCost, rotateDirection } from '../utils';

/**
 * Manages building placement: ghost preview sprite, placement validation,
 * and building creation. Owns ghost sprite and rotation state.
 */

export class BuildingPlacer {
  private scene: Phaser.Scene;
  private ghostSprite: Phaser.GameObjects.Sprite | null = null;
  private ghostRotation = 0;
  private arrowGraphics: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  getGhostRotation(): number {
    return this.ghostRotation;
  }

  rotate(selectedBuilding: BuildingType | null): void {
    if (selectedBuilding) {
      const def = BUILDING_DEFINITIONS[selectedBuilding];
      // Mana buildings have no rotation (no input/output sides)
      if (def.inputSides.length === 0 && def.outputSides.length === 0) return;
    }
    this.ghostRotation = (this.ghostRotation + 1) % 4;
    if (this.ghostSprite) {
      this.ghostSprite.setAngle(this.ghostRotation * 90);
    }
  }

  /**
   * Update ghost sprite to match the currently selected building type.
   * Pass null to clear the ghost.
   */
  updateGhostSprite(selectedBuilding: BuildingType | null): void {
    if (this.ghostSprite) {
      this.ghostSprite.destroy();
      this.ghostSprite = null;
    }
    this.destroyArrows();

    if (!selectedBuilding) return;

    const def = BUILDING_DEFINITIONS[selectedBuilding];
    this.ghostSprite = this.scene.add.sprite(0, 0, 'sprites', selectedBuilding);
    this.ghostSprite.setOrigin(0.5, 0.5);
    this.ghostSprite.setAlpha(0.6);
    this.ghostSprite.setDepth(50);
    this.ghostSprite.setDisplaySize(def.width * TILE_SIZE, def.height * TILE_SIZE);
    this.ghostSprite.setAngle(this.ghostRotation * 90);

    // Create graphics for direction arrows (skip omnidirectional buildings like chest)
    const hasOutputArrows = def.outputSides.length > 0 && def.outputSides.length < 4;
    const hasInputArrows = def.inputSides.length > 0 && def.inputSides.length < 4;
    if (hasOutputArrows || hasInputArrows) {
      this.arrowGraphics = this.scene.add.graphics();
      this.arrowGraphics.setDepth(51);
    }
  }

  /**
   * Position ghost sprite at cursor and tint based on placement validity
   */
  positionGhost(
    cursorX: number,
    cursorY: number,
    selectedBuilding: BuildingType | null,
    canPlace: boolean
  ): void {
    if (!this.ghostSprite || !selectedBuilding) return;

    const def = BUILDING_DEFINITIONS[selectedBuilding];
    const x = cursorX * TILE_SIZE;
    const y = cursorY * TILE_SIZE;
    const w = def.width * TILE_SIZE;
    const h = def.height * TILE_SIZE;

    this.ghostSprite.setPosition(x + w / 2, y + h / 2);
    this.ghostSprite.setTint(canPlace ? THEME.ghost.valid : THEME.ghost.invalid);

    // Draw direction arrows (output = yellow, input = cyan)
    if (this.arrowGraphics) {
      this.arrowGraphics.clear();
      const invalidColor = THEME.ghost.invalid;

      // Output arrows (pointing outward)
      if (def.outputSides.length > 0 && def.outputSides.length < 4) {
        this.arrowGraphics.fillStyle(canPlace ? 0xffdd00 : invalidColor, 0.9);
        for (const localSide of def.outputSides) {
          const worldSide = rotateDirection(localSide, this.ghostRotation);
          this.drawArrow(x, y, w, h, worldSide, false);
        }
      }

      // Input arrows (pointing inward)
      if (def.inputSides.length > 0 && def.inputSides.length < 4) {
        this.arrowGraphics.fillStyle(canPlace ? 0x44ccff : invalidColor, 0.9);
        for (const localSide of def.inputSides) {
          const worldSide = rotateDirection(localSide, this.ghostRotation);
          this.drawArrow(x, y, w, h, worldSide, true);
        }
      }
    }
  }

  /**
   * Check if a building can be placed at the cursor position
   */
  canPlaceBuilding(
    cursorX: number,
    cursorY: number,
    selectedBuilding: BuildingType | null,
    buildings: Building[],
    playerResources: PlayerResources,
    getTerrain: (x: number, y: number) => TerrainType
  ): boolean {
    if (!selectedBuilding) return false;

    const def = BUILDING_DEFINITIONS[selectedBuilding];

    // Check bounds
    if (cursorX + def.width > GRID_WIDTH || cursorY + def.height > GRID_HEIGHT) {
      return false;
    }

    // Check for overlapping buildings
    for (const building of buildings) {
      const bDef = BUILDING_DEFINITIONS[building.type];
      if (
        cursorX < building.x + bDef.width &&
        cursorX + def.width > building.x &&
        cursorY < building.y + bDef.height &&
        cursorY + def.height > building.y
      ) {
        return false;
      }
    }

    // Quarries must be on a quarriable resource
    if (selectedBuilding === 'quarry') {
      let hasResource = false;
      for (let dy = 0; dy < def.height; dy++) {
        for (let dx = 0; dx < def.width; dx++) {
          const terrain = getTerrain(cursorX + dx, cursorY + dy);
          if (QUARRIABLE_TERRAIN.has(terrain)) {
            hasResource = true;
            break;
          }
        }
      }
      if (!hasResource) return false;
    }

    // Check multi-resource cost
    const cost = BUILDING_COSTS[selectedBuilding];
    if (!canAfford(playerResources, cost)) {
      return false;
    }

    return true;
  }

  /**
   * Place a building and return it. Returns null if placement is invalid.
   */
  placeBuilding(
    cursorX: number,
    cursorY: number,
    selectedBuilding: BuildingType,
    buildings: Building[],
    playerResources: PlayerResources,
    buildingIdCounter: number,
    getTerrain: (x: number, y: number) => TerrainType
  ): { building: Building; sprite: Phaser.GameObjects.Sprite } | null {
    if (
      !this.canPlaceBuilding(
        cursorX,
        cursorY,
        selectedBuilding,
        buildings,
        playerResources,
        getTerrain
      )
    ) {
      return null;
    }

    const def = BUILDING_DEFINITIONS[selectedBuilding];

    // Deduct multi-resource cost
    const cost = BUILDING_COSTS[selectedBuilding];
    deductCost(playerResources, cost);

    // Determine initial recipe
    let selectedRecipe: string | null = null;
    if (selectedBuilding === 'forge') {
      selectedRecipe = 'purify_arcstone';
    } else if (selectedBuilding === 'workbench') {
      selectedRecipe = 'forge_cogwheel';
    } else if (selectedBuilding === 'arcane_study') {
      selectedRecipe = 'study_arcane_ingot';
    }

    // Mana buildings have no rotation
    const isManaBuilding =
      selectedBuilding === 'mana_well' ||
      selectedBuilding === 'mana_obelisk' ||
      selectedBuilding === 'mana_tower';

    const building: Building = {
      id: buildingIdCounter,
      type: selectedBuilding,
      x: cursorX,
      y: cursorY,
      rotation: isManaBuilding ? 0 : this.ghostRotation,
      inputBuffer: new Map(),
      outputBuffer: new Map(),
      craftProgress: 0,
      selectedRecipe,
      manaAccumulator: 0,
      connected: false,
      ticksStarved: 0,
      ticksBlocked: 0,
    };

    // Create sprite
    const sprite = this.scene.add.sprite(
      cursorX * TILE_SIZE + (def.width * TILE_SIZE) / 2,
      cursorY * TILE_SIZE + (def.height * TILE_SIZE) / 2,
      'sprites',
      selectedBuilding
    );
    sprite.setOrigin(0.5, 0.5);
    sprite.setDisplaySize(def.width * TILE_SIZE, def.height * TILE_SIZE);
    sprite.setAngle(building.rotation * 90);
    sprite.setDepth(10);

    return { building, sprite };
  }

  /**
   * Clear selection state (ghost sprite and rotation)
   */
  clearSelection(): void {
    this.ghostRotation = 0;
    if (this.ghostSprite) {
      this.ghostSprite.destroy();
      this.ghostSprite = null;
    }
    this.destroyArrows();
  }

  private destroyArrows(): void {
    if (this.arrowGraphics) {
      this.arrowGraphics.destroy();
      this.arrowGraphics = null;
    }
  }

  /**
   * Draw a pixel-art arrow (shaft + triangular head) outside the building edge.
   * When inward=true, the arrow points toward the building (for inputs).
   */
  private drawArrow(
    bx: number,
    by: number,
    bw: number,
    bh: number,
    direction: Direction,
    inward: boolean
  ): void {
    if (!this.arrowGraphics) return;
    const g = this.arrowGraphics;
    const gap = 2; // gap past building edge (clears cursor stroke)
    const shaftLen = 6;
    const shaftThick = 4;
    const headLen = 6;
    const headHalf = 6; // half-height of arrowhead

    switch (direction) {
      case 'right': {
        const ax = bx + bw + gap;
        const ay = by + bh / 2;
        if (inward) {
          // Arrow on right side pointing left (into building)
          g.fillRect(ax + headLen, ay - shaftThick / 2, shaftLen, shaftThick);
          g.fillTriangle(ax + headLen, ay - headHalf, ax, ay, ax + headLen, ay + headHalf);
        } else {
          g.fillRect(ax, ay - shaftThick / 2, shaftLen, shaftThick);
          g.fillTriangle(
            ax + shaftLen,
            ay - headHalf,
            ax + shaftLen + headLen,
            ay,
            ax + shaftLen,
            ay + headHalf
          );
        }
        break;
      }
      case 'left': {
        const ax = bx - gap;
        const ay = by + bh / 2;
        if (inward) {
          // Arrow on left side pointing right (into building)
          g.fillRect(ax - headLen - shaftLen, ay - shaftThick / 2, shaftLen, shaftThick);
          g.fillTriangle(ax - headLen, ay - headHalf, ax, ay, ax - headLen, ay + headHalf);
        } else {
          g.fillRect(ax - shaftLen, ay - shaftThick / 2, shaftLen, shaftThick);
          g.fillTriangle(
            ax - shaftLen,
            ay - headHalf,
            ax - shaftLen - headLen,
            ay,
            ax - shaftLen,
            ay + headHalf
          );
        }
        break;
      }
      case 'down': {
        const ax = bx + bw / 2;
        const ay = by + bh + gap;
        if (inward) {
          // Arrow on bottom side pointing up (into building)
          g.fillRect(ax - shaftThick / 2, ay + headLen, shaftThick, shaftLen);
          g.fillTriangle(ax - headHalf, ay + headLen, ax, ay, ax + headHalf, ay + headLen);
        } else {
          g.fillRect(ax - shaftThick / 2, ay, shaftThick, shaftLen);
          g.fillTriangle(
            ax - headHalf,
            ay + shaftLen,
            ax,
            ay + shaftLen + headLen,
            ax + headHalf,
            ay + shaftLen
          );
        }
        break;
      }
      case 'up': {
        const ax = bx + bw / 2;
        const ay = by - gap;
        if (inward) {
          // Arrow on top side pointing down (into building)
          g.fillRect(ax - shaftThick / 2, ay - headLen - shaftLen, shaftThick, shaftLen);
          g.fillTriangle(ax - headHalf, ay - headLen, ax, ay, ax + headHalf, ay - headLen);
        } else {
          g.fillRect(ax - shaftThick / 2, ay - shaftLen, shaftThick, shaftLen);
          g.fillTriangle(
            ax - headHalf,
            ay - shaftLen,
            ax,
            ay - shaftLen - headLen,
            ax + headHalf,
            ay - shaftLen
          );
        }
        break;
      }
    }
  }

  /**
   * Reset ghost rotation (called when selecting a new building type)
   */
  resetRotation(): void {
    this.ghostRotation = 0;
  }
}
