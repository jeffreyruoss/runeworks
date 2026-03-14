import { UiScene, ConstraintMode, Progress } from 'phaser-pixui';
import { CANVAS_WIDTH, CANVAS_HEIGHT, THEME } from '../config';
import { GameMode } from '../types';
import { uiTheme, FONT_SM, FONT_MD, C } from '../ui-theme';
import { blinkTransition } from '../audio';

const LOAD_DURATION = 1500; // ms to fill the bar

const TIPS: string[] = [
  'Use ESDF to move the cursor around the grid',
  'Hold Shift + ESDF to jump 5 tiles at a time',
  'Press B to open the build menu',
  'Rotate buildings with R before placing them',
  'Buildings output in the direction they face',
  'Place quarries on crystal veins to extract ore',
  'Forges smelt raw ore into refined ingots',
  'Connect buildings by placing them adjacent to each other',
  'Press P to pause or resume the simulation',
  'Use . and , to speed up or slow down time',
  'Press O to check your stage objectives',
  'Press G to open the guide for a full reference',
  'Chests store overflow items between buildings',
  'Mana wells power nearby buildings for faster production',
  'Press H to see buffer contents on all buildings',
];

/**
 * Transition screen between mode select and gameplay.
 * Shows a pixui progress bar and rotating game tips.
 */
export class LoadingScene extends UiScene {
  private progress!: Progress;
  private tipText!: Phaser.GameObjects.BitmapText;
  private promptText!: Phaser.GameObjects.BitmapText;
  private nextTipText!: Phaser.GameObjects.BitmapText;
  private promptStartText!: Phaser.GameObjects.BitmapText;
  private elapsed = 0;
  private tipIndex = 0;
  private ready = false;
  private starting = false;
  private mode: GameMode = 'tutorial';

  constructor() {
    super({
      key: 'LoadingScene',
      viewportConstraints: {
        mode: ConstraintMode.Minimum,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      },
      theme: uiTheme,
    });
  }

  init(data: { mode: GameMode }): void {
    this.mode = data.mode;
    this.elapsed = 0;
    this.ready = false;
    this.starting = false;
  }

  create(): void {
    super.create();

    const vp = this.viewport;
    const cx = Math.floor(vp.width / 2);
    const cy = Math.floor(vp.height / 2);

    // Background
    const bg = this.add.rectangle(0, 0, 9999, 9999, THEME.modeSelect.bg);
    bg.setOrigin(0, 0);

    // "Loading" header
    const header = this.add.bitmapText(cx, cy - 40, FONT_MD, 'PREPARING THE RUNEFORGE...');
    header.setOrigin(0.5, 0.5);
    header.setTint(C.light);

    // Progress bar — positioned at viewport center
    const barW = 200;
    const barH = 16;
    this.progress = this.insert.topLeft.progress({
      x: cx - barW / 2,
      y: cy - barH / 2,
      width: barW,
      height: barH,
    });
    this.progress.value = 0;

    // Tip text — below center
    this.tipIndex = Math.floor(Math.random() * TIPS.length);
    this.tipText = this.add.bitmapText(cx, cy + 40, FONT_SM, TIPS[this.tipIndex]);
    this.tipText.setOrigin(0.5, 0.5);
    this.tipText.setTint(C.muted);

    // Prompts — hidden until bar fills
    this.nextTipText = this.add.bitmapText(cx, cy + 65, FONT_SM, 'N: Next Tip');
    this.nextTipText.setOrigin(0.5, 0.5);
    this.nextTipText.setTint(C.muted);
    this.nextTipText.setVisible(false);

    // "Enter" in cyan, ": Start" in default — two separate text objects
    const enterText = this.add.bitmapText(0, cy + 90, FONT_SM, 'Enter');
    enterText.setOrigin(1, 0.5);
    enterText.setTint(C.active);
    enterText.setVisible(false);

    const startText = this.add.bitmapText(0, cy + 90, FONT_SM, ': Start');
    startText.setOrigin(0, 0.5);
    startText.setTint(C.default);
    startText.setVisible(false);

    // Center the pair
    const totalW = enterText.width + startText.width;
    enterText.setX(cx - totalW / 2 + enterText.width);
    startText.setX(cx - totalW / 2 + enterText.width);

    this.promptText = enterText;
    this.promptStartText = startText;

    // Keyboard input
    this.input.keyboard!.on('keydown', this.handleKey, this);
  }

  shutdown(): void {
    this.input.keyboard!.off('keydown', this.handleKey, this);
  }

  private handleKey(event: KeyboardEvent): void {
    if (this.starting) return;
    if (event.code === 'KeyN') {
      this.nextTip();
    }
    if (!this.ready) return;
    if (event.code === 'Enter' || event.code === 'Space') {
      this.startGame();
    }
  }

  private nextTip(): void {
    this.tipIndex = (this.tipIndex + 1) % TIPS.length;
    this.tipText.setText(TIPS[this.tipIndex]);
  }

  private startGame(): void {
    if (this.starting) return;
    this.starting = true;
    this.input.keyboard!.off('keydown', this.handleKey, this);

    blinkTransition(
      this,
      [
        { obj: this.promptText, tint: C.active },
        { obj: this.promptStartText, tint: C.default },
      ],
      () => {
        this.scene.start('GameScene', { mode: this.mode });
        this.scene.start('UIScene', { mode: this.mode });
      }
    );
  }

  update(_time: number, delta: number): void {
    if (this.ready) return;

    this.elapsed += delta;

    // Update progress bar
    const t = Math.min(this.elapsed / LOAD_DURATION, 1);
    this.progress.value = t;
    this.progress.update();

    // Show prompt when bar is full
    if (t >= 1) {
      this.ready = true;
      this.promptText.setVisible(true);
      this.promptStartText.setVisible(true);
      this.nextTipText.setVisible(true);
    }
  }
}
