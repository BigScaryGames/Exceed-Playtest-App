import { Character, AttributeCode, ProgressionLogEntry, Weapon, WeaponDomains, InventoryItem } from '@/types/character';
import { ARMOR_TYPES } from '@/data/armor';
import { MARTIAL_CP_THRESHOLDS, SPELLCRAFT_CP_THRESHOLDS, ENCUMBRANCE_LEVELS,
  CP_THRESHOLDS
} from './constants';
import {
  getEquippedWeapons,
  getEquippedArmor,
  getEquippedShield,
  getWeaponData,
  getArmorData
} from './inventory';

// Reverse mapping from full name to abbreviation
const ATTRIBUTE_NAME_TO_CODE: Record<string, AttributeCode> = {
  'Might': 'MG',
  'Endurance': 'EN',
  'Agility': 'AG',
  'Dexterity': 'DX',
  'Wit': 'WT',
  'Will': 'WI',
  'Perception': 'PR',
  'Charisma': 'CH'
};

// Calculate attribute values from CP totals in progression log
// Supports negative attributes (-3 to +5) per MS5 rules
export const calculateAttributeValues = (progressionLog: ProgressionLogEntry[]) => {
  const cpTotals = {
    MG: 0, EN: 0, AG: 0, DX: 0,
    WT: 0, WI: 0, PR: 0, CH: 0
  };

  // Sum up all CP spent on each attribute
  // Conditioning perks (stagedPerk) contribute to BOTH Martial domain AND the chosen attribute
  progressionLog.forEach
  (entry => {
    if (entry.attribute)
    {// Map full attribute name to code
      const attrCode = ATTRIBUTE_NAME_TO_CODE[entry.attribute] || entry.attribute;
      if (attrCode in cpTotals) {
        cpTotals[attrCode as AttributeCode] += entry.cost;  // Negative for flaws
      }
    }
  }
  );

  // Convert CP totals to attribute values using thresholds
  // Negative: -30/-20/-10 → -3/-2/-1
  // Zero: 0 → 0
  // Positive: 10/30/60/100/150 → 1/2/3/4/5
  const stats = {
    MG: 0, EN: 0, AG: 0, DX: 0,
    WT: 0, WI: 0, PR: 0, CH: 0
  };

  Object.keys(cpTotals).forEach(attr => {
    const cp = cpTotals[attr as AttributeCode];
    let value = 0;

      // Calculate  attribute value     //-31 and lower =-4, -30 to -21 = -3, -20 to -11 = -2, -10 to -1 = -1.  0-9 = 0, 10-29 = 1, 30-59 = 2, 60-99 = 3, 100-149 = 4, 150+ = 5
      for (let i = 0; i < CP_THRESHOLDS.length; i++) {
        if (cp >= CP_THRESHOLDS[i]) {
          value = i - 3;
        }
      }

    // cp === 0 → value = 0 (already initialized)

    stats[attr as AttributeCode] = value;
  });

  return stats;
};

// MS5: Calculate weapon domain levels (consolidated to Martial + Spellcraft)
// Note: Staged perks (conditioning) do NOT contribute to Martial domain -
// they represent toughness training, not fighting skill
export const calculateWeaponDomains = (progressionLog: ProgressionLogEntry[]): WeaponDomains => {
  let martialCP = 0;
  let spellcraftCP = 0;

  // Sum up CP for each domain
  progressionLog.forEach(entry => {
    // Perks with xpType='combat' contribute to Martial domain
    if (entry.type === 'perk' && entry.xpType === 'combat') {
      martialCP += entry.cost;
    }
    // Spells contribute to Spellcraft domain
    if (entry.type === 'spell') {
      spellcraftCP += entry.cost;
    }
    // Perks with xpType='social' contribute to Spellcraft domain
    if (entry.type === 'perk' && entry.xpType === 'social') {
      spellcraftCP += entry.cost;
    }
  });

  // Calculate Martial domain level (thresholds: 5, 15, 30, 50, 75)
  let martialLevel = 0;
  for (let i = 0; i < MARTIAL_CP_THRESHOLDS.length; i++) {
    if (martialCP >= MARTIAL_CP_THRESHOLDS[i]) {
      martialLevel = i + 1;
    }
  }

  // Calculate Spellcraft domain level (thresholds: 10, 30, 60, 100, 150)
  let spellcraftLevel = 0;
  for (let i = 0; i < SPELLCRAFT_CP_THRESHOLDS.length; i++) {
    if (spellcraftCP >= SPELLCRAFT_CP_THRESHOLDS[i]) {
      spellcraftLevel = i + 1;
    }
  }

  return {
    Martial: martialLevel,
    Spellcraft: spellcraftLevel
  };
};

