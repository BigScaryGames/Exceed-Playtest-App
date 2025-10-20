/**
 * Perk Loader - Handles loading perks from bundled data with fallback logic
 */

import type { PerkDatabase, Perk } from '@/types/perks';

// Use import.meta.env.BASE_URL to get the correct base path (works with GitHub Pages)
const BUNDLED_PERKS_PATH = `${import.meta.env.BASE_URL}data/perks.json`;

/**
 * Load perks from the bundled JSON file
 * This is the primary fallback and offline-ready data source
 */
export async function loadBundledPerks(): Promise<PerkDatabase | null> {
  try {
    const response = await fetch(BUNDLED_PERKS_PATH);
    if (!response.ok) {
      console.error('Failed to load bundled perks:', response.statusText);
      return null;
    }
    const data = await response.json();
    return data as PerkDatabase;
  } catch (error) {
    console.error('Error loading bundled perks:', error);
    return null;
  }
}

/**
 * Get all perks from a database
 */
export function getAllPerks(database: PerkDatabase): Perk[] {
  return [
    ...database.perks.combat,
    ...database.perks.magic,
    ...database.perks.skill,
  ];
}

/**
 * Get perks by type
 */
export function getPerksByType(database: PerkDatabase, type: 'combat' | 'magic' | 'skill'): Perk[] {
  return database.perks[type];
}

/**
 * Find a perk by ID
 */
export function findPerkById(database: PerkDatabase, id: string): Perk | undefined {
  const allPerks = getAllPerks(database);
  return allPerks.find(perk => perk.id === id);
}

/**
 * Search perks by name, tags, or description
 */
export function searchPerks(database: PerkDatabase, query: string): Perk[] {
  const lowerQuery = query.toLowerCase();
  const allPerks = getAllPerks(database);

  return allPerks.filter(perk => {
    return (
      perk.name.toLowerCase().includes(lowerQuery) ||
      perk.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      perk.shortDescription.toLowerCase().includes(lowerQuery) ||
      perk.effect.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * Filter perks by tags
 */
export function filterPerksByTags(database: PerkDatabase, tags: string[]): Perk[] {
  const allPerks = getAllPerks(database);
  const lowerTags = tags.map(t => t.toLowerCase());

  return allPerks.filter(perk =>
    perk.tags.some(tag => lowerTags.includes(tag.toLowerCase()))
  );
}

/**
 * Filter perks by requirements (check if character meets requirements)
 */
export function filterPerksByRequirements(
  database: PerkDatabase,
  filter: {
    hasSkills?: string[];
    hasDomains?: string[];
    hasPerks?: string[];
  }
): Perk[] {
  const allPerks = getAllPerks(database);

  return allPerks.filter(perk => {
    // Check skill requirements
    if (perk.requirements.skills && filter.hasSkills) {
      const meetsSkillReqs = perk.requirements.skills.every(reqSkill => {
        // Parse requirement like "Medicine 2"
        const match = reqSkill.match(/^(\w+)\s+(\d+)$/);
        if (!match) return true; // If can't parse, assume met

        const [, skillName, levelStr] = match;
        const requiredLevel = parseInt(levelStr, 10);

        // Check if character has this skill at required level
        return filter.hasSkills!.some(charSkill => {
          const charMatch = charSkill.match(/^(\w+)\s+(\d+)$/);
          if (!charMatch) return false;

          const [, charSkillName, charLevelStr] = charMatch;
          const charLevel = parseInt(charLevelStr, 10);

          return (
            charSkillName.toLowerCase() === skillName.toLowerCase() &&
            charLevel >= requiredLevel
          );
        });
      });

      if (!meetsSkillReqs) return false;
    }

    // Check domain requirements
    if (perk.requirements.domains && filter.hasDomains) {
      const meetsDomainReqs = perk.requirements.domains.every(reqDomain => {
        // Parse requirement like "SH2"
        const match = reqDomain.match(/^([A-Z]+)(\d+)$/i);
        if (!match) return true;

        const [, domainCode, levelStr] = match;
        const requiredLevel = parseInt(levelStr, 10);

        return filter.hasDomains!.some(charDomain => {
          const charMatch = charDomain.match(/^([A-Z]+)(\d+)$/i);
          if (!charMatch) return false;

          const [, charDomainCode, charLevelStr] = charMatch;
          const charLevel = parseInt(charLevelStr, 10);

          return (
            charDomainCode.toLowerCase() === domainCode.toLowerCase() &&
            charLevel >= requiredLevel
          );
        });
      });

      if (!meetsDomainReqs) return false;
    }

    // Check perk prerequisites
    if (perk.requirements.perks && filter.hasPerks) {
      const meetsPerkReqs = perk.requirements.perks.every(reqPerk =>
        filter.hasPerks!.some(
          charPerk => charPerk.toLowerCase() === reqPerk.toLowerCase()
        )
      );

      if (!meetsPerkReqs) return false;
    }

    return true;
  });
}
