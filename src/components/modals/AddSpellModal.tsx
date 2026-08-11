import React, { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { Character, SpellTier, Spell } from '@/types/character';
import { getAllSpells } from '@/data/spells';
import {
  canLearnSpell,
  getSpellXPCost,
  addSpellToKnown,
  generateSpellId,
  calculateCastingDC,
  getSpellcraft,
  checkSpellPrerequisites,
  getMissingPrerequisites
} from '@/utils/spells';
import { SpellCard } from '@/components/shared/SpellCard';

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

  // Database mode - search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [expandedSpellId, setExpandedSpellId] = useState<string | null>(null);

  // Custom mode
  const [customName, setCustomName] = useState('');
  const [customTier, setCustomTier] = useState<SpellTier>(0);
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

  // Get all spells that aren't already known (show all tiers, even locked ones)
  const allSpells = useMemo(() => getAllSpells().filter(spell => {
    const alreadyKnown = character.knownSpells?.some(s => s.dataRef === spell.name);
    return !alreadyKnown;
  }), [character.knownSpells]);

  // Filter spells by search query and tier
  const filteredSpells = useMemo(() => {
    return allSpells.filter(spell => {
      // Tier filter
      if (selectedTier !== null && spell.tier !== selectedTier) return false;

      // Search filter
      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase();
        const matches = spell.name.toLowerCase().includes(searchLower) ||
          spell.effect.toLowerCase().includes(searchLower) ||
          spell.traits.some(t => t.toLowerCase().includes(searchLower));
        if (!matches) return false;
      }

      return true;
    });
  }, [allSpells, selectedTier, searchQuery]);

  // Handler for learning from SpellCard (supports optional attribute)
  const handleLearnSpell = (spell: Spell, attribute?: string) => {
    const xpCost = getSpellXPCost(spell.tier);

    // Check tier requirement
    if (!canLearnSpell(character, spell.tier)) {
      if (spell.tier === 0) {
        alert('Tier 0 spells require the Mage perk');
      } else {
        alert(`Your Spellcraft level (${spellcraft}) is too low for Tier ${spell.tier} spells`);
      }
      return;
    }

    if (availableXP < xpCost) {
      alert(`Not enough Combat XP. Need ${xpCost}, have ${availableXP}`);
      return;
    }

    if (!checkSpellPrerequisites(character, spell)) {
      const missing = getMissingPrerequisites(character, spell);
      alert(`Missing prerequisites:\n${missing.join('\n')}`);
      return;
    }

    const attributes = spell.attributes?.split('/').map(a => a.trim()) || [];
    const attributeForLog = attribute || (attributes.length > 0 ? attributes[0] : 'WT');

    const newSpell = {
      id: generateSpellId(),
      name: spell.name,
      tier: spell.tier,
      isCustom: false,
      dataRef: spell.name,
      xpCost
    };

    const updatedCharacter = addSpellToKnown(character, newSpell);
    updatedCharacter.combatXP -= xpCost;
    updatedCharacter.progressionLog = [
      ...updatedCharacter.progressionLog,
      {
        type: 'spell',
        name: spell.name,
        tier: spell.tier,
        attribute: attributeForLog,
        cost: xpCost,
        xpType: 'combat'
      }
    ];

    onUpdate(updatedCharacter);
    setSelectedAttribute(null);
    setExpandedSpellId(null);
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

    const xpCost = getSpellXPCost(customTier);

    if (availableXP < xpCost) {
      alert(`Not enough Combat XP. Need ${xpCost}, have ${availableXP}`);
      return;
    }

    if (!canLearnSpell(character, customTier)) {
      if (customTier === 0) {
        alert('Tier 0 spells require the Mage perk');
      } else {
        alert(`Your Spellcraft level (${spellcraft}) is too low for Tier ${customTier} spells`);
      }
      return;
    }

    const newSpell = {
      id: generateSpellId(),
      name: customName,
      tier: customTier,
      isCustom: true,
      xpCost,
      customSpellData: {
        tier: customTier,
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
        attribute: attributeForLog,
        cost: xpCost,
        xpType: 'combat'
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

  const previewXpCost = mode === 'custom' ? getSpellXPCost(customTier) : 0;
  const previewDC = mode === 'custom' ? calculateCastingDC(customTier) : 0;

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
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search spells by name, effect..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Tier Filter Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedTier(null)}
                  className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                    selectedTier === null
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  All Tiers
                </button>
                {[0, 1, 2, 3, 4, 5].map(tier => (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(tier)}
                    className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                      selectedTier === tier
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    Tier {tier}
                  </button>
                ))}
              </div>

              {/* Spell Grid */}
              {filteredSpells.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {filteredSpells.map(spell => (
                    <SpellCard
                      key={spell.name}
                      spell={spell}
                      character={character}
                      isExpanded={expandedSpellId === spell.name}
                      onToggleExpand={() => setExpandedSpellId(expandedSpellId === spell.name ? null : spell.name)}
                      onLearn={(attribute) => handleLearnSpell(spell, attribute)}
                      showLearnButton={true}
                      availableXP={availableXP}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400">No spells found matching your filters</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTier(null);
                    }}
                    className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Clear filters
                  </button>
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
          {mode === 'custom' && (
            <button
              onClick={handleCreateCustom}
              disabled={!customName.trim()}
              className={`px-4 py-2 rounded font-semibold ${
                !customName.trim()
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-700 hover:bg-blue-600 text-white'
              }`}
            >
              Create Spell ({getSpellXPCost(customTier)} XP)
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-semibold"
          >
            {mode === 'custom' ? 'Cancel' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
