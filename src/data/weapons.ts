import { Weapon } from '@/types/character';

export const WEAPONS: Record<string, Weapon> = {
  'None': { domain: null, finesse: false, damage: 'd0', ap: 0, traits: [], weight: 0 },
  // Melee Weapons
  'Dagger': { domain: '1H', finesse: true, damage: 'd4', ap: 2, mightReq: 0, traits: ['Light', 'Quick Drawn', 'Range 3'], weight: 0.5 },
  'Arming Sword': { domain: '1H', finesse: false, damage: 'd6', ap: 2, mightReq: 0, traits: ['Light'], weight: 1.5 },
  'Mace': { domain: '1H', finesse: false, damage: 'd8', ap: 3, mightReq: 2, traits: [], weight: 2.5 },
  'Javelin': { domain: '1H', finesse: false, damage: 'd6', ap: 3, mightReq: 0, traits: ['Range 4', 'Quick Drawn'], weight: 1 },
  'Longspear': { domain: 'SaS', finesse: false, damage: 'd6', ap: 3, mightReq: 0, traits: ['SaS'], weight: 2 },
  'Longsword': { domain: '1H', finesse: false, damage: 'd8', ap: 3, mightReq: 1, traits: ['Heavy', 'Versatile'], weight: 2 },
  'Rapier': { domain: '1H', finesse: true, damage: 'd8', ap: 3, mightReq: 1, traits: ['Conduit'], weight: 1.5 },
  'Danish Axe': { domain: '2H', finesse: false, damage: 'd12', ap: 4, mightReq: 3, traits: ['Heavy', 'Large', 'Sweeping'], weight: 4 },
  'UberZweihander': { domain: '2H', finesse: false, damage: 'd12+1', ap: 4, mightReq: 4, traits: ['Heavy', 'Reach', 'Large'], weight: 6 },
  'Maul': { domain: '2H', finesse: false, damage: 'd10', ap: 4, mightReq: 2, traits: ['Nonlethal', 'Large', 'Heavy'], weight: 5 },
  'Greatsword': { domain: '2H', finesse: false, damage: 'd10', ap: 3, mightReq: 2, traits: ['Reach', 'Light'], weight: 3.5 },
  'War Staff': { domain: 'SaS', finesse: false, damage: 'd8', ap: 3, mightReq: 1, traits: ['SaS', 'Nonlethal', 'Conduit'], weight: 2 },
  'Quarterstaff': { domain: 'SaS', finesse: false, damage: 'd6', ap: 3, mightReq: 0, traits: ['SaS', 'Reach', 'Nonlethal', 'Conduit'], weight: 1.5 },
  'Pike': { domain: 'SaS', finesse: false, damage: 'd6', ap: 3, mightReq: 2, traits: ['SaS', 'Long Reach', 'Large'], weight: 3 },
  'SwordStaff': { domain: 'SaS', finesse: false, damage: 'd8', ap: 3, mightReq: 1, traits: ['SaS', 'Reach', 'Nonlethal', 'Double'], weight: 2.5 },
  // Ranged Weapons
  'Shortbow': { domain: 'Ar', finesse: false, damage: 'd8', ap: 3, mightReq: -1, traits: ['Aim 10', 'Range 5'], weight: 1 },
  'Longbow': { domain: 'Ar', finesse: false, damage: 'd10', ap: 3, mightReq: 0, traits: ['Aim 20', 'Large', 'Range 2'], weight: 1.5 }
};
