# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Arcane Foundry (formerly Hotkey Foundry) is a keyboard-only, stage-based micro-factory builder game built with Phaser 3 and TypeScript. Set in the realm of Eldoria, players operate a Runeforge - extracting mystical ores from crystal veins, purifying them in enchanted forges, and crafting runic artifacts. Players place production machines on a 40×25 grid and run tick-based simulations to meet quest quotas.

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
- **Building Definitions** (`src/data/buildings.ts`) - Specs for Quarry, Forge, Workbench, Coffer
- **Recipes** (`src/data/recipes.ts`) - Crafting recipes with input/output mappings and timing

### Sprite Pipeline

ASCII art in `assets/sprites/src/*.txt` → `tools/spritegen/generate.js` → PNG atlas in `assets/sprites/out/`

## Key Configuration (`src/config.ts`)

- Grid: 40×25 tiles at 16×16px (640×400 virtual resolution)
- Default zoom: 4× (renders at 2560×1600)
- Simulation: 20 ticks/second (50ms per tick)

## Keyboard Controls (GameScene)

- **WASD**: Move cursor (+ Shift for 5-tile jumps)
- **1-4**: Select building type (1=Quarry, 2=Forge, 3=Workbench, 4=Coffer)
- **Space/Enter**: Construct building
- **Backspace**: Demolish building
- **R**: Rotate building
- **P**: Pause/resume simulation
- **I**: Toggle inventory panel
- **H**: Toggle buffer stats display on all buildings
- **. / ,**: Speed up / slow down simulation
- **Esc**: Cancel/back, or open menu if nothing to cancel

## Design Reference

See `docs/hotkey-foundry-spec.md` for complete game design specification including stage system, simulation rules, and milestone roadmap.

## Specialized Agents

Reference `.claude/agents/` for domain-specific guidance:

| Agent           | When to Use                                                |
| --------------- | ---------------------------------------------------------- |
| `simulation.md` | Tick engine, recipes, item flow, production/transfer logic |
| `scene.md`      | Phaser scenes, input handling, rendering, events           |
| `sprites.md`    | ASCII → PNG pipeline, adding/modifying sprites             |
| `content.md`    | New buildings, recipes, items, game balance                |
| `types.md`      | TypeScript interfaces, type safety patterns                |
| `debug.md`      | Troubleshooting, state inspection, profiling               |

## Skills (Slash Commands)

Use these skills for common tasks (invoke with `/skillname`):

| Skill        | Purpose                 | Example                           |
| ------------ | ----------------------- | --------------------------------- |
| `/sprite`    | Add new sprites         | `/sprite glowing cursor`          |
| `/item`      | Add item types          | `/item mystic_dust`               |
| `/recipe`    | Add crafting recipes    | `/recipe smelt dust into crystal` |
| `/building`  | Add building types      | `/building splitter`              |
| `/stage`     | Design game levels      | `/stage tutorial mining`          |
| `/playtest`  | Start dev server & test | `/playtest`                       |
| `/debug-sim` | Debug simulation        | `/debug-sim items stuck`          |
| `/balance`   | Analyze game balance    | `/balance forge throughput`       |
| `/refactor`  | Refactor code           | `/refactor GameScene.ts`          |

## Code Style Guidelines (Claude Code Friendly)

Write code that's easy for Claude Code to read, understand, and modify:

### Structure

- **Keep files focused** - One class/module per file, under 300 lines when practical
- **Use flat imports** - Avoid deep nesting; prefer `import { X } from './module'`
- **Colocate related code** - Keep types, constants, and helpers near their usage

### Naming

- **Descriptive names** - `buildingAtCursor` over `b`, `ticksRemaining` over `t`
- **Consistent conventions** - camelCase for variables/functions, PascalCase for types/classes
- **Verb prefixes for functions** - `getBuilding()`, `updateCursor()`, `handleKeyPress()`

### Types

- **Explicit TypeScript types** - Type function parameters and return values
- **Use interfaces for data shapes** - Define clear contracts for objects
- **Avoid `any`** - Use `unknown` with type guards when type is truly unknown

### Functions

- **Single responsibility** - Each function does one thing well
- **Pure when possible** - Minimize side effects, return values instead of mutating
- **Early returns** - Handle edge cases first to reduce nesting

### Comments

- **Explain "why", not "what"** - Code shows what; comments explain intent
- **Document non-obvious behavior** - Edge cases, workarounds, game mechanics
- **Keep comments current** - Update or remove stale comments
