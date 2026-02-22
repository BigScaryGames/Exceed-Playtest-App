# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`exceed-app-react` is a React + TypeScript web application for managing character sheets for the **EXCEED** tabletop RPG system. The app features a mobile-first design with comprehensive character management, XP tracking, skill progression, combat statistics, and equipment management.

### Game Rules Reference

- **Public Website**: https://bigscarygames.github.io/ExceedV/
- **Local Source**: `/home/r/Exceed/ExceedV/source/content/Rules/`

Key mechanics files for quick reference during development:
- `3. Character Creation and Point buy Costs.md`
- `3.1 Attributes.md`
- `3.2 Perks and Wounds.md`
- `5. Skills.md`
- `4. Combat Conflict Resolution.md`
- `7. Equipment.md`
- `7.1 Encumbrance.md`

## Build and Development Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **localStorage** - Character persistence

## Project Architecture

### Folder Structure

```
src/
├── components/           # React components
│   ├── tabs/            # Tab components (Skills, Combat, Equipment, List)
│   ├── modals/          # Modal dialogs (XP, Skill, Perk, Armor, etc.)
│   ├── shared/          # Reusable UI components (Modal, AttributeSelector)
│   ├── CharacterHeader.tsx
│   └── CharacterSheet.tsx
├── data/                # Game databases
│   ├── armor.ts         # Armor types and stats
│   ├── weapons.ts       # Weapon definitions
│   └── skills.ts        # Skill database by category
├── types/               # TypeScript type definitions
│   └── character.ts     # All character-related types
├── utils/               # Utility functions
│   ├── calculations.ts  # Game calculations (HP, stats, encumbrance, etc.)
│   ├── character.ts     # Character CRUD operations
│   └── constants.ts     # Game constants and thresholds
├── styles/              # CSS files
│   └── index.css        # Global styles with Tailwind
├── App.tsx              # Main app component (view routing)
└── main.tsx             # Application entry point
```

### Key Components

- **App.tsx**: Manages app views (landing, create, list, character sheet), character import/export, localStorage integration
- **CharacterSheet.tsx**: Main character view with tab navigation, swipe support, auto-calculation of stats
- **CharacterHeader.tsx**: Displays character name, XP, and collapsible stats
- **Tabs**: SkillsTab, CombatTab, EquipmentTab, ProgressionListTab
- **Modals**: XPModal, SkillSelectModal, PerkModal, CombatPerkModal, ArmorSelectModal

## Game Mechanics Implementation

### Attributes & Progression (MS6)
- **8 Attributes**: Might (MG), Endurance (EN), Agility (AG), Dexterity (DX), Wit (WT), Will (WI), Perception (PR), Charisma (CH)
- **Range**: -3 to +5 via CP thresholds
- **CP Thresholds**: -30/-20/-10/0/10/30/60/100/150 → -3/-2/-1/0/1/2/3/4/5
- **Dual XP Pools**: Combat XP and Social XP
- **Progression Log**: Complete audit trail of all XP expenditures
- **Flaws**: Perks with `isFlaw: true` that grant XP (negative cost) instead of costing XP

### Unified Perk System (MS6)
- **Single Array**: All perks stored in `character.perks[]` (no more combatPerks/magicPerks/stagedPerks separation)
- **CharacterPerk Interface**:
  ```typescript
  {
    id: string;
    perkId: string;        // Reference to database perk
    name: string;
    type: 'Combat' | 'Magic' | 'Skill';
    level: number;         // 1-5 for staged perks
    attribute: string;
    isFlaw: boolean;       // true = grants XP
    isStaged: boolean;     // true = conditioning perk
    perkSnapshot?: DatabasePerk;
  }
  ```
- **Staged Perks** (Conditioning): Use `grants.byStage` array - each level grants different effects
  - Stage 1-4: Extra HP 1/2/3/4
  - Stage 5: Extra Wound + Capstone effect
- **Custom Perks**: Can be created via "Browse Perks and Flaws" → "Create Custom" tab
- **Free Perks**: Checkbox for 0 XP cost (in-game rewards)

