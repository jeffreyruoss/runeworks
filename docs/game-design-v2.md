# Runeworks — Game Design V2

## Core Identity

A keyboard-only, stage-based micro-factory builder where players optimize production on a tight grid. The game is about **finding your own path** — every stage has many viable strategies, and the fun is discovering which approach fits your style and the map's constraints.

## What Makes It Fun

**The core tension: space, resources, time, and gold all trade off against each other.**

- Build lots of small buildings? Fast production but eats grid space.
- Invest in research first? Slower start but upgraded buildings are more efficient later.
- Spam quarries? You'll exhaust ore patches before hitting your target.
- Bank your gold? Compound interest lets you afford expensive upgrades later — but you might run out of time.
- Trade instead of build? A trade post takes one tile but gives you items you'd need a whole production chain to make yourself.

No single correct answer. Strategy depends on the map layout, available resources, and personal style.

## Core Loop (Revised)

1. **Stage briefing** — big production target + map preview showing resource layout
2. **Build & run** — place buildings, run simulation, adapt in real-time
3. **Scoring** — 1-3 stars based on tiles used and time taken
4. **Unlock** — stars unlock new stages; completing stages unlocks buildings/recipes/upgrades

---

## Key Mechanics

### 1. Building Construction Costs

Buildings require **physical resources** to construct — not just gold. This creates a critical early-game tension: the stone you spend on a forge is stone you can't use for something else.

| Building      | Construction Cost             | Notes                                                  |
| ------------- | ----------------------------- | ------------------------------------------------------ |
| Quarry        | 5 Stone                       | Cheap, but you need stone for everything else          |
| Forge         | 8 Stone + 2 Iron              | Expensive — building too many drains your stone supply |
| Workbench     | 4 Stone + 3 Wood              | Wood is scarce on some maps                            |
| Chest         | 3 Stone                       | Cheap buffer                                           |
| Trade Post    | 4 Stone + 2 Wood              |                                                        |
| Arcane Study  | 6 Stone + 4 Crystal Shard     | Crystal shards are rare                                |
| Enchanter     | 10 Stone + 3 Arcane Ingot     | Must produce ingots before you can build one           |
| Mana Well     | 3 Stone + 2 Crystal Shard     |                                                        |
| Mana Tower    | 5 Stone + 1 Arcane Ingot      |                                                        |
| Money Changer | 6 Stone + 3 Iron + 2 Gold Ore | Expensive to unlock interest                           |
| Trade Route   | 5 Stone + 2 Wood + 1 Cogwheel | Requires crafting before you can automate              |

**Strategic implications:**

- **Stone is the universal bottleneck** — every building needs it, so stone deposits are precious
- **Building a forge costs stone that could have built two chests** — real tradeoffs
- **Advanced buildings need crafted materials** — you must bootstrap a production chain before you can build higher-tier structures
- **Upgrading an existing building is cheaper than building a new one** — incentivizes upgrades over sprawl
- **Demolishing a building refunds ~50% of materials** — mistakes aren't permanent but are costly

### 2. Grid Pressure

The 40x25 grid must feel **tight**. If there's always plenty of room, there's no tension.

Pressure sources:

- **Large production targets** — "produce 50 runes" not "produce 3 runes"
- **Spread-out resources** — arcstone vein on the left, sunite on the right, forcing long chains
- **Obstacles** — rivers, mountains, ancient ruins that block placement
- **2x2 buildings** — most production buildings are 2x2, eating 4 tiles each
- **Research buildings** — investing in upgrades costs grid space NOW
- **Construction costs** — building more means spending more resources, which means more quarries, which means more grid space

### 3. Resource Depletion

Ore patches have finite HP. A quarry depletes its patch over time.

- **Richness levels** — rich patches last longer, poor patches deplete fast
- **Forces expansion** — you can't just park one quarry forever; you need to plan for when patches run dry
- **Strategic choice** — do you place quarries on the rich patch first (reliable) or save it for later when you need it most?
- **Patch variety** — some maps have many small patches vs few large ones

