# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Branch Reminder

At the end of every response, check the current git branch. If it is NOT `main`, append a reminder like:

> **Branch: `<branch-name>`** — remember to switch back to `main` when done.

## Project Overview

Runeworks is a keyboard-only, stage-based micro-factory builder game built with Phaser 4 and TypeScript. Set in the realm of Eldoria, players place production machines on a 40×25 grid and optimize factory layouts under tight constraints — grid space, resource scarcity, time pressure, and gold economy all trade off against each other. Multiple viable strategies exist per stage (upgrade vs sprawl, trade vs produce, research vs rush). See `docs/game-design-v2.md` for the expanded design vision.

## Commands

```bash
npm run dev          # Start dev server on port 3000 (auto-opens browser)
npm run build        # TypeScript compile + Vite production build to /dist
npm run preview      # Preview production build locally
npm run sprites:ai   # Generate AI sprites via Gemini
npm run sprites:fix  # Fix checkerboard transparency on AI sprites
npm run sprites:ai:pack # Rebuild AI sprite atlas
npm test             # Run unit & simulation tests (vitest)
npm run test:watch   # Run tests in watch mode during development
```

## Design Reference

See `docs/game-design-v2.md` for the game design vision: building construction costs, gold/quest economy, manual + automated trading, interest via Money Changer, grid pressure, multiple production paths, stage schema, results screen, accessibility, and multiplayer concepts.

## Architecture

### Scene Structure (pixui)

All scenes extend `ResponsiveScene` from `phaser-pixui` for automatic integer-zoom scaling. UIScene extends `UiScene` for themed bitmap text and 9-slice frame components.

- **BootScene** (`src/scenes/BootScene.ts`) - Asset loading, bootstraps other scenes
- **ModeSelectScene** (`src/scenes/ModeSelectScene.ts`) - Game mode selection menu
- **LoadingScene** (`src/scenes/LoadingScene.ts`) - Transition screen with progress bar and tips
- **GameScene** (`src/scenes/GameScene.ts`) - Core gameplay orchestrator (Maximum mode 640×400)
- **UIScene** (`src/scenes/UIScene.ts`) - HUD overlay with bitmap text and 9-slice panels

### Core Systems

- **Simulation** (`src/Simulation.ts`) - Tick-based deterministic engine (20 ticks/sec). Delegates transfer to TransferSystem.
- **TransferSystem** (`src/simulation/transfers.ts`) - Round-robin item distribution between adjacent buildings
- **ManaSystem** (`src/simulation/ManaSystem.ts`) - Mana power network: BFS connectivity, speed multipliers
- **Building Definitions** (`src/data/buildings.ts`) - Specs for all buildings
- **Recipes** (`src/data/recipes.ts`) - Crafting recipes with input/output mappings and timing
- **Research** (`src/data/research.ts`, `src/managers/ResearchManager.ts`) - Tech tree with 3 branches, persisted via localStorage
- **Persistence** (`src/data/persistence.ts`) - localStorage save/load (versioned)

### Managers

GameScene managers: InputManager, TerrainRenderer, BuildingPlacer, BuildingManager, BufferIndicators, PanelManager, StageManager, ResearchManager — all in `src/managers/`.

UIScene managers: ObjectivesPanel, GuidePanel, ResearchPanel, BuildPanel, MenuPanel, InventoryPanel, TutorialOverlay — all in `src/managers/`.

### UI Theme (`src/ui-theme.ts`)

- `uiTheme` — ThemeConfig for UiScene (CC0 Mana Soul assets)
- `FONT_SM` / `FONT_MD` / `FONT_LG` — bitmap font names
- `UI_ATLAS` — atlas key for 9-slice frames

### Sprite Pipeline

`tools/spritegen-ai/generate.js` → `assets/sprites/ai-out/` (loaded by BootScene). Uses **Google Gemini API**.

After sprite generation, check API usage: https://aistudio.google.com/usage?timeRange=last-28-days&project=gen-lang-client-0335300341&tab=billing

- `tileable: true` in `sprites.js` → flattens alpha onto black + crops edges (for terrain tiles)
- Non-tileable sprites → run `npm run sprites:fix` to convert checkerboard to real alpha

### Audio (`src/audio.ts`)

Procedural 8-bit sounds via jsfxr. Design at https://sfxr.me, store params in `audio.ts`, export `playXxxSound()`.

