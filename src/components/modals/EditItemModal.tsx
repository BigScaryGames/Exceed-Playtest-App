import React, { useState, useEffect } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import {
  Character,
  InventoryItem
} from '@/types/character';
import { updateItemInInventory, getWeaponData, getArmorData, getShieldData } from '@/utils/inventory';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  character: Character;
  onUpdate: (character: Character) => void;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  onClose,
  item,
  character,
  onUpdate
}) => {
  // Common fields
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('1');
  const [quantity, setQuantity] = useState(1);

  // Weapon fields - MS5: Weapons use 'Martial' domain or null
  const [weaponDomain, setWeaponDomain] = useState<'Martial' | null>('Martial');
  const [finesse, setFinesse] = useState(false);
  const [damage, setDamage] = useState('d6');
  const [ap, setAp] = useState('2');
  const [mightReq, setMightReq] = useState('0');
  const [traits, setTraits] = useState('');

  // Armor fields
  const [armorBonus, setArmorBonus] = useState('0');
  const [armorMightReq, setArmorMightReq] = useState('0');
  const [penalty, setPenalty] = useState('0');
  const [penaltyMet, setPenaltyMet] = useState('0');

  // Shield fields
  const [defenseBonus, setDefenseBonus] = useState('0');
  const [negation, setNegation] = useState('0');
  const [armorPenalty, setArmorPenalty] = useState('0');
  const [shieldMightReq, setShieldMightReq] = useState('0');
  const [shieldType, setShieldType] = useState<'Light' | 'Medium' | 'Heavy'>('Light');

  // Pre-populate form when item changes
  useEffect(() => {
    if (!item) return;

    setName(item.name);
    setWeight(item.weight.toString());
    setQuantity(item.quantity);

    if (item.type === 'weapon') {
      const weaponData = getWeaponData(item);
      if (weaponData) {
        setWeaponDomain(weaponData.domain);
        setFinesse(weaponData.finesse);
        setDamage(weaponData.damage);
        setAp(weaponData.ap.toString());
        setMightReq((weaponData.mightReq || 0).toString());
        setTraits(weaponData.traits.join(', '));
      }
    } else if (item.type === 'armor') {
      const armorData = getArmorData(item);
      if (armorData) {
        setArmorBonus(armorData.bonus.toString());
        setArmorMightReq(armorData.mightReq.toString());
        setPenalty(armorData.penalty.toString());
        setPenaltyMet(armorData.penaltyMet.toString());
      }
    } else if (item.type === 'shield') {
      const shieldData = getShieldData(item);
      if (shieldData) {
        setDefenseBonus(shieldData.defenseBonus.toString());
        setNegation(shieldData.negation.toString());
        setArmorPenalty(shieldData.armorPenalty.toString());
        setShieldMightReq(shieldData.mightReq.toString());
        setShieldType(shieldData.type);
      }
    }
  }, [item]);

  const handleSave = () => {
    if (!item) return;

    // Build updates object
    const updates: Partial<InventoryItem> = {
      name,
      weight: parseFloat(weight) || 0,
      quantity,
      isCustom: true,
      dataRef: undefined
    };

    // Add type-specific custom data
    if (item.type === 'weapon') {
      updates.customWeaponData = {
        domain: weaponDomain,
        finesse,
        damage,
        ap: parseInt(ap) || 0,
        mightReq: parseInt(mightReq) || 0,
        traits: traits.split(',').map(t => t.trim()).filter(t => t)
      };
    } else if (item.type === 'armor') {
      updates.customArmorData = {
        bonus: parseInt(armorBonus) || 0,
        mightReq: parseInt(armorMightReq) || 0,
        penalty: parseInt(penalty) || 0,
        penaltyMet: parseInt(penaltyMet) || 0
      };
    } else if (item.type === 'shield') {
      updates.customShieldData = {
        defenseBonus: parseInt(defenseBonus) || 0,
        negation: parseInt(negation) || 0,
        armorPenalty: parseInt(armorPenalty) || 0,
        mightReq: parseInt(shieldMightReq) || 0,
        type: shieldType
      };
    }

    const updatedCharacter = updateItemInInventory(character, item.id, updates);
    onUpdate(updatedCharacter);
    onClose();
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Edit Item</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Conversion Warning */}
          {!item.isCustom && (
            <div className="bg-yellow-900 border border-yellow-700 rounded p-3">
              <p className="text-yellow-200 text-sm font-medium">
                ⚠️ Editing will convert this database item to a custom item
              </p>
            </div>
          )}

          {/* Common Fields */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-24 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Quantity
              </label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded px-2 py-1 text-white"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm text-center"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded px-2 py-1 text-white"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Weapon-specific fields */}
          {item.type === 'weapon' && (
            <div className="space-y-3 border-t border-slate-700 pt-3">
              <h4 className="text-sm font-semibold text-slate-300">Weapon Properties</h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Domain</label>
                  <select
                    value={weaponDomain || ''}
                    onChange={(e) => setWeaponDomain(e.target.value === '' ? null : 'Martial')}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  >
                    <option value="Martial">Martial</option>
                    <option value="">None (Improvised)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Damage</label>
                  <input
                    type="text"
                    value={damage}
                    onChange={(e) => setDamage(e.target.value)}
                    placeholder="e.g., d8, d10, 4+Might"
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">AP</label>
                  <input
                    type="number"
                    value={ap}
                    onChange={(e) => setAp(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Might Req</label>
                  <input
                    type="number"
                    value={mightReq}
                    onChange={(e) => setMightReq(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={finesse}
                    onChange={(e) => setFinesse(e.target.checked)}
                    className="mr-2"
                  />
                  Finesse Weapon
                </label>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Traits (comma-separated)
                </label>
                <input
                  type="text"
                  value={traits}
                  onChange={(e) => setTraits(e.target.value)}
                  placeholder="e.g., Light, Quick Drawn, Range 3"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                />
              </div>
            </div>
          )}

          {/* Armor-specific fields */}
          {item.type === 'armor' && (
            <div className="space-y-3 border-t border-slate-700 pt-3">
              <h4 className="text-sm font-semibold text-slate-300">Armor Properties</h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Armor Bonus</label>
                  <input
                    type="number"
                    value={armorBonus}
                    onChange={(e) => setArmorBonus(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Might Req</label>
                  <input
                    type="number"
                    value={armorMightReq}
                    onChange={(e) => setArmorMightReq(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Penalty (Unmet)</label>
                  <input
                    type="number"
                    value={penalty}
                    onChange={(e) => setPenalty(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Penalty (Met)</label>
                  <input
                    type="number"
                    value={penaltyMet}
                    onChange={(e) => setPenaltyMet(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Shield-specific fields */}
          {item.type === 'shield' && (
            <div className="space-y-3 border-t border-slate-700 pt-3">
              <h4 className="text-sm font-semibold text-slate-300">Shield Properties</h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Defense Bonus</label>
                  <input
                    type="number"
                    value={defenseBonus}
                    onChange={(e) => setDefenseBonus(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Negation</label>
                  <input
                    type="number"
                    value={negation}
                    onChange={(e) => setNegation(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Armor Penalty</label>
                  <input
                    type="number"
                    value={armorPenalty}
                    onChange={(e) => setArmorPenalty(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Might Req</label>
                  <input
                    type="number"
                    value={shieldMightReq}
                    onChange={(e) => setShieldMightReq(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Shield Type</label>
                <select
                  value={shieldType}
                  onChange={(e) => setShieldType(e.target.value as 'Light' | 'Medium' | 'Heavy')}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                >
                  <option value="Light">Light</option>
                  <option value="Medium">Medium</option>
                  <option value="Heavy">Heavy</option>
                </select>
              </div>
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
