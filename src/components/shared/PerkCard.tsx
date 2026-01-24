import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Character } from '@/types/character';
import type { Perk, Ability, Effect } from '@/types/perks';

interface PerkCardProps {
  perk: Perk;
  character: Character;
  abilities?: Ability[];
  effects?: Effect[];
  isLearned?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onAdd?: (attribute?: string) => void;
  showAddButton?: boolean;
  availableXP?: number;
}

const TYPE_COLORS: Record<string, string> = {
  combat: 'bg-red-900/50 text-red-300 border-red-800',
  magic: 'bg-purple-900/50 text-purple-300 border-purple-800',
  skill: 'bg-blue-900/50 text-blue-300 border-blue-800',
};

const formatCost = (perk: Perk): string => {
  if (perk.cost.variable) {
    return perk.cost.formula || 'Variable';
  }
  return `${perk.cost.xp} XP`;
};

export const PerkCard: React.FC<PerkCardProps> = ({
  perk,
  character: _character, // unused but kept for interface compatibility
  abilities = [],
  effects = [],
  isLearned = false,
  isExpanded = false,
  onToggleExpand,
  onAdd,
  showAddButton = true,
  availableXP = 0,
}) => {
  const [pendingAttribute, setPendingAttribute] = useState('');

  // Check affordability
  const xpCost = perk.cost.variable ? 0 : (perk.cost.xp || 0);
  const canAfford = availableXP >= xpCost;

  // Get granted abilities and effects
  const grantedAbilities = abilities.filter(a => perk.grants.abilities.includes(a.id));
  const grantedEffects = effects.filter(e => perk.grants.effects.includes(e.id));

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header - Always Visible */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Name and Cost */}
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-lg font-bold text-white truncate">{perk.name}</h4>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${TYPE_COLORS[perk.type] || 'bg-slate-700'}`}>
                {perk.type}
              </span>
              <span className="text-sm font-semibold text-green-400">{formatCost(perk)}</span>
            </div>

            {/* Description */}
            <p className="text-slate-300 text-sm mt-1 line-clamp-2">{perk.description}</p>

            {/* Tags */}
            {perk.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {perk.tags.slice(0, 5).map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 bg-slate-700 text-slate-400 text-xs rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Requirements */}
            {perk.requirements.text && perk.requirements.text !== '-' && (
              <div className="mt-2 text-xs text-slate-400">
                Req: {perk.requirements.text}
              </div>
            )}
          </div>

          {/* Expand Button */}
          {(perk.effect || perk.description || grantedAbilities.length > 0 || grantedEffects.length > 0) && (
            <button
              onClick={onToggleExpand}
              className="text-slate-400 hover:text-white p-1 flex-shrink-0"
            >
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          )}
        </div>

        {/* Add Button */}
        {showAddButton && !isLearned && onAdd && (
          <div className="mt-2 flex gap-2">
            {perk.attributes.length > 1 ? (
              <>
                <select
                  className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-sm"
                  value={pendingAttribute}
                  onChange={(e) => {
                    setPendingAttribute(e.target.value);
                  }}
                >
                  <option value="">Select attribute...</option>
                  {perk.attributes.map(attr => (
                    <option key={attr} value={attr}>{attr}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (pendingAttribute && onAdd) {
                      onAdd(pendingAttribute);
                      setPendingAttribute('');
                    }
                  }}
                  disabled={!pendingAttribute}
                  className={`px-4 py-1.5 rounded text-sm font-semibold transition-colors ${
                    canAfford
                      ? 'bg-green-700 hover:bg-green-600 text-white'
                      : 'bg-red-700 text-white cursor-not-allowed opacity-60'
                  } disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed`}
                >
                  Add
                </button>
              </>
            ) : (
              <button
                onClick={() => onAdd(perk.attributes[0])}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-sm font-semibold transition-colors ${
                  canAfford
                    ? 'bg-green-700 hover:bg-green-600 text-white'
                    : 'bg-red-700 text-white cursor-not-allowed opacity-60'
                }`}
              >
                <Plus size={16} />
                Add
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-slate-700 pt-3 space-y-3">
          {/* Effect */}
          {perk.effect && (
            <div>
              <h5 className="text-sm font-semibold text-slate-400 mb-1">Effect</h5>
              <p className="text-white text-sm whitespace-pre-wrap">{perk.effect}</p>
            </div>
          )}

          {/* Description */}
          {perk.description && (
            <div>
              <h5 className="text-sm font-semibold text-slate-400 mb-1">Description</h5>
              <p className="text-slate-300 text-sm whitespace-pre-wrap">{perk.description}</p>
            </div>
          )}

          {/* Attributes */}
          {perk.attributes.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-slate-400 mb-1">Attributes</h5>
              <div className="flex flex-wrap gap-1">
                {perk.attributes.map(attr => (
                  <span key={attr} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
                    {attr}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Granted Abilities */}
          {grantedAbilities.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-slate-400 mb-1">Grants Abilities</h5>
              <div className="space-y-1">
                {grantedAbilities.map(ability => (
                  <div key={ability.id} className="bg-slate-700 rounded px-2 py-1.5">
                    <div className="text-white text-sm font-medium">{ability.name}</div>
                    <div className="text-slate-300 text-xs">{ability.effect}</div>
                    {ability.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ability.tags.map(tag => (
                          <span key={tag} className="text-xs text-blue-400">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Granted Effects */}
          {grantedEffects.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-slate-400 mb-1">Grants Effects</h5>
              <div className="space-y-1">
                {grantedEffects.map(effect => (
                  <div key={effect.id} className="bg-slate-700 rounded px-2 py-1.5">
                    <div className="text-white text-sm font-medium">{effect.name}</div>
                    <div className="text-slate-300 text-xs">{effect.effect}</div>
                    {effect.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {effect.tags.map(tag => (
                          <span key={tag} className="text-xs text-purple-400">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AP Cost */}
          {perk.apCost !== null && (
            <div>
              <span className="text-slate-400 text-sm">AP Cost: </span>
              <span className="text-white text-sm">{perk.apCost}</span>
            </div>
          )}

          {/* Full Requirements Breakdown */}
          {(perk.requirements.tier || perk.requirements.skills?.length || perk.requirements.perks?.length) && (
            <div>
              <h5 className="text-sm font-semibold text-slate-400 mb-1">Requirements</h5>
              <div className="text-xs space-y-1 text-slate-300">
                {perk.requirements.tier && (
                  <div>
                    Tier {perk.requirements.tier} {perk.type === 'magic' ? '(Spellcraft)' : '(Martial)'}
                  </div>
                )}
                {perk.requirements.skills?.map(skillReq => (
                  <div key={skillReq}>{skillReq}</div>
                ))}
                {perk.requirements.perks?.map(perkReq => (
                  <div key={perkReq}>{perkReq}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