// Calculate extra HP from staged perks (conditioning perks)
// Stage 1-4: extraHP equals stage number (1, 2, 3, or 4)
// Stage 5: no extraHP (converted to +1 Max Wounds)
export const calculateExtraHPFromStagedPerks = (perks: import('@/types/character').CharacterPerk[]): number => {
  let extraHP = 0;

  perks.filter(p => p.isStaged).forEach(perk => {
    if (perk.level >= 1 && perk.level <= 4) {
      // Levels 1-4: extraHP equals level
      extraHP += perk.level;
    }
    // Level 5: no extraHP (converted to wound via Extra Wound effect)
  });

  return extraHP;
};

// Calculate HP values (stamina and health)
export const calculateHP = (character: Character) => {
  // Calculate extraHP from staged perks instead of stored field
  const extraHP = calculateExtraHPFromStagedPerks(character.perks || []);
  const maxHP = character.maxWounds * character.hpPerWound + extraHP;
  const staminaMax = maxHP;
  const healthMax = character.maxWounds * 5;

  const currentStamina = character.currentStamina ?? staminaMax;
  const currentHealth = character.currentHealth ?? healthMax;

  const totalCurrent = currentStamina + currentHealth;
  const totalMax = staminaMax + healthMax;

  return {
    maxHP,
    staminaMax,
    healthMax,
    currentStamina,
    currentHealth,
    totalCurrent,
    totalMax
  };
};

// Calculate armor penalty based on armor data
export const calculateArmorPenalty = (armorData: typeof ARMOR_TYPES[string], might: number): number => {
  if (!armorData) return 0;

  // If might meets requirement, use penaltyMet, otherwise use full penalty
  return might >= armorData.mightReq ? armorData.penaltyMet : armorData.penalty;
};

// Calculate speed
export const calculateSpeed = (agility: number, endurance: number, armorPenalty: number): number => {
  const baseSpeed = 3 + Math.max(agility, endurance);
  return Math.max(0, baseSpeed + armorPenalty);
};

// Calculate encumbrance
export const calculateEncumbrance = (character: Character) => {
  const capacity = Math.pow(5 + character.stats.EN + character.stats.MG, 2);

  // Calculate from unified inventory
  // Equipped items count toward weight
  const equippedWeight = character.inventory
    .filter(item => item.state === 'equipped')
    .reduce((sum, item) => sum + (item.weight * item.quantity), 0);

  // Stowed items count toward weight, with weight reduction applied
  const stowedWeight = character.inventory
    .filter(item => item.state === 'stowed')
    .reduce((sum, item) => sum + (item.weight * item.quantity), 0);
  const weightReduction = character.stowedWeightReduction || 0;

  // Packed items DON'T count toward encumbrance (stored elsewhere)
  const inventoryWeight = Math.max(0, stowedWeight - weightReduction);
  const totalWeight = equippedWeight + inventoryWeight;

  const percentage = (totalWeight / capacity) * 100;

  // Determine encumbrance level based on the rules from 7.1 Encumbrance.md
  let level = ENCUMBRANCE_LEVELS.NONE;
  const ratio = totalWeight / capacity;

  if (ratio >= 2.0) {
    level = ENCUMBRANCE_LEVELS.OVER; // Over-Encumbered: 2.0-3.0x capacity
  } else if (ratio >= 1.5) {
    level = ENCUMBRANCE_LEVELS.HEAVY; // Heavy: 1.5-2.0x capacity
  } else if (ratio >= 1.0) {
    level = ENCUMBRANCE_LEVELS.ENCUMBERED; // Encumbered: 1.0-1.5x capacity
  } else if (ratio >= 0.5) {
    level = ENCUMBRANCE_LEVELS.LIGHT; // Light: 0.5-1.0x capacity
  }

  return {
    capacity,
    totalWeight,
    equippedWeight,
    inventoryWeight,
    percentage: Math.min(300, percentage), // Can go up to 300% (3.0x capacity)
    level
  };
};

