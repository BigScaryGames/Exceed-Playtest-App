import { Character, InventoryItem } from '@/types/character';
import { WEAPONS } from '@/data/weapons';
import { ARMOR_TYPES } from '@/data/armor';
import { SHIELDS } from '@/data/shields';
import { generateItemId } from './inventory';

/**
 * Migrate character from old equipment system to new unified inventory system
 */
export const migrateCharacterToInventory = (character: Character): Character => {
  // If character already has inventory and it's not empty, no migration needed
  if (character.inventory && character.inventory.length > 0) {
    return character;
  }

  const inventory: InventoryItem[] = [];

  // Migrate equipped weapons
  if (character.equippedWeapon1 && character.equippedWeapon1 !== 'None') {
    const weaponData = WEAPONS[character.equippedWeapon1];
    if (weaponData) {
      inventory.push({
        id: generateItemId(),
        name: character.equippedWeapon1,
        type: 'weapon',
        state: 'equipped',
        weight: weaponData.weight,
        quantity: 1,
        isCustom: false,
        dataRef: character.equippedWeapon1
      });
    }
  }

  if (character.equippedWeapon2 && character.equippedWeapon2 !== 'None') {
    const weaponData = WEAPONS[character.equippedWeapon2];
    if (weaponData) {
      inventory.push({
        id: generateItemId(),
        name: character.equippedWeapon2,
        type: 'weapon',
        state: 'equipped',
        weight: weaponData.weight,
        quantity: 1,
        isCustom: false,
        dataRef: character.equippedWeapon2
      });
    }
  }

  // Migrate equipped armor
  if (character.armorType && character.armorType !== 'None') {
    const armorData = ARMOR_TYPES[character.armorType];
    if (armorData) {
      inventory.push({
        id: generateItemId(),
        name: character.armorType,
        type: 'armor',
        state: 'equipped',
        weight: armorData.weight,
        quantity: 1,
        isCustom: false,
        dataRef: character.armorType
      });
    }
  }

  // Migrate equipped shield
  if (character.equippedShield && character.equippedShield !== 'None') {
    const shieldData = SHIELDS[character.equippedShield];
    if (shieldData) {
      inventory.push({
        id: generateItemId(),
        name: character.equippedShield,
        type: 'shield',
        state: 'equipped',
        weight: shieldData.weight,
        quantity: 1,
        isCustom: false,
        dataRef: character.equippedShield
      });
    }
  }

  // Migrate equipment array (generic items) - mark as stowed
  if (character.equipment && character.equipment.length > 0) {
    character.equipment.forEach(item => {
      inventory.push({
        id: generateItemId(),
        name: item.name,
        type: 'item',
        state: 'stowed',
        weight: item.weight,
        quantity: item.quantity,
        isCustom: false
      });
    });
  }

  // Migrate custom items - mark as stowed
  if (character.customItems && character.customItems.length > 0) {
    character.customItems.forEach(item => {
      inventory.push({
        id: generateItemId(),
        name: item.name,
        type: 'item',
        state: 'stowed',
        weight: item.weight,
        quantity: item.quantity,
        isCustom: true
      });
    });
  }

  // Return character with migrated inventory
  return {
    ...character,
    inventory
  };
};

/**
 * Check if character needs migration
 */
export const needsMigration = (character: Character): boolean => {
  // Character needs migration if it has old equipment fields but no inventory
  const hasOldEquipment =
    (character.equippedWeapon1 && character.equippedWeapon1 !== 'None') ||
    (character.equippedWeapon2 && character.equippedWeapon2 !== 'None') ||
    (character.armorType && character.armorType !== 'None') ||
    (character.equippedShield && character.equippedShield !== 'None') ||
    (character.equipment && character.equipment.length > 0) ||
    (character.customItems && character.customItems.length > 0);

  const hasInventory = character.inventory && character.inventory.length > 0;

  return hasOldEquipment && !hasInventory;
};

/**
 * Migrate character if needed (safe wrapper)
 */
export const migrateCharacterIfNeeded = (character: Character): Character => {
  if (needsMigration(character)) {
    console.log('Migrating character to new inventory system...');
    return migrateCharacterToInventory(character);
  }
  return character;
};
