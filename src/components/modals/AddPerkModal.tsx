import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Character, Perk, CombatPerk, WeaponDomain } from '@/types/character';
import { PERKS, PerkData } from '@/data/perks';
import { ATTRIBUTE_MAP } from '@/utils/constants';

interface AddPerkModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onUpdate: (character: Character) => void;
  category?: 'skill' | 'combat' | 'magic'; // Optional: filter by category
}

export const AddPerkModal: React.FC<AddPerkModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdate,
  category
}) => {
  const [source, setSource] = useState<'predefined' | 'custom'>('predefined');
  const [selectedPerkName, setSelectedPerkName] = useState('');
  const [xpTypeChoice, setXpTypeChoice] = useState<'combat' | 'social'>('combat');
  const [selectedPredefinedAttribute, setSelectedPredefinedAttribute] = useState<string>('');

  // Custom perk fields
  const [customName, setCustomName] = useState('');
  const [customCost, setCustomCost] = useState('');
  const [customAttribute, setCustomAttribute] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [customApCost, setCustomApCost] = useState('');

  if (!isOpen) return null;

  // Filter perks by category if specified
  const availablePerks = Object.entries(PERKS).filter(([_, perk]) => {
    if (category && perk.category !== category) return false;

    // Check if already learned
    if (perk.category === 'skill') {
      return !character.perks.some(p => p.name === perk.name);
    } else if (perk.category === 'magic') {
      return !(character.magicPerks || []).some(p => p.name === perk.name);
    } else if (perk.category === 'combat') {
      return !character.combatPerks.some(p => p.name === perk.name);
    }
    return true;
  });

  const selectedPerk = selectedPerkName ? PERKS[selectedPerkName] : null;

  // Parse attributes from selected perk (e.g., "Agility/Magic" -> ["Agility", "Magic"])
  const predefinedAttributeOptions = selectedPerk
    ? selectedPerk.attribute.split('/').map(a => a.trim())
    : [];
  const hasMultipleAttributes = predefinedAttributeOptions.length > 1;

  const handleClose = () => {
    setSource('predefined');
    setSelectedPerkName('');
    setXpTypeChoice('combat');
    setSelectedPredefinedAttribute('');
    setCustomName('');
    setCustomCost('');
    setCustomAttribute('');
    setCustomDescription('');
    setCustomDomain('');
    setCustomApCost('');
    onClose();
  };

  const handleAdd = () => {
    if (source === 'predefined' && selectedPerk) {
      addPredefinedPerk(selectedPerk);
    } else if (source === 'custom') {
      addCustomPerk();
    }
  };

  const addPredefinedPerk = (perk: PerkData) => {
    // Determine the effective attribute
    let effectiveAttribute: string;
    const attributeOptions = perk.attribute.split('/').map(a => a.trim());

    if (attributeOptions.length > 1) {
      // Multiple attributes - need user selection
      if (!selectedPredefinedAttribute) {
        alert('Please select an attribute for this perk');
        return;
      }
      effectiveAttribute = selectedPredefinedAttribute;
    } else {
      // Single attribute
      effectiveAttribute = attributeOptions[0];
    }

    // Determine which XP pool to use
    // For magic perks, use the user's choice; for others, use default
    let xpType: 'combat' | 'social';
    if (perk.category === 'magic') {
      xpType = xpTypeChoice;
    } else if (perk.category === 'skill') {
      xpType = 'social';
    } else {
      xpType = 'combat';
    }
    const availableXP = xpType === 'social' ? character.socialXP : character.combatXP;

    if (availableXP < perk.cost) {
      alert(`Not enough ${xpType === 'social' ? 'Social' : 'Combat'} XP. Need ${perk.cost}, have ${availableXP}.`);
      return;
    }

    let updatedCharacter = { ...character };

    if (perk.category === 'skill') {
      // Add to perks array (social perks)
      const newPerk: Perk = {
        name: perk.name,
        cost: perk.cost,
        attribute: effectiveAttribute,
        description: perk.description
      };
      updatedCharacter.perks = [...character.perks, newPerk];
      updatedCharacter.socialXP -= perk.cost;
    } else if (perk.category === 'magic') {
      // Add to magicPerks array
      const newMagicPerk: Perk = {
        name: perk.name,
        cost: perk.cost,
        attribute: effectiveAttribute,
        description: perk.description
      };
      updatedCharacter.magicPerks = [...(character.magicPerks || []), newMagicPerk];

      // Deduct from appropriate XP pool
      if (xpType === 'social') {
        updatedCharacter.socialXP -= perk.cost;
      } else {
        updatedCharacter.combatXP -= perk.cost;
      }
    } else if (perk.category === 'combat') {
      // Add to combatPerks array
      const newCombatPerk: CombatPerk = {
        name: perk.name,
        cost: perk.cost,
        domain: (perk.domain || '1H') as WeaponDomain,
        attribute: effectiveAttribute,
        description: perk.description
      };
      updatedCharacter.combatPerks = [...character.combatPerks, newCombatPerk];
      updatedCharacter.combatXP -= perk.cost;
    }

    // Add to progression log
    updatedCharacter.progressionLog = [
      ...updatedCharacter.progressionLog,
      {
        type: perk.category === 'skill' ? 'perk' : (perk.category === 'magic' ? 'magicPerk' : 'combatPerk'),
        name: perk.name,
        cost: perk.cost,
        attribute: effectiveAttribute,
        domain: perk.category === 'combat' ? (perk.domain as WeaponDomain) : undefined,
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
    const perkCategory = category || 'skill'; // Default to skill if not specified
    let xpType: 'combat' | 'social';
    if (perkCategory === 'magic') {
      xpType = xpTypeChoice;
    } else if (perkCategory === 'skill') {
      xpType = 'social';
    } else {
      xpType = 'combat';
    }
    const availableXP = xpType === 'social' ? character.socialXP : character.combatXP;

    if (availableXP < cost) {
      alert(`Not enough ${xpType === 'social' ? 'Social' : 'Combat'} XP. Need ${cost}, have ${availableXP}.`);
      return;
    }

    let updatedCharacter = { ...character };

    if (perkCategory === 'skill') {
      // Social perks go to perks array
      const newPerk: Perk = {
        name: customName,
        cost,
        attribute: customAttribute,
        description: customDescription
      };
      updatedCharacter.perks = [...character.perks, newPerk];
      updatedCharacter.socialXP -= cost;
    } else if (perkCategory === 'magic') {
      // Magic perks go to magicPerks array
      const newMagicPerk: Perk = {
        name: customName,
        cost,
        attribute: customAttribute,
        description: customDescription
      };
      updatedCharacter.magicPerks = [...(character.magicPerks || []), newMagicPerk];

      // Deduct from appropriate XP pool
      if (xpType === 'social') {
        updatedCharacter.socialXP -= cost;
      } else {
        updatedCharacter.combatXP -= cost;
      }
    } else if (perkCategory === 'combat') {
      // Combat perks go to combatPerks array
      const newCombatPerk: CombatPerk = {
        name: customName,
        cost,
        domain: (customDomain || '1H') as WeaponDomain,
        attribute: customAttribute,
        description: customDescription
      };
      updatedCharacter.combatPerks = [...character.combatPerks, newCombatPerk];
      updatedCharacter.combatXP -= cost;
    }

    // Add to progression log
    updatedCharacter.progressionLog = [
      ...updatedCharacter.progressionLog,
      {
        type: perkCategory === 'skill' ? 'perk' : (perkCategory === 'magic' ? 'magicPerk' : 'combatPerk'),
        name: customName,
        cost,
        attribute: customAttribute,
        domain: perkCategory === 'combat' ? (customDomain as WeaponDomain) : undefined,
        xpType
      }
    ];

    onUpdate(updatedCharacter);
    handleClose();
  };

  // Calculate XP type and available XP for display and validation
  let displayXpType: 'combat' | 'social';
  if (category === 'magic') {
    displayXpType = xpTypeChoice;
  } else if (category === 'skill') {
    displayXpType = 'social';
  } else {
    displayXpType = 'combat';
  }
  const availableXP = displayXpType === 'social' ? character.socialXP : character.combatXP;
  const canAfford = source === 'predefined'
    ? (selectedPerk ? availableXP >= selectedPerk.cost : false)
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
              Available {displayXpType === 'social' ? 'Social' : 'Combat'} XP: {availableXP}
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
              Predefined Perk
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

          {/* XP Type Selection - Only for Magic Perks */}
          {category === 'magic' && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                XP Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setXpTypeChoice('combat')}
                  className={`py-2 px-4 rounded font-semibold transition-colors ${
                    xpTypeChoice === 'combat'
                      ? 'bg-red-700 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Combat XP ({character.combatXP})
                </button>
                <button
                  onClick={() => setXpTypeChoice('social')}
                  className={`py-2 px-4 rounded font-semibold transition-colors ${
                    xpTypeChoice === 'social'
                      ? 'bg-green-700 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Social XP ({character.socialXP})
                </button>
              </div>
            </div>
          )}

          {/* Predefined Perk Selection */}
          {source === 'predefined' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Select Perk
                </label>
                <select
                  value={selectedPerkName}
                  onChange={(e) => setSelectedPerkName(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                >
                  <option value="">-- Choose a perk --</option>
                  {availablePerks.map(([name, perk]) => (
                    <option key={name} value={name}>
                      {name} ({perk.cost} XP)
                    </option>
                  ))}
                </select>
                {availablePerks.length === 0 && (
                  <p className="text-sm text-slate-400 mt-2">
                    All predefined perks in this category are already learned.
                  </p>
                )}
              </div>

              {selectedPerk && (
                <>
                  {/* Attribute Selection for Predefined Perks with Multiple Attributes */}
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
                    <div className="text-sm text-slate-300 space-y-1">
                      <div><span className="text-slate-400">Category:</span> {selectedPerk.category}</div>
                      <div><span className="text-slate-400">Cost:</span> {selectedPerk.cost} XP</div>
                      <div><span className="text-slate-400">Attribute:</span> {selectedPerk.attribute}</div>
                      {selectedPerk.requirements && (
                        <div><span className="text-slate-400">Requirements:</span> {selectedPerk.requirements}</div>
                      )}
                      {selectedPerk.domain && (
                        <div><span className="text-slate-400">Domain:</span> {selectedPerk.domain}</div>
                      )}
                      {selectedPerk.apCost && (
                        <div><span className="text-slate-400">AP Cost:</span> {selectedPerk.apCost}</div>
                      )}
                      <div className="pt-2 border-t border-slate-600">
                        <span className="text-slate-400">Description:</span>
                        <pre className="text-slate-300 mt-1 whitespace-pre-wrap text-xs">{selectedPerk.description}</pre>
                      </div>
                    </div>
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

              {category === 'combat' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Domain
                    </label>
                    <input
                      type="text"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder="e.g., Universal, Spell, etc."
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      AP Cost
                    </label>
                    <input
                      type="text"
                      value={customApCost}
                      onChange={(e) => setCustomApCost(e.target.value)}
                      placeholder="e.g., 2, 3, R (reaction)"
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    />
                  </div>
                </>
              )}

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
            disabled={!canAfford || (source === 'predefined' ? !selectedPerk : (!customName || !customCost || !customAttribute))}
            className={`px-4 py-2 rounded font-semibold ${
              !canAfford || (source === 'predefined' ? !selectedPerk : (!customName || !customCost || !customAttribute))
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
