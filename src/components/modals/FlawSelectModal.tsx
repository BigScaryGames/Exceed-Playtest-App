import React, { useState, useEffect } from 'react';
import { Flaw } from '@/types/character';
import { Modal } from '@/components/shared/Modal';
import { loadFlawDatabase } from '@/data/flaws';
import { ATTRIBUTE_MAP } from '@/utils/constants';

interface FlawSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFlaw: (flaw: Flaw) => void;
  existingFlaws: string[];
}

interface FlawDatabaseEntry {
  id: string;
  name: string;
  xpValue: number;
  attribute?: string;
  description: string;
  tags?: string[];
}

export const FlawSelectModal: React.FC<FlawSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectFlaw,
  existingFlaws,
}) => {
  const [flaws, setFlaws] = useState<FlawDatabaseEntry[]>([]);
  const [selectedFlaw, setSelectedFlaw] = useState<FlawDatabaseEntry | null>(null);
  const [selectedAttribute, setSelectedAttribute] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadFlawDatabase()
        .then((data) => {
          setFlaws(data);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load flaw database:', err);
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  const handleSelect = () => {
    if (!selectedFlaw) return;

    const flaw: Flaw = {
      name: selectedFlaw.name,
      xpValue: selectedFlaw.xpValue,
      attribute: selectedFlaw.attribute ? selectedAttribute : undefined,
      description: selectedFlaw.description,
      id: selectedFlaw.id,
      source: 'database',
      isCustom: false,
      addedAt: Date.now(),
    };

    onSelectFlaw(flaw);
    setSelectedFlaw(null);
    setSelectedAttribute('');
  };

  const availableFlaws = flaws.filter(f => !existingFlaws.includes(f.name));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Flaw"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-slate-400">
            Loading flaws...
          </div>
        ) : availableFlaws.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No available flaws
          </div>
        ) : (
          <>
            {/* Flaw List */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {availableFlaws.map((flaw) => (
                <button
                  key={flaw.id}
                  onClick={() => {
                    setSelectedFlaw(flaw);
                    if (flaw.attribute) {
                      // Default to first attribute if multiple
                      const attrs = flaw.attribute.split('/');
                      setSelectedAttribute(attrs[0].trim());
                    }
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedFlaw?.id === flaw.id
                      ? 'bg-red-900/30 border-red-700'
                      : 'bg-slate-700 border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white">{flaw.name}</span>
                    <span className="text-red-400 text-sm font-bold">{flaw.xpValue} XP</span>
                  </div>
                  {flaw.attribute && (
                    <p className="text-slate-400 text-xs mt-1">
                      Attribute: {flaw.attribute}
                    </p>
                  )}
                </button>
              ))}
            </div>

            {/* Attribute Selection */}
            {selectedFlaw?.attribute && (
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Choose Attribute
                </label>
                <select
                  value={selectedAttribute}
                  onChange={(e) => setSelectedAttribute(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                >
                  {selectedFlaw.attribute.split('/').map((attr) => {
                    const trimmed = attr.trim();
                    const displayName = ATTRIBUTE_MAP[trimmed as keyof typeof ATTRIBUTE_MAP] || trimmed;
                    return (
                      <option key={trimmed} value={trimmed}>
                        {displayName} ({trimmed})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Flaw Description */}
            {selectedFlaw && (
              <div className="bg-slate-700 rounded-lg p-3">
                <p className="text-slate-300 text-sm">{selectedFlaw.description}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-600">
              <button
                onClick={onClose}
                className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSelect}
                disabled={!selectedFlaw}
                className="flex-1 bg-red-700 hover:bg-red-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-2 rounded-lg transition-colors"
              >
                Add Flaw
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
