import React, { useState } from 'react';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Minus } from 'lucide-react';
import { Character, InventoryItem, ItemState } from '@/types/character';
import { calculateEncumbrance, calculateSpeedFromEquipped } from '@/utils/calculations';
import {
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
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<InventoryItem | null>(null);
  const [showMoneyModal, setShowMoneyModal] = useState(false);
  const [moneyAmount, setMoneyAmount] = useState('0');

  // Calculate encumbrance
  const encumbranceData = calculateEncumbrance(character);
  const { totalWeight, capacity, level } = encumbranceData;

  const handleDeleteItem = (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      const updatedCharacter = removeItemFromInventory(character, itemId);
      onUpdate(updatedCharacter);
    }
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    const updatedInventory = character.inventory?.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );

    onUpdate({
      ...character,
      inventory: updatedInventory
    });
  };

  const handleDragStart = (item: InventoryItem) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow drop
  };

  const handleDrop = (targetState: ItemState) => {
    if (!draggedItem) return;

    // Check if can equip
    if (targetState === 'equipped') {
      const { canEquip, reason } = canEquipItem(character, draggedItem);
      if (!canEquip) {
        alert(reason);
        setDraggedItem(null);
        return;
      }
    }

    const updatedCharacter = updateItemState(character, draggedItem.id, targetState);
    onUpdate(updatedCharacter);
    setDraggedItem(null);
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

  // Render individual item card
  const renderItemCard = (item: InventoryItem) => {
    const isExpanded = expandedItemId === item.id;

    return (
      <div
        key={item.id}
        draggable
        onDragStart={() => handleDragStart(item)}
        className="bg-slate-700 rounded overflow-hidden cursor-move hover:bg-slate-650 transition-colors"
      >
        {/* Collapsed View */}
        <div
          className="px-3 py-2 flex items-center gap-2 text-sm"
          onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
        >
          {/* Expand Icon */}
          <div className="flex-shrink-0">
            {isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
          </div>

          {/* Item Name */}
          <div className="flex-1 min-w-0">
            <span className="text-white font-medium truncate">{item.name}</span>
            {item.isCustom && (
              <span className="ml-2 text-xs bg-purple-700 px-1.5 py-0.5 rounded">Custom</span>
            )}
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleQuantityChange(item.id, item.quantity - 1);
              }}
              className="w-5 h-5 flex items-center justify-center bg-slate-600 hover:bg-slate-500 rounded text-white"
              disabled={item.quantity <= 1}
            >
              <Minus size={12} />
            </button>
            <span className="text-white font-medium w-8 text-center">×{item.quantity}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleQuantityChange(item.id, item.quantity + 1);
              }}
              className="w-5 h-5 flex items-center justify-center bg-slate-600 hover:bg-slate-500 rounded text-white"
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Weight */}
          <div className="text-slate-300 text-xs flex-shrink-0">
            {(item.weight * item.quantity).toFixed(1)} kg
          </div>
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <div className="px-3 pb-2 border-t border-slate-600 pt-2">
            {/* Item Details */}
            <div className="text-xs text-slate-300 space-y-1 mb-2">
              <div><span className="text-slate-400">Type:</span> <span className="capitalize">{item.type}</span></div>
              {renderItemDetails(item) && (
                <div><span className="text-slate-400">Stats:</span> {renderItemDetails(item)}</div>
              )}
              <div><span className="text-slate-400">Weight:</span> {item.weight} kg each</div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingItem(item);
                }}
                className="flex-1 flex items-center justify-center gap-1 bg-slate-600 hover:bg-slate-500 text-white py-1.5 rounded text-xs font-semibold"
              >
                <Pencil size={12} />
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteItem(item.id);
                }}
                className="flex-1 flex items-center justify-center gap-1 bg-red-700 hover:bg-red-600 text-white py-1.5 rounded text-xs font-semibold"
              >
                <Trash2 size={12} />
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      {/* Stats Section */}
      <div className="bg-slate-800 rounded-lg p-3 mb-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
          <div className="bg-slate-700 rounded p-2">
            <div className="text-slate-400 text-xs">Speed</div>
            <div className="text-white font-bold">
              {(() => {
                const speed = calculateSpeedFromEquipped(character);
                const hasPenalty = speed.withArmor !== speed.withoutArmor;

                return (
                  <>
                    <span>{speed.withArmor}</span>
                    {hasPenalty && (
                      <span className="text-slate-400 text-sm"> / {speed.withoutArmor}</span>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
        {level.name !== 'None' && (
          <div className="text-sm text-slate-300 mt-2">
            Penalties: Speed {level.speedPenalty}, Dodge {level.dodgePenalty}
          </div>
        )}
      </div>

      {/* Money and Actions Bar */}
      <div className="bg-slate-800 rounded-lg px-3 py-2 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm">Money:</span>
          <span className="text-white font-semibold">{character.money || 0} Silver</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setMoneyAmount('0');
              setShowMoneyModal(true);
            }}
            className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 rounded px-3 py-1.5 text-white text-sm font-semibold"
          >
            Adjust Money
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 bg-blue-700 hover:bg-blue-600 rounded px-3 py-1.5 text-white text-sm font-semibold"
          >
            <Plus size={16} />
            Add Item
          </button>
        </div>
      </div>

      {/* Inventory Sections */}
      {character.inventory.length === 0 ? (
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-center py-12">
            <p className="text-slate-400">No items in inventory</p>
            <p className="text-slate-500 text-sm mt-2">Click "Add Item" to get started</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Equipped Section */}
          <div
            className="bg-green-900/10 rounded-lg overflow-hidden border border-green-900/30"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop('equipped')}
          >
            <div className="bg-green-900/30 border-b border-green-700 px-3 py-1.5">
              <h4 className="text-green-300 font-semibold text-sm text-left">
                Equipped ({character.inventory.filter(i => i.state === 'equipped').length})
              </h4>
            </div>
            <div className="p-2 space-y-1">
              {character.inventory.filter(i => i.state === 'equipped').map(item => renderItemCard(item))}
              {character.inventory.filter(i => i.state === 'equipped').length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">No equipped items</p>
              )}
            </div>
          </div>

          {/* On Self Section (formerly Stowed) */}
          <div
            className="bg-blue-900/10 rounded-lg overflow-hidden border border-blue-900/30"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop('stowed')}
          >
            <div className="bg-blue-900/30 border-b border-blue-700 px-3 py-1.5">
              <div className="flex items-center justify-between">
                <h4 className="text-blue-300 font-semibold text-sm text-left">
                  On Self ({character.inventory.filter(i => i.state === 'stowed').length})
                </h4>
                <div className="flex items-center gap-2">
                  <label className="text-blue-400 text-xs">Weight reduction:</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={character.stowedWeightReduction || 0}
                    onChange={(e) => {
                      onUpdate({
                        ...character,
                        stowedWeightReduction: parseFloat(e.target.value) || 0
                      });
                    }}
                    className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                  />
                  <span className="text-blue-400 text-xs">kg</span>
                </div>
              </div>
            </div>
            <div className="p-2 space-y-1">
              {character.inventory.filter(i => i.state === 'stowed').map(item => renderItemCard(item))}
              {character.inventory.filter(i => i.state === 'stowed').length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">No items on self</p>
              )}
            </div>
          </div>

          {/* Stored Section (formerly Packed) */}
          <div
            className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop('packed')}
          >
            <div className="bg-slate-700 border-b border-slate-600 px-3 py-1.5">
              <h4 className="text-slate-300 font-semibold text-sm text-left">
                Stored ({character.inventory.filter(i => i.state === 'packed').length})
              </h4>
            </div>
            <div className="p-2 space-y-1">
              {character.inventory.filter(i => i.state === 'packed').map(item => renderItemCard(item))}
              {character.inventory.filter(i => i.state === 'packed').length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">No stored items</p>
              )}
            </div>
          </div>
        </div>
      )}

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

      {/* Money Modal */}
      {showMoneyModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            setShowMoneyModal(false);
            setMoneyAmount('0');
          }}
        >
          <div
            className="bg-slate-800 rounded-lg p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4">Adjust Money</h3>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Amount
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={moneyAmount}
                onChange={(e) => setMoneyAmount(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const amount = parseFloat(moneyAmount) || 0;
                  const newMoney = (character.money || 0) + amount;
                  onUpdate({
                    ...character,
                    money: newMoney
                  });
                  setShowMoneyModal(false);
                  setMoneyAmount('0');
                }}
                className="flex-1 bg-green-700 hover:bg-green-600 text-white py-2 rounded font-semibold"
              >
                Add
              </button>
              <button
                onClick={() => {
                  const amount = parseFloat(moneyAmount) || 0;
                  const newMoney = Math.max(0, (character.money || 0) - amount);
                  onUpdate({
                    ...character,
                    money: newMoney
                  });
                  setShowMoneyModal(false);
                  setMoneyAmount('0');
                }}
                className="flex-1 bg-red-700 hover:bg-red-600 text-white py-2 rounded font-semibold"
              >
                Reduce
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
