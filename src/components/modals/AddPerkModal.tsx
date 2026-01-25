import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Character, Perk, CombatPerk } from '@/types/character';
import type { PerkDatabase, Perk as DatabasePerk } from '@/types/perks';
import { ATTRIBUTE_MAP } from '@/utils/constants';

interface AddPerkModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onUpdate: (character: Character) => void;
  perkDatabase: PerkDatabase | null;
  category?: 'skill' | 'combat' | 'magic'; // Optional: filter by category
}

export const AddPerkModal: React.FC<AddPerkModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdate,
  perkDatabase,
  category
}) => {
  const [source, setSource] = useState<'predefined' | 'custom'>('predefined');
  const [selectedPerkId, setSelectedPerkId] = useState('');
  const [selectedPredefinedAttribute, setSelectedPredefinedAttribute] = useState<string>('');

  // Custom perk fields
  const [customName, setCustomName] = useState('');
  const [customCost, setCustomCost] = useState('');
  const [customAttribute, setCustomAttribute] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  if (!isOpen) return null;

  // Get available perks from database
  const availablePerks: DatabasePerk[] = [];
  if (perkDatabase) {
    let perksToCheck: DatabasePerk[];

    if (category === 'combat') {
      // Filter out conditioning perks - they're handled by ConditioningPerkModal
      perksToCheck = perkDatabase.perks.combat.filter(perk =>
        !perk.tags.includes('Conditioning') &&
        !(perk.cost.variable && perk.cost.formula?.includes('Max_Wounds'))
      );
    } else if (category === 'magic') {
      perksToCheck = perkDatabase.perks.magic;
    } else if (category === 'skill') {
      perksToCheck = perkDatabase.perks.skill;
    } else {
      // No category filter - show all
      perksToCheck = [
        ...perkDatabase.perks.combat,
        ...perkDatabase.perks.magic,
        ...perkDatabase.perks.skill
      ];
    }

    // Filter out already learned perks
    for (const perk of perksToCheck) {
      let alreadyLearned = false;

      if (perk.type === 'skill') {
        alreadyLearned = character.perks.some(p => p.id === perk.id || p.name === perk.name);
      } else if (perk.type === 'magic') {
        alreadyLearned = (character.magicPerks || []).some(p => p.id === perk.id || p.name === perk.name);
      } else if (perk.type === 'combat') {
        alreadyLearned = character.combatPerks.some(p => p.id === perk.id || p.name === perk.name);
      }

      if (!alreadyLearned) {
        availablePerks.push(perk);
      }
    }
  }

  const selectedPerk = selectedPerkId
    ? availablePerks.find(p => p.id === selectedPerkId)
    : null;

  // Parse attributes from selected perk
  const predefinedAttributeOptions = selectedPerk ? selectedPerk.attributes : [];
  const hasMultipleAttributes = predefinedAttributeOptions.length > 1;

  const handleClose = () => {
    setSource('predefined');
    setSelectedPerkId('');
    setSelectedPredefinedAttribute('');
    setCustomName('');
    setCustomCost('');
    setCustomAttribute('');
    setCustomDescription('');
    onClose();
  };

  const handleAdd = () => {
    if (source === 'predefined' && selectedPerk) {
      addPredefinedPerk(selectedPerk);
    } else if (source === 'custom') {
      addCustomPerk();
    }
  };

  const addPredefinedPerk = (perk: DatabasePerk) => {
    // Determine the effective attribute
    let effectiveAttribute: string;

    if (hasMultipleAttributes) {
      // Multiple attributes - need user selection
      if (!selectedPredefinedAttribute) {
        alert('Please select an attribute for this perk');
        return;
      }
      effectiveAttribute = selectedPredefinedAttribute;
    } else if (perk.attributes.length === 1) {
      // Single attribute
      effectiveAttribute = perk.attributes[0];
    } else {
      alert('Please select an attribute');
      return;
    }

    // Determine which XP pool to use
    // Magic now uses Combat XP only
    const xpType: 'combat' | 'social' = perk.type === 'skill' ? 'social' : 'combat';
    const availableXP = xpType === 'social' ? character.socialXP : character.combatXP;
    const perkCost = perk.cost.xp;

    if (availableXP < perkCost) {
      alert(`Not enough ${xpType === 'social' ? 'Skill' : 'Combat'} XP. Need ${perkCost}, have ${availableXP}.`);
      return;
    }

    let updatedCharacter = { ...character };

    if (perk.type === 'skill') {
      // Add to perks array (social perks) with snapshot
      const newPerk: Perk = {
        id: perk.id,
        name: perk.name,
        cost: perkCost,
        attribute: effectiveAttribute,
        description: perk.description,
        isCustom: false,
        source: 'database',
        perkSnapshot: perk,
        addedAt: Date.now()
      };
      updatedCharacter.perks = [...character.perks, newPerk];
      updatedCharacter.socialXP -= perkCost;
    } else if (perk.type === 'magic') {
      // Add to magicPerks array with snapshot - uses Combat XP
      const newMagicPerk: Perk = {
        id: perk.id,
        name: perk.name,
        cost: perkCost,
        attribute: effectiveAttribute,
        description: perk.description,
        isCustom: false,
        source: 'database',
        perkSnapshot: perk,
        addedAt: Date.now()
      };
      updatedCharacter.magicPerks = [...(character.magicPerks || []), newMagicPerk];
      updatedCharacter.combatXP -= perkCost;
    } else if (perk.type === 'combat') {
      // Add to combatPerks array with snapshot - MS5: No domain needed, all combat perks use Martial
      const newCombatPerk: CombatPerk = {
        id: perk.id,
        name: perk.name,
        cost: perkCost,
        attribute: effectiveAttribute,
        description: perk.description,
        isCustom: false,
        source: 'database',
        perkSnapshot: perk,
        addedAt: Date.now()
      };
      updatedCharacter.combatPerks = [...character.combatPerks, newCombatPerk];
      updatedCharacter.combatXP -= perkCost;
    }

    // Add to progression log - MS5: No domain field needed
    updatedCharacter.progressionLog = [
      ...updatedCharacter.progressionLog,
      {
        type: perk.type === 'skill' ? 'perk' : (perk.type === 'magic' ? 'magicPerk' : 'combatPerk'),
        name: perk.name,
        cost: perkCost,
        attribute: effectiveAttribute,
        xpType: xpType
      }
    ];

    onUpdate(updatedCharacter);
    handleClose();
  };

  const addCustomPerk = () => {
    const cost = parseInt(customCost);
    if (!customName || !cost || !customAttribute) {
      alert('Please fill in all required fields');
      return;
    }

    // Determine category and XP type
    // Magic now uses Combat XP only
    const perkCategory = category || 'skill'; // Default to skill if not specified
    const xpType: 'combat' | 'social' = perkCategory === 'skill' ? 'social' : 'combat';
    const availableXP = xpType === 'social' ? character.socialXP : character.combatXP;

    if (availableXP < cost) {
      alert(`Not enough ${xpType === 'social' ? 'Skill' : 'Combat'} XP. Need ${cost}, have ${availableXP}.`);
      return;
    }

    let updatedCharacter = { ...character };

    if (perkCategory === 'skill') {
      // Social perks go to perks array
      const newPerk: Perk = {
        name: customName,
        cost,
        attribute: customAttribute,
        description: customDescription,
        isCustom: true,
        source: 'custom',
        addedAt: Date.now()
      };
      updatedCharacter.perks = [...character.perks, newPerk];
      updatedCharacter.socialXP -= cost;
    } else if (perkCategory === 'magic') {
      // Magic perks go to magicPerks array - uses Combat XP
      const newMagicPerk: Perk = {
        name: customName,
        cost,
        attribute: customAttribute,
        description: customDescription,
        isCustom: true,
        source: 'custom',
        addedAt: Date.now()
      };
      updatedCharacter.magicPerks = [...(character.magicPerks || []), newMagicPerk];
      updatedCharacter.combatXP -= cost;
    } else if (perkCategory === 'combat') {
      // Combat perks go to combatPerks array - MS5: No domain needed
      const newCombatPerk: CombatPerk = {
        name: customName,
        cost,
        attribute: customAttribute,
        description: customDescription,
        isCustom: true,
        source: 'custom',
        addedAt: Date.now()
      };
      updatedCharacter.combatPerks = [...character.combatPerks, newCombatPerk];
      updatedCharacter.combatXP -= cost;
    }

    // Add to progression log - MS5: No domain field needed
    updatedCharacter.progressionLog = [
      ...updatedCharacter.progressionLog,
      {
        type: perkCategory === 'skill' ? 'perk' : (perkCategory === 'magic' ? 'magicPerk' : 'combatPerk'),
        name: customName,
        cost,
        attribute: customAttribute,
        xpType
      }
    ];

    onUpdate(updatedCharacter);
    handleClose();
  };

  // Calculate XP type and available XP for display and validation
  // Magic now uses Combat XP only (same as combat perks)
  let displayXpType: 'combat' | 'social';
  if (category === 'skill') {
    displayXpType = 'social';
  } else {
    displayXpType = 'combat'; // Both combat and magic use Combat XP
  }
  const availableXP = displayXpType === 'social' ? character.socialXP : character.combatXP;
  const canAfford = source === 'predefined'
    ? (selectedPerk ? availableXP >= selectedPerk.cost.xp : false)
    : (customCost ? availableXP >= parseInt(customCost) : false);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white">Add Perk</h3>
            <p className="text-sm text-slate-400 mt-1">
              Available {displayXpType === 'social' ? 'Skill' : 'Combat'} XP: {availableXP}
              {perkDatabase && ` • ${availablePerks.length} perks available`}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          {/* Source Selection */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => setSource('predefined')}
              className={`py-2 px-4 rounded font-semibold transition-colors ${
                source === 'predefined'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Database Perk
            </button>
            <button
              onClick={() => setSource('custom')}
              className={`py-2 px-4 rounded font-semibold transition-colors ${
                source === 'custom'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Custom Perk
            </button>
          </div>

          {/* No database loaded warning */}
          {!perkDatabase && source === 'predefined' && (
            <div className="bg-yellow-900/30 border border-yellow-700/50 rounded p-3 mb-4">
              <p className="text-yellow-200 text-sm">
                Perk database is loading... Please wait or create a custom perk.
              </p>
            </div>
          )}

          {/* Predefined Perk Selection */}
          {source === 'predefined' && perkDatabase && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Select Perk
                </label>
                <select
                  value={selectedPerkId}
                  onChange={(e) => {
                    setSelectedPerkId(e.target.value);
                    setSelectedPredefinedAttribute('');
                  }}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                >
                  <option value="">-- Choose a perk --</option>
                  {availablePerks.map((perk) => (
                    <option key={perk.id} value={perk.id}>
                      {perk.name} ({perk.cost.xp} XP)
                    </option>
                  ))}
                </select>
                {availablePerks.length === 0 && (
                  <p className="text-sm text-slate-400 mt-2">
                    All perks in this category are already learned.
                  </p>
                )}
              </div>

              {selectedPerk && (
                <>
                  {/* Attribute Selection for Perks with Multiple Attributes */}
                  {hasMultipleAttributes && (
                    <div className="mb-3">
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Select Attribute for Progression *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {predefinedAttributeOptions.map((attr, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedPredefinedAttribute(attr)}
                            className={`py-2 px-4 rounded font-semibold transition-colors ${
                              selectedPredefinedAttribute === attr
                                ? 'bg-blue-700 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                          >
                            {attr}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        This determines which attribute advances when you spend XP
                      </p>
                    </div>
                  )}

                  <div className="bg-slate-700 rounded p-3">
                    <h4 className="text-white font-semibold mb-2">{selectedPerk.name}</h4>

                    {/* Row 1: Cost | Attributes */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <span className="text-slate-400 text-xs">Cost:</span>{' '}
                        <span className="text-white text-sm">
                          {selectedPerk.cost.xp} XP{selectedPerk.cost.variable && ' (Variable)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs">Attributes:</span>{' '}
                        <span className="text-white text-sm">{selectedPerk.attributes.join(' / ')}</span>
                      </div>
                    </div>

                    {/* Row 2: Requirements | Tags */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {selectedPerk.requirements.text && selectedPerk.requirements.text !== '-' && (
                        <div>
                          <span className="text-slate-400 text-xs">Requirements:</span>{' '}
                          <span className="text-white text-sm">{selectedPerk.requirements.text}</span>
                        </div>
                      )}
                      <div className={selectedPerk.requirements.text && selectedPerk.requirements.text !== '-' ? '' : 'col-span-2'}>
                        {selectedPerk.tags.length > 0 && (
                          <>
                            <span className="text-slate-400 text-xs">Tags:</span>{' '}
                            <span className="text-white text-sm">
                              {selectedPerk.tags.map(tag => `#${tag}`).join(' ')}
                            </span>
                          </>
                        )}
                        {selectedPerk.apCost !== null && (
                          <div className="mt-1">
                            <span className="text-slate-400 text-xs">AP Cost:</span>{' '}
                            <span className="text-white text-sm">{selectedPerk.apCost}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Grants Section - Abilities */}
                    {selectedPerk.grants.abilities.length > 0 && perkDatabase?.abilities && (
                      <div className="mb-3">
                        <h5 className="text-sm font-semibold text-slate-400 mb-1">Grants Abilities</h5>
                        <div className="space-y-1">
                          {selectedPerk.grants.abilities
                            .map(id => perkDatabase.abilities.find(a => a.id === id))
                            .filter(Boolean)
                            .map(ability => (
                              <div key={ability!.id} className="bg-slate-600 rounded px-2 py-1.5">
                                <div className="text-white text-sm font-medium">{ability!.name}</div>
                                <div className="text-slate-300 text-xs">{ability!.effect}</div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Grants Section - Effects */}
                    {selectedPerk.grants.effects.length > 0 && perkDatabase?.effects && (
                      <div className="mb-3">
                        <h5 className="text-sm font-semibold text-slate-400 mb-1">Grants Effects</h5>
                        <div className="space-y-1">
                          {selectedPerk.grants.effects
                            .map(id => perkDatabase.effects.find(e => e.id === id))
                            .filter(Boolean)
                            .map(effect => (
                              <div key={effect!.id} className="bg-slate-600 rounded px-2 py-1.5">
                                <div className="text-white text-sm font-medium">{effect!.name}</div>
                                <div className="text-slate-300 text-xs">{effect!.effect}</div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {selectedPerk.description && (
                      <div className="pt-2 border-t border-slate-600">
                        <span className="text-slate-400 text-xs">Description:</span>
                        <p className="text-slate-300 mt-1 text-xs whitespace-pre-wrap">{selectedPerk.description}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Custom Perk Form */}
          {source === 'custom' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Perk Name *
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Enter perk name"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  XP Cost *
                </label>
                <input
                  type="number"
                  value={customCost}
                  onChange={(e) => setCustomCost(e.target.value)}
                  placeholder="Enter XP cost"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Attribute * {customAttribute && <span className="text-blue-400">({customAttribute})</span>}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(ATTRIBUTE_MAP).map(([abbr, full]) => (
                    <button
                      key={abbr}
                      onClick={() => setCustomAttribute(full)}
                      className={`py-2 rounded font-semibold transition-colors ${
                        customAttribute === full
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      }`}
                    >
                      {abbr}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Enter perk description"
                  rows={4}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-4 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!canAfford || (source === 'predefined' ? !selectedPerk || (hasMultipleAttributes && !selectedPredefinedAttribute) : (!customName || !customCost || !customAttribute))}
            className={`px-4 py-2 rounded font-semibold ${
              !canAfford || (source === 'predefined' ? !selectedPerk || (hasMultipleAttributes && !selectedPredefinedAttribute) : (!customName || !customCost || !customAttribute))
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-blue-700 hover:bg-blue-600 text-white'
            }`}
          >
            {!canAfford ? 'Not Enough XP' : 'Add Perk'}
          </button>
        </div>
      </div>
    </div>
  );
};
