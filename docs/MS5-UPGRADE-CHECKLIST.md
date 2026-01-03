# MS5 Upgrade Checklist

Tracking changes needed to update the app from MS4 to MS5 ruleset.

wait---

## 1. Ability/Effect System (HIGHEST PRIORITY)

**Current State:** Perks have inline descriptions
**Target State:** Perks embed `![[Ability - X]]` or `![[Effect - X]]` references

This is the core architectural change:
- **Abilities** = Active/usable (show in new Abilities tab)
- **Effects** = Passive/always-on (auto-applied when perk owned)

### 1.1 New "Abilities" Tab

Current tabs: `skills | combat | equipment | magic | list`
New tabs: `skills | combat | equipment | magic | abilities | list`

- [ ] `src/components/CharacterSheet.tsx`
  - [ ] Add `'abilities'` to `TabType` union
  - [ ] Add to `tabs` array
  - [ ] Add tab button in navigation

- [ ] `src/components/tabs/AbilitiesTab.tsx` (NEW FILE)
  - [ ] Display all abilities granted by character's perks
  - [ ] Show ability name, AP cost, description, source perk
  - [ ] Group by source or category
  - [ ] Only active/usable abilities (not passive effects)

### 1.2 Auto-Apply Effects

Effects are passive - automatically tracked when perk is owned.

- [ ] `src/types/character.ts`
  - [ ] Add `activeEffects?: CharacterEffect[]` (derived, not stored)
  - [ ] Define `CharacterEffect` interface:
    ```typescript
    interface CharacterEffect {
      name: string;
      source: string;  // perk that grants it
      description: string;
    }
    ```

- [ ] `src/utils/effectCalculator.ts` (NEW FILE)
  - [ ] `getActiveEffects(character)` - collect all effects from owned perks
  - [ ] Effects auto-apply when perk is purchased

- [ ] UI: Show active effects (header? combat tab? dedicated section?)

### 1.3 Perk Parser for Embeds

- [ ] `src/utils/perkParser.ts` (NEW FILE)
  - [ ] Parse `![[Ability - X]]` embeds → resolve from `/Abilities/` folder
  - [ ] Parse `![[Effect - X]]` embeds → resolve from `/Effects/` folder
  - [ ] Return structured data with abilities and effects separated

- [ ] `src/types/perks.ts`
  - [ ] Add to perk types:
    ```typescript
    abilities?: string[];   // names of abilities granted
    effects?: string[];     // names of effects granted
    ```

### 1.4 Ability/Effect Data Loading

- [ ] `src/data/abilities.ts` (NEW FILE or loaded from rules)
  - [ ] Load/parse all `Ability - *.md` files
  - [ ] Store as lookup map

- [ ] `src/data/effects.ts` (NEW FILE or loaded from rules)
  - [ ] Load/parse all `Effect - *.md` files
  - [ ] Store as lookup map

---

## 2. Staged Perks / Conditioning Perks

**Current State:** Generic "Extra HP" purchase system
**Target State:** Perks bought in stages (levels 1-5)

**Key insight:** Conditioning perks are just perks with 5 purchasable stages. The list will grow - not limited to 7. Core logic is buying a perk in stages.

### 2.1 Core Staged Perk Logic

- [ ] `src/types/character.ts`
  - [ ] Add staged perk tracking:
    ```typescript
    interface StagedPerk {
      id: string;
      name: string;
      currentStage: number;  // 1-5
      maxStage: number;      // usually 5
      stageHistory: { stage: number; attribute: string; cost: number }[];
    }
    ```
  - [ ] Add `stagedPerks?: StagedPerk[]` to Character

- [ ] `src/utils/stagedPerkLogic.ts` (NEW FILE)
  - [ ] `canAdvanceStage(character, perkId)` - check requirements
  - [ ] `advancePerkStage(character, perkId, attribute)` - level up
  - [ ] `getStageCost(perk, stage)` - cost for next stage
  - [ ] `isCompleted(perk)` - all stages purchased

### 2.2 Max Wounds Formula

- [ ] `src/utils/calculations.ts`
  - [ ] `calculateMaxWounds(character)`:
    - Base: 2
    - +1 for each **completed** conditioning perk (all 5 stages done)
  - [ ] Each stage grants Extra HP (same mechanic, per-perk tracking)

