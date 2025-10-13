// Character Type Definitions for EXCEED RPG

export type AttributeCode = 'MG' | 'EN' | 'AG' | 'DX' | 'WT' | 'WI' | 'PR' | 'CH';

export type WeaponDomain = '1H' | '2H' | 'SaS' | 'Sh' | 'Ar';

export interface Stats {
  MG: number; // Might
  EN: number; // Endurance
  AG: number; // Agility
  DX: number; // Dexterity
  WT: number; // Wit
  WI: number; // Will
  PR: number; // Perception
  CH: number; // Charisma
}

export interface WeaponDomains {
  '1H': number;  // One Handed
  '2H': number;  // Two Handed
  'SaS': number; // Staves and Spears
  'Sh': number;  // Shield
  'Ar': number;  // Archery
}

export interface Skill {
  name: string;
  attributes: string;
  description: string;
  level: number;
  attributeHistory: string[];
}

export interface Perk {
  name: string;
  cost: number;
  attribute: string;
  description: string;
}

export interface CombatPerk {
  name: string;
  cost: number;
  domain: WeaponDomain;
  attribute: string;
  description: string;
}

export interface Equipment {
  name: string;
  weight: number;
  quantity: number;
}

export interface ExtraHPEntry {
  attribute: string;
  cost: number;
}

export interface ProgressionLogEntry {
  type: 'skill' | 'perk' | 'combatPerk' | 'extraHP' | 'extraWound';
  name?: string;
  level?: number;
  attribute?: string;
  cost: number;
  domain?: WeaponDomain;
}

export interface Character {
  name: string;
  concept: string;
  combatXP: number;
  socialXP: number;
  stats: Stats;
  skills: Skill[];
  perks: Perk[];
  combatPerks: CombatPerk[];
  equipment: Equipment[];
  customItems: Equipment[];
  progressionLog: ProgressionLogEntry[];
  weaponDomains: WeaponDomains;
  maxWounds: number;
  hpPerWound: number;
  extraHP: number;
  armorType: string;
  equippedWeapon1: string;
  equippedWeapon2: string;
  equippedShield: string;
  currentStamina: number | null;
  currentHealth: number | null;
  markedWounds: number;
  extraHPCount: number;
  extraHPHistory: ExtraHPEntry[];
  extraWoundCount: number;
  // Unified Inventory System (new)
  inventory?: InventoryItem[]; // Optional for backward compatibility
}

export interface ArmorType {
  bonus: number;
  mightReq: number;
  penalty: number;
  penaltyMet: number;
  weight: number;
}

export interface Shield {
  defenseBonus: number;
  negation: number;
  armorPenalty: number;
  mightReq: number;
  type: 'Light' | 'Medium' | 'Heavy';
  weight: number;
}

export interface Weapon {
  domain: WeaponDomain | null;
  finesse: boolean;
  damage: string;
  ap: number;
  mightReq?: number;
  traits: string[];
  weight: number;
}

export interface SkillDefinition {
  name: string;
  attributes: string;
  description: string;
}

export interface SkillCategory {
  [category: string]: SkillDefinition[];
}

// Unified Inventory System Types
export type ItemType = 'weapon' | 'armor' | 'shield' | 'item';
export type ItemState = 'equipped' | 'stowed' | 'packed';

export interface CustomWeaponData {
  domain: WeaponDomain;
  finesse: boolean;
  damage: string;
  ap: number;
  mightReq: number;
  traits: string[];
}

export interface CustomArmorData {
  bonus: number;
  mightReq: number;
  penalty: number;
  penaltyMet: number;
}

export interface CustomShieldData {
  defenseBonus: number;
  negation: number;
  armorPenalty: number;
  mightReq: number;
  type: 'Light' | 'Medium' | 'Heavy';
}

export interface InventoryItem {
  id: string;
  name: string;
  type: ItemType;
  state: ItemState;
  weight: number;
  quantity: number;
  isCustom: boolean;
  dataRef?: string; // Reference to item in WEAPONS, ARMOR_TYPES, or SHIELDS
  customWeaponData?: CustomWeaponData;
  customArmorData?: CustomArmorData;
  customShieldData?: CustomShieldData;
}
