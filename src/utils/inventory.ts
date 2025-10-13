import {
  Character,
  InventoryItem,
  ItemState,
  Weapon,
  ArmorType,
  Shield
} from '@/types/character';
import { WEAPONS } from '@/data/weapons';
import { ARMOR_TYPES } from '@/data/armor';
import { SHIELDS } from '@/data/shields';

/**
 * Get all equipped weapons from inventory
 */
export const getEquippedWeapons = (character: Character): InventoryItem[] => {
  if (!character.inventory) return [];
  return character.inventory.filter(
    item => item.type === 'weapon' && item.state === 'equipped'
  );
};

/**
 * Get equipped armor from inventory
 */
export const getEquippedArmor = (character: Character): InventoryItem | null => {
  if (!character.inventory) return null;
  const armor = character.inventory.find(
    item => item.type === 'armor' && item.state === 'equipped'
  );
  return armor || null;
};

/**
 * Get equipped shield from inventory
 */
export const getEquippedShield = (character: Character): InventoryItem | null => {
  if (!character.inventory) return null;
  const shield = character.inventory.find(
    item => item.type === 'shield' && item.state === 'equipped'
  );
  return shield || null;
};

/**
 * Resolve weapon data from inventory item
 */
export const getWeaponData = (item: InventoryItem): Weapon | null => {
  if (item.type !== 'weapon') return null;

  if (item.isCustom && item.customWeaponData) {
    return {
      domain: item.customWeaponData.domain,
      finesse: item.customWeaponData.finesse,
      damage: item.customWeaponData.damage,
      ap: item.customWeaponData.ap,
      mightReq: item.customWeaponData.mightReq,
      traits: item.customWeaponData.traits,
      weight: item.weight
    };
  }

  if (item.dataRef && WEAPONS[item.dataRef]) {
    return WEAPONS[item.dataRef];
  }

  return null;
};

/**
 * Resolve armor data from inventory item
 */
export const getArmorData = (item: InventoryItem): ArmorType | null => {
  if (item.type !== 'armor') return null;

  if (item.isCustom && item.customArmorData) {
    return {
      bonus: item.customArmorData.bonus,
      mightReq: item.customArmorData.mightReq,
      penalty: item.customArmorData.penalty,
      penaltyMet: item.customArmorData.penaltyMet,
      weight: item.weight
    };
  }

  if (item.dataRef && ARMOR_TYPES[item.dataRef]) {
    return ARMOR_TYPES[item.dataRef];
  }

  return null;
};

/**
 * Resolve shield data from inventory item
 */
export const getShieldData = (item: InventoryItem): Shield | null => {
  if (item.type !== 'shield') return null;

  if (item.isCustom && item.customShieldData) {
    return {
      defenseBonus: item.customShieldData.defenseBonus,
      negation: item.customShieldData.negation,
      armorPenalty: item.customShieldData.armorPenalty,
      mightReq: item.customShieldData.mightReq,
      type: item.customShieldData.type,
      weight: item.weight
    };
  }

  if (item.dataRef && SHIELDS[item.dataRef]) {
    return SHIELDS[item.dataRef];
  }

  return null;
};

/**
 * Calculate total weight of inventory items by state
 */
export const calculateInventoryWeight = (
  character: Character,
  states: ItemState[] = ['equipped', 'stowed', 'packed']
): number => {
  if (!character.inventory) return 0;

  return character.inventory
    .filter(item => states.includes(item.state))
    .reduce((total, item) => total + (item.weight * item.quantity), 0);
};

/**
 * Calculate total weight of equipped gear only
 */
export const calculateEquippedWeight = (character: Character): number => {
  return calculateInventoryWeight(character, ['equipped']);
};

/**
 * Get items by state
 */
export const getItemsByState = (
  character: Character,
  state: ItemState
): InventoryItem[] => {
  if (!character.inventory) return [];
  return character.inventory.filter(item => item.state === state);
};

/**
 * Get items by type
 */
export const getItemsByType = (
  character: Character,
  type: InventoryItem['type']
): InventoryItem[] => {
  if (!character.inventory) return [];
  return character.inventory.filter(item => item.type === type);
};

/**
 * Find item by ID
 */
