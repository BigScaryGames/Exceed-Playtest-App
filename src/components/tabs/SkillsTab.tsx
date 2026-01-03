import React, { useState } from 'react';
import { Plus, Dice6, BookOpen } from 'lucide-react';
import { Character, Skill, Perk, SkillDefinition, AttributeCode } from '@/types/character';
import type { PerkDatabase } from '@/types/perks';
import { Modal } from '@/components/shared/Modal';
import { AttributeSelector } from '@/components/shared/AttributeSelector';
import { SkillSelectModal } from '@/components/modals/SkillSelectModal';
import { PerkModal } from '@/components/modals/PerkModal';
import { DiceRollerModal, RollData } from '@/components/modals/DiceRollerModal';
import {
  getActiveAbilitiesWithInheritedTags,
  getActiveEffectsWithInheritedTags,
  ActiveAbility,
  ActiveEffect
} from '@/utils/effectCalculator';

// Ability/Effect card component
interface AbilityEffectCardProps {
  item: ActiveAbility | ActiveEffect;
  isAbility: boolean;
  onDelete?: () => void;
}
const AbilityEffectCard: React.FC<AbilityEffectCardProps> = ({ item, isAbility, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const colorClass = isAbility ? 'blue' : 'purple';

  return (
    <div className="bg-slate-800 rounded overflow-hidden">
      <div
        className="p-3 cursor-pointer hover:bg-slate-750 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <span className="text-white font-medium text-sm">{item.name}</span>
            <div className="text-slate-400 text-xs mt-0.5">
              from {item.sourcePerk}
            </div>
          </div>
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-end ml-2">
              {item.tags.slice(0, 2).map((tag, i) => (
                <span
                  key={i}
                  className={`text-xs bg-${colorClass}-900/50 text-${colorClass}-300 px-1.5 py-0.5 rounded`}
                >
                  {tag}
                </span>
              ))}
              {item.tags.length > 2 && (
                <span className="text-xs text-slate-500">+{item.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-slate-700">
          <div className="text-slate-300 text-sm mt-2 whitespace-pre-wrap">
            {item.effect}
          </div>
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.map((tag, i) => (
                <span
                  key={i}
                  className={`text-xs bg-${colorClass}-900/50 text-${colorClass}-300 px-1.5 py-0.5 rounded`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="w-full mt-3 bg-red-700 hover:bg-red-600 rounded py-2 text-white text-sm font-semibold"
            >
              Remove {item.sourcePerk}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

interface SkillsTabProps {
  character: Character;
  onUpdate: (character: Character) => void;
  perkDatabase: PerkDatabase | null;
}

export const SkillsTab: React.FC<SkillsTabProps> = ({ character, onUpdate, perkDatabase }) => {
  // Get abilities and effects with inherited tags
  const abilities = getActiveAbilitiesWithInheritedTags(character, perkDatabase);
  const effects = getActiveEffectsWithInheritedTags(character, perkDatabase);

  // Filter by #Skill tag
  const skillAbilities = abilities.filter(a => a.tags.includes('Skill'));
  const skillEffects = effects.filter(e => e.tags.includes('Skill'));

  // Modal state
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [showEditPerkModal, setShowEditPerkModal] = useState(false);
  const [showAttributeSelectModal, setShowAttributeSelectModal] = useState(false);
  const [isRollerOpen, setIsRollerOpen] = useState(false);
  const [rollData, setRollData] = useState<RollData | null>(null);

  // Selected items state
  const [selectedSkill, setSelectedSkill] = useState<SkillDefinition | null>(null);
  const [levelUpSkillIndex, setLevelUpSkillIndex] = useState<number | null>(null);

  // Expansion state
  const [expandedSkillIndex, setExpandedSkillIndex] = useState<number | null>(null);

  // Editing state
  const [editingPerkIndex, setEditingPerkIndex] = useState<number | null>(null);

  // Map attribute full name to abbreviation
  const getAttributeCode = (attrName: string): AttributeCode | null => {
    const mapping: Record<string, AttributeCode> = {
      'Might': 'MG',
      'Endurance': 'EN',
      'Agility': 'AG',
      'Dexterity': 'DX',
      'Wit': 'WT',
      'Will': 'WI',
      'Perception': 'PR',
      'Charisma': 'CH'
    };
    return mapping[attrName.trim()] || null;
  };

  // Handle skill roll
  const handleSkillRoll = (skill: Skill) => {
    // Parse attributes string (e.g., "Might/Agility" -> ["Might", "Agility"])
    const attributes = skill.attributes.split('/').map(a => a.trim());

    // Create attribute options with their values
    const attributeOptions = attributes.map(attrName => {
      const attrCode = getAttributeCode(attrName);
      const attrValue = attrCode ? character.stats[attrCode] : 0;
      return {
        label: attrName,
        value: attrValue + skill.level
      };
    });

    setRollData({
      type: `Skill: ${skill.name}`,
      baseModifier: attributeOptions[0].value, // Default to first attribute
      attributeOptions
    });
    setIsRollerOpen(true);
  };

  // Handle skill selection from database
  const handleSkillSelect = (skill: SkillDefinition) => {
    if (character.socialXP >= 2) {
      setSelectedSkill(skill);
      setShowAddSkillModal(false);
      setShowAttributeSelectModal(true);
    }
  };

  // Handle attribute selection (for new skills or leveling up)
  const handleAttributeSelect = (attribute: string) => {
    if (selectedSkill === null) return;

    // Adding a new skill
    if (levelUpSkillIndex === null) {
      const cost = 2; // Level 1 costs 2 XP

      const newSkill: Skill = {
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
        progressionLog: [
          ...character.progressionLog,
          {
            type: 'skill',
            name: selectedSkill.name,
            level: 1,
            attribute: attribute,
            cost: cost
          }
        ]
      });
    }
    // Leveling up existing skill
    else {
      const skill = character.skills[levelUpSkillIndex];
      const newLevel = skill.level + 1;
      const cost = newLevel * 2; // Level 2=4, Level 3=6, Level 4=8, Level 5=10

      const updatedSkill: Skill = {
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
        progressionLog: [
          ...character.progressionLog,
          {
            type: 'skill',
            name: skill.name,
            level: newLevel,
            attribute: attribute,
            cost: cost
          }
        ]
      });
    }

    setShowAttributeSelectModal(false);
    setSelectedSkill(null);
    setLevelUpSkillIndex(null);
  };

  // Handle canceling attribute selection
  const handleAttributeCancel = () => {
    setShowAttributeSelectModal(false);
    setSelectedSkill(null);
    if (levelUpSkillIndex !== null) {
      setLevelUpSkillIndex(null);
    } else {
      setShowAddSkillModal(true);
    }
  };

  // Toggle skill expansion
  const toggleSkillExpand = (index: number) => {
    setExpandedSkillIndex(expandedSkillIndex === index ? null : index);
  };

  // Handle skill level up
  const handleSkillLevelUp = (index: number) => {
    const skill = character.skills[index];
    const cost = (skill.level + 1) * 2;

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

  // Handle skill level down
  const handleSkillLevelDown = (index: number) => {
    const skill = character.skills[index];
    if (skill.level <= 1) return;

    const cost = skill.level * 2; // Refund the cost of current level

    const updatedSkill: Skill = {
      ...skill,
      level: skill.level - 1,
      attributeHistory: skill.attributeHistory.slice(0, -1)
    };

    const updatedSkills = [...character.skills];
    updatedSkills[index] = updatedSkill;

    // Remove the last matching progression entry for this skill
    const updatedLog = [...character.progressionLog];
    for (let i = updatedLog.length - 1; i >= 0; i--) {
      if (
        updatedLog[i].type === 'skill' &&
        updatedLog[i].name === skill.name
      ) {
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
  };

  // Handle editing a perk
  const handleEditPerk = (perk: Perk) => {
    if (editingPerkIndex === null) return;

    const oldPerk = character.perks[editingPerkIndex];
    const costDifference = perk.cost - oldPerk.cost;

    const updatedPerks = [...character.perks];
    updatedPerks[editingPerkIndex] = perk;

    // Update progression log - remove old entry and add new one
    const updatedLog = character.progressionLog.filter(
      entry =>
        !(
          entry.type === 'perk' &&
          entry.name === oldPerk.name &&
          entry.cost === oldPerk.cost
        )
    );

    onUpdate({
      ...character,
      perks: updatedPerks,
      socialXP: character.socialXP - costDifference,
      progressionLog: [
        ...updatedLog,
        {
          type: 'perk',
          name: perk.name,
          attribute: perk.attribute,
          cost: perk.cost
        }
      ]
    });

    setEditingPerkIndex(null);
  };

  // Handle deleting a perk (by name, from abilities/effects section)
  const handleDeletePerk = (perkName: string) => {
    const perkIndex = character.perks.findIndex(p => p.name === perkName);
    if (perkIndex === -1) return;

    const perk = character.perks[perkIndex];
    const updatedPerks = character.perks.filter((_, i) => i !== perkIndex);

    // Remove from progression log - find the most recent matching entry
    const updatedLog = [...character.progressionLog];
    for (let i = updatedLog.length - 1; i >= 0; i--) {
      if (
        updatedLog[i].type === 'perk' &&
        updatedLog[i].name === perk.name &&
        updatedLog[i].cost === perk.cost &&
        updatedLog[i].attribute === perk.attribute
      ) {
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
  };

  return (
    <>
      <div className="p-4">
        {/* Skills Section */}
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
              className="p-3 cursor-pointer hover:bg-slate-750 transition-colors flex justify-between items-center"
              onClick={() => toggleSkillExpand(index)}
            >
              <div>
                <span className="text-white font-medium">
                  {skill.name}[{skill.level}]
                </span>
                <span className="text-slate-400 text-sm ml-2">
                  ({skill.attributes})
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSkillRoll(skill);
                }}
                className="bg-blue-700 hover:bg-blue-600 rounded p-2 text-white transition-colors"
              >
                <Dice6 size={16} />
              </button>
            </div>
            {expandedSkillIndex === index && (
              <div className="px-3 pb-3 border-t border-slate-700">
                <p className="text-slate-300 text-sm mt-2 mb-3">
                  {skill.description}
                </p>

                <div className="mb-3">
                  <div className="text-xs font-semibold text-slate-400 mb-1">
                    Attribute History:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {skill.attributeHistory.map((attr, i) => (
                      <span
                        key={i}
                        className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded"
                      >
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
                    disabled={
                      skill.level >= 5 ||
                      character.socialXP < (skill.level + 1) * 2
                    }
                    className={`flex-1 rounded py-2 text-white font-semibold flex items-center justify-center gap-1 ${
                      skill.level >= 5 ||
                      character.socialXP < (skill.level + 1) * 2
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

      {/* Granted Abilities & Effects Section */}
      <div className="px-4 pb-4">
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-slate-750 border-b border-slate-700 flex items-center gap-2">
            <BookOpen size={18} className="text-slate-300" />
            <h3 className="text-white font-semibold">Granted Abilities & Effects</h3>
            <span className="text-slate-400 text-sm ml-auto">
              {skillAbilities.length} abilities, {skillEffects.length} effects
            </span>
          </div>
          <div className="p-4">
            {skillAbilities.length === 0 && skillEffects.length === 0 ? (
              <div className="text-slate-500 text-sm text-center py-4">
                No abilities or effects from #Skill perks. Add perks in the Perks tab.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {/* Abilities Column */}
                <div>
                  <h4 className="text-blue-400 text-sm font-semibold mb-2">
                    Abilities ({skillAbilities.length})
                  </h4>
                  {skillAbilities.length === 0 ? (
                    <div className="text-slate-500 text-xs text-center py-2">No abilities</div>
                  ) : (
                    <div className="space-y-2">
                      {skillAbilities.map((ability, index) => (
                        <AbilityEffectCard
                          key={`skill-ability-${index}`}
                          item={ability}
                          isAbility={true}
                          onDelete={() => handleDeletePerk(ability.sourcePerk)}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {/* Effects Column */}
                <div>
                  <h4 className="text-purple-400 text-sm font-semibold mb-2">
                    Effects ({skillEffects.length})
                  </h4>
                  {skillEffects.length === 0 ? (
                    <div className="text-slate-500 text-xs text-center py-2">No effects</div>
                  ) : (
                    <div className="space-y-2">
                      {skillEffects.map((effect, index) => (
                        <AbilityEffectCard
                          key={`skill-effect-${index}`}
                          item={effect}
                          isAbility={false}
                          onDelete={() => handleDeletePerk(effect.sourcePerk)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skill Selection Modal */}
      <SkillSelectModal
        isOpen={showAddSkillModal}
        onClose={() => setShowAddSkillModal(false)}
        onSelectSkill={handleSkillSelect}
        learnedSkills={character.skills.map(s => s.name)}
        availableCP={character.socialXP}
      />

      {/* Edit Perk Modal */}
      {editingPerkIndex !== null && (
        <PerkModal
          isOpen={showEditPerkModal}
          onClose={() => {
            setShowEditPerkModal(false);
            setEditingPerkIndex(null);
          }}
          onSave={handleEditPerk}
          availableCP={character.socialXP}
          editingPerk={character.perks[editingPerkIndex]}
          existingCost={character.perks[editingPerkIndex].cost}
        />
      )}

      {/* Attribute Selection Modal */}
      {showAttributeSelectModal && selectedSkill && (
        <Modal
          isOpen={showAttributeSelectModal}
          onClose={handleAttributeCancel}
          title={selectedSkill.name}
        >
          <p className="text-slate-400 text-sm mb-2 text-center">
            {levelUpSkillIndex !== null
              ? `Level ${character.skills[levelUpSkillIndex].level} → ${
                  character.skills[levelUpSkillIndex].level + 1
                }: Select attribute to improve:`
              : 'Select which attribute to apply points to:'}
          </p>
          <p className="text-slate-400 text-xs mb-4 text-center">
            Cost:{' '}
            {levelUpSkillIndex !== null
              ? (character.skills[levelUpSkillIndex].level + 1) * 2
              : 2}{' '}
            XP
            <span className="ml-2">
              ({character.socialXP} →{' '}
              {character.socialXP -
                (levelUpSkillIndex !== null
                  ? (character.skills[levelUpSkillIndex].level + 1) * 2
                  : 2)}{' '}
              Skill XP)
            </span>
          </p>

          <AttributeSelector
            attributes={selectedSkill.attributes}
            onSelect={handleAttributeSelect}
            onCancel={handleAttributeCancel}
          />
        </Modal>
      )}

      {/* Dice Roller Modal */}
      <DiceRollerModal
        isOpen={isRollerOpen}
        onClose={() => setIsRollerOpen(false)}
        rollData={rollData}
      />
    </>
  );
};
