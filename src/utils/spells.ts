import {
  Character,
  KnownSpell,
  Spell,
  SpellTier,
  SpellType
} from '@/types/character';
import { SPELLS, SPELL_XP_COSTS, SPELLCRAFT_XP_REQUIREMENTS, SPELL_UPGRADES } from '@/data/spells';

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
        usedLimit += spellData.limitCost;
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
 */
export const getSpellData = (spell: KnownSpell): Spell | null => {
  if (spell.isCustom && spell.customSpellData) {
    // Return custom spell data as a Spell object
    return {
      tier: spell.customSpellData.tier,
      type: spell.customSpellData.type,
      apCost: spell.customSpellData.apCost,
      attributes: spell.customSpellData.attributes,
      limitCost: spell.customSpellData.limitCost,
      traits: spell.customSpellData.traits,
      effect: spell.customSpellData.effect,
      distance: spell.customSpellData.distance,
      duration: spell.customSpellData.duration,
      damage: spell.customSpellData.damage
    };
  }

  if (spell.dataRef && SPELLS[spell.dataRef]) {
    return SPELLS[spell.dataRef];
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

  // Tier 0 spells require Mage perk (check both perks and magicPerks arrays)
  if (tier === 0) {
    const hasMagePerk = character.perks.some(p => p.name === 'Mage') ||
                        (character.magicPerks || []).some(p => p.name === 'Mage');
    return hasMagePerk && spellcraft >= tier;
  }

  return spellcraft >= tier;
};

/**
 * Get the XP cost for learning a spell
 */
export const getSpellXPCost = (tier: SpellTier, type: SpellType): number => {
  return SPELL_XP_COSTS[tier][type];
};

/**
 * Get XP required to reach a specific spellcraft level
 */
export const getSpellcraftXPRequirement = (level: number): number => {
  return SPELLCRAFT_XP_REQUIREMENTS[level] || 0;
};

/**
 * Calculate total XP spent on Spell domain from progression log
 */
export const calculateSpellDomainXP = (character: Character): number => {
  return character.progressionLog
    .filter(entry => entry.type === 'combatPerk' && entry.domain === 'Spell')
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
 * Get spellcraft level for a character
 */
export const getSpellcraft = (character: Character): number => {
  return character.weaponDomains['Spell'] || 0;
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

  if (spellData.limitCost === 0) {
    return { success: false, character, reason: 'This spell has no Limit cost and cannot be attuned' };
  }

  const attunedSpells = character.attunedSpells || [];
  if (attunedSpells.includes(spellId)) {
    return { success: false, character, reason: 'Spell already attuned' };
  }

  const currentLimit = calculateCurrentLimit(character);
  if (spellData.limitCost > currentLimit) {
    return {
      success: false,
      character,
      reason: `Not enough Limit. Need ${spellData.limitCost}, have ${currentLimit} remaining.`
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

  if (!spell.dataRef || !SPELLS[spell.dataRef]) {
    return spell;
  }

  const spellData = SPELLS[spell.dataRef];

  return {
    ...spell,
    isCustom: true,
    dataRef: undefined,
    customSpellData: {
      tier: spellData.tier,
      type: spellData.type,
      apCost: spellData.apCost,
      attributes: spellData.attributes,
      limitCost: spellData.limitCost,
      traits: [...spellData.traits],
      effect: spellData.effect,
      distance: spellData.distance,
      duration: spellData.duration,
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
 * Check if a spell can be upgraded to advanced
 * Returns true if the spell is currently basic and has an advanced version available
 */
export const canUpgradeSpell = (spell: KnownSpell): boolean => {
  if (spell.type !== 'basic') return false;
  if (spell.isCustom) return false; // Custom spells can't be auto-upgraded
  if (!spell.dataRef) return false;
  return spell.dataRef in SPELL_UPGRADES;
};

/**
 * Get the XP cost to upgrade a spell from basic to advanced
 */
export const getUpgradeCost = (spell: KnownSpell): number => {
  const advancedCost = SPELL_XP_COSTS[spell.tier].advanced;
  const basicCost = spell.xpCost; // What was already paid
  return advancedCost - basicCost;
};

/**
 * Upgrade a spell from basic to advanced
 * Returns updated character with upgraded spell and XP deducted
 */
export const upgradeSpellToAdvanced = (
  character: Character,
  spellId: string,
  xpType: 'combat' | 'social'
): { success: boolean; character: Character; reason?: string } => {
  if (!character.knownSpells) {
    return { success: false, character, reason: 'No known spells' };
  }

  const spell = character.knownSpells.find(s => s.id === spellId);
  if (!spell) {
    return { success: false, character, reason: 'Spell not found' };
  }

  if (!canUpgradeSpell(spell)) {
    return { success: false, character, reason: 'This spell cannot be upgraded' };
  }

  const upgradeCost = getUpgradeCost(spell);
  const availableXP = xpType === 'combat' ? character.combatXP : character.socialXP;

  if (availableXP < upgradeCost) {
    return {
      success: false,
      character,
      reason: `Not enough ${xpType === 'combat' ? 'Combat' : 'Social'} XP. Need ${upgradeCost}, have ${availableXP}`
    };
  }

  // Get upgrade data
  const upgradeData = SPELL_UPGRADES[spell.dataRef!];
  const originalSpellData = SPELLS[spell.dataRef!];

  // Create upgraded custom spell data
  const upgradedSpell: KnownSpell = {
    ...spell,
    type: 'advanced',
    xpCost: spell.xpCost + upgradeCost,
    isCustom: true, // Convert to custom since we're modifying it
    dataRef: undefined,
    customSpellData: {
      tier: originalSpellData.tier,
      type: 'advanced',
      apCost: upgradeData.apCost || originalSpellData.apCost,
      attributes: upgradeData.attributes || originalSpellData.attributes,
      limitCost: upgradeData.limitCost !== undefined ? upgradeData.limitCost : originalSpellData.limitCost,
      traits: upgradeData.traits || originalSpellData.traits,
      effect: upgradeData.effect || originalSpellData.effect,
      distance: upgradeData.distance || originalSpellData.distance,
      duration: upgradeData.duration || originalSpellData.duration,
      damage: upgradeData.damage || originalSpellData.damage
    }
  };

  // Update character
  const updatedCharacter = {
    ...character,
    knownSpells: character.knownSpells.map(s => s.id === spellId ? upgradedSpell : s)
  };

  // Deduct XP
  if (xpType === 'combat') {
    updatedCharacter.combatXP -= upgradeCost;
  } else {
    updatedCharacter.socialXP -= upgradeCost;
  }

  // Add to progression log
  updatedCharacter.progressionLog = [
    ...updatedCharacter.progressionLog,
    {
      type: 'spell',
      name: `${spell.name} (Upgrade)`,
      tier: spell.tier,
      spellType: 'advanced',
      cost: upgradeCost,
      xpType
    }
  ];

  return { success: true, character: updatedCharacter };
};
