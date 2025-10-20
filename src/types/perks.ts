// Perk types for EXCEED RPG system

export type PerkType = 'combat' | 'magic' | 'skill';
export type PerkSource = 'database' | 'archived' | 'custom';

export interface PerkRequirements {
  text: string; // Original text from markdown
  skills?: string[]; // e.g., ["Medicine 2", "Biology 1"]
  domains?: string[]; // e.g., ["SH1", "OH2"]
  perks?: string[]; // Prerequisite perk names
  special?: string[]; // e.g., ["GM permission"]
}

export interface PerkCost {
  xp: number;
  variable: boolean; // True if cost uses formula like "Max_Wounds × level"
  formula?: string; // Only if variable is true
}

export interface Perk {
  id: string; // Kebab-case identifier from filename
  name: string; // Display name
  type: PerkType; // combat, magic, or skill
  source: PerkSource; // database, archived, or custom

  // Core perk data
  requirements: PerkRequirements;
  attributes: string[]; // e.g., ["Might", "Endurance", "Shield"]
  cost: PerkCost;
  apCost: number | null; // AP cost for combat perks, null for others
  tags: string[]; // e.g., ["Shield", "Combat", "Strike"]

  // Content sections
  shortDescription: string;
  effect: string;
  description?: string; // Flavor text (optional)

  // Metadata
  addedToCharacterAt?: number; // Timestamp when added to character
  snapshotVersion?: string; // Version/commit when snapshot was taken
}

export interface PerkDatabase {
  version: string; // Commit SHA or timestamp
  lastUpdated: number; // Unix timestamp
  perks: {
    combat: Perk[];
    magic: Perk[];
    skill: Perk[];
  };
}

export interface PerkCache {
  database: PerkDatabase;
  timestamp: number;
  expiresAt: number;
}

// Type guard
export function isPerkCustom(perk: Perk): boolean {
  return perk.source === 'custom';
}

export function isPerkArchived(perk: Perk): boolean {
  return perk.source === 'archived';
}

export function isPerkFromDatabase(perk: Perk): boolean {
  return perk.source === 'database';
}
