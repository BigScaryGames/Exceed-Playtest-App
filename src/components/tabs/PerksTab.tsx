import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Swords, ScrollText } from 'lucide-react';
import { Character } from '@/types/character';
import type { PerkDatabase, Perk } from '@/types/perks';
import {
  getActiveAbilitiesWithInheritedTags,
  getActiveEffectsWithInheritedTags,
  ActiveAbility,
  ActiveEffect
} from '@/utils/effectCalculator';
import { AddPerkModal } from '@/components/modals/AddPerkModal';

interface PerksTabProps {
  character: Character;
  onUpdate: (character: Character) => void;
  perkDatabase: PerkDatabase | null;
}

type PerkSection = 'spellcraft' | 'martial' | 'skill';
type ViewMode = 'owned' | 'browse';

interface SectionConfig {
  id: PerkSection;
  title: string;
  icon: React.ReactNode;
  tag: string;
  ownedPerks: (Perk | { name: string; cost: number; attribute: string; description?: string; perkSnapshot?: Perk })[];
  allPerks: Perk[];
}

// Ability/Effect card component
interface AbilityEffectCardProps {
  item: ActiveAbility | ActiveEffect;
  isAbility: boolean;
}
const AbilityEffectCard: React.FC<AbilityEffectCardProps> = ({ item, isAbility }) => {
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
        </div>
      )}
    </div>
  );
};

