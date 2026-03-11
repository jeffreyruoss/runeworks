#!/usr/bin/env node
/**
 * Checkerboard Transparency Fixer for AI-generated Sprites
 *
 * Gemini renders a fake gray/white checkerboard instead of real transparency.
 * After nearest-neighbor downscaling, this becomes chunky alternating light/dark
 * pixels around the sprite. This script converts those to real alpha transparency
 * using a saturation-gated BFS flood fill from edges.
 *
 * Usage:
 *   node fix-transparency.js              # Process all applicable sprites
 *   node fix-transparency.js --dry-run    # Preview without modifying files
 *   node fix-transparency.js --only chest # Process only one sprite
 *   node fix-transparency.js --force      # Re-process already-fixed sprites
 *
 * Idempotency: writes a .transparency-fixed manifest after processing.
 * Subsequent runs skip already-fixed sprites unless --force is used.
 */

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPRITES } from './sprites.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AI_DIR = path.resolve(__dirname, '../../assets/sprites/ai-out');
const MANIFEST_PATH = path.join(AI_DIR, '.transparency-fixed');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { dryRun: false, only: null, force: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      opts.dryRun = true;
    } else if (args[i] === '--only' && args[i + 1]) {
      opts.only = args[++i];
    } else if (args[i] === '--force') {
      opts.force = true;
    }
  }

  return opts;
}

/** Load the set of already-fixed sprite names from the manifest */
function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) return new Set();
  const content = fs.readFileSync(MANIFEST_PATH, 'utf-8').trim();
  if (!content) return new Set();
  return new Set(content.split('\n'));
}

/** Save the set of fixed sprite names to the manifest */
function saveManifest(fixedSet) {
  fs.writeFileSync(MANIFEST_PATH, [...fixedSet].sort().join('\n') + '\n');
}

/** Get the set of sprite names that should be skipped (tileable or flatten) */
function getExcludedNames() {
  const excluded = new Set();
  for (const sprite of SPRITES) {
    if (sprite.tileable || sprite.flatten) {
      excluded.add(sprite.name);
    }
  }
  return excluded;
}

/** Convert RGB to HSV. Returns { s: 0-1, v: 0-255 } (hue not needed) */
function rgbToHsv(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  const s = max === 0 ? 0 : delta / max;
  return { s, v: max };
}

/**
 * Detect checkerboard type from corner pixels.
 * Returns 'light', 'dark', or null (no checkerboard detected).
 */
function detectCheckerboard(data, width, height, channels) {
  const SAMPLE = 2; // 2x2 from each corner
  const corners = [];

  // Collect corner pixel samples
  for (const [startX, startY] of [
    [0, 0],
    [width - SAMPLE, 0],
    [0, height - SAMPLE],
    [width - SAMPLE, height - SAMPLE],
  ]) {
    for (let dy = 0; dy < SAMPLE; dy++) {
      for (let dx = 0; dx < SAMPLE; dx++) {
        const idx = ((startY + dy) * width + (startX + dx)) * channels;
        corners.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
      }
    }
  }

  // Check if corners are low-saturation (gray/white/black)
  let lowSatCount = 0;
  let brightCount = 0;
  let darkCount = 0;

  for (const { r, g, b } of corners) {
    const { s, v } = rgbToHsv(r, g, b);
    if (s < 0.15) {
      lowSatCount++;
      if (v > 200) brightCount++;
      if (v < 60) darkCount++;
    }
  }

  // Need majority of corner pixels to be low-saturation
  const total = corners.length;
  if (lowSatCount < total * 0.75) return null;

  if (brightCount >= darkCount && brightCount > 0) return 'light';
  if (darkCount > brightCount) return 'dark';
  return null;
}

/**
 * Check if a pixel qualifies as background.
 * Once a checkerboard is detected, both light AND dark desaturated pixels
 * are background — the checkerboard alternates between the two.
 */
function isBackground(r, g, b) {
  const { s, v } = rgbToHsv(r, g, b);
  if (s >= 0.15) return false;
  return v > 200 || v < 60;
}

/**
 * BFS flood fill from edges. Returns a Set of pixel indices to make transparent.
 */
