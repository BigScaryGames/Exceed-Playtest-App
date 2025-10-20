import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Character, Perk, CombatPerk, WeaponDomain } from '@/types/character';
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
  const [xpTypeChoice, setXpTypeChoice] = useState<'combat' | 'social'>('combat');
  const [selectedPredefinedAttribute, setSelectedPredefinedAttribute] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<WeaponDomain>('1H');

  // Custom perk fields
  const [customName, setCustomName] = useState('');
  const [customCost, setCustomCost] = useState('');
  const [customAttribute, setCustomAttribute] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customDomain, setCustomDomain] = useState<WeaponDomain>('1H');

  if (!isOpen) return null;

  // Get available perks from database
  const availablePerks: DatabasePerk[] = [];
  if (perkDatabase) {
    let perksToCheck: DatabasePerk[];

    if (category === 'combat') {
      perksToCheck = perkDatabase.perks.combat;
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
    setXpTypeChoice('combat');
    setSelectedPredefinedAttribute('');
    setSelectedDomain('1H');
    setCustomName('');
    setCustomCost('');
    setCustomAttribute('');
    setCustomDescription('');
    setCustomDomain('1H');
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
    let xpType: 'combat' | 'social';
    if (perk.type === 'magic') {
      xpType = xpTypeChoice;
    } else if (perk.type === 'skill') {
      xpType = 'social';
    } else {
      xpType = 'combat';
    }
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
        description: perk.effect || perk.shortDescription,
        isCustom: false,
        source: 'database',
        perkSnapshot: perk,
        addedAt: Date.now()
      };
      updatedCharacter.perks = [...character.perks, newPerk];
      updatedCharacter.socialXP -= perkCost;
    } else if (perk.type === 'magic') {
      // Add to magicPerks array with snapshot
      const newMagicPerk: Perk = {
        id: perk.id,
        name: perk.name,
        cost: perkCost,
        attribute: effectiveAttribute,
        description: perk.effect || perk.shortDescription,
        isCustom: false,
        source: 'database',
        perkSnapshot: perk,
        addedAt: Date.now()
      };
      updatedCharacter.magicPerks = [...(character.magicPerks || []), newMagicPerk];

      // Deduct from appropriate XP pool
      if (xpType === 'social') {
        updatedCharacter.socialXP -= perkCost;
      } else {
        updatedCharacter.combatXP -= perkCost;
      }
    } else if (perk.type === 'combat') {
      // Add to combatPerks array with snapshot
      const newCombatPerk: CombatPerk = {
        id: perk.id,
        name: perk.name,
        cost: perkCost,
        domain: selectedDomain,
        attribute: effectiveAttribute,
        description: perk.effect || perk.shortDescription,
        isCustom: false,
        source: 'database',
        perkSnapshot: perk,
        addedAt: Date.now()
      };
      updatedCharacter.combatPerks = [...character.combatPerks, newCombatPerk];
      updatedCharacter.combatXP -= perkCost;
    }

    // Add to progression log
    updatedCharacter.progressionLog = [
      ...updatedCharacter.progressionLog,
      {
        type: perk.type === 'skill' ? 'perk' : (perk.type === 'magic' ? 'magicPerk' : 'combatPerk'),
        name: perk.name,
        cost: perkCost,
        attribute: effectiveAttribute,
        domain: perk.type === 'combat' ? selectedDomain : undefined,
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
      // Magic perks go to magicPerks array
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
        domain: customDomain,
        attribute: customAttribute,
        description: customDescription,
        isCustom: true,
        source: 'custom',
        addedAt: Date.now()
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
        domain: perkCategory === 'combat' ? customDomain : undefined,
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
                  Skill XP ({character.socialXP})
                </button>
              </div>
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
                  {/* Domain Selection for Combat Perks */}
                  {selectedPerk.type === 'combat' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Select Domain *
                      </label>
                      <select
                        value={selectedDomain}
                        onChange={(e) => setSelectedDomain(e.target.value as WeaponDomain)}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                      >
                        <option value="1H">One-Handed (1H)</option>
                        <option value="2H">Two-Handed (2H)</option>
                        <option value="SaS">Staves & Spears (SaS)</option>
                        <option value="Sh">Shield (Sh)</option>
                        <option value="Ar">Archery (Ar)</option>
                        <option value="Spell">Spellcraft (Spell)</option>
                      </select>
                    </div>
                  )}

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
                    <div className="text-sm text-slate-300 space-y-1">
                      <div><span className="text-slate-400">Category:</span> {selectedPerk.type}</div>
                      <div><span className="text-slate-400">Cost:</span> {selectedPerk.cost.xp} XP {selectedPerk.cost.variable && '(Variable)'}</div>
                      <div><span className="text-slate-400">Attributes:</span> {selectedPerk.attributes.join(' / ')}</div>
                      {selectedPerk.requirements.text && selectedPerk.requirements.text !== '-' && (
                        <div><span className="text-slate-400">Requirements:</span> {selectedPerk.requirements.text}</div>
                      )}
                      {selectedPerk.apCost !== null && (
                        <div><span className="text-slate-400">AP Cost:</span> {selectedPerk.apCost}</div>
                      )}
                      {selectedPerk.tags.length > 0 && (
                        <div>
                          <span className="text-slate-400">Tags:</span>{' '}
                          {selectedPerk.tags.map(tag => `#${tag}`).join(' ')}
                        </div>
                      )}
                      {selectedPerk.shortDescription && (
                        <div className="pt-2">
                          <span className="text-slate-400">Summary:</span>
                          <p className="text-slate-300 mt-1 text-xs">{selectedPerk.shortDescription}</p>
                        </div>
                      )}
                      <div className="pt-2 border-t border-slate-600">
                        <span className="text-slate-400">Effect:</span>
                        <pre className="text-slate-300 mt-1 whitespace-pre-wrap text-xs">{selectedPerk.effect}</pre>
                      </div>
                      {selectedPerk.description && (
                        <div className="pt-2 border-t border-slate-600">
                          <span className="text-slate-400">Description:</span>
                          <pre className="text-slate-300 mt-1 whitespace-pre-wrap text-xs">{selectedPerk.description}</pre>
                        </div>
                      )}
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
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Domain *
                  </label>
                  <select
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value as WeaponDomain)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  >
                    <option value="1H">One-Handed (1H)</option>
                    <option value="2H">Two-Handed (2H)</option>
                    <option value="SaS">Staves & Spears (SaS)</option>
                    <option value="Sh">Shield (Sh)</option>
                    <option value="Ar">Archery (Ar)</option>
                    <option value="Spell">Spellcraft (Spell)</option>
                  </select>
                </div>
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
