import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Swords, ScrollText, Plus, Search, X } from 'lucide-react';
import { Character } from '@/types/character';
import type { PerkDatabase, Perk } from '@/types/perks';
import {
  getActiveAbilitiesWithInheritedTags,
  getActiveEffectsWithInheritedTags,
  ActiveAbility,
  ActiveEffect
} from '@/utils/effectCalculator';
import { AddPerkModal } from '@/components/modals/AddPerkModal';
import { PerkBrowserModal } from '@/components/modals/PerkBrowserModal';
import { ATTRIBUTE_MAP } from '@/utils/constants';

interface PerksTabProps {
  character: Character;
  onUpdate: (character: Character) => void;
  perkDatabase: PerkDatabase | null;
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
  perk: Perk | { name: string; cost: number | { xp: number; variable: boolean }; attribute: string; description?: string };
  onDelete?: () => void;
}
const PerkCard: React.FC<PerkCardProps> = ({ perk, onDelete }) => {
  const snapshot = (perk as any).perkSnapshot;
  const tags = snapshot?.tags || [];

  // Extract cost value - handle both number and object formats
  const costValue = typeof (perk as any).cost === 'object' ? (perk as any).cost.xp : (perk as any).cost;
  const costDisplay = (perk as any).cost?.variable ? 'Variable' : `${costValue} XP`;

  return (
    <div className="bg-slate-800 rounded overflow-hidden">
      <div className="p-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <span className="text-white font-medium text-sm">{perk.name}</span>
            <div className="text-slate-400 text-xs mt-0.5">
              {costDisplay} • {(perk as any).attribute}
            </div>
          </div>
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-slate-400 hover:text-red-400 p-1"
            >
              <X size={16} />
            </button>
          )}
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

