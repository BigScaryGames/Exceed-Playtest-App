import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Character, KnownSpell, SpellTier, SpellType } from '@/types/character';
import { getSpellData, updateSpellInKnown } from '@/utils/spells';

interface EditSpellModalProps {
  isOpen: boolean;
  onClose: () => void;
  spell: KnownSpell | null;
  character: Character;
  onUpdate: (character: Character) => void;
}

export const EditSpellModal: React.FC<EditSpellModalProps> = ({
  isOpen,
  onClose,
  spell,
  character,
  onUpdate
}) => {
  const [name, setName] = useState('');
  const [tier, setTier] = useState<SpellTier>(0);
  const [type, setType] = useState<SpellType>('basic');
  const [apCost, setApCost] = useState('2');
  const [attributes, setAttributes] = useState('WT');
  const [limitCost, setLimitCost] = useState('0');
  const [traits, setTraits] = useState('');
  const [effect, setEffect] = useState('');
  const [distance, setDistance] = useState('3m');
  const [duration, setDuration] = useState('Instant');
  const [damage, setDamage] = useState('');

  // Pre-populate form when spell changes
  useEffect(() => {
    if (!spell) return;

    const spellData = getSpellData(spell);
    if (!spellData) return;

    setName(spell.name);
    setTier(spellData.tier);
    setType(spellData.type);
    setApCost(spellData.apCost);
    setAttributes(spellData.attributes);
    setLimitCost(spellData.limitCost.toString());
    setTraits(spellData.traits.join(', '));
    setEffect(spellData.effect);
    setDistance(spellData.distance);
    setDuration(spellData.duration);
    setDamage(spellData.damage || '');
  }, [spell]);

  const handleSave = () => {
    if (!spell) return;

    // Build updates object
    const updates: Partial<KnownSpell> = {
      name,
      tier,
      type,
      isCustom: true,
      dataRef: undefined,
      customSpellData: {
        tier,
        type,
        apCost,
        attributes,
        limitCost: parseInt(limitCost) || 0,
        traits: traits.split(',').map(t => t.trim()).filter(t => t),
        effect,
        distance,
        duration,
        damage: damage || undefined
      }
    };

    const updatedCharacter = updateSpellInKnown(character, spell.id, updates);
    onUpdate(updatedCharacter);
    onClose();
  };

  if (!isOpen || !spell) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Edit Spell</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Conversion Warning */}
          {!spell.isCustom && (
            <div className="bg-yellow-900 border border-yellow-700 rounded p-3">
              <p className="text-yellow-200 text-sm font-medium">
                ⚠️ Editing will convert this database spell to a custom spell
              </p>
            </div>
          )}

          {/* Spell Name */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Spell Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
            />
          </div>

          {/* Tier and Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tier (0-5)</label>
              <select
                value={tier}
                onChange={(e) => setTier(parseInt(e.target.value) as SpellTier)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
              >
                {[0, 1, 2, 3, 4, 5].map(t => (
                  <option key={t} value={t}>Tier {t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as SpellType)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
              >
                <option value="basic">Basic</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* AP Cost, Attributes, Limit */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">AP Cost</label>
              <input
                type="text"
                value={apCost}
                onChange={(e) => setApCost(e.target.value)}
                placeholder="2, R, 1m"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Attributes</label>
              <input
                type="text"
                value={attributes}
                onChange={(e) => setAttributes(e.target.value)}
                placeholder="AG/WT"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Limit Cost</label>
              <input
                type="number"
                value={limitCost}
                onChange={(e) => setLimitCost(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          {/* Distance and Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Distance</label>
              <input
                type="text"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="3m, Touch, 10m"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Instant, 1 minute"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          {/* Traits */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Traits (comma-separated)</label>
            <input
              type="text"
              value={traits}
              onChange={(e) => setTraits(e.target.value)}
              placeholder="Spell, Offensive, Strike"
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
            />
          </div>

          {/* Damage */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Damage (optional)</label>
            <input
              type="text"
              value={damage}
              onChange={(e) => setDamage(e.target.value)}
              placeholder="Spellcraft * 4d"
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
            />
          </div>

          {/* Effect */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Effect Description</label>
            <textarea
              value={effect}
              onChange={(e) => setEffect(e.target.value)}
              placeholder="Describe what the spell does..."
              rows={3}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
            />
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
            onClick={handleSave}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded font-semibold"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