### 4. Gold & Interest

Gold is earned **only from quests** — fulfilling requests from NPCs and travelers. No passive gold-per-item. This makes gold feel earned and gives narrative flavor to every stage.

**Earning gold (quests only):**

- Each stage has **sub-objectives** framed as NPC requests
- Completing a quest pays out gold immediately
- Quests are optional — you can complete the stage without doing them, but gold unlocks upgrades and trades

**Example quests:**

- "A traveling band of nomads needs 5 Runes for protection wards" — 30 gold
- "The village blacksmith wants 10 Arcane Ingots for a commission" — 15 gold
- "A merchant caravan will pay well for 8 Cogwheels" — 20 gold
- "A scholar offers gold for 3 Research Points worth of notes" — 25 gold

**Spending gold:**

- Upgrading buildings (speed, yield, capacity)
- Purchasing recipes
- Manual trades at the Trade Post
- Building the Money Changer (see below)

**The interest mechanic — requires Money Changer:**

- Interest is NOT free. Players must research and build a **Money Changer** (1x1 building)
- The Money Changer costs resources to build (6 Stone + 3 Iron + 2 Gold Ore) — it's an investment
- Once built, unspent gold earns compound interest per cycle (e.g., every 30 seconds)
- Creates a 3-step strategy: earn gold from quests -> build Money Changer -> bank remaining gold for compound growth
- The Money Changer takes a grid tile — another space tradeoff

**Design notes:**

- Interest should be visible and satisfying (show the gold ticking up on the Money Changer)
- Gating interest behind research + building means it's a deliberate strategic choice, not a default
- Players who rush production skip interest entirely — valid strategy
- Players who quest-farm early + build Money Changer can afford expensive upgrades later — also valid

### 5. Trading

Two ways to trade: **manual** (Trade Post) and **automated** (Trade Route).

#### Manual Trading — Trade Post (1x1)

Place a Trade Post, select it, and a modal shows available trades from nearby runesmiths. You manually execute trades using items from your inventory/chests.

**How it works:**

- Place a Trade Post on the grid
- Trades are offered per-stage (data-driven, part of stage definition)
- Each trade: give X of item A, receive Y of item B
- Trades may have limits (e.g., "trade up to 10 times per stage")
- Trade rates aren't 1:1 — you pay a premium, but skip the production chain
- Trades cost gold on top of items (the runesmiths take a cut)

#### Automated Trading — Trade Route (1x1)

A Trade Route building connects directly to your production chain. It **consumes input items and produces output items** automatically, just like a forge or workbench — but instead of crafting, it's trading.

**How it works:**

- Place a Trade Route adjacent to buildings that output the items you want to trade away
- Configure which trade the Trade Route executes (from available stage trades)
- Items flow IN from adjacent buildings -> trade executes automatically -> output items flow OUT to adjacent buildings
- Slower than manual trading (each trade takes N ticks to "process" — the caravan needs travel time)
- Costs a cogwheel to build (must bootstrap crafting first)

**Example flow:**

```
Quarry[arcstone] -> Forge -> Trade Route (4 arcane ingots -> 1 cogwheel) -> Chest
```

No workbench needed — the Trade Route replaces the crafting step entirely.

**Strategic value:**

- Need 5 runes but don't have room for the full rune production chain? Trade cogwheels for runes.
- Overproduce something cheap, trade for something expensive
- Trade Routes integrate into your factory layout like any other building
- Manual Trade Post is faster per-trade but requires attention; Trade Route is hands-off but slower and costs a tile

**Example trades (available per-stage):**

- 4 Arcane Ingots -> 1 Cogwheel (skip the workbench)
- 6 Sun Ingots -> 2 Thread (overproduce ingots, trade for thread)
- 3 Cogwheels + 3 Thread -> 1 Rune (skip the complex recipe)
- 10 Stone -> 1 Arcane Ingot (for maps with no arcstone veins)