// Calculate dodge
export const calculateDodge = (agility: number, perception: number, armorPenalty: number, encumbrancePenalty: number): number => {
  return agility + perception + armorPenalty + encumbrancePenalty;
};

// Calculate endure (MS5: Endurance + Might)
export const calculateEndure = (endurance: number, might: number): number => {
  return endurance + might;
};

// Calculate resolve (MS5: Will + Charisma)
export const calculateResolve = (will: number, charisma: number): number => {
  return will + charisma;
};

// Calculate damage dice count based on domain level
export const calculateDamageDiceCount = (domainLevel: number): number => {
  if (domainLevel >= 5) return 3;
  if (domainLevel >= 3) return 2;
  return 1;
};

// Parse damage string (e.g., "d6", "d12+1", "4+Might") into dice and bonus
export const parseDamageString = (damageStr: string, might: number): { die: number; bonus: number; isBow: boolean } => {
  // Check if it's bow damage format (e.g., "4+Might", "5+Might")
  if (damageStr.includes('+Might')) {
    const baseValue = parseInt(damageStr.split('+')[0]);
    return { die: 0, bonus: baseValue + might, isBow: true };
  }
  // Standard dice format
  if (damageStr.includes('+')) {
    const [die, bonus] = damageStr.split('+');
    return { die: parseInt(die.replace('d', '')), bonus: parseInt(bonus) + might, isBow: false };
  }
  return { die: parseInt(damageStr.replace('d', '')), bonus: might, isBow: false };
};

// Calculate which attribute to use for attack based on weapon properties
// Uses item's attackAttribute override if set, otherwise defaults based on weapon traits
export const calculateAttackAttribute = (character: Character, item: InventoryItem, weapon: Weapon): number => {
  // Use item's attackAttribute override if set
  if (item.attackAttribute) {
    return character.stats[item.attackAttribute];
  }

  // Default behavior based on weapon traits
  let attackAttr = character.stats.AG; // Default: Agility

  // MS5: Check weapon traits for ranged
  if (weapon.traits.includes('Ranged') || weapon.traits.includes('Bow')) {
    // Ranged weapons use Perception
    attackAttr = character.stats.PR;
  }

  return attackAttr;
};

// Calculate deflect for a specific weapon (MS5: Martial domain + weapon attribute)
// This is the "Parry" component of Deflect
// Uses item's deflectAttribute override if set, otherwise defaults to AG
export const calculateDeflectForWeapon = (character: Character, item: InventoryItem, weapon: Weapon): number => {
  if (!weapon.domain) return 0;
  // Can't deflect with ranged weapons (use shield or dodge instead)
  if (weapon.traits.includes('Ranged') || weapon.traits.includes('Bow')) return 0;

  // MS5: All weapons use Martial domain
  const martialLevel = character.weaponDomains.Martial || 0;

  // Use item's deflectAttribute override if set, otherwise default to AG
  let deflectBase = character.stats.AG;
  if (item.deflectAttribute) {
    deflectBase = character.stats[item.deflectAttribute];
  }

  return deflectBase + martialLevel;
};