### 2.3 UI for Staged Perks

- [ ] `src/components/tabs/CombatTab.tsx`
  - [ ] Replace "Buy Extra HP" with conditioning perk section
  - [ ] Show each conditioning perk with stage progress (1-5 pips)
  - [ ] Button to advance stage

- [ ] `src/components/modals/StagedPerkModal.tsx` (NEW FILE)
  - [ ] Select conditioning perk to purchase/advance
  - [ ] Show requirements, cost, attribute selection
  - [ ] Stage progress indicator

---

## 3. Martial Domains → Single Domain

**Current State:** Multiple weapon domains (`1H`, `2H`, `SaS`, `Sh`, `Ar`, `Spell`)
**Target State:** Single `Martial` domain + `Spellcraft` domain

### Files to Update

- [ ] `src/types/character.ts`
  - [ ] Change `WeaponDomain` type to `'Martial' | 'Spellcraft'`
  - [ ] Simplify `WeaponDomains` interface to just two domains
  - [ ] Remove `domain` from `CombatPerk` (all combat perks → Martial)

- [ ] `src/utils/constants.ts`
  - [ ] Update `DOMAIN_CP_THRESHOLDS` to `[10, 30, 60, 100, 150]` (same for both)

- [ ] `src/utils/calculations.ts`
  - [ ] Rewrite `calculateWeaponDomains()`:
    - Sum ALL combat perks into `Martial`
    - Sum spells + magic perks into `Spellcraft`
  - [ ] Update parry/block calculations to use `Martial` domain

- [ ] `src/components/tabs/CombatTab.tsx`
  - [ ] Show only Martial Domain + Spellcraft levels
  - [ ] Remove per-weapon domain display

- [ ] `src/components/modals/CombatPerkModal.tsx`
  - [ ] Remove domain dropdown (no longer per-perk)

---

## 4. Weapon Training (Just Perks)

Weapon training categories are just perks in the database - no special system needed.

- [ ] Ensure perk database includes training perks from `/Perks/CombatPerks/WeaponTraining/`
- [ ] Each is 5 XP, grants proficiency + bonus ability
- [ ] -2 untrained penalty handled in combat calculations (optional)

---

## 5. Perk Requirements Updated

**Current State:** Perks require specific weapon domain level
**Target State:** Perks require Martial Domain level + prerequisite perks

- [ ] `src/types/perks.ts`
  - [ ] Update requirements structure:
    ```typescript
    interface PerkRequirements {
      martialDomain?: number;
      spellcraft?: number;
      perks?: string[];           // prerequisite perks (including training)
      attributes?: Record<string, number>;
    }
    ```

- [ ] `src/utils/perkValidator.ts`
  - [ ] Check martial/spellcraft domain level
  - [ ] Check prerequisite perks are owned
  - [ ] Check attribute requirements

---

## 6. Data Migration

- [ ] `src/utils/migration.ts`
  - [ ] Migrate old `weaponDomains` → sum into `Martial`/`Spellcraft`
  - [ ] Convert old `extraHP` → staged conditioning perks (or flag for review)
  - [ ] Increment migration version

---

## 7. Documentation

- [x] `docs/rules` symlink → `/home/r/Exceed/ExceedV/Ruleset/`
- [ ] `docs/README.md` - Update mechanics summary
- [ ] `CLAUDE.md` - Update dev guidelines

---

## Priority Order

1. **Ability/Effect System** (1) - Core architecture, new Abilities tab, auto-effects
2. **Staged Perks / Conditioning** (2) - New perk progression system
3. **Domain Consolidation** (3) - Simplify to Martial + Spellcraft
4. **Weapon Training** (4) - Just database perks, minimal code
5. **Perk Requirements** (5) - Update validation
6. **Migration** (6) - Handle existing characters
7. **Documentation** (7) - Ongoing

---

## Not Relevant to App

- Downtime Quality Scale (narrative/GM tool)
- Organizations System (WIP for MS8)
- File structure reorganization (handled by symlink)
- Individual perk flavor text (loaded from database)
