import {
  Character,
  KnownSpell,
  Spell,
  SpellTier,
  CustomSpellData,
  Prerequisite,
  SpellPrerequisites
} from '@/types/character';
import { SPELL_XP_COSTS, SPELLCRAFT_XP_REQUIREMENTS, getSpellByName } from '@/data/spells';

/**
 * Get the limit cost from spell data (handles both Spell and CustomSpellData formats)
 */
export const getLimitCost = (spellData: Spell | CustomSpellData): number => {
  if ('limitCost' in spellData && typeof spellData.limitCost === 'number') {
    // Spell object or CustomSpellData
    return spellData.limitCost;
  }
  return 0;
};

/**
 * Calculate the character's total Limit capacity
 * Formula: 3 + Will + Spellcraft
 */
export const calculateLimit = (character: Character): number => {
  const spellcraft = getSpellcraft(character);
  const will = character.stats.WI;
  return 3 + will + spellcraft;
};

/**
 * Calculate current remaining limit (after attuned spells)
 */
export const calculateCurrentLimit = (character: Character): number => {
  const totalLimit = calculateLimit(character);
  const usedLimit = calculateUsedLimit(character);
  return Math.max(0, totalLimit - usedLimit);
};

/**
 * Calculate total limit used by attuned spells
 */
export const calculateUsedLimit = (character: Character): number => {
  if (!character.knownSpells || !character.attunedSpells) {
    return 0;
  }

  const attunedSpellIds = character.attunedSpells;
  const knownSpells = character.knownSpells;

  let usedLimit = 0;
  for (const spellId of attunedSpellIds) {
    const spell = knownSpells.find(s => s.id === spellId);
    if (spell) {
      const spellData = getSpellData(spell);
      if (spellData) {
        usedLimit += getLimitCost(spellData);
      }
    }
  }

  return usedLimit;
};

/**
 * Calculate the Casting Check DC for a spell
 * Formula: 8 + Tier * 2
 */
export const calculateCastingDC = (tier: SpellTier): number => {
  return 8 + (tier * 2);
};

/**
 * Get spell data from a KnownSpell (resolves custom or database)
 * Returns CustomSpellData for custom spells, or Spell for database spells
 */
export const getSpellData = (spell: KnownSpell): CustomSpellData | Spell | null => {
  if (spell.isCustom && spell.customSpellData) {
    return spell.customSpellData;
  }

  if (spell.dataRef) {
    return getSpellByName(spell.dataRef) || null;
  }

  return null;
};

/**
 * Get the full format Spell data from a KnownSpell
 * Use this when you need access to full spell data (e.g., for prerequisite checking)
 */
export const getFullSpellData = (spell: KnownSpell): Spell | null => {
  if (spell.isCustom) {
    return null; // Custom spells don't have the full format
  }

  if (spell.dataRef) {
    return getSpellByName(spell.dataRef) || null;
  }

  return null;
};

/**
 * Check if character can learn a spell of the given tier
 * Requires spellcraft level >= tier
 * Tier 0 also requires Mage perk
 */
export const canLearnSpell = (character: Character, tier: SpellTier): boolean => {
  const spellcraft = getSpellcraft(character);

  // Tier 0 spells require Mage perk
  if (tier === 0) {
    const hasMagePerk = character.perks.some(p => p.name === 'Mage');
    return hasMagePerk && spellcraft >= tier;
  }

  return spellcraft >= tier;
};

/**
 * Get the XP cost for learning a spell
 */
export const getSpellXPCost = (tier: SpellTier): number => {
  return SPELL_XP_COSTS[tier] || 0;
};

/**
 * Get XP required to reach a specific spellcraft level
 */
export const getSpellcraftXPRequirement = (level: number): number => {
  return SPELLCRAFT_XP_REQUIREMENTS[level] || 0;
};

/**
 * MS5: Calculate total XP spent on Spellcraft domain from progression log
 * Spellcraft XP comes from spells and magic perks
 */
export const calculateSpellDomainXP = (character: Character): number => {
  return character.progressionLog
    .filter(entry => entry.type === 'spell' || (entry.type === 'perk' && entry.xpType === 'skill'))
    .reduce((sum, entry) => sum + entry.cost, 0);
};

/**
 * Calculate current spellcraft level based on Spell domain XP
 * Level 0: Requires Mage perk (0-9 XP)
 * Level 1: 10 XP
 * Level 2: 30 XP
 * Level 3: 60 XP
 * Level 4: 100 XP
 * Level 5: 150 XP
 */
