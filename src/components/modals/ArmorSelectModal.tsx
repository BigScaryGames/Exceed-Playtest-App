import React from 'react';
import { Character } from '@/types/character';
import { ARMOR_TYPES } from '@/data/armor';

interface ArmorSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onSelect: (armorType: string) => void;
}

export const ArmorSelectModal: React.FC<ArmorSelectModalProps> = ({
  isOpen,
  onClose,
  character,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-white p-6 pb-4 text-center flex-shrink-0">
          Select Armor
        </h3>

        <div className="overflow-y-auto px-6 flex-1" style={{ minHeight: 0 }}>
          <div className="space-y-2 pb-4">
            {Object.entries(ARMOR_TYPES).map(([name, data]) => {
              const meetsRequirement = character.stats.MG >= data.mightReq;
              const penalty = meetsRequirement ? data.penaltyMet : data.penalty;

              return (
                <button
                  key={name}
                  onClick={() => onSelect(name)}
                  className={`w-full rounded p-3 text-left transition-colors ${
                    character.armorType === name
                      ? 'bg-blue-700 hover:bg-blue-600'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-white font-medium">{name}</div>
                      <div className="text-sm text-slate-300 mt-1">
                        Armor: +{data.bonus} | Might Req: {data.mightReq} | Penalty: {penalty}
                      </div>
                    </div>
                    <div>
                      {meetsRequirement ? (
                        <span className="text-green-400 text-xs">✓</span>
                      ) : (
                        <span className="text-red-400 text-xs">✗</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 pt-4 border-t border-slate-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-slate-600 hover:bg-slate-500 rounded py-2 text-white font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
