# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Branch Reminder

At the end of every response, check the current git branch. If it is NOT `main`, append a reminder like:

> **Branch: `<branch-name>`** — remember to switch back to `main` when done.

## Project Overview

Runeworks is a keyboard-only, stage-based micro-factory builder game built with Phaser 4 and TypeScript. Set in the realm of Eldoria, players operate a Runeforge - extracting mystical ores from crystal veins, purifying them in enchanted forges, and crafting runic artifacts. Players place production machines on a 40×25 grid and run tick-based simulations to meet quest quotas.

## Commands

```bash
npm run dev       # Start dev server on port 3000 (auto-opens browser)
npm run build     # TypeScript compile + Vite production build to /dist
npm run preview   # Preview production build locally
npm run sprites   # Regenerate sprite atlas from ASCII definitions
npm test          # Run unit & simulation tests (vitest)
npm run test:watch # Run tests in watch mode during development
```

## Architecture

### Scene Structure (pixui)

All scenes extend `ResponsiveScene` from `phaser-pixui` for automatic integer-zoom scaling. UIScene extends `UiScene` for themed bitmap text and 9-slice frame components.

- **BootScene** (`src/scenes/BootScene.ts`) - Asset loading, bootstraps other scenes (ResponsiveScene)
- **ModeSelectScene** (`src/scenes/ModeSelectScene.ts`) - Game mode selection menu (ResponsiveScene)
- **GameScene** (`src/scenes/GameScene.ts`) - Core gameplay orchestrator (ResponsiveScene, Maximum mode 640×400)
- **UIScene** (`src/scenes/UIScene.ts`) - HUD overlay with bitmap text and 9-slice panels (UiScene, Minimum mode height=400)

### UI Theme (`src/ui-theme.ts`)

Defines the pixui ThemeConfig with CC0 Mana Soul assets (fonts + 9-slice frames). Key exports:

- `uiTheme` — ThemeConfig for UiScene
- `FONT_SM` / `FONT_MD` / `FONT_LG` — bitmap font names (mana_roots/trunk/branches)
- `UI_ATLAS` — atlas key for 9-slice frames

### Core Systems

- **Simulation** (`src/Simulation.ts`) - Tick-based deterministic engine (20 ticks/sec). Handles production phase (buildings process recipes). Delegates transfer to TransferSystem.
- **TransferSystem** (`src/simulation/transfers.ts`) - Round-robin item distribution between adjacent buildings
- **ManaSystem** (`src/simulation/ManaSystem.ts`) - Mana power network: BFS connectivity, speed multipliers, accumulator-based speed gating
- **ResearchSystem** (`src/data/research.ts`, `src/managers/ResearchManager.ts`) - Research recipes (Arcane Study → RP), tech tree with 3 branches (buildings/recipes/upgrades), persisted via localStorage
- **Persistence** (`src/data/persistence.ts`) - localStorage save/load for research progress (versioned, auto-saves on mutation)
- **Building Definitions** (`src/data/buildings.ts`) - Specs for all buildings (Quarry, Forge, Workbench, Chest, Arcane Study, Mana Well/Obelisk/Tower)
- **Recipes** (`src/data/recipes.ts`) - Crafting recipes with input/output mappings and timing
- **Tutorials** (`src/data/tutorials.ts`) - Tutorial stage definitions with step-by-step guidance

### Managers (used by GameScene)

- **InputManager** (`src/managers/InputManager.ts`) - Keyboard setup and key bindings, delegates actions via callbacks
- **TerrainRenderer** (`src/managers/TerrainRenderer.ts`) - Draws crystal veins, stone deposits, and grid lines
- **BuildingPlacer** (`src/managers/BuildingPlacer.ts`) - Ghost preview sprite, placement validation, building creation
- **BuildingManager** (`src/managers/BuildingManager.ts`) - Building CRUD operations (create, delete, sprite management)
- **BufferIndicators** (`src/managers/BufferIndicators.ts`) - Buffer count text overlays on buildings
- **PanelManager** (`src/managers/PanelManager.ts`) - Panel open/close state and mutual exclusion (menu, inventory, guide, objectives, research)
- **StageManager** (`src/managers/StageManager.ts`) - Stage progression, objective tracking, completion flow
- **ResearchManager** (`src/managers/ResearchManager.ts`) - Research points balance, tech tree unlocks, persistence

### Managers (used by UIScene)

- **ObjectivesPanel** (`src/managers/ObjectivesPanel.ts`) - Objectives panel and stage complete overlay rendering
- **GuidePanel** (`src/managers/GuidePanel.ts`) - Full-page reference panel showing resources, items, buildings, and recipes
- **ResearchPanel** (`src/managers/ResearchPanel.ts`) - Research tree panel with branch navigation
- **BuildPanel** (`src/managers/BuildPanel.ts`) - Build mode building selection modal
- **TutorialOverlay** (`src/managers/TutorialOverlay.ts`) - Tutorial text overlay for guided play