export const calculateSpellcraftLevel = (spellDomainXP: number): number => {
  if (spellDomainXP >= 150) return 5;
  if (spellDomainXP >= 100) return 4;
  if (spellDomainXP >= 60) return 3;
  if (spellDomainXP >= 30) return 2;
  if (spellDomainXP >= 10) return 1;
  return 0; // Requires Mage perk for Tier 0 access
};

/**
 * MS5: Get spellcraft level for a character
 */
export const getSpellcraft = (character: Character): number => {
  return character.weaponDomains.Spellcraft || 0;
};

/**
 * Add a spell to character's known spells
 * XP deduction should be handled by the caller
 */
export const addSpellToKnown = (
  character: Character,
  spell: KnownSpell
): Character => {
  const knownSpells = character.knownSpells || [];

  return {
    ...character,
    knownSpells: [...knownSpells, spell]
  };
};

/**
 * Remove a spell from character's known spells
 * Removes from attuned list if present
 * XP refund should be handled by the caller
 */
export const removeSpellFromKnown = (
  character: Character,
  spellId: string
): Character => {
  if (!character.knownSpells) return character;

  const knownSpells = character.knownSpells.filter(s => s.id !== spellId);
  const attunedSpells = (character.attunedSpells || []).filter(id => id !== spellId);

  return {
    ...character,
    knownSpells,
    attunedSpells
  };
};

/**
 * Attune a spell (add to attuned list if limit allows)
 */
export const attuneSpell = (
  character: Character,
  spellId: string
): { success: boolean; character: Character; reason?: string } => {
  if (!character.knownSpells) {
    return { success: false, character, reason: 'No known spells' };
  }

  const spell = character.knownSpells.find(s => s.id === spellId);
  if (!spell) {
    return { success: false, character, reason: 'Spell not found' };
  }

  const spellData = getSpellData(spell);
  if (!spellData) {
    return { success: false, character, reason: 'Spell data not found' };
  }

  const limitCost = getLimitCost(spellData);
  if (limitCost === 0) {
    return { success: false, character, reason: 'This spell has no Limit cost and cannot be attuned' };
  }

  const attunedSpells = character.attunedSpells || [];
  if (attunedSpells.includes(spellId)) {
    return { success: false, character, reason: 'Spell already attuned' };
  }

  const currentLimit = calculateCurrentLimit(character);
  if (limitCost > currentLimit) {
    return {
      success: false,
      character,
      reason: `Not enough Limit. Need ${limitCost}, have ${currentLimit} remaining.`
    };
  }

  return {
    success: true,
    character: {
      ...character,
      attunedSpells: [...attunedSpells, spellId]
    }
  };
};

/**
 * Unattune a spell (remove from attuned list)
 */
export const unattuneSpell = (
  character: Character,
  spellId: string
): Character => {
  if (!character.attunedSpells) return character;

  return {
    ...character,
    attunedSpells: character.attunedSpells.filter(id => id !== spellId)
  };
};

/**
 * Generate unique ID for spells
 */
