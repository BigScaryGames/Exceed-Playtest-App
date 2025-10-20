// Character Type Definitions for EXCEED RPG

import type { Perk as DatabasePerk, PerkSource } from './perks';

export type AttributeCode = 'MG' | 'EN' | 'AG' | 'DX' | 'WT' | 'WI' | 'PR' | 'CH';

export type WeaponDomain = '1H' | '2H' | 'SaS' | 'Sh' | 'Ar' | 'Spell';

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
  'Spell': number; // Spellcraft
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
  // New fields for database perk snapshot system
  id?: string; // Perk ID from database (e.g., "shield-rush")
  isCustom?: boolean; // True if custom perk, false if from database
  source?: PerkSource; // 'database', 'archived', or 'custom'
  perkSnapshot?: DatabasePerk; // Full snapshot of perk data from database
  addedAt?: number; // Timestamp when added to character
}

export interface CombatPerk {
  name: string;
  cost: number;
  domain: WeaponDomain;
  attribute: string;
  description: string;
  // New fields for database perk snapshot system
  id?: string; // Perk ID from database
  isCustom?: boolean; // True if custom perk, false if from database
  source?: PerkSource; // 'database', 'archived', or 'custom'
  perkSnapshot?: DatabasePerk; // Full snapshot of perk data from database
  addedAt?: number; // Timestamp when added to character
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
  type: 'skill' | 'perk' | 'combatPerk' | 'magicPerk' | 'extraHP' | 'extraWound' | 'spell';
  name?: string;
  level?: number;
  attribute?: string;
  cost: number;
  domain?: WeaponDomain;
  tier?: number; // For spells
  spellType?: 'basic' | 'advanced'; // For spells
  xpType?: 'combat' | 'social'; // Track which XP pool was used
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
  magicPerks: Perk[];
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
  // Magic System (new)
  knownSpells?: KnownSpell[];
  attunedSpells?: string[]; // Array of spell IDs currently attuned
  // Character notes and bio (new)
  bio?: string;
  notes?: string;
  reputation?: string;
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

// Magic System Types
export type SpellTier = 0 | 1 | 2 | 3 | 4 | 5;
export type SpellType = 'basic' | 'advanced';

export interface Spell {
  tier: SpellTier;
  type: SpellType;
  apCost: string; // e.g., "2", "R", "3", "1m"
  attributes: string; // e.g., "AG/WT", "EN/DX"
  limitCost: number; // 0 if no limit cost, otherwise the limit consumed
  traits: string[]; // e.g., ["Spell", "Offensive", "Strike"]
  effect: string; // Description of the effect
  distance: string; // e.g., "3m", "Touch", "10m"
  duration: string; // e.g., "Instant", "1 minute", "-"
  damage?: string; // e.g., "Spellcraft * 4d", optional for damage spells
}

export interface CustomSpellData {
  tier: SpellTier;
  type: SpellType;
  apCost: string;
  attributes: string;
  limitCost: number;
  traits: string[];
  effect: string;
  distance: string;
  duration: string;
  damage?: string;
}

export interface KnownSpell {
  id: string;
  name: string;
  tier: SpellTier;
  type: SpellType;
  isCustom: boolean;
  dataRef?: string; // Reference to spell in SPELLS database
  customSpellData?: CustomSpellData;
  xpCost: number; // XP paid to learn this spell
}
