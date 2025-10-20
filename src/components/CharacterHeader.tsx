import React, { useState } from 'react';
import { Plus, ChevronUp, ChevronDown, Menu } from 'lucide-react';
import { Character } from '@/types/character';
import { XPModal } from '@/components/modals/XPModal';

interface CharacterHeaderProps {
  character: Character;
  onUpdateXP: (combatXP: number, socialXP: number) => void;
  onMenuToggle: () => void;
}

export const CharacterHeader: React.FC<CharacterHeaderProps> = ({ character, onUpdateXP, onMenuToggle }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showXPModal, setShowXPModal] = useState(false);

  const handleAddXP = (combatXP: number, socialXP: number) => {
    onUpdateXP(combatXP, socialXP);
    setShowXPModal(false);
  };

  return (
    <>
      <div className="bg-black border-b border-slate-700">
        <div className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuToggle();
                }}
                className="text-slate-400 hover:text-white transition-colors p-1"
                title="Open menu"
              >
                <Menu size={20} />
              </button>
              <h2
                className="text-2xl font-bold text-white cursor-pointer hover:text-blue-400 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {character.name}
              </h2>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <span className="text-xs font-semibold text-white">Combat</span>
                <span className="text-lg font-bold text-white">{character.combatXP}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs font-semibold text-white">Social</span>
                <span className="text-lg font-bold text-white">{character.socialXP}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowXPModal(true);
                }}
                className="bg-slate-700 hover:bg-slate-600 rounded-lg p-1.5"
              >
                <Plus size={16} />
              </button>
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>
        </div>

        <div
          className="overflow-hidden transition-all duration-250 bg-slate-950"
          style={{ maxHeight: isExpanded ? '200px' : '0px' }}
        >
          <div className="grid grid-cols-4 gap-2 p-3">
            {Object.entries(character.stats).map(([stat, value]) => (
              <div key={stat} className="bg-slate-800 rounded px-2 py-1 flex justify-between items-center">
                <span className="text-xs font-semibold text-white">{stat}</span>
                <span className="text-base font-bold text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <XPModal
        isOpen={showXPModal}
        onClose={() => setShowXPModal(false)}
        onAddXP={handleAddXP}
      />
    </>
  );
};
