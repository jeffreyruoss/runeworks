import { defineConfig } from 'vite';
import { processAssetsDev, processAssetsProd } from 'pixel-tools';

const pixuiAssets = {
  source_path: 'assets/pixui',
  destination_path: 'public/packed_assets',
  fonts: [{ source: 'fonts.yaml' }],
  atlases: [{ source: 'ui.yaml', target: 'mana_soul' }],
};

export default defineConfig(({ command }) => ({
  base: './',
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  server: {
    port: 3000,
    open: true,
  },
  plugins: [command === 'serve' ? processAssetsDev(pixuiAssets) : processAssetsProd(pixuiAssets)],
}));
