import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { Character, Spell } from '@/types/character';
import { getSpellXPCost, calculateCastingDC, checkSpellPrerequisites, getMissingPrerequisites, getLimitCost, canLearnSpell } from '@/utils/spells';

interface SpellCardProps {
  spell: Spell;
  character: Character;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onLearn: (attribute?: string) => void;
  showLearnButton?: boolean;
  availableXP?: number;
}

const TIER_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  0: { bg: 'bg-gray-900/50', text: 'text-gray-300', border: 'border-gray-800' },
  1: { bg: 'bg-green-900/50', text: 'text-green-300', border: 'border-green-800' },
  2: { bg: 'bg-blue-900/50', text: 'text-blue-300', border: 'border-blue-800' },
  3: { bg: 'bg-purple-900/50', text: 'text-purple-300', border: 'border-purple-800' },
  4: { bg: 'bg-orange-900/50', text: 'text-orange-300', border: 'border-orange-800' },
  5: { bg: 'bg-red-900/50', text: 'text-red-300', border: 'border-red-800' },
};

export const SpellCard: React.FC<SpellCardProps> = ({
  spell,
  character,
  isExpanded,
  onToggleExpand,
  onLearn,
  showLearnButton = true,
  availableXP = 0,
}) => {
  const [pendingAttribute, setPendingAttribute] = useState('');

  const xpCost = getSpellXPCost(spell.tier);
  const canAfford = availableXP >= xpCost;
  const meetsTierReq = canLearnSpell(character, spell.tier);
  const meetsPrereqs = checkSpellPrerequisites(character, spell);
  const missingPrereqs = useMemo(() => {
    const missing: string[] = [];

    // Add tier requirement if not met
    if (!meetsTierReq) {
      if (spell.tier === 0) {
        missing.push('Mage perk');
      } else {
        missing.push(`Spellcraft Tier ${spell.tier}+`);
      }
    }

    // Add other prerequisites
    if (!meetsPrereqs) {
      missing.push(...getMissingPrerequisites(character, spell));
    }

    return missing;
  }, [meetsTierReq, meetsPrereqs, character, spell]);

  const canLearn = meetsTierReq && meetsPrereqs;
  const castingDC = calculateCastingDC(spell.tier);
  const tierColor = TIER_COLORS[spell.tier] || TIER_COLORS[0];

  // Parse attributes
  const attributes = spell.attributes?.split('/').map(a => a.trim()) || [];

  return (
    <div
      className={`bg-slate-800 rounded-lg border overflow-hidden transition-colors ${
        canLearn ? 'border-slate-700' : 'border-red-700'
      }`}
    >
      {/* Header - Always Visible */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Name and Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-lg font-bold text-white truncate">{spell.name}</h4>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${tierColor.bg} ${tierColor.text} ${tierColor.border}`}>
                Tier {spell.tier}
              </span>
              <span className="text-sm font-semibold text-green-400">{xpCost} XP</span>
            </div>

            {/* Quick Stats */}
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
              <span>AP: {spell.apCost}</span>
              {spell.distance && <span>•</span>}
              {spell.distance && <span>{spell.distance}</span>}
              {spell.duration && <span>•</span>}
              {spell.duration && <span>{spell.duration}</span>}
              <span>•</span>
              <span>DC: {castingDC}</span>
              {getLimitCost(spell) > 0 && (
                <>
                  <span>•</span>
                  <span className="text-yellow-400">Limit: {getLimitCost(spell)}</span>
                </>
              )}
            </div>

            {/* Effect Preview */}
            <p className="text-slate-300 text-sm mt-2 line-clamp-2">{spell.effect}</p>

            {/* Traits/Tags */}
            {spell.traits && spell.traits.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {spell.traits.slice(0, 5).map(trait => (
                  <span key={trait} className="px-1.5 py-0.5 bg-slate-700 text-slate-400 text-xs rounded">
                    #{trait}
                  </span>
                ))}
              </div>
            )}

            {/* Locked Warning - Always show for locked spells */}
            {!canLearn && missingPrereqs.length > 0 && (
              <div className="mt-2 text-xs text-red-400 font-semibold">
                🔒 Missing: {missingPrereqs.join(', ')}
              </div>
            )}
          </div>

          {/* Expand Button */}
          <button
            onClick={onToggleExpand}
            className="text-slate-400 hover:text-white p-1 flex-shrink-0"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {/* Learn Button */}
        {showLearnButton && onLearn && (
          <div className="mt-2 flex gap-2">
            {attributes.length > 1 ? (
              <>
                <select
                  className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-sm"
                  value={pendingAttribute}
                  onChange={(e) => {
                    setPendingAttribute(e.target.value);
                  }}
                >
                  <option value="">Select attribute...</option>
                  {attributes.map(attr => (
                    <option key={attr} value={attr}>{attr}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (pendingAttribute && onLearn) {
                      onLearn(pendingAttribute);
                      setPendingAttribute('');
                    }
                  }}
                  disabled={!pendingAttribute || !canAfford || !canLearn}
                  className={`px-4 py-1.5 rounded text-sm font-semibold transition-colors ${
                    canAfford && canLearn
                      ? 'bg-green-700 hover:bg-green-600 text-white'
                      : 'bg-red-700 text-white cursor-not-allowed opacity-60'
                  } disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed`}
                >
                  <Zap size={16} className="inline mr-1" />
                  Learn
                </button>
              </>
            ) : (
              <button
                onClick={() => attributes.length > 0 ? onLearn(attributes[0]) : onLearn()}
                disabled={!canAfford || !canLearn}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-sm font-semibold transition-colors ${
                  canAfford && canLearn
                    ? 'bg-green-700 hover:bg-green-600 text-white'
                    : 'bg-red-700 text-white cursor-not-allowed opacity-60'
                }`}
              >
                <Zap size={16} />
                Learn Spell ({xpCost} XP)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-slate-700 pt-3 space-y-3">
          {/* Attributes */}
          {attributes.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-slate-400 mb-1">Attributes</h5>
              <div className="flex flex-wrap gap-1">
                {attributes.map(attr => (
                  <span key={attr} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
                    {attr}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Full Effect */}
          <div>
            <h5 className="text-sm font-semibold text-slate-400 mb-1">Effect</h5>
            <p className="text-slate-300 text-sm whitespace-pre-wrap">{spell.effect}</p>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400">AP Cost:</span> {spell.apCost}
            </div>
            {spell.distance && (
              <div>
                <span className="text-slate-400">Distance:</span> {spell.distance}
              </div>
            )}
            {spell.duration && (
              <div>
                <span className="text-slate-400">Duration:</span> {spell.duration}
              </div>
            )}
            <div>
              <span className="text-slate-400">Casting DC:</span> {castingDC}
            </div>
            {spell.damage && (
              <div className="col-span-2">
                <span className="text-slate-400">Damage:</span> {spell.damage}
              </div>
            )}
            {getLimitCost(spell) > 0 && (
              <div className="col-span-2">
                <span className="text-slate-400">Limit Cost:</span> {getLimitCost(spell)}
              </div>
            )}
          </div>

          {/* Prerequisites */}
          {(spell.prerequisites && spell.prerequisites.requirements.length > 0) || !meetsTierReq ? (
            <div>
              <h5 className="text-sm font-semibold text-slate-400 mb-1">Prerequisites</h5>
              {!canLearn ? (
                <div className="text-sm text-red-400 space-y-1">
                  <div>Missing prerequisites:</div>
                  {missingPrereqs.map(prereq => (
                    <div key={prereq} className="ml-2">• {prereq}</div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-green-400">
                  ✓ All prerequisites met
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
