# Perk Database System

## Overview

The perk database system has been successfully implemented with a hybrid approach:
- **Build-time parsing** from local ruleset symlink
- **Runtime GitHub sync** with localStorage caching (framework in place, full implementation pending)
- **Snapshot-based character storage** to preserve perks even if deleted from database

## Components

### 1. Parser Script (`scripts/parse-perks.ts`)
- Parses all `.md` files from `/home/r/Exceed/ExceedV/source/content/Perks/`
- Extracts: name, requirements, attributes, cost, AP cost, tags, descriptions
- Categorizes by folder: CombatPerks → combat, MagicPerks → magic, SkillPerks → skill
- Generates `public/data/perks.json` (87KB, 95 perks)
- Runs automatically before every build via `prebuild` hook

### 2. Type Definitions (`src/types/perks.ts`)
```typescript
export interface Perk {
  id: string;              // e.g., "shield-rush"
  name: string;
  type: 'combat' | 'magic' | 'skill';
  source: 'database' | 'archived' | 'custom';
  requirements: PerkRequirements;
  attributes: string[];    // e.g., ["Might", "Endurance", "Shield"]
  cost: PerkCost;
  apCost: number | null;
  tags: string[];
  shortDescription: string;
  effect: string;
  description?: string;
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

### 4. Sync Service (`src/services/perkSync.ts`)
Handles hybrid loading strategy:
- `loadPerks()` - Primary entry point with fallback logic
  1. Check localStorage cache (7-day expiration)
  2. Fall back to bundled perks
  3. Trigger background GitHub fetch (framework in place)
- `refreshPerks()` - Force refresh from GitHub
- `clearPerkCache()` - Clear cache
- Dispatches `perks-updated` event when new perks available

### 5. Character Integration (`src/types/character.ts`)
Extended `Perk` and `CombatPerk` interfaces with snapshot fields:
```typescript
{
  // Original fields
  name: string;
  cost: number;
  attribute: string;
  description: string;

  // New snapshot fields
  id?: string;                    // Database perk ID
  isCustom?: boolean;             // true for custom, false for DB
  source?: PerkSource;            // 'database', 'archived', 'custom'
  perkSnapshot?: DatabasePerk;    // Full snapshot of perk data
  addedAt?: number;               // Timestamp
}
```

**Backwards compatible** - old characters without new fields will continue to work.

### 6. App Integration (`src/App.tsx`)
- Loads perk database on app startup
- Logs perk counts to console
- Listens for `perks-updated` events
- State available for future components: `perkDatabase`

## Current Status

### ✅ Completed
- [x] Build-time parser from local symlink
- [x] TypeScript types for perks
- [x] Perk loader utilities
- [x] GitHub sync service framework
- [x] Character type extensions (snapshot approach)
- [x] App initialization
- [x] Automatic parser execution before builds
- [x] Full build and TypeScript compilation working

### 🔜 Next Steps
1. **PerkSelectModal component** - Browse and select perks from database
2. **Perk display components** - Show database vs archived vs custom badges
3. **Integration with existing perk modals** - Replace manual entry with database selection
4. **GitHub markdown fetching** - Complete runtime GitHub sync implementation
5. **Character migration** - Update existing characters to new format

## How It Works

### Build Time
```bash
npm run build
→ prebuild hook: npm run parse-perks
→ Parser reads /home/r/Exceed/ExceedV/source/content/Perks/**/*.md
→ Generates public/data/perks.json (bundled with app)
→ TypeScript compilation
→ Vite builds app
```

### Runtime
```
App loads
→ loadPerks() called
  → Check localStorage cache (valid for 7 days)
  → If cache miss/expired: load from bundled perks.json
  → Background: check GitHub for updates (framework in place)
  → If newer: update cache, dispatch 'perks-updated' event
→ perkDatabase available to all components
```

### Character Perk Storage (Snapshot Approach)
When user selects a perk from database:
```typescript
{
  id: "shield-rush",
  name: "Shield Rush",
  source: "database",
  isCustom: false,
  perkSnapshot: { /* full perk data */ },
  // ... user-specific fields (attribute chosen, cost paid, etc.)
}
```

If perk is deleted from database later:
- Character still has full snapshot
- Source shown as "archived"
- No data loss

## Usage Examples

### Load and search perks
```typescript
import { loadPerks } from '@/services/perkSync';
import { searchPerks, getPerksByType } from '@/data/perkLoader';

const database = await loadPerks();

// Get combat perks
const combat Perks = getPerksByType(database, 'combat');

// Search
const results = searchPerks(database, 'shield');
```

### Check requirements
```typescript
import { filterPerksByRequirements } from '@/data/perkLoader';

const available = filterPerksByRequirements(database, {
  hasSkills: ["Medicine 2", "Biology 1"],
  hasDomains: ["SH2"],
  hasPerks: ["Shield Block"]
});
```

## File Structure
```
exceed-app-react/
├── scripts/
│   └── parse-perks.ts           # Build-time parser
├── src/
│   ├── types/
│   │   ├── perks.ts             # Perk type definitions
│   │   └── character.ts         # Extended with snapshot fields
│   ├── data/
│   │   └── perkLoader.ts        # Utility functions
│   ├── services/
│   │   └── perkSync.ts          # GitHub sync service
│   └── App.tsx                  # Initialization
└── public/
    └── data/
        └── perks.json           # Generated database (87KB)
```

## Statistics
- **Total perks**: 95
  - Combat: 52
  - Magic: 3
  - Skill: 40
- **Bundle size**: 87KB (JSON)
- **Parse time**: ~0.5s
- **Build time**: ~5s total
- **Cache duration**: 7 days

## Notes
- GitHub sync framework is in place but markdown fetching not yet implemented
- Full implementation would require fetching file list from GitHub API then parsing each .md file
- Current system works perfectly with bundled perks from local symlink
- Character backwards compatibility maintained
- No breaking changes to existing functionality
