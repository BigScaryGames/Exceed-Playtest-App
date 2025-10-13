import { Character, AttributeCode, ProgressionLogEntry, WeaponDomain } from '@/types/character';
import { ARMOR_TYPES } from '@/data/armor';
import { WEAPONS } from '@/data/weapons';
import { SHIELDS } from '@/data/shields';
import { ATTRIBUTE_CP_THRESHOLDS, DOMAIN_CP_THRESHOLDS, ENCUMBRANCE_LEVELS } from './constants';

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
    if (entry.type === 'combatPerk' && entry.domain) {
      cpByDomain[entry.domain] += entry.cost;
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

  let totalWeight = 0;
  let equippedWeight = 0;
  let inventoryWeight = 0;

  // Use new inventory system if available
  if (character.inventory && character.inventory.length > 0) {
    // Calculate from unified inventory - stowed items don't count toward encumbrance
    equippedWeight = character.inventory
      .filter(item => item.state === 'equipped')
      .reduce((sum, item) => sum + (item.weight * item.quantity), 0);
    inventoryWeight = character.inventory
      .filter(item => item.state === 'packed')
      .reduce((sum, item) => sum + (item.weight * item.quantity), 0);
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
