# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hotkey Foundry is a keyboard-only, stage-based micro-factory builder game built with Phaser 3 and TypeScript. Players place production machines on a 40×25 grid and run tick-based simulations to meet stage goals.

## Commands

```bash
npm run dev       # Start dev server on port 3000 (auto-opens browser)
npm run build     # TypeScript compile + Vite production build to /dist
npm run preview   # Preview production build locally
npm run sprites   # Regenerate sprite atlas from ASCII definitions
```

## Architecture

### Scene Structure

- **BootScene** (`src/scenes/BootScene.ts`) - Asset loading, bootstraps other scenes
- **GameScene** (`src/scenes/GameScene.ts`) - Core gameplay: grid rendering, building placement/deletion/rotation, cursor movement, keyboard input
- **UIScene** (`src/scenes/UIScene.ts`) - HUD overlay: status bars, hotbar legend, help text. Listens to GameScene events.

### Core Systems

- **Simulation** (`src/Simulation.ts`) - Tick-based deterministic engine (20 ticks/sec). Handles production phase (buildings process recipes) and transfer phase (round-robin item distribution to adjacent machines).
- **Building Definitions** (`src/data/buildings.ts`) - Specs for Miner, Furnace, Assembler, Chest
- **Recipes** (`src/data/recipes.ts`) - Crafting recipes with input/output mappings and timing

### Sprite Pipeline

ASCII art in `assets/sprites/src/*.txt` → `tools/spritegen/generate.js` → PNG atlas in `assets/sprites/out/`

## Key Configuration (`src/config.ts`)

- Grid: 40×25 tiles at 16×16px (640×400 virtual resolution)
- Default zoom: 4× (renders at 2560×1600)
- Simulation: 20 ticks/second (50ms per tick)

## Keyboard Controls (GameScene)

- **WASD**: Move cursor (+ Shift for 5-tile jumps)
- **1-4**: Select building type
- **Enter**: Place building
- **Backspace**: Delete building
- **R**: Rotate building
- **Space**: Toggle simulation
- **. / ,**: Speed up / slow down simulation
- **Esc**: Deselect building

## Design Reference

See `hotkey-foundry-spec.md` for complete game design specification including stage system, simulation rules, and milestone roadmap.
