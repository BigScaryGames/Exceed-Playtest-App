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
  const extractFromPerk = (perkSnapshot: DatabasePerk | undefined, perkName: string, perkWithGrants?: any) => {
    // Fallback: if snapshot doesn't have grants field, try to look up the perk in the database
    let effectivePerk = perkSnapshot;
    if (!effectivePerk?.grants?.abilities && effectivePerk?.id) {
      // Try to find the perk in the database
      const allPerks = [
        ...perkDatabase.perks.combat,
        ...perkDatabase.perks.magic,
        ...perkDatabase.perks.skill
      ];
      effectivePerk = allPerks.find(p => p.id === effectivePerk!.id) || effectivePerk;
    }

    // Second fallback: try direct grants field on perk object (for old characters)
    if (!effectivePerk?.grants?.abilities && perkWithGrants?.grants?.abilities) {
      const abilityIds = perkWithGrants.grants.abilities;
      const inherited = inheritTags && effectivePerk ? getInheritedTags(effectivePerk) : [];
      for (const abilityId of abilityIds) {
        const ability = abilityLookup.get(abilityId);
        if (ability) {
          const mergedTags = inheritTags ? mergeTags(ability.tags, inherited) : ability.tags;
          if (!abilities.find(a => a.id === ability.id && a.sourcePerk === perkName)) {
            abilities.push({
              id: ability.id,
              name: ability.name,
              effect: ability.effect,
              tags: mergedTags,
              sourcePerk: perkName,
              sourcePerkId: effectivePerk?.id
            });
          }
        }
      }
      return;
    }

    if (!effectivePerk?.grants?.abilities) return;

    const inherited = inheritTags ? getInheritedTags(effectivePerk) : [];

    for (const abilityId of effectivePerk.grants.abilities) {
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
            sourcePerkId: effectivePerk!.id
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
    if (perk.isFlaw) continue; // Flaws don't grant abilities
    
    // For staged perks, get abilities from current stage
    if (perk.isStaged && perk.perkSnapshot?.grants?.byStage) {
      const stage = perk.perkSnapshot.grants.byStage.find(s => s.stage === perk.level);
      if (stage?.abilities) {
        const inherited = inheritTags ? getInheritedTags(perk.perkSnapshot) : [];
        for (const abilityId of stage.abilities) {
          const ability = abilityLookup.get(abilityId);
          if (ability) {
            const mergedTags = inheritTags ? mergeTags(ability.tags, inherited) : ability.tags;
            if (!abilities.find(a => a.id === ability.id && a.sourcePerk === perk.name)) {
              abilities.push({
                id: ability.id,
                name: ability.name,
                effect: ability.effect,
                tags: mergedTags,
                sourcePerk: perk.name,
                sourcePerkId: perk.perkSnapshot?.id
              });
            }
          }
        }
      }
    } else if (perk.perkSnapshot) {
      // Regular perk - use flat grants
      extractFromPerk(perk.perkSnapshot, perk.name, perk);
    }
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
  const extractFromPerk = (perkSnapshot: DatabasePerk | undefined, perkName: string, perkWithGrants?: any) => {
    // Fallback: if snapshot doesn't have grants field, try to look up the perk in the database
    let effectivePerk = perkSnapshot;
    if (!effectivePerk?.grants?.effects && effectivePerk?.id) {
      // Try to find the perk in the database
      const allPerks = [
        ...perkDatabase.perks.combat,
        ...perkDatabase.perks.magic,
        ...perkDatabase.perks.skill
      ];
      effectivePerk = allPerks.find(p => p.id === effectivePerk!.id) || effectivePerk;
    }

    // Second fallback: try direct grants field on perk object (for old characters)
    if (!effectivePerk?.grants?.effects && perkWithGrants?.grants?.effects) {
      const effectIds = perkWithGrants.grants.effects;
      const inherited = inheritTags && effectivePerk ? getInheritedTags(effectivePerk) : [];
      for (const effectId of effectIds) {
        const effect = effectLookup.get(effectId);
        if (effect) {
          const mergedTags = inheritTags ? mergeTags(effect.tags, inherited) : effect.tags;
          if (!effects.find(e => e.id === effect.id && e.sourcePerk === perkName)) {
            effects.push({
              id: effect.id,
              name: effect.name,
              effect: effect.effect,
              tags: mergedTags,
              sourcePerk: perkName,
              sourcePerkId: effectivePerk?.id
            });
          }
        }
      }
      return;
    }

    if (!effectivePerk?.grants?.effects) return;

    const inherited = inheritTags ? getInheritedTags(effectivePerk) : [];

    for (const effectId of effectivePerk.grants.effects) {
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
            sourcePerkId: effectivePerk!.id
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

  // Collect from all perks (unified array)
  for (const perk of character.perks) {
    if (perk.isFlaw) continue; // Flaws don't grant effects
    
    // For staged perks, get effects from current stage
    if (perk.isStaged && perk.perkSnapshot?.grants?.byStage) {
      const stage = perk.perkSnapshot.grants.byStage.find(s => s.stage === perk.level);
      if (stage?.effects) {
        const inherited = inheritTags ? getInheritedTags(perk.perkSnapshot) : [];
        for (const effectId of stage.effects) {
          const effect = effectLookup.get(effectId);
          if (effect) {
            const mergedTags = inheritTags ? mergeTags(effect.tags, inherited) : effect.tags;
            if (!effects.find(e => e.id === effect.id && e.sourcePerk === perk.name)) {
              effects.push({
                id: effect.id,
                name: effect.name,
                effect: effect.effect,
                tags: mergedTags,
                sourcePerk: perk.name,
                sourcePerkId: perk.perkSnapshot?.id
              });
            } else if (inheritTags) {
              const existing = effects.find(e => e.id === effect.id && e.sourcePerk === perk.name);
              if (existing) {
                existing.tags = mergeTags(existing.tags, inherited);
              }
            }
          }
        }
      }
    } else if (perk.perkSnapshot) {
      // Regular perk - use flat grants
      extractFromPerk(perk.perkSnapshot, perk.name, perk);
    }
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