// Calculate Deflect = higher of (Weapon Parry) or (Shield Block)
// Per rules: Deflect uses the best defensive option available
// Shield defenseBonus applies to Deflect when using a shield
export const calculateDeflectFromEquipped = (character: Character): number => {
  const equippedWeaponsFromInventory = getEquippedWeapons(character);

  // Calculate weapon-based deflect (Parry) using item's attribute overrides
  const weaponDeflect = equippedWeaponsFromInventory.length > 0
    ? Math.max(0, ...equippedWeaponsFromInventory.map(item => {
        const weapon = getWeaponData(item);
        if (!weapon) return 0;
        
        // Get base deflect from weapon
        let deflect = calculateDeflectForWeapon(character, item, weapon);
        
        // Add shield defenseBonus if this weapon is a shield
        if (weapon.traits.includes('Shield') && weapon.defenseBonus) {
          deflect += weapon.defenseBonus;
        }
        
        return deflect;
      }))
    : 0;

  // Calculate shield Block (for comparison - uses full block formula)
  const shieldBlock = calculateBlockFromEquipped(character);

  // Deflect = higher of Parry (with shield bonus) or Block
  return Math.max(weaponDeflect, shieldBlock);
};

// Calculate block value from equipped shield (MS5: uses Martial domain)
// Shields are now weapons with defenseBonus and negation fields
// Light shields use AG, Heavy use MG, others (no trait) default to AG
export const calculateBlockFromEquipped = (character: Character): number => {
  const equippedShieldItem = getEquippedShield(character);
  if (!equippedShieldItem) return 0;
  
  const shieldWeapon = getWeaponData(equippedShieldItem);
  if (!shieldWeapon || !shieldWeapon.defenseBonus) return 0;

  // MS5: Shields use Martial domain
  const martialLevel = character.weaponDomains.Martial || 0;
  
  // Determine attribute based on shield traits
  let blockBase = character.stats.AG; // Default (no trait or Light)
  if (shieldWeapon.traits.includes('Heavy')) {
    blockBase = character.stats.MG;
  }
  
  return blockBase + martialLevel + shieldWeapon.defenseBonus;
};

// Calculate dodge including armor and encumbrance penalties
export const calculateDodgeFromEquipped = (character: Character): number => {
  const equippedArmor = getEquippedArmor(character);
  const armorData = equippedArmor
    ? (getArmorData(equippedArmor) || ARMOR_TYPES['None'])
    : ARMOR_TYPES['None'];

  const meetsArmorReq = character.stats.MG >= armorData.mightReq;
  const armorPenalty = meetsArmorReq ? armorData.penaltyMet : armorData.penalty;

  return character.stats.AG + character.stats.PR + (armorPenalty || 0);
};

// Calculate max wounds based on completed conditioning perks (level 5)
// Max Wounds = 2 (base) + number of conditioning perks at level 5
// Note: This is for reference only - actual maxWounds is stored on character
export const calculateMaxWounds = (character: Character): number => {
  const baseWounds = 2;

  // Count conditioning perks at level 5 (completed staged perks)
  const completedConditioning = character.perks?.filter(
    p => p.isStaged && p.level >= 5 && p.perkSnapshot?.tags?.includes('Conditioning')
  ).length || 0;

  return baseWounds + completedConditioning;
};

// Calculate comprehensive HP values with bar percentages
export const calculateHPValues = (character: Character) => {
  // MS5: Use calculated max wounds from completed conditioning perks
  const calculatedMaxWounds = calculateMaxWounds(character);
  const effectiveMaxWounds = calculatedMaxWounds - character.markedWounds;

  // Get armor bonus
  const equippedArmor = getEquippedArmor(character);
  const armorData = equippedArmor
    ? (getArmorData(equippedArmor) || ARMOR_TYPES['None'])
    : ARMOR_TYPES['None'];
  const armorBonus = armorData.bonus;

  // Calculate extraHP from staged perks instead of stored field
  const extraHP = calculateExtraHPFromStagedPerks(character.perks || []);

  const maxStamina = (armorBonus + character.stats.EN) * effectiveMaxWounds;
  const maxHealth = (character.hpPerWound * effectiveMaxWounds) + extraHP;
  const currentStamina = character.currentStamina !== null ? character.currentStamina : maxStamina;
  const currentHealth = character.currentHealth !== null ? character.currentHealth : maxHealth;

  const totalMax = maxStamina + maxHealth;
  const totalCurrent = currentStamina + currentHealth;
  const isNegative = totalCurrent < 0;
  const maxNegativeHP = calculatedMaxWounds * character.hpPerWound;

  // Calculate bar percentages
  let healthPercent = 0;
  let staminaPercent = 0;
  let negativePercent = 0;

  if (!isNegative) {
    // Positive HP - show stamina (yellow) and health (red)
    healthPercent = maxHealth > 0
      ? Math.min(100, (currentHealth / maxHealth) * 100)
      : 0;
    staminaPercent = maxStamina > 0
      ? Math.min(100, (currentStamina / maxStamina) * 100)
      : 0;
  } else {
    // Negative HP - show as dark red from 0 going left
    negativePercent = maxNegativeHP > 0
      ? Math.min(100, (Math.abs(totalCurrent) / maxNegativeHP) * 100)
      : 0;
  }

  return {
    maxStamina,
    maxHealth,
    currentStamina,
    currentHealth,
    totalMax,
    totalCurrent,
    effectiveMaxWounds,
    isNegative,
    maxNegativeHP,
    healthPercent,
    staminaPercent,
    negativePercent,
    armorBonus
  };
};

