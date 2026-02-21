import { Character, AttributeCode, ProgressionLogEntry, Weapon, WeaponDomains } from '@/types/character';
import { ARMOR_TYPES } from '@/data/armor';
import { WEAPONS } from '@/data/weapons';
import { SHIELDS } from '@/data/shields';
import { NEGATIVE_CP_THRESHOLDS, POSITIVE_CP_THRESHOLDS, MARTIAL_CP_THRESHOLDS, SPELLCRAFT_CP_THRESHOLDS, ENCUMBRANCE_LEVELS } from './constants';
import {
  getEquippedWeapons,
  getEquippedArmor,
  getEquippedShield,
  getWeaponData,
  getArmorData,
  getShieldData
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
  progressionLog.forEach(entry => {
    if (entry.attribute) {
      // Map full attribute name to code
      const attrCode = ATTRIBUTE_NAME_TO_CODE[entry.attribute] || entry.attribute;
      if (attrCode in cpTotals) {
        cpTotals[attrCode as AttributeCode] += entry.cost;  // Negative for flaws
      }
    }
  });

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

    if (cp < 0) {
      // Calculate negative attribute value
      // -30 or less → -3, -20 to -29 → -2, -10 to -19 → -1
      for (let i = NEGATIVE_CP_THRESHOLDS.length - 1; i >= 0; i--) {
        if (cp <= NEGATIVE_CP_THRESHOLDS[i]) {
          value = -(i + 1);
          break;
        }
      }
    } else if (cp > 0) {
      // Calculate positive attribute value
      for (let i = 0; i < POSITIVE_CP_THRESHOLDS.length; i++) {
        if (cp >= POSITIVE_CP_THRESHOLDS[i]) {
          value = i + 1;
        }
      }
    }
    // cp === 0 → value = 0 (already initialized)

    stats[attr as AttributeCode] = value;
  });

  return stats;
};

