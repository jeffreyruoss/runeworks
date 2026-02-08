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
- **GameScene** (`src/scenes/GameScene.ts`) - Core gameplay orchestrator: wires together managers, handles cursor state, delegates input/rendering/placement
- **UIScene** (`src/scenes/UIScene.ts`) - HUD overlay: status bars, hotbar legend, help text. Listens to GameScene events.

### Core Systems

- **Simulation** (`src/Simulation.ts`) - Tick-based deterministic engine (20 ticks/sec). Handles production phase (buildings process recipes). Delegates transfer to TransferSystem.
- **TransferSystem** (`src/simulation/transfers.ts`) - Round-robin item distribution between adjacent buildings
- **Building Definitions** (`src/data/buildings.ts`) - Specs for Quarry, Forge, Workbench, Chest
- **Recipes** (`src/data/recipes.ts`) - Crafting recipes with input/output mappings and timing

### Managers (used by GameScene)

- **InputManager** (`src/managers/InputManager.ts`) - Keyboard setup and key bindings, delegates actions via callbacks
- **TerrainRenderer** (`src/managers/TerrainRenderer.ts`) - Draws crystal veins, stone deposits, and grid lines
- **BuildingPlacer** (`src/managers/BuildingPlacer.ts`) - Ghost preview sprite, placement validation, building creation
- **BufferIndicators** (`src/managers/BufferIndicators.ts`) - Buffer count text overlays on buildings
- **PanelManager** (`src/managers/PanelManager.ts`) - Panel open/close state and mutual exclusion (menu, inventory, guide, objectives)
- **StageManager** (`src/managers/StageManager.ts`) - Stage progression, objective tracking, completion flow

### Managers (used by UIScene)

- **ObjectivesPanel** (`src/managers/ObjectivesPanel.ts`) - Objectives panel and stage complete overlay rendering
- **GuidePanel** (`src/managers/GuidePanel.ts`) - Full-page reference panel showing resources, items, buildings, and recipes

### Sprite Pipeline

ASCII art in `assets/sprites/src/*.txt` → `tools/spritegen/generate.js` → PNG atlas in `assets/sprites/out/`

## Key Configuration (`src/config.ts`)

- Grid: 40×25 tiles at 16×16px (640×400 virtual resolution)
- Default zoom: 4× (renders at 2560×1600)
- Simulation: 20 ticks/second (50ms per tick)

## Keyboard Controls (GameScene)

