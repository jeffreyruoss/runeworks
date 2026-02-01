# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Runeworks is a keyboard-only, stage-based micro-factory builder game built with Phaser 3 and TypeScript. Players place production machines on a 40×25 grid and run tick-based simulations to meet stage goals. The game features a deterministic simulation engine where buildings automatically transfer items to adjacent machines (no belts), creating a spatial puzzle.

## Commands

```bash
# Development
npm run dev       # Start dev server on port 3000 (auto-opens browser)
npm run build     # TypeScript compile + Vite production build to /dist
npm run preview   # Preview production build locally

# Code Quality
npm run format       # Format all code with Prettier
npm run format:check # Check formatting without modifying files

# Asset Generation
npm run sprites   # Regenerate sprite atlas from ASCII art in assets/sprites/src/*.txt
```

## Architecture

### Scene System (Phaser 3)

The game uses Phaser's multi-scene architecture with three core scenes:

- **BootScene** (`src/scenes/BootScene.ts`) - Loads all assets (sprites, fonts) and bootstraps GameScene and UIScene
- **GameScene** (`src/scenes/GameScene.ts`) - Core gameplay loop: grid rendering, cursor movement, building placement/deletion/rotation, keyboard input handling
- **UIScene** (`src/scenes/UIScene.ts`) - HUD overlay running in parallel with GameScene. Listens to GameScene events and displays status bars, hotbar legend, help text

Scenes communicate via Phaser's event system. GameScene emits `gameStateChanged` and `simulationStateChanged` events; UIScene listens and updates displays.

### Simulation Engine

**Simulation.ts** is the deterministic tick-based engine (20 ticks/second = 50ms per tick):

1. **Production Phase** - Buildings process recipes and extract resources
   - Quarries extract ore from crystal veins (1 ore per 20 ticks = 1/second)
   - Forges purify ore into ingots (40 tick craft time)
   - Workbenches craft items according to selected recipes
   - Coffers just store items (no production)

2. **Transfer Phase** - Round-robin item distribution to adjacent machines
   - Buildings push items from output buffer to adjacent machines' input buffers
   - Only transfers to machines that accept the item type and have buffer space
   - Multiple valid targets → round-robin distribution (state tracked per building)
   - Full output buffers block production (bottleneck mechanic)

The simulation is deterministic: same building layout + seed = same results every time.

### Data-Driven Design

- **Buildings** (`src/data/buildings.ts`) - Defines specs for all building types (quarry, forge, workbench, coffer) including size, power cost, input/output sides, buffer sizes
- **Recipes** (`src/data/recipes.ts`) - Crafting recipes with input/output item mappings and craft time in ticks
- **Config** (`src/config.ts`) - Game constants: grid size (40×25), tile size (16px), simulation rate (20 tps), default zoom (4×)
- **Types** (`src/types.ts`) - Core TypeScript interfaces for Building, Recipe, SimulationState, etc.

### Building Placement System

Buildings have input/output sides that must align for item transfer:

- **Rotation** - 0=right(→), 1=down(↓), 2=left(←), 3=up(↑) indicates output direction
- **Adjacency** - Building's output side must face adjacent building's input side
- **Validation** - 2×2 buildings require all 4 tiles to be empty before placement
- **Terrain** - Quarries must be placed on crystal veins (arcstone or sunite)

### Sprite Pipeline

ASCII art → PNG atlas workflow:

1. Create/edit ASCII art in `assets/sprites/src/*.txt`
2. Run `npm run sprites` to execute `tools/spritegen/generate.js`
3. Script generates PNG atlas in `assets/sprites/out/`
4. BootScene loads sprite atlas at startup

## Key Configuration

- **Grid**: 40×25 tiles at 16×16px (640×400 virtual resolution)
- **Default zoom**: 4× (renders at 2560×1600)
- **Simulation**: 20 ticks/second (50ms per tick)
- **Quarry extraction**: 1 ore per 20 ticks (1/second)
- **Forge smelting**: 40 ticks (2 seconds)
- **Building sizes**: Quarry/Forge/Workbench = 2×2, Coffer = 1×1

## Keyboard Controls

All game controls are keyboard-only (designed for accessibility and speed):

| Key         | Action                                                          |
| ----------- | --------------------------------------------------------------- |
| WASD        | Move cursor (+ Shift for 5-tile jumps)                          |
| 1-4         | Select building type (1=Quarry, 2=Forge, 3=Workbench, 4=Coffer) |
| Space/Enter | Gather stone / Construct building                               |
| Backspace   | Demolish building                                               |
| R           | Rotate building                                                 |
| P           | Pause/resume simulation                                         |
| I           | Toggle inventory panel                                          |
| H           | Toggle buffer stats display on all buildings                    |
| . / ,       | Speed up / slow down simulation (1×/2×/4×)                      |
| Esc         | Cancel/back, or open menu if nothing to cancel                  |

## Event System

GameScene emits events that UIScene listens to:

