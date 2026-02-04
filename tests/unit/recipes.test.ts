import { RECIPES, getRecipe, getRecipesForBuilding } from '../../src/data/recipes';
import { BUILDING_DEFINITIONS } from '../../src/data/buildings';

describe('RECIPES data', () => {
  it('should contain at least one recipe', () => {
    expect(RECIPES.length).toBeGreaterThan(0);
  });

  it('every recipe has a non-empty id', () => {
    for (const recipe of RECIPES) {
      expect(recipe.id).toBeDefined();
      expect(typeof recipe.id).toBe('string');
      expect(recipe.id.length).toBeGreaterThan(0);
    }
  });

  it('every recipe has a non-empty name', () => {
    for (const recipe of RECIPES) {
      expect(recipe.name).toBeDefined();
      expect(typeof recipe.name).toBe('string');
      expect(recipe.name.length).toBeGreaterThan(0);
    }
  });

  it('every recipe has inputs as a non-empty Map', () => {
    for (const recipe of RECIPES) {
      expect(recipe.inputs).toBeInstanceOf(Map);
      expect(recipe.inputs.size).toBeGreaterThan(0);
    }
  });

  it('every recipe has outputs as a non-empty Map', () => {
    for (const recipe of RECIPES) {
      expect(recipe.outputs).toBeInstanceOf(Map);
      expect(recipe.outputs.size).toBeGreaterThan(0);
    }
  });

  it('every recipe has a positive craftTimeTicks', () => {
    for (const recipe of RECIPES) {
      expect(recipe.craftTimeTicks).toBeDefined();
      expect(typeof recipe.craftTimeTicks).toBe('number');
      expect(recipe.craftTimeTicks).toBeGreaterThan(0);
    }
  });

  it('every recipe has a valid building type', () => {
    const validBuildings = Object.keys(BUILDING_DEFINITIONS);
    for (const recipe of RECIPES) {
      expect(validBuildings).toContain(recipe.building);
    }
  });

  it('all recipe ids are unique', () => {
    const ids = RECIPES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all input/output quantities are positive integers', () => {
    for (const recipe of RECIPES) {
      for (const [_item, qty] of recipe.inputs) {
        expect(qty).toBeGreaterThan(0);
        expect(Number.isInteger(qty)).toBe(true);
      }
      for (const [_item, qty] of recipe.outputs) {
        expect(qty).toBeGreaterThan(0);
        expect(Number.isInteger(qty)).toBe(true);
      }
    }
  });
});

describe('getRecipe()', () => {
  it('returns the correct recipe for a valid id', () => {
    const recipe = getRecipe('purify_arcstone');
    expect(recipe).toBeDefined();
    expect(recipe!.id).toBe('purify_arcstone');
    expect(recipe!.name).toBe('Purify Arcstone');
    expect(recipe!.building).toBe('forge');
  });

  it('returns each recipe by its id', () => {
    for (const recipe of RECIPES) {
      const found = getRecipe(recipe.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(recipe.id);
      expect(found).toBe(recipe);
    }
  });

  it('returns undefined for a non-existent recipe id', () => {
    expect(getRecipe('nonexistent_recipe')).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(getRecipe('')).toBeUndefined();
  });
});

describe('getRecipesForBuilding()', () => {
  it('returns only forge recipes when filtering by forge', () => {
    const forgeRecipes = getRecipesForBuilding('forge');
    expect(forgeRecipes.length).toBeGreaterThan(0);
    for (const recipe of forgeRecipes) {
      expect(recipe.building).toBe('forge');
    }
  });

  it('returns only workbench recipes when filtering by workbench', () => {
    const workbenchRecipes = getRecipesForBuilding('workbench');
    expect(workbenchRecipes.length).toBeGreaterThan(0);
    for (const recipe of workbenchRecipes) {
      expect(recipe.building).toBe('workbench');
    }
  });

  it('forge recipes include purify_arcstone and purify_sunite', () => {
    const forgeRecipes = getRecipesForBuilding('forge');
    const ids = forgeRecipes.map((r) => r.id);
    expect(ids).toContain('purify_arcstone');
    expect(ids).toContain('purify_sunite');
  });

  it('workbench recipes include forge_cogwheel, spin_thread, and inscribe_rune', () => {
    const workbenchRecipes = getRecipesForBuilding('workbench');
    const ids = workbenchRecipes.map((r) => r.id);
    expect(ids).toContain('forge_cogwheel');
    expect(ids).toContain('spin_thread');
    expect(ids).toContain('inscribe_rune');
  });

  it('forge and workbench recipes together cover all recipes', () => {
    const forgeRecipes = getRecipesForBuilding('forge');
    const workbenchRecipes = getRecipesForBuilding('workbench');
    expect(forgeRecipes.length + workbenchRecipes.length).toBe(RECIPES.length);
  });
});

describe('specific recipe correctness', () => {
  it('purify_arcstone: 1 arcstone -> 1 arcane_ingot in 40 ticks', () => {
    const recipe = getRecipe('purify_arcstone')!;
    expect(recipe.inputs.get('arcstone')).toBe(1);
    expect(recipe.inputs.size).toBe(1);
    expect(recipe.outputs.get('arcane_ingot')).toBe(1);
    expect(recipe.outputs.size).toBe(1);
    expect(recipe.craftTimeTicks).toBe(40);
  });

  it('purify_sunite: 1 sunite -> 1 sun_ingot in 40 ticks', () => {
    const recipe = getRecipe('purify_sunite')!;
    expect(recipe.inputs.get('sunite')).toBe(1);
    expect(recipe.inputs.size).toBe(1);
    expect(recipe.outputs.get('sun_ingot')).toBe(1);
    expect(recipe.outputs.size).toBe(1);
    expect(recipe.craftTimeTicks).toBe(40);
  });

  it('forge_cogwheel: 2 arcane_ingot -> 1 cogwheel in 30 ticks', () => {
    const recipe = getRecipe('forge_cogwheel')!;
    expect(recipe.inputs.get('arcane_ingot')).toBe(2);
    expect(recipe.inputs.size).toBe(1);
    expect(recipe.outputs.get('cogwheel')).toBe(1);
    expect(recipe.outputs.size).toBe(1);
    expect(recipe.craftTimeTicks).toBe(30);
  });

  it('spin_thread: 1 sun_ingot -> 2 thread in 20 ticks', () => {
    const recipe = getRecipe('spin_thread')!;
    expect(recipe.inputs.get('sun_ingot')).toBe(1);
    expect(recipe.inputs.size).toBe(1);
    expect(recipe.outputs.get('thread')).toBe(2);
    expect(recipe.outputs.size).toBe(1);
    expect(recipe.craftTimeTicks).toBe(20);
  });

  it('inscribe_rune: 1 arcane_ingot + 3 thread -> 1 rune in 60 ticks', () => {
    const recipe = getRecipe('inscribe_rune')!;
    expect(recipe.inputs.get('arcane_ingot')).toBe(1);
    expect(recipe.inputs.get('thread')).toBe(3);
    expect(recipe.inputs.size).toBe(2);
    expect(recipe.outputs.get('rune')).toBe(1);
    expect(recipe.outputs.size).toBe(1);
    expect(recipe.craftTimeTicks).toBe(60);
  });
});
