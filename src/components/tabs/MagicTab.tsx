import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Zap, ZapOff, Dice6, ChevronDown, ChevronRight } from 'lucide-react';
import { Character, KnownSpell } from '@/types/character';
import {
  calculateLimit,
  calculateCurrentLimit,
  calculateUsedLimit,
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
import { AddPerkModal } from '@/components/modals/AddPerkModal';
import { MagePerkSpellModal } from '@/components/modals/MagePerkSpellModal';

interface MagicTabProps {
  character: Character;
  onUpdate: (character: Character) => void;
}

export const MagicTab: React.FC<MagicTabProps> = ({ character, onUpdate }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSpell, setEditingSpell] = useState<KnownSpell | null>(null);
  const [isRollerOpen, setIsRollerOpen] = useState(false);
  const [rollData, setRollData] = useState<RollData | null>(null);
  const [showAddMagicPerkModal, setShowAddMagicPerkModal] = useState(false);
  const [expandedMagicPerkIndex, setExpandedMagicPerkIndex] = useState<number | null>(null);
  const [showMagePerkSpellModal, setShowMagePerkSpellModal] = useState(false);
  const [expandedSpellId, setExpandedSpellId] = useState<string | null>(null);
  const [upgradeXpType, setUpgradeXpType] = useState<'combat' | 'social'>('combat');

  // Initialize magic system if needed
  if (!character.knownSpells) {
    character.knownSpells = [];
  }
  if (!character.attunedSpells) {
    character.attunedSpells = [];
  }

  // Get spellcraft from Spell domain
  const spellcraft = getSpellcraft(character);

  const totalLimit = calculateLimit(character);
  const usedLimit = calculateUsedLimit(character);
  const currentLimit = calculateCurrentLimit(character);

  const spellsByTier = getSpellsByTier(character);

  // Get magic perks from the dedicated magicPerks array
  const magicPerks = character.magicPerks || [];

  // Check if character has Mage perk in any location (perks or magicPerks)
  const hasMagePerk = character.perks.some(p => p.name === 'Mage') ||
                      magicPerks.some(p => p.name === 'Mage');

  // Check if Mage perk free spell has been claimed (Tier 0 spell with xpCost: 0)
  const hasMagePerkFreeSpell = character.knownSpells?.some(s => s.tier === 0 && s.xpCost === 0) || false;
  const canClaimMagePerkSpell = hasMagePerk && !hasMagePerkFreeSpell;

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

    // Find the progression log entry for this spell to determine which XP pool to refund
    const spellLogEntry = character.progressionLog
      .filter(e => e.type === 'spell' && e.name === spell.name)
      .pop(); // Get the most recent one

    const xpType = spellLogEntry?.xpType || 'combat'; // Default to combat if not specified
    const updatedCharacter = removeSpellFromKnown(character, spellId);

    // Refund XP to the appropriate pool
    if (xpType === 'social') {
      updatedCharacter.socialXP += spell.xpCost;
    } else {
      updatedCharacter.combatXP += spell.xpCost;
    }

    // Remove from progression log
    const updatedLog = updatedCharacter.progressionLog.filter(e =>
      !(e.type === 'spell' && e.name === spell.name && e.cost === spell.xpCost)
    );
    updatedCharacter.progressionLog = updatedLog;

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
    const result = upgradeSpellToAdvanced(character, spellId, upgradeXpType);
    if (result.success) {
      onUpdate(result.character);
    } else {
      alert(result.reason);
    }
  };

  const toggleSpellExpand = (spellId: string) => {
    setExpandedSpellId(expandedSpellId === spellId ? null : spellId);
  };

  const toggleMagicPerkExpand = (index: number) => {
    setExpandedMagicPerkIndex(expandedMagicPerkIndex === index ? null : index);
  };

  const handleDeleteMagicPerk = (index: number) => {
    const perk = magicPerks[index];

    // Remove from magicPerks array
    const updatedMagicPerks = magicPerks.filter((_, i) => i !== index);

    // Find progression log entry to determine which XP pool to refund
    const perkLogEntry = character.progressionLog
      .filter(entry => entry.type === 'magicPerk' &&
                      entry.name === perk.name &&
                      entry.cost === perk.cost &&
                      entry.attribute === perk.attribute)
      .pop(); // Get the most recent one

    const xpType = perkLogEntry?.xpType || 'combat'; // Default to combat if not specified

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

    // Refund XP to the appropriate pool
    const updatedCharacter = {
      ...character,
      magicPerks: updatedMagicPerks,
      progressionLog: updatedLog
    };

    if (xpType === 'social') {
      updatedCharacter.socialXP = character.socialXP + perk.cost;
    } else {
      updatedCharacter.combatXP = character.combatXP + perk.cost;
    }

    onUpdate(updatedCharacter);
    setExpandedMagicPerkIndex(null);
  };

  const getLimitBarColor = (percentage: number): string => {
    if (percentage >= 80) return 'bg-red-600';
    if (percentage >= 50) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  const limitPercentage = totalLimit > 0 ? (usedLimit / totalLimit) * 100 : 0;

  return (
    <div className="p-4">
      {/* Spellcraft & Limit Section */}
      <div className="bg-slate-800 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Spellcraft */}
          <div>
            <h4 className="text-lg font-bold text-white mb-2">Spellcraft</h4>
            <div className="bg-slate-700 rounded p-3 text-center">
              <div className="text-3xl font-bold text-blue-400">{spellcraft}</div>
              <div className="text-xs text-slate-400 mt-1">Level 0-5</div>
            </div>
            {!hasMagePerk && spellcraft === 0 && (
              <div className="text-xs text-amber-400 mt-2">
                Requires Mage perk for Tier 0 access
              </div>
            )}
            <div className="text-xs text-slate-400 mt-2">
              Combat XP: {character.combatXP} | Social XP: {character.socialXP}
            </div>
          </div>

          {/* Limit */}
          <div>
            <h4 className="text-lg font-bold text-white mb-2">Limit</h4>
            <div className="bg-slate-700 rounded p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-semibold">{currentLimit} / {totalLimit}</span>
                <span className="text-xs text-slate-400">{usedLimit} used</span>
              </div>
              <div className="relative h-4 bg-slate-600 rounded-full overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 transition-all ${getLimitBarColor(limitPercentage)}`}
                  style={{ width: `${limitPercentage}%` }}
                />
              </div>
              <div className="text-xs text-slate-400 mt-2">
                Formula: 3 + Will ({character.stats.WI}) + Spellcraft ({spellcraft})
              </div>
            </div>
          </div>
        </div>

        {/* Mage Perk Free Spell Notice */}
        {canClaimMagePerkSpell && (
          <div className="bg-purple-900/30 border border-purple-700 rounded p-3 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 font-semibold">Mage Perk Available!</p>
                <p className="text-purple-400 text-sm mt-1">
                  You can claim a free Tier 0 spell from your Mage perk
                </p>
              </div>
              <button
                onClick={() => setShowMagePerkSpellModal(true)}
                className="bg-purple-700 hover:bg-purple-600 rounded px-4 py-2 text-white font-semibold whitespace-nowrap"
              >
                Claim Free Spell
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 rounded px-4 py-2 text-white font-semibold"
          >
            <Plus size={20} />
            Learn Spell
          </button>
        </div>
      </div>

      {/* Magic Perks Section */}
      <div className="bg-slate-800 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-lg font-bold text-white">Magic Perks</h4>
          <button
            onClick={() => setShowAddMagicPerkModal(true)}
            className="flex items-center gap-2 bg-purple-700 hover:bg-purple-600 rounded px-3 py-1.5 text-white text-sm font-semibold"
          >
            <Plus size={16} />
            Add Perk
          </button>
        </div>
        {magicPerks.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-slate-400 text-sm">No magic perks yet</p>
            <p className="text-slate-500 text-xs mt-1">Add perks to enhance your spellcasting</p>
          </div>
        ) : (
          <div className="space-y-2">
            {magicPerks.map((perk, index) => (
              <div key={index} className="bg-slate-700 rounded overflow-hidden">
                <div
                  className="p-3 cursor-pointer hover:bg-slate-600 transition-colors"
                  onClick={() => toggleMagicPerkExpand(index)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-white font-medium">{perk.name}</span>
                      <div className="text-sm mt-1">
                        <span className="text-green-400">{perk.cost} XP</span>
                        <span className="text-slate-400 mx-2">•</span>
                        <span className="text-purple-400">{perk.attribute}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {expandedMagicPerkIndex === index && (
                  <div className="px-3 pb-3 border-t border-slate-600">
                    {perk.description && (
                      <p className="text-slate-300 text-sm mt-2 mb-3">{perk.description}</p>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMagicPerk(index);
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
        )}
      </div>

      {/* Known Spells Section */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h4 className="text-lg font-bold text-white mb-3">Known Spells</h4>

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
                                        Upgrade to Advanced version ({upgradeCost} XP)
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 mb-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setUpgradeXpType('combat');
                                      }}
                                      className={`flex-1 py-1 px-3 rounded text-xs font-semibold ${
                                        upgradeXpType === 'combat'
                                          ? 'bg-red-700 text-white'
                                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                      }`}
                                    >
                                      Combat XP
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setUpgradeXpType('social');
                                      }}
                                      className={`flex-1 py-1 px-3 rounded text-xs font-semibold ${
                                        upgradeXpType === 'social'
                                          ? 'bg-green-700 text-white'
                                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                      }`}
                                    >
                                      Social XP
                                    </button>
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

      {/* Magic Perk Modal */}
      <AddPerkModal
        isOpen={showAddMagicPerkModal}
        onClose={() => setShowAddMagicPerkModal(false)}
        character={character}
        onUpdate={onUpdate}
        category="magic"
      />

      {/* Mage Perk Free Spell Modal */}
      <MagePerkSpellModal
        isOpen={showMagePerkSpellModal}
        onClose={() => setShowMagePerkSpellModal(false)}
        character={character}
        onUpdate={onUpdate}
      />
    </div>
  );
};
