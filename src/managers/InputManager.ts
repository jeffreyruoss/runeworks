import Phaser from 'phaser';
import { BuildingType } from '../types';

export interface GameKeys {
  E: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
  F: Phaser.Input.Keyboard.Key;
  B: Phaser.Input.Keyboard.Key;
  Q: Phaser.Input.Keyboard.Key;
  W: Phaser.Input.Keyboard.Key;
  C: Phaser.Input.Keyboard.Key;
  SPACE: Phaser.Input.Keyboard.Key;
  BACKSPACE: Phaser.Input.Keyboard.Key;
  R: Phaser.Input.Keyboard.Key;
  P: Phaser.Input.Keyboard.Key;
  I: Phaser.Input.Keyboard.Key;
  H: Phaser.Input.Keyboard.Key;
  X: Phaser.Input.Keyboard.Key;
  M: Phaser.Input.Keyboard.Key;
  O: Phaser.Input.Keyboard.Key;
  ESC: Phaser.Input.Keyboard.Key;
  SHIFT: Phaser.Input.Keyboard.Key;
  ENTER: Phaser.Input.Keyboard.Key;
  COMMA: Phaser.Input.Keyboard.Key;
  PERIOD: Phaser.Input.Keyboard.Key;
}

/**
 * Callbacks that GameScene provides for input actions.
 * InputManager wires keyboard events to these handlers.
 */
export interface InputCallbacks {
  moveCursor: (dx: number, dy: number) => void;
  selectBuilding: (type: BuildingType) => void;
  handleAction: () => void;
  deleteBuilding: () => void;
  rotate: () => void;
  handleEsc: () => void;
  togglePause: () => void;
  toggleInventory: () => void;
  toggleBufferDisplay: () => void;
  cycleRecipe: () => void;
  changeSpeed: (delta: number) => void;
  toggleBuildMode: () => void;
  toggleMenu: () => void;
  toggleObjectives: () => void;
}

/**
 * Manages keyboard input registration and key references.
 * Delegates all actions to callbacks provided by GameScene.
 */
export class InputManager {
  readonly keys: GameKeys;

  constructor(scene: Phaser.Scene, callbacks: InputCallbacks) {
    const keyboard = scene.input.keyboard!;

    this.keys = {
      E: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      S: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      F: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F),
      B: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B),
      Q: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      W: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      C: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C),
      SPACE: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      BACKSPACE: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE),
      R: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      P: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),
      I: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I),
      H: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H),
      X: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X),
      M: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M),
      O: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O),
      ESC: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
      SHIFT: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      ENTER: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
      COMMA: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.COMMA),
      PERIOD: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PERIOD),
    };

    this.bindKeys(callbacks);
  }

  private bindKeys(cb: InputCallbacks): void {
    // Movement (ESDF)
    this.keys.E.on('down', () => cb.moveCursor(0, -1));
    this.keys.S.on('down', () => cb.moveCursor(-1, 0));
    this.keys.D.on('down', () => cb.moveCursor(0, 1));
    this.keys.F.on('down', () => cb.moveCursor(1, 0));

    // Build mode
    this.keys.B.on('down', () => cb.toggleBuildMode());

    // Build mode selection: Q=quarry, W=workbench
    // F (forge) and C (chest) reuse moveCursor/cycleRecipe bindings;
    // GameScene intercepts them when buildModeActive is true
    this.keys.Q.on('down', () => cb.selectBuilding('quarry'));
    this.keys.W.on('down', () => cb.selectBuilding('workbench'));

    // Actions
    this.keys.SPACE.on('down', () => cb.handleAction());
    this.keys.ENTER.on('down', () => cb.handleAction());
    this.keys.BACKSPACE.on('down', () => cb.deleteBuilding());
    this.keys.R.on('down', () => cb.rotate());
    this.keys.ESC.on('down', () => cb.handleEsc());
    this.keys.X.on('down', () => cb.handleEsc());
    this.keys.M.on('down', () => cb.toggleMenu());

    // Toggle controls
    this.keys.P.on('down', () => cb.togglePause());
    this.keys.O.on('down', () => cb.toggleObjectives());
    this.keys.I.on('down', () => cb.toggleInventory());
    this.keys.H.on('down', () => cb.toggleBufferDisplay());
    this.keys.C.on('down', () => cb.cycleRecipe());

    // Speed controls
    this.keys.COMMA.on('down', () => cb.changeSpeed(-1));
    this.keys.PERIOD.on('down', () => cb.changeSpeed(1));
  }
}