export const generateSpellId = (): string => {
  return `spell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Convert a database spell to a custom spell
 */
export const convertToCustomSpell = (spell: KnownSpell): KnownSpell => {
  if (spell.isCustom) {
    return spell;
  }

  if (!spell.dataRef) {
    return spell;
  }

  const spellData = getSpellByName(spell.dataRef);
  if (!spellData) {
    return spell;
  }

  const limitCost = typeof spellData.limitCost === 'number' ? spellData.limitCost : 0;

  return {
    ...spell,
    isCustom: true,
    dataRef: undefined,
    customSpellData: {
      tier: spellData.tier,
      apCost: spellData.apCost,
      attributes: spellData.attributes,
      limitCost,
      traits: [...spellData.traits],
      effect: spellData.effect,
      distance: spellData.distance || '-',
      duration: spellData.duration || '-',
      damage: spellData.damage
    }
  };
};

/**
 * Update a spell in character's known spells
 */
export const updateSpellInKnown = (
  character: Character,
  spellId: string,
  updates: Partial<KnownSpell>
): Character => {
  if (!character.knownSpells) return character;

  return {
    ...character,
    knownSpells: character.knownSpells.map(spell =>
      spell.id === spellId ? { ...spell, ...updates } : spell
    )
  };
};

/**
 * Get spells grouped by tier
 */
export const getSpellsByTier = (character: Character): Map<SpellTier, KnownSpell[]> => {
  const spellsByTier = new Map<SpellTier, KnownSpell[]>();

  if (!character.knownSpells) return spellsByTier;

  for (let tier = 0; tier <= 5; tier++) {
    spellsByTier.set(tier as SpellTier, []);
  }

  for (const spell of character.knownSpells) {
    const existing = spellsByTier.get(spell.tier) || [];
    spellsByTier.set(spell.tier, [...existing, spell]);
  }

  return spellsByTier;
};

/**
 * Check if a character meets a single prerequisite
 */
function meetsPrerequisite(character: Character, prereq: Prerequisite): boolean {
  switch (prereq.type) {
    case 'spell': {
      // Check if character knows the required spell
      return character.knownSpells?.some(spell => {
        if (prereq.id) {
          // Check by dataRef (database reference)
          return spell.dataRef === prereq.id || spell.dataRef === prereq.name;
        }
        if (prereq.name) {
          // Check by name
          return spell.name === prereq.name;
        }
        return false;
      }) || false;
    }

    case 'perk': {
      // Check if character has the required perk
      return character.perks?.some(perk => {
        if (prereq.id) {
          return perk.perkId === prereq.id || perk.perkId === prereq.name;
        }
        if (prereq.name) {
          return perk.name === prereq.name;
        }
        return false;
      }) || false;
    }

    case 'skill': {
      // Check if character has the required skill at sufficient level
      if (!prereq.skillName || prereq.minLevel === undefined) return false;
      const skill = character.skills.find(s => s.name === prereq.skillName);
      return skill ? skill.level >= prereq.minLevel : false;
    }

    case 'attribute': {
      // Check if character meets the attribute requirement
      if (!prereq.attribute || prereq.minValue === undefined) return false;
      const attrValue = character.stats[prereq.attribute];
      return attrValue !== undefined ? attrValue >= prereq.minValue : false;
    }

    case 'domain': {
      // Check if character meets the domain level requirement
      if (!prereq.domain || prereq.domainLevel === undefined) return false;
      const domainValue = character.weaponDomains[prereq.domain];
      return domainValue !== undefined ? domainValue >= prereq.domainLevel : false;
    }

    case 'tier': {
      // Check if character meets the minimum spellcraft tier
      if (prereq.minTier === undefined) return false;
      return getSpellcraft(character) >= prereq.minTier;
    }

    default:
      return false;
  }
}

/**
 * Check if a character meets all prerequisites for a spell
 */
export const checkSpellPrerequisites = (
  character: Character,
  spell: Spell | CustomSpellData
): boolean => {
  const prereqs = spell.prerequisites;
  if (!prereqs || prereqs.requirements.length === 0) {
    return true; // No prerequisites means anyone can learn it
  }

  return prereqs.requirements.every(prereq => meetsPrerequisite(character, prereq));
};

/**
 * Get a list of unmet prerequisites as human-readable strings
 */
export const getMissingPrerequisites = (
  character: Character,
  spell: Spell | CustomSpellData
): string[] => {
  const prereqs = spell.prerequisites;
  if (!prereqs || prereqs.requirements.length === 0) {
    return []; // No prerequisites
  }

  const missing: string[] = [];

  for (const prereq of prereqs.requirements) {
    if (meetsPrerequisite(character, prereq)) continue;

    switch (prereq.type) {
      case 'spell':
        missing.push(`Spell: ${prereq.name || prereq.id || 'Unknown'}`);
        break;
      case 'perk':
        missing.push(`Perk: ${prereq.name || prereq.id || 'Unknown'}`);
        break;
      case 'skill':
        missing.push(`Skill: ${prereq.skillName} ${prereq.minLevel || 0}+`);
        break;
      case 'attribute':
        missing.push(`Attribute: ${prereq.attribute} ${prereq.minValue || 0}+`);
        break;
      case 'domain':
        missing.push(`Domain: ${prereq.domain} ${prereq.domainLevel || 0}+`);
        break;
      case 'tier':
        missing.push(`Spellcraft Tier ${prereq.minTier || 0}+`);
        break;
    }
  }

  return missing;
};

/**
 * Get a formatted string of prerequisites for UI display
 */
export const getPrerequisiteText = (prereqs: SpellPrerequisites | undefined): string => {
  if (!prereqs || prereqs.requirements.length === 0) {
    return 'None';
  }

  return prereqs.requirements.map(prereq => {
    switch (prereq.type) {
      case 'spell':
        return prereq.name || prereq.id || 'Unknown Spell';
      case 'perk':
        return prereq.name || prereq.id || 'Unknown Perk';
      case 'skill':
        return `${prereq.skillName} ${prereq.minLevel || 0}+`;
      case 'attribute':
        return `${prereq.attribute} ${prereq.minValue || 0}+`;
      case 'domain':
        return `${prereq.domain} ${prereq.domainLevel || 0}+`;
      case 'tier':
        return `Spellcraft Tier ${prereq.minTier || 0}+`;
      default:
        return 'Unknown Requirement';
    }
  }).join(', ');
};
