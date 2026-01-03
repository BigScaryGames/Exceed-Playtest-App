import { Weapon } from '@/types/character';

// MS5: All weapons use 'Martial' domain (consolidated from 1H, 2H, SaS, Ar)
export const WEAPONS: Record<string, Weapon> = {
  'None': { domain: null, finesse: false, damage: 'd0', ap: 0, traits: [], weight: 0 },
  // Melee Weapons - One Handed
  'Dagger': { domain: 'Martial', finesse: true, damage: 'd4', ap: 2, mightReq: 0, traits: ['Light', 'Quick Drawn', 'Range 3', 'Blade'], weight: 0.5 },
  'Arming Sword': { domain: 'Martial', finesse: false, damage: 'd6', ap: 2, mightReq: 0, traits: ['Light', 'Blade'], weight: 1.5 },
  'Mace': { domain: 'Martial', finesse: false, damage: 'd8', ap: 3, mightReq: 2, traits: ['Impact'], weight: 2.5 },
  'Javelin': { domain: 'Martial', finesse: false, damage: 'd6', ap: 3, mightReq: 0, traits: ['Range 4', 'Quick Drawn', 'Thrown', 'Polearm'], weight: 1 },
  'Longsword': { domain: 'Martial', finesse: false, damage: 'd8', ap: 3, mightReq: 1, traits: ['Heavy', 'Versatile', 'Blade'], weight: 2 },
  'Rapier': { domain: 'Martial', finesse: true, damage: 'd8', ap: 3, mightReq: 1, traits: ['Conduit', 'Blade'], weight: 1.5 },
  // Melee Weapons - Two Handed
  'Danish Axe': { domain: 'Martial', finesse: false, damage: 'd12', ap: 4, mightReq: 3, traits: ['Heavy', 'Large', 'Sweeping', 'Axe'], weight: 4 },
  'UberZweihander': { domain: 'Martial', finesse: false, damage: 'd12+1', ap: 4, mightReq: 4, traits: ['Heavy', 'Reach', 'Large', 'Blade'], weight: 6 },
  'Maul': { domain: 'Martial', finesse: false, damage: 'd10', ap: 4, mightReq: 2, traits: ['Nonlethal', 'Large', 'Heavy', 'Impact'], weight: 5 },
  'Greatsword': { domain: 'Martial', finesse: false, damage: 'd10', ap: 3, mightReq: 2, traits: ['Reach', 'Light', 'Blade'], weight: 3.5 },
  // Melee Weapons - Polearms (SaS)
  'Longspear': { domain: 'Martial', finesse: false, damage: 'd6', ap: 3, mightReq: 0, traits: ['Polearm'], weight: 2 },
  'War Staff': { domain: 'Martial', finesse: false, damage: 'd8', ap: 3, mightReq: 1, traits: ['Polearm', 'Nonlethal', 'Conduit'], weight: 2 },
  'Quarterstaff': { domain: 'Martial', finesse: false, damage: 'd6', ap: 3, mightReq: 0, traits: ['Polearm', 'Reach', 'Nonlethal', 'Conduit'], weight: 1.5 },
  'Pike': { domain: 'Martial', finesse: false, damage: 'd6', ap: 3, mightReq: 2, traits: ['Polearm', 'Long Reach', 'Large'], weight: 3 },
  'SwordStaff': { domain: 'Martial', finesse: false, damage: 'd8', ap: 3, mightReq: 1, traits: ['Polearm', 'Reach', 'Nonlethal', 'Double'], weight: 2.5 },
  // Ranged Weapons
  'Shortbow': { domain: 'Martial', finesse: false, damage: 'd8', ap: 3, mightReq: -1, traits: ['Aim 10', 'Range 5', 'Ranged', 'Bow'], weight: 1 },
  'Longbow': { domain: 'Martial', finesse: false, damage: 'd10', ap: 3, mightReq: 0, traits: ['Aim 20', 'Large', 'Range 2', 'Ranged', 'Bow'], weight: 1.5 }
};
