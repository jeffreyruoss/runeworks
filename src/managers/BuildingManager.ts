import { Building } from '../types';
import { BUILDING_DEFINITIONS } from '../data/buildings';
import { BufferIndicators } from './BufferIndicators';

/**
 * Manages building state: storage, creation, deletion, and sprite lifecycle.
 * Extracted from GameScene to keep it under the 300-line target.
 */
export class BuildingManager {
  private buildings: Building[] = [];
  private buildingSprites: Map<number, Phaser.GameObjects.Sprite> = new Map();
  private buildingIdCounter = 0;

  getBuildings(): Building[] {
    return this.buildings;
  }

  getNextId(): number {
    return this.buildingIdCounter;
  }

  /**
   * Add a placed building and its sprite to the manager.
   */
  addBuilding(building: Building, sprite: Phaser.GameObjects.Sprite): void {
    this.buildingIdCounter = Math.max(this.buildingIdCounter, building.id + 1);
    this.buildings.push(building);
    this.buildingSprites.set(building.id, sprite);
  }

  /**
   * Delete the building at the cursor position.
   * Returns true if a building was deleted.
   */
  deleteAtCursor(cursorX: number, cursorY: number, bufferIndicators: BufferIndicators): boolean {
    const index = this.buildings.findIndex((b) => {
      const def = BUILDING_DEFINITIONS[b.type];
      return (
        cursorX >= b.x && cursorX < b.x + def.width && cursorY >= b.y && cursorY < b.y + def.height
      );
    });

    if (index === -1) return false;

    const building = this.buildings[index];
    const sprite = this.buildingSprites.get(building.id);
    sprite?.destroy();
    this.buildingSprites.delete(building.id);
    bufferIndicators.removeForBuilding(building.id);
    this.buildings.splice(index, 1);
    return true;
  }

  /**
   * Destroy all buildings, sprites, and indicators. Resets state completely.
   */
  clearAll(bufferIndicators: BufferIndicators): void {
    for (const [, sprite] of this.buildingSprites) {
      sprite.destroy();
    }
    this.buildingSprites.clear();
    bufferIndicators.clearAll();
    this.buildings.length = 0;
    this.buildingIdCounter = 0;
  }
}
