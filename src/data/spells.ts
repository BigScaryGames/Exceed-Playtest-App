import { Spell } from '@/types/character';

// Spell database from EXCEED Magic System
// Spells organized by tier and alphabetically

export const SPELLS: Record<string, Spell> = {
  // === TIER 0 SPELLS ===
  'Arcane Armor': {
    tier: 0,
    type: 'basic',
    apCost: '-',
    attributes: 'EN/WT',
    limitCost: 1,
    traits: ['Spell', 'Boon', 'Protection', 'Conjuration'],
    effect: 'Summon a light magical armor on self',
    distance: 'Self',
    duration: 'Persistent'
  },

  'Darkvision': {
    tier: 0,
    type: 'basic',
    apCost: '-',
    attributes: 'PR/WT',
    limitCost: 1,
    traits: ['Spell', 'Boon', 'Scrying'],
    effect: 'Grant darkvision to self (60ft in darkness)',
    distance: 'Self',
    duration: 'Persistent'
  },

  'Detect Magic': {
    tier: 0,
    type: 'basic',
    apCost: '3',
    attributes: 'WT/PR',
    limitCost: 1,
    traits: ['Spell', 'Scrying'],
    effect: 'Sense magical auras and enchantments within range',
    distance: '10m',
    duration: '10 minutes'
  },

  'Endure Elements': {
    tier: 0,
    type: 'basic',
    apCost: '3',
    attributes: 'EN/WI',
    limitCost: 1,
    traits: ['Spell', 'Boon', 'Protection', 'Enhancement'],
    effect: 'Resist environmental extremes (heat, cold)',
    distance: 'Touch',
    duration: 'Persistent'
  },

  'Featherfall': {
    tier: 0,
    type: 'basic',
    apCost: 'R',
    attributes: 'EN/DX',
    limitCost: 0,
    traits: ['Spell', 'Boon', 'Protection'],
    effect: 'Negate falling damage on 1 target',
    distance: '10m',
    duration: '1 minute'
  },

  'Ghost Sound': {
    tier: 0,
    type: 'basic',
    apCost: '2',
    attributes: 'WT/CH',
    limitCost: 0,
    traits: ['Spell', 'Illusion'],
    effect: 'Create illusory sounds at a location',
    distance: '10m',
    duration: '1 minute'
  },

  'Light': {
    tier: 0,
    type: 'basic',
    apCost: '2',
    attributes: 'WT/PR',
    limitCost: 1,
    traits: ['Spell', 'Boon'],
    effect: 'Create small lamp level illumination around yourself',
    distance: 'Self',
    duration: 'Persistent'
  },

  'Light Backpack': {
    tier: 0,
    type: 'basic',
    apCost: '-',
    attributes: 'MG/WT',
    limitCost: 1,
    traits: ['Spell', 'Boon', 'Manipulation', 'Equipment'],
    effect: 'Reduce the weight you carry in your backpack by half',
    distance: 'Self',
    duration: 'Persistent'
  },

  'Light Feet': {
    tier: 0,
    type: 'basic',
    apCost: '-',
    attributes: 'AG/WT',
    limitCost: 1,
    traits: ['Spell', 'Boon'],
    effect: 'Ignore difficult terrain while traveling',
    distance: 'Self',
    duration: 'Persistent'
  },

  'Loud Mouth': {
    tier: 0,
    type: 'basic',
    apCost: '2',
    attributes: 'CH/WT',
    limitCost: 0,
    traits: ['Spell', 'Boon', 'Illusion'],
    effect: 'Amplify your voice significantly',
    distance: 'Self',
    duration: '10 minutes'
  },

  'Message': {
    tier: 0,
    type: 'basic',
    apCost: '2',
    attributes: 'WT/CH',
    limitCost: 0,
    traits: ['Spell', 'Illusion'],
    effect: 'Create a telepathic communication with one target',
    distance: '30m',
    duration: '1 minute'
  },

  'Minor Disruption': {
    tier: 0,
    type: 'basic',
    apCost: '5',
    attributes: 'WT/WI',
    limitCost: 0,
    traits: ['Spell', 'Bane'],
    effect: 'Disrupt a duration spell within range',
    distance: '10m',
    duration: 'Instant'
  },

  'Minor Elemental Manipulation': {
    tier: 0,
    type: 'basic',
    apCost: '3',
    attributes: 'WT/DX',
    limitCost: 0,
    traits: ['Spell', 'Manipulation', 'Offensive', 'Projectile'],
    effect: 'Produce or manipulate small amounts of elements',
    distance: '5m',
    duration: 'Instant',
    damage: '1d'
  },

  'Minor Telekinesis': {
    tier: 0,
    type: 'basic',
    apCost: '2',
    attributes: 'WT/DX',
    limitCost: 0,
    traits: ['Spell', 'Manipulation'],
    effect: 'Telekinetic manipulation of small objects (up to 1kg)',
    distance: '10m',
    duration: '1 minute'
  },

  'Phantom Tools': {
    tier: 0,
    type: 'basic',
    apCost: '3',
    attributes: 'WT/DX',
    limitCost: 0,
    traits: ['Spell', 'Conjuration'],
    effect: 'Create phantom tools for a skill you have',
    distance: 'Touch',
    duration: '10 minutes'
  },

  'Prestidigitation': {
    tier: 0,
    type: 'basic',
    apCost: '2',
    attributes: 'WT/DX',
    limitCost: 0,
    traits: ['Spell', 'Manipulation'],
    effect: 'Minor magical effects for cleaning, flavoring, and coloring',
    distance: '3m',
    duration: '1 hour'
  },

  'Resistance': {
    tier: 0,
    type: 'basic',
    apCost: '3',
    attributes: 'EN/WT',
    limitCost: 1,
    traits: ['Spell', 'Boon', 'Protection'],
    effect: 'Minor protection from one damage type (+2 to Endure)',
    distance: 'Touch',
    duration: 'Persistent'
  },

  'Sad Violin': {
    tier: 0,
    type: 'basic',
    apCost: 'R',
    attributes: 'CH/WT',
    limitCost: 0,
    traits: ['Spell', 'Illusion'],
    effect: 'Play ambient musical composition for the scene',
    distance: 'Self',
    duration: '1 minute'
  },

  'Stabilize': {
    tier: 0,
    type: 'basic',
    apCost: '5',
    attributes: 'WI/WT',
    limitCost: 0,
    traits: ['Spell', 'Healing'],
    effect: 'Conduct magical first aid, stabilize dying creature',
    distance: 'Touch',
    duration: 'Instant'
  },

  'Wish-em Good Luck': {
    tier: 0,
    type: 'basic',
    apCost: '2',
    attributes: 'WI/CH',
    limitCost: 0,
    traits: ['Spell', 'Boon', 'Luck'],
    effect: 'Give advantage to an ally on their next roll',
    distance: '10m',
    duration: '1 roll'
  },

  // === TIER 1 SPELLS ===
  'Alarming Wards': {
    tier: 1,
    type: 'basic',
    apCost: '1m',
    attributes: 'PR/WT',
    limitCost: 0,
    traits: ['Spell', 'Ward', 'Scrying'],
    effect: 'Cover small area (10m radius) with a movement detection spell',
    distance: 'Touch',
    duration: '8 hours'
  },

  'Alter Shape': {
    tier: 1,
    type: 'basic',
    apCost: '1m',
    attributes: 'DX/WT',
    limitCost: 1,
    traits: ['Spell', 'Boon', 'Transformation', 'Illusion'],
    effect: 'Adjust facial features and body shape to impersonate others',
    distance: 'Self',
    duration: 'Persistent'
  },

  'Animate Appliance': {
    tier: 1,
    type: 'basic',
    apCost: '-',
    attributes: 'WT/DX',
    limitCost: 1,
    traits: ['Spell', 'Manipulation'],
    effect: 'Animate household appliances to do simple menial labor',
    distance: 'Touch',
    duration: 'Persistent'
  },

  'Aura of Speed': {
    tier: 1,
    type: 'advanced',
    apCost: '-',
    attributes: 'AG/WT',
    limitCost: 1,
    traits: ['Spell', 'Boon', 'Enhancement'],
    effect: 'Increase team movement speed by 2',
    distance: 'Team',
    duration: 'Persistent'
  },

  'Bestial Arms': {
    tier: 1,
    type: 'basic',
    apCost: '-',
    attributes: 'MG/WT',
    limitCost: 1,
    traits: ['Spell', 'Boon', 'Transformation'],
    effect: 'Grow claws (1d6 damage) and defensive arm covering (+1 armor)',
    distance: 'Self',
    duration: 'Persistent'
  },

  'Binding Chains': {
    tier: 1,
    type: 'basic',
    apCost: '5',
    attributes: 'MG/WT',
    limitCost: 0,
    traits: ['Spell', 'Conjuration', 'Bane', 'Strike'],
    effect: 'Bind target with magical chains, restraining movement on hit',
    distance: '10m',
    duration: 'Until broken',
    damage: 'Spellcraft * 2d'
  },

  'Elemental Strike': {
    tier: 1,
    type: 'basic',
    apCost: '2',
    attributes: 'AG/WT',
    limitCost: 0,
    traits: ['Spell', 'Offensive', 'Strike'],
    effect: 'Attack a target with chosen elemental damage',
    distance: '3m',
    duration: 'Instant',
    damage: 'Spellcraft * 4d'
  },

  'Empower Weapons': {
    tier: 1,
    type: 'basic',
    apCost: '-',
    attributes: 'MG/WT',
    limitCost: 1,
    traits: ['Spell', 'Boon', 'Equipment'],
    effect: 'Empower weapons with magic for +1d6 damage',
    distance: 'Self',
    duration: 'Persistent'
  },

  'Healing Aura': {
    tier: 1,
    type: 'advanced',
    apCost: '-',
    attributes: 'WI/WT',
    limitCost: 2,
    traits: ['Spell', 'Boon', 'Healing'],
    effect: 'Heal Spellcraft HP per hour to your team',
    distance: 'Team',
    duration: 'Persistent'
  },

  'Levitation': {
    tier: 1,
    type: 'basic',
    apCost: '-',
    attributes: 'WT/DX',
    limitCost: 3,
    traits: ['Spell', 'Manipulation'],
    effect: 'Levitate targets to move them through the air at walking speed',
    distance: 'Touch',
    duration: 'Persistent'
  },

  'Minor Curse': {
    tier: 1,
    type: 'basic',
    apCost: '5',
    attributes: 'WI/WT',
    limitCost: 0,
    traits: ['Spell', 'Bane', 'Body'],
    effect: 'Place minor inconvenient curses on enemies (-2 to chosen roll type)',
    distance: '10m',
    duration: '1 hour'
  },

  'Obscure': {
    tier: 1,
    type: 'basic',
    apCost: '3',
    attributes: 'WT/PR',
    limitCost: 3,
    traits: ['Spell', 'Boon', 'Illusion'],
    effect: 'Make yourself less noticeable from distance',
    distance: 'Self',
    duration: 'Persistent'
  },

  'Simple Barrier': {
    tier: 1,
    type: 'basic',
    apCost: '4',
    attributes: 'WT/MG',
    limitCost: 0,
    traits: ['Spell', 'Conjuration', 'Protection'],
    effect: 'Place magical barriers to block or bridge (3m x 3m)',
    distance: '5m',
    duration: '10 minutes'
  },

  'Summon Weapon': {
    tier: 1,
    type: 'basic',
    apCost: '1',
    attributes: 'AG/WT',
    limitCost: 0,
    traits: ['Spell', 'Conjuration'],
    effect: 'Summon an ephemeral weapon (your choice, 1d8 damage)',
    distance: 'Self',
    duration: '1 minute'
  },

  'Telekinetic Maneuver': {
    tier: 1,
    type: 'basic',
    apCost: '3',
    attributes: 'MG/WT',
    limitCost: 0,
    traits: ['Spell', 'Manipulation', 'Offensive', 'Strike'],
    effect: 'Push, pull, or trip targets telekinetically',
    distance: '10m',
    duration: 'Instant',
    damage: 'Spellcraft * 2d'
  }
};

