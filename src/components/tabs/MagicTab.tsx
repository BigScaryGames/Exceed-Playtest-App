import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Zap, ZapOff, Dice6, ChevronDown, ChevronRight, ScrollText } from 'lucide-react';
import { Character, KnownSpell } from '@/types/character';
import type { PerkDatabase } from '@/types/perks';
import {
  calculateCastingDC,
  getSpellData,
  attuneSpell,
  unattuneSpell,
  removeSpellFromKnown,
  getSpellsByTier,
  getSpellcraft,
  canUpgradeSpell,
  getUpgradeCost,
  upgradeSpellToAdvanced
} from '@/utils/spells';
import { AddSpellModal } from '@/components/modals/AddSpellModal';
import { EditSpellModal } from '@/components/modals/EditSpellModal';
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
    <div className="bg-slate-700 rounded overflow-hidden">
      <div
        className="p-3 cursor-pointer hover:bg-slate-600 transition-colors"
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
        <div className="px-3 pb-3 border-t border-slate-600">
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

interface MagicTabProps {
  character: Character;
  onUpdate: (character: Character) => void;
  perkDatabase: PerkDatabase | null;
}

export const MagicTab: React.FC<MagicTabProps> = ({ character, onUpdate, perkDatabase }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSpell, setEditingSpell] = useState<KnownSpell | null>(null);
  const [isRollerOpen, setIsRollerOpen] = useState(false);
  const [rollData, setRollData] = useState<RollData | null>(null);
  const [expandedSpellId, setExpandedSpellId] = useState<string | null>(null);

  // Initialize magic system if needed
  if (!character.knownSpells) {
    character.knownSpells = [];
  }
  if (!character.attunedSpells) {
    character.attunedSpells = [];
  }

  const spellcraft = getSpellcraft(character);
  const spellsByTier = getSpellsByTier(character);

  // Get abilities and effects with inherited tags
  const abilities = getActiveAbilitiesWithInheritedTags(character, perkDatabase);
  const effects = getActiveEffectsWithInheritedTags(character, perkDatabase);

  // Filter by #Spellcraft tag
  const spellcraftAbilities = abilities.filter(a => a.tags.includes('Spellcraft'));
  const spellcraftEffects = effects.filter(e => e.tags.includes('Spellcraft'));

  const handleAttuneToggle = (spellId: string) => {
    const isAttuned = character.attunedSpells?.includes(spellId);

    if (isAttuned) {
      const updatedCharacter = unattuneSpell(character, spellId);
      onUpdate(updatedCharacter);
    } else {
      const result = attuneSpell(character, spellId);
      if (result.success) {
        onUpdate(result.character);
      } else {
        alert(result.reason);
      }
    }
  };

  const handleDeleteSpell = (spellId: string) => {
    if (!confirm('Are you sure you want to delete this spell? XP will be refunded.')) return;

    const spell = character.knownSpells?.find(s => s.id === spellId);
    if (!spell) return;

    const updatedCharacter = removeSpellFromKnown(character, spellId);

    // Refund XP to Combat pool (magic only uses Combat XP)
    updatedCharacter.combatXP += spell.xpCost;

    // Remove from progression log
    updatedCharacter.progressionLog = updatedCharacter.progressionLog.filter(e =>
      !(e.type === 'spell' && e.name === spell.name && e.cost === spell.xpCost)
    );

    onUpdate(updatedCharacter);
  };

  const handleCastingCheck = (spell: KnownSpell) => {
    const castingModifier = spellcraft + character.stats.WT;

    setRollData({
      type: `Cast Spell: ${spell.name}`,
      baseModifier: castingModifier
    });
    setIsRollerOpen(true);
  };

  const handleUpgradeSpell = (spellId: string) => {
    const result = upgradeSpellToAdvanced(character, spellId, 'combat'); // Magic only uses Combat XP
    if (result.success) {
      onUpdate(result.character);
    } else {
      alert(result.reason);
    }
  };

  const toggleSpellExpand = (spellId: string) => {
    setExpandedSpellId(expandedSpellId === spellId ? null : spellId);
  };

  // Handle deleting a magic perk (by name, from abilities/effects section)
  const handleDeleteMagicPerkByName = (perkName: string) => {
    const perks = character.magicPerks || [];
    const perkIndex = perks.findIndex(p => p.name === perkName);
    if (perkIndex === -1) return;

    const perk = perks[perkIndex];
    const updatedMagicPerks = perks.filter((_, i) => i !== perkIndex);

    // Remove from progression log - find the most recent matching entry
    const updatedLog = [...character.progressionLog];
    for (let i = updatedLog.length - 1; i >= 0; i--) {
      if (
        updatedLog[i].type === 'magicPerk' &&
        updatedLog[i].name === perk.name &&
        updatedLog[i].cost === perk.cost &&
        updatedLog[i].attribute === perk.attribute
      ) {
        updatedLog.splice(i, 1);
        break;
      }
    }

    // Refund XP to Combat pool (magic only uses Combat XP)
    onUpdate({
      ...character,
      magicPerks: updatedMagicPerks,
      combatXP: character.combatXP + perk.cost,
      progressionLog: updatedLog
    });
  };

  return (
    <div className="p-4">
      {/* Spellcraft Abilities & Effects Section */}
      <div className="bg-slate-800 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <ScrollText size={18} className="text-slate-300" />
            <h4 className="text-lg font-bold text-white">Spellcraft Abilities & Effects</h4>
          </div>
          <span className="text-slate-400 text-sm">
            {spellcraftAbilities.length} abilities, {spellcraftEffects.length} effects
          </span>
        </div>
        {spellcraftAbilities.length === 0 && spellcraftEffects.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-4">
            No abilities or effects from #Spellcraft perks. Add perks in the Perks tab.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* Abilities Column */}
            <div>
              <h5 className="text-blue-400 text-sm font-semibold mb-2">
                Abilities ({spellcraftAbilities.length})
              </h5>
              {spellcraftAbilities.length === 0 ? (
                <div className="text-slate-500 text-xs text-center py-2">No abilities</div>
              ) : (
                <div className="space-y-2">
                  {spellcraftAbilities.map((ability, index) => (
                    <AbilityEffectCard
                      key={`spellcraft-ability-${index}`}
                      item={ability}
                      isAbility={true}
                      onDelete={() => handleDeleteMagicPerkByName(ability.sourcePerk)}
                    />
                  ))}
                </div>
              )}
            </div>
            {/* Effects Column */}
            <div>
              <h5 className="text-purple-400 text-sm font-semibold mb-2">
                Effects ({spellcraftEffects.length})
              </h5>
              {spellcraftEffects.length === 0 ? (
                <div className="text-slate-500 text-xs text-center py-2">No effects</div>
              ) : (
                <div className="space-y-2">
                  {spellcraftEffects.map((effect, index) => (
                    <AbilityEffectCard
                      key={`spellcraft-effect-${index}`}
                      item={effect}
                      isAbility={false}
                      onDelete={() => handleDeleteMagicPerkByName(effect.sourcePerk)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Known Spells Section */}
      <div className="bg-slate-800 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-lg font-bold text-white">Known Spells</h4>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 rounded px-4 py-2 text-white font-semibold"
          >
            <Plus size={20} />
            Learn Spell
          </button>
        </div>

        {character.knownSpells.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">No spells learned yet</p>
            <p className="text-slate-500 text-sm mt-2">Click "Learn Spell" to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from(spellsByTier.entries()).map(([tier, spells]) => {
              if (spells.length === 0) return null;

              return (
                <div key={tier} className="border-t border-slate-700 pt-3 first:border-0 first:pt-0">
                  <h5 className="text-sm font-semibold text-slate-300 mb-2">Tier {tier}</h5>
                  <div className="space-y-2">
                    {spells.map((spell) => {
                      const spellData = getSpellData(spell);
                      if (!spellData) return null;

                      const isAttuned = character.attunedSpells?.includes(spell.id);
                      const castingDC = calculateCastingDC(spell.tier);
                      const isExpanded = expandedSpellId === spell.id;
                      const canUpgrade = canUpgradeSpell(spell);
                      const upgradeCost = canUpgrade ? getUpgradeCost(spell) : 0;

                      return (
                        <div
                          key={spell.id}
                          className="bg-slate-700 rounded overflow-hidden"
                        >
                          {/* Collapsed View - Always Visible */}
                          <div
                            className="p-3 cursor-pointer hover:bg-slate-600 transition-colors"
                            onClick={() => toggleSpellExpand(spell.id)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              {/* Left: Spell Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {isExpanded ? <ChevronDown size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />}
                                  <span className="text-white font-medium truncate">{spell.name}</span>
                                  <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                                    spell.type === 'basic' ? 'bg-blue-700' : 'bg-purple-700'
                                  }`}>
                                    {spell.type === 'basic' ? 'Basic' : 'Advanced'}
                                  </span>
                                  {spell.isCustom && (
                                    <span className="text-xs bg-amber-700 px-1.5 py-0.5 rounded flex-shrink-0">
                                      Custom
                                    </span>
                                  )}
                                  {isAttuned && (
                                    <span className="text-xs bg-green-700 px-1.5 py-0.5 rounded flex-shrink-0">
                                      Attuned
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                                  <span>AP {spellData.apCost}</span>
                                  <span>•</span>
                                  <span>{spellData.distance}</span>
                                  {spellData.limitCost > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="text-yellow-400">Limit {spellData.limitCost}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Right: Action Buttons */}
                              <div className="flex gap-2">
                                {spellData.limitCost > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAttuneToggle(spell.id);
                                    }}
                                    className={`flex-shrink-0 rounded p-2 ${
                                      isAttuned
                                        ? 'bg-green-700 hover:bg-green-600 text-white'
                                        : 'bg-slate-600 hover:bg-slate-500 text-slate-300'
                                    }`}
                                    title={isAttuned ? 'Unattuned' : 'Attune Spell'}
                                  >
                                    {isAttuned ? <Zap size={18} /> : <ZapOff size={18} />}
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCastingCheck(spell);
                                  }}
                                  className="flex-shrink-0 bg-blue-600 hover:bg-blue-500 rounded p-2 text-white"
                                  title={`Cast Spell (DC ${castingDC})`}
                                >
                                  <Dice6 size={18} />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Expanded View - Details */}
                          {isExpanded && (
                            <div className="px-3 pb-3 border-t border-slate-600">
                              {/* Spell Details */}
                              <div className="text-xs text-slate-300 mt-3 mb-3 space-y-2">
                                <div>
                                  <span className="text-slate-400">Duration:</span> {spellData.duration}
                                </div>
                                {spellData.damage && (
                                  <div>
                                    <span className="text-slate-400">Damage:</span> {spellData.damage}
                                  </div>
                                )}
                                <div>
                                  <span className="text-slate-400">Traits:</span> {spellData.traits.join(', ')}
                                </div>
                                <div>
                                  <span className="text-slate-400">Effect:</span>
                                  <p className="text-slate-300 italic mt-1">{spellData.effect}</p>
                                </div>
                                <div>
                                  <span className="text-slate-400">Casting DC:</span> {castingDC}
                                </div>
                              </div>

                              {/* Upgrade Section */}
                              {canUpgrade && (
                                <div className="bg-purple-900/30 border border-purple-700 rounded p-3 mb-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <div>
                                      <p className="text-purple-300 font-semibold text-sm">Upgrade Available</p>
                                      <p className="text-purple-400 text-xs mt-1">
                                        Upgrade to Advanced version ({upgradeCost} Combat XP)
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpgradeSpell(spell.id);
                                    }}
                                    className="w-full bg-purple-700 hover:bg-purple-600 rounded py-2 text-white font-semibold text-sm"
                                  >
                                    Upgrade to Advanced
                                  </button>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSpell(spell);
                                  }}
                                  className="flex items-center justify-center gap-1 bg-slate-600 hover:bg-slate-500 text-white py-2 rounded font-semibold text-sm"
                                >
                                  <Pencil size={14} />
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSpell(spell.id);
                                  }}
                                  className="flex items-center justify-center gap-1 bg-red-700 hover:bg-red-600 text-white py-2 rounded font-semibold text-sm"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Spell Modal */}
      <AddSpellModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        character={character}
        onUpdate={onUpdate}
      />

      {/* Edit Spell Modal */}
      <EditSpellModal
        isOpen={editingSpell !== null}
        onClose={() => setEditingSpell(null)}
        spell={editingSpell}
        character={character}
        onUpdate={onUpdate}
      />

      {/* Dice Roller Modal */}
      <DiceRollerModal
        isOpen={isRollerOpen}
        onClose={() => setIsRollerOpen(false)}
        rollData={rollData}
      />
    </div>
  );
};
