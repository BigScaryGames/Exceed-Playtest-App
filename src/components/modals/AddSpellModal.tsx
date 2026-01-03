import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Character, SpellTier, SpellType } from '@/types/character';
import { SPELLS, getSpellEntries } from '@/data/spells';
import {
  canLearnSpell,
  getSpellXPCost,
  addSpellToKnown,
  generateSpellId,
  calculateCastingDC,
  getSpellcraft
} from '@/utils/spells';

interface AddSpellModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onUpdate: (character: Character) => void;
}

export const AddSpellModal: React.FC<AddSpellModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdate
}) => {
  const [mode, setMode] = useState<'database' | 'custom'>('database');
  const [selectedAttribute, setSelectedAttribute] = useState<string | null>(null);

  // Database mode
  const [selectedSpellName, setSelectedSpellName] = useState('');

  // Custom mode
  const [customName, setCustomName] = useState('');
  const [customTier, setCustomTier] = useState<SpellTier>(0);
  const [customType, setCustomType] = useState<SpellType>('basic');
  const [customApCost, setCustomApCost] = useState('2');
  const [customAttributes, setCustomAttributes] = useState('WT');
  const [customLimitCost, setCustomLimitCost] = useState('0');
  const [customTraits, setCustomTraits] = useState('Spell');
  const [customEffect, setCustomEffect] = useState('');
  const [customDistance, setCustomDistance] = useState('3m');
  const [customDuration, setCustomDuration] = useState('Instant');
  const [customDamage, setCustomDamage] = useState('');

  const spellcraft = getSpellcraft(character);
  const availableXP = character.combatXP; // Magic only uses Combat XP

  // Get available spells from database (filter by spellcraft level and not already known)
  const availableSpells = getSpellEntries().filter(([name, spell]) => {
    const alreadyKnown = character.knownSpells?.some(s => s.dataRef === name);
    const canLearn = canLearnSpell(character, spell.tier);
    return !alreadyKnown && canLearn;
  });

  const handleLearnDatabase = () => {
    if (!selectedSpellName) {
      alert('Please select a spell');
      return;
    }

    const spellData = SPELLS[selectedSpellName];

    // Check if attribute selection is required
    const attributes = spellData.attributes.split('/').map(a => a.trim());
    if (attributes.length > 1 && !selectedAttribute) {
      alert('Please select which attribute to advance');
      return;
    }

    const xpCost = getSpellXPCost(spellData.tier, spellData.type);

    if (availableXP < xpCost) {
      alert(`Not enough Combat XP. Need ${xpCost}, have ${availableXP}`);
      return;
    }

    const newSpell = {
      id: generateSpellId(),
      name: selectedSpellName,
      tier: spellData.tier,
      type: spellData.type,
      isCustom: false,
      dataRef: selectedSpellName,
      xpCost
    };

    const updatedCharacter = addSpellToKnown(character, newSpell);

    // Deduct XP from Combat pool (magic only uses Combat XP)
    updatedCharacter.combatXP -= xpCost;

    // Add to progression log with selected attribute
    const attributeForLog = selectedAttribute || attributes[0]; // Use selected or default to first
    updatedCharacter.progressionLog = [
      ...updatedCharacter.progressionLog,
      {
        type: 'spell',
        name: selectedSpellName,
        tier: spellData.tier,
        spellType: spellData.type,
        attribute: attributeForLog,
        cost: xpCost
      }
    ];

    onUpdate(updatedCharacter);
    setSelectedSpellName('');
    setSelectedAttribute(null);
    onClose();
  };

  const handleCreateCustom = () => {
    if (!customName.trim()) {
      alert('Please enter a spell name');
      return;
    }

    // Check if attribute selection is required for custom spell
    const attributes = customAttributes.split('/').map(a => a.trim());
    if (attributes.length > 1 && !selectedAttribute) {
      alert('Please select which attribute to advance');
      return;
    }

    const xpCost = getSpellXPCost(customTier, customType);

    if (availableXP < xpCost) {
      alert(`Not enough Combat XP. Need ${xpCost}, have ${availableXP}`);
      return;
    }

    if (!canLearnSpell(character, customTier)) {
      alert(`Your Spellcraft level (${spellcraft}) is too low for Tier ${customTier} spells`);
      return;
    }

    const newSpell = {
      id: generateSpellId(),
      name: customName,
      tier: customTier,
      type: customType,
      isCustom: true,
      xpCost,
      customSpellData: {
        tier: customTier,
        type: customType,
        apCost: customApCost,
        attributes: customAttributes,
        limitCost: parseInt(customLimitCost) || 0,
        traits: customTraits.split(',').map(t => t.trim()).filter(t => t),
        effect: customEffect,
        distance: customDistance,
        duration: customDuration,
        damage: customDamage || undefined
      }
    };

    const updatedCharacter = addSpellToKnown(character, newSpell);

    // Deduct XP from Combat pool (magic only uses Combat XP)
    updatedCharacter.combatXP -= xpCost;

    // Add to progression log with selected attribute
    const attributeForLog = selectedAttribute || attributes[0]; // Use selected or default to first
    updatedCharacter.progressionLog = [
      ...updatedCharacter.progressionLog,
      {
        type: 'spell',
        name: customName,
        tier: customTier,
        spellType: customType,
        attribute: attributeForLog,
        cost: xpCost
      }
    ];

    onUpdate(updatedCharacter);
    resetCustomForm();
    setSelectedAttribute(null);
    onClose();
  };

  const resetCustomForm = () => {
    setCustomName('');
    setCustomTier(0);
    setCustomType('basic');
    setCustomApCost('2');
    setCustomAttributes('WT');
    setCustomLimitCost('0');
    setCustomTraits('Spell');
    setCustomEffect('');
    setCustomDistance('3m');
    setCustomDuration('Instant');
    setCustomDamage('');
  };

  if (!isOpen) return null;

  const selectedSpellData = selectedSpellName ? SPELLS[selectedSpellName] : null;
  const previewXpCost = mode === 'database' && selectedSpellData
    ? getSpellXPCost(selectedSpellData.tier, selectedSpellData.type)
    : getSpellXPCost(customTier, customType);
  const previewDC = mode === 'database' && selectedSpellData
    ? calculateCastingDC(selectedSpellData.tier)
    : calculateCastingDC(customTier);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Learn Spell</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          {/* Mode Selection */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode('database')}
              className={`flex-1 py-2 px-4 rounded font-semibold ${
                mode === 'database'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              From Spellbook
            </button>
            <button
              onClick={() => setMode('custom')}
              className={`flex-1 py-2 px-4 rounded font-semibold ${
                mode === 'custom'
                  ? 'bg-purple-700 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Create Custom
            </button>
          </div>

          {/* XP Display */}
          <div className="bg-slate-700 rounded p-3 mb-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Combat XP:</span>
              <span className="font-bold text-red-400">{character.combatXP}</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-slate-600">
              <span className="text-slate-400">Cost:</span>
              <span className="text-yellow-400 font-bold">{previewXpCost} XP</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-slate-400">After Learning:</span>
              <span className={`font-bold ${
                availableXP - previewXpCost >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {availableXP - previewXpCost} Combat XP
              </span>
            </div>
          </div>

          {/* Database Mode */}
          {mode === 'database' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Select Spell (Spellcraft {spellcraft})
                </label>
                <select
                  value={selectedSpellName}
                  onChange={(e) => setSelectedSpellName(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                >
                  <option value="">-- Choose a spell --</option>
                  {availableSpells.map(([name, spell]) => (
                    <option key={name} value={name}>
                      {name} (Tier {spell.tier}, {spell.type === 'basic' ? 'Basic' : 'Advanced'}) - {getSpellXPCost(spell.tier, spell.type)} XP
                    </option>
                  ))}
                </select>
                {availableSpells.length === 0 && (
                  <p className="text-sm text-slate-400 mt-2">
                    No spells available at your current Spellcraft level or all spells already known.
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

              {/* Attribute Selection for spells with multiple attributes */}
              {selectedSpellData && selectedSpellData.attributes.split('/').length > 1 && (
                <div className="mt-3">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Select Attribute to Advance
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedSpellData.attributes.split('/').map((attr) => {
                      const attrTrimmed = attr.trim();
                      return (
                        <button
                          key={attrTrimmed}
                          onClick={() => setSelectedAttribute(attrTrimmed)}
                          className={`py-2 px-4 rounded font-semibold transition-colors ${
                            selectedAttribute === attrTrimmed
                              ? 'bg-purple-700 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          {attrTrimmed}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom Mode */}
          {mode === 'custom' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Spell Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g., Fireball"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tier (0-5)</label>
                  <select
                    value={customTier}
                    onChange={(e) => setCustomTier(parseInt(e.target.value) as SpellTier)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  >
                    {[0, 1, 2, 3, 4, 5].map(tier => (
                      <option key={tier} value={tier} disabled={tier > spellcraft}>
                        Tier {tier} {tier > spellcraft ? '(locked)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Type</label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value as SpellType)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  >
                    <option value="basic">Basic</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">AP Cost</label>
                  <input
                    type="text"
                    value={customApCost}
                    onChange={(e) => setCustomApCost(e.target.value)}
                    placeholder="2, R, 1m"
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Attributes</label>
                  <input
                    type="text"
                    value={customAttributes}
                    onChange={(e) => setCustomAttributes(e.target.value)}
                    placeholder="AG/WT"
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Limit Cost</label>
                  <input
                    type="number"
                    value={customLimitCost}
                    onChange={(e) => setCustomLimitCost(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Distance</label>
                  <input
                    type="text"
                    value={customDistance}
                    onChange={(e) => setCustomDistance(e.target.value)}
                    placeholder="3m, Touch, 10m"
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Duration</label>
                  <input
                    type="text"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    placeholder="Instant, 1 minute"
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Traits (comma-separated)</label>
                <input
                  type="text"
                  value={customTraits}
                  onChange={(e) => setCustomTraits(e.target.value)}
                  placeholder="Spell, Offensive, Strike"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Damage (optional)</label>
                <input
                  type="text"
                  value={customDamage}
                  onChange={(e) => setCustomDamage(e.target.value)}
                  placeholder="Spellcraft * 4d"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Effect Description</label>
                <textarea
                  value={customEffect}
                  onChange={(e) => setCustomEffect(e.target.value)}
                  placeholder="Describe what the spell does..."
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                />
              </div>

              <div className="bg-slate-700 rounded p-2 text-xs text-slate-400">
                <div>Casting DC: {previewDC}</div>
                <div>XP Cost: {previewXpCost}</div>
              </div>

              {/* Attribute Selection for custom spells with multiple attributes */}
              {customAttributes.split('/').length > 1 && (
                <div className="mt-3">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Select Attribute to Advance
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {customAttributes.split('/').map((attr) => {
                      const attrTrimmed = attr.trim();
                      return (
                        <button
                          key={attrTrimmed}
                          onClick={() => setSelectedAttribute(attrTrimmed)}
                          className={`py-2 px-4 rounded font-semibold transition-colors ${
                            selectedAttribute === attrTrimmed
                              ? 'bg-purple-700 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          {attrTrimmed}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
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
            onClick={mode === 'database' ? handleLearnDatabase : handleCreateCustom}
            disabled={mode === 'database' ? !selectedSpellName : !customName.trim()}
            className={`px-4 py-2 rounded font-semibold ${
              (mode === 'database' && !selectedSpellName) || (mode === 'custom' && !customName.trim())
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-blue-700 hover:bg-blue-600 text-white'
            }`}
          >
            Learn Spell ({previewXpCost} XP)
          </button>
        </div>
      </div>
    </div>
  );
};