// MS5: Calculate weapon domain levels (consolidated to Martial + Spellcraft)
export const calculateWeaponDomains = (progressionLog: ProgressionLogEntry[]): WeaponDomains => {
  let martialCP = 0;
  let spellcraftCP = 0;

  // Sum up CP for each domain
  progressionLog.forEach(entry => {
    // Perks with xpType='combat' contribute to Martial domain
    if (entry.type === 'perk' && entry.xpType === 'combat') {
      martialCP += entry.cost;
    }
    // Staged perks (conditioning) contribute to Martial domain
    else if (entry.type === 'stagedPerk') {
      martialCP += entry.cost;
    }
    // Spells contribute to Spellcraft domain
    else if (entry.type === 'spell') {
      spellcraftCP += entry.cost;
    }
    // Perks with xpType='social' contribute to Spellcraft domain
    else if (entry.type === 'perk' && entry.xpType === 'social') {
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

// Calculate armor penalty based on Might requirement
export const calculateArmorPenalty = (armorType: string, might: number): number => {
  const armor = ARMOR_TYPES[armorType];
  if (!armor) return 0;

  // If might meets requirement, use penaltyMet, otherwise use full penalty
  return might >= armor.mightReq ? armor.penaltyMet : armor.penalty;
};

// Calculate speed
export const calculateSpeed = (agility: number, endurance: number, armorPenalty: number): number => {
  const baseSpeed = 3 + Math.max(agility, endurance);
  return Math.max(0, baseSpeed + armorPenalty);
};

// Calculate deflect value (MS5: Martial domain + weapon attribute + equipment bonus)
// Deflect = Martial + Agility/Dexterity/Might (based on weapon type) + Equipment Defense bonus
export const calculateDeflect = (character: Character): number => {
  const weapon1 = WEAPONS[character.equippedWeapon1];
  const weapon2 = WEAPONS[character.equippedWeapon2];
  const shield = SHIELDS[character.equippedShield];

  // MS5: All weapons use Martial domain
  const martialLevel = character.weaponDomains.Martial || 0;

  // Determine which attribute to use based on weapon properties
  // Finesse weapons use Dexterity, Heavy weapons use Might, others use Agility
  let weaponAttribute = character.stats.AG; // Default: Agility
  
  if (weapon1) {
    if (weapon1.finesse && character.stats.DX > character.stats.AG) {
      weaponAttribute = character.stats.DX;
    } else if (weapon1.traits.includes('Heavy') && character.stats.MG > character.stats.AG) {
      weaponAttribute = character.stats.MG;
    }
  } else if (weapon2) {
    // Off-hand weapon
    if (weapon2.finesse && character.stats.DX > character.stats.AG) {
      weaponAttribute = character.stats.DX;
    } else if (weapon2.traits.includes('Heavy') && character.stats.MG > character.stats.AG) {
      weaponAttribute = character.stats.MG;
    }
  }

  // Get equipment defense bonus from shield
  const shieldBonus = shield?.defenseBonus || 0;

  // Deflect = Martial domain + weapon attribute + shield bonus
  return martialLevel + weaponAttribute + shieldBonus;
};

// Calculate encumbrance
export const calculateEncumbrance = (character: Character) => {
  const capacity = Math.pow(5 + character.stats.EN + character.stats.MG, 2);

  let totalWeight;
  let equippedWeight;
  let inventoryWeight;

  // Use new inventory system if available
  if (character.inventory && character.inventory.length > 0) {
    // Calculate from unified inventory
    // Equipped items count toward weight
    equippedWeight = character.inventory
      .filter(item => item.state === 'equipped')
      .reduce((sum, item) => sum + (item.weight * item.quantity), 0);

    // Stowed items count toward weight, with weight reduction applied
    const stowedWeight = character.inventory
      .filter(item => item.state === 'stowed')
      .reduce((sum, item) => sum + (item.weight * item.quantity), 0);
    const weightReduction = character.stowedWeightReduction || 0;

    // Packed items DON'T count toward encumbrance (stored elsewhere)
    inventoryWeight = Math.max(0, stowedWeight - weightReduction);
    totalWeight = equippedWeight + inventoryWeight;
  } else {
    // Fallback to old system
    const equipmentWeight = character.equipment.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
    const customItemsWeight = character.customItems.reduce((sum, item) => sum + (item.weight * item.quantity), 0);

    // Calculate weight from equipped gear
    const armorWeight = ARMOR_TYPES[character.armorType]?.weight || 0;
    const weapon1Weight = WEAPONS[character.equippedWeapon1]?.weight || 0;
    const weapon2Weight = WEAPONS[character.equippedWeapon2]?.weight || 0;
    const shieldWeight = SHIELDS[character.equippedShield]?.weight || 0;
    equippedWeight = armorWeight + weapon1Weight + weapon2Weight + shieldWeight;

    inventoryWeight = equipmentWeight + customItemsWeight;
    totalWeight = equipmentWeight + customItemsWeight + equippedWeight;
  }

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
export const calculateAttackAttribute = (character: Character, weapon: Weapon): number => {
  let attackAttr = character.stats.AG; // Default: Agility

  // MS5: Check weapon traits for ranged
  if (weapon.traits.includes('Ranged') || weapon.traits.includes('Bow')) {
    // Ranged weapons use Perception
    attackAttr = character.stats.PR;
  } else if (weapon.finesse && character.stats.DX > character.stats.AG) {
    // Finesse weapons use Dexterity if higher
    attackAttr = character.stats.DX;
  } else if (weapon.traits.includes('Heavy') && character.stats.MG > character.stats.AG) {
    // Heavy weapons use Might if higher than Agility
    attackAttr = character.stats.MG;
  }

  return attackAttr;
};

// Calculate deflect for a specific weapon (MS5: Martial domain + weapon attribute)
// This is the "Parry" component of Deflect
export const calculateDeflectForWeapon = (character: Character, weapon: Weapon): number => {
  if (!weapon.domain) return 0;
  // Can't deflect with ranged weapons (use shield or dodge instead)
  if (weapon.traits.includes('Ranged') || weapon.traits.includes('Bow')) return 0;

  // MS5: All weapons use Martial domain
  const martialLevel = character.weaponDomains.Martial || 0;

  // Determine attribute: Finesse uses DX, Heavy uses MG, default AG
  let deflectBase = character.stats.AG;
  if (weapon.finesse && character.stats.DX > character.stats.AG) {
    deflectBase = character.stats.DX;
  } else if (weapon.traits.includes('Heavy') && character.stats.MG > character.stats.AG) {
    deflectBase = character.stats.MG;
  }

  return deflectBase + martialLevel;
};

// Calculate Deflect = higher of (Weapon Parry) or (Shield Block)
// Per rules: Deflect uses the best defensive option available
export const calculateDeflectFromEquipped = (character: Character): number => {
  const equippedWeaponsFromInventory = getEquippedWeapons(character);
  let equippedWeapons: Array<Weapon> = [];

  if (equippedWeaponsFromInventory.length > 0) {
    // Use new inventory system
    equippedWeapons = equippedWeaponsFromInventory
      .map(item => getWeaponData(item))
      .filter((w): w is Weapon => w !== null);
  } else if (character.equippedWeapon1 || character.equippedWeapon2) {
    // Fallback to old system
    if (character.equippedWeapon1 && character.equippedWeapon1 !== 'None') {
      const weapon = WEAPONS[character.equippedWeapon1];
      if (weapon) equippedWeapons.push(weapon);
    }
    if (character.equippedWeapon2 && character.equippedWeapon2 !== 'None') {
      const weapon = WEAPONS[character.equippedWeapon2];
      if (weapon) equippedWeapons.push(weapon);
    }
  }

  // Calculate weapon-based deflect (Parry)
  const weaponDeflect = equippedWeapons.length > 0
    ? Math.max(0, ...equippedWeapons.map(w => calculateDeflectForWeapon(character, w)))
    : 0;

  // Calculate shield Block
  const shieldBlock = calculateBlockFromEquipped(character);

  // Deflect = higher of Parry or Block
  return Math.max(weaponDeflect, shieldBlock);
};

// Calculate block value from equipped shield (MS5: uses Martial domain)
export const calculateBlockFromEquipped = (character: Character): number => {
  // Get equipped shield - with backward compatibility
  const equippedShieldItem = getEquippedShield(character);
  const shieldData = equippedShieldItem
    ? (getShieldData(equippedShieldItem) || SHIELDS['None'])
    : (character.equippedShield ? SHIELDS[character.equippedShield] : SHIELDS['None']);

  // MS5: Shields use Martial domain
  const martialLevel = character.weaponDomains.Martial || 0;
  let block = 0;

  if (shieldData.defenseBonus > 0) {
    // Light shields use Agility, Medium use Endurance, Heavy use Might
    let blockBase = character.stats.AG; // Light default
    if (shieldData.type === 'Medium') {
      blockBase = character.stats.EN;
    } else if (shieldData.type === 'Heavy') {
      blockBase = character.stats.MG;
    }
    block = blockBase + martialLevel + shieldData.defenseBonus;
  }

  return block;
};

// Calculate dodge including armor and encumbrance penalties
export const calculateDodgeFromEquipped = (character: Character): number => {
  // Get armor stats
  const equippedArmor = getEquippedArmor(character);
  const armorData = equippedArmor
    ? (getArmorData(equippedArmor) || ARMOR_TYPES['None'])
    : (character.armorType ? ARMOR_TYPES[character.armorType] : ARMOR_TYPES['None']);

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
    : (character.armorType ? ARMOR_TYPES[character.armorType] : ARMOR_TYPES['None']);
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
