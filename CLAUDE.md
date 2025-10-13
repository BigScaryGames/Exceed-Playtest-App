# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`exceed-app-react` is a React + TypeScript web application for managing character sheets for the **EXCEED** tabletop RPG system. The app features a mobile-first design with comprehensive character management, XP tracking, skill progression, combat statistics, and equipment management.

### Game Rules Reference

The official EXCEED ruleset is available in `docs/rules/` (symlinked to `/home/rvh/Obsidian/ExceedV/Ruleset/`). Key mechanics are documented in `docs/README.md` for quick reference during development.

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

### Attributes & Progression
- **8 Attributes**: Might (MG), Endurance (EN), Agility (AG), Dexterity (DX), Wit (WT), Will (WI), Perception (PR), Charisma (CH)
- **CP Thresholds**: 10/30/60/100/150 → Attribute values 1-5
- **Dual XP Pools**: Combat XP and Social XP
- **Progression Log**: Complete audit trail of all XP expenditures

### Skills System
- 33 learnable skills across 7 categories
- Skill levels 1-5 (cost = level × 2 CP)
- Attribute selection per level from paired attributes
- Custom perks with name, cost, attribute, description

### Combat System
- **HP System**: Stamina + Health with draggable UI
- **Wounds**: Base wounds + extra wounds (from 5 Extra HP purchases)
- **Weapon Domains**: 1H, 2H, SaS (Staves/Spears), Sh (Shield), Ar (Archery)
- **Domain Levels**: 0-5 based on Combat Perk CP (5/15/30/50/75)
- **Combat Perks**: Tied to weapon domains, affects parry and attack
- **Defense Stats**: Parry, Dodge, Block, Endure (auto-calculated)
- **Armor**: 9 types with Might requirements and penalties

### Equipment System
- Primary/secondary weapons + shield
- Armor with stat requirements
- **Encumbrance**: Capacity = (5 + EN + MG)², with 5 penalty levels
- Custom item inventory with weight/quantity tracking

## Key Utilities

### `calculations.ts`
- `calculateAttributeValues()`: Converts progression log to attribute stats
- `calculateWeaponDomains()`: Calculates domain levels from combat perks
- `calculateHP()`: HP, stamina, health calculations
- `calculateArmorPenalty()`: Armor penalty based on Might requirement
- `calculateSpeed()`, `calculateParry()`, `calculateDodge()`, `calculateEndure()`: Combat stat calculations
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

#### Buying Extra HP
1. User clicks "Buy Extra HP" in CombatTab
2. AttributeSelector prompts for attribute choice
3. Cost equals current `maxWounds` CP
4. Updates: increments `extraHP`, increments `extraHPCount`, deducts combat XP
5. When `extraHPCount` reaches 5: resets to 0, increments `maxWounds`, increments `extraWoundCount`

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