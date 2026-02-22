# Perk Database System (MS6)

## Overview

The perk database system has been successfully implemented with:
- **Build-time parsing** from local ruleset
- **Stage-based effects** for conditioning perks via `grants.byStage`
- **Unified perk storage** - all perks in `character.perks[]` array
- **Flaws support** - perks with `isFlaw: true` that grant XP
- **Custom perk creation** - via UI with custom effects
- **Free perks** - 0 XP cost for in-game rewards

## Components

### 1. Parser Script (`scripts/parse-perks.ts`)
- Parses all `.md` files from `/home/r/Exceed/ExceedV/source/content/Perks/`
- Extracts: name, requirements, attributes, cost, AP cost, tags, descriptions
- **NEW**: Parses `## Grants by Stage` section for conditioning perks
- Categorizes by folder: CombatPerks → combat, MagicPerks → magic, SkillPerks → skill
- Generates `public/data/perks.json` with `byStage` arrays
- Runs automatically before every build via `prebuild` hook

### 2. Type Definitions (`src/types/perks.ts` and `src/types/character.ts`)
```typescript
// Database perk definition
export interface Perk {
  id: string;
  name: string;
  type: 'combat' | 'magic' | 'skill';
  requirements: PerkRequirements;
  attributes: string[];
  cost: PerkCost;
  apCost: number | null;
  tags: string[];
  description: string;
  effect: string;
  grants: PerkGrants;  // { abilities: string[], effects: string[], byStage?: [...] }
}

// Character's perk instance
export interface CharacterPerk {
  id: string;
  perkId: string;        // Reference to database
  name: string;
  type: 'Combat' | 'Magic' | 'Skill';
  level: number;         // 1-5 for staged perks
  attribute: string;
  isFlaw: boolean;       // true = grants XP
  isStaged: boolean;     // true = conditioning perk
  perkSnapshot?: Perk;
}
```

### 3. Perk Loader (`src/data/perkLoader.ts`)
Utility functions for working with perk database:
- `loadBundledPerks()` - Load from bundled JSON
- `getAllPerks()` - Get all perks from database
- `getPerksByType()` - Filter by combat/magic/skill
- `findPerkById()` - Lookup by ID
- `searchPerks()` - Search by name, tags, description
- `filterPerksByTags()` - Filter by tags
- `filterPerksByRequirements()` - Check if character meets requirements

### 4. Effect Calculator (`src/utils/effectCalculator.ts`)
- **NEW**: Reads `grants.byStage[level]` for staged perks
- Returns different effects based on perk level
- Stage 1-4: Extra HP effects
- Stage 5: Extra Wound + Capstone effect
### 5. Character Integration (MS6 - Unified System)
All perks stored in single `character.perks[]` array:
```typescript
{
  id: string;                    // Unique instance ID
  perkId: string;                // Reference to database
  name: string;
  type: 'Combat' | 'Magic' | 'Skill';
  level: number;                 // 1-5 for staged perks
  attribute: string;
  isFlaw: boolean;               // true = grants XP
  isStaged: boolean;             // true = conditioning perk
  perkSnapshot?: DatabasePerk;   // Full snapshot
  acquiredAt: number;
}
```

**Removed**: `combatPerks[]`, `magicPerks[]`, `stagedPerks[]`, `flaws[]` arrays
**Backwards compatible** - migration handles old character formats.

### 6. App Integration (`src/App.tsx`)
- Loads perk database on app startup
- Logs perk counts to console
- State available for all components: `perkDatabase`

## Current Status

### ✅ Completed (MS6)
- [x] Build-time parser from local symlink
- [x] TypeScript types for perks (unified system)
- [x] Perk loader utilities
- [x] Effect calculator with `byStage` support
- [x] Character type extensions (unified perks array)
- [x] App initialization
- [x] Automatic parser execution before builds
- [x] Full build and TypeScript compilation working
- [x] Flaws system (negative XP perks)
- [x] Custom perk creation UI
- [x] Free perks (0 XP cost)
- [x] Stage-based conditioning perks

### 🔜 Next Steps
1. **More custom perk options** - Custom abilities/effects
2. **Flaw balancing** - More predefined flaws
3. **Perk prerequisites validation** - Check requirements before adding

## How It Works

### Build Time
```bash
npm run build
→ prebuild hook: npm run parse-perks
→ Parser reads /home/r/Exceed/ExceedV/source/content/Perks/**/*.md
→ Parses ## Grants by Stage sections
→ Generates public/data/perks.json (bundled with app)
→ TypeScript compilation
→ Vite builds app
```

### Runtime
```
App loads
→ Perk database loaded from public/data/perks.json
→ Available to all components via perkDatabase prop
```

### Character Perk Storage (Unified System)
When user adds a perk:
```typescript
{
  id: "custom-1234567890",
  perkId: "shield-rush",  // Empty for custom perks
  name: "Shield Rush",
  type: "Combat",
  level: 1,
  attribute: "Might",
  isFlaw: false,
  isStaged: false,
  perkSnapshot: { ... },  // Full database snapshot
  acquiredAt: 1234567890
}
```

### Conditioning Perks (Staged)
When user levels up conditioning:
1. Perk stays in `character.perks[]` (doesn't move)
2. `level` increases (1 → 2 → 3 → 4 → 5)
3. `effectCalculator.ts` reads `grants.byStage[level]`
4. Different effects granted at each level:
   - Level 1-4: Extra HP 1/2/3/4
   - Level 5: Extra Wound + Capstone

### Flaws
When user adds a flaw:
1. `isFlaw: true`
2. Negative XP cost (e.g., -10)
3. Character GAINS XP to spend
4. Appears in Flaws section of Perks tab
```

If perk is deleted from database later:
- Character still has full snapshot
- No data loss

## Usage Examples

### Load and search perks
```typescript
import { loadPerks } from '@/services/perkSync';
import { searchPerks, getPerksByType } from '@/data/perkLoader';

const database = await loadPerks();

// Get combat perks
const combatPerks = getPerksByType(database, 'combat');

// Search
const results = searchPerks(database, 'shield');
```

### Check requirements
```typescript
import { filterPerksByRequirements } from '@/data/perkLoader';

const available = filterPerksByRequirements(database, {
  hasSkills: ["Medicine 2", "Biology 1"],
  hasPerks: ["Shield Block"]
});
```

## File Structure
```
exceed-app-react/
├── scripts/
│   └── parse-perks.ts           # Build-time parser (parses byStage)
├── src/
│   ├── types/
│   │   ├── perks.ts             # Database perk types
│   │   └── character.ts         # CharacterPerk interface
│   ├── data/
│   │   └── perkLoader.ts        # Utility functions
│   ├── utils/
│   │   └── effectCalculator.ts  # Reads byStage for effects
│   └── App.tsx                  # Initialization
└── public/
    └── data/
        └── perks.json           # Generated database with byStage
```

## Statistics
- **Total perks**: 95+ (includes conditioning perks with byStage)
- **Bundle size**: ~90KB (JSON)
- **Parse time**: ~0.5s
- **Build time**: ~5s total

## Notes
- Stage-based effects for conditioning perks
- Flaws use same system with `isFlaw: true`
- Custom perks can be created via UI
- Free perks (0 XP) supported for in-game rewards
- Character backwards compatibility maintained
- No breaking changes to existing functionality
