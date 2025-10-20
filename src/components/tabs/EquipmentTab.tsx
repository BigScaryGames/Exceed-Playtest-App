import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Character, InventoryItem, ItemState } from '@/types/character';
import { calculateEncumbrance, calculateSpeedFromEquipped } from '@/utils/calculations';
import {
  getEquippedWeapons,
  getEquippedArmor,
  getEquippedShield,
  getWeaponData,
  getArmorData,
  getShieldData,
  updateItemState,
  removeItemFromInventory,
  canEquipItem
} from '@/utils/inventory';
import { AddItemModal } from '@/components/modals/AddItemModal';
import { EditItemModal } from '@/components/modals/EditItemModal';

interface EquipmentTabProps {
  character: Character;
  onUpdate: (character: Character) => void;
}

export const EquipmentTab: React.FC<EquipmentTabProps> = ({ character, onUpdate }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Get equipped items
  const equippedWeapons = getEquippedWeapons(character);
  const equippedArmor = getEquippedArmor(character);
  const equippedShield = getEquippedShield(character);

  // Calculate encumbrance
  const encumbranceData = calculateEncumbrance(character);
  const { totalWeight, capacity, level } = encumbranceData;

  const handleStateChange = (itemId: string, newState: ItemState) => {
    const item = character.inventory?.find(i => i.id === itemId);
    if (!item) return;

    // Check if item can be equipped
    if (newState === 'equipped') {
      const { canEquip, reason } = canEquipItem(character, item);
      if (!canEquip) {
        alert(reason);
        return;
      }
    }

    const updatedCharacter = updateItemState(character, itemId, newState);
    onUpdate(updatedCharacter);
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      const updatedCharacter = removeItemFromInventory(character, itemId);
      onUpdate(updatedCharacter);
    }
  };

  const getStateBadgeColor = (state: ItemState): string => {
    switch (state) {
      case 'equipped':
        return 'bg-green-700 text-white';
      case 'stowed':
        return 'bg-blue-700 text-white';
      case 'packed':
        return 'bg-slate-600 text-slate-300';
      default:
        return 'bg-slate-600 text-slate-300';
    }
  };

  const getStateBadgeLabel = (state: ItemState): string => {
    switch (state) {
      case 'equipped':
        return 'E';
      case 'stowed':
        return 'S';
      case 'packed':
        return 'P';
      default:
        return '?';
    }
  };

  const renderItemDetails = (item: InventoryItem): string => {
    if (item.type === 'weapon') {
      const weaponData = getWeaponData(item);
      if (weaponData) {
        return `${weaponData.domain || '?'} | ${weaponData.damage} | AP ${weaponData.ap}`;
      }
    } else if (item.type === 'armor') {
      const armorData = getArmorData(item);
      if (armorData) {
        return `+${armorData.bonus} Armor | Might ${armorData.mightReq}`;
      }
    } else if (item.type === 'shield') {
      const shieldData = getShieldData(item);
      if (shieldData) {
        return `+${shieldData.defenseBonus} Def | Neg ${shieldData.negation}`;
      }
    }
    return '';
  };

  // Initialize inventory if it doesn't exist
  if (!character.inventory) {
    character.inventory = [];
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">Equipment & Inventory</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 rounded px-4 py-2 text-white font-semibold"
        >
          <Plus size={20} />
          Add Item
        </button>
      </div>

      {/* Equipped Gear Summary */}
      <div className="bg-slate-800 rounded-lg p-4 mb-4">
        <h4 className="text-lg font-semibold text-white mb-3">Equipped Gear</h4>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column: Weapons */}
          <div>
            <div className="text-sm text-slate-400 mb-1">Weapons</div>
            {equippedWeapons.length === 0 ? (
              <div className="text-slate-500 text-sm">No weapons equipped</div>
            ) : (
              <div className="space-y-1">
                {equippedWeapons.map((item) => {
                  const weaponData = getWeaponData(item);
                  return (
                    <div key={item.id} className="text-sm text-white">
                      {item.name} - {weaponData?.domain} | {weaponData?.damage} | AP {weaponData?.ap}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Armor & Shield */}
          <div className="space-y-3">
            {/* Armor */}
            <div>
              <div className="text-sm text-slate-400 mb-1">Armor</div>
              {!equippedArmor ? (
                <div className="text-slate-500 text-sm">No armor equipped</div>
              ) : (
                <div className="text-sm text-white">
                  {equippedArmor.name} - +{getArmorData(equippedArmor)?.bonus} Armor
                </div>
              )}
            </div>

            {/* Shield */}
            <div>
              <div className="text-sm text-slate-400 mb-1">Shield</div>
              {!equippedShield ? (
                <div className="text-slate-500 text-sm">No shield equipped</div>
              ) : (
                <div className="text-sm text-white">
                  {equippedShield.name} - +{getShieldData(equippedShield)?.defenseBonus} Defense
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Encumbrance & Speed Section */}
      <div className="bg-slate-800 rounded-lg p-4 mb-4">
        <h4 className="text-lg font-semibold text-white mb-3">Encumbrance & Speed</h4>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="bg-slate-700 rounded p-2">
            <div className="text-slate-400 text-xs">Total Weight</div>
            <div className="text-white font-bold">{totalWeight.toFixed(1)} kg</div>
          </div>
          <div className="bg-slate-700 rounded p-2">
            <div className="text-slate-400 text-xs">Capacity</div>
            <div className="text-white font-bold">{capacity} kg</div>
          </div>
          <div className="bg-slate-700 rounded p-2">
            <div className="text-slate-400 text-xs">Level</div>
            <div
              className={`font-bold ${
                level.name === 'None'
                  ? 'text-green-400'
                  : level.name === 'Light'
                  ? 'text-yellow-400'
                  : level.name === 'Encumbered'
                  ? 'text-orange-400'
                  : 'text-red-400'
              }`}
            >
              {level.name}
            </div>
          </div>
        </div>
        {level.name !== 'None' && (
          <div className="text-sm text-slate-300 mb-3">
            Penalties: Speed {level.speedPenalty}, Dodge {level.dodgePenalty}
          </div>
        )}

        {/* Speed Display */}
        <div className="bg-slate-700 rounded p-3 mt-3">
          <div className="text-slate-400 text-xs mb-1">Speed</div>
          <div className="text-white font-bold text-lg">
            {(() => {
              const speed = calculateSpeedFromEquipped(character);
              const hasPenalty = speed.withArmor !== speed.withoutArmor;

              return (
                <>
                  <span className="text-2xl">{speed.withArmor}</span>
                  <span className="text-slate-400 text-base"> / {speed.withoutArmor}</span>
                  {hasPenalty && (
                    <div className="text-slate-400 text-xs mt-1">
                      Current / Max (without armor)
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Inventory List */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-white mb-3">Inventory</h4>

        {character.inventory.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">No items in inventory</p>
            <p className="text-slate-500 text-sm mt-2">Click "Add Item" to get started</p>
          </div>
        ) : (
          <div className="space-y-1">
            {character.inventory.map((item) => (
              <div
                key={item.id}
                className="bg-slate-700 rounded px-3 py-2 flex items-center gap-2 text-sm"
              >
                {/* State Badge */}
                <div
                  className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs flex-shrink-0 ${getStateBadgeColor(
                    item.state
                  )}`}
                >
                  {getStateBadgeLabel(item.state)}
                </div>

                {/* Item Name and Type */}
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-white font-medium truncate">{item.name}</span>
                  {item.isCustom && (
                    <span className="text-xs bg-purple-700 px-1.5 py-0.5 rounded flex-shrink-0">
                      Custom
                    </span>
                  )}
                  <span className="text-slate-400 text-xs capitalize flex-shrink-0">
                    ({item.type})
                  </span>
                </div>

                {/* Item Details */}
                {renderItemDetails(item) && (
                  <div className="text-slate-300 text-xs flex-shrink-0 hidden sm:block">
                    {renderItemDetails(item)}
                  </div>
                )}

                {/* Weight */}
                <div className="text-slate-300 text-xs flex-shrink-0">
                  {item.weight} kg
                  {item.quantity > 1 && (
                    <span className="text-slate-400"> × {item.quantity}</span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleStateChange(item.id, 'equipped')}
                    disabled={item.state === 'equipped'}
                    className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      item.state === 'equipped'
                        ? 'bg-slate-600 text-slate-500 cursor-not-allowed'
                        : 'bg-green-700 hover:bg-green-600 text-white'
                    }`}
                    title="Equip"
                  >
                    E
                  </button>
                  <button
                    onClick={() => handleStateChange(item.id, 'stowed')}
                    disabled={item.state === 'stowed'}
                    className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      item.state === 'stowed'
                        ? 'bg-slate-600 text-slate-500 cursor-not-allowed'
                        : 'bg-blue-700 hover:bg-blue-600 text-white'
                    }`}
                    title="Stow"
                  >
                    S
                  </button>
                  <button
                    onClick={() => handleStateChange(item.id, 'packed')}
                    disabled={item.state === 'packed'}
                    className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      item.state === 'packed'
                        ? 'bg-slate-600 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                    title="Pack"
                  >
                    P
                  </button>
                  <button
                    onClick={() => setEditingItem(item)}
                    className="text-slate-400 hover:text-white p-0.5"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-red-400 hover:text-red-300 p-0.5"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        character={character}
        onUpdate={onUpdate}
      />

      {/* Edit Item Modal */}
      <EditItemModal
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        character={character}
        onUpdate={onUpdate}
      />
    </div>
  );
};
