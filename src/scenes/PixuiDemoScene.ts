import { UiScene, ConstraintMode, Progress } from 'phaser-pixui';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config';
import { uiTheme, FONT_SM, FONT_MD, FONT_LG, UI_ATLAS } from '../ui-theme';

const SCROLL_SPEED = 4;

/**
 * Temporary demo scene showcasing all phaser-pixui components.
 * E/D or Arrow keys to scroll. Escape to return.
 */
export class PixuiDemoScene extends UiScene {
  private progressBars: Progress[] = [];
  private progressDir: number[] = [];
  private contentHeight = 0;
  private scrollContainer!: Phaser.GameObjects.Container;
  private bgRect!: Phaser.GameObjects.Rectangle;
  private scrollOffset = 0;
  private keysHeld = { up: false, down: false };

  constructor() {
    super({
      key: 'PixuiDemoScene',
      viewportConstraints: {
        mode: ConstraintMode.Minimum,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      },
      theme: uiTheme,
    });
  }

  create(): void {
    super.create();

    const vp = this.viewport;
    const cx = Math.floor(vp.width / 2);

    // Background (fixed, not scrolled)
    this.bgRect = this.add.rectangle(vp.width / 2, vp.height / 2, vp.width, vp.height, 0x0d0b1a, 1);
    this.bgRect.setScrollFactor(0);
    this.bgRect.setDepth(-1);

    // Scrollable container for all demo content
    this.scrollContainer = this.add.container(0, 0);

    let y = 12;

    // Title
    y = this.addText(cx, y, FONT_LG, 'PIXUI COMPONENT DEMO', 0x4af0ff, 0.5);
    y = this.addText(cx, y, FONT_SM, 'E/D or Arrows to scroll  |  ESC to return', 0x605880, 0.5);
    y += 10;

    // ─── SECTION 1: Bitmap Fonts ───
    y = this.drawSection(y, 'BITMAP FONTS', 0x4af0ff);
    y = this.addText(
      20,
      y,
      FONT_SM,
      'mana_roots (SM) - The quick brown fox jumps over the lazy dog',
      0xe8e0f0
    );
    y += 4;
    y = this.addText(20, y, FONT_MD, 'mana_trunk (MD) - ABCDEFGHIJKLMNOP', 0xe8e0f0);
    y += 4;
    y = this.addText(20, y, FONT_LG, 'mana_branches (LG) - Title Font', 0xe8e0f0);
    y += 8;

    // ─── SECTION 2: Theme Palette Colors ───
    y = this.drawSection(y, 'THEME PALETTE', 0xffaa44);

    const palette = uiTheme.palette;
    const colorNames = Object.keys(palette);
    const swatchSize = 14;
    let sx = 20;
    for (const name of colorNames) {
      const color = palette[name];
      const swatch = this.add.rectangle(
        sx + swatchSize / 2,
        y + swatchSize / 2,
        swatchSize,
        swatchSize,
        color,
        1
      );
      swatch.setOrigin(0.5, 0.5);
      this.scrollContainer.add(swatch);

      const label = this.add.bitmapText(sx + swatchSize + 4, y + 1, FONT_SM, name);
      label.setTint(color);
      this.scrollContainer.add(label);

      sx += swatchSize + label.width + 16;
      if (sx > vp.width - 80) {
        sx = 20;
        y += 20;
      }
    }
    y += 24;

    // ─── SECTION 3: Font Tinting ───
    y = this.drawSection(y, 'TEXT TINTING', 0x44ff88);

    const tintColors = [
      { label: 'Default', color: 0xe8e0f0 },
      { label: 'Cyan', color: 0x4af0ff },
      { label: 'Green', color: 0x44ff88 },
      { label: 'Yellow', color: 0xffdd44 },
      { label: 'Red', color: 0xff5566 },
      { label: 'Purple', color: 0xcc88ff },
      { label: 'Orange', color: 0xffaa44 },
      { label: 'Muted', color: 0x605880 },
    ];
    let tx = 20;
    for (const { label, color } of tintColors) {
      const t = this.add.bitmapText(tx, y, FONT_SM, label);
      t.setTint(color);
      this.scrollContainer.add(t);
      tx += t.width + 14;
    }
    y += 22;

    // ─── SECTION 4: 9-Slice Frames (default) ───
    y = this.drawSection(y, '9-SLICE FRAMES', 0xcc88ff);

    const frameNames = ['frame_dark', 'frame_light', 'frame_bright'];
    const frameW = 130;
    const frameH = 70;
    const frameSpacing = 10;
    const framesStartX = 20;

    for (let i = 0; i < frameNames.length; i++) {
      const fx = framesStartX + i * (frameW + frameSpacing);
      const frame = this.add.nineslice(
        fx + frameW / 2,
        y + frameH / 2,
        UI_ATLAS,
        frameNames[i],
        frameW,
        frameH
      );
      frame.setOrigin(0.5, 0.5);
      this.scrollContainer.add(frame);

      const label = this.add.bitmapText(
        fx + frameW / 2,
        y + frameH / 2 - 8,
        FONT_SM,
        frameNames[i]
      );
      label.setOrigin(0.5, 0.5);
      label.setTint(0xe8e0f0);
      this.scrollContainer.add(label);

      const sub = this.add.bitmapText(fx + frameW / 2, y + frameH / 2 + 8, FONT_SM, '(default)');
      sub.setOrigin(0.5, 0.5);
      sub.setTint(0x605880);
      this.scrollContainer.add(sub);
    }
    y += frameH + 6;

    // Tinted variants
    const tintedFrames = [
      { frame: 'frame_dark', tint: 0x8844aa, label: 'Purple tint' },
      { frame: 'frame_bright', tint: 0x44ff88, label: 'Green tint' },
      { frame: 'frame_dark', tint: 0x4af0ff, label: 'Cyan tint' },
    ];
    for (let i = 0; i < tintedFrames.length; i++) {
      const { frame: frameName, tint, label } = tintedFrames[i];
      const fx = framesStartX + i * (frameW + frameSpacing);
      const frame = this.add.nineslice(
        fx + frameW / 2,
        y + frameH / 2,
        UI_ATLAS,
        frameName,
        frameW,
        frameH
      );
      frame.setOrigin(0.5, 0.5);
      frame.setTint(tint);
      this.scrollContainer.add(frame);

      const lbl = this.add.bitmapText(fx + frameW / 2, y + frameH / 2 - 8, FONT_SM, label);
      lbl.setOrigin(0.5, 0.5);
      lbl.setTint(0xe8e0f0);
      this.scrollContainer.add(lbl);

      const hex = this.add.bitmapText(
        fx + frameW / 2,
        y + frameH / 2 + 8,
        FONT_SM,
        `0x${tint.toString(16)}`
      );
      hex.setOrigin(0.5, 0.5);
      hex.setTint(0x605880);
      this.scrollContainer.add(hex);
    }
    y += frameH + 8;

    // ─── SECTION 5: Header Scroll ───
    y = this.drawSection(y, 'HEADER SCROLL (9-slice)', 0x44ddaa);

    const scrollW = 200;
    const scrollH = 22;
    const scroll = this.add.nineslice(
      20 + scrollW / 2,
      y + scrollH / 2,
      UI_ATLAS,
      'header_scroll',
      scrollW,
      scrollH
    );
    scroll.setOrigin(0.5, 0.5);
    this.scrollContainer.add(scroll);
    const scrollLabel = this.add.bitmapText(
      20 + scrollW / 2,
      y + scrollH / 2,
      FONT_SM,
      'HEADER SCROLL'
    );
    scrollLabel.setOrigin(0.5, 0.5);
    scrollLabel.setTint(0xe8e0f0);
    this.scrollContainer.add(scrollLabel);

    const scroll2 = this.add.nineslice(
      20 + scrollW + 30 + scrollW / 2,
      y + scrollH / 2,
      UI_ATLAS,
      'header_scroll',
      scrollW,
      scrollH
    );
    scroll2.setOrigin(0.5, 0.5);
    scroll2.setTint(0x44ff88);
    this.scrollContainer.add(scroll2);
    const scrollLabel2 = this.add.bitmapText(
      20 + scrollW + 30 + scrollW / 2,
      y + scrollH / 2,
      FONT_SM,
      'TINTED GREEN'
    );
    scrollLabel2.setOrigin(0.5, 0.5);
    scrollLabel2.setTint(0xe8e0f0);
    this.scrollContainer.add(scrollLabel2);
    y += scrollH + 14;

    // ─── SECTION 6: Styled Buttons ───
    y = this.drawSection(y, 'BUTTONS (insert factory)', 0x88aaff);

    this.addText(
      20,
      y,
      FONT_SM,
      "Note: buttons use insert anchors and don't scroll with container.",
      0x605880
    );
    y += 4;
    this.addText(
      20,
      y,
      FONT_SM,
      'States: Normal (hover to see highlight), Disabled (greyed out)',
      0x605880
    );
    y += 18;

    // Manual button frames to show all states
    const btnStates = ['up', 'hover', 'down', 'disabled'];
    let bx = 20;
    for (const state of btnStates) {
      const idx = btnStates.indexOf(state);
      const btn = this.add.sprite(bx + 48, y + 11, UI_ATLAS, `button_${state}`);
      btn.setOrigin(0.5, 0.5);
      this.scrollContainer.add(btn);

      const lbl = this.add.bitmapText(bx + 48, y + 28, FONT_SM, state);
      lbl.setOrigin(0.5, 0);
      lbl.setTint(idx === 3 ? 0x605880 : 0xb0a8c0);
      this.scrollContainer.add(lbl);
      bx += 120;
    }
    y += 48;

    // ─── SECTION 7: Progress Bars ───
    y = this.drawSection(y, 'PROGRESS BARS', 0xffdd44);

    this.addText(
      20,
      y,
      FONT_SM,
      'progress_curly frame with bar_green fill. First bar animates.',
      0x605880
    );
    y += 4;

    const barW = 120;
    const barH = 14;
    const progressValues = [0.0, 0.25, 0.5, 0.75, 1.0];
    for (let i = 0; i < progressValues.length; i++) {
      const px = 20 + i * (barW + 16);
      if (px + barW > vp.width) break;

      const prog = this.insert.topLeft.progress({ x: px, y, width: barW, height: barH });
      prog.value = progressValues[i];
      this.progressBars.push(prog);
      this.progressDir.push(i === 0 ? 0.003 : 0);

      const pctLabel = this.add.bitmapText(
        px + barW / 2,
        y + barH + 2,
        FONT_SM,
        `${Math.round(progressValues[i] * 100)}%`
      );
      pctLabel.setOrigin(0.5, 0);
      pctLabel.setTint(0x605880);
      this.scrollContainer.add(pctLabel);
    }
    y += barH + 24;

    // ─── SECTION 8: Insert Anchors ───
    y = this.drawSection(y, 'INSERT ANCHORS', 0xff8844);
    y = this.addText(
      20,
      y,
      FONT_SM,
      'Anchors: topLeft / top / topRight / left / center / right / bottomLeft / bottom / bottomRight',
      0xb0a8c0
    );
    y = this.addText(
      20,
      y,
      FONT_SM,
      'Components created via insert.<anchor>.<component>() auto-position relative to viewport edges.',
      0x605880
    );
    y = this.addText(
      20,
      y,
      FONT_SM,
      'Used for HUD elements that should stay pinned regardless of viewport size.',
      0x605880
    );
    y += 8;

    // ─── SECTION 9: Combined Panel Example ───
    y = this.drawSection(y, 'COMBINED PANEL EXAMPLE', 0xff88cc);

    const panelW = Math.min(400, vp.width - 40);
    const panelH = 100;
    const panelX = 20 + panelW / 2;
    const panelY = y + panelH / 2;

    const panelBg = this.add.nineslice(panelX, panelY, UI_ATLAS, 'frame_dark', panelW, panelH);
    panelBg.setOrigin(0.5, 0.5);
    this.scrollContainer.add(panelBg);

    const items: [number, string, string, number][] = [
      [panelY - 30, FONT_MD, 'EXAMPLE PANEL', 0xe8e0f0],
      [panelY - 6, FONT_SM, 'This is how panels are typically built:', 0xb0a8c0],
      [panelY + 10, FONT_SM, '9-slice frame + bitmap text + tint colors', 0x605880],
      [panelY + 30, FONT_SM, '[X] Close', 0x4af0ff],
    ];
    for (const [py, font, text, tint] of items) {
      const t = this.add.bitmapText(panelX, py, font, text);
      t.setOrigin(0.5, 0.5);
      t.setTint(tint);
      this.scrollContainer.add(t);
    }
    y += panelH + 14;

    // ─── SECTION 10: Settings button ───
    y = this.drawSection(y, 'SETTINGS BUTTON SPRITESHEET', 0x88ddff);

    const settingStates = ['up', 'hover', 'down', 'disabled'];
    let sbx = 20;
    for (const state of settingStates) {
      const idx = settingStates.indexOf(state);
      const btn = this.add.sprite(sbx + 16, y + 16, UI_ATLAS, `button_settings_${state}`);
      btn.setOrigin(0.5, 0.5);
      this.scrollContainer.add(btn);

      const lbl = this.add.bitmapText(sbx + 16, y + 38, FONT_SM, state);
      lbl.setOrigin(0.5, 0);
      lbl.setTint(idx === 3 ? 0x605880 : 0xb0a8c0);
      this.scrollContainer.add(lbl);
      sbx += 80;
    }
    y += 56;

    // ─── Footer ───
    y += 10;
    const footer = this.add.bitmapText(cx, y, FONT_SM, '-- End of demo --');
    footer.setOrigin(0.5, 0);
    footer.setTint(0x605880);
    this.scrollContainer.add(footer);
    y += 30;

    this.contentHeight = y;

    // Input
    this.input.keyboard!.on('keydown', this.handleKeyDown, this);
    this.input.keyboard!.on('keyup', this.handleKeyUp, this);
  }

