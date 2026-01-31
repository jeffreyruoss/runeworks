# Runeworks — Spec (Phaser, 16px tiles)

## 1) Product vision

A peaceful, keyboard-only, stage-based micro-factory builder in the browser.

Players place a small set of machines on a grid, run short simulations ("shifts"), then iterate toward stage goals like **Produce 100 Gears**.

## 2) Target device + rendering goals

- Primary target: 13-inch MacBook Air (2025).
- Display reference: 13.6-inch Liquid Retina, 2560×1664 native.
- Visual style: crisp retro 8-bit pixel look with integer scaling.

### Virtual resolution (pixel-perfect)

- Tile size: 16×16 pixels.
- Grid size: 40×25 tiles (fixed for all stages).
- Virtual canvas: 640×400 pixels (exactly 16:10).
- No scrolling required—entire grid visible at once.

### Scaling

- Default integer zoom: 4× → 2560×1600.
- Letterbox/pillarbox centered in browser window as needed.

## 3) Core loop

1. **Stage briefing:** one clear quantitative goal + constraints.
2. **Build phase:** place/rotate machines using only keyboard.
3. **Run phase:** simulate N seconds at fixed tick rate.
4. **Results:** show totals, bottlenecks, and stage pass/fail.
5. **Unlock:** unlock 1–2 new machines or recipe variants.

## 4) Stage system

Stages are linear and teach one concept each.

### Stage definition (data-driven)

Each stage is a JSON/TS object:

- `id`, `name`, `description`
- `startingInventory` (optional pre-placed items)
- `unlockedBuildings`, `unlockedRecipes`
- `orePatches` (array of {type, x, y, richness})
- `constraints`:
  - `maxBuildings` (total buildings allowed)
  - `maxPower` (power budget, optional—see section 6)
  - `bannedBuildings` (array of building IDs)
- `goal`:
  - Quantity goal: `{itemId, quantity}`
  - OR throughput goal: `{itemId, perMinute, duration}`
- `simDurationSeconds`

### Example stages

- **S1:** Produce 50 Iron Plates (introduce miner + furnace).
- **S2:** Produce 50 Gears (introduce assembler + ratios).
- **S3:** Produce 20 Circuits (introduce multi-input recipes).
- **S4:** Produce 100 Gears with max 8 buildings (introduce efficiency).
- **S5:** Sustain 20 plates/min for 60s (introduce steady-state thinking).

## 5) Controls (keyboard-only)

### Cursor movement

| Key        | Action              |
| ---------- | ------------------- |
| WASD       | Move cursor 1 tile  |
| Shift+WASD | Move cursor 5 tiles |

### Building

| Key       | Action                                |
| --------- | ------------------------------------- |
| 1–9       | Select building from hotbar           |
| Enter     | Place building                        |
| Backspace | Delete building under cursor          |
| R         | Rotate building (cycles 4 directions) |
| I         | Inspect building (shows stats panel)  |
| Esc       | Deselect                              |

### Simulation

| Key        | Action                    |
| ---------- | ------------------------- |
| Space      | Start / stop simulation   |
| . (period) | Increase speed (1×→2×→4×) |
| , (comma)  | Decrease speed (4×→2×→1×) |

Note: Building placement and deletion are allowed while simulation is running.

### Zoom (optional, since full grid is visible)

| Key | Action              |
| --- | ------------------- |
| Q   | Zoom out (4×→3×→2×) |
| E   | Zoom in (2×→3×→4×)  |

## 6) Simulation rules

### Tick model

- Fixed tick rate: 20 ticks/second (50ms per tick).
- Simulation length: stage-defined (default 90 seconds).

### Items

- Items are discrete units (not fluids).
- Items exist in machine buffers, not on the grid.

### Adjacent transfer system (no belts)

Instead of belts, machines automatically transfer items to adjacent machines:

1. Each machine has **output sides** (indicated by arrows on sprite).
2. Each tick, machines push completed items to adjacent machines that:
   - Accept that item type as input
   - Have buffer space available
3. If multiple valid adjacent machines exist, items distribute **round-robin**.
4. If no valid adjacent machine or all buffers full, item stays in output buffer (blocks production when output buffer is full).

This creates a spatial puzzle: arrange machines so outputs connect to inputs.

### Machines

Each machine has:

