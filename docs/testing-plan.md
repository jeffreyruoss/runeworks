# Testing Plan for Runeworks

## Summary

Add a testing infrastructure using Vitest, focusing on the highly testable pure functions and simulation engine while deferring Phaser-dependent scene tests.

## Current State

- **No testing exists** - no test files, framework, or configuration
- **Project uses Vite + TypeScript** - Vitest is the natural choice

## Testability Analysis

| Area                    | Testability | Reason                                            |
| ----------------------- | ----------- | ------------------------------------------------- |
| `src/utils.ts`          | Excellent   | Pure functions, no dependencies                   |
| `src/data/recipes.ts`   | Excellent   | Static data + pure lookup functions               |
| `src/data/buildings.ts` | Excellent   | Static configuration data                         |
| `src/config.ts`         | Excellent   | Static constants, useful for test assertions      |
| `src/Simulation.ts`     | Very Good   | Decoupled from Phaser, uses plain data structures |
| `src/scenes/*.ts`       | Poor        | Tightly coupled to Phaser API                     |

## Implementation Plan

### Phase 1: Setup Infrastructure

1. Install Vitest with coverage:

   ```bash
   npm install -D vitest @vitest/coverage-v8
   ```

2. Create `vitest.config.ts`:

   ```typescript
   import { defineConfig } from 'vitest/config';

   export default defineConfig({
     test: {
       environment: 'node',
       include: ['tests/**/*.test.ts'],
       globals: true,
       coverage: {
         provider: 'v8',
         include: ['src/**/*.ts'],
         exclude: ['src/scenes/**/*.ts'],
       },
     },
   });
   ```

3. Update `tsconfig.json` - add Vitest globals types:

   ```json
   {
     "compilerOptions": {
       "types": ["vitest/globals"]
     }
   }
   ```

4. Add npm scripts to `package.json`:

   ```json
   "test": "vitest run",
   "test:watch": "vitest",
   "test:coverage": "vitest run --coverage"
   ```

5. Create directory structure:
   ```
   tests/
   ├── unit/
   │   ├── utils.test.ts
   │   ├── recipes.test.ts
   │   └── buildings.test.ts
   └── simulation/
       ├── helpers.ts
       ├── Simulation.test.ts
       ├── production.test.ts
       └── transfer.test.ts
   ```

### Phase 2: Unit Tests (Pure Functions)

**tests/unit/utils.test.ts** - Test:

- `getBufferTotal()` - empty, single item, multiple items
- `rotateDirection()` - all 4 directions x rotations 0-3
- `oppositeDirection()` - all 4 directions

**tests/unit/recipes.test.ts** - Test:

- All recipes have required fields (id, name, inputs, outputs, craftTimeTicks)
- `getRecipe()` finds existing recipes, returns undefined for missing
- `getRecipesForBuilding()` filters correctly by building type

**tests/unit/buildings.test.ts** - Test:

- All buildings have valid dimensions
- Buffer sizes are positive
- Input/output sides contain valid directions

### Phase 3: Simulation Tests

**tests/simulation/helpers.ts** - Create test utilities:

- `createTestBuilding()` - factory for building objects with unique IDs
- `createBuffer()` - factory for item buffers
- `tickSimulation(sim, ticks)` - helper to advance simulation by N ticks (calls `sim.update(MS_PER_TICK * ticks)`)

**tests/simulation/Simulation.test.ts** - Test:

- Lifecycle (start/stop/pause)
- Terrain management (set/get/placeCrystalVein)
- Terrain boundary conditions (out-of-bounds returns 'empty')
- `placeCrystalVein()` rectangular area placement
- Speed control (1/2/4x)
- Speed clamping (values below 1 clamp to 1, above 4 clamp to 4)
- Tick accumulation
- Callbacks (`onItemProduced`, `onStateChanged`) fire correctly

**tests/simulation/production.test.ts** - Test:

- Quarry extracts ore after `QUARRY_TICKS_PER_ORE` ticks
- Quarry starves when not on vein
- Quarry blocks when output full
- Forge smelts ore to ingots
- Workbench crafts selected recipe
- Workbench does nothing without recipe

**tests/simulation/transfer.test.ts** - Test:

- Items transfer between aligned buildings
- No transfer when buildings not aligned
- Round-robin distribution to multiple targets
- `canAcceptItem()` behavior:
  - Coffer accepts any item type
  - Forge accepts only ore types
  - Workbench accepts only items matching selected recipe inputs
- Respects buffer capacity limits

## Files to Create/Modify

| File                                  | Action                                           |
| ------------------------------------- | ------------------------------------------------ |
| `package.json`                        | Add vitest + coverage dependencies, test scripts |
| `tsconfig.json`                       | Add vitest/globals types                         |
| `vitest.config.ts`                    | Create new                                       |
| `tests/unit/utils.test.ts`            | Create new                                       |
| `tests/unit/recipes.test.ts`          | Create new                                       |
| `tests/unit/buildings.test.ts`        | Create new                                       |
| `tests/simulation/helpers.ts`         | Create new                                       |
| `tests/simulation/Simulation.test.ts` | Create new                                       |
| `tests/simulation/production.test.ts` | Create new                                       |
| `tests/simulation/transfer.test.ts`   | Create new                                       |

## Verification

After implementation:

```bash
npm test             # All tests pass
npm run test:watch   # Watch mode works
npm run test:coverage # Coverage report generates
npm run build        # Build still succeeds
```

## Out of Scope (Future Work)

- Phaser scene testing (GameScene, UIScene) - requires complex mocking
- Visual/snapshot testing
- CI integration