### Skills System
- 33 learnable skills across 7 categories
- Skill levels 1-5 (cost = level × 2 CP)
- Attribute selection per level from paired attributes
- Custom perks with name, cost, attribute, description

### Combat System
- **HP System**: Stamina + Health with draggable UI
- **Wounds**: Base wounds + extra wounds (from conditioning perks)
- **Weapon Domains**: Martial, Spellcraft
- **Domain Levels**: 0-5 based on CP thresholds (10/30/60/100/150)
- **Combat Perks**: Tied to Martial domain, affects deflect and attack
- **Defense Stats** (auto-calculated per `Rules/Mechanics/Defense Types.md`):
  - **Deflect** = higher of (Weapon Parry) or (Shield Block)
    - Parry = Martial + AG/DX/MG (weapon-based)
    - Block = Martial + shield attribute (AG for light, EN for medium, MG for heavy) + shield bonus
  - **Dodge** = Agility + Perception - armor penalty - encumbrance penalty
  - **Endure** = Endurance + Might
  - **Resolve** = Will + Charisma
- **Armor**: 9 types with Might requirements and penalties

### Equipment System
- Primary/secondary weapons + shield
- Armor with stat requirements
- **Encumbrance**: Capacity = (5 + EN + MG)², with 5 penalty levels
- Custom item inventory with weight/quantity tracking

## Key Utilities

### `calculations.ts`
- `calculateAttributeValues()`: Converts progression log to attribute stats (supports -3 to +5 range)
- `calculateWeaponDomains()`: Calculates Martial/Spellcraft domain levels
- `calculateHP()`, `calculateHPValues()`: HP, stamina, health calculations with bar percentages
- `calculateExtraHPFromStagedPerks()`: Calculates bonus HP from conditioning perks (stages 1-4)
- `calculateArmorPenalty()`: Armor penalty based on Might requirement
- `calculateSpeed()`: Speed with armor and encumbrance penalties
- `calculateDeflect()`, `calculateDeflectFromEquipped()`: Deflect defense (Martial + weapon attribute + shield)
- `calculateDodge()`, `calculateDodgeFromEquipped()`: Dodge defense (AG + PR - penalties)
- `calculateEndure()`: Endure defense (EN + MG)
- `calculateResolve()`: Resolve defense (WI + CH) - NEW
- `calculateBlockFromEquipped()`: Block from shield
- `calculateEncumbrance()`: Weight, capacity, and encumbrance level

### `character.ts`
- `createEmptyCharacter()`: Factory for new characters
- `saveCharacter()`, `loadAllCharacters()`, `loadCharacter()`, `deleteCharacter()`: localStorage CRUD
- `exportCharacter()`, `importCharacter()`: JSON file import/export

## Development Guidelines

### State Management
- **Character state** flows down from App.tsx as single source of truth
- **Auto-save** to localStorage triggers on every character update in sheet view
- **Immutable updates**: Always spread character object when updating (`{...character, field: newValue}`)
- **Stats calculation**: Derived from progression log via `calculateAttributeValues()` and `calculateWeaponDomains()`
- **Never modify progression log directly**: Use proper XP expenditure flows through components

### Common Workflows

#### Adding a New Skill
1. User clicks "Add Skill" in SkillsTab
2. SkillSelectModal displays available skills from `SKILL_DATABASE`
3. On selection, shows AttributeSelector for attribute choice
4. Updates character: adds to `skills[]`, deducts from `socialXP`, adds entry to `progressionLog`
5. Auto-save triggers in App.tsx

#### Leveling Up a Skill
1. User clicks "+" on existing skill in SkillsTab
2. AttributeSelector shows paired attributes for skill
3. Cost calculated as `(level + 1) * 2` CP
4. Updates: increments level, appends to `attributeHistory[]`, deducts XP, logs progression
5. Stats auto-recalculate from updated progression log

#### Adding Conditioning Perks
1. User clicks "Add Conditioning" in PerksTab
2. ConditioningPerkModal opens with available conditioning perks
3. Levels 1-4: +1 extraHP each, cost = `maxWounds` XP per level
4. Level 5: Completion - moves to combatPerks, `extraHP` → 0, `maxWounds` +1, removes extra-hp effect