// Perk section component
interface PerkSectionProps {
  title: string;
  icon: React.ReactNode;
  perks: (Perk | { name: string; cost: number; attribute: string; description?: string; perkSnapshot?: Perk })[];
  abilities: ActiveAbility[];
  effects: ActiveEffect[];
  onAddPerk: () => void;
  onPerkDelete?: (index: number) => void;
}
const PerkSection: React.FC<PerkSectionProps> = ({
  title,
  icon,
  perks,
  abilities,
  effects,
  onAddPerk,
  onPerkDelete
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between bg-slate-750">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 flex-1"
        >
          <div className="text-slate-300">
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-white font-semibold">{title}</span>
            <span className="text-slate-400 text-sm">({perks.length})</span>
          </div>
        </button>
        <button
          onClick={onAddPerk}
          className="flex items-center gap-1 bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded"
        >
          <Plus size={14} />
          Add Perk
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {/* Perks */}
          {perks.length === 0 ? (
            <div className="text-slate-500 text-sm text-center py-4">
              No perks yet
            </div>
          ) : (
            <div className="space-y-2">
              {perks.map((perk, index) => (
                <PerkCard
                  key={`${title}-perk-${index}-${(perk as any).id || perk.name}`}
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
              <div className="space-y-2">
                {abilities.map((ability, index) => (
                  <AbilityEffectCard
                    key={`${title}-ability-${index}`}
                    item={ability}
                    isAbility={true}
                  />
                ))}
                {effects.map((effect, index) => (
                  <AbilityEffectCard
                    key={`${title}-effect-${index}`}
                    item={effect}
                    isAbility={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Conditioning perk card with level-up UI
interface ConditioningCardProps {
  stagedPerk: any;
  character: Character;
  onLevelUp: (attribute: string) => void;
  onAbandon: () => void;
  perkDatabase: PerkDatabase | null;
}
const ConditioningCard: React.FC<ConditioningCardProps> = ({
  stagedPerk,
  character,
  onLevelUp,
  onAbandon,
  perkDatabase
}) => {
  const [selectedAttribute, setSelectedAttribute] = useState('');

  const currentLevel = stagedPerk.level || 1;
  const nextLevel = currentLevel + 1;
  const isComplete = currentLevel >= 5;

  // Cost = maxWounds (flat per level)
  const cost = character.maxWounds;
  const canAfford = character.combatXP >= cost;

  // Get perk details from database or stored snapshot
  const perkDetails = perkDatabase?.perks.combat.find(p => p.id === stagedPerk.id) || stagedPerk.perkSnapshot;

  // Get valid attributes from the perk (from snapshot or database)
  const validAttributes = perkDetails?.attributes || [];

  // Initialize selected attribute to previously chosen one
  useEffect(() => {
    if (!selectedAttribute && stagedPerk.attribute) {
      setSelectedAttribute(stagedPerk.attribute);
    }
  }, [stagedPerk.attribute, selectedAttribute]);

  const handleLevelUp = () => {
    if (selectedAttribute && canAfford) {
      onLevelUp(selectedAttribute);
      setSelectedAttribute('');
    }
  };

  return (
    <div className="bg-slate-700 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-white font-semibold">{stagedPerk.name}</h4>
          <p className="text-slate-400 text-sm">{perkDetails?.description || ''}</p>
        </div>
        {!isComplete && (
          <button
            onClick={onAbandon}
            className="text-red-400 hover:text-red-300 text-xs"
          >
            Abandon
          </button>
        )}
      </div>

      {/* Level Progress */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-300 text-sm">Level {currentLevel}/5</span>
          {isComplete && (
            <span className="text-yellow-400 text-xs font-semibold">CAPSTONE!</span>
          )}
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map(n => (
            <div
              key={n}
              className={`flex-1 h-3 rounded ${
                n <= currentLevel
                  ? 'bg-green-500'
                  : n === nextLevel && !isComplete
                    ? 'bg-green-500/50 animate-pulse'
                    : 'bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* HP Gain Info */}
      {!isComplete && (
        <div className="text-blue-400 text-xs">
          Next level: +1 HP (Cost: {cost} XP)
        </div>
      )}

      {isComplete && (
        <div className="text-yellow-400 text-xs">
          Completed! Grants +1 Max Wounds and capstone effect.
        </div>
      )}

      {/* Level Up UI */}
      {!isComplete && (
        <>
          {/* Attribute Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Select Attribute
            </label>
            <div className="grid grid-cols-4 gap-2">
              {validAttributes.map((attr: string) => {
                const abbr = Object.entries(ATTRIBUTE_MAP).find(([, v]) => v === attr)?.[0] || attr;
                return (
                  <button
                    key={attr}
                    onClick={() => setSelectedAttribute(attr)}
                    className={`py-2 rounded font-semibold transition-colors text-sm ${
                      selectedAttribute === attr
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-600 hover:bg-slate-500 text-slate-300'
                    }`}
                  >
                    {abbr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Level Up Button */}
          <button
            onClick={handleLevelUp}
            disabled={!selectedAttribute || !canAfford}
            className={`w-full py-2 rounded font-semibold text-sm ${
              !selectedAttribute || !canAfford
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-green-700 hover:bg-green-600 text-white'
            }`}
          >
            {canAfford
              ? `Train Level ${nextLevel} (${cost} XP)`
              : `Not Enough XP (Need ${cost})`
            }
          </button>
        </>
      )}
    </div>
  );
};

export const PerksTab: React.FC<PerksTabProps> = ({
  character,
  onUpdate,
  perkDatabase
}) => {
  // Modal states
  const [showAddMagicPerkModal, setShowAddMagicPerkModal] = useState(false);
  const [showAddCombatPerkModal, setShowAddCombatPerkModal] = useState(false);
  const [showAddSkillPerkModal, setShowAddSkillPerkModal] = useState(false);
  const [showPerkBrowser, setShowPerkBrowser] = useState(false);

  // Get abilities and effects with inherited tags
  const abilities = getActiveAbilitiesWithInheritedTags(character, perkDatabase);
  const effects = getActiveEffectsWithInheritedTags(character, perkDatabase);

  // Helper to extract XP cost from cost (number or object)
  const getPerkCost = (perk: any): number => {
    if (typeof perk.cost === 'number') return perk.cost;
    if (typeof perk.cost === 'object' && perk.cost?.xp !== undefined) return perk.cost.xp;
    return 0;
  };

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
    const cost = getPerkCost(perk);

    // Remove from progression log
    const updatedLog = [...character.progressionLog];
    for (let i = updatedLog.length - 1; i >= 0; i--) {
      if (updatedLog[i].type === 'magicPerk' &&
          updatedLog[i].name === perk.name &&
          updatedLog[i].cost === cost &&
          updatedLog[i].attribute === perk.attribute) {
        updatedLog.splice(i, 1);
        break;
      }
    }

    onUpdate({
      ...character,
      magicPerks: updatedMagicPerks,
      combatXP: character.combatXP + cost,
      progressionLog: updatedLog
    });
  };

  // Handle delete combat perk
  const handleDeleteCombatPerk = (index: number) => {
    const perk = character.combatPerks[index];
    const updatedPerks = character.combatPerks.filter((_, i) => i !== index);

    // Check if this is a conditioning perk
    const isConditioningPerk = perk.perkSnapshot?.tags?.includes('Conditioning') ||
      perk.name.includes('Conditioning');

    let updatedLog = [...character.progressionLog];
    let totalRefund = 0;
    let shouldDecrementWounds = false;
    let extraHPToRemove = 0;

    if (isConditioningPerk) {
      // For conditioning perks: find and remove the matching entry
      for (let i = updatedLog.length - 1; i >= 0; i--) {
        if (updatedLog[i].type === 'combatPerk' &&
            updatedLog[i].name === perk.name &&
            updatedLog[i].attribute === perk.attribute) {
          totalRefund = updatedLog[i].cost || 0;
          updatedLog.splice(i, 1);
          break;
        }
      }
      extraHPToRemove = 1;
      // Check if this was the last of a set of 5 - need to decrement maxWounds
      const basePerkName = perk.name.replace(' (Completed)', '');
      const samePerkCount = character.combatPerks.filter(p =>
        p.name.includes(basePerkName) || p.name === perk.name
      ).length;
      if (perk.name.includes('(Completed)') || samePerkCount <= 1) {
        shouldDecrementWounds = true;
      }
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

    // Handle HP and wound adjustments for conditioning perks
    if (extraHPToRemove > 0) {
      updatedCharacter.extraHP = Math.max(0, character.extraHP - extraHPToRemove);
    }
    if (shouldDecrementWounds && character.maxWounds > 2) {
      updatedCharacter.maxWounds = character.maxWounds - 1;
    }

    onUpdate(updatedCharacter);
  };

  // Handle delete skill perk
  const handleDeleteSkillPerk = (index: number) => {
    const perk = character.perks[index];
    const updatedPerks = character.perks.filter((_, i) => i !== index);
    const cost = getPerkCost(perk);

    // Remove from progression log - find the most recent matching entry
    const updatedLog = [...character.progressionLog];
    for (let i = updatedLog.length - 1; i >= 0; i--) {
      if (updatedLog[i].type === 'perk' &&
          updatedLog[i].name === perk.name &&
          updatedLog[i].cost === cost &&
          updatedLog[i].attribute === perk.attribute) {
        updatedLog.splice(i, 1);
        break;
      }
    }

    onUpdate({
      ...character,
      perks: updatedPerks,
      socialXP: character.socialXP + cost,
      progressionLog: updatedLog
    });
  };

  // Handle conditioning level up
  const handleConditioningLevelUp = (stagedPerkIndex: number, attribute: string) => {
    const stagedPerk = character.stagedPerks?.[stagedPerkIndex];
    if (!stagedPerk) return;

    const currentLevel = stagedPerk.level || 1;
    const nextLevel = currentLevel + 1;
    const cost = character.maxWounds; // flat per level

    if (character.combatXP < cost) return;

    // Check if reaching level 5 (completion - move from staged to combat perks)
    if (nextLevel >= 5) {
      // LEVEL 5 COMPLETION
      // 1. Remove from stagedPerks
      // 2. Add to combatPerks as completed perk
      // 3. Increment maxWounds by 1
      // 4. Reset extraHP to 0 (the 4 HP become part of the new wound)
      // 5. Remove "extra-hp" effect from the completed perk's snapshot

      // Create modified snapshot without "extra-hp" effect (since HP is now part of maxWounds)
      const modifiedSnapshot = stagedPerk.perkSnapshot ? {
        ...stagedPerk.perkSnapshot,
        grants: {
          ...stagedPerk.perkSnapshot.grants,
          effects: (stagedPerk.perkSnapshot.grants?.effects || []).filter((e: string) => e !== 'extra-hp')
        }
      } : undefined;

      const completedPerk = {
        id: stagedPerk.id,
        name: stagedPerk.name,
        cost: cost,
        attribute: attribute,
        description: stagedPerk.perkSnapshot?.description || '',
        isCustom: false,
        source: 'database' as const,
        perkSnapshot: modifiedSnapshot,
        addedAt: Date.now()
      };

      // Remove from stagedPerks
      const updatedStagedPerks = character.stagedPerks?.filter((_, i) => i !== stagedPerkIndex) || [];

      onUpdate({
        ...character,
        stagedPerks: updatedStagedPerks,
        combatPerks: [...character.combatPerks, completedPerk],
        maxWounds: character.maxWounds + 1,
        extraHP: 0, // Reset - HP consolidated into new wound
        combatXP: character.combatXP - cost,
        progressionLog: [
          ...character.progressionLog,
          {
            type: 'stagedPerk' as const,
            name: stagedPerk.name,
            cost,
            attribute,
            xpType: 'combat' as const,
            stagedLevel: nextLevel
          },
          {
            type: 'combatPerk' as const,
            name: `${stagedPerk.name} (Completed)`,
            cost: 0,
            attribute
          }
        ]
      });
    } else {
      // LEVEL UP (1-4)
      const updatedStagedPerks = [...(character.stagedPerks || [])];
      updatedStagedPerks[stagedPerkIndex] = {
        ...stagedPerk,
        level: nextLevel,
        attribute,
        levelHistory: [
          ...(stagedPerk.levelHistory || []),
          { level: nextLevel, attribute, cost }
        ]
      };

      onUpdate({
        ...character,
        stagedPerks: updatedStagedPerks,
        extraHP: character.extraHP + 1,
        combatXP: character.combatXP - cost,
        progressionLog: [
          ...character.progressionLog,
          {
            type: 'stagedPerk' as const,
            name: stagedPerk.name,
            cost,
            attribute,
            xpType: 'combat' as const,
            stagedLevel: nextLevel
          }
        ]
      });
    }
  };

  // Handle abandon conditioning
  const handleAbandonConditioning = (stagedPerkIndex: number) => {
    const stagedPerk = character.stagedPerks?.[stagedPerkIndex];
    if (!stagedPerk) return;

    // Calculate total refund from all levels
    const totalRefund = stagedPerk.levelHistory?.reduce((sum, entry) => sum + (entry.cost || 0), 0) || 0;
    const perkLevel = stagedPerk.level || 1;

    // Remove from stagedPerks
    const updatedStagedPerks = character.stagedPerks?.filter((_, i) => i !== stagedPerkIndex) || [];

    // Calculate new values
    let newMaxWounds = character.maxWounds;
    if (perkLevel >= 5) {
      // Was completed - remove the maxWound bonus
      newMaxWounds = character.maxWounds - 1;
    }

    const newExtraHP = Math.max(0, character.extraHP - perkLevel);

    onUpdate({
      ...character,
      stagedPerks: updatedStagedPerks,
      extraHP: newExtraHP,
      maxWounds: newMaxWounds,
      combatXP: character.combatXP + totalRefund
    });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Browse Perks Button */}
      <button
        onClick={() => setShowPerkBrowser(true)}
        className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
      >
        <Search size={20} />
        Browse Perks
      </button>

      {/* Martial Section */}
      <PerkSection
        title="Martial"
        icon={<Swords size={18} />}
        perks={character.combatPerks}
        abilities={martialAbilities}
        effects={martialEffects}
        onAddPerk={() => setShowAddCombatPerkModal(true)}
        onPerkDelete={handleDeleteCombatPerk}
      />

      {/* Spellcraft Section */}
      <PerkSection
        title="Spellcraft"
        icon={<ScrollText size={18} />}
        perks={character.magicPerks || []}
        abilities={spellcraftAbilities}
        effects={spellcraftEffects}
        onAddPerk={() => setShowAddMagicPerkModal(true)}
        onPerkDelete={handleDeleteMagicPerk}
      />

      {/* Skill Section */}
      <PerkSection
        title="Skill"
        icon={<BookOpen size={18} />}
        perks={character.perks}
        abilities={skillAbilities}
        effects={skillEffects}
        onAddPerk={() => setShowAddSkillPerkModal(true)}
        onPerkDelete={handleDeleteSkillPerk}
      />

      {/* Conditioning Section */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between bg-slate-750">
          <div className="flex items-center gap-2">
            <ScrollText size={18} />
            <span className="text-white font-semibold">Conditioning</span>
            {character.stagedPerks && character.stagedPerks.length > 0 && (
              <span className="text-slate-400 text-sm">({character.stagedPerks.length})</span>
            )}
          </div>
          <button
            onClick={() => setShowPerkBrowser(true)}
            className="flex items-center gap-1 bg-green-700 hover:bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded"
          >
            <Plus size={14} />
            Add Conditioning
          </button>
        </div>

        {character.stagedPerks && character.stagedPerks.length > 0 && (
          <div className="p-4 space-y-3">
            {/* Total Extra HP Display */}
            <div className="text-center text-sm">
              <span className="text-slate-400">Total Bonus HP: </span>
              <span className="text-blue-400 font-bold">+{character.extraHP}</span>
            </div>

            {/* Individual Conditioning Perks */}
            {character.stagedPerks.map((stagedPerk, index) => (
              <ConditioningCard
                key={stagedPerk.id || index}
                stagedPerk={stagedPerk}
                character={character}
                perkDatabase={perkDatabase}
                onLevelUp={(attr) => handleConditioningLevelUp(index, attr)}
                onAbandon={() => handleAbandonConditioning(index)}
              />
            ))}
          </div>
        )}
      </div>

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

      <PerkBrowserModal
        isOpen={showPerkBrowser}
        onClose={() => setShowPerkBrowser(false)}
        character={character}
        onUpdate={onUpdate}
        perkDatabase={perkDatabase}
      />
    </div>
  );
};