### Sprite Pipeline

**ASCII pipeline** (legacy): `assets/sprites/src/*.txt` → `tools/spritegen/generate.js` → `assets/sprites/out/`
**AI pipeline** (active): `tools/spritegen-ai/generate.js` → `assets/sprites/ai-out/` (loaded by BootScene)

The AI pipeline uses the **Google Gemini API** for image generation. After running sprite generation, remind the user to check API usage at:
https://aistudio.google.com/usage?timeRange=last-28-days&project=gen-lang-client-0335300341&tab=billing

**Pipeline order** (post-generation):

1. `generate.js` — generate raw sprites from Gemini
2. `trim-borders.js` — crop border artifacts
3. `fix-transparency.js` — convert checkerboard → real alpha (`npm run sprites:fix`)
4. `pack-atlas.js` — pack into spritesheet

**Tileable sprites**: Sprites with `tileable: true` in `sprites.js` get special post-processing: alpha is flattened onto black (kills Gemini's fake transparency checkerboard), then a 4px oversize+crop removes Gemini's lighter border pixels. Always set `tileable: true` for terrain tiles that must tile seamlessly.

**Non-tileable sprites**: Use `fix-transparency.js` to convert Gemini's fake checkerboard background to real alpha. Uses saturation-gated BFS flood fill from edges — only removes connected low-saturation pixels reachable from the border.

### UI Asset Pipeline (pixel-tools)

**pixel-tools** processes bitmap fonts and UI atlases at build time via Vite plugin:

- Source: `assets/pixui/` (CC0 fonts + 9-slice UI sprites by Gabriel Lima)
- Output: `public/packed_assets/` (generated, gitignored)
- Config: `fonts.yaml` (bitmap font specs), `ui.yaml` (UI atlas with 9-slice borders)
- Vite plugin: `processAssetsDev` / `processAssetsProd` in `vite.config.ts`

## Test Architecture

Tests use **Vitest** with `environment: 'node'`. All tests are pure logic — no Phaser mocks needed.

```
tests/
├── unit/                          # Pure function & data validation tests
│   ├── utils.test.ts              # getBufferTotal, rotateDirection, oppositeDirection
│   ├── utils-extended.test.ts     # addToBuffer, removeFromBuffer, hasIngredients, etc.
│   ├── recipes.test.ts            # RECIPES data, getRecipe, getRecipesForBuilding
│   ├── buildings.test.ts          # BUILDING_DEFINITIONS validation
│   ├── research.test.ts           # RESEARCH_RECIPES, RESEARCH_NODES, getResearchNode
│   ├── terrain.test.ts            # TERRAIN_TO_ITEM, QUARRIABLE_TERRAIN, display names
│   ├── persistence.test.ts        # localStorage save/load with mocked storage
│   └── ResourcePatchManager.test.ts # Patch CRUD, shared pools, depletion
├── simulation/                    # Simulation engine integration tests
│   ├── helpers.ts                 # Test factories (createTestBuilding, tickSimulation, etc.)
│   ├── Simulation.test.ts         # Lifecycle, terrain, speed, tick accumulation, callbacks
│   ├── production.test.ts         # Quarry, forge, workbench production
│   ├── transfer.test.ts           # Adjacent transfers, round-robin, canAcceptItem
│   ├── arcaneStudy.test.ts        # RP production, mana gating, research recipes
│   └── mana.test.ts               # ManaSystem connectivity, BFS, speed multipliers
└── terrain/
    └── patchGenerator.test.ts     # PRNG determinism, blob generation, boundaries
```

**When to add tests:** After adding or modifying any code in `src/utils.ts`, `src/data/`, `src/simulation/`, `src/terrain/`, or `src/Simulation.ts`, run `npm test` and add tests for new behavior.

## Key Configuration (`src/config.ts`)

- Grid: 40×25 tiles at 16×16px (640×400 virtual resolution)
- Scaling: `Scale.NONE` with responsive resize; pixui ResponsiveScene handles integer zoom
- Simulation: 20 ticks/second (50ms per tick)

## Keyboard Controls (GameScene)

- **ESDF**: Move cursor (+ Shift for 5-tile jumps)
- **B**: Toggle build menu
- **Q/W/A** (build mode): Select Quarry/Workbench/Arcane Study (F=Forge, C=Chest intercepted from movement/recipe keys)
- **M/T** (build mode): Select Mana Well/Mana Tower (O=Mana Obelisk intercepted from objectives key)
- **Space/Enter**: Gather stone / Construct building
- **Backspace**: Demolish building
- **R**: Rotate building
- **P**: Pause/resume simulation
- **I**: Toggle inventory panel
- **O**: Toggle objectives panel
- **G**: Toggle guide panel (resources, items, buildings reference)
- **H**: Toggle buffer stats display on all buildings
- **K**: Toggle menu
- **C** (normal mode): Cycle workbench recipe
- **. / ,**: Speed up / slow down simulation
- **X**: Cancel build mode / cancel selection / close panel / go back

## Design Reference

See `docs/runeworks-spec.md` for complete game design specification including stage system, simulation rules, and milestone roadmap.

## Specialized Agents

Reference `.claude/agents/` for domain-specific guidance:

| Agent           | When to Use                                                |
| --------------- | ---------------------------------------------------------- |
| `simulation.md` | Tick engine, recipes, item flow, production/transfer logic |
| `scene.md`      | Phaser scenes, input handling, rendering, events           |
| `sprites.md`    | AI sprite generation, atlas packing, tileable textures     |
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
src/scenes/GameScene.ts           # Gameplay orchestrator (606 lines)
src/Simulation.ts                 # Tick logic, production (404 lines)
src/scenes/UIScene.ts             # pixui UiScene HUD (353 lines)
src/managers/GuidePanel.ts        # Guide panel — bitmap text + 9-slice (276 lines)
src/managers/ResearchPanel.ts     # Research tree panel (249 lines)
src/managers/ObjectivesPanel.ts   # Objectives & stage complete (244 lines)
src/managers/BuildingPlacer.ts    # Placement validation, ghost sprite (230 lines)
src/utils.ts                      # Pure helpers (189 lines)
src/simulation/transfers.ts       # Item distribution (181 lines)
src/managers/StageManager.ts      # Stage progression & objectives (175 lines)
src/managers/ResearchManager.ts   # Research points & tech tree (139 lines)
src/managers/InputManager.ts      # Keyboard bindings (136 lines)
src/managers/BuildPanel.ts        # Build mode selection modal (119 lines)
src/managers/MenuPanel.ts         # Menu panel — bitmap text + 9-slice (120 lines)
src/managers/PanelManager.ts      # Panel state & mutual exclusion (106 lines)
src/config.ts                     # Constants & THEME palette (102 lines)
src/data/research.ts              # Research recipes & tech tree nodes (141 lines)
src/data/tutorials.ts             # Tutorial stage definitions (106 lines)
src/data/buildings.ts             # Building specs (100 lines)
src/managers/TutorialOverlay.ts   # Tutorial text overlay (92 lines)
src/managers/BufferIndicators.ts  # Buffer overlays (80 lines)
src/managers/BuildingManager.ts   # Building CRUD operations (66 lines)
src/ui-theme.ts                   # pixui ThemeConfig, font/atlas constants (61 lines)
src/data/persistence.ts           # localStorage research save/load (59 lines)
src/managers/TerrainRenderer.ts   # Terrain/grid drawing (58 lines)
src/data/recipes.ts               # Recipe definitions (58 lines)
src/managers/InventoryPanel.ts    # Inventory panel (56 lines)
src/types.ts                      # Core interfaces (146 lines)
assets/pixui/                     # CC0 bitmap fonts + UI sprites (source)
```

## Event API

Scene-to-scene communication events (emit from GameScene, listen in UIScene):

**Primary event (UIScene subscribes to this):**

| Event              | Payload                  | When Fired                    |
| ------------------ | ------------------------ | ----------------------------- |
| `gameStateChanged` | `GameUIState` object     | Every frame with state update |
| `researchNavigate` | `dx: number, dy: number` | Arrow keys in research panel  |
| `researchUnlock`   | none                     | Research node purchased       |

**Internal events (emitted but not cross-scene):**

| Event                    | Payload                             | When Fired                     |
| ------------------------ | ----------------------------------- | ------------------------------ |
| `simulationStateChanged` | `SimulationState` object            | When sim starts/stops/ticks    |
| `itemProduced`           | `{ item: ItemType, count: number }` | When building produces items   |
| `menuOpened`             | none                                | Menu panel opens               |
| `menuClosed`             | none                                | Menu panel closes              |
| `inventoryToggled`       | `boolean` (isOpen)                  | Inventory panel toggled        |
| `uiReady`                | none                                | UIScene requests initial state |

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
| Sprites not updating           | Run `pack-atlas.js` after changing PNGs, then hard-refresh browser                |
| Gemini border artifacts        | Set `tileable: true` in sprites.js — flattens alpha + crops edges automatically   |
| White edges on terrain tiles   | Ensure `tileable: true` is set; Gemini adds fake transparency checkerboard        |
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
npm test                   # All unit & simulation tests pass
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
- ✅ Building selection (B key → build panel modal)
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
- ✅ Objectives panel (O key — progress tracking)
- ✅ Guide panel (G key — resources, items, buildings reference)
- ✅ Multi-resource terrain and gathering
- ✅ pixui responsive UI (bitmap fonts, 9-slice panels, auto integer zoom)
- ✅ Research system (Arcane Study → RP, tech tree with 3 branches)
- ✅ Research persistence (localStorage save/load)
- ✅ Tutorial mode (guided step-by-step play)
- ✅ Mana power network (Well/Obelisk/Tower, BFS connectivity)

**Not yet implemented:**

- ⬜ Results screen with bottleneck hints
- ⬜ Stage select / menu scene
- ⬜ Full save/load progress (only research is persisted currently)
- ⬜ Power budget system
- ⬜ Zoom controls
- ⬜ Audio

**Current items/buildings:**

- Items: arcstone, sunite, arcane_ingot, sun_ingot, cogwheel, thread, rune, stone, wood, iron, clay, crystal_shard
- Buildings: quarry (2×2), forge (2×2), workbench (2×2), chest (1×1), arcane_study (2×2), mana_well (1×1), mana_obelisk (2×2), mana_tower (1×1)

## Modularity Guidelines

Keep the codebase modular so Claude Code can read, understand, and modify files without needing excessive context.

### File Size Limits

- **Target: under 300 lines per file.** Files over 300 lines should be split.
- **Hard limit: 500 lines.** Files approaching this need refactoring before adding more code.
- When a file grows past 300 lines, extract a cohesive subsystem into its own module before continuing.

### Current Modularity Debt

| File            | Lines | Status                                                                     |
| --------------- | ----- | -------------------------------------------------------------------------- |
| `GameScene.ts`  | 606   | Over hard limit; cursor visuals and panel wiring are extraction candidates |
| `Simulation.ts` | 404   | Over hard limit; research tick logic or mana tick could be extracted       |
| `UIScene.ts`    | 353   | Over target; bar layout and help text could be extracted                   |

**Rule: When a file grows past 300 lines, extract a cohesive subsystem before or alongside your change.** Don't make large files larger.

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
├── scenes/          # Phaser scenes (all extend pixui ResponsiveScene)
│   ├── BootScene.ts          # Asset loading (ResponsiveScene)
│   ├── ModeSelectScene.ts    # Game mode selection (ResponsiveScene)
│   ├── GameScene.ts          # Gameplay orchestrator (ResponsiveScene)
│   └── UIScene.ts            # HUD rendering (pixui UiScene)
├── managers/        # Stateful subsystems used by scenes
│   ├── InputManager.ts       # Keyboard setup & bindings
│   ├── TerrainRenderer.ts    # Crystal/stone/grid drawing
│   ├── BuildingPlacer.ts     # Ghost sprite & placement logic
│   ├── BuildingManager.ts    # Building CRUD operations
│   ├── BufferIndicators.ts   # Buffer count overlays
│   ├── PanelManager.ts       # Panel open/close state & mutual exclusion
│   ├── StageManager.ts       # Stage progression & objective tracking
│   ├── ResearchManager.ts    # Research points balance & tech tree unlocks
│   ├── ObjectivesPanel.ts    # Objectives panel (bitmap text + 9-slice)
│   ├── GuidePanel.ts         # Full-page reference guide (bitmap text + 9-slice)
│   ├── MenuPanel.ts          # Menu panel (bitmap text + 9-slice)
│   ├── InventoryPanel.ts     # Inventory panel (bitmap text + 9-slice)
│   ├── ResearchPanel.ts      # Research tree panel (bitmap text + 9-slice)
│   ├── BuildPanel.ts         # Build mode selection modal
│   └── TutorialOverlay.ts    # Tutorial text overlay
├── simulation/      # Tick engine subsystems
│   ├── transfers.ts          # Round-robin item distribution
│   └── ManaSystem.ts         # Mana power network & speed gating
├── data/            # Static definitions
│   ├── buildings.ts          # Building specs
│   ├── recipes.ts            # Crafting recipes
│   ├── research.ts           # Research recipes & tech tree nodes
│   ├── stages.ts             # Stage definitions & display names
│   ├── terrain.ts            # Terrain types, colors, display names
│   ├── tutorials.ts          # Tutorial stage definitions
│   └── persistence.ts        # localStorage save/load for research
├── terrain/         # Terrain generation
│   ├── terrainSetup.ts       # Procedural terrain patch generation
│   ├── patchGenerator.ts     # Seeded blob generation (Mulberry32 PRNG)
│   └── ResourcePatchManager.ts # Resource patch HP pools
├── Simulation.ts    # Core tick engine (production phase)
├── types.ts         # Shared interfaces
├── config.ts        # Game constants & THEME palette
├── ui-theme.ts      # pixui ThemeConfig, font/atlas constants
├── utils.ts         # Pure helpers (buffers, directions, lookups)
└── main.ts          # Phaser game config & entry point (responsive scaling)
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
