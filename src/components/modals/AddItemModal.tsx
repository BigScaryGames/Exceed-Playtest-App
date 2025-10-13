import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  Character,
  InventoryItem,
  ItemType,
  ItemState,
  WeaponDomain,
  CustomWeaponData,
  CustomArmorData,
  CustomShieldData
} from '@/types/character';
import { WEAPONS } from '@/data/weapons';
import { ARMOR_TYPES } from '@/data/armor';
import { SHIELDS } from '@/data/shields';
import { generateItemId, addItemToInventory } from '@/utils/inventory';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onUpdate: (character: Character) => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdate
}) => {
  const [itemType, setItemType] = useState<ItemType>('weapon');
  const [isCustom, setIsCustom] = useState(false);
  const [itemState, setItemState] = useState<ItemState>('stowed');

  // Common fields
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('1');
  const [quantity, setQuantity] = useState('1');
  const [selectedDataRef, setSelectedDataRef] = useState('');

  // Custom weapon fields
  const [weaponDomain, setWeaponDomain] = useState<WeaponDomain>('1H');
  const [finesse, setFinesse] = useState(false);
  const [damage, setDamage] = useState('d6');
  const [ap, setAp] = useState('2');
  const [mightReq, setMightReq] = useState('0');
  const [traits, setTraits] = useState('');

  // Custom armor fields
  const [armorBonus, setArmorBonus] = useState('0');
  const [penalty, setPenalty] = useState('0');
  const [penaltyMet, setPenaltyMet] = useState('0');

  // Custom shield fields
  const [defenseBonus, setDefenseBonus] = useState('0');
  const [negation, setNegation] = useState('0');
  const [armorPenalty, setArmorPenalty] = useState('0');
  const [shieldMightReq, setShieldMightReq] = useState('0');
  const [shieldType, setShieldType] = useState<'Light' | 'Medium' | 'Heavy'>('Light');

  const resetForm = () => {
    setName('');
    setWeight('1');
    setQuantity('1');
    setSelectedDataRef('');
    setIsCustom(false);
    setItemState('stowed');
    // Reset custom fields
    setWeaponDomain('1H');
    setFinesse(false);
    setDamage('d6');
    setAp('2');
    setMightReq('0');
    setTraits('');
    setArmorBonus('0');
    setPenalty('0');
    setPenaltyMet('0');
    setDefenseBonus('0');
    setNegation('0');
    setArmorPenalty('0');
    setShieldMightReq('0');
    setShieldType('Light');
  };

  const handleAdd = () => {
    let newItem: InventoryItem;

    if (isCustom) {
      // Create custom item
      if (itemType === 'weapon') {
        const customWeaponData: CustomWeaponData = {
          domain: weaponDomain,
          finesse,
          damage,
          ap: parseInt(ap) || 0,
          mightReq: parseInt(mightReq) || 0,
          traits: traits.split(',').map(t => t.trim()).filter(t => t)
        };

        newItem = {
          id: generateItemId(),
          name,
          type: 'weapon',
          state: itemState,
          weight: parseFloat(weight) || 0,
          quantity: parseInt(quantity) || 1,
          isCustom: true,
          customWeaponData
        };
      } else if (itemType === 'armor') {
        const customArmorData: CustomArmorData = {
          bonus: parseInt(armorBonus) || 0,
          mightReq: parseInt(mightReq) || 0,
          penalty: parseInt(penalty) || 0,
          penaltyMet: parseInt(penaltyMet) || 0
        };

        newItem = {
          id: generateItemId(),
          name,
          type: 'armor',
          state: itemState,
          weight: parseFloat(weight) || 0,
          quantity: parseInt(quantity) || 1,
          isCustom: true,
          customArmorData
        };
      } else if (itemType === 'shield') {
        const customShieldData: CustomShieldData = {
          defenseBonus: parseInt(defenseBonus) || 0,
          negation: parseInt(negation) || 0,
          armorPenalty: parseInt(armorPenalty) || 0,
          mightReq: parseInt(shieldMightReq) || 0,
          type: shieldType
        };

        newItem = {
          id: generateItemId(),
          name,
          type: 'shield',
          state: itemState,
          weight: parseFloat(weight) || 0,
          quantity: parseInt(quantity) || 1,
          isCustom: true,
          customShieldData
        };
      } else {
        // Generic item
        newItem = {
          id: generateItemId(),
          name,
          type: 'item',
          state: itemState,
          weight: parseFloat(weight) || 0,
          quantity: parseInt(quantity) || 1,
          isCustom: true
        };
      }
    } else {
      // Add from database
      let itemWeight = parseFloat(weight) || 0;
      let itemName = selectedDataRef;

      if (itemType === 'weapon' && WEAPONS[selectedDataRef]) {
        itemWeight = WEAPONS[selectedDataRef].weight;
      } else if (itemType === 'armor' && ARMOR_TYPES[selectedDataRef]) {
        itemWeight = ARMOR_TYPES[selectedDataRef].weight;
      } else if (itemType === 'shield' && SHIELDS[selectedDataRef]) {
        itemWeight = SHIELDS[selectedDataRef].weight;
      }

      newItem = {
        id: generateItemId(),
        name: itemName,
        type: itemType,
        state: itemState,
        weight: itemWeight,
        quantity: parseInt(quantity) || 1,
        isCustom: false,
        dataRef: selectedDataRef
      };
    }

    const updatedCharacter = addItemToInventory(character, newItem);
    onUpdate(updatedCharacter);
    resetForm();
    onClose();
  };

  const isFormValid = (): boolean => {
    if (isCustom) {
      return name.trim() !== '' && weight !== '';
    } else {
      return selectedDataRef !== '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Add Item to Inventory</h3>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Item Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Item Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['weapon', 'armor', 'shield', 'item'] as ItemType[]).map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setItemType(type);
                    setSelectedDataRef('');
                  }}
                  className={`py-2 px-3 rounded font-semibold capitalize ${
                    itemType === type
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Custom vs Database Toggle */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Source
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsCustom(false)}
                className={`py-2 px-3 rounded font-semibold ${
                  !isCustom
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                From Database
              </button>
              <button
                onClick={() => setIsCustom(true)}
                className={`py-2 px-3 rounded font-semibold ${
                  isCustom
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Custom Item
              </button>
            </div>
          </div>

          {/* Item State */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Item State
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['equipped', 'stowed', 'packed'] as ItemState[]).map(state => (
                <button
                  key={state}
                  onClick={() => setItemState(state)}
                  className={`py-2 px-3 rounded font-semibold capitalize ${
                    itemState === state
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {state}
                </button>
              ))}
            </div>
          </div>

          {/* Database Selection */}
          {!isCustom && (
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Select {itemType}
              </label>
              <select
                value={selectedDataRef}
                onChange={(e) => setSelectedDataRef(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              >
                <option value="">-- Select {itemType} --</option>
                {itemType === 'weapon' &&
                  Object.keys(WEAPONS).map(key => (
                    <option key={key} value={key}>
                      {key} - {WEAPONS[key].domain} - {WEAPONS[key].damage}
                    </option>
                  ))}
                {itemType === 'armor' &&
                  Object.keys(ARMOR_TYPES).map(key => (
                    <option key={key} value={key}>
                      {key} - Bonus +{ARMOR_TYPES[key].bonus}
                    </option>
                  ))}
                {itemType === 'shield' &&
                  Object.keys(SHIELDS).map(key => (
                    <option key={key} value={key}>
                      {key} - Def +{SHIELDS[key].defenseBonus}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Custom Item Forms */}
          {isCustom && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Item name"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Custom Weapon Fields */}
              {itemType === 'weapon' && (
                <div className="space-y-3 border-t border-slate-700 pt-3">
                  <h4 className="text-sm font-semibold text-slate-300">Weapon Properties</h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Domain</label>
                      <select
                        value={weaponDomain}
                        onChange={(e) => setWeaponDomain(e.target.value as WeaponDomain)}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                      >
                        <option value="1H">1H - One Handed</option>
                        <option value="2H">2H - Two Handed</option>
                        <option value="SaS">SaS - Staves and Spears</option>
                        <option value="Sh">Sh - Shield</option>
                        <option value="Ar">Ar - Archery</option>
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

              {/* Custom Armor Fields */}
              {itemType === 'armor' && (
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
                        value={mightReq}
                        onChange={(e) => setMightReq(e.target.value)}
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

              {/* Custom Shield Fields */}
              {itemType === 'shield' && (
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
            </>
          )}

          {/* Quantity for database items */}
          {!isCustom && selectedDataRef && (
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Quantity
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-4 flex justify-end gap-3">
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!isFormValid()}
            className={`px-4 py-2 rounded font-semibold ${
              isFormValid()
                ? 'bg-blue-700 hover:bg-blue-600 text-white'
                : 'bg-slate-600 text-slate-400 cursor-not-allowed'
            }`}
          >
            Add Item
          </button>
        </div>
      </div>
    </div>
  );
};
