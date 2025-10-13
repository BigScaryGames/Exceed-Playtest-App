import React, { useState, useEffect } from 'react';
import { ATTRIBUTE_MAP } from '@/utils/constants';
import { Perk } from '@/types/character';

interface PerkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (perk: Omit<Perk, 'cost'> & { cost: number }) => void;
  availableCP: number;
  editingPerk?: Perk | null;
  existingCost?: number;
}

export const PerkModal: React.FC<PerkModalProps> = ({
  isOpen,
  onClose,
  onSave,
  availableCP,
  editingPerk = null,
  existingCost = 0
}) => {
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [attribute, setAttribute] = useState('');
  const [description, setDescription] = useState('');

  const isEditMode = editingPerk !== null;

  useEffect(() => {
    if (isOpen && editingPerk) {
      setName(editingPerk.name);
      setCost(editingPerk.cost.toString());
      setAttribute(editingPerk.attribute);
      setDescription(editingPerk.description || '');
    } else if (isOpen && !editingPerk) {
      setName('');
      setCost('');
      setAttribute('');
      setDescription('');
    }
  }, [isOpen, editingPerk]);

  if (!isOpen) return null;

  const handleClose = () => {
    setName('');
    setCost('');
    setAttribute('');
    setDescription('');
    onClose();
  };

  const handleSave = () => {
    const parsedCost = parseInt(cost);
    const costDifference = isEditMode ? parsedCost - existingCost : parsedCost;

    if (name.trim() && parsedCost && attribute && availableCP >= costDifference) {
      onSave({
        name: name.trim(),
        cost: parsedCost,
        attribute,
        description: description.trim()
      });
      handleClose();
    }
  };

  const parsedCost = parseInt(cost || '0');
  const costDifference = isEditMode ? parsedCost - existingCost : parsedCost;
  const canAfford = availableCP >= costDifference;
  const isValid = name.trim() && parsedCost && attribute;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-slate-800 rounded-lg p-6 min-w-[350px] max-w-[500px] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-white mb-4 text-center">
          {isEditMode ? 'Edit Perk' : 'Add New Perk'}
          <div className="text-sm text-slate-400 font-normal mt-1">
            {isEditMode ? (
              <>
                Current: {existingCost} CP → New: {parsedCost} CP
                <br />
                Available Social XP: {availableCP} CP
              </>
            ) : (
              `Available Social XP: ${availableCP} CP`
            )}
          </div>
        </h3>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-white mb-2">
            Perk Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter perk name"
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-white mb-2">
            Cost (CP)
          </label>
          <input
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="Enter CP cost"
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-white mb-2">
            Attribute {attribute && <span className="text-blue-400">({attribute})</span>}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(ATTRIBUTE_MAP).map(([abbr, full]) => (
              <button
                key={abbr}
                onClick={() => setAttribute(full)}
                className={`py-2 rounded font-semibold transition-colors ${
                  attribute === full
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                {abbr}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-white mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter perk description"
            rows={3}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!isValid || !canAfford}
          className={`w-full rounded py-2 mb-2 text-white font-semibold ${
            !isValid || !canAfford
              ? 'bg-slate-600 cursor-not-allowed opacity-50'
              : isEditMode
              ? 'bg-blue-700 hover:bg-blue-600'
              : 'bg-slate-700 hover:bg-slate-600'
          }`}
        >
          {!isValid
            ? isEditMode
              ? 'Save Changes'
              : 'Add'
            : !canAfford
            ? 'Not Enough XP'
            : isEditMode
            ? 'Save Changes'
            : 'Add'}
        </button>
        <button
          onClick={handleClose}
          className="w-full bg-slate-600 hover:bg-slate-500 rounded py-2 text-white font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
