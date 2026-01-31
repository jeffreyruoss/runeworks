# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Runeworks is a keyboard-only, stage-based micro-factory builder game built with Phaser 3 and TypeScript. Set in the realm of Eldoria, players operate a Runeforge - extracting mystical ores from crystal veins, purifying them in enchanted forges, and crafting runic artifacts. Players place production machines on a 40×25 grid and run tick-based simulations to meet quest quotas.

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
- **Space/Enter**: Gather stone / Construct building
- **Backspace**: Demolish building
- **R**: Rotate building
- **P**: Pause/resume simulation
- **I**: Toggle inventory panel
- **H**: Toggle buffer stats display on all buildings
- **. / ,**: Speed up / slow down simulation
- **Esc**: Cancel/back, or open menu if nothing to cancel

## Design Reference

See `docs/runeworks-spec.md` for complete game design specification including stage system, simulation rules, and milestone roadmap.

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

## Maintaining Agents & Skills

Keep `.claude/agents/` and `.claude/skills/` in sync with the codebase:

- **When adding new systems** - Update relevant agent files with new file paths, concepts, and patterns
- **When changing APIs** - Update agent examples and code snippets to reflect current interfaces
- **When adding features** - Consider if a new skill would streamline the workflow
- **When refactoring** - Update line counts, file references, and architectural descriptions
- **When changing game mechanics** - Update content.md with new balance guidelines and simulation.md with new tick behaviors

**Update triggers:**

| Change Type               | Update These Files                                |
| ------------------------- | ------------------------------------------------- |
| New building/recipe/item  | `agents/content.md`, `agents/simulation.md`       |
| New scene or UI component | `agents/scene.md`                                 |
| New sprite category       | `agents/sprites.md`                               |
| New TypeScript patterns   | `agents/types.md`                                 |
| New keyboard controls     | `CLAUDE.md` (controls section), `agents/scene.md` |
| Simulation logic changes  | `agents/simulation.md`, `skills/debug-sim.md`     |

## Quick Reference Paths

Most frequently edited files:

```
src/Simulation.ts          # Tick logic, production, transfers (527 lines)
src/scenes/GameScene.ts    # Input handling, rendering (586 lines)
src/scenes/UIScene.ts      # HUD elements (274 lines)
src/data/recipes.ts        # Recipe definitions
src/data/buildings.ts      # Building specs
src/types.ts               # Core interfaces
src/config.ts              # Game constants
assets/sprites/src/*.txt   # ASCII sprite definitions
```

## Event API

Scene-to-scene communication events (emit from GameScene, listen in UIScene):

| Event                    | Payload                             | When Fired                    |
| ------------------------ | ----------------------------------- | ----------------------------- |
| `gameStateChanged`       | `GameUIState` object                | Every frame with state update |
| `simulationStateChanged` | `SimulationState` object            | When sim starts/stops/ticks   |
| `itemProduced`           | `{ item: ItemType, count: number }` | When building produces items  |
| `menuOpened`             | none                                | Menu panel opens              |
| `menuClosed`             | none                                | Menu panel closes             |
| `inventoryToggled`       | `boolean` (isOpen)                  | Inventory panel toggled       |

## Phaser Patterns

### Depth Layers (z-ordering)

| Depth | Layer      | Usage                         |
| ----- | ---------- | ----------------------------- |
| 0     | Terrain    | Ground, crystal veins         |
| 1     | Grid       | Tile grid lines               |
| 10    | Buildings  | Placed building sprites       |
| 50    | Ghost      | Placement preview sprite      |
| 100   | Cursor     | Cursor highlight              |
| 200   | Indicators | Buffer contents, status icons |
| 1000  | UI Panels  | Menu, inventory overlays      |

### Rotation Convention

```
rotation: 0 = right  (→)
rotation: 1 = down   (↓)
rotation: 2 = left   (←)
rotation: 3 = up     (↑)
```

Rotation indicates the **output direction**. Input sides are defined per building in `buildings.ts`.

### Coordinate System

- Origin (0,0) is top-left
- X increases rightward, Y increases downward
- Grid coordinates are tile indices (0-39 for X, 0-24 for Y)
- Pixel position = tile × 16

## Common Pitfalls

Avoid these frequent mistakes:

| Pitfall                        | Solution                                                   |
| ------------------------------ | ---------------------------------------------------------- |
| Sprites not updating           | Run `npm run sprites` after changing ASCII definitions     |
| Event listener not firing      | Check exact event name spelling (see Event API above)      |
| Items disappearing             | Check buffer capacity limits in `buildings.ts`             |
| Transfer not working           | Verify rotation: output side must face adjacent input side |
| Placement blocked unexpectedly | Check 2×2 buildings need all 4 tiles free                  |
| Simulation not ticking         | Verify `running: true` and `paused: false` in state        |
| Type errors with Maps          | Use `new Map([...])` syntax, not object literals           |
| Ghost sprite wrong rotation    | `ghostRotation` is separate from placed building rotation  |

## Testing Checklist

After making changes, verify:

```bash
npm run build              # TypeScript compiles without errors
npm run dev                # Game loads without console errors
```

**Quick sanity checks:**

- [ ] Place a quarry on crystal vein → extracts ore
- [ ] Place forge adjacent to quarry → receives ore, produces ingots
- [ ] Rotate building before placing → output faces expected direction
- [ ] Delete building → removed cleanly, no orphan sprites
- [ ] Toggle simulation (P) → starts/stops correctly
- [ ] Speed controls (./,) → UI shows 1×/2×/4×

**After sprite changes:**

- [ ] `npm run sprites` completes without errors
- [ ] New sprites appear in game at correct size
- [ ] All 4 rotations render correctly (if applicable)

## Current State vs Roadmap

**Implemented (from spec milestones):**

- ✅ Vite + Phaser + TypeScript setup
- ✅ Grid rendering (40×25)
- ✅ Cursor movement (WASD + Shift)
- ✅ Basic HUD (UIScene)
- ✅ Building selection (1-4 keys)
- ✅ Ghost preview with placement validation
- ✅ Place (Space/Enter) and delete (Backspace)
- ✅ Rotation (R)
- ✅ Tick-based simulation loop
- ✅ Quarry extracts ore from crystal veins
- ✅ Forge smelts ore → ingots
- ✅ Adjacent transfer system (round-robin)
- ✅ Workbench + recipes
- ✅ Coffer storage
- ✅ Sprite generation pipeline

**Not yet implemented:**

- ⬜ Stage system (goals, constraints, progression)
- ⬜ Results screen with bottleneck hints
- ⬜ Stage select / menu scene
- ⬜ Save/load progress (localStorage)
- ⬜ Power budget system
- ⬜ Zoom controls (Q/E)
- ⬜ Audio

**Current items/buildings:**

- Items: arcstone, sunite, arcane_ingot, sun_ingot, cogwheel, thread, rune
- Buildings: quarry (2×2), forge (2×2), workbench (2×2), coffer (1×1)

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
