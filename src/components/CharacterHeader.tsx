import React, { useState } from 'react';
import { Swords, BookOpen, Menu } from 'lucide-react';
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
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
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
              <h2 className="text-2xl font-bold text-white">
                {character.name}
              </h2>
            </div>
            <div
              className="flex items-center gap-4 bg-slate-800 hover:bg-slate-700 rounded-lg px-4 py-2 cursor-pointer transition-colors border border-slate-600"
              onClick={(e) => {
                e.stopPropagation();
                setShowXPModal(true);
              }}
            >
              <div className="flex items-center gap-2">
                <Swords size={16} className="text-red-400" />
                <div className="flex flex-col items-center">
                  <span className="text-xs font-semibold text-white">Combat</span>
                  <span className="text-lg font-bold text-white">{character.combatXP}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-blue-400" />
                <div className="flex flex-col items-center">
                  <span className="text-xs font-semibold text-white">Skill</span>
                  <span className="text-lg font-bold text-white">{character.socialXP}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="overflow-hidden transition-all duration-250 bg-slate-950"
          style={{ maxHeight: isExpanded ? '200px' : '0px' }}
        >
          <div className="grid grid-cols-4 gap-2 p-3">
            {Object.entries(character.stats).map(([stat, value]) => {
              const fullNames: Record<string, string> = {
                MG: 'Might',
                EN: 'Endurance',
                AG: 'Agility',
                DX: 'Dexterity',
                WT: 'Wit',
                WI: 'Will',
                PR: 'Perception',
                CH: 'Charisma'
              };

              return (
                <div key={stat} className="bg-slate-800 rounded px-2 py-1 flex justify-between items-center">
                  <span className="text-xs font-semibold text-white">
                    <span className="hidden sm:inline">{fullNames[stat] || stat}</span>
                    <span className="sm:hidden">{stat}</span>
                  </span>
                  <span className="text-base font-bold text-white">{value}</span>
                </div>
              );
            })}
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
