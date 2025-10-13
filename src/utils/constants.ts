// Game Constants

// Attribute name mapping
export const ATTRIBUTE_MAP: Record<string, string> = {
  'MG': 'Might',
  'EN': 'Endurance',
  'AG': 'Agility',
  'DX': 'Dexterity',
  'WT': 'Wit',
  'WI': 'Will',
  'PR': 'Perception',
  'CH': 'Charisma'
};

// CP thresholds for attribute progression (CP → Attribute Value)
export const ATTRIBUTE_CP_THRESHOLDS = [10, 30, 60, 100, 150];

// Combat Perk CP thresholds for weapon domain levels
export const DOMAIN_CP_THRESHOLDS = [5, 15, 30, 50, 75];

// Skill progression costs (level * 2 CP)
export const getSkillCost = (level: number): number => level * 2;

// Extra HP cost (equal to current max wounds)
export const getExtraHPCost = (maxWounds: number): number => maxWounds;

// Encumbrance levels and penalties
export const ENCUMBRANCE_LEVELS = {
  NONE: { name: 'None', speedPenalty: 0, dodgePenalty: 0 },
  LIGHT: { name: 'Light', speedPenalty: -1, dodgePenalty: -1 },
  ENCUMBERED: { name: 'Encumbered', speedPenalty: -2, dodgePenalty: -2 },
  HEAVY: { name: 'Heavy Encumbered', speedPenalty: -3, dodgePenalty: -3 },
  OVER: { name: 'Over-Encumbered', speedPenalty: -4, dodgePenalty: -4 }
};