export const findItemById = (
  character: Character,
  id: string
): InventoryItem | undefined => {
  if (!character.inventory) return undefined;
  return character.inventory.find(item => item.id === id);
};

/**
 * Update item state
 */
export const updateItemState = (
  character: Character,
  itemId: string,
  newState: ItemState
): Character => {
  if (!character.inventory) return character;

  return {
    ...character,
    inventory: character.inventory.map(item =>
      item.id === itemId ? { ...item, state: newState } : item
    )
  };
};

/**
 * Add item to inventory
 */
export const addItemToInventory = (
  character: Character,
  item: InventoryItem
): Character => {
  return {
    ...character,
    inventory: [...(character.inventory || []), item]
  };
};

/**
 * Remove item from inventory
 */
export const removeItemFromInventory = (
  character: Character,
  itemId: string
): Character => {
  if (!character.inventory) return character;

  return {
    ...character,
    inventory: character.inventory.filter(item => item.id !== itemId)
  };
};

/**
 * Update item in inventory
 */
export const updateItemInInventory = (
  character: Character,
  itemId: string,
  updates: Partial<InventoryItem>
): Character => {
  if (!character.inventory) return character;

  return {
    ...character,
    inventory: character.inventory.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    )
  };
};

/**
 * Generate unique ID for inventory items
 */
export const generateItemId = (): string => {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if item can be equipped (considering equipment limits)
 */
export const canEquipItem = (
  character: Character,
  item: InventoryItem
): { canEquip: boolean; reason?: string } => {
  if (!character.inventory) {
    return { canEquip: true };
  }

  // Check armor - only one can be equipped
  if (item.type === 'armor') {
    const equippedArmor = getEquippedArmor(character);
    if (equippedArmor && equippedArmor.id !== item.id) {
      return {
        canEquip: false,
        reason: 'Another armor is already equipped. Unequip it first.'
      };
    }
  }

  // Check shield - only one can be equipped
  if (item.type === 'shield') {
    const equippedShield = getEquippedShield(character);
    if (equippedShield && equippedShield.id !== item.id) {
      return {
        canEquip: false,
        reason: 'Another shield is already equipped. Unequip it first.'
      };
    }
  }

  // Weapons - up to 2 can be equipped
  if (item.type === 'weapon') {
    const equippedWeapons = getEquippedWeapons(character);
    if (equippedWeapons.length >= 2 && !equippedWeapons.some(w => w.id === item.id)) {
      return {
        canEquip: false,
        reason: 'Maximum 2 weapons can be equipped. Unequip one first.'
      };
    }
  }

  return { canEquip: true };
};

/**
 * Convert a database item to a custom item
 * If already custom, returns the item unchanged
 */
export const convertToCustomItem = (item: InventoryItem): InventoryItem => {
  // If already custom, return as-is
  if (item.isCustom) {
    return item;
  }

  // If no dataRef, can't convert - return as-is
  if (!item.dataRef) {
    return item;
  }

  const converted: InventoryItem = {
    ...item,
    isCustom: true,
    dataRef: undefined
  };

  // Convert based on type
  if (item.type === 'weapon' && WEAPONS[item.dataRef]) {
    const weaponData = WEAPONS[item.dataRef];
    converted.customWeaponData = {
      domain: weaponData.domain!,
      finesse: weaponData.finesse,
      damage: weaponData.damage,
      ap: weaponData.ap,
      mightReq: weaponData.mightReq || 0,
      traits: [...weaponData.traits]
    };
  } else if (item.type === 'armor' && ARMOR_TYPES[item.dataRef]) {
    const armorData = ARMOR_TYPES[item.dataRef];
    converted.customArmorData = {
      bonus: armorData.bonus,
      mightReq: armorData.mightReq,
      penalty: armorData.penalty,
      penaltyMet: armorData.penaltyMet
    };
  } else if (item.type === 'shield' && SHIELDS[item.dataRef]) {
    const shieldData = SHIELDS[item.dataRef];
    converted.customShieldData = {
      defenseBonus: shieldData.defenseBonus,
      negation: shieldData.negation,
      armorPenalty: shieldData.armorPenalty,
      mightReq: shieldData.mightReq,
      type: shieldData.type
    };
  }

  return converted;
};
