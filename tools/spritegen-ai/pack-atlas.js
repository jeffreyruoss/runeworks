/**
 * Atlas packer for AI-generated sprites.
 * Reads individual PNGs from assets/sprites/ai-out/ and old UI sprites
 * from assets/sprites/out/, packs them into a Phaser 3 atlas.
 *
 * Usage: node pack-atlas.js
 * Output: assets/sprites/ai-out/spritesheet.png + spritesheet.json
 */

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AI_DIR = path.resolve(__dirname, '../../assets/sprites/ai-out');
const OLD_DIR = path.resolve(__dirname, '../../assets/sprites/out');

// Old UI sprites to carry over (no AI versions exist)
const OLD_UI_SPRITES = [
  'cursor.png',
  'cursor_valid.png',
  'cursor_invalid.png',
  'cursor_2x2.png',
  'arrow_right.png',
  'arrow_left.png',
  'arrow_up.png',
  'arrow_down.png',
  'favicon.png',
];

async function packAtlas() {
  const entries = [];

  // Collect AI sprites (skip spritesheet files)
  const aiFiles = fs
    .readdirSync(AI_DIR)
    .filter((f) => f.endsWith('.png') && !f.startsWith('spritesheet'));
  for (const file of aiFiles) {
    const meta = await sharp(path.join(AI_DIR, file)).metadata();
    entries.push({
      name: path.basename(file, '.png'),
      path: path.join(AI_DIR, file),
      width: meta.width,
      height: meta.height,
    });
  }

  // Collect old UI sprites
  for (const file of OLD_UI_SPRITES) {
    const filePath = path.join(OLD_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: old sprite ${file} not found, skipping`);
      continue;
    }
    const meta = await sharp(filePath).metadata();
    entries.push({
      name: path.basename(file, '.png'),
      path: filePath,
      width: meta.width,
      height: meta.height,
    });
  }

  // Sort by height descending, then width descending for efficient packing
  entries.sort((a, b) => b.height - a.height || b.width - a.width);

  // Simple strip packing: place sprites in rows, max width = widest sprite
  const maxWidth = Math.max(...entries.map((e) => e.width));
  let currentY = 0;
  const placements = [];

  for (const entry of entries) {
    placements.push({ ...entry, x: 0, y: currentY });
    currentY += entry.height;
  }

  const totalHeight = currentY;

  // Composite all sprites into one image
  const composites = placements.map((p) => ({
    input: p.path,
    left: p.x,
    top: p.y,
  }));

  const outputPng = path.join(AI_DIR, 'spritesheet.png');
  const outputJson = path.join(AI_DIR, 'spritesheet.json');

  await sharp({
    create: {
      width: maxWidth,
      height: totalHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toFile(outputPng);

  // Generate Phaser 3 atlas JSON
  const frames = {};
  for (const p of placements) {
    frames[p.name] = {
      frame: { x: p.x, y: p.y, w: p.width, h: p.height },
      sourceSize: { w: p.width, h: p.height },
      spriteSourceSize: { x: 0, y: 0, w: p.width, h: p.height },
    };
  }

  const atlas = {
    frames,
    meta: {
      app: 'spritegen-ai',
      version: '1.0',
      image: 'spritesheet.png',
      format: 'RGBA8888',
      size: { w: maxWidth, h: totalHeight },
      scale: '1',
    },
  };

  fs.writeFileSync(outputJson, JSON.stringify(atlas, null, 2) + '\n');

  console.log(`Packed ${placements.length} sprites into ${maxWidth}x${totalHeight} atlas`);
  console.log(`Output: ${outputPng}`);
  console.log(`Output: ${outputJson}`);
}

packAtlas().catch((err) => {
  console.error('Atlas packing failed:', err);
  process.exit(1);
});