- **ESDF**: Move cursor (+ Shift for 5-tile jumps)
- **B**: Toggle build menu (shows Q/F/W/C building options)
- **Q/F/W/C** (build mode): Select Quarry/Forge/Workbench/Chest
- **Space/Enter**: Gather stone / Construct building
- **Backspace**: Demolish building
- **R**: Rotate building
- **P**: Pause/resume simulation
- **I**: Toggle inventory panel
- **G**: Toggle guide panel (resources, items, buildings reference)
- **H**: Toggle buffer stats display on all buildings
- **C** (normal mode): Cycle workbench recipe
- **. / ,**: Speed up / slow down simulation
- **M**: Toggle menu
- **X / Esc**: Cancel build mode / cancel selection / close panel / go back

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
| `/review`    | Code review             | `/review src/Simulation.ts`       |

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
src/scenes/GameScene.ts           # Gameplay orchestrator (435 lines)
src/Simulation.ts                 # Tick logic, production (278 lines)
src/managers/GuidePanel.ts        # Guide panel with resources/items/buildings (271 lines)
src/scenes/UIScene.ts             # HUD elements (341 lines)
src/managers/BuildingPlacer.ts    # Placement validation, ghost sprite (201 lines)
src/managers/ObjectivesPanel.ts   # Objectives & stage complete overlay (190 lines)
src/simulation/transfers.ts       # Item distribution (166 lines)
src/managers/InputManager.ts      # Keyboard bindings (128 lines)
src/managers/TerrainRenderer.ts   # Terrain/grid drawing (101 lines)
src/managers/StageManager.ts      # Stage progression & objectives (97 lines)
src/utils.ts                      # Pure helpers (94 lines)
src/managers/PanelManager.ts      # Panel state & mutual exclusion (91 lines)
src/managers/BufferIndicators.ts  # Buffer overlays (72 lines)
src/config.ts                     # Constants (69 lines)
src/data/recipes.ts               # Recipe definitions
src/data/buildings.ts             # Building specs
src/types.ts                      # Core interfaces
assets/sprites/src/*.txt          # ASCII sprite definitions
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

| Pitfall                        | Solution                                                                          |
| ------------------------------ | --------------------------------------------------------------------------------- |
| Sprites not updating           | Run `npm run sprites` after changing ASCII definitions                            |
| Event listener not firing      | Check exact event name spelling (see Event API above)                             |
| Items disappearing             | Check buffer capacity limits in `buildings.ts`                                    |
| Transfer not working           | Verify rotation: output side must face adjacent input side                        |
| Placement blocked unexpectedly | Check 2×2 buildings need all 4 tiles free                                         |
| Simulation not ticking         | Verify `running: true` and `paused: false` in state                               |
| Type errors with Maps          | Use `new Map([...])` syntax, not object literals                                  |
| Ghost sprite wrong rotation    | `ghostRotation` lives in `BuildingPlacer`, separate from placed building rotation |

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
- ✅ Cursor movement (ESDF + Shift)
- ✅ Basic HUD (UIScene)
- ✅ Building selection (B key → build menu with Q/F/W/C)
- ✅ Ghost preview with placement validation
- ✅ Place (Space/Enter) and delete (Backspace)
- ✅ Rotation (R)
- ✅ Tick-based simulation loop
- ✅ Quarry extracts ore from crystal veins
- ✅ Forge smelts ore → ingots
- ✅ Adjacent transfer system (round-robin)
- ✅ Workbench + recipes
- ✅ Chest storage
- ✅ Sprite generation pipeline
- ✅ Stage system (10 stages with objectives and progression)
- ✅ Guide panel (G key — resources, items, buildings reference)
- ✅ Multi-resource terrain and gathering

**Not yet implemented:**

- ⬜ Results screen with bottleneck hints
- ⬜ Stage select / menu scene
- ⬜ Save/load progress (localStorage)
- ⬜ Power budget system
- ⬜ Zoom controls
- ⬜ Audio

**Current items/buildings:**

- Items: arcstone, sunite, arcane_ingot, sun_ingot, cogwheel, thread, rune, stone, wood, iron, clay, crystal_shard
- Buildings: quarry (2×2), forge (2×2), workbench (2×2), chest (1×1)

## Modularity Guidelines

Keep the codebase modular so Claude Code can read, understand, and modify files without needing excessive context.

### File Size Limits

- **Target: under 300 lines per file.** Files over 300 lines should be split.
- **Hard limit: 500 lines.** Files approaching this need refactoring before adding more code.
- When a file grows past 300 lines, extract a cohesive subsystem into its own module before continuing.

### Current Modularity Debt

| File           | Lines | Status                                                                  |
| -------------- | ----- | ----------------------------------------------------------------------- |
| `GameScene.ts` | 435   | Over target; building CRUD and cursor visuals are extraction candidates |
| `UIScene.ts`   | 341   | Slightly over target; menu/inventory panels could extract to managers   |

All other files are under 300 lines. **Rule: When a file grows past 300 lines, extract a cohesive subsystem before or alongside your change.** Don't make large files larger.

### Extraction Patterns

When splitting a file, follow these established patterns:

**Manager classes** - For stateful subsystems that scenes orchestrate:

```typescript
// Manager receives scene ref and callbacks in constructor
this.inputManager = new InputManager(this, {
  moveCursor: (dx, dy) => this.moveCursor(dx, dy),
  // ...
});

// Manager owns its visual artifacts (sprites, graphics, text)
this.terrainRenderer = new TerrainRenderer(this);
this.terrainRenderer.drawTerrain((x, y) => this.simulation.getTerrain(x, y));
```

**Subsystem classes** - For engine subsystems with internal state:

```typescript
// TransferSystem owns round-robin state, Simulation delegates to it
private transferSystem = new TransferSystem();
// In tick():
this.transferSystem.transferAll(this.buildings);
```

**Pure functions in utils.ts** - For stateless helpers used across modules:

```typescript
// Shared buffer operations, direction math, building lookups
export function addToBuffer(buffer: Map<ItemType, number>, item: ItemType, count: number): void;
export function getBuildingAt(x: number, y: number, buildings: Building[]): Building | null;
```

### Module Organization

```
src/
├── scenes/          # Phaser scenes (thin orchestrators)
│   ├── BootScene.ts       # Asset loading
│   ├── GameScene.ts       # Gameplay orchestrator
│   └── UIScene.ts         # HUD rendering
├── managers/        # Stateful subsystems used by scenes
│   ├── InputManager.ts    # Keyboard setup & bindings
│   ├── TerrainRenderer.ts # Crystal/stone/grid drawing
│   ├── BuildingPlacer.ts  # Ghost sprite & placement logic
│   ├── BufferIndicators.ts# Buffer count overlays
│   ├── PanelManager.ts   # Panel open/close state & mutual exclusion
│   ├── StageManager.ts   # Stage progression & objective tracking
│   ├── ObjectivesPanel.ts# Objectives panel & stage complete overlay
│   └── GuidePanel.ts     # Full-page reference guide panel
├── simulation/      # Tick engine subsystems
│   └── transfers.ts       # Round-robin item distribution
├── data/            # Static definitions
│   ├── buildings.ts       # Building specs
│   ├── recipes.ts         # Crafting recipes
│   ├── stages.ts          # Stage definitions & display names
│   └── terrain.ts         # Terrain types, colors, display names
├── terrain/         # Terrain generation
│   └── terrainSetup.ts    # Procedural terrain patch generation
├── Simulation.ts    # Core tick engine (production phase)
├── types.ts         # Shared interfaces
├── config.ts        # Game constants & shared abbreviations
├── utils.ts         # Pure helpers (buffers, directions, lookups)
└── main.ts          # Phaser game config & entry point
```

### Principles

- **One responsibility per file** - If you can't describe a file's purpose in one sentence, split it
- **Scenes are orchestrators** - Scenes should wire together managers, not contain business logic
- **Prefer pure functions over classes** - Extract logic as functions when no state is needed
- **No circular imports** - Current codebase has zero; keep it that way
- **Flat imports** - `import { X } from './module'`, avoid deep nesting

## Code Style Guidelines (Claude Code Friendly)

Write code that's easy for Claude Code to read, understand, and modify:

### Structure

- **Keep files focused** - One class/module per file, under 300 lines (see Modularity Guidelines)
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
