import Phaser from 'phaser';
import { TILE_SIZE, GRID_WIDTH, GRID_HEIGHT, BUILDING_COSTS } from '../config';
import { Building, BuildingType, PlayerResources, TerrainType } from '../types';
import { BUILDING_DEFINITIONS } from '../data/buildings';
import { QUARRIABLE_TERRAIN } from '../data/terrain';
import { canAfford, deductCost } from '../utils';

/**
 * Manages building placement: ghost preview sprite, placement validation,
 * and building creation. Owns ghost sprite and rotation state.
 */
export class BuildingPlacer {
  private scene: Phaser.Scene;
  private ghostSprite: Phaser.GameObjects.Sprite | null = null;
  private ghostRotation = 0;

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

    if (!selectedBuilding) return;

    const def = BUILDING_DEFINITIONS[selectedBuilding];
    this.ghostSprite = this.scene.add.sprite(0, 0, 'sprites', selectedBuilding);
    this.ghostSprite.setOrigin(0, 0);
    this.ghostSprite.setAlpha(0.6);
    this.ghostSprite.setDepth(50);
    this.ghostSprite.setDisplaySize(def.width * TILE_SIZE, def.height * TILE_SIZE);
    this.ghostSprite.setAngle(this.ghostRotation * 90);
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

    this.ghostSprite.setPosition(x + (def.width * TILE_SIZE) / 2, y + (def.height * TILE_SIZE) / 2);
    this.ghostSprite.setOrigin(0.5, 0.5);
    this.ghostSprite.setTint(canPlace ? 0x00ff00 : 0xff0000);
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
  }

  /**
   * Reset ghost rotation (called when selecting a new building type)
   */
  resetRotation(): void {
    this.ghostRotation = 0;
  }
}
