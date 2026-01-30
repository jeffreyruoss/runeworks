#!/usr/bin/env node
/**
 * Sprite Generator for Hotkey Foundry
 *
 * Converts ASCII sprite definitions to PNG images and packs them into a spritesheet.
 *
 * Usage:
 *   node generate.js
 *
 * Input:  assets/sprites/src/*.txt
 * Output: assets/sprites/out/spritesheet.png
 *         assets/sprites/out/spritesheet.json (Phaser atlas format)
 *         assets/sprites/out/[individual].png (for debugging)
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';
import { getColor } from './palette.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SPRITES_SRC = join(__dirname, '../../assets/sprites/src');
const SPRITES_OUT = join(__dirname, '../../assets/sprites/out');

/**
 * Parse an ASCII sprite definition file
 *
 * Format:
 *   # comment lines start with #
 *   @name sprite_name
 *   @size 16 (or 16x16, or 32x32)
 *   @frames 1 (optional, for animations)
 *
 *   <pixel data - one char per pixel>
 */
function parseSpriteFile(content, filename) {
  const lines = content.split('\n');
  const sprites = [];

  let currentSprite = null;
  let pixelLines = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Skip empty lines between sprites
    if (line.trim() === '' && !currentSprite) {
      continue;
    }

    // Comment
    if (line.startsWith('#')) {
      continue;
    }

    // Metadata
    if (line.startsWith('@')) {
      // If we were building a sprite, finalize it
      if (currentSprite && pixelLines.length > 0) {
        currentSprite.pixels = pixelLines;
        sprites.push(currentSprite);
        pixelLines = [];
      }

      const [directive, ...args] = line.slice(1).split(/\s+/);

      if (directive === 'name') {
        currentSprite = {
          name: args.join('_'),
          width: 16,
          height: 16,
          frames: 1,
          pixels: [],
        };
      } else if (directive === 'size' && currentSprite) {
        const sizeArg = args[0];
        if (sizeArg.includes('x')) {
          const [w, h] = sizeArg.split('x').map(Number);
          currentSprite.width = w;
          currentSprite.height = h;
        } else {
          const size = parseInt(sizeArg, 10);
          currentSprite.width = size;
          currentSprite.height = size;
        }
      } else if (directive === 'frames' && currentSprite) {
        currentSprite.frames = parseInt(args[0], 10);
      }
      continue;
    }

    // Pixel data line
    if (currentSprite) {
      pixelLines.push(line);
    }
  }

  // Finalize last sprite
  if (currentSprite && pixelLines.length > 0) {
    currentSprite.pixels = pixelLines;
    sprites.push(currentSprite);
  }

  // If no @name directive, use filename
  if (sprites.length === 0 && lines.some((l) => !l.startsWith('#') && l.trim())) {
    const pixels = lines.filter((l) => !l.startsWith('#') && !l.startsWith('@') && l.trim());
    if (pixels.length > 0) {
      const height = pixels.length;
      const width = Math.max(...pixels.map((p) => p.length));
      sprites.push({
        name: basename(filename, '.txt'),
        width,
        height,
        frames: 1,
        pixels,
      });
    }
  }

  return sprites;
}

/**
 * Convert a sprite definition to PNG buffer
 */
