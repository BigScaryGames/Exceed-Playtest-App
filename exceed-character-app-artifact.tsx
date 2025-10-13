import React, { useState, useEffect } from 'react';
import { User, Upload, Plus, ChevronDown, ChevronUp } from 'lucide-react';

// Armor database
const ARMOR_TYPES = {
  'None': { bonus: 0, mightReq: 0, penalty: 0, penaltyMet: 0 },
  'Scout': { bonus: 1, mightReq: 0, penalty: 0, penaltyMet: 0 },
  'Tactical': { bonus: 2, mightReq: 1, penalty: -1, penaltyMet: -1 },
  'Defensive': { bonus: 3, mightReq: 1, penalty: -2, penaltyMet: -2 },
  'Protective': { bonus: 4, mightReq: 2, penalty: -3, penaltyMet: -1 },
  'Bulwark': { bonus: 5, mightReq: 3, penalty: -4, penaltyMet: -1 },
  'Titanic': { bonus: 6, mightReq: 4, penalty: -5, penaltyMet: -2 },
  'Colossal': { bonus: 7, mightReq: 5, penalty: -6, penaltyMet: -2 },
  'Plot Armor': { bonus: 10, mightReq: 0, penalty: 0, penaltyMet: 0 }
};

// Weapon database
const WEAPONS = {
  'None': { domain: null, finesse: false, damage: 'd0', ap: 0, traits: [] },
  // Melee Weapons
  'Dagger': { domain: '1H', finesse: true, damage: 'd4', ap: 2, powerReq: 0, traits: ['Light', 'Quick Drawn', 'Range 3'] },
  'Arming Sword': { domain: '1H', finesse: false, damage: 'd6', ap: 2, powerReq: 0, traits: ['Light'] },
  'Mace': { domain: '1H', finesse: false, damage: 'd8', ap: 3, powerReq: 2, traits: [] },
  'Javelin': { domain: '1H', finesse: false, damage: 'd6', ap: 3, powerReq: 0, traits: ['Range 4', 'Quick Drawn'] },
  'Longspear': { domain: 'SaS', finesse: false, damage: 'd6', ap: 3, powerReq: 0, traits: ['SaS'] },
  'Longsword': { domain: '1H', finesse: false, damage: 'd8', ap: 3, powerReq: 1, traits: ['Heavy', 'Versatile'] },
  'Rapier': { domain: '1H', finesse: true, damage: 'd8', ap: 3, powerReq: 1, traits: ['Conduit'] },
  'Danish Axe': { domain: '2H', finesse: false, damage: 'd12', ap: 4, powerReq: 3, traits: ['Heavy', 'Large', 'Sweeping'] },
  'UberZweihander': { domain: '2H', finesse: false, damage: 'd12+1', ap: 4, powerReq: 4, traits: ['Heavy', 'Reach', 'Large'] },
  'Maul': { domain: '2H', finesse: false, damage: 'd10', ap: 4, powerReq: 2, traits: ['Nonlethal', 'Large', 'Heavy'] },
  'Greatsword': { domain: '2H', finesse: false, damage: 'd10', ap: 3, powerReq: 2, traits: ['Reach', 'Light'] },
  'War Staff': { domain: 'SaS', finesse: false, damage: 'd8', ap: 3, powerReq: 1, traits: ['SaS', 'Nonlethal', 'Conduit'] },
  'Quarterstaff': { domain: 'SaS', finesse: false, damage: 'd6', ap: 3, powerReq: 0, traits: ['SaS', 'Reach', 'Nonlethal', 'Conduit'] },
  'Pike': { domain: 'SaS', finesse: false, damage: 'd6', ap: 3, powerReq: 2, traits: ['SaS', 'Long Reach', 'Large'] },
  'SwordStaff': { domain: 'SaS', finesse: false, damage: 'd8', ap: 3, powerReq: 1, traits: ['SaS', 'Reach', 'Nonlethal', 'Double'] },
  // Ranged Weapons
  'Shortbow': { domain: 'Ar', finesse: false, damage: '4+Power', ap: 3, powerReq: -1, traits: ['Aim 10', 'Range 5'] },
  'Longbow': { domain: 'Ar', finesse: false, damage: '5+Power', ap: 3, powerReq: 0, traits: ['Aim 20', 'Large', 'Range 2'] }
};