// Perk card component
interface PerkCardProps {
  perk: Perk | { name: string; cost: number; attribute: string; description?: string };
  onEdit?: () => void;
  onDelete?: () => void;
}
const PerkCard: React.FC<PerkCardProps> = ({ perk, onEdit, onDelete }) => {
  const snapshot = (perk as any).perkSnapshot;
  const tags = snapshot?.tags || [];

  return (
    <div className="bg-slate-800 rounded overflow-hidden">
      <div className="p-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <span className="text-white font-medium text-sm">{perk.name}</span>
            <div className="text-slate-400 text-xs mt-0.5">
              {(perk as any).cost} XP • {(perk as any).attribute}
            </div>
          </div>
          <div className="flex gap-1 ml-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="text-slate-400 hover:text-white p-1"
              >
                ✏️
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="text-slate-400 hover:text-red-400 p-1"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map((tag: string, i: number) => (
              <span
                key={i}
                className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Section component
interface PerkSectionProps {
  config: SectionConfig;
  isExpanded: boolean;
  onToggle: () => void;
  viewMode: ViewMode;
  onViewChange: (view: ViewMode) => void;
  abilities: ActiveAbility[];
  effects: ActiveEffect[];
  onAddPerk: () => void;
  onPerkDelete?: (index: number) => void;
}
const PerkSection: React.FC<PerkSectionProps> = ({
  config,
  isExpanded,
  onToggle,
  viewMode,
  onViewChange,
  abilities,
  effects,
  onAddPerk,
  onPerkDelete
}) => {
  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden">
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-slate-750 hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-slate-300">
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
          <div className="flex items-center gap-2">
            {config.icon}
            <span className="text-white font-semibold">{config.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <span>{config.ownedPerks.length} perks</span>
          <span>{abilities.length + effects.length} abilities/effects</span>
        </div>
      </button>

      {/* Section Content */}
      {isExpanded && (
        <div className="p-4">
          {/* View Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => onViewChange('owned')}
              className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition-colors ${
                viewMode === 'owned'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Owned
            </button>
            <button
              onClick={() => onViewChange('browse')}
              className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition-colors ${
                viewMode === 'browse'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Browse
            </button>
          </div>

          {/* Owned View */}
          {viewMode === 'owned' && (
            <div className="space-y-3">
              {/* Perks */}
              {config.ownedPerks.length === 0 ? (
                <div className="text-slate-500 text-sm text-center py-4">
                  No {config.title.toLowerCase()} perks yet
                </div>
              ) : (
                <div className="space-y-2">
                  {config.ownedPerks.map((perk, index) => (
                    <PerkCard
                      key={`${config.id}-perk-${index}-${(perk as any).id || perk.name}`}
                      perk={perk}
                      onDelete={onPerkDelete ? () => onPerkDelete(index) : undefined}
                    />
                  ))}
                </div>
              )}

              {/* Abilities & Effects */}
              {(abilities.length > 0 || effects.length > 0) && (
                <div className="border-t border-slate-700 pt-3">
                  <h4 className="text-slate-300 text-sm font-semibold mb-2">
                    Granted Abilities & Effects
                  </h4>
                  {abilities.length === 0 && effects.length === 0 ? (
                    <div className="text-slate-500 text-xs text-center py-2">
                      No abilities or effects
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {abilities.map((ability, index) => (
                        <AbilityEffectCard
                          key={`${config.id}-ability-${index}`}
                          item={ability}
                          isAbility={true}
                        />
                      ))}
                      {effects.map((effect, index) => (
                        <AbilityEffectCard
                          key={`${config.id}-effect-${index}`}
                          item={effect}
                          isAbility={false}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Browse View */}
          {viewMode === 'browse' && (
            <div className="space-y-3">
              <div className="text-slate-400 text-sm text-center py-4">
                Browse functionality coming soon
              </div>
              <button
                onClick={onAddPerk}
                className="w-full bg-blue-700 hover:bg-blue-600 rounded py-2 text-white text-sm font-semibold"
              >
                Add {config.title} Perk
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const PerksTab: React.FC<PerksTabProps> = ({
  character,
  onUpdate,
  perkDatabase
}) => {
  // Section expansion states
  const [expandedSections, setExpandedSections] = useState<{
    spellcraft: boolean;
    martial: boolean;
    skill: boolean;
  }>({
    spellcraft: true,
    martial: true,
    skill: true
  });

  // View mode for each section
  const [sectionViews, setSectionViews] = useState<{
    spellcraft: ViewMode;
    martial: ViewMode;
    skill: ViewMode;
  }>({
    spellcraft: 'owned',
    martial: 'owned',
    skill: 'owned'
  });

  // Modal states
  const [showAddMagicPerkModal, setShowAddMagicPerkModal] = useState(false);
  const [showAddCombatPerkModal, setShowAddCombatPerkModal] = useState(false);
  const [showAddSkillPerkModal, setShowAddSkillPerkModal] = useState(false);

  // Get abilities and effects with inherited tags
  const abilities = getActiveAbilitiesWithInheritedTags(character, perkDatabase);
  const effects = getActiveEffectsWithInheritedTags(character, perkDatabase);

  // Filter by tag for each section
  const spellcraftAbilities = abilities.filter(a => a.tags.includes('Spellcraft'));
  const spellcraftEffects = effects.filter(e => e.tags.includes('Spellcraft'));
  const martialAbilities = abilities.filter(a => a.tags.includes('Combat'));
  const martialEffects = effects.filter(e => e.tags.includes('Combat'));
  const skillAbilities = abilities.filter(a => a.tags.includes('Skill'));
  const skillEffects = effects.filter(e => e.tags.includes('Skill'));

  // Handle delete magic perk
  const handleDeleteMagicPerk = (index: number) => {
    const perk = character.magicPerks?.[index];
    if (!perk) return;

    const updatedMagicPerks = character.magicPerks?.filter((_, i) => i !== index) || [];

    // Remove from progression log
    const updatedLog = [...character.progressionLog];
    for (let i = updatedLog.length - 1; i >= 0; i--) {
      if (updatedLog[i].type === 'magicPerk' &&
          updatedLog[i].name === perk.name &&
          updatedLog[i].cost === perk.cost &&
          updatedLog[i].attribute === perk.attribute) {
        updatedLog.splice(i, 1);
        break;
      }
    }

    onUpdate({
      ...character,
      magicPerks: updatedMagicPerks,
      combatXP: character.combatXP + perk.cost,
      progressionLog: updatedLog
    });
  };

  // Handle delete combat perk
  const handleDeleteCombatPerk = (index: number) => {
    const perk = character.combatPerks[index];
    const updatedPerks = character.combatPerks.filter((_, i) => i !== index);

    // Check if this is a completed conditioning perk
    const isConditioningPerk = perk.perkSnapshot?.tags?.includes('Conditioning') ||
      perk.name.includes('(Completed)');
    const basePerkName = perk.name.replace(' (Completed)', '');

    let updatedLog = [...character.progressionLog];
    let totalRefund = 0;
    let shouldDecrementWounds = false;

    if (isConditioningPerk) {
      // For conditioning perks: remove ALL stagedPerk entries with this name
      updatedLog = character.progressionLog.filter(entry => {
        if (entry.type === 'stagedPerk' && entry.name === basePerkName) {
          totalRefund += entry.cost || 0;
          return false;
        }
        if (entry.type === 'combatPerk' &&
            (entry.name === perk.name || entry.name === `${basePerkName} (Completed)`)) {
          return false;
        }
        return true;
      });
      shouldDecrementWounds = true;
    } else {
      // Regular combat perk: just remove the single entry
      for (let i = updatedLog.length - 1; i >= 0; i--) {
        if (updatedLog[i].type === 'combatPerk' &&
            updatedLog[i].name === perk.name &&
            updatedLog[i].cost === perk.cost) {
          totalRefund = updatedLog[i].cost || 0;
          updatedLog.splice(i, 1);
          break;
        }
      }
    }

    const updatedCharacter = {
      ...character,
      combatPerks: updatedPerks,
      combatXP: character.combatXP + totalRefund,
      progressionLog: updatedLog
    };

    // Handle wound decrement for conditioning perks
    if (shouldDecrementWounds && character.maxWounds > 1) {
      updatedCharacter.maxWounds = character.maxWounds - 1;
    }

    onUpdate(updatedCharacter);
  };

  // Handle delete skill perk
  const handleDeleteSkillPerk = (index: number) => {
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
  };

  // Section configurations
  const sections: SectionConfig[] = [
    {
      id: 'spellcraft',
      title: 'Spellcraft',
      icon: <ScrollText size={18} />,
      tag: 'Spellcraft',
      ownedPerks: character.magicPerks || [],
      allPerks: perkDatabase?.perks.magic || []
    },
    {
      id: 'martial',
      title: 'Martial',
      icon: <Swords size={18} />,
      tag: 'Combat',
      ownedPerks: character.combatPerks,
      allPerks: perkDatabase?.perks.combat || []
    },
    {
      id: 'skill',
      title: 'Skill',
      icon: <BookOpen size={18} />,
      tag: 'Skill',
      ownedPerks: character.perks,
      allPerks: perkDatabase?.perks.skill || []
    }
  ];

  const toggleSection = (section: PerkSection) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleAddPerk = (section: PerkSection) => {
    switch (section) {
      case 'spellcraft':
        setShowAddMagicPerkModal(true);
        break;
      case 'martial':
        setShowAddCombatPerkModal(true);
        break;
      case 'skill':
        setShowAddSkillPerkModal(true);
        break;
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Section for each perk type */}
      <PerkSection
        config={sections[0]}
        isExpanded={expandedSections.spellcraft}
        onToggle={() => toggleSection('spellcraft')}
        viewMode={sectionViews.spellcraft}
        onViewChange={(view) => setSectionViews(prev => ({ ...prev, spellcraft: view }))}
        abilities={spellcraftAbilities}
        effects={spellcraftEffects}
        onAddPerk={() => handleAddPerk('spellcraft')}
        onPerkDelete={handleDeleteMagicPerk}
      />

      <PerkSection
        config={sections[1]}
        isExpanded={expandedSections.martial}
        onToggle={() => toggleSection('martial')}
        viewMode={sectionViews.martial}
        onViewChange={(view) => setSectionViews(prev => ({ ...prev, martial: view }))}
        abilities={martialAbilities}
        effects={martialEffects}
        onAddPerk={() => handleAddPerk('martial')}
        onPerkDelete={handleDeleteCombatPerk}
      />

      <PerkSection
        config={sections[2]}
        isExpanded={expandedSections.skill}
        onToggle={() => toggleSection('skill')}
        viewMode={sectionViews.skill}
        onViewChange={(view) => setSectionViews(prev => ({ ...prev, skill: view }))}
        abilities={skillAbilities}
        effects={skillEffects}
        onAddPerk={() => handleAddPerk('skill')}
        onPerkDelete={handleDeleteSkillPerk}
      />

      {/* Modals */}
      <AddPerkModal
        isOpen={showAddMagicPerkModal}
        onClose={() => setShowAddMagicPerkModal(false)}
        character={character}
        onUpdate={onUpdate}
        category="magic"
        perkDatabase={perkDatabase}
      />

      <AddPerkModal
        isOpen={showAddCombatPerkModal}
        onClose={() => setShowAddCombatPerkModal(false)}
        character={character}
        onUpdate={onUpdate}
        category="combat"
        perkDatabase={perkDatabase}
      />

      <AddPerkModal
        isOpen={showAddSkillPerkModal}
        onClose={() => setShowAddSkillPerkModal(false)}
        character={character}
        onUpdate={onUpdate}
        category="skill"
        perkDatabase={perkDatabase}
      />
    </div>
  );
};
