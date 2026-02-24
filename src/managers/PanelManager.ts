import { StageManager } from './StageManager';

export type PanelType = 'menu' | 'inventory' | 'guide' | 'objectives' | 'research';

/**
 * Manages open/close state and mutual exclusion for UI panels.
 * Full-screen panels (guide, objectives) close all others when opened.
 */
export class PanelManager {
  private menuOpen = false;
  private inventoryOpen = false;
  private guideOpen = false;
  private researchOpen = false;

  private stageManager: StageManager;

  constructor(stageManager: StageManager) {
    this.stageManager = stageManager;
  }

  isMenuOpen(): boolean {
    return this.menuOpen;
  }

  isInventoryOpen(): boolean {
    return this.inventoryOpen;
  }

  isGuideOpen(): boolean {
    return this.guideOpen;
  }

  isResearchOpen(): boolean {
    return this.researchOpen;
  }

  isObjectivesOpen(): boolean {
    return this.stageManager.isObjectivesOpen();
  }

  openMenu(): void {
    this.menuOpen = true;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  /** Returns the new inventory open state. */
  toggleInventory(): boolean {
    this.inventoryOpen = !this.inventoryOpen;
    return this.inventoryOpen;
  }

  toggleGuide(): void {
    if (!this.guideOpen) this.closeAll();
    this.guideOpen = !this.guideOpen;
  }

  toggleResearch(): void {
    if (!this.researchOpen) this.closeAll();
    this.researchOpen = !this.researchOpen;
  }

  toggleObjectives(): void {
    if (!this.stageManager.isObjectivesOpen()) this.closeAll();
    this.stageManager.toggleObjectives();
  }

  /** Close the topmost open panel. Returns which was closed, or null. */
  closeTopPanel(): PanelType | null {
    if (this.menuOpen) {
      this.menuOpen = false;
      return 'menu';
    }
    if (this.researchOpen) {
      this.researchOpen = false;
      return 'research';
    }
    if (this.guideOpen) {
      this.guideOpen = false;
      return 'guide';
    }
    if (this.stageManager.isObjectivesOpen()) {
      this.stageManager.closeObjectives();
      return 'objectives';
    }
    if (this.inventoryOpen) {
      this.inventoryOpen = false;
      return 'inventory';
    }
    return null;
  }

  closeAll(): void {
    this.menuOpen = false;
    this.inventoryOpen = false;
    this.guideOpen = false;
    this.researchOpen = false;
    if (this.stageManager.isObjectivesOpen()) this.stageManager.closeObjectives();
  }
}
