/**
 * Sprite catalog for AI generation.
 * Each entry defines a sprite name, target pixel dimensions, and a descriptive prompt.
 */

const STYLE_PREFIX =
  'Pixel art sprite, top-down view, transparent background, 16-bit SNES-era style, ' +
  'crisp pixel edges, rich color palette with shading and highlights, subtle dithering allowed, ' +
  'dark fantasy aesthetic. Single isolated object on transparent background, no text or labels.';

export const SPRITES = [
  // === UI / Logo ===
  {
    name: 'logo_crest',
    width: 64,
    height: 64,
    prompt:
      `${STYLE_PREFIX} The sprite should be 64x64 logical pixels shown at large scale. ` +
      'A front-facing heraldic crest or emblem, NOT top-down. A dark fantasy coat of arms or shield emblem. ' +
      'Central motif: a glowing runic anvil or forge hammer crossed with a luminous crystal, ' +
      'framed by an ornate gothic shield shape. Arcane rune symbols etched into the shield border. ' +
      'Small gear/cog details in the corners representing crafting and machinery. ' +
      'A faint magical aura radiating from the center. ' +
      'Must look iconic and recognizable at small sizes — bold silhouette, high contrast. ' +
      'Designed to display on a black background. ' +
      'Color scheme: deep purple and indigo shield body, bright cyan-blue glowing runes and crystal, ' +
      'orange-amber forge glow from the anvil/hammer, dark iron gray metallic trim.',
  },

  // === Buildings (64x64, 2x2 tile) ===
  {
    name: 'quarry',
    width: 64,
    height: 64,
    prompt:
      `${STYLE_PREFIX} The sprite should be 64x64 logical pixels shown at large scale. ` +
      'A top-down view of a mystical quarry machine. A heavy stone-and-iron mining apparatus with ' +
      'a drill or pick mechanism in the center. Dark gray metal frame with bolts and rivets. ' +
      'A glowing purple-blue crystal core visible through a grate. Input/output ports on the sides ' +
      'shown as small colored squares. Runic engravings along the edges. Color scheme: dark grays, ' +
      'iron browns, with purple-blue arcane accents.',
  },
  {
    name: 'forge',
    width: 64,
    height: 64,
    prompt:
      `${STYLE_PREFIX} The sprite should be 64x64 logical pixels shown at large scale. ` +
      'A top-down view of an enchanted forge/smelter. A rectangular furnace with glowing orange-red ' +
      'flames visible through a central chamber. Dark iron casing with heat vents on the sides. ' +
      'Molten metal channels running through it. Input hopper on one side, output chute on another. ' +
      'Color scheme: dark iron grays, fiery orange-red center, with amber/gold highlights from the heat.',
  },
  {
    name: 'workbench',
    width: 64,
    height: 64,
    prompt:
      `${STYLE_PREFIX} The sprite should be 64x64 logical pixels shown at large scale. ` +
      'A top-down view of a runic crafting workbench. A large wooden work surface with tools, gears, ' +
      'and components scattered on top. A green glowing enchantment circle in the center where items ' +
      'are assembled. Wooden frame with metal corner brackets. Small compartments for parts along edges. ' +
      'Color scheme: warm brown wood, dark green magical glow in center, iron gray tool accents.',
  },
  {
    name: 'arcane_study',
    width: 64,
    height: 64,
    prompt:
      `${STYLE_PREFIX} The sprite should be 64x64 logical pixels shown at large scale. ` +
      'A top-down view of a mystical arcane research station. A circular desk covered with scrolls, ' +
      'open spellbooks, and crystal orbs. A glowing purple ritual circle inscribed on the central ' +
      'surface. Bookshelves visible around the edges. Floating rune symbols above the workspace. ' +
      'Color scheme: deep purple and violet arcane energy, dark wood, parchment yellows.',
  },
  {
    name: 'mana_obelisk',
    width: 64,
    height: 64,
    prompt:
      `${STYLE_PREFIX} The sprite should be 64x64 logical pixels shown at large scale. ` +
      'A top-down view of a large mana obelisk crystal pillar. A tall crystalline structure viewed ' +
      'from above, showing a diamond/octagonal cross-section. Deep blue crystal with bright cyan ' +
      'energy veins running through it. A circular stone base with runic inscriptions. Pulsing ' +
      'magical energy radiating outward. Color scheme: deep blue crystal, bright cyan energy, gray stone base.',
  },

  // === Buildings (32x32, 1x1 tile) ===
  {
    name: 'chest',
    width: 32,
    height: 32,
    prompt:
      `${STYLE_PREFIX} The sprite should be 32x32 logical pixels shown at large scale. ` +
      'A top-down view of a wooden storage chest. A rectangular chest with a visible lid, metal ' +
      'latch/lock in the center, and iron corner reinforcements. Wood grain texture on the lid. ' +
      'Color scheme: warm brown wood, dark iron fittings, small golden lock.',
  },
  {
    name: 'mana_well',
    width: 32,
    height: 32,
    prompt:
      `${STYLE_PREFIX} The sprite should be 32x32 logical pixels shown at large scale. ` +
      'A top-down view of a small mana well. A circular stone well with glowing blue magical ' +
      'liquid inside. Dark blue stone rim around a bright cyan/azure pool of mana energy. ' +
      'Small runic symbols carved into the stone rim. Color scheme: dark blue-gray stone, ' +
      'bright glowing cyan-blue liquid center.',
  },
  {
    name: 'mana_tower',
    width: 32,
    height: 32,
    prompt:
      `${STYLE_PREFIX} The sprite should be 32x32 logical pixels shown at large scale. ` +
      'A top-down view of a small mana relay tower/spire. A pointed crystal spire viewed from ' +
      'above showing a star or diamond shape. Blue crystalline structure with a bright glowing ' +
      'tip at the center. A small square stone foundation. Color scheme: blue crystal, bright ' +
      'cyan center point, gray stone base.',
  },

  // === Items (16x16) ===
  {
    name: 'arcstone',
    width: 16,
    height: 16,
    prompt:
      `${STYLE_PREFIX} The sprite should be 16x16 logical pixels shown at large scale. ` +
      'A small gemstone icon. A faceted purple-blue crystal ore chunk. Octagonal or diamond shape ' +
      'with visible facets catching light. Deep indigo base with lighter purple and bright blue ' +
      'highlights on the edges. Color scheme: deep purple-indigo with blue-white highlights.',
  },
  {
    name: 'sunite',
    width: 16,
    height: 16,
    prompt:
      `${STYLE_PREFIX} The sprite should be 16x16 logical pixels shown at large scale. ` +
      'A small gemstone icon. A faceted golden-amber crystal ore chunk. Similar shape to a cut ' +
      'gem but rough and natural. Warm golden base with bright yellow highlights and orange ' +
      'undertones. Color scheme: deep gold/amber with bright yellow-white highlights.',
  },
  {
    name: 'arcane_ingot',
    width: 16,
    height: 16,
    prompt:
      `${STYLE_PREFIX} The sprite should be 16x16 logical pixels shown at large scale. ` +
      'A small metal ingot icon. A refined rectangular purple-blue metal bar. Smooth polished ' +
      'surface with a slight magical shimmer. Trapezoidal shape (classic ingot). ' +
      'Color scheme: deep purple-blue metal with lighter blue reflective highlights.',
  },
  {
    name: 'sun_ingot',
    width: 16,
    height: 16,
    prompt:
      `${STYLE_PREFIX} The sprite should be 16x16 logical pixels shown at large scale. ` +
      'A small metal ingot icon. A refined rectangular golden metal bar. Smooth polished surface ' +
      'with a warm glow. Trapezoidal shape (classic ingot). ' +
      'Color scheme: bright gold metal with amber-orange reflective highlights.',
  },
  {
    name: 'cogwheel',
    width: 16,
    height: 16,
    prompt:
      `${STYLE_PREFIX} The sprite should be 16x16 logical pixels shown at large scale. ` +
      'A small cogwheel/gear icon. A gray metal gear with visible teeth around the edge and ' +
      'a circular hole in the center. 6-8 teeth visible. ' +
      'Color scheme: medium gray iron with darker gray shadows and lighter steel highlights.',
  },
  {
    name: 'thread',
    width: 16,
    height: 16,
    prompt:
      `${STYLE_PREFIX} The sprite should be 16x16 logical pixels shown at large scale. ` +
      'A small spool of magical thread icon. A coiled thread or yarn in an arcane golden color. ' +
      'Circular coil shape. Color scheme: golden-amber thread with slight magical glow.',
  },
  {
    name: 'rune',
    width: 16,
    height: 16,
    prompt:
      `${STYLE_PREFIX} The sprite should be 16x16 logical pixels shown at large scale. ` +
      'A small rune stone icon. A flat circular or square stone tablet with a glowing purple ' +
      'magical rune symbol inscribed on it. The rune should be a simple geometric glyph. ' +
      'Color scheme: dark gray stone with glowing purple-blue runic inscription.',
  },

  // === Resource Items (16x16) — extracted from terrain ===
  {
    name: 'stone',
    width: 16,
    height: 16,
    prompt:
      `${STYLE_PREFIX} The sprite should be 16x16 logical pixels shown at large scale. ` +
      'A small stone chunk icon. A rough gray rock with angular edges and visible cracks. ' +
      'Slightly rounded but clearly stone. Color scheme: medium gray with darker shadow and ' +
      'lighter highlights on edges.',
  },
  {
    name: 'wood',
    width: 16,
    height: 16,
    prompt:
      `${STYLE_PREFIX} The sprite should be 16x16 logical pixels shown at large scale. ` +
      'A small log/wood icon. A short cut log or bundle of wooden planks viewed from above. ' +
      'Visible wood grain and bark. Color scheme: warm brown wood with darker bark edges ' +
      'and lighter tan heartwood.',
  },
  {
    name: 'iron',
    width: 16,
    height: 16,
    prompt:
      `${STYLE_PREFIX} The sprite should be 16x16 logical pixels shown at large scale. ` +
      'A small iron ore chunk icon. A rough metallic dark gray-blue ore nugget with angular ' +
      'faces and a slight metallic sheen. Color scheme: dark blue-gray iron with silver-white ' +
      'metallic highlights.',
  },
  {
    name: 'clay',
    width: 16,
    height: 16,
    prompt:
      `${STYLE_PREFIX} The sprite should be 16x16 logical pixels shown at large scale. ` +
      'A small clay lump icon. A smooth rounded terracotta-colored clay ball or brick. ' +
      'Soft edges with slight moisture sheen. Color scheme: warm reddish-brown terracotta ' +
      'with orange highlights.',
  },
  {
    name: 'crystal_shard',
    width: 16,
    height: 16,
    prompt:
      `${STYLE_PREFIX} The sprite should be 16x16 logical pixels shown at large scale. ` +
      'A small crystal shard icon. A pointed translucent cyan-teal crystal fragment with ' +
      'sharp faceted edges. Glowing faintly from within. Color scheme: teal-cyan crystal ' +
      'with bright white-blue highlights and transparent edges.',
  },

  // === Terrain (32x32) ===
  {
    name: 'ground',
    width: 32,
    height: 32,
    tileable: true,
    prompt:
      `${STYLE_PREFIX} The sprite should be 32x32 logical pixels shown at large scale. ` +
      'IMPORTANT: This is a seamless tileable texture — the pattern must repeat seamlessly when tiled ' +
      'in all directions. Content must extend fully to every edge with NO whitespace, NO border, ' +
      'and NO empty margin. ' +
      'A dark, flat top-down grass ground texture. NO distinct shapes, NO circles, NO bushes, NO objects. ' +
      'Coarse, chunky texture — large clumps of dark grass, NOT fine-grain noise. Think big blocky pixel clusters ' +
      'of 3-4 pixels each, not single-pixel noise. Visible but subtle variation between clumps. ' +
      'Very dark overall so brighter resource tiles and buildings pop against it. ' +
      'Extremely subtle and non-distracting — pure background filler. ' +
      'Color scheme: very dark green, like shadowy moss-covered ground. Green hue, not brown. ' +
      'NO bright colors, NO recognizable shapes. Coarse, chunky, low-contrast texture only.',
  },
  {
    name: 'arcstone_vein',
    width: 32,
    height: 32,
    prompt:
      `${STYLE_PREFIX} The sprite should be 32x32 logical pixels shown at large scale. ` +
      'A top-down terrain tile showing rocky ground with embedded purple-blue crystal deposits. ' +
      'Dark stone surface with clusters of glowing arcstone crystals poking through. ' +
      '3-4 small crystal clusters scattered across the tile. ' +
      'Color scheme: dark gray-brown rock with glowing purple-blue crystal clusters.',
  },
  {
    name: 'sunite_vein',
    width: 32,
    height: 32,
    prompt:
      `${STYLE_PREFIX} The sprite should be 32x32 logical pixels shown at large scale. ` +
      'A top-down terrain tile showing rocky ground with embedded golden crystal deposits. ' +
      'Dark stone surface with clusters of glowing sunite crystals poking through. ' +
      '3-4 small crystal clusters scattered across the tile. ' +
      'Color scheme: dark gray-brown rock with glowing golden-amber crystal clusters.',
  },
  {
    name: 'stone_terrain',
    width: 32,
    height: 32,
    tileable: true,
    prompt:
      `${STYLE_PREFIX} The sprite should be 32x32 logical pixels shown at large scale. ` +
      'IMPORTANT: This is a seamless tileable texture — the pattern must repeat seamlessly when tiled ' +
      'in all directions. Content must extend fully to every edge with NO whitespace, NO border, ' +
      'and NO empty margin. ' +
      'A top-down terrain tile showing coarse, chunky stone ground. Large angular rock slabs and ' +
      'big boulders packed together with visible cracks between them. Few but big stone pieces, ' +
      'not fine gravel — think flagstone or broken bedrock. ' +
      'Color scheme: light gray and medium gray stone with white highlights. Bright and readable.',
  },
  {
    name: 'iron_terrain',
    width: 32,
    height: 32,
    tileable: true,
    prompt:
      `${STYLE_PREFIX} The sprite should be 32x32 logical pixels shown at large scale. ` +
      'IMPORTANT: This is a seamless tileable texture — the pattern must repeat seamlessly when tiled ' +
      'in all directions. Content must extend fully to every edge with NO whitespace, NO border, ' +
      'and NO empty margin. ' +
      'A top-down terrain tile showing iron ore deposits in rocky ground. Dark stone surface with ' +
      'thick veins of metallic silver-blue iron ore running through it. Pure iron — no rust, no ' +
      'reddish-brown, no oxidation. Chunks of raw metallic ore embedded in the rock. ' +
      'Color scheme: dark gray rock with metallic silver-blue iron streaks and steel-gray highlights.',
  },
  {
    name: 'forest_terrain',
    width: 32,
    height: 32,
    prompt:
      `${STYLE_PREFIX} The sprite should be 32x32 logical pixels shown at large scale. ` +
      'A top-down terrain tile showing a dense forest patch. Tree canopies viewed from above ' +
      'as clusters of dark and medium green circular tree tops. Shadows between the trees. ' +
      'A few tree trunks visible as small brown dots between canopies. ' +
      'Color scheme: dark green, medium green canopies with brown trunk accents.',
  },
  {
    name: 'clay_terrain',
    width: 32,
    height: 32,
    tileable: true,
    prompt:
      `${STYLE_PREFIX} The sprite should be 32x32 logical pixels shown at large scale. ` +
      'IMPORTANT: This is a seamless tileable texture — the pattern must repeat seamlessly when tiled ' +
      'in all directions. Content must extend fully to every edge with NO whitespace, NO border, ' +
      'and NO empty margin. ' +
      'A top-down terrain tile of smooth wet clay earth. Uniform reddish-brown terracotta surface ' +
      'with subtle cracks and moisture variations spread evenly across the entire tile. No distinct ' +
      'objects or circular shapes — just a continuous clay ground texture. Small drying cracks form ' +
      'an organic network pattern. Slight sheen from moisture. ' +
      'Color scheme: warm reddish-brown and orange-tan clay with subtle darker wet seams between patches.',
  },
  {
    name: 'crystal_shard_terrain',
    width: 32,
    height: 32,
    prompt:
      `${STYLE_PREFIX} The sprite should be 32x32 logical pixels shown at large scale. ` +
      'A top-down terrain tile showing crystal shard deposits. Dark rocky ground with clusters ' +
      'of small pointed cyan-teal crystals growing upward from the surface. Faint magical glow ' +
      'around the crystal clusters. Color scheme: dark rock with bright teal-cyan crystal shards.',
  },
];
