import { Character } from '@/types/character';
import type { Perk } from '@/types/perks';

export interface ValidationResult {
  canLearn: boolean;
  reasons: string[];
}

/**
 * Validate if a character can learn a perk based on requirements
 * MS5: Checks tier, skills, perks, and special requirements
 */
export const validatePerkRequirements = (
  character: Character,
  perk: Perk
): ValidationResult => {
  const reasons: string[] = [];

  // Check tier requirement (MS5)
  if (perk.requirements.tier) {
    // Tier requirements are checked by domain level
    // Combat perks check Martial domain, Magic perks check Spellcraft
    const requiredTier = perk.requirements.tier;
    const domainLevel = perk.type === 'magic'
      ? (character.weaponDomains.Spellcraft || 0)
      : (character.weaponDomains.Martial || 0);

    if (domainLevel < requiredTier) {
      const domainName = perk.type === 'magic' ? 'Spellcraft' : 'Martial';
      reasons.push(`Requires ${domainName} ${requiredTier} (have ${domainLevel})`);
    }
  }

  // Check skill requirements
  if (perk.requirements.skills) {
    for (const skillReq of perk.requirements.skills) {
      const match = skillReq.match(/^([A-Za-z\s]+)\s+(\d+)$/);
      if (match) {
        const skillName = match[1].trim();
        const requiredLevel = parseInt(match[2], 10);
        const skill = character.skills.find(s =>
          s.name.toLowerCase() === skillName.toLowerCase()
        );

        if (!skill || skill.level < requiredLevel) {
          const currentLevel = skill ? skill.level : 0;
          reasons.push(`Requires ${skillName} ${requiredLevel} (have ${currentLevel})`);
        }
      }
    }
  }

  // Check prerequisite perks
  if (perk.requirements.perks) {
    for (const prereq of perk.requirements.perks) {
      // Handle "X or Y" format
      if (prereq.includes(' or ')) {
        const options = prereq.split(' or ').map(s => s.trim().toLowerCase());
        const hasAny = options.some(opt =>
          character.perks.some(p => p.name.toLowerCase() === opt)
        );

        if (!hasAny) {
          reasons.push(`Requires one of: ${prereq}`);
        }
      } else {
        // Single perk requirement
        const hasPrereq = character.perks.some(p => p.name.toLowerCase() === prereq.toLowerCase());

        if (!hasPrereq) {
          reasons.push(`Requires perk: ${prereq}`);
        }
      }
    }
  }

  // Check special requirements (GM permission, etc.)
  if (perk.requirements.special) {
    for (const special of perk.requirements.special) {
      // We can't validate GM permission programmatically
      // Just note it as a warning, not a hard blocker
      if (special.toLowerCase().includes('gm') || special.toLowerCase().includes('permission')) {
        reasons.push(`Requires: ${special} (GM approval)`);
      }
    }
  }

  return {
    canLearn: reasons.filter(r => !r.includes('GM approval')).length === 0,
    reasons
  };
};

/**
 * Get a human-readable summary of why a perk can't be learned
 */
export const getRequirementSummary = (
  character: Character,
  perk: Perk
): string | null => {
  const result = validatePerkRequirements(character, perk);
  if (result.canLearn) return null;
  return result.reasons.join('\n');
};
