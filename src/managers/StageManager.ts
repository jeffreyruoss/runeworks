import { BuildingType, GameMode, ItemType, SimulationState } from '../types';
import { getStage, STAGES } from '../data/stages';
import { TutorialStage, TUTORIALS } from '../data/tutorials';

/** Buildings that require stage-based unlocks (derived from stages data) */
const STAGE_GATED_BUILDINGS = new Set<BuildingType>(
  STAGES.flatMap((s) => s.unlockedBuildings ?? [])
);

export interface ObjectiveProgress {
  item: ItemType;
  required: number;
  produced: number;
}

interface SimulationRef {
  getState(): SimulationState;
  setPaused(paused: boolean): void;
  resetItemsProduced(): void;
}

/**
 * Manages stage progression, objective tracking, and completion flow.
 * GameScene delegates stage-related state and logic here.
 */
export class StageManager {
  private simulation: SimulationRef;
  private currentStage = 1;
  private stageCompleteShown = false;
  private objectivesOpen = false;
  private cachedComplete = false;
  private mode: GameMode = 'stages';
  private tutorialStage: TutorialStage | null = null;
  private tutorialChecksComplete = new Set<string>();

  constructor(simulation: SimulationRef) {
    this.simulation = simulation;
  }

  setMode(mode: GameMode): void {
    this.mode = mode;
  }

  getMode(): GameMode {
    return this.mode;
  }

  loadTutorialStage(tutorial: TutorialStage): void {
    this.tutorialStage = tutorial;
    this.stageCompleteShown = false;
    this.cachedComplete = false;
    this.currentStage = tutorial.id;
    this.tutorialChecksComplete.clear();
  }

  getTutorialStage(): TutorialStage | null {
    return this.tutorialStage;
  }

  /** Mark a tutorial check as complete. Returns true if newly completed. */
  markCheckComplete(checkId: string): boolean {
    if (this.tutorialChecksComplete.has(checkId)) return false;
    this.tutorialChecksComplete.add(checkId);
    return true;
  }

  getCompletedChecks(): ReadonlySet<string> {
    return this.tutorialChecksComplete;
  }

  /** True if this tutorial stage has no objectives and no checks (just press Enter) */
  isContinueOnly(): boolean {
    if (this.mode !== 'tutorial' || !this.tutorialStage) return false;
    const { checks, objectives } = this.tutorialStage;
    return (!checks || checks.length === 0) && objectives.length === 0;
  }

  /** Called when an item is produced — checks if stage goals are met. */
  checkStageComplete(): void {
    if (this.mode === 'sandbox') return;
    if (this.stageCompleteShown) return;
    if (!this.isStageComplete()) return;

    this.stageCompleteShown = true;
    this.cachedComplete = true;
    this.simulation.setPaused(true);
  }

  /** Advance to the next stage after the player confirms completion. */
  continueToNextStage(): boolean {
    if (!this.stageCompleteShown) return false;

    // Guard: don't advance past the last stage
    if (!getStage(this.currentStage + 1)) return false;

    this.currentStage++;
    this.stageCompleteShown = false;
    this.cachedComplete = false;
    this.simulation.resetItemsProduced();
    this.simulation.setPaused(false);
    return true;
  }

  getObjectiveProgress(): ObjectiveProgress[] {
    if (this.mode === 'sandbox') return [];

    if (this.mode === 'tutorial' && this.tutorialStage) {
      const produced = this.simulation.getState().itemsProduced;
      return this.tutorialStage.objectives.map((obj) => ({
        item: obj.item,
        required: obj.count,
        produced: produced.get(obj.item) || 0,
      }));
    }

    const stage = getStage(this.currentStage);
    if (!stage) return [];
    const produced = this.simulation.getState().itemsProduced;
    return stage.objectives.map((obj) => ({
      item: obj.item,
      required: obj.count,
      produced: produced.get(obj.item) || 0,
    }));
  }

  isStageComplete(): boolean {
    if (this.mode === 'sandbox') return false;
    if (this.cachedComplete) return true;

    if (this.mode === 'tutorial' && this.tutorialStage) {
      const { checks, objectives } = this.tutorialStage;
      // Continue-only stages are never "complete" — they advance on Enter directly
      if ((!checks || checks.length === 0) && objectives.length === 0) return false;
      // All checks must pass (if any)
      if (checks && checks.length > 0) {
        if (!checks.every((c) => this.tutorialChecksComplete.has(c.id))) return false;
      }
      // All objectives must pass (if any)
      if (objectives.length > 0) {
        const progress = this.getObjectiveProgress();
        if (!progress.every((p) => p.produced >= p.required)) return false;
      }
      return true;
    }

    const progress = this.getObjectiveProgress();
    return progress.length > 0 && progress.every((p) => p.produced >= p.required);
  }

  isLastStageComplete(): boolean {
    if (this.mode === 'tutorial') {
      return this.currentStage === TUTORIALS.length && this.isStageComplete();
    }
    return this.currentStage === STAGES.length && this.isStageComplete();
  }

  toggleObjectives(): void {
    this.objectivesOpen = !this.objectivesOpen;
  }

  closeObjectives(): void {
    this.objectivesOpen = false;
  }

  isObjectivesOpen(): boolean {
    return this.objectivesOpen;
  }

  isStageCompleteShown(): boolean {
    return this.stageCompleteShown;
  }

  getCurrentStage(): number {
    return this.currentStage;
  }

  getCurrentStageName(): string {
    if (this.mode === 'tutorial' && this.tutorialStage) {
      return this.tutorialStage.name;
    }
    if (this.mode === 'sandbox') return 'Sandbox';
    const stage = getStage(this.currentStage);
    return stage?.name ?? `Stage ${this.currentStage}`;
  }

  /** Check if a building type has been unlocked by any stage up to the current one */
  isBuildingUnlockedByStage(type: BuildingType): boolean {
    if (this.mode === 'sandbox') return true;

    if (this.mode === 'tutorial') {
      if (!this.tutorialStage) return false;
      return this.tutorialStage.unlockedBuildings.includes(type);
    }

    if (!STAGE_GATED_BUILDINGS.has(type)) return true;

    for (let i = 1; i <= this.currentStage; i++) {
      const stage = getStage(i);
      if (stage?.unlockedBuildings?.includes(type)) return true;
    }
    return false;
  }

  /** Set starting stage directly (dev override) */
  setStartStage(stage: number): void {
    this.currentStage = stage;
  }

  /** Reset stage state for a fresh run */
  resetForNewGame(): void {
    this.currentStage = 1;
    this.stageCompleteShown = false;
    this.cachedComplete = false;
    this.objectivesOpen = false;
    this.tutorialStage = null;
    this.tutorialChecksComplete.clear();
  }
}
