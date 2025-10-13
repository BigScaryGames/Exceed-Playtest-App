import { SkillCategory } from '@/types/character';

export const SKILL_DATABASE: SkillCategory = {
  'Social Skills': [
    { name: 'Dancing', attributes: 'Agility/Charisma', description: 'Formal and social dancing, grace in movement, social positioning through performance' },
    { name: 'Negotiating', attributes: 'Charisma/Wit', description: 'Making deals, bargaining, diplomatic solutions, finding win-win outcomes' },
    { name: 'Manipulation', attributes: 'Charisma/Will', description: 'Subtle influence, psychological pressure, making people think your ideas are theirs' },
    { name: 'Leadership', attributes: 'Charisma/Will', description: 'Inspiring groups, command presence, rallying others in crisis situations' },
    { name: 'Fast-talk', attributes: 'Charisma/Agility', description: 'Quick convincing, rapid lies and truths, overwhelming with words, time-pressure persuasion' },
    { name: 'Singing', attributes: 'Endurance/Charisma', description: 'Vocal performance, crowd entertainment, emotional resonance through music' },
    { name: 'Gossip', attributes: 'Charisma/Perception', description: 'Information gathering, rumor trading, social intelligence, reputation management' },
    { name: 'Intimidation', attributes: 'Charisma/Might', description: 'Coercion, demoralizing and otherwise using fear to adjust behavior of the adversary' },
    { name: 'Acting', attributes: 'Charisma/Will', description: 'Staying in the role, pretending to be someone else. This doesn\'t allow change of behavior, but used to enter and sustain a role' }
  ],
  'Athletic/Acrobatic Skills': [
    { name: 'Running', attributes: 'Agility/Endurance', description: 'Speed and endurance movement; choose Agility for sprinting/quick bursts or Endurance for long-distance running. Increases Speed as per speed rules' },
    { name: 'Climbing', attributes: 'Might/Agility', description: 'Scaling walls, cliffs, buildings; vertical movement and grip strength' },
    { name: 'Swimming', attributes: 'Endurance/Might', description: 'Aquatic movement, underwater endurance, water rescue' },
    { name: 'Jumping', attributes: 'Might/Agility', description: 'Explosive leg power, long jumps, high jumps, parkour leaps' },
    { name: 'Acrobatics', attributes: 'Agility/Dexterity', description: 'Tumbling, flips, balance, contortion, graceful movement, fall mitigation, tightrope walking, escaping bonds, squeezing through spaces' },
    { name: 'Lifting', attributes: 'Might/Endurance', description: 'Raw strength application, moving heavy objects, feats of strength' },
    { name: 'Breaking', attributes: 'Might/Wit', description: 'Destructive force application, knowing weak points, demolition work' }
  ],
  'Crafting Skills': [
    { name: 'Smithing', attributes: 'Might/Dexterity', description: 'Metalwork, jewelry, weapons, armor, tools' },
    { name: 'Woodworking', attributes: 'Dexterity/Wit', description: 'Carpentry, furniture, bows, wooden tools, construction' },
    { name: 'Textilework', attributes: 'Dexterity/Perception', description: 'Leatherworking, tailoring, rope-making, fabric crafts' },
    { name: 'Engineering', attributes: 'Wit/Perception', description: 'Designing complex interconnected mechanisms' }
  ],
  'Natural Sciences': [
    { name: 'Biology', attributes: 'Wit/Perception', description: 'Living organisms, anatomy, plant identification, natural remedies, organic poisons' },
    { name: 'Chemistry', attributes: 'Wit/Dexterity', description: 'Chemical processes, explosives, acids, synthetic compounds, material properties' },
    { name: 'Medicine', attributes: 'Wit/Dexterity', description: 'Healing, surgery, anatomy, practical medical treatment' }
  ],
  'Stealth/Criminal Skills': [
    { name: 'Stealth', attributes: 'Agility/Perception', description: 'Moving unseen, hiding, avoiding detection' },
    { name: 'Lockpicking', attributes: 'Dexterity/Perception', description: 'Bypassing mechanical and magical security, opening locked containers' },
    { name: 'Sleight of Hand', attributes: 'Dexterity/Agility', description: 'Pickpocketing, palming objects, manual dexterity tricks' }
  ],
  'Wilderness Skills': [
    { name: 'Survival', attributes: 'Endurance/Perception', description: 'Wilderness living, foraging, finding shelter and water' },
    { name: 'Tracking', attributes: 'Perception/Wit', description: 'Following trails, reading signs, hunting quarry' },
    { name: 'Navigation', attributes: 'Perception/Wit', description: 'Finding your way, reading maps, celestial navigation' }
  ],
  'Knowledge Skills': [
    { name: 'Arcane Lore', attributes: 'Wit/Will', description: 'Magic theory, spell identification, understanding magical phenomena' },
    { name: 'History', attributes: 'Wit/Will', description: 'Past events, cultures, legends, political knowledge' },
    { name: 'Theology', attributes: 'Will/Charisma', description: 'Divine knowledge, rituals, religious traditions' },
    { name: 'Streetwise', attributes: 'Charisma/Perception', description: 'Criminal underworld knowledge, black market connections' }
  ]
};