### 6. Research & Upgrades

Research is the long-game investment. Spend grid space and time NOW for efficiency LATER.

**Research buildings produce Research Points (RP).**

**Upgrade categories:**

#### Building Upgrades

- **Speed** — buildings process X% faster (fewer ticks per craft)
- **Efficiency** — buildings use fewer inputs (e.g., forge needs 1 ore instead of 2... wait, it's already 1. Maybe: forge produces 2 ingots per ore)
- **Capacity** — larger input/output buffers (less blocking)
- **Compactness** — specific buildings become 1x1 instead of 2x2 (huge for grid pressure)

#### Recipe Upgrades

- **Yield** — recipes produce bonus output (e.g., smelt ore -> 1.5 ingots, rounded)
- **Speed** — specific recipes craft faster
- **Alternate recipes** — unlock different input combinations for the same output

#### Global Upgrades

- **Transfer range** — buildings can transfer to non-adjacent buildings (1 tile gap)
- **Auto-rotate** — buildings automatically orient outputs toward valid receivers
- **Interest rate** — higher compound interest on banked gold
- **Trade discounts** — better exchange rates at Trade Posts

### 7. Multiple Production Paths

The same item should be producible through different strategies. This is what creates replayability.

**Example: Producing Cogwheels**

Path A (standard): Quarry -> Forge -> Workbench (2 arcane ingots -> 1 cogwheel)
Path B (upgraded): Quarry -> Improved Forge (yield upgrade: 2 ingots per ore) -> Workbench (fewer quarries needed)
Path C (trade): Overproduce arcane ingots -> Trade Post (4 ingots -> 1 cogwheel, no workbench needed)
Path D (research): Research compact workbench (1x1) -> fit more workbenches in less space
Path E (alternate recipe): Research "iron cogwheel" recipe -> Quarry[iron] -> Forge -> Workbench (different resource, same output)

**Example: Producing Runes**

Path A: Full chain (quarry -> forge -> workbench for cogwheels AND thread -> workbench for runes)
Path B: Trade for components (produce only cogwheels, trade for thread, then craft runes)
Path C: Direct trade (produce lots of ingots, trade directly for runes at worse rate)
Path D: Research-heavy (compact buildings + yield upgrades = smaller footprint for full chain)

---

## Buildings (Expanded)

### Production Buildings (2x2)

| Building     | Purpose                               | Notes                        |
| ------------ | ------------------------------------- | ---------------------------- |
| Quarry       | Extracts ore from terrain patches     | Must be on resource patch    |
| Forge        | Smelts ore into ingots                | Multiple recipe support      |
| Workbench    | Crafts intermediate/advanced items    | Recipe selection             |
| Arcane Study | Produces Research Points              | Requires mana network        |
| Enchanter    | High-tier crafting (runes, artifacts) | Unlocked via research        |
| Refinery     | Alternative processing path           | Different recipes than forge |

### Utility Buildings (1x1)

| Building      | Purpose                                | Notes                                   |
| ------------- | -------------------------------------- | --------------------------------------- |
| Chest         | Stores up to 50 items                  | Buffer/logistics                        |
| Trade Post    | Manual NPC trades via modal            | Limited trades per stage                |
| Trade Route   | Automated trading in production chain  | Consumes/produces items like a building |
| Money Changer | Earns compound interest on banked gold | Requires research to unlock             |
| Mana Well     | Power source for mana network          | Fuels arcane buildings                  |
| Mana Tower    | Extends mana network range             |                                         |

### Upgrade Buildings (1x1, potential)

| Building | Purpose                          | Notes                  |
| -------- | -------------------------------- | ---------------------- |
| Anvil    | Upgrades adjacent building speed | Costs gold to activate |
| Lens     | Upgrades adjacent building yield | Costs gold to activate |
| Beacon   | Boosts all buildings in radius   | Expensive, powerful    |

### Mana Network Buildings (existing)

| Building     | Size | Purpose                    |
| ------------ | ---- | -------------------------- |
| Mana Well    | 1x1  | Power source               |
| Mana Obelisk | 2x2  | Network hub, extends range |
| Mana Tower   | 1x1  | Range extender             |

---

## Items (Expanded)

### Raw Resources (from terrain)

- Arcstone (from arcstone veins)
- Sunite (from sunite veins)
- Stone (from stone deposits)
- Wood (from wood deposits)
- Iron (from iron deposits)
- Clay (from clay deposits)
- Crystal Shard (from crystal deposits)
- **Gold Ore** (from gold veins — smelts into gold coins?)

### Processed Materials

- Arcane Ingot (arcstone -> forge)
- Sun Ingot (sunite -> forge)
- **Iron Ingot** (iron -> forge)
- **Glass** (crystal shard -> forge)
- **Brick** (clay -> forge)

### Crafted Items

- Cogwheel (2 arcane ingots -> workbench)
- Thread (1 sun ingot -> workbench, produces 2)
- Rune (1 arcane ingot + 3 thread -> workbench)
- **Lens** (2 glass -> workbench)
- **Mechanism** (2 cogwheels + 1 iron ingot -> workbench)
- **Runestone** (1 rune + 1 lens -> enchanter)
- **Golem Core** (1 mechanism + 1 runestone -> enchanter)

### Special

- Research Points (arcane study output — not a physical item)
- **Gold** (currency, not a physical item on the grid)

---

## Stage Design Philosophy

### Stage Size & Targets

Current stages are too small (produce 3-10 items). Stages should demand **large quantities** so players must think about scaling, not just "can I make one."

**Progression:**

- Early stages: 20-50 items (learn the basics, one production chain)
- Mid stages: 50-150 items (multiple chains, space pressure starts)
- Late stages: 100-300 items (tight grids, research tradeoffs, trading required)
- Challenge stages: specific constraints (max 10 buildings, no forges, etc.)

### Stage Constraints (mix and match)

- **Grid obstacles** — impassable terrain eating into usable space
- **Resource scarcity** — limited ore patches, low richness
- **Building limits** — max N buildings total, or max N of a specific type
- **Time limits** — produce X items within Y seconds
- **Resource restrictions** — no arcstone on this map (must trade or use alternates)
- **Budget limits** — limited starting gold

### Stage Scoring (1-3 Stars)

Each stage has thresholds for:

- **Star 1** — complete the objective (any way you want)
- **Star 2** — complete under tile threshold (e.g., use fewer than 30 tiles)
- **Star 3** — complete under time threshold (e.g., finish in under 120 seconds)

Stars are cumulative — you can earn star 2 and 3 in separate runs.
Total stars gate access to later stages.

---

## Multiplayer (Future)

### Competitive Racing

- Two players start simultaneously on **identical maps** (same terrain, same resources)
- No direct interaction — you can't see or affect the other player's grid
- Split screen or side-by-side view
- First to complete the objective wins
- Tiebreaker: fewer tiles used

**Why this works:**

- Simple to implement (just two independent simulations)
- No netcode headaches (only need to sync completion time)
- Creates natural tension and excitement
- Identical maps ensure fairness
- Could work asynchronously too (ghost replays)

### Cooperative (Later)

- Two players share one large grid (maybe 80x25 or 60x30)
- Each player controls their own cursor
- Shared resources, shared objectives
- Communication is key — who builds what, where
- Could have divided objectives ("Player 1 needs to produce cogwheels, Player 2 needs thread, together you need runes")

### Asynchronous Competition

- Daily/weekly challenge maps
- Global leaderboard: best time, fewest tiles, most efficient
- Ghost replay: see how top players solved the same stage
- "Beat your friend's score" social hooks

---

## Stage Definition Schema

Each stage is a data-driven TS object:

```typescript
interface StageDefinition {
  id: number;
  name: string;
  description: string;
  terrain: TerrainLayout; // resource patch positions, obstacles, etc.
  objectives: Objective[]; // primary production targets
  quests?: Quest[]; // optional NPC requests that pay gold
  availableTrades?: Trade[]; // trades offered at Trade Posts / Trade Routes
  constraints?: {
    maxBuildings?: number; // total buildings allowed
    maxBuildingsOfType?: Record<BuildingType, number>;
    bannedBuildings?: BuildingType[];
    timeLimit?: number; // seconds (0 = no limit)
    startingGold?: number;
    startingResources?: Record<ItemType, number>;
  };
  unlockedBuildings?: BuildingType[];
  unlockedRecipes?: RecipeId[];
  starThresholds: {
    tiles: number; // star 2: complete using fewer than N tiles
    time: number; // star 3: complete in under N seconds
  };
}
```

## Results Screen

After stage completion or time-out:

- **Pass/Fail** banner
- **Items produced** — table showing each item type and quantity
- **Time elapsed** and **tiles used**
- **Stars earned** (1-3) with thresholds shown
- **Bottleneck hints** — the simulation tracks starvation and blocking:
  - "Forge #2 was starved (no input 45% of time)"
  - "Workbench #1 was blocked (output full 30% of time)"
  - "Quarry #3 depleted its patch at 1:42 — consider relocating"
- **Actions:** Retry (R), Next Stage (Enter), Edit Layout (Esc)

## Simulation Constraints

- **Determinism** — simulation is deterministic given stage seed and building layout. Same inputs always produce same outputs. This is critical for multiplayer fairness and replay verification.
- **Tick rate** — 20 ticks/second (50ms per tick), fixed.
- **Items are discrete** — no fluids, no fractions. Items exist in machine buffers, not on the grid.
- **Adjacent transfer** — no belts. Buildings push items to adjacent buildings that accept them.

## Accessibility

- All building types have distinct **shapes**, not just colors
- Terrain patches have pattern overlays (arcstone: diagonal lines, sunite: dots, etc.)
- High contrast mode (future): increases outline thickness
- All key info shown with icons + text labels
- Keyboard-only by design — no mouse required for any interaction

---

## Resolved Decisions

- **Gold is earned from quests only** — no passive gold-per-item. Quests are NPC requests framed as narrative sub-objectives.
- **Interest requires Money Changer** — compound interest is gated behind research + building a Money Changer (1x1). Not free.
- **Trading has two modes** — manual (Trade Post modal) and automated (Trade Route building in production chain).
- **Buildings cost resources to construct** — stone is the universal bottleneck; advanced buildings need crafted materials.
- **Demolishing refunds ~50%** — mistakes are costly but not permanent.

## Open Questions

- [ ] Should gold be per-stage (reset each stage) or persistent across stages?
- [ ] How does compound interest rate scale? Fixed rate or upgradeable via research?
- [ ] Should trading be limited per stage, or unlimited with worse rates for bulk?
- [ ] Do building upgrades persist across stages or reset?
- [ ] Should there be a "sandbox" mode with no objectives for creative play?
- [ ] How many total stages? 30? 50? Procedurally generated challenge stages?
- [ ] Should there be a stage editor / sharing system?
- [ ] What's the minimum viable set of buildings/items for the expanded system?
- [ ] Should obstacle types have gameplay effects (rivers slow transfers, ruins give bonus RP)?
- [ ] How visible should the opponent be in competitive mode? (progress bar only? minimap? full view?)
- [ ] What are the construction costs for upgrade buildings (Anvil, Lens, Beacon)?
- [ ] How much does demolish refund? Flat 50%? Or varies by building tier?
- [ ] Do Trade Route trades have the same rates as manual Trade Post, or worse (convenience tax)?
- [ ] How many quests per stage? 2-3 small ones, or 1 big one?
- [ ] Can quests expire or do they persist for the whole stage?
- [ ] Starting resources — do you begin each stage with some stone/wood, or must you quarry everything?
- [ ] Should the Money Changer have a max gold capacity?
