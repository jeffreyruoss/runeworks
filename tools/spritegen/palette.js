/**
 * Color palette for Hotkey Foundry sprites
 * Each character maps to an RGBA color [r, g, b, a]
 *
 * Palette designed for 8-bit retro aesthetic with good contrast
 */

export const PALETTE = {
  // Transparent
  '.': [0, 0, 0, 0],

  // Grayscale
  0: [27, 27, 27, 255], // near black
  1: [59, 59, 59, 255], // dark gray
  2: [92, 92, 92, 255], // medium-dark gray
  3: [124, 124, 124, 255], // medium gray
  4: [158, 158, 158, 255], // medium-light gray
  5: [191, 191, 191, 255], // light gray
  6: [224, 224, 224, 255], // near white
  7: [255, 255, 255, 255], // white

  // Iron colors (blue-gray tones)
  I: [74, 84, 98, 255], // iron dark
  i: [108, 122, 137, 255], // iron medium
  j: [148, 163, 178, 255], // iron light

  // Copper colors (orange-brown tones)
  C: [139, 69, 19, 255], // copper dark
  c: [184, 115, 51, 255], // copper medium
  d: [218, 165, 99, 255], // copper light

  // Ore patch patterns
  O: [89, 86, 82, 255], // ore rock dark
  o: [122, 117, 112, 255], // ore rock medium
  p: [156, 150, 142, 255], // ore rock light

  // Machine colors
  M: [68, 68, 68, 255], // machine frame dark
  m: [102, 102, 102, 255], // machine frame medium
  n: [145, 145, 145, 255], // machine frame light

  // Accent colors
  R: [180, 60, 60, 255], // red (warning/heat)
  r: [220, 100, 100, 255], // red light
  G: [60, 140, 60, 255], // green (valid/output)
  g: [100, 180, 100, 255], // green light
  B: [60, 100, 180, 255], // blue (input)
  b: [100, 140, 220, 255], // blue light
  Y: [180, 160, 60, 255], // yellow (energy/active)
  y: [220, 200, 100, 255], // yellow light

  // Ground/terrain
  T: [82, 70, 58, 255], // terrain dark (dirt)
  t: [115, 100, 82, 255], // terrain medium
  u: [148, 132, 110, 255], // terrain light

  // Chest/wood
  W: [101, 67, 33, 255], // wood dark
  w: [139, 99, 59, 255], // wood medium
  x: [181, 137, 89, 255], // wood light
};

// Named color aliases for readability in sprite definitions
export const ALIASES = {
  _: '.', // alternate transparent
  ' ': '.', // space = transparent
};

/**
 * Get RGBA color for a palette character
 */
export function getColor(char) {
  if (ALIASES[char]) {
    char = ALIASES[char];
  }
  const color = PALETTE[char];
  if (!color) {
    console.warn(`Unknown palette character: '${char}', using transparent`);
    return [0, 0, 0, 0];
  }
  return color;
}