// Skill database from the game
const SKILL_DATABASE = {
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

// Character data structure
const createEmptyCharacter = () => ({
  name: '',
  concept: '',
  combatXP: 0,
  socialXP: 0,
  stats: {
    MG: 0, EN: 0, AG: 0, DX: 0,
    WT: 0, WI: 0, PR: 0, CH: 0
  },
  skills: [],
  perks: [],
  combatPerks: [],      // Combat perks with domain selections
  equipment: [],
  customItems: [],      // User-added items with name, weight, and quantity
  progressionLog: [],
  // Weapon Domains
  weaponDomains: {
    '1H': 0,    // One Handed
    '2H': 0,    // Two Handed
    'SaS': 0,   // Staves and Spears
    'Sh': 0,    // Shield
    'Ar': 0     // Archery
  },
  // Combat stats
  maxWounds: 2,
  hpPerWound: 5,
  extraHP: 0,
  armorType: 'None',
  equippedWeapon1: 'None', // Primary weapon
  equippedWeapon2: 'None', // Secondary weapon/off-hand
  equippedShield: 'None',  // Shield
  currentStamina: null,
  currentHealth: null,
  markedWounds: 0,
  extraHPCount: 0,
  extraHPHistory: [],
  extraWoundCount: 0
});

// Character Header Component
function CharacterHeader({ character, onUpdateXP }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showXPModal, setShowXPModal] = useState(false);
  const [combatXPInput, setCombatXPInput] = useState('');
  const [socialXPInput, setSocialXPInput] = useState('');

  const handleAddXP = () => {
    const combat = parseInt(combatXPInput) || 0;
    const social = parseInt(socialXPInput) || 0;
    onUpdateXP(combat, social);
    setShowXPModal(false);
    setCombatXPInput('');
    setSocialXPInput('');
  };

  return (
    <>
      <div className="bg-black border-b border-slate-700">
        <div 
          className="p-4 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">{character.name}</h2>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <span className="text-xs font-semibold text-white">Combat</span>
                <span className="text-lg font-bold text-white">{character.combatXP}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs font-semibold text-white">Social</span>
                <span className="text-lg font-bold text-white">{character.socialXP}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowXPModal(true);
                }}
                className="bg-slate-700 hover:bg-slate-600 rounded-lg p-1.5"
              >
                <Plus size={16} />
              </button>
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>
        </div>

        <div 
          className="overflow-hidden transition-all duration-250 bg-slate-950"
          style={{ maxHeight: isExpanded ? '200px' : '0px' }}
        >
          <div className="grid grid-cols-4 gap-2 p-3">
            {Object.entries(character.stats).map(([stat, value]) => (
              <div key={stat} className="bg-slate-800 rounded px-2 py-1 flex justify-between items-center">
                <span className="text-xs font-semibold text-white">{stat}</span>
                <span className="text-base font-bold text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showXPModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => {
            setShowXPModal(false);
            setCombatXPInput('');
            setSocialXPInput('');
          }}
        >
          <div 
            className="bg-slate-800 rounded-lg p-6 min-w-[300px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4 text-center">Add Experience Points</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-white mb-2">Combat</label>
              <input
                type="number"
                value={combatXPInput}
                onChange={(e) => setCombatXPInput(e.target.value)}
                placeholder="Enter Combat XP"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-white mb-2">Social</label>
              <input
                type="number"
                value={socialXPInput}
                onChange={(e) => setSocialXPInput(e.target.value)}
                placeholder="Enter Social XP"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              />
            </div>
            
            <button
              onClick={handleAddXP}
              className="w-full bg-slate-700 hover:bg-slate-600 rounded py-2 mb-2 text-white font-semibold"
            >
              Okay
            </button>
            <button
              onClick={() => {
                setShowXPModal(false);
                setCombatXPInput('');
                setSocialXPInput('');
              }}
              className="w-full bg-slate-600 hover:bg-slate-500 rounded py-2 text-white font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Skills Tab Component
function SkillsTab({ character, onUpdate }) {
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [showAddPerkModal, setShowAddPerkModal] = useState(false);
  const [showEditPerkModal, setShowEditPerkModal] = useState(false);
  const [showAttributeSelectModal, setShowAttributeSelectModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [levelUpSkillIndex, setLevelUpSkillIndex] = useState(null);
  const [expandedSkillIndex, setExpandedSkillIndex] = useState(null);
  const [expandedPerkIndex, setExpandedPerkIndex] = useState(null);
  const [editingPerkIndex, setEditingPerkIndex] = useState(null);
  const [newPerk, setNewPerk] = useState({ name: '', cost: '', attribute: '', description: '' });

  // Attribute mapping
  const attributeMap = {
    'MG': 'Might',
    'EN': 'Endurance',
    'AG': 'Agility',
    'DX': 'Dexterity',
    'WT': 'Wit',
    'WI': 'Will',
    'PR': 'Perception',
    'CH': 'Charisma'
  };

  const handleSkillClick = (skillName, attributes, description) => {
    // Check if there's enough XP to learn a new skill (2 CP)
    if (character.socialXP >= 2) {
      setSelectedSkill({ name: skillName, attributes, description });
      setShowAddSkillModal(false);
      setShowAttributeSelectModal(true);
    }
  };

  const handleAttributeSelect = (attribute) => {
    // Adding a new skill
    if (levelUpSkillIndex === null) {
      const cost = 2; // Level 1 costs 2 XP
      
      const newSkill = { 
        name: selectedSkill.name, 
        attributes: selectedSkill.attributes,
        description: selectedSkill.description,
        level: 1,
        attributeHistory: [attribute]
      };
      
      onUpdate({
        ...character,
        skills: [...character.skills, newSkill],
        socialXP: character.socialXP - cost,
        progressionLog: [...character.progressionLog, {
          type: 'skill',
          name: selectedSkill.name,
          level: 1,
          attribute: attribute,
          cost: cost
        }]
      });
    } 
    // Leveling up existing skill
    else {
      const skill = character.skills[levelUpSkillIndex];
      const newLevel = skill.level + 1;
      const cost = newLevel * 2; // Level 2=4, Level 3=6, Level 4=8, Level 5=10
      
      const updatedSkill = {
        ...skill,
        level: newLevel,
        attributeHistory: [...skill.attributeHistory, attribute]
      };
      const updatedSkills = [...character.skills];
      updatedSkills[levelUpSkillIndex] = updatedSkill;
      
      onUpdate({
        ...character,
        skills: updatedSkills,
        socialXP: character.socialXP - cost,
        progressionLog: [...character.progressionLog, {
          type: 'skill',
          name: skill.name,
          level: newLevel,
          attribute: attribute,
          cost: cost
        }]
      });
    }
    
    setShowAttributeSelectModal(false);
    setSelectedSkill(null);
    setLevelUpSkillIndex(null);
  };

  const toggleSkillExpand = (index) => {
    setExpandedSkillIndex(expandedSkillIndex === index ? null : index);
  };

  const handleSkillLevelUp = (index) => {
    const skill = character.skills[index];
    const cost = (skill.level + 1) * 2;
    
    // Check if there's enough XP
    if (character.socialXP >= cost) {
      setSelectedSkill({ 
        name: skill.name, 
        attributes: skill.attributes, 
        description: skill.description 
      });
      setLevelUpSkillIndex(index);
      setShowAttributeSelectModal(true);
    }
  };

  const handleSkillLevelDown = (index) => {
    const skill = character.skills[index];
    if (skill.level > 1) {
      const cost = skill.level * 2; // Refund the cost of current level
      
      const updatedSkill = {
        ...skill,
        level: skill.level - 1,
        attributeHistory: skill.attributeHistory.slice(0, -1)
      };
      const updatedSkills = [...character.skills];
      updatedSkills[index] = updatedSkill;
      
      // Remove the last matching progression entry for this skill
      const updatedLog = [...character.progressionLog];
      for (let i = updatedLog.length - 1; i >= 0; i--) {
        if (updatedLog[i].type === 'skill' && 
            updatedLog[i].name === skill.name) {
          updatedLog.splice(i, 1);
          break;
        }
      }
      
      onUpdate({
        ...character,
        skills: updatedSkills,
        socialXP: character.socialXP + cost,
        progressionLog: updatedLog
      });
    }
  };

  const handleAddPerk = () => {
    const cost = parseInt(newPerk.cost);
    if (newPerk.name.trim() && cost && newPerk.attribute && character.socialXP >= cost) {
      const perkData = {
        name: newPerk.name.trim(),
        cost: cost,
        attribute: newPerk.attribute,
        description: newPerk.description.trim()
      };
      
      onUpdate({
        ...character,
        perks: [...character.perks, perkData],
        socialXP: character.socialXP - cost,
        progressionLog: [...character.progressionLog, {
          type: 'perk',
          name: perkData.name,
          attribute: perkData.attribute,
          cost: perkData.cost
        }]
      });
      setNewPerk({ name: '', cost: '', attribute: '', description: '' });
      setShowAddPerkModal(false);
    }
  };

  const handleEditPerk = () => {
    const cost = parseInt(newPerk.cost);
    const oldPerk = character.perks[editingPerkIndex];
    const costDifference = cost - oldPerk.cost;
    
    if (newPerk.name.trim() && cost && newPerk.attribute && character.socialXP >= costDifference) {
      const updatedPerk = {
        name: newPerk.name.trim(),
        cost: cost,
        attribute: newPerk.attribute,
        description: newPerk.description.trim()
      };
      
      const updatedPerks = [...character.perks];
      updatedPerks[editingPerkIndex] = updatedPerk;
      
      // Update progression log - remove old entry and add new one
      const updatedLog = character.progressionLog.filter(entry => 
        !(entry.type === 'perk' && entry.name === oldPerk.name && entry.cost === oldPerk.cost)
      );
      
      onUpdate({
        ...character,
        perks: updatedPerks,
        socialXP: character.socialXP - costDifference,
        progressionLog: [...updatedLog, {
          type: 'perk',
          name: updatedPerk.name,
          attribute: updatedPerk.attribute,
          cost: updatedPerk.cost
        }]
      });
      
      setNewPerk({ name: '', cost: '', attribute: '', description: '' });
      setEditingPerkIndex(null);
      setShowEditPerkModal(false);
    }
  };

  const handleDeletePerk = (index) => {
    const perk = character.perks[index];
    const updatedPerks = character.perks.filter((_, i) => i !== index);
    
    // Remove from progression log - find the most recent matching entry
    const updatedLog = [...character.progressionLog];
    for (let i = updatedLog.length - 1; i >= 0; i--) {
      if (updatedLog[i].type === 'perk' && 
          updatedLog[i].name === perk.name && 
          updatedLog[i].cost === perk.cost &&
          updatedLog[i].attribute === perk.attribute) {
        updatedLog.splice(i, 1);
        break;
      }
    }
    
    onUpdate({
      ...character,
      perks: updatedPerks,
      socialXP: character.socialXP + perk.cost,
      progressionLog: updatedLog
    });
    
    setExpandedPerkIndex(null);
  };

  const togglePerkExpand = (index) => {
    setExpandedPerkIndex(expandedPerkIndex === index ? null : index);
  };

  const openEditPerkModal = (index) => {
    const perk = character.perks[index];
    setNewPerk({
      name: perk.name,
      cost: perk.cost.toString(),
      attribute: perk.attribute,
      description: perk.description || ''
    });
    setEditingPerkIndex(index);
    setShowEditPerkModal(true);
  };

  // Get available skills (not already learned)
  const getAvailableSkills = () => {
    const learnedSkillNames = character.skills.map(s => s.name);
    const available = {};
    
    Object.entries(SKILL_DATABASE).forEach(([category, skills]) => {
      const availableInCategory = skills.filter(skill => !learnedSkillNames.includes(skill.name));
      if (availableInCategory.length > 0) {
        available[category] = availableInCategory;
      }
    });
    
    return available;
  };

  const availableSkills = getAvailableSkills();

  return (
    <>
      <div className="p-4 space-y-6">
        {/* Skills Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-bold text-white">Skills</h3>
            <button
              onClick={() => setShowAddSkillModal(true)}
              className="bg-slate-700 hover:bg-slate-600 rounded-lg p-1.5"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-2">
            {character.skills.map((skill, index) => (
              <div key={index} className="bg-slate-800 rounded overflow-hidden">
                <div 
                  className="p-3 cursor-pointer hover:bg-slate-750 transition-colors"
                  onClick={() => toggleSkillExpand(index)}
                >
                  <span className="text-white font-medium">{skill.name}[{skill.level}]</span>
                  <span className="text-slate-400 text-sm ml-2">
                    ({skill.attributes})
                  </span>
                </div>
                {expandedSkillIndex === index && (
                  <div className="px-3 pb-3 border-t border-slate-700">
                    <p className="text-slate-300 text-sm mt-2 mb-3">{skill.description}</p>
                    
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-slate-400 mb-1">Attribute History:</div>
                      <div className="flex flex-wrap gap-1">
                        {skill.attributeHistory.map((attr, i) => (
                          <span key={i} className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded">
                            Lvl {i + 1}: {attr}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSkillLevelUp(index);
                        }}
                        disabled={skill.level >= 5 || character.socialXP < (skill.level + 1) * 2}
                        className={`flex-1 rounded py-2 text-white font-semibold flex items-center justify-center gap-1 ${
                          skill.level >= 5 || character.socialXP < (skill.level + 1) * 2
                            ? 'bg-slate-600 cursor-not-allowed opacity-50'
                            : 'bg-green-700 hover:bg-green-600'
                        }`}
                      >
                        <Plus size={16} />
                        Level Up [{(skill.level + 1) * 2} XP]
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSkillLevelDown(index);
                        }}
                        disabled={skill.level <= 1}
                        className={`flex-1 rounded py-2 text-white font-semibold flex items-center justify-center gap-1 ${
                          skill.level <= 1 
                            ? 'bg-slate-600 cursor-not-allowed opacity-50' 
                            : 'bg-red-700 hover:bg-red-600'
                        }`}
                      >
                        <span className="text-lg leading-none">−</span>
                        Level Down [{skill.level * 2} XP]
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-slate-700" />

        {/* Perks Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-bold text-white">Perks</h3>
            <button
              onClick={() => setShowAddPerkModal(true)}
              className="bg-slate-700 hover:bg-slate-600 rounded-lg p-1.5"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-2">
            {character.perks.map((perk, index) => (
              <div key={index} className="bg-slate-800 rounded overflow-hidden">
                <div 
                  className="p-3 cursor-pointer hover:bg-slate-750 transition-colors"
                  onClick={() => togglePerkExpand(index)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-white font-medium">{perk.name}</span>
                      <div className="text-sm mt-1">
                        <span className="text-green-400">{perk.cost} CP</span>
                        <span className="text-slate-400 mx-2">•</span>
                        <span className="text-blue-400">{perk.attribute}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {expandedPerkIndex === index && (
                  <div className="px-3 pb-3 border-t border-slate-700">
                    {perk.description && (
                      <p className="text-slate-300 text-sm mt-2 mb-3">{perk.description}</p>
                    )}
                    
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditPerkModal(index);
                        }}
                        className="flex-1 bg-blue-700 hover:bg-blue-600 rounded py-2 text-white font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePerk(index);
                        }}
                        className="flex-1 bg-red-700 hover:bg-red-600 rounded py-2 text-white font-semibold"
                      >
                        Delete (Refund {perk.cost} CP)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Skill Modal - Skill Selection */}
      {showAddSkillModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddSkillModal(false)}
        >
          <div 
            className="bg-slate-800 rounded-lg max-w-2xl w-full flex flex-col"
            style={{ maxHeight: '80vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white p-6 pb-4 text-center flex-shrink-0">
              Add New Skill
              <div className="text-sm text-slate-400 font-normal mt-1">
                Available Social XP: {character.socialXP} CP
              </div>
              {character.socialXP < 2 && (
                <div className="text-sm text-red-400 font-normal">Need 2 CP to learn a skill</div>
              )}
            </h3>
            
            <div className="overflow-y-auto px-6 flex-1" style={{ minHeight: 0 }}>
              {Object.keys(availableSkills).length === 0 ? (
                <p className="text-slate-400 text-center py-8">All skills learned!</p>
              ) : (
                <div className="space-y-4 pb-4">
                  {Object.entries(availableSkills).map(([category, skills]) => (
                    <div key={category}>
                      <h4 className="text-sm font-semibold text-slate-400 mb-2 sticky top-0 bg-slate-800 py-1">{category}</h4>
                      <div className="space-y-2">
                        {skills.map((skill) => (
                          <button
                            key={skill.name}
                            onClick={() => handleSkillClick(skill.name, skill.attributes, skill.description)}
                            disabled={character.socialXP < 2}
                            className={`w-full rounded p-3 text-left transition-colors ${
                              character.socialXP < 2
                                ? 'bg-slate-700 opacity-50 cursor-not-allowed'
                                : 'bg-slate-700 hover:bg-slate-600'
                            }`}
                          >
                            <div className="text-white font-medium">{skill.name}</div>
                            <div className="text-slate-400 text-sm">{skill.attributes}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 pt-4 border-t border-slate-700 flex-shrink-0">
              <button
                onClick={() => setShowAddSkillModal(false)}
                className="w-full bg-slate-600 hover:bg-slate-500 rounded py-2 text-white font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Perk Modal */}
      {showAddPerkModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowAddPerkModal(false);
            setNewPerk({ name: '', cost: '', attribute: '', description: '' });
          }}
        >
          <div 
            className="bg-slate-800 rounded-lg p-6 min-w-[350px] max-w-[500px] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4 text-center">
              Add New Perk
              <div className="text-sm text-slate-400 font-normal mt-1">
                Available Social XP: {character.socialXP} CP
              </div>
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-white mb-2">Perk Name</label>
              <input
                type="text"
                value={newPerk.name}
                onChange={(e) => setNewPerk({...newPerk, name: e.target.value})}
                placeholder="Enter perk name"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-white mb-2">Cost (CP)</label>
              <input
                type="number"
                value={newPerk.cost}
                onChange={(e) => setNewPerk({...newPerk, cost: e.target.value})}
                placeholder="Enter CP cost"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-white mb-2">
                Attribute {newPerk.attribute && <span className="text-blue-400">({newPerk.attribute})</span>}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(attributeMap).map(([abbr, full]) => (
                  <button
                    key={abbr}
                    onClick={() => setNewPerk({...newPerk, attribute: full})}
                    className={`py-2 rounded font-semibold transition-colors ${
                      newPerk.attribute === full
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    {abbr}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-white mb-2">Description (Optional)</label>
              <textarea
                value={newPerk.description}
                onChange={(e) => setNewPerk({...newPerk, description: e.target.value})}
                placeholder="Enter perk description"
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white resize-none"
              />
            </div>
            
            <button
              onClick={handleAddPerk}
              disabled={!newPerk.name.trim() || !newPerk.cost || !newPerk.attribute || character.socialXP < parseInt(newPerk.cost || 0)}
              className={`w-full rounded py-2 mb-2 text-white font-semibold ${
                !newPerk.name.trim() || !newPerk.cost || !newPerk.attribute || character.socialXP < parseInt(newPerk.cost || 0)
                  ? 'bg-slate-600 cursor-not-allowed opacity-50'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              {!newPerk.name.trim() || !newPerk.cost || !newPerk.attribute 
                ? 'Add' 
                : character.socialXP < parseInt(newPerk.cost || 0)
                  ? 'Not Enough XP'
                  : 'Add'}
            </button>
            <button
              onClick={() => {
                setShowAddPerkModal(false);
                setNewPerk({ name: '', cost: '', attribute: '', description: '' });
              }}
              className="w-full bg-slate-600 hover:bg-slate-500 rounded py-2 text-white font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Perk Modal */}
      {showEditPerkModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowEditPerkModal(false);
            setEditingPerkIndex(null);
            setNewPerk({ name: '', cost: '', attribute: '', description: '' });
          }}
        >
          <div 
            className="bg-slate-800 rounded-lg p-6 min-w-[350px] max-w-[500px] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4 text-center">
              Edit Perk
              <div className="text-sm text-slate-400 font-normal mt-1">
                Current: {character.perks[editingPerkIndex].cost} CP → New: {newPerk.cost || 0} CP
                <br/>
                Available Social XP: {character.socialXP} CP
              </div>
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-white mb-2">Perk Name</label>
              <input
                type="text"
                value={newPerk.name}
                onChange={(e) => setNewPerk({...newPerk, name: e.target.value})}
                placeholder="Enter perk name"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-white mb-2">Cost (CP)</label>
              <input
                type="number"
                value={newPerk.cost}
                onChange={(e) => setNewPerk({...newPerk, cost: e.target.value})}
                placeholder="Enter CP cost"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-white mb-2">
                Attribute {newPerk.attribute && <span className="text-blue-400">({newPerk.attribute})</span>}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(attributeMap).map(([abbr, full]) => (
                  <button
                    key={abbr}
                    onClick={() => setNewPerk({...newPerk, attribute: full})}
                    className={`py-2 rounded font-semibold transition-colors ${
                      newPerk.attribute === full
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    {abbr}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-white mb-2">Description (Optional)</label>
              <textarea
                value={newPerk.description}
                onChange={(e) => setNewPerk({...newPerk, description: e.target.value})}
                placeholder="Enter perk description"
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white resize-none"
              />
            </div>
            
            <button
              onClick={handleEditPerk}
              disabled={!newPerk.name.trim() || !newPerk.cost || !newPerk.attribute || character.socialXP < (parseInt(newPerk.cost || 0) - character.perks[editingPerkIndex].cost)}
              className={`w-full rounded py-2 mb-2 text-white font-semibold ${
                !newPerk.name.trim() || !newPerk.cost || !newPerk.attribute || character.socialXP < (parseInt(newPerk.cost || 0) - character.perks[editingPerkIndex].cost)
                  ? 'bg-slate-600 cursor-not-allowed opacity-50'
                  : 'bg-blue-700 hover:bg-blue-600'
              }`}
            >
              {!newPerk.name.trim() || !newPerk.cost || !newPerk.attribute 
                ? 'Save Changes' 
                : character.socialXP < (parseInt(newPerk.cost || 0) - character.perks[editingPerkIndex].cost)
                  ? 'Not Enough XP'
                  : 'Save Changes'}
            </button>
            <button
              onClick={() => {
                setShowEditPerkModal(false);
                setEditingPerkIndex(null);
                setNewPerk({ name: '', cost: '', attribute: '', description: '' });
              }}
              className="w-full bg-slate-600 hover:bg-slate-500 rounded py-2 text-white font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Attribute Selection Modal */}
      {showAttributeSelectModal && selectedSkill && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => {
            setShowAttributeSelectModal(false);
            setSelectedSkill(null);
            setLevelUpSkillIndex(null);
          }}
        >
          <div 
            className="bg-slate-800 rounded-lg p-6 min-w-[350px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-2 text-center">{selectedSkill.name}</h3>
            <p className="text-slate-400 text-sm mb-2 text-center">
              {levelUpSkillIndex !== null 
                ? `Level ${character.skills[levelUpSkillIndex].level} → ${character.skills[levelUpSkillIndex].level + 1}: Select attribute to improve:`
                : 'Select which attribute to apply points to:'}
            </p>
            <p className="text-slate-400 text-xs mb-4 text-center">
              Cost: {levelUpSkillIndex !== null ? (character.skills[levelUpSkillIndex].level + 1) * 2 : 2} XP
              <span className="ml-2">
                ({character.socialXP} → {character.socialXP - (levelUpSkillIndex !== null ? (character.skills[levelUpSkillIndex].level + 1) * 2 : 2)} Social XP)
              </span>
            </p>
            
            <div className="space-y-2 mb-4">
              {selectedSkill.attributes.split('/').map((attr) => (
                <button
                  key={attr}
                  onClick={() => handleAttributeSelect(attr)}
                  className="w-full bg-slate-700 hover:bg-slate-600 rounded py-3 text-white font-semibold transition-colors"
                >
                  {attr}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => {
                setShowAttributeSelectModal(false);
                setSelectedSkill(null);
                if (levelUpSkillIndex !== null) {
                  setLevelUpSkillIndex(null);
                } else {
                  setShowAddSkillModal(true);
                }
              }}
              className="w-full bg-slate-600 hover:bg-slate-500 rounded py-2 mt-4 text-white font-semibold"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Combat Tab Component
function CombatTab({ character, onUpdate }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartHP, setDragStartHP] = useState(0);
  const [showExtraHPAttributeModal, setShowExtraHPAttributeModal] = useState(false);
  const [showAddCombatPerkModal, setShowAddCombatPerkModal] = useState(false);
  const [expandedCombatPerkIndex, setExpandedCombatPerkIndex] = useState(null);
  const [newCombatPerk, setNewCombatPerk] = useState({ name: '', cost: '', domain: '', attribute: '', description: '' });

  // Attribute mapping
  const attributeMap = {
    'MG': 'Might',
    'EN': 'Endurance',
    'AG': 'Agility',
    'DX': 'Dexterity',
    'WT': 'Wit',
    'WI': 'Will',
    'PR': 'Perception',
    'CH': 'Charisma'
  };

  const domainNames = {
    '1H': 'One-Handed',
    '2H': 'Two-Handed',
    'SaS': 'Staves & Spears',
    'Sh': 'Shield',
    'Ar': 'Archery'
  };

  const handleAddCombatPerk = () => {
    const cost = parseInt(newCombatPerk.cost);
    if (newCombatPerk.name.trim() && cost && newCombatPerk.domain && newCombatPerk.attribute && character.combatXP >= cost) {
      const perkData = {
        name: newCombatPerk.name.trim(),
        cost: cost,
        domain: newCombatPerk.domain,
        attribute: newCombatPerk.attribute,
        description: newCombatPerk.description.trim()
      };
      
      // Calculate new domain level based on cumulative XP
      const currentDomainXP = character.progressionLog
        .filter(entry => entry.type === 'combatPerk' && entry.domain === newCombatPerk.domain)
        .reduce((sum, entry) => sum + (entry.cost || 0), 0);
      const newDomainXP = currentDomainXP + cost;
      
      // Domain thresholds: 5/15/30/50/75
      let newLevel = 0;
      if (newDomainXP >= 75) newLevel = 5;
      else if (newDomainXP >= 50) newLevel = 4;
      else if (newDomainXP >= 30) newLevel = 3;
      else if (newDomainXP >= 15) newLevel = 2;
      else if (newDomainXP >= 5) newLevel = 1;
      
      const newDomains = { ...character.weaponDomains };
      newDomains[newCombatPerk.domain] = newLevel;
      
      onUpdate({
        ...character,
        combatPerks: [...character.combatPerks, perkData],
        weaponDomains: newDomains,
        combatXP: character.combatXP - cost,
        progressionLog: [...character.progressionLog, {
          type: 'combatPerk',
          name: perkData.name,
          domain: perkData.domain,
          attribute: perkData.attribute,
          cost: perkData.cost
        }]
      });
      setNewCombatPerk({ name: '', cost: '', domain: '', attribute: '', description: '' });
      setShowAddCombatPerkModal(false);
    }
  };

  const toggleCombatPerkExpand = (index) => {
    setExpandedCombatPerkIndex(expandedCombatPerkIndex === index ? null : index);
  };

  const handleDeleteCombatPerk = (index) => {
    const perk = character.combatPerks[index];
    const updatedPerks = character.combatPerks.filter((_, i) => i !== index);
    
    // Recalculate domain level after removing this perk
    const remainingDomainXP = character.progressionLog
      .filter(entry => entry.type === 'combatPerk' && 
                      entry.domain === perk.domain && 
                      !(entry.name === perk.name && entry.cost === perk.cost))
      .reduce((sum, entry) => sum + (entry.cost || 0), 0);
    
    let newLevel = 0;
    if (remainingDomainXP >= 75) newLevel = 5;
    else if (remainingDomainXP >= 50) newLevel = 4;
    else if (remainingDomainXP >= 30) newLevel = 3;
    else if (remainingDomainXP >= 15) newLevel = 2;
    else if (remainingDomainXP >= 5) newLevel = 1;
    
    const newDomains = { ...character.weaponDomains };
    newDomains[perk.domain] = newLevel;
    
    // Remove from progression log
    const updatedLog = [...character.progressionLog];
    for (let i = updatedLog.length - 1; i >= 0; i--) {
      if (updatedLog[i].type === 'combatPerk' && 
          updatedLog[i].name === perk.name && 
          updatedLog[i].cost === perk.cost &&
          updatedLog[i].attribute === perk.attribute) {
        updatedLog.splice(i, 1);
        break;
      }
    }
    
    onUpdate({
      ...character,
      combatPerks: updatedPerks,
      weaponDomains: newDomains,
      combatXP: character.combatXP + perk.cost,
      progressionLog: updatedLog
    });
    
    setExpandedCombatPerkIndex(null);
  };

  // Get armor stats
  const armorData = ARMOR_TYPES[character.armorType] || ARMOR_TYPES['None'];
  const armorBonus = armorData.bonus;
  const meetsArmorReq = character.stats.MG >= armorData.mightReq;
  const armorPenalty = meetsArmorReq ? armorData.penaltyMet : armorData.penalty;

  // Calculate Speed
  const runningSkill = character.skills.find(s => s.name === 'Running');
  const runningBonus = runningSkill ? Math.floor(runningSkill.level / 2) : 0;
  const speedWithArmor = 5 + character.stats.AG + runningBonus + armorPenalty;
  const speedWithoutArmor = 5 + character.stats.AG + runningBonus;

  // Calculate HP values with effective max wounds
  const calculateHP = () => {
    const effectiveMaxWounds = character.maxWounds - character.markedWounds;
    const maxStamina = (armorBonus + character.stats.EN) * effectiveMaxWounds;
    const maxHealth = (character.hpPerWound * effectiveMaxWounds) + character.extraHP;
    const currentStamina = character.currentStamina !== null ? character.currentStamina : maxStamina;
    const currentHealth = character.currentHealth !== null ? character.currentHealth : maxHealth;
    
    return {
      maxStamina,
      maxHealth,
      currentStamina,
      currentHealth,
      totalMax: maxStamina + maxHealth,
      totalCurrent: currentStamina + currentHealth,
      effectiveMaxWounds
    };
  };

  const hp = calculateHP();

  const handleBuyExtraHP = (attribute) => {
    const cost = character.maxWounds;
    
    if (character.combatXP >= cost) {
      const newExtraHPCount = character.extraHPCount + 1;
      const newExtraHPHistory = [...character.extraHPHistory, { attribute, cost }];
      
      // Check if we need to consolidate
      if (newExtraHPCount >= 5) {
        const newExtraWoundCount = character.extraWoundCount + 1;
        const extraWoundName = `Extra Wound[${newExtraWoundCount}]`;
        
        // Remove ExtraHP entries from progression log
        const updatedLog = character.progressionLog.filter(entry => entry.type !== 'extraHP');
        
        // Add 5 Extra Wound entries (one for each ExtraHP purchase)
        const extraWoundEntries = newExtraHPHistory.map((hp, index) => ({
          type: 'extraWound',
          name: extraWoundName,
          level: index + 1,
          attribute: hp.attribute,
          cost: hp.cost
        }));
        
        onUpdate({
          ...character,
          combatXP: character.combatXP - cost,
          maxWounds: character.maxWounds + 1,
          extraHP: 0,
          extraHPCount: 0,
          extraHPHistory: [],
          extraWoundCount: newExtraWoundCount,
          progressionLog: [...updatedLog, ...extraWoundEntries]
        });
      } else {
        // Just add ExtraHP
        onUpdate({
          ...character,
          combatXP: character.combatXP - cost,
          extraHP: character.extraHP + 1,
          extraHPCount: newExtraHPCount,
          extraHPHistory: newExtraHPHistory,
          progressionLog: [...character.progressionLog, {
            type: 'extraHP',
            name: 'Extra HP',
            level: newExtraHPCount,
            attribute: attribute,
            cost: cost
          }]
        });
      }
      
      setShowExtraHPAttributeModal(false);
    }
  };

  const setTotalHP = (newTotal) => {
    // Clamp at negative (max wounds × hp per wound)
    const minHP = -(character.maxWounds * character.hpPerWound);
    const clampedTotal = Math.max(minHP, newTotal);
    let newHealth, newStamina;

    if (clampedTotal <= 0) {
      // Negative or zero HP - all in health as negative
      newStamina = 0;
      newHealth = clampedTotal;
    } else if (clampedTotal <= hp.maxHealth) {
      // Only health, no stamina
      newStamina = 0;
      newHealth = clampedTotal;
    } else {
      // Full health, rest in stamina
      newHealth = hp.maxHealth;
      newStamina = Math.min(hp.maxStamina, clampedTotal - hp.maxHealth);
    }

    onUpdate({
      ...character,
      currentStamina: newStamina,
      currentHealth: newHealth
    });
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartHP(hp.totalCurrent);
    e.preventDefault();
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setDragStartX(e.touches[0].clientX);
    setDragStartHP(hp.totalCurrent);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX;
    const hpChange = Math.round(deltaX / 30); // 30 pixels = 1 HP
    setTotalHP(dragStartHP + hpChange);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - dragStartX;
    const hpChange = Math.round(deltaX / 30); // 30 pixels = 1 HP
    setTotalHP(dragStartHP + hpChange);
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragStartX, dragStartHP]);

  const handleReset = () => {
    onUpdate({
      ...character,
      currentStamina: null,
      currentHealth: null
    });
  };

  // Calculate bar widths
  const isNegative = hp.totalCurrent < 0;
  const maxNegativeHP = character.maxWounds * character.hpPerWound;
  
  if (!isNegative) {
    // Positive HP - show stamina (yellow) and health (red)
    var healthPercent = hp.maxHealth > 0 
      ? Math.min(100, (hp.currentHealth / hp.maxHealth) * 100) 
      : 0;
    var staminaPercent = hp.maxStamina > 0
      ? Math.min(100, (hp.currentStamina / hp.maxStamina) * 100)
      : 0;
  } else {
    // Negative HP - show as dark red from 0 going left
    var negativePercent = maxNegativeHP > 0
      ? Math.min(100, (Math.abs(hp.totalCurrent) / maxNegativeHP) * 100)
      : 0;
  }

  // Calculate Parry - use better of two weapons
  const weapon1Data = WEAPONS[character.equippedWeapon1] || WEAPONS['None'];
  const weapon2Data = WEAPONS[character.equippedWeapon2] || WEAPONS['None'];
  
  const calculateParryForWeapon = (weaponData) => {
    if (!weaponData.domain) return 0;
    const weaponDomain = character.weaponDomains[weaponData.domain] || 0;
    const parryBase = weaponData.finesse && character.stats.DX > character.stats.AG
      ? character.stats.DX
      : character.stats.AG;
    return parryBase + weaponDomain;
  };
  
  const parry1 = calculateParryForWeapon(weapon1Data);
  const parry2 = calculateParryForWeapon(weapon2Data);
  const parry = Math.max(parry1, parry2);
  
  const bestWeaponData = parry1 >= parry2 ? weapon1Data : weapon2Data;
  const bestWeaponDomain = bestWeaponData.domain ? (character.weaponDomains[bestWeaponData.domain] || 0) : 0;

  return (
    <div className="p-4">
      <div className="bg-slate-800 rounded-lg p-4 mb-4">
        {/* HP Display Header */}
        <div 
          className="flex justify-between items-center mb-2 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="text-white">
            <span className={`text-3xl font-bold ${isNegative ? 'text-red-400' : ''}`}>
              {hp.totalCurrent}
            </span>
            <span className="text-slate-400 text-lg"> / {hp.totalMax}</span>
          </div>
          <div className="text-right text-sm">
            {!isNegative && (
              <>
                <div className="text-yellow-400">Stamina: {hp.currentStamina}</div>
                <div className="text-red-400">Health: {hp.currentHealth}</div>
              </>
            )}
            {isNegative && (
              <div className="text-red-400">Below 0 HP!</div>
            )}
          </div>
        </div>

        {/* Draggable HP Bar */}
        <div 
          className={`relative h-8 bg-slate-700 rounded-lg overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {!isNegative ? (
            <>
              {/* Stamina bar (yellow) */}
              <div 
                className="absolute inset-0 bg-yellow-600 transition-all"
                style={{ width: `${staminaPercent}%` }}
              />
              {/* Health bar (red) */}
              <div 
                className="absolute inset-0 bg-red-600 transition-all"
                style={{ 
                  width: `${healthPercent}%`,
                  left: `${staminaPercent}%`
                }}
              />
            </>
          ) : (
            /* Negative HP bar (dark red from left) */
            <div 
              className="absolute inset-0 bg-red-900 transition-all"
              style={{ 
                width: `${negativePercent}%`
              }}
            />
          )}
          
          {/* Text overlay */}
          <div className="absolute inset-0 flex items-center justify-center text-white font-semibold text-sm drop-shadow-md pointer-events-none">
            {!isNegative ? (
              <>
                <span className="text-yellow-200">{hp.currentStamina}</span>
                <span className="mx-1">+</span>
                <span className="text-red-200">{hp.currentHealth}</span>
              </>
            ) : (
              <span className="text-red-200">{hp.totalCurrent} HP</span>
            )}
          </div>

          {/* Drag hint */}
          {!isDragging && (
            <div className="absolute bottom-0 right-2 text-xs text-slate-400 pointer-events-none">
              ← Drag →
            </div>
          )}
        </div>

        {/* Compact Stats Row */}
        <div className="mt-3 text-sm text-slate-300">
          Wounds: <span className="text-white font-semibold">{character.maxWounds}</span> | 
          HP/Wound: <span className="text-white font-semibold">{character.hpPerWound}</span> | 
          Armor: <span className="text-white font-semibold">+{armorBonus}</span>
        </div>

        {/* Expanded Section */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-700 rounded p-2">
                <div className="text-slate-400 text-xs mb-1">Marked Wounds</div>
                <input
                  type="number"
                  min="0"
                  max={character.maxWounds}
                  value={character.markedWounds}
                  onChange={(e) => onUpdate({...character, markedWounds: Math.min(character.maxWounds, Math.max(0, parseInt(e.target.value) || 0))})}
                  className="bg-slate-600 text-white text-lg font-bold w-16 px-2 py-1 rounded"
                />
              </div>
            </div>

            {/* ExtraHP Section */}
            <div className="bg-slate-700 rounded p-3 mb-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="text-white font-semibold">Extra HP</div>
                  <div className="text-slate-400 text-xs">
                    {character.extraHPCount}/5 to next wound
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold">{character.extraHP} HP</div>
                  <div className="text-slate-400 text-xs">
                    Cost: {character.maxWounds} Combat CP
                  </div>
                </div>
              </div>
              
              {character.extraHPHistory.length > 0 && (
                <div className="mb-2 text-xs text-slate-300">
                  {character.extraHPHistory.map((hp, i) => (
                    <span key={i} className="inline-block bg-slate-600 px-2 py-0.5 rounded mr-1 mb-1">
                      {hp.attribute} ({hp.cost} CP)
                    </span>
                  ))}
                </div>
              )}
              
              <button
                onClick={() => setShowExtraHPAttributeModal(true)}
                disabled={character.combatXP < character.maxWounds}
                className={`w-full rounded py-2 text-white font-semibold ${
                  character.combatXP < character.maxWounds
                    ? 'bg-slate-600 cursor-not-allowed opacity-50'
                    : 'bg-green-700 hover:bg-green-600'
                }`}
              >
                {character.combatXP < character.maxWounds 
                  ? 'Not Enough Combat XP' 
                  : `Buy Extra HP (${character.maxWounds} CP)`}
              </button>
            </div>

            <button
              onClick={handleReset}
              className="w-full bg-blue-700 hover:bg-blue-600 rounded py-2 text-white font-semibold"
            >
              Reset to Full HP
            </button>
          </div>
        )}
      </div>

      {/* Offense & Defense Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Offense Block */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h4 className="text-lg font-bold text-white mb-3">Offense</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Attack Mod</span>
              <span className="text-white font-bold">+{character.stats.MG}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Speed</span>
              <span className="text-white font-bold">{speedWithArmor}</span>
            </div>
            {armorPenalty !== 0 && (
              <div className="text-slate-400 text-xs">
                {speedWithoutArmor} without armor
              </div>
            )}
          </div>
        </div>

        {/* Defense Block */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h4 className="text-lg font-bold text-white mb-3">Defense</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs">Parry</span>
              <span className="text-white font-bold">{parry || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs">Block</span>
              <span className="text-white font-bold">-</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs">Dodge</span>
              <span className="text-white font-bold">{character.stats.AG + character.stats.PR + (armorPenalty || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs">Endure</span>
              <span className="text-white font-bold">{character.stats.EN + character.stats.WI}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weapon Domains Block */}
      <div className="bg-slate-800 rounded-lg p-4 mb-4">
        <h4 className="text-lg font-bold text-white mb-3">Weapon Domains</h4>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(character.weaponDomains).map(([domain, level]) => (
            <div key={domain} className="bg-slate-700 rounded p-2 text-center">
              <div className="text-slate-400 text-xs mb-1">{domain}</div>
              <div className="text-white text-2xl font-bold">{level}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Combat Perks Section */}
      <div className="bg-slate-800 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-lg font-bold text-white">Combat Perks</h4>
          <button
            onClick={() => setShowAddCombatPerkModal(true)}
            className="bg-slate-700 hover:bg-slate-600 rounded-lg p-1.5"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="space-y-2">
          {character.combatPerks.map((perk, index) => (
            <div key={index} className="bg-slate-700 rounded overflow-hidden">
              <div 
                className="p-3 cursor-pointer hover:bg-slate-600 transition-colors"
                onClick={() => toggleCombatPerkExpand(index)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-white font-medium">{perk.name}</span>
                    <div className="text-sm mt-1">
                      <span className="text-green-400">{perk.cost} XP</span>
                      <span className="text-slate-400 mx-2">•</span>
                      <span className="text-blue-400">{perk.domain}</span>
                      <span className="text-slate-400 mx-2">•</span>
                      <span className="text-purple-400">{perk.attribute}</span>
                    </div>
                  </div>
                </div>
              </div>
              {expandedCombatPerkIndex === index && (
                <div className="px-3 pb-3 border-t border-slate-600">
                  {perk.description && (
                    <p className="text-slate-300 text-sm mt-2 mb-3">{perk.description}</p>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCombatPerk(index);
                    }}
                    className="w-full bg-red-700 hover:bg-red-600 rounded py-2 text-white font-semibold"
                  >
                    Delete (Refund {perk.cost} XP)
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Combat Perk Modal */}
      {showAddCombatPerkModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowAddCombatPerkModal(false);
            setNewCombatPerk({ name: '', cost: '', domain: '', attribute: '', description: '' });
          }}
        >
          <div 
            className="bg-slate-800 rounded-lg p-6 min-w-[350px] max-w-[500px] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4 text-center">
              Add Combat Perk
              <div className="text-sm text-slate-400 font-normal mt-1">
                Available Combat XP: {character.combatXP}
              </div>
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-white mb-2">Perk Name</label>
              <input
                type="text"
                value={newCombatPerk.name}
                onChange={(e) => setNewCombatPerk({...newCombatPerk, name: e.target.value})}
                placeholder="Enter perk name"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-white mb-2">Cost (XP)</label>
              <input
                type="number"
                value={newCombatPerk.cost}
                onChange={(e) => setNewCombatPerk({...newCombatPerk, cost: e.target.value})}
                placeholder="Enter XP cost (multiples of 5)"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              />
              <div className="text-xs text-slate-400 mt-1">
                Next threshold: {
                  currentDomainXP < 5 ? `5 XP (${5 - currentDomainXP} more)` :
                  currentDomainXP < 15 ? `15 XP (${15 - currentDomainXP} more)` :
                  currentDomainXP < 30 ? `30 XP (${30 - currentDomainXP} more)` :
                  currentDomainXP < 50 ? `50 XP (${50 - currentDomainXP} more)` :
                  currentDomainXP < 75 ? `75 XP (${75 - currentDomainXP} more)` :
                  'Max level (5)'
                }
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-white mb-2">
                Domain {newCombatPerk.domain && <span className="text-blue-400">({domainNames[newCombatPerk.domain]})</span>}
              </label>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(domainNames).map(([abbr, full]) => (
                  <button
                    key={abbr}
                    onClick={() => setNewCombatPerk({...newCombatPerk, domain: abbr})}
                    className={`py-2 rounded font-semibold transition-colors ${
                      newCombatPerk.domain === abbr
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    {abbr}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-white mb-2">
                Attribute {newCombatPerk.attribute && <span className="text-purple-400">({newCombatPerk.attribute})</span>}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(attributeMap).map(([abbr, full]) => (
                  <button
                    key={abbr}
                    onClick={() => setNewCombatPerk({...newCombatPerk, attribute: full})}
                    className={`py-2 rounded font-semibold transition-colors ${
                      newCombatPerk.attribute === full
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    {abbr}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-white mb-2">Description (Optional)</label>
              <textarea
                value={newCombatPerk.description}
                onChange={(e) => setNewCombatPerk({...newCombatPerk, description: e.target.value})}
                placeholder="Enter perk description"
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white resize-none"
              />
            </div>
            
            <button
              onClick={handleAddCombatPerk}
              disabled={!newCombatPerk.name.trim() || !newCombatPerk.cost || !newCombatPerk.domain || !newCombatPerk.attribute || character.combatXP < parseInt(newCombatPerk.cost || 0)}
              className={`w-full rounded py-2 mb-2 text-white font-semibold ${
                !newCombatPerk.name.trim() || !newCombatPerk.cost || !newCombatPerk.domain || !newCombatPerk.attribute || character.combatXP < parseInt(newCombatPerk.cost || 0)
                  ? 'bg-slate-600 cursor-not-allowed opacity-50'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              {!newCombatPerk.name.trim() || !newCombatPerk.cost || !newCombatPerk.domain || !newCombatPerk.attribute
                ? 'Add' 
                : character.combatXP < parseInt(newCombatPerk.cost || 0)
                  ? 'Not Enough XP'
                  : 'Add'}
            </button>
            <button
              onClick={() => {
                setShowAddCombatPerkModal(false);
                setNewCombatPerk({ name: '', cost: '', domain: '', attribute: '', description: '' });
              }}
              className="w-full bg-slate-600 hover:bg-slate-500 rounded py-2 text-white font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ExtraHP Attribute Selection Modal */}
      {showExtraHPAttributeModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setShowExtraHPAttributeModal(false)}
        >
          <div 
            className="bg-slate-800 rounded-lg p-6 min-w-[350px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-2 text-center">Buy Extra HP</h3>
            <p className="text-slate-400 text-sm mb-2 text-center">
              Select which attribute to apply points to:
            </p>
            <p className="text-slate-400 text-xs mb-4 text-center">
              Cost: {character.maxWounds} CP
              <span className="ml-2">
                ({character.combatXP} → {character.combatXP - character.maxWounds} Combat XP)
              </span>
            </p>
            <p className="text-blue-400 text-xs mb-4 text-center">
              Progress: {character.extraHPCount + 1}/5 to Extra Wound
            </p>
            
            <div className="space-y-2 mb-4">
              <button
                onClick={() => handleBuyExtraHP('Endurance')}
                className="w-full bg-slate-700 hover:bg-slate-600 rounded py-3 text-white font-semibold transition-colors"
              >
                Endurance
              </button>
              <button
                onClick={() => handleBuyExtraHP('Will')}
                className="w-full bg-slate-700 hover:bg-slate-600 rounded py-3 text-white font-semibold transition-colors"
              >
                Will
              </button>
            </div>
            
            <button
              onClick={() => setShowExtraHPAttributeModal(false)}
              className="w-full bg-slate-600 hover:bg-slate-500 rounded py-2 text-white font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Equipment Tab Component
function EquipmentTab({ character, onUpdate }) {
  const [isArmorExpanded, setIsArmorExpanded] = useState(false);
  const [showArmorModal, setShowArmorModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemWeight, setNewItemWeight] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');

  const currentArmor = ARMOR_TYPES[character.armorType] || ARMOR_TYPES['None'];
  const meetsReq = character.stats.MG >= currentArmor.mightReq;
  const penalty = meetsReq ? currentArmor.penaltyMet : currentArmor.penalty;

  // Calculate encumbrance
  const totalWeight = character.customItems.reduce((sum, item) => 
    sum + ((item.weight || 0) * (item.quantity || 1)), 0
  );
  const capacity = Math.pow(5 + character.stats.EN + character.stats.MG, 2);
  
  const getEncumbranceLevel = () => {
    const ratio = totalWeight / capacity;
    if (ratio < 0.5) return { level: 'None', speedPenalty: 0, dodgePenalty: 0 };
    if (ratio < 1.0) return { level: 'Light', speedPenalty: -1, dodgePenalty: -1 };
    if (ratio < 1.5) return { level: 'Encumbered', speedPenalty: -2, dodgePenalty: -2 };
    if (ratio < 2.0) return { level: 'Heavy', speedPenalty: 'Half', dodgePenalty: -4 };
    return { level: 'Over-Encumbered', speedPenalty: 'Quarter', dodgePenalty: 'Cannot dodge' };
  };

  const encumbrance = getEncumbranceLevel();

  const handleArmorSelect = (armorType) => {
    onUpdate({
      ...character,
      armorType: armorType
    });
    setShowArmorModal(false);
  };

  const handleAddItem = () => {
    if (newItemName.trim() && newItemWeight && newItemQuantity) {
      onUpdate({
        ...character,
        customItems: [...character.customItems, {
          name: newItemName.trim(),
          weight: parseFloat(newItemWeight) || 0,
          quantity: parseInt(newItemQuantity) || 1
        }]
      });
      setNewItemName('');
      setNewItemWeight('');
      setNewItemQuantity('1');
    }
  };

  const handleDeleteItem = (index) => {
    onUpdate({
      ...character,
      customItems: character.customItems.filter((_, i) => i !== index)
    });
  };

  const handleUpdateItem = (index, field, value) => {
    const updatedItems = [...character.customItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'weight' ? (parseFloat(value) || 0) : 
               field === 'quantity' ? (parseInt(value) || 1) : value
    };
    onUpdate({
      ...character,
      customItems: updatedItems
    });
  };

  return (
    <div className="p-4">
      <h3 className="text-xl font-bold text-white mb-4">Equipment</h3>

      {/* Weapons Section */}
      <div className="bg-slate-800 rounded-lg p-4 mb-4">
        <h4 className="text-lg font-semibold text-white mb-3">Weapons</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Primary Weapon</label>
            <select
              value={character.equippedWeapon1}
              onChange={(e) => onUpdate({...character, equippedWeapon1: e.target.value})}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
            >
              {Object.keys(WEAPONS).map(weaponName => {
                const weapon = WEAPONS[weaponName];
                return (
                  <option key={weaponName} value={weaponName}>
                    {weaponName} {weapon.domain && `(${weapon.domain})`} {weapon.damage && `- ${weapon.damage}`}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Secondary Weapon</label>
            <select
              value={character.equippedWeapon2}
              onChange={(e) => onUpdate({...character, equippedWeapon2: e.target.value})}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
            >
              {Object.keys(WEAPONS).map(weaponName => {
                const weapon = WEAPONS[weaponName];
                return (
                  <option key={weaponName} value={weaponName}>
                    {weaponName} {weapon.domain && `(${weapon.domain})`} {weapon.damage && `- ${weapon.damage}`}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Shield</label>
            <select
              value={character.equippedShield}
              onChange={(e) => onUpdate({...character, equippedShield: e.target.value})}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
            >
              <option value="None">None</option>
              <option value="Buckler">Buckler (Sh) - Light</option>
              <option value="Shield">Shield (Sh) - Medium</option>
              <option value="Kite Shield">Kite Shield (Sh) - Medium</option>
              <option value="Tower Shield">Tower Shield (Sh) - Heavy</option>
              <option value="Fortress Shield">Fortress Shield (Sh) - Heavy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Encumbrance Section */}
      <div className="bg-slate-800 rounded-lg p-4 mb-4">
        <h4 className="text-lg font-semibold text-white mb-3">Encumbrance</h4>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="bg-slate-700 rounded p-2">
            <div className="text-slate-400 text-xs">Total Weight</div>
            <div className="text-white font-bold">{totalWeight.toFixed(1)} kg</div>
          </div>
          <div className="bg-slate-700 rounded p-2">
            <div className="text-slate-400 text-xs">Capacity</div>
            <div className="text-white font-bold">{capacity} kg</div>
          </div>
          <div className="bg-slate-700 rounded p-2">
            <div className="text-slate-400 text-xs">Level</div>
            <div className={`font-bold ${
              encumbrance.level === 'None' ? 'text-green-400' :
              encumbrance.level === 'Light' ? 'text-yellow-400' :
              encumbrance.level === 'Encumbered' ? 'text-orange-400' :
              'text-red-400'
            }`}>
              {encumbrance.level}
            </div>
          </div>
        </div>
        {encumbrance.level !== 'None' && (
          <div className="text-sm text-slate-300">
            Penalties: Speed {typeof encumbrance.speedPenalty === 'number' ? encumbrance.speedPenalty : encumbrance.speedPenalty}, 
            Dodge {typeof encumbrance.dodgePenalty === 'number' ? encumbrance.dodgePenalty : encumbrance.dodgePenalty}
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="bg-slate-800 rounded-lg p-4 mb-4">
        <h4 className="text-lg font-semibold text-white mb-3">Items</h4>
        
        {/* Add Item Row */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Item name"
            className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
          />
          <input
            type="number"
            step="0.1"
            value={newItemWeight}
            onChange={(e) => setNewItemWeight(e.target.value)}
            placeholder="Weight (kg)"
            className="w-28 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
          />
          <input
            type="number"
            value={newItemQuantity}
            onChange={(e) => setNewItemQuantity(e.target.value)}
            placeholder="Qty"
            className="w-16 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
          />
          <button
            onClick={handleAddItem}
            disabled={!newItemName.trim() || !newItemWeight || !newItemQuantity}
            className={`px-4 rounded font-semibold ${
              !newItemName.trim() || !newItemWeight || !newItemQuantity
                ? 'bg-slate-600 cursor-not-allowed opacity-50 text-slate-400'
                : 'bg-blue-700 hover:bg-blue-600 text-white'
            }`}
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Items List */}
        <div className="space-y-2">
          {character.customItems.map((item, index) => (
            <div key={index} className="flex gap-2 items-center bg-slate-700 rounded p-2">
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                className="flex-1 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white"
              />
              <input
                type="number"
                step="0.1"
                value={item.weight}
                onChange={(e) => handleUpdateItem(index, 'weight', e.target.value)}
                className="w-28 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white"
              />
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => handleUpdateItem(index, 'quantity', e.target.value)}
                className="w-16 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white"
              />
              <button
                onClick={() => handleDeleteItem(index)}
                className="text-red-400 hover:text-red-300 p-1"
              >
                ×
              </button>
            </div>
          ))}
          {character.customItems.length === 0 && (
            <div className="text-slate-500 text-center py-4">No items added</div>
          )}
        </div>
      </div>

      {/* Armor Section */}
      <div className="bg-slate-800 rounded-lg mb-4">
        <div 
          className="p-4 cursor-pointer flex justify-between items-center"
          onClick={() => setIsArmorExpanded(!isArmorExpanded)}
        >
          <div>
            <h4 className="text-lg font-semibold text-white">{character.armorType}</h4>
            <div className="text-sm text-slate-400">
              Armor Bonus: +{currentArmor.bonus} | 
              Might Req: {currentArmor.mightReq} | 
              Penalty: {penalty}
            </div>
          </div>
          <div className={`text-slate-400 transition-transform ${isArmorExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown size={20} />
          </div>
        </div>

        {isArmorExpanded && (
          <div className="px-4 pb-4 border-t border-slate-700 pt-4">
            <div className="mb-3">
              <div className="text-sm text-slate-300 mb-2">
                {meetsReq ? (
                  <span className="text-green-400">✓ Might requirement met</span>
                ) : (
                  <span className="text-red-400">✗ Might requirement not met (increased penalty)</span>
                )}
              </div>
              <div className="text-xs text-slate-400">
                Speed Penalty: {penalty} | Dodge Penalty: {penalty}
              </div>
            </div>

            <button
              onClick={() => setShowArmorModal(true)}
              className="w-full bg-blue-700 hover:bg-blue-600 rounded py-2 text-white font-semibold"
            >
              Change Armor
            </button>
          </div>
        )}
      </div>

      {/* Armor Selection Modal */}
      {showArmorModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowArmorModal(false)}
        >
          <div 
            className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white p-6 pb-4 text-center flex-shrink-0">Select Armor</h3>
            
            <div className="overflow-y-auto px-6 flex-1" style={{ minHeight: 0 }}>
              <div className="space-y-2 pb-4">
                {Object.entries(ARMOR_TYPES).map(([name, data]) => {
                  const meetsThisReq = character.stats.MG >= data.mightReq;
                  const thisPenalty = meetsThisReq ? data.penaltyMet : data.penalty;
                  
                  return (
                    <button
                      key={name}
                      onClick={() => handleArmorSelect(name)}
                      className={`w-full rounded p-3 text-left transition-colors ${
                        character.armorType === name
                          ? 'bg-blue-700 hover:bg-blue-600'
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-white font-medium">{name}</div>
                          <div className="text-sm text-slate-300 mt-1">
                            Armor: +{data.bonus} | Might Req: {data.mightReq} | Penalty: {thisPenalty}
                          </div>
                        </div>
                        <div>
                          {meetsThisReq ? (
                            <span className="text-green-400 text-xs">✓</span>
                          ) : (
                            <span className="text-red-400 text-xs">✗</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="p-6 pt-4 border-t border-slate-700 flex-shrink-0">
              <button
                onClick={() => setShowArmorModal(false)}
                className="w-full bg-slate-600 hover:bg-slate-500 rounded py-2 text-white font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Progression List Tab Component
function ProgressionListTab({ character }) {
  // Calculate CP spent per attribute
  const calculateAttributeCP = () => {
    const attributeCP = {
      'Might': 0, 'Endurance': 0, 'Agility': 0, 'Dexterity': 0,
      'Wit': 0, 'Will': 0, 'Perception': 0, 'Charisma': 0
    };
    
    character.progressionLog.forEach(entry => {
      if (entry.attribute && entry.cost) {
        attributeCP[entry.attribute] = (attributeCP[entry.attribute] || 0) + entry.cost;
      }
    });
    
    return attributeCP;
  };

  const attributeCP = calculateAttributeCP();
  
  // Mapping for display
  const attributeOrder = [
    { abbr: 'MG', full: 'Might' },
    { abbr: 'EN', full: 'Endurance' },
    { abbr: 'AG', full: 'Agility' },
    { abbr: 'DX', full: 'Dexterity' },
    { abbr: 'WT', full: 'Wit' },
    { abbr: 'WI', full: 'Will' },
    { abbr: 'PR', full: 'Perception' },
    { abbr: 'CH', full: 'Charisma' }
  ];

  return (
    <div className="p-4">
      <h3 className="text-xl font-bold text-white mb-4">Attribute Points</h3>
      
      <div className="grid grid-cols-4 gap-3 mb-6">
        {attributeOrder.map(({ abbr, full }) => (
          <div key={abbr} className="bg-slate-800 rounded p-3 text-center">
            <div className="text-slate-400 text-xs font-semibold mb-1">{abbr}</div>
            <div className="text-white text-2xl font-bold">{attributeCP[full]}</div>
            <div className="text-slate-500 text-xs mt-1">CP</div>
          </div>
        ))}
      </div>
      
      <h3 className="text-xl font-bold text-white mb-4 mt-8">Progression History</h3>
      
      {character.progressionLog.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400">No progression recorded yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 px-3 text-sm font-semibold text-slate-400">Type</th>
                <th className="text-left py-2 px-3 text-sm font-semibold text-slate-400">Name</th>
                <th className="text-left py-2 px-3 text-sm font-semibold text-slate-400">Level</th>
                <th className="text-left py-2 px-3 text-sm font-semibold text-slate-400">Attribute</th>
                <th className="text-left py-2 px-3 text-sm font-semibold text-slate-400">Cost</th>
              </tr>
            </thead>
            <tbody>
              {character.progressionLog.map((entry, index) => (
                <tr key={index} className="border-b border-slate-800">
                  <td className="py-3 px-3 text-sm">
                    <span className="bg-slate-700 px-2 py-1 rounded text-xs uppercase">
                      {entry.type}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-sm text-white">{entry.name}</td>
                  <td className="py-3 px-3 text-sm text-slate-300">
                    {entry.level || '-'}
                  </td>
                  <td className="py-3 px-3 text-sm text-blue-400">
                    {entry.attribute || '-'}
                  </td>
                  <td className="py-3 px-3 text-sm text-green-400">
                    {entry.cost ? `${entry.cost} CP` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Character Sheet View
function CharacterSheet({ character, onUpdate, onBack }) {
  const [activeTab, setActiveTab] = useState('skills');
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const tabs = ['skills', 'combat', 'equipment', 'list'];
  
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    const currentIndex = tabs.indexOf(activeTab);
    
    if (isLeftSwipe && currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
    
    if (isRightSwipe && currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
    
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Calculate attribute values from CP thresholds
  const calculateAttributeValues = () => {
    const attributeCP = {
      'Might': 0, 'Endurance': 0, 'Agility': 0, 'Dexterity': 0,
      'Wit': 0, 'Will': 0, 'Perception': 0, 'Charisma': 0
    };
    
    character.progressionLog.forEach(entry => {
      if (entry.attribute && entry.cost) {
        attributeCP[entry.attribute] = (attributeCP[entry.attribute] || 0) + entry.cost;
      }
    });
    
    // Convert CP to attribute values based on thresholds: 10/30/60/100/150
    const cpToAttributeValue = (cp) => {
      if (cp >= 150) return 5;
      if (cp >= 100) return 4;
      if (cp >= 60) return 3;
      if (cp >= 30) return 2;
      if (cp >= 10) return 1;
      return 0;
    };
    
    return {
      MG: cpToAttributeValue(attributeCP['Might']),
      EN: cpToAttributeValue(attributeCP['Endurance']),
      AG: cpToAttributeValue(attributeCP['Agility']),
      DX: cpToAttributeValue(attributeCP['Dexterity']),
      WT: cpToAttributeValue(attributeCP['Wit']),
      WI: cpToAttributeValue(attributeCP['Will']),
      PR: cpToAttributeValue(attributeCP['Perception']),
      CH: cpToAttributeValue(attributeCP['Charisma'])
    };
  };

  // Update character with calculated stats
  useEffect(() => {
    const calculatedStats = calculateAttributeValues();
    const statsChanged = Object.keys(calculatedStats).some(
      key => calculatedStats[key] !== character.stats[key]
    );
    
    if (statsChanged) {
      onUpdate({
        ...character,
        stats: calculatedStats
      });
    }
  }, [character.progressionLog.length, character.equippedWeapon1, character.equippedWeapon2, character.equippedShield, character.armorType]); // Trigger on equipment changes too

  const handleUpdateXP = (combat, social) => {
    onUpdate({
      ...character,
      combatXP: character.combatXP + combat,
      socialXP: character.socialXP + social
    });
  };

  // Use calculated stats for display
  const displayCharacter = {
    ...character,
    stats: calculateAttributeValues()
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <CharacterHeader character={displayCharacter} onUpdateXP={handleUpdateXP} />
      
      <div className="border-b border-slate-700">
        <div className="flex">
          <button
            onClick={() => setActiveTab('skills')}
            className={`flex-1 py-3 font-semibold ${
              activeTab === 'skills'
                ? 'text-white border-b-2 border-white'
                : 'text-slate-500'
            }`}
          >
            Skills
          </button>
          <button
            onClick={() => setActiveTab('combat')}
            className={`flex-1 py-3 font-semibold ${
              activeTab === 'combat'
                ? 'text-white border-b-2 border-white'
                : 'text-slate-500'
            }`}
          >
            Combat
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`flex-1 py-3 font-semibold ${
              activeTab === 'equipment'
                ? 'text-white border-b-2 border-white'
                : 'text-slate-500'
            }`}
          >
            Equipment
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-3 font-semibold ${
              activeTab === 'list'
                ? 'text-white border-b-2 border-white'
                : 'text-slate-500'
            }`}
          >
            List
          </button>
        </div>
      </div>

      <div className="bg-black min-h-screen">
        {activeTab === 'skills' && <SkillsTab character={character} onUpdate={onUpdate} />}
        {activeTab === 'combat' && <CombatTab character={character} onUpdate={onUpdate} />}
        {activeTab === 'equipment' && <EquipmentTab character={character} onUpdate={onUpdate} />}
        {activeTab === 'list' && <ProgressionListTab character={character} />}
      </div>

      <div className="fixed bottom-4 left-4">
        <button
          onClick={onBack}
          className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}

// Main App Component
export default function ExceedCharacterApp() {
  const [currentView, setCurrentView] = useState('landing');
  const [characters, setCharacters] = useState([]);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [newCharacter, setNewCharacter] = useState(createEmptyCharacter());

  const handleNewCharacter = () => {
    setNewCharacter(createEmptyCharacter());
    setCurrentView('create');
  };

  const handleLoadCharacter = () => {
    setCurrentView('load');
  };

  const handleCreateCharacter = () => {
    if (newCharacter.name.trim()) {
      const updatedCharacters = [...characters, newCharacter];
      setCharacters(updatedCharacters);
      setCurrentCharacter(newCharacter);
      setCurrentView('sheet');
    }
  };

  const handleSelectCharacter = (character) => {
    setCurrentCharacter(character);
    setCurrentView('sheet');
  };

  const handleUpdateCharacter = (updatedCharacter) => {
    setCurrentCharacter(updatedCharacter);
    setCharacters(characters.map(c => 
      c === currentCharacter ? updatedCharacter : c
    ));
  };

  // Landing Page
  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-slate-100 mb-2">EXCEED</h1>
            <p className="text-slate-400 text-lg">Character Manager</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-8 space-y-4 shadow-xl border border-slate-700">
            <button
              onClick={handleNewCharacter}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
            >
              <User size={24} />
              <span>New Character</span>
            </button>

            <button
              onClick={handleLoadCharacter}
              className="w-full flex items-center justify-center gap-3 bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold py-4 px-6 rounded-lg transition-colors border border-slate-600"
            >
              <Upload size={24} />
              <span>Load Character</span>
            </button>
          </div>

          <div className="text-center text-slate-500 text-sm">
            <p>A skill-based fantasy TTRPG system</p>
          </div>
        </div>
      </div>
    );
  }

  // Character Creation Page
  if (currentView === 'create') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Character Creation</h2>
          
          <div className="bg-slate-800 rounded-lg p-6 space-y-4 border border-slate-700">
            <div>
              <label className="block text-sm font-semibold mb-2">Name</label>
              <input
                type="text"
                value={newCharacter.name}
                onChange={(e) => setNewCharacter({...newCharacter, name: e.target.value})}
                placeholder="Character name"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Concept</label>
              <input
                type="text"
                value={newCharacter.concept}
                onChange={(e) => setNewCharacter({...newCharacter, concept: e.target.value})}
                placeholder="Character concept"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Combat XP</label>
                <input
                  type="number"
                  value={newCharacter.combatXP}
                  onChange={(e) => setNewCharacter({...newCharacter, combatXP: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Social XP</label>
                <input
                  type="number"
                  value={newCharacter.socialXP}
                  onChange={(e) => setNewCharacter({...newCharacter, socialXP: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleCreateCharacter}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
              >
                Create Character
              </button>
              <button
                onClick={() => setCurrentView('landing')}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Load Character Page
  if (currentView === 'load') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">Load Character</h2>
            <button
              onClick={() => setCurrentView('landing')}
              className="bg-slate-700 hover:bg-slate-600 text-slate-100 px-4 py-2 rounded"
            >
              Back
            </button>
          </div>

          <div className="bg-slate-800 rounded-lg border border-slate-700">
            {characters.length === 0 ? (
              <div className="p-12 text-center">
                <User size={48} className="mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400 text-lg mb-2">No characters yet</p>
                <p className="text-slate-500 text-sm">Create a new character to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {characters.map((character, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectCharacter(character)}
                    className="p-4 hover:bg-slate-750 cursor-pointer transition-colors"
                  >
                    <h3 className="font-semibold text-lg">{character.name}</h3>
                    <p className="text-slate-400 text-sm">{character.concept}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Character Sheet Page
  if (currentView === 'sheet' && currentCharacter) {
    return (
      <CharacterSheet
        character={currentCharacter}
        onUpdate={handleUpdateCharacter}
        onBack={() => setCurrentView('landing')}
      />
    );
  }

  return null;
}