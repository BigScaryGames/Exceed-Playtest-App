import React, { useState } from 'react';
import { Character } from '@/types/character';
import { Modal } from '@/components/shared';

interface CombatPerkModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onUpdate: (character: Character) => void;
}

// Attribute mapping
const ATTRIBUTE_MAP = {
  'MG': 'Might',
  'EN': 'Endurance',
  'AG': 'Agility',
  'DX': 'Dexterity',
  'WT': 'Wit',
  'WI': 'Will',
  'PR': 'Perception',
  'CH': 'Charisma'
};

export const CombatPerkModal: React.FC<CombatPerkModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdate
}) => {
  const [newCombatPerk, setNewCombatPerk] = useState({
    name: '',
    cost: '',
    attribute: '',
    description: ''
  });

  // Calculate current Martial domain XP
  const currentMartialXP = character.progressionLog
    .filter(entry => entry.type === 'combatPerk')
    .reduce((sum, entry) => sum + (entry.cost || 0), 0);

  const handleAddCombatPerk = () => {
    const cost = parseInt(newCombatPerk.cost);
    if (newCombatPerk.name.trim() && cost && newCombatPerk.attribute && character.combatXP >= cost) {
      const perkData = {
        name: newCombatPerk.name.trim(),
        cost: cost,
        domain: 'Martial' as const,
        attribute: newCombatPerk.attribute,
        description: newCombatPerk.description.trim()
      };

      // Calculate new Martial domain level based on cumulative XP
      const newMartialXP = currentMartialXP + cost;

      // Martial domain thresholds: 10/30/60/100/150
      let newLevel = 0;
      if (newMartialXP >= 150) newLevel = 5;
      else if (newMartialXP >= 100) newLevel = 4;
      else if (newMartialXP >= 60) newLevel = 3;
      else if (newMartialXP >= 30) newLevel = 2;
      else if (newMartialXP >= 10) newLevel = 1;

      const newDomains = {
        'Martial': newLevel,
        'Spell': character.weaponDomains['Spell'] || 0
      };

      onUpdate({
        ...character,
        combatPerks: [...character.combatPerks, perkData],
        weaponDomains: newDomains,
        combatXP: character.combatXP - cost,
        progressionLog: [...character.progressionLog, {
          type: 'combatPerk',
          name: perkData.name,
          domain: 'Martial',
          attribute: perkData.attribute,
          cost: perkData.cost
        }]
      });
      setNewCombatPerk({ name: '', cost: '', attribute: '', description: '' });
      onClose();
    }
  };

  const handleClose = () => {
    setNewCombatPerk({ name: '', cost: '', attribute: '', description: '' });
    onClose();
  };

  const isFormValid = newCombatPerk.name.trim() &&
                      newCombatPerk.cost &&
                      newCombatPerk.attribute &&
                      character.combatXP >= parseInt(newCombatPerk.cost || '0');

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Combat Perk">
      <div className="text-sm text-slate-400 font-normal mb-4 text-center">
        Available Combat XP: {character.combatXP}
      </div>

      <div className="mb-4">
        <div className="text-sm text-slate-300 mb-2">
          <span className="text-slate-400">Martial Domain Level:</span>{' '}
          <span className="text-blue-400 font-bold">{character.weaponDomains['Martial'] || 0}</span>
          {' '}({currentMartialXP} XP)
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-white mb-2">Perk Name</label>
        <input
          type="text"
          value={newCombatPerk.name}
          onChange={(e) => setNewCombatPerk({...newCombatPerk, name: e.target.value})}
          placeholder="Enter perk name"
          className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-white mb-2">Cost (XP)</label>
        <input
          type="number"
          value={newCombatPerk.cost}
          onChange={(e) => setNewCombatPerk({...newCombatPerk, cost: e.target.value})}
          placeholder="Enter XP cost"
          className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
        />
        <div className="text-xs text-slate-400 mt-1">
          Next threshold: {
            currentMartialXP < 10 ? `10 XP (${10 - currentMartialXP} more)` :
            currentMartialXP < 30 ? `30 XP (${30 - currentMartialXP} more)` :
            currentMartialXP < 60 ? `60 XP (${60 - currentMartialXP} more)` :
            currentMartialXP < 100 ? `100 XP (${100 - currentMartialXP} more)` :
            currentMartialXP < 150 ? `150 XP (${150 - currentMartialXP} more)` :
            'Max level (5)'
          }
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-white mb-2">
          Attribute {newCombatPerk.attribute && <span className="text-purple-400">({newCombatPerk.attribute})</span>}
        </label>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(ATTRIBUTE_MAP).map(([abbr, fullName]) => (
            <button
              key={abbr}
              onClick={() => setNewCombatPerk({...newCombatPerk, attribute: fullName})}
              className={`py-2 rounded font-semibold transition-colors ${
                newCombatPerk.attribute === fullName
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              {abbr}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-white mb-2">Description (Optional)</label>
        <textarea
          value={newCombatPerk.description}
          onChange={(e) => setNewCombatPerk({...newCombatPerk, description: e.target.value})}
          placeholder="Enter perk description"
          rows={3}
          className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white resize-none"
        />
      </div>

      <button
        onClick={handleAddCombatPerk}
        disabled={!isFormValid}
        className={`w-full rounded py-2 mb-2 text-white font-semibold ${
          !isFormValid
            ? 'bg-slate-600 cursor-not-allowed opacity-50'
            : 'bg-slate-700 hover:bg-slate-600'
        }`}
      >
        {!newCombatPerk.name.trim() || !newCombatPerk.cost || !newCombatPerk.attribute
          ? 'Add'
          : character.combatXP < parseInt(newCombatPerk.cost || '0')
            ? 'Not Enough XP'
            : 'Add'}
      </button>
      <button
        onClick={handleClose}
        className="w-full bg-slate-600 hover:bg-slate-500 rounded py-2 text-white font-semibold"
      >
        Cancel
      </button>
    </Modal>
  );
};