  update(): void {
    // Scroll
    if (this.keysHeld.up) this.scroll(-SCROLL_SPEED);
    if (this.keysHeld.down) this.scroll(SCROLL_SPEED);

    // Animate progress bars
    for (let i = 0; i < this.progressBars.length; i++) {
      if (this.progressDir[i] === 0) continue;
      const bar = this.progressBars[i];
      bar.value += this.progressDir[i];
      if (bar.value >= 1) {
        bar.value = 1;
        this.progressDir[i] = -0.003;
      }
      if (bar.value <= 0) {
        bar.value = 0;
        this.progressDir[i] = 0.003;
      }
      bar.update();
    }
  }

  private scroll(dy: number): void {
    const maxScroll = Math.max(0, this.contentHeight - this.viewport.height);
    this.scrollOffset = Math.max(0, Math.min(maxScroll, this.scrollOffset + dy));
    this.scrollContainer.y = -this.scrollOffset;
  }

  /** Helper: add bitmap text to container and return next y position */
  private addText(
    x: number,
    y: number,
    font: string,
    content: string,
    tint: number,
    originX = 0
  ): number {
    const t = this.add.bitmapText(x, y, font, content);
    t.setOrigin(originX, 0);
    t.setTint(tint);
    this.scrollContainer.add(t);
    return y + t.height + 2;
  }

  private drawSection(y: number, label: string, color: number): number {
    const vp = this.viewport;
    const line = this.add.graphics();
    line.lineStyle(1, color, 0.4);
    line.lineBetween(20, y, vp.width - 20, y);
    this.scrollContainer.add(line);

    const text = this.add.bitmapText(20, y + 3, FONT_SM, label);
    text.setTint(color);
    this.scrollContainer.add(text);

    return y + 20;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'Escape':
        this.input.keyboard!.off('keydown', this.handleKeyDown, this);
        this.input.keyboard!.off('keyup', this.handleKeyUp, this);
        this.scene.start('ModeSelectScene');
        break;
      case 'KeyE':
      case 'ArrowUp':
        this.keysHeld.up = true;
        break;
      case 'KeyD':
      case 'ArrowDown':
        this.keysHeld.down = true;
        break;
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyE':
      case 'ArrowUp':
        this.keysHeld.up = false;
        break;
      case 'KeyD':
      case 'ArrowDown':
        this.keysHeld.down = false;
        break;
    }
  }
}
