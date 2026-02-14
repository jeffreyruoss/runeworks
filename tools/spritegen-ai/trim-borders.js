#!/usr/bin/env node
/**
 * Border Trimmer for AI-generated Sprites
 *
 * AI-generated sprites (via Gemini) often have 1-2px white/grey borders
 * baked into the image data. This script crops those borders and resizes
 * back to original dimensions using nearest-neighbor resampling.
 *
 * Usage:
 *   node trim-borders.js              # Process all sprites
 *   node trim-borders.js --dry-run    # Preview without modifying files
 *   node trim-borders.js --only chest # Process only one sprite
 *   node trim-borders.js --margin 3   # Override auto margin (default: auto)
 *   node trim-borders.js --force      # Re-trim even if already trimmed
 *
 * Auto margin: 2px for 16px sprites, 4px for 32px+ sprites
 *
 * Idempotency: writes a .borders-trimmed manifest after processing.
 * Subsequent runs skip already-trimmed sprites unless --force is used.
 */

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AI_DIR = path.resolve(__dirname, '../../assets/sprites/ai-out');
const MANIFEST_PATH = path.join(AI_DIR, '.borders-trimmed');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { dryRun: false, only: null, margin: null, force: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      opts.dryRun = true;
    } else if (args[i] === '--only' && args[i + 1]) {
      opts.only = args[++i];
    } else if (args[i] === '--margin' && args[i + 1]) {
      opts.margin = parseInt(args[++i], 10);
    } else if (args[i] === '--force') {
      opts.force = true;
    }
  }

  return opts;
}

/** Load the set of already-trimmed sprite names from the manifest */
function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) return new Set();
  const content = fs.readFileSync(MANIFEST_PATH, 'utf-8').trim();
  if (!content) return new Set();
  return new Set(content.split('\n'));
}

/** Save the set of trimmed sprite names to the manifest */
function saveManifest(trimmedSet) {
  fs.writeFileSync(MANIFEST_PATH, [...trimmedSet].sort().join('\n') + '\n');
}

/** Auto margin: 2px for 16px sprites, 4px for 32px+ */
function getMargin(width, height, overrideMargin) {
  if (overrideMargin !== null) return overrideMargin;
  const minDim = Math.min(width, height);
  return minDim <= 16 ? 2 : 4;
}

async function trimSprite(filePath, opts) {
  const meta = await sharp(filePath).metadata();
  const { width, height } = meta;
  const margin = getMargin(width, height, opts.margin);

  // Skip if sprite is too small to crop safely (need at least 4px remaining)
  const croppedW = width - 2 * margin;
  const croppedH = height - 2 * margin;
  if (croppedW < 4 || croppedH < 4) {
    return { skipped: true, reason: `too small (${width}x${height}, margin=${margin})` };
  }

  if (opts.dryRun) {
    return { skipped: false, width, height, margin, dryRun: true };
  }

  // Crop margins then resize back to original dimensions
  const buffer = await sharp(filePath)
    .extract({ left: margin, top: margin, width: croppedW, height: croppedH })
    .resize(width, height, { kernel: sharp.kernel.nearest, fit: 'fill' })
    .png()
    .toBuffer();

  fs.writeFileSync(filePath, buffer);
  return { skipped: false, width, height, margin, dryRun: false };
}

async function main() {
  const opts = parseArgs();
  const manifest = loadManifest();

  console.log('AI Sprite Border Trimmer');
  console.log('========================\n');

  if (opts.dryRun) {
    console.log('DRY RUN — no files will be modified\n');
  }

  // Collect PNG files, skip spritesheet files
  let files = fs
    .readdirSync(AI_DIR)
    .filter((f) => f.endsWith('.png') && !f.startsWith('spritesheet'));

  if (opts.only) {
    files = files.filter((f) => path.basename(f, '.png') === opts.only);
    if (files.length === 0) {
      console.error(`Error: No sprite named "${opts.only}" found in ${AI_DIR}`);
      process.exit(1);
    }
  }

  console.log(`Found ${files.length} sprite(s) to process\n`);

  let trimmed = 0;
  let skipped = 0;

  for (const file of files.sort()) {
    const filePath = path.join(AI_DIR, file);
    const name = path.basename(file, '.png');

    // Skip already-trimmed sprites unless --force
    if (!opts.force && manifest.has(name)) {
      console.log(`  SKIP  ${name} — already trimmed (use --force to re-trim)`);
      skipped++;
      continue;
    }

    const result = await trimSprite(filePath, opts);

    if (result.skipped) {
      console.log(`  SKIP  ${name} — ${result.reason}`);
      skipped++;
    } else {
      const action = result.dryRun ? 'WOULD TRIM' : 'TRIMMED';
      console.log(
        `  ${action}  ${name} (${result.width}x${result.height}, margin=${result.margin}px)`
      );
      trimmed++;
      if (!result.dryRun) {
        manifest.add(name);
      }
    }
  }

  // Persist manifest so future runs skip already-trimmed sprites
  if (!opts.dryRun && trimmed > 0) {
    saveManifest(manifest);
  }

  console.log(`\nResults: ${trimmed} trimmed, ${skipped} skipped`);

  if (!opts.dryRun && trimmed > 0) {
    console.log('\nNext step: rebuild the atlas:');
    console.log('  node tools/spritegen-ai/pack-atlas.js');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
