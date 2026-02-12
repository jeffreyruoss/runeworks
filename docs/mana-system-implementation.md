# Mana Power System — Implementation Summary

## Overview

Added a mana power network system with three new buildings that control the speed of advanced buildings (workbench, arcane study). Powered buildings need mana generators nearby to run at full speed — without mana, they trickle at 5%.

## New Buildings

| Building         | Size | Mana Output | Range | Cost                       | Unlocked |
| ---------------- | ---- | ----------- | ----- | -------------------------- | -------- |
| **Mana Well**    | 1x1  | 4           | 5     | 3 Stone, 1 Crystal         | Stage 5  |
| **Mana Tower**   | 1x1  | 0 (relay)   | 5     | 4 Stone, 1 Iron            | Stage 6  |
| **Mana Obelisk** | 2x2  | 10          | 8     | 8 Stone, 4 Crystal, 2 Iron | Stage 8  |

## Power Costs

| Building       | Power Cost | Notes                       |
| -------------- | ---------- | --------------------------- |
| Quarry         | 0          | Free (changed from 2)       |
| Forge          | 0          | Free (changed from 3)       |
| Workbench      | 3          | Needs mana (changed from 4) |
| Chest          | 0          | Free                        |
| Arcane Study   | 3          | Needs mana                  |
| Mana buildings | 0          | Infrastructure              |

## How It Works

### Mana Network

- **Generators** (mana_well, mana_obelisk) produce mana and provide connectivity within their radius
- **Conduits** (mana_tower) extend the network via BFS — a tower in range of a generator can reach buildings the generator can't
- **Chebyshev distance** (max of dx, dy) determines range from center-to-center of buildings

### Speed Control

- Each tick, the ManaSystem computes `speedMultiplier = min(1, totalProduction / totalConsumption)`
- Powered buildings use an **accumulator**: each tick adds `multiplier * 100` to the accumulator; the building only processes when accumulator reaches 100
- **Disconnected** powered buildings trickle at 5% (accumulator += 5 per tick)
- **Free buildings** (powerCost = 0) always run at full speed

### Stage Gating

- Stages 1–4: No mana buildings available; all buildings run normally (quarry/forge/chest are free)
- Stage 5 (Cog Works): Mana Well unlocked alongside workbench introduction
- Stage 6 (Thread Spinning): Mana Tower unlocked for network extension
- Stage 8 (First Rune): Mana Obelisk unlocked for high-output mana

## Build-Mode Keys

- **M** = Mana Well (intercepts menu toggle in build mode)
- **O** = Mana Obelisk (intercepts objectives toggle in build mode)
- **T** = Mana Tower (new key)

## UI

- HUD shows `Mana: X/Y` (production/consumption) when mana buildings are placed
- Build menu shows `[M] Well`, `[O] Obelisk`, `[T] Tower` when unlocked by stage
- Guide panel lists all three mana buildings with descriptions

## Files Changed

### New

- `src/simulation/ManaSystem.ts` — Core mana network logic (BFS connectivity, speed multipliers, accumulator)
- `assets/sprites/src/mana_well.txt`, `mana_obelisk.txt`, `mana_tower.txt` — ASCII sprite definitions

### Modified (key changes)

- `src/types.ts` — BuildingType union, manaProduction/manaRadius on definitions, manaAccumulator/connected on buildings
- `src/data/buildings.ts` — 3 new definitions, updated powerCosts, added mana fields to all
- `src/config.ts` — Removed redundant POWER_COSTS record, added mana building costs/sizes
- `src/data/stages.ts` — Added `unlockedBuildings` field for stage-based gating
- `src/Simulation.ts` — Integrated ManaSystem in tick phase 0, accumulator gate before production
- `src/managers/StageManager.ts` — `isBuildingUnlockedByStage()` for stage-based unlock checks
- `src/scenes/GameScene.ts` — Build-mode M/O/T interception, combined research+stage gating, extracted getCursorInfo to utils
- `src/scenes/UIScene.ts` — Mana HUD display, mana buildings in build menu
- `src/managers/GuidePanel.ts` — Mana building entries with descriptions
- `src/managers/InputManager.ts` — T key binding
- `src/managers/ResearchManager.ts` — Mana buildings in base buildings list
- `src/managers/BuildingPlacer.ts` — No-rotation for mana buildings, mana field initialization