#### Adding Combat Perks
1. User clicks "+" in Combat Perks section
2. CombatPerkModal opens with form (name, cost, domain, attribute, description)
3. On save: adds to `combatPerks[]`, adds to `progressionLog` with domain
4. Domain CP totals recalculated via `calculateWeaponDomains()`
5. Domain level auto-updates based on CP thresholds (5/15/30/50/75)

### Adding New Game Content

#### New Weapon
Edit `src/data/weapons.ts`:
```typescript
'Weapon Name': {
  domain: '1H' | '2H' | 'SaS' | 'Ar' | null,
  finesse: true/false,
  damage: 'd8' | 'd10+1' | '5+Power',
  ap: 3,
  powerReq?: 2,
  traits: ['Trait1', 'Trait2']
}
```

#### New Armor Type
Edit `src/data/armor.ts`:
```typescript
'Armor Name': {
  bonus: 4,          // Defense bonus
  mightReq: 2,       // Might requirement
  penalty: -3,       // Penalty if requirement not met
  penaltyMet: -1     // Penalty if requirement met
}
```

#### New Skill Category
Edit `src/data/skills.ts`:
```typescript
'Category Name': [
  {
    name: 'Skill Name',
    attributes: 'Attribute1/Attribute2',  // Paired attributes
    description: 'What the skill does'
  }
]
```

### Component Patterns

#### Modal Component Usage
```typescript
import { Modal } from '@/components/shared/Modal';

<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Modal Title"
>
  {/* Modal content */}
</Modal>
```

#### Updating Character
Always use this pattern:
```typescript
const handleUpdate = () => {
  onUpdate({
    ...character,
    field: newValue,
    progressionLog: [...character.progressionLog, {
      type: 'skill',
      cost: 10,
      attribute: 'Might'
    }]
  });
};
```

#### Calculating Derived Stats
```typescript
import { calculateAttributeValues, calculateWeaponDomains } from '@/utils/calculations';

// In useEffect
const updatedStats = calculateAttributeValues(character.progressionLog);
const updatedDomains = calculateWeaponDomains(character.progressionLog);

// Update character with calculated values
onUpdate({
  ...character,
  stats: updatedStats,
  weaponDomains: updatedDomains
});
```

### File Organization

- **New tab?** Create in `src/components/tabs/`
- **New modal?** Create in `src/components/modals/`
- **Reusable UI?** Add to `src/components/shared/`
- **New calculation?** Add to `src/utils/calculations.ts`
- **New game data?** Add to `src/data/`
- **New types?** Add to `src/types/character.ts`

### TypeScript Best Practices
- All components fully typed with `React.FC<PropsType>`
- Import types: `import { Character, Skill } from '@/types/character'`
- Use `@/` path alias for imports (maps to `src/`)
- Never use `any` - use proper types or `unknown`
- Props interfaces defined at top of each component file

### Styling Conventions
- **Dark theme**: Tailwind's slate color palette (`slate-900`, `slate-800`, `slate-700`)
- **Buttons**: `bg-slate-700 hover:bg-slate-600` for secondary, `bg-blue-600 hover:bg-blue-700` for primary
- **Inputs**: `bg-slate-700 border border-slate-600 rounded px-3 py-2`
- **Cards**: `bg-slate-800 rounded-lg p-4 border border-slate-700`
- **Text**: White (`text-white`) for headings, `text-slate-300` for body, `text-slate-400` for labels
- **Mobile-first**: Design for 320px width, use responsive classes (`md:`, `lg:`)

### Debugging Tips

#### Character not saving?
Check `useEffect` in App.tsx - auto-save only triggers when `currentView === 'characterSheet'`

#### Stats not updating?
Verify progression log has correct entries with `attribute` field set

#### XP deduction not working?
Check if component properly deducts XP before calling `onUpdate()`

#### Build errors?
Run `npm run build` - TypeScript will show all type errors

### Testing Approach (Future)
When adding tests, focus on:
1. **Utils**: Test all calculation functions in `calculations.ts`
2. **Character operations**: Test CRUD in `character.ts`
3. **Components**: Test user interactions in tab components
4. **Integration**: Test character creation and progression flows