## Key Configuration (`src/config.ts`)

- Grid: 40×25 tiles at 16×16px (640×400 virtual resolution)
- Simulation: 20 ticks/second (50ms per tick)

## Keyboard Controls (GameScene)

- **ESDF**: Move cursor (+ Shift for 5-tile jumps)
- **B**: Toggle build bar (inline bottom HUD)
- **Q/W/A** (build bar): Select Quarry/Workbench/Arcane Study
- **M/T** (build bar): Select Mana Well/Mana Tower
- **Space/Enter**: Gather stone / Construct building
- **Backspace**: Demolish building
- **R**: Rotate building
- **M** (placement mode): Toggle multi-place (default: single-place, re-opens build bar)
- **P**: Pause/resume simulation
- **I/O/G/K**: Toggle inventory/objectives/guide/menu panels
- **H**: Toggle buffer stats display on all buildings
- **C** (normal mode): Cycle workbench recipe
- **. / ,**: Speed up / slow down simulation
- **X**: Cancel build mode / cancel selection / close panel / go back

## Event API (cross-scene)

| Event              | Payload                  | When Fired                    |
| ------------------ | ------------------------ | ----------------------------- |
| `gameStateChanged` | `GameUIState` object     | Every frame with state update |
| `researchNavigate` | `dx: number, dy: number` | Arrow keys in research panel  |
| `researchUnlock`   | none                     | Research node purchased       |

## Phaser Patterns

**Depth layers:** 0=Terrain, 1=Grid, 10=Buildings, 50=Ghost, 100=Cursor, 200=Indicators, 1000=UI Panels

**Rotation:** 0=right, 1=down, 2=left, 3=up. Indicates **output direction**. Input sides defined in `buildings.ts`.

**Coordinates:** Origin (0,0) top-left. Grid indices 0-39 X, 0-24 Y. Pixel = tile × 16.

## Testing

Tests use **Vitest** (`environment: 'node'`), pure logic — no Phaser mocks. Test dirs: `tests/unit/`, `tests/simulation/`, `tests/terrain/`.

**When to add tests:** After modifying `src/utils.ts`, `src/data/`, `src/simulation/`, `src/terrain/`, or `src/Simulation.ts`.

**After changes:** `npm test` → `npm run build` → `npm run dev` (check console).

## Current Items & Buildings

- Items: arcstone, sunite, arcane_ingot, sun_ingot, cogwheel, thread, rune, stone, wood, iron, clay, crystal_shard
- Buildings: quarry (2×2), forge (2×2), workbench (2×2), chest (1×1), arcane_study (2×2), mana_well (1×1), mana_obelisk (2×2), mana_tower (1×1)

## Common Pitfalls

| Pitfall                        | Solution                                                           |
| ------------------------------ | ------------------------------------------------------------------ |
| Sprites not updating           | Run `pack-atlas.js` after changing PNGs, then hard-refresh browser |
| Checkerboard on sprites        | `npm run sprites:fix` for non-tileable; `tileable: true` for tiles |
| Transfer not working           | Verify rotation: output side must face adjacent input side         |
| Placement blocked unexpectedly | 2×2 buildings need all 4 tiles free                                |
| Ghost sprite wrong rotation    | `ghostRotation` in BuildingPlacer, separate from placed rotation   |

## Modularity Guidelines

- **Target: under 300 lines per file.** Hard limit: 500 lines.
- **One responsibility per file.** Scenes are orchestrators, not business logic containers.
- **Extraction patterns:** Manager classes (stateful, receive scene ref), Subsystem classes (engine internals), Pure functions in `utils.ts`.
- **No circular imports.** Use flat imports: `import { X } from './module'`.

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

| Skill       | Purpose              | Skill        | Purpose                 |
| ----------- | -------------------- | ------------ | ----------------------- |
| `/sprite`   | Add new sprites      | `/playtest`  | Start dev server & test |
| `/item`     | Add item types       | `/debug-sim` | Debug simulation        |
| `/recipe`   | Add crafting recipes | `/balance`   | Analyze game balance    |
| `/building` | Add building types   | `/refactor`  | Refactor code           |
| `/stage`    | Design game levels   | `/review`    | Code review             |

## Maintaining Agents & Skills

Keep `.claude/agents/` and `.claude/skills/` in sync with the codebase when adding new systems, changing APIs, or modifying game mechanics.
