import { defineConfig, type Plugin } from 'vite';
import { processAssetsDev, processAssetsProd } from 'pixel-tools';
import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const pixuiAssets = {
  source_path: 'assets/pixui',
  destination_path: 'public/packed_assets',
  fonts: [{ source: 'fonts.yaml' }],
  atlases: [{ source: 'ui.yaml', target: 'mana_soul' }],
};

const copyAiSpritesheet = (): Plugin => ({
  name: 'copy-ai-spritesheet',
  apply: 'build',
  closeBundle() {
    const srcDir = resolve(__dirname, 'assets/sprites/ai-out');
    const destDir = resolve(__dirname, 'dist/assets/sprites/ai-out');
    mkdirSync(destDir, { recursive: true });
    for (const file of ['spritesheet.png', 'spritesheet.json']) {
      copyFileSync(resolve(srcDir, file), resolve(destDir, file));
    }
  },
});

export default defineConfig(({ command }) => ({
  base: './',
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  server: {
    port: 3000,
    open: true,
    hmr: false,
  },
  plugins: [
    command === 'serve' ? processAssetsDev(pixuiAssets) : processAssetsProd(pixuiAssets),
    copyAiSpritesheet(),
  ],
}));
