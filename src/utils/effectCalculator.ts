/**
 * Effect Calculator Utility (MS5)
 * Collects active abilities and effects from character's owned perks
 */

import { Character } from '@/types/character';
import type { PerkDatabase, Perk as DatabasePerk } from '@/types/perks';

// Active ability with source tracking
export interface ActiveAbility {
  id: string;
  name: string;
  effect: string;
  tags: string[];
  sourcePerk: string;
  sourcePerkId?: string;
}

// Active effect with source tracking
export interface ActiveEffect {
  id: string;
  name: string;
  effect: string;
  tags: string[];
  sourcePerk: string;
  sourcePerkId?: string;
}

/**
 * Get all active abilities granted by character's owned perks
 */
export function getActiveAbilities(
  character: Character,
  perkDatabase: PerkDatabase | null
): ActiveAbility[] {
  if (!perkDatabase) return [];

  const abilities: ActiveAbility[] = [];
  const abilityLookup = new Map(perkDatabase.abilities.map(a => [a.id, a]));

  // Helper to extract abilities from a perk snapshot
  const extractFromPerk = (perkSnapshot: DatabasePerk | undefined, perkName: string) => {
    if (!perkSnapshot?.grants?.abilities) return;

    for (const abilityId of perkSnapshot.grants.abilities) {
      const ability = abilityLookup.get(abilityId);
      if (ability) {
        // Avoid duplicates
        if (!abilities.find(a => a.id === ability.id && a.sourcePerk === perkName)) {
          abilities.push({
            id: ability.id,
            name: ability.name,
            effect: ability.effect,
            tags: ability.tags,
            sourcePerk: perkName,
            sourcePerkId: perkSnapshot.id
          });
        }
      }
    }
  };

  // Collect from skill perks
  for (const perk of character.perks) {
    extractFromPerk(perk.perkSnapshot, perk.name);
  }

  // Collect from combat perks
  for (const perk of character.combatPerks) {
    extractFromPerk(perk.perkSnapshot, perk.name);
  }

  // Collect from magic perks
  for (const perk of (character.magicPerks || [])) {
    extractFromPerk(perk.perkSnapshot, perk.name);
  }

  // Collect from staged perks (conditioning perks in progress)
  for (const perk of (character.stagedPerks || [])) {
    extractFromPerk(perk.perkSnapshot, perk.name);
  }

  return abilities;
}

/**
 * Get all active effects granted by character's owned perks
 */
export function getActiveEffects(
  character: Character,
  perkDatabase: PerkDatabase | null
): ActiveEffect[] {
  if (!perkDatabase) return [];

  const effects: ActiveEffect[] = [];
  const effectLookup = new Map(perkDatabase.effects.map(e => [e.id, e]));

  // Helper to extract effects from a perk snapshot
  const extractFromPerk = (perkSnapshot: DatabasePerk | undefined, perkName: string) => {
    if (!perkSnapshot?.grants?.effects) return;

    for (const effectId of perkSnapshot.grants.effects) {
      const effect = effectLookup.get(effectId);
      if (effect) {
        // Avoid duplicates
        if (!effects.find(e => e.id === effect.id && e.sourcePerk === perkName)) {
          effects.push({
            id: effect.id,
            name: effect.name,
            effect: effect.effect,
            tags: effect.tags,
            sourcePerk: perkName,
            sourcePerkId: perkSnapshot.id
          });
        }
      }
    }
  };

  // Collect from skill perks
  for (const perk of character.perks) {
    extractFromPerk(perk.perkSnapshot, perk.name);
  }

  // Collect from combat perks
  for (const perk of character.combatPerks) {
    extractFromPerk(perk.perkSnapshot, perk.name);
  }

  // Collect from magic perks
  for (const perk of (character.magicPerks || [])) {
    extractFromPerk(perk.perkSnapshot, perk.name);
  }

  // Collect from staged perks (conditioning perks in progress)
  for (const perk of (character.stagedPerks || [])) {
    extractFromPerk(perk.perkSnapshot, perk.name);
  }

  return effects;
}

/**
 * Check if character has a specific ability by ID
 */
export function hasAbility(
  character: Character,
  perkDatabase: PerkDatabase | null,
  abilityId: string
): boolean {
  const abilities = getActiveAbilities(character, perkDatabase);
  return abilities.some(a => a.id === abilityId);
}

/**
 * Check if character has a specific effect by ID
 */
export function hasEffect(
  character: Character,
  perkDatabase: PerkDatabase | null,
  effectId: string
): boolean {
  const effects = getActiveEffects(character, perkDatabase);
  return effects.some(e => e.id === effectId);
}

/**
 * Get abilities filtered by tag
 */
export function getAbilitiesByTag(
  character: Character,
  perkDatabase: PerkDatabase | null,
  tag: string
): ActiveAbility[] {
  const abilities = getActiveAbilities(character, perkDatabase);
  return abilities.filter(a => a.tags.includes(tag));
}

/**
 * Get effects filtered by tag
 */
export function getEffectsByTag(
  character: Character,
  perkDatabase: PerkDatabase | null,
  tag: string
): ActiveEffect[] {
  const effects = getActiveEffects(character, perkDatabase);
  return effects.filter(e => e.tags.includes(tag));
}
