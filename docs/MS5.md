# MS5 Rules Reference

This document summarizes the key mechanics from MS5 (Milestone 5) of the EXCEED TTRPG system that are implemented in the app.

## Character Creation

### Starting XP
- **Combat XP**: Used for HP (conditioning perks), combat skills, combat perks, Spellcraft perks, and spells
- **Skill XP**: Used for social, knowledge, crafting, wilderness skills, and related perks

### Attribute Progression
- CP thresholds: **10 / 30 / 60 / 100 / 150** → Attribute values **1 / 2 / 3 / 4 / 5**
- 8 Attributes: Might (MG), Endurance (EN), Agility (AG), Dexterity (DX), Wit (WT), Will (WI), Perception (PR), Charisma (CH)

### Skill Costs
- Level 1: 2 CP
- Level 2: 4 CP (6 total)
- Level 3: 6 CP (12 total)
- Level 4: 8 CP (20 total)
- Level 5: 10 CP (30 total)

### Domain Progression
- **Martial Domain**: 10/30/60/100/150 (from combat perks)
- **Spellcraft Domain**: 10/30/60/100/150 (from spells and magic perks)

## Combat System

### Action Points
- Base: **5 AP + 1 Reaction** per turn
- (Future: Mental/Physical AP split - not yet implemented)

### Defenses
Four main defensive options:

| Defense | Formula | Valid Against |
|---------|---------|---------------|
| **Parry** | Martial + Agility/Dexterity | #Strike, #Projectile (with perks) |
| **Block** | Shield Domain + Agility/Endurance/Might | #Strike, #Projectile |
| **Dodge** | Agility + Perception | #Strike, #Projectile, #Burst |
| **Endure** | Endurance + Will | #Mind, #Body |

### Attack Traits
- **#Strike**: Can be parried, blocked, dodged
- **#Projectile**: Can be blocked, dodged (parry with perks)
- **#Burst**: Can be dodged (block/parry with perks)
- **#Mind**: Endure only
- **#Body**: Endure only

### Damage
- Critical hits count as **double damage** (placeholder rule)

## HP System

### Max Wounds
- **Base**: 2 Max Wounds
- **+1** for each completed conditioning perk (all 5 stages done)
- Formula: `2 + completed_conditioning_perks`

### HP Pools
- **Stamina** = (Armor + Endurance) × Max Wounds
- **Health** = (HP Per Wound × Max Wounds) + Extra HP
- Starting: 2 Max Wounds, 5 HP Per Wound

### Extra HP (Staged Perks)
- Conditioning perks are 5-stage perks
- Cost: `Max_Wounds × level` XP per stage
- Stages 1-4: +1 HP each
- Stage 5: +1 Max Wounds + capstone effect

## Magic System

### Core Principles
- Magic can only be cast by those with the **Mage** perk
- **#Attuned** magic: Uses Limit system, persistent, no actions to maintain
- **Active spells**: Require casting check, consume AP

### Casting Check
- Formula: `Spellcraft + Wit + Bonuses` vs DC `[8 + Tier × 2]`
- No spell resource (no mana, etc.)

### Limit System
- **Limit** = `3 + Will + Spellcraft`
- Tracks capacity for persistent magical/supernatural effects
- Everything with `Limit[N]` trait counts against Limit
- #Attuned spells are persistent outside combat

### Spellcraft Progression
- Thresholds: 10/20/30/40/50 CP
- Gained by learning spells (gated by skills)

### Spell Tiers
- Tier 0: Basic spells (available with Mage perk)
- Tier 1-5: Higher-tier spells with increasing DC

## Perks System

### Ability/Effect System (MS5)
- **Abilities** = Active/usable effects (shown in Abilities tab)
- **Effects** = Passive/always-on effects (auto-applied when perk owned)
- Perks embed `![[Ability - X]]` or `![[Effect - X]]` references

### Conditioning Perks
- 5-level staged perks with #Conditioning tag
- Examples: Poison Resistance, Waterfall Training, Mental Resilience, etc.
- Each stage costs `Max_Wounds × level` XP
- Only ONE conditioning perk can be active at a time
- Completion grants +1 Max Wounds

### Perk Costs
- Based on tier and category (cheap/average/expensive)
- Variable costs for conditioning perks

### Perk Requirements
- **Tier**: Martial/Spellcraft domain level required
- **Skills**: Specific skill levels
- **Perks**: Prerequisite perks
- **Special**: GM permission, etc.

## Equipment

### Encumbrance
- **Capacity** = (5 + EN + MG)²
- Penalties based on percentage of capacity:
  - None: < 50%
  - Light: 50-100%
  - Encumbered: 100-150%
  - Heavy: 150-200%
  - Over-Encumbered: 200%+

### Armor
- Has Might requirement
- Penalty applied if requirement not met
- Bonus to Stamina calculation

### Shields
- Types: Light (Agility), Medium (Endurance), Heavy (Might)
- Defense bonus to Block

## Organization & Rank (Future)

- **Rank**: Formal standing in organizations
- 5 levels with titles (Initiate → Commander)
- No XP cost - earned through service, exams, or purchase
- Provides access to Downtime Quality levels