### Performance Considerations
- **Large progression logs**: Consider pagination for ProgressionListTab if log exceeds 100 entries
- **Frequent updates**: CharacterSheet useEffect has optimizations to prevent unnecessary recalculations
- **localStorage**: Consider implementing debouncing if auto-save causes performance issues

### Common Pitfalls
- ❌ **Don't** mutate character object directly: `character.name = 'New'`
- ✅ **Do** spread and create new object: `{...character, name: 'New'}`
- ❌ **Don't** modify progression log: `character.progressionLog.push(entry)`
- ✅ **Do** create new array: `progressionLog: [...character.progressionLog, entry]`
- ❌ **Don't** calculate stats manually in components
- ✅ **Do** use utility functions from `calculations.ts`

## Perk System

### Conditioning Perks (Staged Perks)
- **Cost per level**: `maxWounds` XP (flat, not scaling by level)
  - Base (2 maxWounds): 2/2/2/2/2 XP per level (10 total)
  - After 1 complete (3 maxWounds): 3/3/3/3/3 XP per level (15 total)
  - After 2 complete (4 maxWounds): 4/4/4/4/4 XP per level (20 total)
- **Stage-based effects** (per `Grants by Stage` in perk markdown):
  - **Stage 1**: `![[Effect - Extra HP 1]]` → +1 Extra HP
  - **Stage 2**: `![[Effect - Extra HP 2]]` → +2 Extra HP
  - **Stage 3**: `![[Effect - Extra HP 3]]` → +3 Extra HP
  - **Stage 4**: `![[Effect - Extra HP 4]]` → +4 Extra HP
  - **Stage 5 (Capstone)**: `![[Effect - Extra Wound]]` + `![[Effect - <Type> Conditioning]]`
    - +1 Max Wounds
    - Capstone effect (e.g., Heat Conditioning, Cold Conditioning)
- **Effect calculation**: `effectCalculator.ts` reads `grants.byStage` based on current level
- **Stored in**: `character.perks[]` with `isStaged: true` (unified array)

### Flaws
- **Same system as perks** - just with `isFlaw: true`
- **Negative XP**: Grant XP instead of costing XP (e.g., -10 XP means character gains 10 XP to spend)
- **Custom flaws**: Can be created via "Browse Perks and Flaws" → "Create Custom" → check "This is a Flaw"
- **In-game flaws**: Can be granted for free (0 XP cost) via "Free" checkbox
- **Stored in**: `character.perks[]` with `isFlaw: true` (unified array)

### Perk Data Structure
```typescript
interface Perk {
  id: string;
  name: string;
  type: 'combat' | 'magic' | 'skill';
  source: 'database' | 'custom';
  requirements: PerkRequirements;
  attributes: string[];
  cost: PerkCost;
  apCost: number | null;
  tags: string[];
  description: string;      // Full description (no shortDescription field)
  effect: string;          // Effect name (extracted from ![[Effect - Name]])
  grants: PerkGrants;      // { abilities: string[], effects: string[] }
}
```

### Perk Data Flow
1. **Source**: Markdown files in `/home/r/Exceed/ExceedV/source/content/`
   - `Perks/` - CombatPerks/, MagicPerks/, SkillPerks/
   - `Actions/Abilities/` - Ability definitions
   - `Rules/Effects/` - Effect definitions
2. **Parser**: `scripts/parse-perks.ts`
   - Reads markdown files
   - Generates `public/data/perks.json`
   - Run with: `npx tsx scripts/parse-perks.ts`
3. **Runtime**: App loads from `public/data/perks.json`
   - Cached in localStorage (7-day cache)
   - Background GitHub fetch (not fully implemented)

### Attribute Bar Updates
- **CharacterHeader** calculates CP totals directly from `progressionLog` on every render
- NO useMemo - ensures updates propagate immediately
- All perk types (combat, magic, social) contribute to attribute CP
- `stagedPerk` entries also count (except when used for conditioning)

### Known Issues
- None currently - system is up to date with MS5 rules