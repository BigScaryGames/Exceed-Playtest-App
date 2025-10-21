import { Character, AttributeCode, ProgressionLogEntry, WeaponDomain, Weapon } from '@/types/character';
import { ARMOR_TYPES } from '@/data/armor';
import { WEAPONS } from '@/data/weapons';
import { SHIELDS } from '@/data/shields';
import { ATTRIBUTE_CP_THRESHOLDS, DOMAIN_CP_THRESHOLDS, ENCUMBRANCE_LEVELS } from './constants';
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
export const calculateAttributeValues = (progressionLog: ProgressionLogEntry[]) => {
  const cpTotals = {
    MG: 0, EN: 0, AG: 0, DX: 0,
    WT: 0, WI: 0, PR: 0, CH: 0
  };

  // Sum up all CP spent on each attribute
  progressionLog.forEach(entry => {
    if (entry.attribute) {
      // Map full attribute name to code
      const attrCode = ATTRIBUTE_NAME_TO_CODE[entry.attribute] || entry.attribute;
      if (attrCode in cpTotals) {
        cpTotals[attrCode as AttributeCode] += entry.cost;
      }
    }
  });

  // Convert CP totals to attribute values using thresholds
  const stats = {
    MG: 0, EN: 0, AG: 0, DX: 0,
    WT: 0, WI: 0, PR: 0, CH: 0
  };

  Object.keys(cpTotals).forEach(attr => {
    const cp = cpTotals[attr as AttributeCode];
    let value = 0;
    for (let i = 0; i < ATTRIBUTE_CP_THRESHOLDS.length; i++) {
      if (cp >= ATTRIBUTE_CP_THRESHOLDS[i]) {
        value = i + 1;
      }
    }
    stats[attr as AttributeCode] = value;
  });

  return stats;
};

// Calculate weapon domain levels from combat perks
export const calculateWeaponDomains = (progressionLog: ProgressionLogEntry[]) => {
  const cpByDomain: Record<string, number> = {
    '1H': 0,
    '2H': 0,
    'SaS': 0,
    'Sh': 0,
    'Ar': 0,
    'Spell': 0
  };

  // Sum up CP for each domain
  progressionLog.forEach(entry => {
    // Combat perks contribute to their specified domain (excluding Spell domain)
    if (entry.type === 'combatPerk' && entry.domain && entry.domain !== 'Spell') {
      cpByDomain[entry.domain] += entry.cost;
    }
    // Spells contribute to Spell domain
    else if (entry.type === 'spell') {
      cpByDomain['Spell'] += entry.cost;
    }
    // Magic perks contribute to Spell domain
    else if (entry.type === 'magicPerk') {
      cpByDomain['Spell'] += entry.cost;
    }
  });

  // Convert CP to domain levels
  const domains = {
    '1H': 0,
    '2H': 0,
    'SaS': 0,
    'Sh': 0,
    'Ar': 0,
    'Spell': 0
  };

  Object.keys(cpByDomain).forEach(domain => {
    const cp = cpByDomain[domain];
    let level = 0;

    // Spell domain has different thresholds: 10, 30, 60, 100, 150
    if (domain === 'Spell') {
      if (cp >= 150) level = 5;
      else if (cp >= 100) level = 4;
      else if (cp >= 60) level = 3;
      else if (cp >= 30) level = 2;
      else if (cp >= 10) level = 1;
    } else {
      // Weapon domains use standard thresholds: 5, 15, 30, 50, 75
      for (let i = 0; i < DOMAIN_CP_THRESHOLDS.length; i++) {
        if (cp >= DOMAIN_CP_THRESHOLDS[i]) {
          level = i + 1;
        }
      }
    }
    domains[domain as WeaponDomain] = level;
  });

  return domains;
};

// Calculate HP values (stamina and health)
export const calculateHP = (character: Character) => {
  const maxHP = character.maxWounds * character.hpPerWound + character.extraHP;
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

// Calculate parry value
export const calculateParry = (character: Character): number | null => {
  const weapon1 = WEAPONS[character.equippedWeapon1];
  const weapon2 = WEAPONS[character.equippedWeapon2];

  // Check if either weapon can parry (has a valid domain)
  const canParry = (weapon1 && weapon1.domain) || (weapon2 && weapon2.domain);

  if (!canParry) return null;

  // Find the highest weapon domain level
  let highestDomain = 0;
  if (weapon1 && weapon1.domain) {
    highestDomain = Math.max(highestDomain, character.weaponDomains[weapon1.domain]);
  }
  if (weapon2 && weapon2.domain) {
    highestDomain = Math.max(highestDomain, character.weaponDomains[weapon2.domain]);
  }

  // Parry = Might + Perception + highest weapon domain
  return character.stats.MG + character.stats.PR + highestDomain;
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

// Calculate endure
export const calculateEndure = (endurance: number, will: number): number => {
  return endurance + will;
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

  if (weapon.domain === 'Ar') {
    // Bows use Perception
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

// Calculate parry for a specific weapon
export const calculateParryForWeapon = (character: Character, weapon: Weapon): number => {
  if (!weapon.domain) return 0;
  // Can't parry with bows (Archery domain)
  if (weapon.domain === 'Ar') return 0;

  const weaponDomain = character.weaponDomains[weapon.domain] || 0;
  const parryBase = weapon.finesse && character.stats.DX > character.stats.AG
    ? character.stats.DX
    : character.stats.AG;

  return parryBase + weaponDomain;
};

// Calculate best parry value from all equipped weapons
export const calculateParryFromEquipped = (character: Character): number => {
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

  return Math.max(0, ...equippedWeapons.map(w => calculateParryForWeapon(character, w)));
};

// Calculate block value from equipped shield
export const calculateBlockFromEquipped = (character: Character): number => {
  // Get equipped shield - with backward compatibility
  const equippedShieldItem = getEquippedShield(character);
  const shieldData = equippedShieldItem
    ? (getShieldData(equippedShieldItem) || SHIELDS['None'])
    : (character.equippedShield ? SHIELDS[character.equippedShield] : SHIELDS['None']);

  const shieldDomain = character.weaponDomains['Sh'];
  let block = 0;

  if (shieldData.defenseBonus > 0) {
    // Light shields use Agility, Medium use Endurance, Heavy use Might
    let blockBase = character.stats.AG; // Light default
    if (shieldData.type === 'Medium') {
      blockBase = character.stats.EN;
    } else if (shieldData.type === 'Heavy') {
      blockBase = character.stats.MG;
    }
    block = blockBase + shieldDomain + shieldData.defenseBonus;
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

// Calculate comprehensive HP values with bar percentages
export const calculateHPValues = (character: Character) => {
  const effectiveMaxWounds = character.maxWounds - character.markedWounds;

  // Get armor bonus
  const equippedArmor = getEquippedArmor(character);
  const armorData = equippedArmor
    ? (getArmorData(equippedArmor) || ARMOR_TYPES['None'])
    : (character.armorType ? ARMOR_TYPES[character.armorType] : ARMOR_TYPES['None']);
  const armorBonus = armorData.bonus;

  const maxStamina = (armorBonus + character.stats.EN) * effectiveMaxWounds;
  const maxHealth = (character.hpPerWound * effectiveMaxWounds) + character.extraHP;
  const currentStamina = character.currentStamina !== null ? character.currentStamina : maxStamina;
  const currentHealth = character.currentHealth !== null ? character.currentHealth : maxHealth;

  const totalMax = maxStamina + maxHealth;
  const totalCurrent = currentStamina + currentHealth;
  const isNegative = totalCurrent < 0;
  const maxNegativeHP = character.maxWounds * character.hpPerWound;

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
