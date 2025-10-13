import { ArmorType } from '@/types/character';

export const ARMOR_TYPES: Record<string, ArmorType> = {
  'None': { bonus: 0, mightReq: 0, penalty: 0, penaltyMet: 0, weight: 0 },
  'Scout': { bonus: 1, mightReq: 0, penalty: 0, penaltyMet: 0, weight: 5 },
  'Tactical': { bonus: 2, mightReq: 1, penalty: -1, penaltyMet: -1, weight: 10 },
  'Defensive': { bonus: 3, mightReq: 1, penalty: -2, penaltyMet: -2, weight: 15 },
  'Protective': { bonus: 4, mightReq: 2, penalty: -3, penaltyMet: -1, weight: 20 },
  'Bulwark': { bonus: 5, mightReq: 3, penalty: -4, penaltyMet: -1, weight: 30 },
  'Titanic': { bonus: 6, mightReq: 4, penalty: -5, penaltyMet: -2, weight: 45 },
  'Colossal': { bonus: 7, mightReq: 5, penalty: -6, penaltyMet: -2, weight: 65 },
  'Plot Armor': { bonus: 10, mightReq: 0, penalty: 0, penaltyMet: 0, weight: 0 }
};
