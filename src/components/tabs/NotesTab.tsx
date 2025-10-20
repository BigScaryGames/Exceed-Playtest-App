import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Character, ProgressionLogEntry } from '@/types/character';
import { ATTRIBUTE_MAP, normalizeAttributeName } from '@/utils/constants';

interface NotesTabProps {
  character: Character;
  onUpdate: (character: Character) => void;
}

export const NotesTab: React.FC<NotesTabProps> = ({ character, onUpdate }) => {
  const [isProgressionExpanded, setIsProgressionExpanded] = useState(false);

  const handleFieldChange = (field: 'bio' | 'notes' | 'reputation', value: string) => {
    onUpdate({ ...character, [field]: value });
  };

  // Calculate CP spent per attribute
  const calculateAttributeCP = (): Record<string, number> => {
    const attributeCP: Record<string, number> = {
      'Might': 0,
      'Endurance': 0,
      'Agility': 0,
      'Dexterity': 0,
      'Wit': 0,
      'Will': 0,
      'Perception': 0,
      'Charisma': 0
    };

    character.progressionLog.forEach((entry: ProgressionLogEntry) => {
      if (entry.attribute && entry.cost) {
        const normalizedAttr = normalizeAttributeName(entry.attribute);
        attributeCP[normalizedAttr] = (attributeCP[normalizedAttr] || 0) + entry.cost;
      }
    });

    return attributeCP;
  };

  const attributeCP = calculateAttributeCP();

  const attributeOrder = [
    { abbr: 'MG', full: ATTRIBUTE_MAP['MG'] },
    { abbr: 'EN', full: ATTRIBUTE_MAP['EN'] },
    { abbr: 'AG', full: ATTRIBUTE_MAP['AG'] },
    { abbr: 'DX', full: ATTRIBUTE_MAP['DX'] },
    { abbr: 'WT', full: ATTRIBUTE_MAP['WT'] },
    { abbr: 'WI', full: ATTRIBUTE_MAP['WI'] },
    { abbr: 'PR', full: ATTRIBUTE_MAP['PR'] },
    { abbr: 'CH', full: ATTRIBUTE_MAP['CH'] }
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Bio Field */}
      <div className="bg-slate-800 rounded-lg p-4">
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          Bio
        </label>
        <textarea
          value={character.bio || ''}
          onChange={(e) => handleFieldChange('bio', e.target.value)}
          placeholder="Character background, personality, appearance..."
          className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
          rows={4}
        />
      </div>

      {/* Notes Field */}
      <div className="bg-slate-800 rounded-lg p-4">
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          Notes
        </label>
        <textarea
          value={character.notes || ''}
          onChange={(e) => handleFieldChange('notes', e.target.value)}
          placeholder="Session notes, goals, reminders..."
          className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
          rows={4}
        />
      </div>

      {/* Reputation Field */}
      <div className="bg-slate-800 rounded-lg p-4">
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          Reputation
        </label>
        <textarea
          value={character.reputation || ''}
          onChange={(e) => handleFieldChange('reputation', e.target.value)}
          placeholder="Factions, relationships, standing..."
          className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
          rows={4}
        />
      </div>

      {/* Progression History - Collapsible */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <button
          onClick={() => setIsProgressionExpanded(!isProgressionExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-750 transition-colors text-left"
        >
          <h3 className="text-lg font-bold text-white">Progression History</h3>
          {isProgressionExpanded ? (
            <ChevronDown size={20} className="text-slate-400" />
          ) : (
            <ChevronRight size={20} className="text-slate-400" />
          )}
        </button>

        {isProgressionExpanded && (
          <div className="p-4 border-t border-slate-700">
            {/* Attribute Points Summary */}
            <h4 className="text-md font-semibold text-white mb-3">Attribute Points</h4>
            <div className="bg-slate-700 rounded-lg p-3 mb-6">
              <div className="grid grid-cols-8 gap-2 mb-2">
                {attributeOrder.map(({ abbr }) => (
                  <div key={abbr} className="text-center">
                    <div className="text-slate-400 text-xs font-semibold">{abbr}</div>
                    <div className="text-white text-lg font-bold">
                      {character.stats[abbr as keyof typeof character.stats]}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-8 gap-2">
                {attributeOrder.map(({ abbr, full }) => (
                  <div key={abbr} className="text-center">
                    <div className="text-slate-500 text-xs">CP</div>
                    <div className="text-green-400 text-sm font-semibold">{attributeCP[full]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progression Log Table */}
            <h4 className="text-md font-semibold text-white mb-3">History</h4>
            {character.progressionLog.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No progression recorded yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left py-2 px-3 text-sm font-semibold text-slate-400">Type</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-slate-400">Name</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-slate-400">Level</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-slate-400">Attribute</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-slate-400">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {character.progressionLog.map((entry: ProgressionLogEntry, index: number) => (
                      <tr key={index} className="border-b border-slate-700">
                        <td className="py-3 px-3 text-sm">
                          <span className="bg-slate-600 px-2 py-1 rounded text-xs uppercase">
                            {entry.type}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-sm text-white">
                          {entry.name}
                          {entry.type === 'spell' && entry.spellType && (
                            <span className="ml-2 text-xs text-purple-400">
                              ({entry.spellType})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-sm text-slate-300">
                          {entry.type === 'spell' ? `T${entry.tier || 0}` : (entry.level || '-')}
                        </td>
                        <td className="py-3 px-3 text-sm text-blue-400">
                          {entry.attribute || '-'}
                        </td>
                        <td className="py-3 px-3 text-sm text-green-400">
                          {entry.type === 'spell'
                            ? (entry.cost ? `${entry.cost} ${entry.xpType === 'social' ? 'SP' : 'CP'}` : '-')
                            : (entry.cost ? `${entry.cost} CP` : '-')
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesTab;