// XP costs for learning spells by tier and type
export const SPELL_XP_COSTS: Record<number, { basic: number; advanced: number }> = {
  0: { basic: 1, advanced: 3 },
  1: { basic: 3, advanced: 5 },
  2: { basic: 5, advanced: 7 },
  3: { basic: 7, advanced: 10 },
  4: { basic: 10, advanced: 15 },
  5: { basic: 15, advanced: 25 }
};

// Spellcraft progression XP requirements (follows attribute pricing)
export const SPELLCRAFT_XP_REQUIREMENTS: Record<number, number> = {
  0: 0,    // Starting level
  1: 5,    // 5 XP to reach level 1
  2: 15,   // +10 XP (total 15)
  3: 30,   // +15 XP (total 30)
  4: 50,   // +20 XP (total 50)
  5: 75    // +25 XP (total 75)
};

// Spell upgrade data - defines how basic spells change when upgraded to advanced
// Based on EXCEED rules: Advanced versions typically make spells team-wide and/or reduce limit cost
export const SPELL_UPGRADES: Record<string, Partial<Spell>> = {
  'Darkvision': {
    limitCost: 0,
    effect: 'Grant darkvision to entire team (60ft in darkness)',
    distance: 'Team'
  },
  'Endure Elements': {
    limitCost: 0,
    effect: 'Team resists environmental extremes (heat, cold)',
    distance: 'Team'
  },
  'Featherfall': {
    apCost: '1',
    effect: 'Negate falling damage for entire team',
    distance: 'Team'
  },
  'Light': {
    limitCost: 0,
    effect: 'Create small lamp level illumination around entire party',
    distance: 'Team'
  },
  'Light Backpack': {
    limitCost: 0,
    effect: 'Reduce the weight entire team carries in backpacks by half',
    distance: 'Team'
  },
  'Light Feet': {
    limitCost: 0,
    effect: 'Team ignores difficult terrain while traveling',
    distance: 'Team'
  },
  'Alter Shape': {
    limitCost: 0,
    effect: 'Adjust facial features and body shape of team members to impersonate others',
    distance: 'Team'
  },
  'Empower Weapons': {
    limitCost: 0,
    effect: 'Empower team weapons with magic for +1d6 damage',
    distance: 'Team'
  },
  'Obscure': {
    limitCost: 1,
    effect: 'Make your team less noticeable from distance',
    distance: 'Team'
  }
};
