import Phaser from 'phaser';

export interface GameKeys {
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
  SPACE: Phaser.Input.Keyboard.Key;
  BACKSPACE: Phaser.Input.Keyboard.Key;
  R: Phaser.Input.Keyboard.Key;
  P: Phaser.Input.Keyboard.Key;
  I: Phaser.Input.Keyboard.Key;
  H: Phaser.Input.Keyboard.Key;
  C: Phaser.Input.Keyboard.Key;
  ONE: Phaser.Input.Keyboard.Key;
  TWO: Phaser.Input.Keyboard.Key;
  THREE: Phaser.Input.Keyboard.Key;
  FOUR: Phaser.Input.Keyboard.Key;
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
  selectBuilding: (type: 'quarry' | 'forge' | 'workbench' | 'coffer') => void;
  handleAction: () => void;
  deleteBuilding: () => void;
  rotate: () => void;
  handleEsc: () => void;
  togglePause: () => void;
  toggleInventory: () => void;
  toggleBufferDisplay: () => void;
  cycleRecipe: () => void;
  changeSpeed: (delta: number) => void;
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
      W: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      SPACE: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      BACKSPACE: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE),
      R: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      P: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),
      I: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I),
      H: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H),
      C: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C),
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

    this.bindKeys(callbacks);
  }

  private bindKeys(cb: InputCallbacks): void {
    // Movement
    this.keys.W.on('down', () => cb.moveCursor(0, -1));
    this.keys.A.on('down', () => cb.moveCursor(-1, 0));
    this.keys.S.on('down', () => cb.moveCursor(0, 1));
    this.keys.D.on('down', () => cb.moveCursor(1, 0));

    // Building selection
    this.keys.ONE.on('down', () => cb.selectBuilding('quarry'));
    this.keys.TWO.on('down', () => cb.selectBuilding('forge'));
    this.keys.THREE.on('down', () => cb.selectBuilding('workbench'));
    this.keys.FOUR.on('down', () => cb.selectBuilding('coffer'));

    // Actions
    this.keys.SPACE.on('down', () => cb.handleAction());
    this.keys.ENTER.on('down', () => cb.handleAction());
    this.keys.BACKSPACE.on('down', () => cb.deleteBuilding());
    this.keys.R.on('down', () => cb.rotate());
    this.keys.ESC.on('down', () => cb.handleEsc());

    // Toggle controls
    this.keys.P.on('down', () => cb.togglePause());
    this.keys.I.on('down', () => cb.toggleInventory());
    this.keys.H.on('down', () => cb.toggleBufferDisplay());
    this.keys.C.on('down', () => cb.cycleRecipe());

    // Speed controls
    this.keys.COMMA.on('down', () => cb.changeSpeed(-1));
    this.keys.PERIOD.on('down', () => cb.changeSpeed(1));
  }
}
