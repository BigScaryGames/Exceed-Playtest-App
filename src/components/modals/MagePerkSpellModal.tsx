import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Character, KnownSpell } from '@/types/character';
import { SPELLS } from '@/data/spells';
import { addSpellToKnown, generateSpellId, calculateCastingDC } from '@/utils/spells';

interface MagePerkSpellModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onUpdate: (character: Character) => void;
}

export const MagePerkSpellModal: React.FC<MagePerkSpellModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdate
}) => {
  const [selectedSpellName, setSelectedSpellName] = useState('');

  // Get Tier 0 spells that aren't already known
  const tier0Spells = Object.entries(SPELLS).filter(([name, spell]) => {
    const alreadyKnown = character.knownSpells?.some(s => s.dataRef === name);
    return spell.tier === 0 && !alreadyKnown;
  });

  const handleSelectSpell = () => {
    if (!selectedSpellName) {
      alert('Please select a spell');
      return;
    }

    const spellData = SPELLS[selectedSpellName];

    const newSpell: KnownSpell = {
      id: generateSpellId(),
      name: selectedSpellName,
      tier: spellData.tier,
      type: spellData.type,
      isCustom: false,
      dataRef: selectedSpellName,
      xpCost: 0 // Free from Mage perk
    };

    const updatedCharacter = addSpellToKnown(character, newSpell);

    // Note: We don't add to progression log because the spell doesn't contribute to attribute advancement
    // as per the Mage perk rules: "This spell doesn't contribute to attribute advancement"

    onUpdate(updatedCharacter);
    setSelectedSpellName('');
    onClose();
  };

  if (!isOpen) return null;

  const selectedSpellData = selectedSpellName ? SPELLS[selectedSpellName] : null;
  const previewDC = selectedSpellData ? calculateCastingDC(selectedSpellData.tier) : 10;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white">Mage Perk: Select Free Spell</h3>
            <p className="text-sm text-slate-400 mt-1">Choose a Tier 0 spell to add to your repertoire</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          <div className="bg-purple-900/30 border border-purple-700 rounded p-3 mb-4">
            <p className="text-purple-300 text-sm">
              <strong>Mage Perk Benefit:</strong> This spell is free and doesn't contribute to attribute advancement.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Select Tier 0 Spell
              </label>
              <select
                value={selectedSpellName}
                onChange={(e) => setSelectedSpellName(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              >
                <option value="">-- Choose a spell --</option>
                {tier0Spells.map(([name, spell]) => (
                  <option key={name} value={name}>
                    {name} ({spell.type === 'basic' ? 'Basic' : 'Advanced'})
                  </option>
                ))}
              </select>
              {tier0Spells.length === 0 && (
                <p className="text-sm text-slate-400 mt-2">
                  All Tier 0 spells are already known.
                </p>
              )}
            </div>

            {selectedSpellData && (
              <div className="bg-slate-700 rounded p-3">
                <h4 className="text-white font-semibold mb-2">{selectedSpellName}</h4>
                <div className="text-sm text-slate-300 space-y-1">
                  <div><span className="text-slate-400">Tier:</span> {selectedSpellData.tier} (DC {previewDC})</div>
                  <div><span className="text-slate-400">Type:</span> {selectedSpellData.type === 'basic' ? 'Basic' : 'Advanced'}</div>
                  <div><span className="text-slate-400">AP Cost:</span> {selectedSpellData.apCost}</div>
                  <div><span className="text-slate-400">Attributes:</span> {selectedSpellData.attributes}</div>
                  <div><span className="text-slate-400">Limit:</span> {selectedSpellData.limitCost}</div>
                  <div><span className="text-slate-400">Distance:</span> {selectedSpellData.distance}</div>
                  <div><span className="text-slate-400">Duration:</span> {selectedSpellData.duration}</div>
                  {selectedSpellData.damage && (
                    <div><span className="text-slate-400">Damage:</span> {selectedSpellData.damage}</div>
                  )}
                  <div className="pt-2 border-t border-slate-600">
                    <span className="text-slate-400">Effect:</span>
                    <p className="text-slate-300 italic mt-1">{selectedSpellData.effect}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSelectSpell}
            disabled={!selectedSpellName}
            className={`px-4 py-2 rounded font-semibold ${
              !selectedSpellName
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-purple-700 hover:bg-purple-600 text-white'
            }`}
          >
            Add Free Spell
          </button>
        </div>
      </div>
    </div>
  );
};