- `inputItems`: map of itemId → count needed per craft
- `outputItems`: map of itemId → count produced per craft
- `craftTimeTicks`: ticks to complete one craft
- `inputBufferSize`: max items waiting to be processed (default: 10)
- `outputBufferSize`: max items waiting to transfer (default: 5)
- `powerDraw`: power units consumed (for constrained stages)

### Power system (simple)

- Power is a **budget constraint**, not a grid system.
- Each stage may define `maxPower` (total power available).
- Each building consumes power when placed.
- If total power exceeds budget, placement is blocked.
- Stages without `maxPower` have unlimited power.

### Determinism

- Simulation is deterministic given stage seed and building layout.
- Round-robin state is part of simulation state.

## 7) Entities

### Terrain

- **Empty tile:** can place buildings.
- **Ore patch:** contains ore (iron or copper). Miners must be placed on ore patches.

### Buildings

| Building  | Size | Description                                                                                 | Power |
| --------- | ---- | ------------------------------------------------------------------------------------------- | ----- |
| Miner     | 2×2  | Extracts ore from patch below. Outputs ore. Must be placed entirely on ore patch.           | 2     |
| Furnace   | 2×2  | Smelts ore into plates.                                                                     | 3     |
| Assembler | 2×2  | Crafts items according to selected recipe.                                                  | 4     |
| Chest     | 1×1  | Stores up to 50 items. Accepts any item type. Outputs to adjacent machines that need items. | 0     |

### Building details

**Miner (2×2)**

- Output: 1 ore per 20 ticks (1/second)
- Output sides: configurable (default: right side)
- Depletes ore patch based on richness (optional mechanic for later stages)

**Furnace (2×2)**

- Input: 1 ore
- Output: 1 plate
- Craft time: 40 ticks (2 seconds)
- Input sides: left
- Output sides: right

**Assembler (2×2)**

- Recipe must be selected after placement (press I to inspect, then number key to pick recipe)
- Craft time: varies by recipe
- Input sides: left, top
- Output sides: right

**Chest (1×1)**

- Capacity: 50 items
- Acts as buffer: accepts items from adjacent outputs, supplies to adjacent inputs
- All sides are both input and output

### Recipes

| Recipe        | Input                 | Output         | Craft Time | Building  |
| ------------- | --------------------- | -------------- | ---------- | --------- |
| Smelt Iron    | 1 Iron Ore            | 1 Iron Plate   | 40 ticks   | Furnace   |
| Smelt Copper  | 1 Copper Ore          | 1 Copper Plate | 40 ticks   | Furnace   |
| Craft Gear    | 2 Iron Plate          | 1 Gear         | 30 ticks   | Assembler |
| Craft Wire    | 1 Copper Plate        | 2 Wire         | 20 ticks   | Assembler |
| Craft Circuit | 1 Iron Plate + 3 Wire | 1 Circuit      | 60 ticks   | Assembler |

## 8) UI/UX

### HUD layout

- **Top-left:** Stage name + goal progress (e.g., "Gears: 47/100")
- **Top-right:** Timer + sim speed indicator (e.g., "1:23 [2×]")
- **Bottom:** Hotbar showing available buildings (1-9 keys)
- **Bottom-right:** Power usage (e.g., "Power: 12/20")

### Visual feedback

- **Valid placement:** ghost building shown in green tint
- **Invalid placement:** ghost building shown in red tint + brief message:
  - "Needs ore patch" (miner not on ore)
  - "Blocked" (overlapping building)
  - "Over power budget" (exceeds maxPower)
- **Selected building:** highlighted border
- **Cursor:** visible 1×1 or 2×2 outline matching selected building size

### Accessibility

- All building types have distinct **shapes**, not just colors
- Ore patches have pattern overlays (iron: diagonal lines, copper: dots)
- High contrast mode toggle (future): increases outline thickness
- All key info shown with icons + text labels

### Results screen

After simulation ends or goal is reached:

- **Pass/Fail** banner
- **Items produced:** table showing each item type and quantity
- **Time elapsed**
- **Bottleneck hints:**
  - "Furnace #2 was starved (no input 45% of time)"
  - "Assembler #1 was blocked (output full 30% of time)"
- **Buttons:** Retry (R), Next Stage (Enter), Edit Layout (Esc)

## 9) Phaser architecture

### Tech stack

- Phaser 3.80+
- Vite
- TypeScript (strict mode)

### Scene structure