| Event                       | Payload                             | When Fired                    |
| --------------------------- | ----------------------------------- | ----------------------------- |
| `gameStateChanged`          | `GameUIState` object                | Every frame with state update |
| `simulationStateChanged`    | `SimulationState` object            | When sim starts/stops/ticks   |
| `itemProduced`              | `{ item: ItemType, count: number }` | When building produces items  |
| `menuOpened` / `menuClosed` | none                                | Menu panel state changes      |
| `inventoryToggled`          | `boolean` (isOpen)                  | Inventory panel toggled       |

## Rotation and Coordinate System

- **Rotation convention**: 0=right, 1=down, 2=left, 3=up (represents output direction)
- **Coordinate origin**: (0,0) is top-left corner
- **Axes**: X increases rightward, Y increases downward
- **Grid to pixel**: pixel_position = tile_coordinate × 16

## Depth Layers (z-ordering)

| Depth | Layer      | Usage                         |
| ----- | ---------- | ----------------------------- |
| 0     | Terrain    | Ground, crystal veins         |
| 1     | Grid       | Tile grid lines               |
| 10    | Buildings  | Placed building sprites       |
| 50    | Ghost      | Placement preview sprite      |
| 100   | Cursor     | Cursor highlight              |
| 200   | Indicators | Buffer contents, status icons |
| 1000  | UI Panels  | Menu, inventory overlays      |

## Game Items and Buildings

**Current Items**: arcstone (ore), sunite (ore), arcane_ingot, sun_ingot, cogwheel, thread, rune

**Current Buildings**:

- **Quarry** (2×2) - Extracts ore from crystal veins, no inputs, output: right
- **Forge** (2×2) - Purifies ore into ingots, input: left, output: right
- **Workbench** (2×2) - Crafts items from recipes, input: left/up, output: right
- **Coffer** (1×1) - Storage, all sides input/output, 50 item capacity

## Common Patterns

### Testing Changes

```bash
npm run build     # Verify TypeScript compiles without errors
npm run dev       # Launch game and verify in browser
```

**Quick sanity checks**:

1. Place quarry on crystal vein → should extract ore
2. Place forge adjacent to quarry → should receive ore and produce ingots
3. Rotate building before placing → output should face expected direction
4. Delete building → should remove cleanly with no orphan sprites
5. Toggle simulation (P) → should start/stop correctly
6. Speed controls (./,) → UI should show 1×/2×/4× speed

### After Sprite Changes

```bash
npm run sprites   # Must regenerate atlas after editing ASCII art
npm run dev       # Verify new sprites appear at correct size and rotation
```

### Adding New Buildings

1. Add BuildingType to `src/types.ts`
2. Add definition to `src/data/buildings.ts` (specify size, power, input/output sides, buffer sizes)
3. Add sprite ASCII art to `assets/sprites/src/` directory
4. Run `npm run sprites` to generate sprite atlas
5. Update `src/scenes/GameScene.ts` keyboard bindings if adding to hotbar
6. If building produces items, add update logic to `src/Simulation.ts`

### Adding New Recipes

1. Add ItemType to `src/types.ts` if introducing new items
2. Add Recipe to `src/data/recipes.ts` with inputs/outputs/craftTime/building
3. Recipe automatically available to specified building type

## Implementation Status

**Implemented**:

- ✅ Phaser 3 + TypeScript + Vite setup
- ✅ 40×25 grid rendering
- ✅ Keyboard-only cursor movement with WASD + Shift
- ✅ Building selection, ghost preview, placement validation
- ✅ Building placement (Space/Enter) and deletion (Backspace)
- ✅ Building rotation (R key)
- ✅ Tick-based simulation engine (20 tps)
- ✅ Quarry ore extraction from crystal veins
- ✅ Forge smelting system
- ✅ Workbench crafting with recipes
- ✅ Coffer storage
- ✅ Adjacent item transfer with round-robin distribution
- ✅ Sprite generation pipeline from ASCII art
- ✅ UIScene HUD overlay
- ✅ Simulation speed controls (1×/2×/4×)

**Not Yet Implemented**:

- ⬜ Stage system (goals, constraints, progression)
- ⬜ Results screen with bottleneck analysis
- ⬜ Stage select / menu scene
- ⬜ Save/load progress (localStorage)
- ⬜ Power budget system
- ⬜ Zoom controls (Q/E keys)
- ⬜ Audio/sound effects

## Related Documentation

- **Game Design Spec**: `docs/runeworks-spec.md` - Complete specification including stage system, simulation rules, milestone roadmap
- **Claude Code Guide**: `CLAUDE.md` - Detailed guidance for Claude Code with specialized agents and skills (reference this for deeper technical details)
- **Specialized Agents**: `.claude/agents/` - Domain-specific guides for simulation, scenes, sprites, content, types, debugging
- **Prettier Config**: `.prettierrc` - Code formatting (semi: true, singleQuote: true, tabWidth: 2, printWidth: 100)
