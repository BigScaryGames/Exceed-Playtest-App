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
 * Migrate character from old multi-domain system to single Martial domain
 */
export const migrateCharacterToSingleDomain = (character: Character): Character => {
  // Check if character uses old multi-domain system
  const weaponDomains = character.weaponDomains as any;
  const hasOldDomains = weaponDomains && (
    '1H' in weaponDomains ||
    '2H' in weaponDomains ||
    'SaS' in weaponDomains ||
    'Sh' in weaponDomains ||
    'Ar' in weaponDomains
  );

  if (!hasOldDomains) {
    return character; // Already migrated or new character
  }

  console.log('Migrating character to single Martial domain system...');

  // Combine all old martial domains into single Martial domain
  // Take the highest level from any martial domain
  const martialLevel = Math.max(
    weaponDomains['1H'] || 0,
    weaponDomains['2H'] || 0,
    weaponDomains['SaS'] || 0,
    weaponDomains['Sh'] || 0,
    weaponDomains['Ar'] || 0
  );

  // Update progression log entries - convert old domains to Martial
  const updatedLog = character.progressionLog.map(entry => {
    if (entry.type === 'combatPerk' && entry.domain) {
      // Convert old weapon domains to Martial
      if (['1H', '2H', 'SaS', 'Sh', 'Ar'].includes(entry.domain)) {
        return { ...entry, domain: 'Martial' as const };
      }
    }
    return entry;
  });

  return {
    ...character,
    weaponDomains: {
      'Martial': martialLevel,
      'Spell': weaponDomains['Spell'] || 0
    },
    progressionLog: updatedLog
  };
};

/**
 * Check if character needs domain migration
 */
export const needsDomainMigration = (character: Character): boolean => {
  const weaponDomains = character.weaponDomains as any;
  return weaponDomains && (
    '1H' in weaponDomains ||
    '2H' in weaponDomains ||
    'SaS' in weaponDomains ||
    'Sh' in weaponDomains ||
    'Ar' in weaponDomains
  );
};

/**
 * Migrate character if needed (safe wrapper)
 */
export const migrateCharacterIfNeeded = (character: Character): Character => {
  let migratedCharacter = character;

  // Apply inventory migration if needed
  if (needsMigration(migratedCharacter)) {
    console.log('Migrating character to new inventory system...');
    migratedCharacter = migrateCharacterToInventory(migratedCharacter);
  }

  // Apply domain migration if needed
  if (needsDomainMigration(migratedCharacter)) {
    migratedCharacter = migrateCharacterToSingleDomain(migratedCharacter);
  }

  return migratedCharacter;
};
