#!/usr/bin/env node
/**
 * AI Sprite Generator for Runeworks
 *
 * Generates pixel art sprites using Google Gemini image generation,
 * then downscales to target dimensions with nearest-neighbor resampling.
 *
 * Usage:
 *   GOOGLE_API_KEY=... node generate.js
 *
 * Options:
 *   --only <name>    Generate only the named sprite (e.g. --only quarry)
 *   --compare        Also generate comparison HTML page
 *
 * Output: assets/sprites/ai-out/*.png
 */

import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SPRITES } from './sprites.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const AI_OUT = join(__dirname, '../../assets/sprites/ai-out');
const EXISTING_OUT = join(__dirname, '../../assets/sprites/out');

// Load API key from environment or .env file
function getApiKey() {
  if (process.env.GOOGLE_API_KEY) {
    return process.env.GOOGLE_API_KEY;
  }

  const envPath = join(__dirname, '.env');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');
    const match = envContent.match(/^GOOGLE_API_KEY=(.+)$/m);
    if (match) return match[1].trim();
  }

  return null;
}

// Parse CLI args
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { only: null, compare: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--only' && args[i + 1]) {
      opts.only = args[++i];
    } else if (args[i] === '--compare') {
      opts.compare = true;
    }
  }

  return opts;
}

// Generate a single sprite via Gemini
async function generateSprite(client, sprite) {
  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ role: 'user', parts: [{ text: sprite.prompt }] }],
    config: {
      responseModalities: ['image', 'text'],
      responseMediaType: 'image/png',
    },
  });

  // Find the image part in the response
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return Buffer.from(part.inlineData.data, 'base64');
    }
  }

  throw new Error(`No image returned for sprite "${sprite.name}"`);
}

// Downscale image to target size using nearest-neighbor.
// Overshoots by a margin then crops the center to discard AI border artifacts.
async function downscaleSprite(imageBuffer, targetWidth, targetHeight) {
  // Auto margin: 2px for 16px items, 4px for 32px+ sprites
  const minDim = Math.min(targetWidth, targetHeight);
  const margin = minDim <= 16 ? 2 : 4;

  const overshotW = targetWidth + 2 * margin;
  const overshotH = targetHeight + 2 * margin;

  // Downscale to overshot size, then crop center to discard border contamination
  return sharp(imageBuffer)
    .resize(overshotW, overshotH, {
      kernel: sharp.kernel.nearest,
      fit: 'fill',
    })
    .extract({ left: margin, top: margin, width: targetWidth, height: targetHeight })
    .png()
    .toBuffer();
}

// Generate comparison HTML
function generateCompareHtml(sprites) {
  const scale = 8;
  const rows = sprites
    .map((s) => {
      const existingPath = `../../assets/sprites/out/${s.name}.png`;
      const aiPath = `../../assets/sprites/ai-out/${s.name}.png`;
      const displayW = s.width * scale;
      const displayH = s.height * scale;
      return `
      <tr>
        <td><code>${s.name}</code><br>${s.width}x${s.height}</td>
        <td><img src="${existingPath}" width="${displayW}" height="${displayH}" style="image-rendering: pixelated;"></td>
        <td><img src="${aiPath}" width="${displayW}" height="${displayH}" style="image-rendering: pixelated;"></td>
      </tr>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <title>Runeworks Sprite Comparison</title>
  <style>
    body { background: #1a1a2e; color: #e0e0e0; font-family: monospace; padding: 20px; }
    h1 { color: #9b59b6; }
    table { border-collapse: collapse; }
    th, td { padding: 12px 20px; border: 1px solid #333; text-align: center; vertical-align: middle; }
    th { background: #16213e; color: #9b59b6; }
    td { background: #0f3460; }
    img { display: block; margin: 0 auto; }
    code { color: #00d2ff; }
  </style>
</head>
<body>
  <h1>Runeworks Sprite Comparison</h1>
  <p>Existing (ASCII pipeline) vs AI-generated (Gemini) at ${scale}x magnification</p>
  <table>
    <tr><th>Sprite</th><th>Existing</th><th>AI Generated</th></tr>
    ${rows}
  </table>
</body>
</html>`;
}

async function main() {
  const opts = parseArgs();
  const apiKey = getApiKey();

  if (!apiKey) {
    console.error('Error: GOOGLE_API_KEY not found.');
    console.error('Set it via environment variable or create tools/spritegen-ai/.env with:');
    console.error('  GOOGLE_API_KEY=your_key_here');
    process.exit(1);
  }

  const client = new GoogleGenAI({ apiKey });

  // Filter sprites if --only specified
  let sprites = SPRITES;
  if (opts.only) {
    sprites = SPRITES.filter((s) => s.name === opts.only);
    if (sprites.length === 0) {
      console.error(`Error: No sprite named "${opts.only}" found in catalog.`);
      console.error('Available:', SPRITES.map((s) => s.name).join(', '));
      process.exit(1);
    }
  }

  // Ensure output directory exists
  if (!existsSync(AI_OUT)) {
    mkdirSync(AI_OUT, { recursive: true });
  }

  console.log('AI Sprite Generator for Runeworks');
  console.log('=================================\n');
  console.log(`Generating ${sprites.length} sprite(s) using Gemini...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const sprite of sprites) {
    const label = `${sprite.name} (${sprite.width}x${sprite.height})`;
    process.stdout.write(`  Generating ${label}...`);

    try {
      // Generate via Gemini
      const rawImage = await generateSprite(client, sprite);

      // Downscale to target size with nearest-neighbor
      const finalImage = await downscaleSprite(rawImage, sprite.width, sprite.height);

      // Save
      const outPath = join(AI_OUT, `${sprite.name}.png`);
      writeFileSync(outPath, finalImage);

      console.log(' done');
      successCount++;
    } catch (err) {
      console.log(` FAILED: ${err.message}`);
      failCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nResults: ${successCount} succeeded, ${failCount} failed`);
  console.log(`Output: ${AI_OUT}/`);

  // Generate comparison HTML if requested or by default
  if (opts.compare || !opts.only) {
    const html = generateCompareHtml(sprites);
    const htmlPath = join(__dirname, 'compare.html');
    writeFileSync(htmlPath, html);
    console.log(`\nComparison page: ${htmlPath}`);
    console.log('Open in browser to compare existing vs AI sprites side-by-side.');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
