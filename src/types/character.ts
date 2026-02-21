// Character Type Definitions for EXCEED RPG

import type { Perk as DatabasePerk, PerkSource } from './perks';

export type AttributeCode = 'MG' | 'EN' | 'AG' | 'DX' | 'WT' | 'WI' | 'PR' | 'CH';

// MS5: Consolidated domains - all weapon types merged into Martial
export type WeaponDomain = 'Martial' | 'Spellcraft';

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

// MS5: Simplified to two domains
export interface WeaponDomains {
  Martial: number;    // All combat perks contribute here
  Spellcraft: number; // All magic perks and spells contribute here
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
  attribute: string;
  description: string;
  // New fields for database perk snapshot system
  id?: string; // Perk ID from database
  isCustom?: boolean; // True if custom perk, false if from database
  source?: PerkSource; // 'database', 'archived', or 'custom'
  perkSnapshot?: DatabasePerk; // Full snapshot of perk data from database
  addedAt?: number; // Timestamp when added to character
}

// MS5: Flaws (negative perks with negative XP cost)
export interface Flaw {
  name: string;
  xpValue: number;  // Negative XP granted (e.g., -5, -10, -15)
  attribute?: string;  // Optional attribute restriction
  description: string;
  id?: string;
  isCustom?: boolean;
  source?: 'database' | 'custom';
  perkSnapshot?: DatabasePerk;  // Reuse perk snapshot system
  addedAt?: number;
}

// MS5: Staged perks (conditioning perks with 5 levels)
export interface StagedPerkLevel {
  level: number;
  attribute: string;
  cost: number;
}

export interface StagedPerk {
  id: string;
  name: string;
  level: number;           // Current level 1-5
  attribute: string;       // Last attribute chosen
  levelHistory: StagedPerkLevel[];
  perkSnapshot?: DatabasePerk;
  addedAt?: number;
}


export interface Equipment {
  name: string;
  weight: number;
  quantity: number;
}

export interface ProgressionLogEntry {
  type: 'skill' | 'perk' | 'combatPerk' | 'magicPerk' | 'stagedPerk' | 'extraWound' | 'spell' | 'flaw';
  name?: string;
  level?: number;
  attribute?: string;
  cost: number;  // Negative for flaws
  tier?: number; // For spells
  spellType?: 'basic' | 'advanced'; // For spells
  xpType?: 'combat' | 'social'; // Track which XP pool was used
  stagedLevel?: number; // For staged perks: which level was purchased
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
  flaws: Flaw[];  // MS5: Flaws (negative perks)
  equipment: Equipment[];
  customItems: Equipment[];
  progressionLog: ProgressionLogEntry[];
  weaponDomains: WeaponDomains;
  maxWounds: number;
  hpPerWound: number;
  armorType: string;
  equippedWeapon1: string;
  equippedWeapon2: string;
  equippedShield: string;
  currentStamina: number | null;
  currentHealth: number | null;
  markedWounds: number;
  woundsNotes?: string;
  extraWoundCount: number;
  // Unified Inventory System (new)
  inventory?: InventoryItem[]; // Optional for backward compatibility
  stowedWeightReduction?: number; // Weight reduction for stowed items (e.g., bag of holding)
  money?: number; // Currency/gold carried
  // Magic System (new)
  knownSpells?: KnownSpell[];
  attunedSpells?: string[]; // Array of spell IDs currently attuned
  // Character notes and bio (new)
  bio?: string;
  notes?: string;
  reputation?: string;
  // Timestamp tracking
  lastOpened?: number; // Timestamp when character was last opened
  // MS5: Staged perks (conditioning perks)
  stagedPerks?: StagedPerk[];
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
  domain: 'Martial' | null;  // MS5: All melee/ranged weapons use Martial domain
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
  domain: 'Martial' | null;
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

// MS5: Version data for basic/advanced spell variants
export interface SpellVersionData {
  limitCost: number | string;  // Can be "Self 0 / Party 1" format
  effect: string;
  distance?: string;
  damage?: string;
}

// MS5: Updated spell structure with separate basic/advanced versions
export interface Spell {
  id: string;
  name: string;
  tier: SpellTier;
  type: SpellType;  // Whether spell has advanced version
  apCost: string;   // e.g., "2", "R", "3", "1m", "-"
  attributes: string; // e.g., "AG/WT", "EN/DX"
  traits: string[];
  shortDescription: string;
  basic: SpellVersionData;
  advanced?: SpellVersionData;
  description?: string;
  duration?: string;
}

// Legacy spell format for backwards compatibility
export interface LegacySpell {
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
