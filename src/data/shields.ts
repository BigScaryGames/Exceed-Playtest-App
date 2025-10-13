import { Shield } from '@/types/character';

export const SHIELDS: Record<string, Shield> = {
  'None': { defenseBonus: 0, negation: 0, armorPenalty: 0, mightReq: 0, type: 'Light', weight: 0 },
  'Buckler': { defenseBonus: 1, negation: 2, armorPenalty: 0, mightReq: 0, type: 'Light', weight: 0.5 },
  'Shield': { defenseBonus: 1, negation: 3, armorPenalty: 0, mightReq: 0, type: 'Medium', weight: 3 },
  'Kite Shield': { defenseBonus: 2, negation: 4, armorPenalty: 1, mightReq: 1, type: 'Medium', weight: 3 },
  'Tower Shield': { defenseBonus: 3, negation: 5, armorPenalty: 2, mightReq: 2, type: 'Heavy', weight: 6 },
  'Fortress Shield': { defenseBonus: 4, negation: 6, armorPenalty: 3, mightReq: 3, type: 'Heavy', weight: 8 }
};