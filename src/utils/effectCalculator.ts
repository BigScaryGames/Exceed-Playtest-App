/**
 * Effect Calculator Utility (MS5)
 * Collects active abilities and effects from character's owned perks
 * Supports tag inheritance from perks to granted abilities/effects
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

// Tags that can be inherited from perks to abilities/effects
const INHERITABLE_TAGS = ['Combat', 'Skill', 'Spellcraft'];

/**
 * Get inherited tags from a perk snapshot
 * Returns only #Combat, #Skill, #Spellcraft tags
 */
function getInheritedTags(perk: DatabasePerk | undefined): string[] {
  if (!perk?.tags) return [];
  return perk.tags.filter(tag => INHERITABLE_TAGS.includes(tag));
}

/**
 * Merge base tags with inherited tags, avoiding duplicates
 */
function mergeTags(baseTags: string[], inheritedTags: string[]): string[] {
  return [...new Set([...baseTags, ...inheritedTags])];
}

/**
 * Get all active abilities granted by character's owned perks
 * @param character - The character to get abilities for
 * @param perkDatabase - The perk database containing ability definitions
 * @param inheritTags - If true, merge #Combat, #Skill, #Spellcraft tags from granting perks (default: false)
 */
export function getActiveAbilities(
  character: Character,
  perkDatabase: PerkDatabase | null,
  inheritTags: boolean = false
): ActiveAbility[] {
  if (!perkDatabase) return [];

  const abilities: ActiveAbility[] = [];
  const abilityLookup = new Map(perkDatabase.abilities.map(a => [a.id, a]));

  // Helper to extract abilities from a perk snapshot
  const extractFromPerk = (perkSnapshot: DatabasePerk | undefined, perkName: string) => {
    if (!perkSnapshot?.grants?.abilities) return;

    const inherited = inheritTags ? getInheritedTags(perkSnapshot) : [];

    for (const abilityId of perkSnapshot.grants.abilities) {
      const ability = abilityLookup.get(abilityId);
      if (ability) {
        const mergedTags = inheritTags ? mergeTags(ability.tags, inherited) : ability.tags;

        // Avoid duplicates - if same ability from same perk already exists, skip
        if (!abilities.find(a => a.id === ability.id && a.sourcePerk === perkName)) {
          abilities.push({
            id: ability.id,
            name: ability.name,
            effect: ability.effect,
            tags: mergedTags,
            sourcePerk: perkName,
            sourcePerkId: perkSnapshot.id
          });
        } else if (inheritTags) {
          // If inheriting tags, merge tags into existing entry
          const existing = abilities.find(a => a.id === ability.id && a.sourcePerk === perkName);
          if (existing) {
            existing.tags = mergeTags(existing.tags, inherited);
          }
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
 * Get all active abilities with tag inheritance from granting perks
 * Convenience function that calls getActiveAbilities with inheritTags=true
 */
export function getActiveAbilitiesWithInheritedTags(
  character: Character,
  perkDatabase: PerkDatabase | null
): ActiveAbility[] {
  return getActiveAbilities(character, perkDatabase, true);
}

/**
 * Get all active effects granted by character's owned perks
 * @param character - The character to get effects for
 * @param perkDatabase - The perk database containing effect definitions
 * @param inheritTags - If true, merge #Combat, #Skill, #Spellcraft tags from granting perks (default: false)
 */
export function getActiveEffects(
  character: Character,
  perkDatabase: PerkDatabase | null,
  inheritTags: boolean = false
): ActiveEffect[] {
  if (!perkDatabase) return [];

  const effects: ActiveEffect[] = [];
  const effectLookup = new Map(perkDatabase.effects.map(e => [e.id, e]));

  // Helper to extract effects from a perk snapshot
  const extractFromPerk = (perkSnapshot: DatabasePerk | undefined, perkName: string) => {
    if (!perkSnapshot?.grants?.effects) return;

    const inherited = inheritTags ? getInheritedTags(perkSnapshot) : [];

    for (const effectId of perkSnapshot.grants.effects) {
      const effect = effectLookup.get(effectId);
      if (effect) {
        const mergedTags = inheritTags ? mergeTags(effect.tags, inherited) : effect.tags;

        // Avoid duplicates
        if (!effects.find(e => e.id === effect.id && e.sourcePerk === perkName)) {
          effects.push({
            id: effect.id,
            name: effect.name,
            effect: effect.effect,
            tags: mergedTags,
            sourcePerk: perkName,
            sourcePerkId: perkSnapshot.id
          });
        } else if (inheritTags) {
          // If inheriting tags, merge tags into existing entry
          const existing = effects.find(e => e.id === effect.id && e.sourcePerk === perkName);
          if (existing) {
            existing.tags = mergeTags(existing.tags, inherited);
          }
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
 * Get all active effects with tag inheritance from granting perks
 * Convenience function that calls getActiveEffects with inheritTags=true
 */
export function getActiveEffectsWithInheritedTags(
  character: Character,
  perkDatabase: PerkDatabase | null
): ActiveEffect[] {
  return getActiveEffects(character, perkDatabase, true);
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
 * Get abilities filtered by tag (with inherited tags)
 */
export function getAbilitiesByTag(
  character: Character,
  perkDatabase: PerkDatabase | null,
  tag: string
): ActiveAbility[] {
  const abilities = getActiveAbilitiesWithInheritedTags(character, perkDatabase);
  return abilities.filter(a => a.tags.includes(tag));
}

/**
 * Get effects filtered by tag (with inherited tags)
 */
export function getEffectsByTag(
  character: Character,
  perkDatabase: PerkDatabase | null,
  tag: string
): ActiveEffect[] {
  const effects = getActiveEffectsWithInheritedTags(character, perkDatabase);
  return effects.filter(e => e.tags.includes(tag));
}
