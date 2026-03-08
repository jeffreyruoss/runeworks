import {
  RESEARCH_RECIPES,
  getResearchRecipe,
  RESEARCH_NODES,
  getResearchNode,
} from '../../src/data/research';

describe('RESEARCH_RECIPES data', () => {
  it('contains at least one recipe', () => {
    expect(RESEARCH_RECIPES.length).toBeGreaterThan(0);
  });

  it('all recipes have unique non-empty IDs', () => {
    const ids = RESEARCH_RECIPES.map((r) => r.id);
    for (const id of ids) {
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all recipes have non-empty names', () => {
    for (const r of RESEARCH_RECIPES) {
      expect(typeof r.name).toBe('string');
      expect(r.name.length).toBeGreaterThan(0);
    }
  });

  it('all recipes have positive inputCount', () => {
    for (const r of RESEARCH_RECIPES) {
      expect(r.inputCount).toBeGreaterThan(0);
      expect(Number.isInteger(r.inputCount)).toBe(true);
    }
  });

  it('all recipes have positive rpYield', () => {
    for (const r of RESEARCH_RECIPES) {
      expect(r.rpYield).toBeGreaterThan(0);
      expect(Number.isInteger(r.rpYield)).toBe(true);
    }
  });

  it('all recipes have positive craftTimeTicks', () => {
    for (const r of RESEARCH_RECIPES) {
      expect(r.craftTimeTicks).toBeGreaterThan(0);
      expect(Number.isInteger(r.craftTimeTicks)).toBe(true);
    }
  });
});

describe('getResearchRecipe()', () => {
  it('returns each recipe by its id', () => {
    for (const r of RESEARCH_RECIPES) {
      const found = getResearchRecipe(r.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(r.id);
      expect(found).toBe(r);
    }
  });

  it('returns undefined for nonexistent id', () => {
    expect(getResearchRecipe('nonexistent')).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(getResearchRecipe('')).toBeUndefined();
  });
});

describe('RESEARCH_NODES data', () => {
  it('contains at least one node', () => {
    expect(RESEARCH_NODES.length).toBeGreaterThan(0);
  });

  it('all nodes have unique non-empty IDs', () => {
    const ids = RESEARCH_NODES.map((n) => n.id);
    for (const id of ids) {
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all nodes have valid branch values', () => {
    const validBranches = ['buildings', 'recipes', 'upgrades'];
    for (const n of RESEARCH_NODES) {
      expect(validBranches).toContain(n.branch);
    }
  });

  it('all nodes have positive cost', () => {
    for (const n of RESEARCH_NODES) {
      expect(n.cost).toBeGreaterThan(0);
    }
  });

  it('all requires references point to existing node IDs or null', () => {
    const nodeIds = new Set(RESEARCH_NODES.map((n) => n.id));
    for (const n of RESEARCH_NODES) {
      if (n.requires !== null) {
        expect(nodeIds.has(n.requires)).toBe(true);
      }
    }
  });

  it('has no circular dependencies in requires chain', () => {
    const nodeMap = new Map(RESEARCH_NODES.map((n) => [n.id, n]));
    for (const node of RESEARCH_NODES) {
      const visited = new Set<string>();
      let current: string | null = node.id;
      while (current !== null) {
        expect(visited.has(current)).toBe(false);
        visited.add(current);
        current = nodeMap.get(current)?.requires ?? null;
      }
    }
  });

  it('all effect types are valid', () => {
    const validTypes = ['unlock_building', 'unlock_recipe', 'buffer_expansion', 'overclock'];
    for (const n of RESEARCH_NODES) {
      expect(validTypes).toContain(n.effect.type);
    }
  });

  it('each branch has at least one root node (requires: null)', () => {
    const branches = ['buildings', 'recipes', 'upgrades'] as const;
    for (const branch of branches) {
      const roots = RESEARCH_NODES.filter((n) => n.branch === branch && n.requires === null);
      expect(roots.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('getResearchNode()', () => {
  it('returns each node by its id', () => {
    for (const n of RESEARCH_NODES) {
      const found = getResearchNode(n.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(n.id);
      expect(found).toBe(n);
    }
  });

  it('returns undefined for nonexistent id', () => {
    expect(getResearchNode('nonexistent')).toBeUndefined();
  });
});
