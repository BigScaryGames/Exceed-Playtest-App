import { Weapon } from '@/types/character';

export const WEAPONS: Record<string, Weapon> = {
  'None': { finesse: false, damage: 'd0', ap: 0, traits: [], weight: 0 },
  // Melee Weapons
  'Dagger': { finesse: true, damage: 'd4', ap: 2, mightReq: 0, traits: ['1H', 'Light', 'Quick Drawn', 'Range 3'], weight: 0.5 },
  'Arming Sword': { finesse: false, damage: 'd6', ap: 2, mightReq: 0, traits: ['1H', 'Light'], weight: 1.5 },
  'Mace': { finesse: false, damage: 'd8', ap: 3, mightReq: 2, traits: ['1H'], weight: 2.5 },
  'Javelin': { finesse: false, damage: 'd6', ap: 3, mightReq: 0, traits: ['1H', 'Range 4', 'Quick Drawn'], weight: 1 },
  'Longspear': { finesse: false, damage: 'd6', ap: 3, mightReq: 0, traits: ['SaS'], weight: 2 },
  'Longsword': { finesse: false, damage: 'd8', ap: 3, mightReq: 1, traits: ['1H', 'Heavy', 'Versatile'], weight: 2 },
  'Rapier': { finesse: true, damage: 'd8', ap: 3, mightReq: 1, traits: ['1H', 'Conduit'], weight: 1.5 },
  'Danish Axe': { finesse: false, damage: 'd12', ap: 4, mightReq: 3, traits: ['2H', 'Heavy', 'Large', 'Sweeping'], weight: 4 },
  'UberZweihander': { finesse: false, damage: 'd12+1', ap: 4, mightReq: 4, traits: ['2H', 'Heavy', 'Reach', 'Large'], weight: 6 },
  'Maul': { finesse: false, damage: 'd10', ap: 4, mightReq: 2, traits: ['2H', 'Nonlethal', 'Large', 'Heavy'], weight: 5 },
  'Greatsword': { finesse: false, damage: 'd10', ap: 3, mightReq: 2, traits: ['2H', 'Reach', 'Light'], weight: 3.5 },
  'War Staff': { finesse: false, damage: 'd8', ap: 3, mightReq: 1, traits: ['SaS', 'Nonlethal', 'Conduit'], weight: 2 },
  'Quarterstaff': { finesse: false, damage: 'd6', ap: 3, mightReq: 0, traits: ['SaS', 'Reach', 'Nonlethal', 'Conduit'], weight: 1.5 },
  'Pike': { finesse: false, damage: 'd6', ap: 3, mightReq: 2, traits: ['SaS', 'Long Reach', 'Large'], weight: 3 },
  'SwordStaff': { finesse: false, damage: 'd8', ap: 3, mightReq: 1, traits: ['SaS', 'Reach', 'Nonlethal', 'Double'], weight: 2.5 },
  // Ranged Weapons
  'Shortbow': { finesse: false, damage: 'd8', ap: 3, mightReq: -1, traits: ['Ar', 'Aim 10', 'Range 5'], weight: 1 },
  'Longbow': { finesse: false, damage: 'd10', ap: 3, mightReq: 0, traits: ['Ar', 'Aim 20', 'Large', 'Range 2'], weight: 1.5 }
};