// Calculate speed including armor and running skill
export const calculateSpeedFromEquipped = (character: Character): { withArmor: number; withoutArmor: number } => {
  // Get armor stats
  const equippedArmor = getEquippedArmor(character);
  const armorData = equippedArmor ? getArmorData(equippedArmor) : null;
  const meetsArmorReq = armorData ? character.stats.MG >= armorData.mightReq : true;
  const armorPenalty = armorData ? (meetsArmorReq ? armorData.penaltyMet : armorData.penalty) : 0;

  // Calculate speed
  const runningSkill = character.skills.find(s => s.name === 'Running');
  const runningBonus = runningSkill ? Math.floor(runningSkill.level / 2) : 0;
  const speedWithArmor = 5 + character.stats.AG + runningBonus + armorPenalty;
  const speedWithoutArmor = 5 + character.stats.AG + runningBonus;

  return {
    withArmor: speedWithArmor,
    withoutArmor: speedWithoutArmor
  };
};

// Calculate progress bar percentage for attribute CP thresholds
// Uses CP_THRESHOLDS array: [-30, -20, -10, 0, 10, 30, 60, 100, 150]
export const calculateAttributeProgress = (currentCP: number): number => {
  if (currentCP === 0) return 0;
  
  const thresholds = CP_THRESHOLDS;
  
  // Find which threshold range we're in
  for (let i = 0; i < thresholds.length - 1; i++) {
    const prevThreshold = thresholds[i];
    const nextThreshold = thresholds[i + 1];
    
    // Check if currentCP is in this range (handles both negative and positive)
    if (currentCP >= prevThreshold && currentCP < nextThreshold) {
      const range = nextThreshold - prevThreshold;
      const progress = currentCP - prevThreshold;
      return (progress / range) * 100;
    }
  }
  
  // At or above max threshold (150+)
  if (currentCP >= thresholds[thresholds.length - 1]) {
    return 100;
  }
  
  // Below min threshold (-30 or less)
  if (currentCP < thresholds[0]) {
    return 0;
  }
  
  return 0;
};

// Calculate progress bar percentage for domain CP thresholds (Martial/Spellcraft)
export const calculateDomainProgress = (currentCP: number): number => {
  const thresholds = MARTIAL_CP_THRESHOLDS; // [10, 30, 60, 100, 150]
  
  if (currentCP <= 0) return 0;
  if (currentCP >= thresholds[thresholds.length - 1]) return 100;
  
  // Find which threshold range we're in
  for (let i = 0; i < thresholds.length - 1; i++) {
    const prevThreshold = thresholds[i];
    const nextThreshold = thresholds[i + 1];
    
    if (currentCP >= prevThreshold && currentCP < nextThreshold) {
      const range = nextThreshold - prevThreshold;
      const progress = currentCP - prevThreshold;
      return (progress / range) * 100;
    }
  }
  
  // Below first threshold
  return (currentCP / thresholds[0]) * 100;
};
