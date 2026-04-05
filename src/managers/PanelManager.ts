export type PanelType =
  | 'menu'
  | 'inventory'
  | 'guide'
  | 'objectives'
  | 'research'
  | 'build'
  | 'upgrades';

/**
 * Manages modal panel state. Only one panel can be open at a time.
 */
export class PanelManager {
  private activePanel: PanelType | null = null;

  /** Toggle a panel. Blocked if a different panel is already open. Returns true if state changed. */
  toggle(panel: PanelType): boolean {
    if (this.activePanel === panel) {
      this.activePanel = null;
      return true;
    }
    if (this.activePanel !== null) return false;
    this.activePanel = panel;
    return true;
  }

  isOpen(panel: PanelType): boolean {
    return this.activePanel === panel;
  }

  /** Returns which panel was closed, or null if nothing was open. */
  close(): PanelType | null {
    const was = this.activePanel;
    this.activePanel = null;
    return was;
  }

  getActivePanel(): PanelType | null {
    return this.activePanel;
  }
}
