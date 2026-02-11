# Mana Power System

## Context

Runeworks currently has no resource cost to run production buildings — once placed, they operate at full speed forever. This removes a key strategic layer: players never have to think about layout efficiency or make tradeoffs between production capacity and power infrastructure.

The mana system adds a proximity-based power mechanic where advanced buildings need mana from nearby generators to run at full speed. Early buildings (quarry, forge, chest) remain free so players can get started without the mana mechanic, which gets introduced alongside the workbench.

## Design

### Core Rules

- **Free buildings:** Quarry, Forge, Chest — always run at full speed
- **Powered buildings:** Workbench (+ future advanced buildings) — need mana per tick
- **Generators produce mana**, contribute to a **global mana pool**
- **Proximity gate:** powered buildings must be within range of a generator or extender to access the pool
- **Shortage = slowdown:** if consumption > production, all connected powered buildings run at `max(production/consumption, 0.05)` — minimum 5% speed, never a full stop
- **Unconnected** powered buildings also run at 5% speed

### New Buildings

| Building     | Size | Mana Output | Radius  | Build Cost              | Unlocked |
| ------------ | ---- | ----------- | ------- | ----------------------- | -------- |
| Mana Well    | 1x1  | 4/tick      | 5 tiles | 2 iron, 1 crystal_shard | Stage 5  |
| Mana Obelisk | 2x2  | 10/tick     | 8 tiles | 4 iron, 3 crystal_shard | Stage 8+ |
| Mana Conduit | 1x1  | 0           | 5 tiles | 1 iron, 1 stone         | Stage 6+ |

- **Mana Well** — small, cheap tier-1 generator. One well (4 mana) powers one workbench (3 mana) with headroom.
- **Mana Obelisk** — large tier-2 generator. Powers 3 workbenches at full speed.
- **Mana Conduit** — extender only, no production. Must itself be in range of a generator (or another connected conduit) to re-broadcast connectivity. Chains indefinitely.

### Mana Consumption

- Workbench: **3 mana/tick** (reuse existing `powerCost` field, adjust value from 4 to 3)
- Future advanced buildings: higher costs

### Mana Network Calculation (per tick)

1. Gather all generators and extenders on the map
2. Mark tiles within each generator's radius as "connected" (Chebyshev distance from building center)
3. For each extender on a connected tile: expand connectivity by its radius (BFS — conduits can chain)
4. Sum total `manaProduction` from all generators
5. Sum total `manaCost` from all connected powered buildings
6. Compute `speedMultiplier = consumption == 0 ? 1.0 : min(1.0, production / consumption)`
7. Clamp to `max(speedMultiplier, 0.05)`
8. Unconnected powered buildings get `speedMultiplier = 0.05`

### Speed Multiplier Mechanic

Use a **fixed-point accumulator** per building for deterministic behavior:

- Each tick: `building.manaAccumulator += speedMultiplier * 100`
- If `manaAccumulator >= 100`: building processes this tick, subtract 100
- At 100% speed: works every tick. At 50%: every 2nd tick. At 5%: every 20th tick.

## Implementation

### 1. Type Changes (`src/types.ts`)

- Expand `BuildingType` union: add `'mana_well' | 'mana_obelisk' | 'mana_conduit'`
- Add to `BuildingDefinition`: `manaProduction: number`, `manaRadius: number`
- Add to `Building` runtime state: `manaAccumulator: number`, `connected: boolean`
- Keep `powerCost` field name (avoids churn) — treat it as mana consumption per tick

### 2. Building Definitions (`src/data/buildings.ts`)

- Add `mana_well`, `mana_obelisk`, `mana_conduit` definitions
- Add `manaProduction: 0` and `manaRadius: 0` to existing buildings
- Set quarry/forge/chest `powerCost: 0` (free), workbench `powerCost: 3`

### 3. New File: `src/simulation/ManaSystem.ts` (~100-150 lines)

- `class ManaSystem`
- `update(buildings: Building[]): void` — runs the network calculation
- `getSpeedMultiplier(building: Building): number`
- `getTotalProduction(): number`
- `getTotalConsumption(): number`
- `isConnected(x: number, y: number): boolean`
- Internal: `connectedTiles: Set<string>` (reset each tick)

### 4. Simulation Changes (`src/Simulation.ts`)

- Add `private manaSystem = new ManaSystem()`
- In `tick()`, call `manaSystem.update(this.buildings)` before production phase
- In `updateWorkbench()` (and future powered buildings): check `building.manaAccumulator` before processing
- Accumulator logic: at top of `updateBuilding()`, for powered buildings, do the accumulator check and skip if not ready
- Expose mana stats via `SimulationState` or a new callback

### 5. Sprites (3 new ASCII definitions)

- `assets/sprites/src/mana_well.txt` — glowing well/fountain, 1x1
- `assets/sprites/src/mana_obelisk.txt` — tall crystal pillar, 2x2
- `assets/sprites/src/mana_conduit.txt` — small relay stone, 1x1
- Run `npm run sprites` to regenerate atlas

### 6. Input & Placement

- `src/managers/InputManager.ts` — add keybindings for new buildings in build mode
- `src/managers/BuildingPlacer.ts` — mana buildings have no input/output sides, no rotation needed
- Optional: show mana radius preview circle when placing a generator

### 7. UI Changes (`src/scenes/UIScene.ts`)

- Add mana status to HUD: `Mana: 4/3` (production/consumption) — green when surplus, yellow when tight, red when deficit
- Show "No Mana" or dim indicator on unpowered/unconnected buildings
- Add new buildings to build menu legend

### 8. Stage Integration (`src/data/stages.ts`)

- Stages 1-4: unchanged (quarry + forge only, no mana needed)
- Stage 5 (Cog Works): first workbench stage — player needs to build a Mana Well
- Consider adding `unlockedBuildings` to Stage interface for progressive unlocks

### 9. Guide Panel (`src/managers/GuidePanel.ts`)

- Add mana buildings to the buildings reference section
- Add a mana mechanics explanation

## File Change Summary

| File                               | Change                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `src/types.ts`                     | Expand BuildingType, add mana fields to BuildingDefinition and Building |
| `src/data/buildings.ts`            | Add 3 new building defs, add manaProduction/manaRadius to all           |
| `src/simulation/ManaSystem.ts`     | **NEW** — mana network calculation                                      |
| `src/Simulation.ts`                | Integrate ManaSystem, accumulator check in production                   |
| `src/managers/InputManager.ts`     | Key bindings for new buildings                                          |
| `src/managers/BuildingPlacer.ts`   | Support mana buildings, optional radius preview                         |
| `src/scenes/UIScene.ts`            | Mana HUD display                                                        |
| `src/managers/BufferIndicators.ts` | Optional: mana status indicator on buildings                            |
| `src/data/stages.ts`               | Stage adjustments for mana introduction                                 |
| `src/managers/GuidePanel.ts`       | Document mana buildings                                                 |
| `src/config.ts`                    | Mana-related constants if needed                                        |
| `assets/sprites/src/*.txt`         | 3 new sprite definitions                                                |

## Verification

1. `npm run build` — compiles without errors
2. `npm run sprites` — generates new building sprites
3. `npm run dev` — manual testing:
   - Stages 1-4: play normally, no mana mechanic visible
   - Stage 5: place workbench without mana well — it runs at 5% (very slow)
   - Place mana well near workbench — it speeds up to 100%
   - Place 2 workbenches with 1 well — both run slower (~66%)
   - Place conduit to extend range to a distant workbench — it connects
   - HUD shows mana production/consumption numbers
   - Demolish mana well — connected buildings slow down
