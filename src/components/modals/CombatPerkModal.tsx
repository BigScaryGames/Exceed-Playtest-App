import React, { useState } from 'react';
import { Character, WeaponDomain } from '@/types/character';
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

// Domain name mapping
const DOMAIN_NAMES = {
  '1H': 'One-Handed',
  '2H': 'Two-Handed',
  'SaS': 'Staves & Spears',
  'Sh': 'Shield',
  'Ar': 'Archery',
  'Spell': 'Spellcraft'
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
    domain: '' as WeaponDomain | '',
    attribute: '',
    description: ''
  });

  // Calculate current domain XP for the selected domain
  const currentDomainXP = newCombatPerk.domain
    ? character.progressionLog
        .filter(entry => entry.type === 'combatPerk' && entry.domain === newCombatPerk.domain)
        .reduce((sum, entry) => sum + (entry.cost || 0), 0)
    : 0;

  const handleAddCombatPerk = () => {
    const cost = parseInt(newCombatPerk.cost);
    if (newCombatPerk.name.trim() && cost && newCombatPerk.domain && newCombatPerk.attribute && character.combatXP >= cost) {
      const perkData = {
        name: newCombatPerk.name.trim(),
        cost: cost,
        domain: newCombatPerk.domain as WeaponDomain,
        attribute: newCombatPerk.attribute,
        description: newCombatPerk.description.trim()
      };

      // Calculate new domain level based on cumulative XP
      const newDomainXP = currentDomainXP + cost;

      // Domain thresholds differ between Spell and weapon domains
      let newLevel = 0;
      if (newCombatPerk.domain === 'Spell') {
        // Spell domain thresholds: 10/30/60/100/150
        if (newDomainXP >= 150) newLevel = 5;
        else if (newDomainXP >= 100) newLevel = 4;
        else if (newDomainXP >= 60) newLevel = 3;
        else if (newDomainXP >= 30) newLevel = 2;
        else if (newDomainXP >= 10) newLevel = 1;
      } else {
        // Weapon domain thresholds: 5/15/30/50/75
        if (newDomainXP >= 75) newLevel = 5;
        else if (newDomainXP >= 50) newLevel = 4;
        else if (newDomainXP >= 30) newLevel = 3;
        else if (newDomainXP >= 15) newLevel = 2;
        else if (newDomainXP >= 5) newLevel = 1;
      }

      const newDomains = { ...character.weaponDomains };
      newDomains[newCombatPerk.domain] = newLevel;

      onUpdate({
        ...character,
        combatPerks: [...character.combatPerks, perkData],
        weaponDomains: newDomains,
        combatXP: character.combatXP - cost,
        progressionLog: [...character.progressionLog, {
          type: 'combatPerk',
          name: perkData.name,
          domain: perkData.domain,
          attribute: perkData.attribute,
          cost: perkData.cost
        }]
      });
      setNewCombatPerk({ name: '', cost: '', domain: '', attribute: '', description: '' });
      onClose();
    }
  };

  const handleClose = () => {
    setNewCombatPerk({ name: '', cost: '', domain: '', attribute: '', description: '' });
    onClose();
  };

  const isFormValid = newCombatPerk.name.trim() &&
                      newCombatPerk.cost &&
                      newCombatPerk.domain &&
                      newCombatPerk.attribute &&
                      character.combatXP >= parseInt(newCombatPerk.cost || '0');

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Combat Perk">
      <div className="text-sm text-slate-400 font-normal mb-4 text-center">
        Available Combat XP: {character.combatXP}
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
          placeholder="Enter XP cost (multiples of 5)"
          className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
        />
        {newCombatPerk.domain && (
          <div className="text-xs text-slate-400 mt-1">
            Next threshold: {
              newCombatPerk.domain === 'Spell' ? (
                currentDomainXP < 10 ? `10 XP (${10 - currentDomainXP} more)` :
                currentDomainXP < 30 ? `30 XP (${30 - currentDomainXP} more)` :
                currentDomainXP < 60 ? `60 XP (${60 - currentDomainXP} more)` :
                currentDomainXP < 100 ? `100 XP (${100 - currentDomainXP} more)` :
                currentDomainXP < 150 ? `150 XP (${150 - currentDomainXP} more)` :
                'Max level (5)'
              ) : (
                currentDomainXP < 5 ? `5 XP (${5 - currentDomainXP} more)` :
                currentDomainXP < 15 ? `15 XP (${15 - currentDomainXP} more)` :
                currentDomainXP < 30 ? `30 XP (${30 - currentDomainXP} more)` :
                currentDomainXP < 50 ? `50 XP (${50 - currentDomainXP} more)` :
                currentDomainXP < 75 ? `75 XP (${75 - currentDomainXP} more)` :
                'Max level (5)'
              )
            }
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-white mb-2">
          Domain {newCombatPerk.domain && <span className="text-blue-400">({DOMAIN_NAMES[newCombatPerk.domain as keyof typeof DOMAIN_NAMES]})</span>}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(DOMAIN_NAMES).map(([abbr]) => (
            <button
              key={abbr}
              onClick={() => setNewCombatPerk({...newCombatPerk, domain: abbr as WeaponDomain})}
              className={`py-2 rounded font-semibold transition-colors ${
                newCombatPerk.domain === abbr
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
        {!newCombatPerk.name.trim() || !newCombatPerk.cost || !newCombatPerk.domain || !newCombatPerk.attribute
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