function spriteToPNG(sprite) {
  const { width, height, pixels, frames } = sprite;
  const totalWidth = width * frames;

  const png = new PNG({ width: totalWidth, height, filterType: -1 });

  for (let y = 0; y < height; y++) {
    const row = pixels[y] || '';
    for (let x = 0; x < totalWidth; x++) {
      const char = row[x] || '.';
      const [r, g, b, a] = getColor(char);

      const idx = (y * totalWidth + x) * 4;
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }

  return PNG.sync.write(png);
}

/**
 * Pack sprites into a spritesheet (simple row-based packing)
 */
function packSpritesheet(sprites) {
  // Sort by height for slightly better packing
  const sorted = [...sprites].sort((a, b) => b.height - a.height);

  // Calculate total dimensions (simple: stack vertically)
  let maxWidth = 0;
  let totalHeight = 0;

  for (const sprite of sorted) {
    const spriteWidth = sprite.width * sprite.frames;
    maxWidth = Math.max(maxWidth, spriteWidth);
    totalHeight += sprite.height;
  }

  // Round up to power of 2 for GPU efficiency
  const sheetWidth = nextPowerOf2(maxWidth);
  const sheetHeight = nextPowerOf2(totalHeight);

  const sheet = new PNG({ width: sheetWidth, height: sheetHeight, filterType: -1 });

  // Fill with transparent
  for (let i = 0; i < sheet.data.length; i += 4) {
    sheet.data[i] = 0;
    sheet.data[i + 1] = 0;
    sheet.data[i + 2] = 0;
    sheet.data[i + 3] = 0;
  }

  // Place sprites and build atlas data
  const frames = {};
  let yOffset = 0;

  for (const sprite of sorted) {
    const spriteWidth = sprite.width * sprite.frames;

    // Copy sprite pixels to sheet
    for (let y = 0; y < sprite.height; y++) {
      const row = sprite.pixels[y] || '';
      for (let x = 0; x < spriteWidth; x++) {
        const char = row[x] || '.';
        const [r, g, b, a] = getColor(char);

        const idx = ((yOffset + y) * sheetWidth + x) * 4;
        sheet.data[idx] = r;
        sheet.data[idx + 1] = g;
        sheet.data[idx + 2] = b;
        sheet.data[idx + 3] = a;
      }
    }

    // If animated, create frame entries
    if (sprite.frames > 1) {
      for (let f = 0; f < sprite.frames; f++) {
        frames[`${sprite.name}_${f}`] = {
          frame: { x: f * sprite.width, y: yOffset, w: sprite.width, h: sprite.height },
          sourceSize: { w: sprite.width, h: sprite.height },
          spriteSourceSize: { x: 0, y: 0, w: sprite.width, h: sprite.height },
        };
      }
    } else {
      frames[sprite.name] = {
        frame: { x: 0, y: yOffset, w: sprite.width, h: sprite.height },
        sourceSize: { w: sprite.width, h: sprite.height },
        spriteSourceSize: { x: 0, y: 0, w: sprite.width, h: sprite.height },
      };
    }

    yOffset += sprite.height;
  }

  // Phaser 3 atlas JSON format
  const atlas = {
    frames,
    meta: {
      app: 'spritegen',
      version: '1.0',
      image: 'spritesheet.png',
      format: 'RGBA8888',
      size: { w: sheetWidth, h: sheetHeight },
      scale: '1',
    },
  };

  return {
    png: PNG.sync.write(sheet),
    atlas,
  };
}

function nextPowerOf2(n) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/**
 * Main generator function
 */
function generate() {
  console.log('Sprite Generator for Hotkey Foundry');
  console.log('====================================\n');

  // Ensure output directory exists
  if (!existsSync(SPRITES_OUT)) {
    mkdirSync(SPRITES_OUT, { recursive: true });
  }

  // Find all .txt files in src directory
  let files = [];
  if (existsSync(SPRITES_SRC)) {
    files = readdirSync(SPRITES_SRC).filter((f) => f.endsWith('.txt'));
  }

  if (files.length === 0) {
    console.log('No sprite files found in', SPRITES_SRC);
    console.log('\nCreate .txt files with ASCII sprite definitions.');
    console.log('Example:\n');
    console.log('  @name iron_ore');
    console.log('  @size 16');
    console.log('  ');
    console.log('  ....11111111....');
    console.log('  ..1IIiiiiiII1..');
    console.log('  .1IiiijjjiiI1.');
    console.log('  ...(etc)...');
    return;
  }

  console.log(`Found ${files.length} sprite file(s):\n`);

  const allSprites = [];

  for (const file of files) {
    const filepath = join(SPRITES_SRC, file);
    const content = readFileSync(filepath, 'utf-8');
    const sprites = parseSpriteFile(content, file);

    console.log(`  ${file}:`);
    for (const sprite of sprites) {
      console.log(
        `    - ${sprite.name} (${sprite.width}x${sprite.height}, ${sprite.frames} frame(s))`
      );

      // Write individual PNG for debugging
      const pngBuffer = spriteToPNG(sprite);
      const outPath = join(SPRITES_OUT, `${sprite.name}.png`);
      writeFileSync(outPath, pngBuffer);

      allSprites.push(sprite);
    }
  }

  if (allSprites.length === 0) {
    console.log('\nNo sprites parsed. Check file format.');
    return;
  }

  // Pack into spritesheet
  console.log('\nPacking spritesheet...');
  const { png, atlas } = packSpritesheet(allSprites);

  const sheetPath = join(SPRITES_OUT, 'spritesheet.png');
  const atlasPath = join(SPRITES_OUT, 'spritesheet.json');

  writeFileSync(sheetPath, png);
  writeFileSync(atlasPath, JSON.stringify(atlas, null, 2));

  console.log(`\nOutput:`);
  console.log(`  ${sheetPath}`);
  console.log(`  ${atlasPath}`);
  console.log(`\nGenerated ${allSprites.length} sprite(s) successfully!`);
}

generate();
