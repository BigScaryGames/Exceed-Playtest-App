import { WeaponDomain } from '@/types/character';

// Predefined perks database
// Each perk has its category (skill, combat, magic)

export interface PerkData {
  name: string;
  category: 'skill' | 'combat' | 'magic';
  cost: number;
  attribute: string;
  description: string;
  requirements?: string;
  // For combat perks
  domain?: WeaponDomain;
  apCost?: string;
}

export const PERKS: Record<string, PerkData> = {
  // MAGIC PERKS
  'Mage': {
    name: 'Mage',
    category: 'magic',
    cost: 5,
    attribute: 'Will',
    requirements: 'GM Permission',
    domain: 'Spell',
    description: `Everyone wants to bend reality to their will. Unlike most, you can, because you are a mage.

Perhaps you were trained by a journeyman or master mage, paid to try to awaken your talent. Or maybe, like most mages, during a pivotal moment in your life, your talent awakened.

You might have been a child lost in the darkness who summoned light or adapted your eyes to see in it, a pilgrim whose legs were so tired that all you wanted was for your backpack to become weightless or the mud less clingy, or maybe you saw your loved ones dying and willed their wounds to stop bleeding.

Mechanics:
• Select a Tier 0 spell. Add it to your repertoire. This spell doesn't contribute to attribute advancement.
• You unlock Tier 0 spells for learning.
• You can learn Team Ritual in one day with written guidance or in one hour with help from someone who knows it.
• This perk requires no time to learn, requires GM permission and the GM may decide to grant it to you at any given time.
• You can select this perk as a part of a background, but to unlock it in a controlled state GM might require Magical Theory 1/Theology 1 and a magical instructor (tier 2 or higher, at least legally).`
  },

  // COMBAT PERKS
  'Dodge-Roll': {
    name: 'Dodge-Roll',
    category: 'combat',
    cost: 10,
    attribute: 'Agility/Might',
    requirements: 'AG 3, Dodging Step',
    domain: '1H', // Universal perks can be assigned to any domain
    apCost: '2',
    description: `Use an acrobatic roll to avoid area attacks.

Effect:
An AOE is coming, and you know just the right thing. Fall prone in a space within 2 tiles away from you and gain +3 to the dodge attempt.

Short Description:
Use an acrobatic roll to avoid area attacks.`
  },

  // SKILL PERKS
  'Avid Gossiper': {
    name: 'Avid Gossiper',
    category: 'skill',
    cost: 5,
    attribute: 'Charisma',
    requirements: 'Gossip 2',
    description: `When gathering information through gossip, your interest in target subject remains hidden.

Effect:
When gathering information, you can choose to spend double the time to do so covertly. When you do, roll Gossip+5 against the highest level of target who is actively conducting counter intelligence.

As an Avid Gossiper you know that to gather what you need without being detected, you also need to Gossip about things that are completely irrelevant. By spending more time gossiping about different topics you can hide the topics you really gather information about.`
  }
};
