import Phaser from 'phaser';
import { TILE_SIZE, THEME } from '../config';
import { Building } from '../types';
import { BUILDING_DEFINITIONS } from '../data/buildings';
import { getBufferTotal } from '../utils';

/**
 * Manages buffer indicator text overlays on buildings.
 * Shows input/output counts as "in/out" labels above buildings.
 */
export class BufferIndicators {
  private scene: Phaser.Scene;
  private indicators: Map<number, Phaser.GameObjects.Text> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Update indicator visibility and text for all buildings.
   * Shows indicators when showAll is true or the building is under the cursor.
   */
  update(buildings: Building[], cursorBuilding: Building | null, showAll: boolean): void {
    for (const building of buildings) {
      let indicator = this.indicators.get(building.id);

      const inputCount = getBufferTotal(building.inputBuffer);
      const outputCount = getBufferTotal(building.outputBuffer);

      const shouldShow =
        showAll || (building === cursorBuilding && (inputCount > 0 || outputCount > 0));

      if (shouldShow) {
        const def = BUILDING_DEFINITIONS[building.type];
        const x = building.x * TILE_SIZE + (def.width * TILE_SIZE) / 2;
        const y = building.y * TILE_SIZE - 4;
        const text = `${inputCount}/${outputCount}`;

        if (!indicator) {
          indicator = this.scene.add.text(x, y, text, {
            fontSize: '8px',
            color: THEME.buffer.text,
            backgroundColor: THEME.buffer.bg,
            padding: { x: 1, y: 0 },
          });
          indicator.setOrigin(0.5, 1);
          indicator.setDepth(200);
          this.indicators.set(building.id, indicator);
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

  /**
   * Remove and destroy the indicator for a specific building
   */
  removeForBuilding(buildingId: number): void {
    const indicator = this.indicators.get(buildingId);
    if (indicator) {
      indicator.destroy();
      this.indicators.delete(buildingId);
    }
  }

  /**
   * Destroy all indicators. Used during world reset.
   */
  clearAll(): void {
    for (const [, indicator] of this.indicators) {
      indicator.destroy();
    }
    this.indicators.clear();
  }
}