- **BootScene:** Load assets, fonts, stage data. Show loading bar.
- **MenuScene:** Stage select (future), settings.
- **GameScene:** Main gameplay—grid, buildings, cursor, simulation.
- **UIScene:** HUD overlay (runs parallel to GameScene).
- **ResultScene:** End-of-simulation results display.

### Rendering layers (GameScene)

1. Terrain layer (tilemap or sprites for ground + ore patches)
2. Building layer (sprites, sorted by y-position)
3. Item indicators (small icons showing buffer contents)
4. Cursor layer (highlight overlay)
5. UI layer (handled by UIScene overlay)

### State management

- `BuildPhaseState`: cursor position, selected building, placed buildings
- `SimulationState`: tick count, machine states, item counts, round-robin indices
- Simulation runs in `update()` loop with fixed timestep accumulator

## 10) Pixel art asset pipeline

### Goal

Assets generated from code so iteration is fast and doesn't require external tools.

### Approach: ASCII sprite definitions → PNG

Each sprite defined as a 16×16 (or 32×32 for 2×2 buildings) text block using palette indices:

```
# Example: Iron Ore (16×16)
................
...0000000000...
..000000000000..
.00001111110000.
.00011111111000.
.00111122111100.
.01111122211110.
.01111222211110.
.01112222221110.
.01111222211110.
.00111122111100.
.00011111111000.
.00001111110000.
..000000000000..
...0000000000...
................
```

Palette defined separately:

```typescript
const PALETTE = {
  '.': 'transparent',
  '0': '#3b3b3b', // dark gray
  '1': '#7c7c7c', // medium gray
  '2': '#b5b5b5', // light gray
  // ... etc
};
```

### Pipeline

1. `/assets/sprites/src/*.txt` — ASCII sprite definitions
2. `/tools/spritegen/` — Node script that:
   - Reads ASCII definitions
   - Generates individual PNGs
   - Packs into spritesheet atlas
   - Outputs JSON atlas metadata
3. `/assets/sprites/out/` — Generated PNG atlas + JSON

### Build integration

- `npm run sprites` — regenerate sprites
- Sprites auto-regenerate on change in dev mode (Vite plugin)

## 11) Audio (future)

Audio deferred to post-MVP. Planned:

- Ambient background music (lo-fi, chill)
- Machine sounds (subtle, not annoying)
- UI feedback sounds (place, delete, error)
- Success/fail jingles

## 12) Data + save

### localStorage schema

```typescript
interface SaveData {
  version: number;
  stagesCompleted: string[]; // stage IDs
  bestResults: {
    [stageId: string]: {
      itemsProduced: number;
      timeSeconds: number;
      buildingsUsed: number;
    };
  };
  settings: {
    musicVolume: number;
    sfxVolume: number;
  };
}
```

### Migration

- Save format versioned
- Migration functions handle old → new format
- Corrupted saves reset with warning

## 13) Milestones

### M1: Foundation

- [ ] Vite + Phaser + TypeScript setup
- [ ] Grid rendering (40×25)
- [ ] Cursor movement (WASD)
- [ ] Basic HUD

### M2: Building placement

- [ ] Building selection (1-9 keys)
- [ ] Ghost preview with validity check
- [ ] Place (Space) and delete (Backspace)
- [ ] Rotation (R)

### M3: Core simulation

- [ ] Tick-based simulation loop
- [ ] Miner produces ore
- [ ] Furnace smelts ore → plate
- [ ] Adjacent transfer system
- [ ] Item counters in HUD

### M4: Full gameplay

- [ ] Assembler + recipes
- [ ] Chest storage
- [ ] Stage goals + pass/fail
- [ ] Results screen with bottleneck hints

### M5: Polish

- [ ] Multiple stages (S1–S5)
- [ ] Stage select
- [ ] Save/load progress
- [ ] Sprite generation pipeline
- [ ] Accessibility patterns

### M6: Stretch

- [ ] Audio
- [ ] More stages
- [ ] More recipes
- [ ] Achievements

---

## Appendix: Quick reference

### Default values

- Grid: 40×25 tiles
- Tile: 16×16 pixels
- Canvas: 640×400 virtual pixels
- Zoom: 4× default
- Tick rate: 20/second
- Sim duration: 90 seconds
- Chest capacity: 50 items

### Building sizes

- Miner: 2×2
- Furnace: 2×2
- Assembler: 2×2
- Chest: 1×1

### Power costs

- Miner: 2
- Furnace: 3
- Assembler: 4
- Chest: 0
