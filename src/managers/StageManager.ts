import { BuildingType, ItemType, SimulationState } from '../types';
import { getStage, STAGES } from '../data/stages';

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

  constructor(simulation: SimulationRef) {
    this.simulation = simulation;
  }

  /** Called when an item is produced — checks if stage goals are met. */
  checkStageComplete(): void {
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
    if (this.cachedComplete) return true;
    const progress = this.getObjectiveProgress();
    return progress.length > 0 && progress.every((p) => p.produced >= p.required);
  }

  isLastStageComplete(): boolean {
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

  /** Check if a building type has been unlocked by any stage up to the current one */
  isBuildingUnlockedByStage(type: BuildingType): boolean {
    const STAGE_GATED: BuildingType[] = ['mana_well', 'mana_obelisk', 'mana_tower'];
    if (!STAGE_GATED.includes(type)) return true;

    for (let i = 1; i <= this.currentStage; i++) {
      const stage = getStage(i);
      if (stage?.unlockedBuildings?.includes(type)) return true;
    }
    return false;
  }
}