function floodFillFromEdges(data, width, height, channels) {
  const visited = new Set();
  const queue = [];

  // Seed with edge pixels that pass the background check
  for (let x = 0; x < width; x++) {
    for (const y of [0, height - 1]) {
      const idx = (y * width + x) * channels;
      const pixelKey = y * width + x;
      if (!visited.has(pixelKey) && isBackground(data[idx], data[idx + 1], data[idx + 2])) {
        visited.add(pixelKey);
        queue.push(pixelKey);
      }
    }
  }
  for (let y = 1; y < height - 1; y++) {
    for (const x of [0, width - 1]) {
      const idx = (y * width + x) * channels;
      const pixelKey = y * width + x;
      if (!visited.has(pixelKey) && isBackground(data[idx], data[idx + 1], data[idx + 2])) {
        visited.add(pixelKey);
        queue.push(pixelKey);
      }
    }
  }

  // BFS expand to 4-connected neighbors
  let head = 0;
  while (head < queue.length) {
    const key = queue[head++];
    const x = key % width;
    const y = (key - x) / width;

    for (const [nx, ny] of [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ]) {
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const nKey = ny * width + nx;
      if (visited.has(nKey)) continue;
      const nIdx = nKey * channels;
      if (isBackground(data[nIdx], data[nIdx + 1], data[nIdx + 2])) {
        visited.add(nKey);
        queue.push(nKey);
      }
    }
  }

  return visited;
}

async function fixTransparency(filePath, opts) {
  const raw = await sharp(filePath).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const data = Buffer.from(raw.data);
  const { width, height, channels } = raw.info;

  // Detect checkerboard type from corners
  const type = detectCheckerboard(data, width, height, channels);
  if (!type) {
    return { skipped: true, reason: 'no checkerboard detected' };
  }

  if (opts.dryRun) {
    return { skipped: false, width, height, type, dryRun: true };
  }

  // Flood fill from edges to find background pixels
  const transparent = floodFillFromEdges(data, width, height, channels);

  // Set alpha=0 for flood-filled pixels
  for (const key of transparent) {
    const idx = key * channels;
    data[idx + 3] = 0; // alpha channel
  }

  const buffer = await sharp(data, { raw: { width, height, channels } }).png().toBuffer();

  fs.writeFileSync(filePath, buffer);
  return {
    skipped: false,
    width,
    height,
    type,
    pixelsCleared: transparent.size,
    dryRun: false,
  };
}

async function main() {
  const opts = parseArgs();
  const manifest = loadManifest();
  const excluded = getExcludedNames();

  console.log('AI Sprite Checkerboard Transparency Fixer');
  console.log('==========================================\n');

  if (opts.dryRun) {
    console.log('DRY RUN — no files will be modified\n');
  }

  // Collect PNG files, skip spritesheet and excluded sprites
  let files = fs
    .readdirSync(AI_DIR)
    .filter((f) => f.endsWith('.png') && !f.startsWith('spritesheet'));

  // Filter out tileable/flatten sprites
  files = files.filter((f) => !excluded.has(path.basename(f, '.png')));

  if (opts.only) {
    files = files.filter((f) => path.basename(f, '.png') === opts.only);
    if (files.length === 0) {
      console.error(`Error: No applicable sprite named "${opts.only}" found in ${AI_DIR}`);
      process.exit(1);
    }
  }

  console.log(`Found ${files.length} sprite(s) to process\n`);

  let fixed = 0;
  let skipped = 0;

  for (const file of files.sort()) {
    const filePath = path.join(AI_DIR, file);
    const name = path.basename(file, '.png');

    // Skip already-fixed sprites unless --force
    if (!opts.force && manifest.has(name)) {
      console.log(`  SKIP  ${name} — already fixed (use --force to re-process)`);
      skipped++;
      continue;
    }

    const result = await fixTransparency(filePath, opts);

    if (result.skipped) {
      console.log(`  SKIP  ${name} — ${result.reason}`);
      skipped++;
    } else {
      const action = result.dryRun ? 'WOULD FIX' : 'FIXED';
      const detail = result.dryRun
        ? `${result.width}x${result.height}, ${result.type} checkerboard`
        : `${result.width}x${result.height}, ${result.type} checkerboard, ${result.pixelsCleared}px cleared`;
      console.log(`  ${action}  ${name} (${detail})`);
      fixed++;
      if (!result.dryRun) {
        manifest.add(name);
      }
    }
  }

  // Persist manifest so future runs skip already-fixed sprites
  if (!opts.dryRun && fixed > 0) {
    saveManifest(manifest);
  }

  console.log(`\nResults: ${fixed} fixed, ${skipped} skipped`);

  if (!opts.dryRun && fixed > 0) {
    console.log('\nNext step: rebuild the atlas:');
    console.log('  node tools/spritegen-ai/pack-atlas.js');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
